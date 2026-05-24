import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const rootDir = process.cwd();
const localesDir = path.join(rootDir, 'src', 'lib', 'locales');
const srcDir = path.join(rootDir, 'src');
const sourceLocale = 'en';

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
	const formatted = `${JSON.stringify(data, null, 2)}\n`;
	fs.writeFileSync(filePath, formatted);
}

function isPlainObject(value) {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flattenObject(value, prefix = '', result = {}) {
	for (const [key, nestedValue] of Object.entries(value)) {
		const nextKey = prefix ? `${prefix}.${key}` : key;
		if (isPlainObject(nestedValue)) {
			flattenObject(nestedValue, nextKey, result);
		} else {
			result[nextKey] = nestedValue;
		}
	}

	return result;
}

function cloneValue(value) {
	if (Array.isArray(value)) {
		return value.map(cloneValue);
	}

	if (isPlainObject(value)) {
		return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, cloneValue(nestedValue)]));
	}

	return value;
}

function buildSyncedLocale(sourceShape, targetValue) {
	if (!isPlainObject(sourceShape) || !isPlainObject(targetValue)) {
		return cloneValue(isPlainObject(targetValue) ? targetValue : sourceShape);
	}

	const synced = {};

	for (const [key, sourceNestedValue] of Object.entries(sourceShape)) {
		const targetNestedValue = targetValue[key];
		if (isPlainObject(sourceNestedValue)) {
			synced[key] = buildSyncedLocale(sourceNestedValue, isPlainObject(targetNestedValue) ? targetNestedValue : {});
		} else if (targetNestedValue !== undefined) {
			synced[key] = targetNestedValue;
		} else {
			synced[key] = '';
		}
	}

	return synced;
}

function listLocaleFiles() {
	return fs
		.readdirSync(localesDir)
		.filter((fileName) => fileName.endsWith('.json'))
		.sort();
}

function getLocaleName(fileName) {
	return path.basename(fileName, '.json');
}

function getReferencedTranslationKeys() {
	try {
		const output = execFileSync(
			'rg',
			[
				'-o',
				'--no-filename',
				"(?<=\\$_\\('|\\$_\\(\")(?:[A-Za-z0-9_]+\\.)+[A-Za-z0-9_]+",
				srcDir,
				'-g',
				'!src/lib/locales/*',
				'-P',
			],
			{ cwd: rootDir, encoding: 'utf8' }
		);

		return [...new Set(output.match(/(?:[A-Za-z0-9_]+\.)+[A-Za-z0-9_]+/g) ?? [])].sort();
	} catch (error) {
		if (error.status === 1) {
			return [];
		}

		throw error;
	}
}

function getLocales() {
	const locales = new Map();
	for (const fileName of listLocaleFiles()) {
		const localeName = getLocaleName(fileName);
		locales.set(localeName, {
			fileName,
			filePath: path.join(localesDir, fileName),
			data: readJson(path.join(localesDir, fileName)),
		});
	}

	return locales;
}

function compareKeys(sourceKeys, targetKeys) {
	return {
		missing: sourceKeys.filter((key) => !targetKeys.includes(key)),
		extra: targetKeys.filter((key) => !sourceKeys.includes(key)),
	};
}

function collectCheckProblems(locales) {
	const problems = [];
	const sourceLocaleEntry = locales.get(sourceLocale);
	if (!sourceLocaleEntry) {
		throw new Error(`Missing source locale: ${sourceLocale}.json`);
	}

	const sourceFlattened = flattenObject(sourceLocaleEntry.data);
	const sourceKeys = Object.keys(sourceFlattened).sort();
	const referencedKeys = getReferencedTranslationKeys();
	const missingReferencedKeys = referencedKeys.filter((key) => !(key in sourceFlattened));

	if (missingReferencedKeys.length > 0) {
		problems.push(
			[
				`Missing keys in ${sourceLocale}.json referenced by source files:`,
				...missingReferencedKeys.map((key) => `  - ${key}`),
			].join('\n')
		);
	}

	for (const [localeName, localeEntry] of locales.entries()) {
		if (localeName === sourceLocale) {
			continue;
		}

		const targetFlattened = flattenObject(localeEntry.data);
		const targetKeys = Object.keys(targetFlattened).sort();
		const { missing, extra } = compareKeys(sourceKeys, targetKeys);
		const expectedStructure = buildSyncedLocale(sourceLocaleEntry.data, localeEntry.data);
		const expectedJson = `${JSON.stringify(expectedStructure, null, 2)}\n`;
		const actualJson = fs.readFileSync(localeEntry.filePath, 'utf8');

		if (missing.length > 0 || extra.length > 0) {
			const lines = [`Locale ${localeName}.json is out of sync with ${sourceLocale}.json:`];
			if (missing.length > 0) {
				lines.push(...missing.map((key) => `  - missing: ${key}`));
			}
			if (extra.length > 0) {
				lines.push(...extra.map((key) => `  - extra: ${key}`));
			}
			problems.push(lines.join('\n'));
		}

		if (actualJson !== expectedJson) {
			problems.push(
				`Locale ${localeName}.json key order/structure does not match ${sourceLocale}.json. Run \`npm run i18n:sync\`.`
			);
		}
	}

	return problems;
}

function runCheck() {
	const locales = getLocales();
	const problems = collectCheckProblems(locales);

	if (problems.length > 0) {
		console.error(problems.join('\n\n'));
		process.exitCode = 1;
		return;
	}

	console.log('i18n check passed.');
}

function runSync() {
	const locales = getLocales();
	const sourceLocaleEntry = locales.get(sourceLocale);
	if (!sourceLocaleEntry) {
		throw new Error(`Missing source locale: ${sourceLocale}.json`);
	}

	for (const [localeName, localeEntry] of locales.entries()) {
		if (localeName === sourceLocale) {
			continue;
		}

		const synced = buildSyncedLocale(sourceLocaleEntry.data, localeEntry.data);
		writeJson(localeEntry.filePath, synced);
	}

	console.log(`Synchronized ${locales.size - 1} locale file(s) to match ${sourceLocale}.json.`);
}

const command = process.argv[2] ?? 'check';

if (command === 'check') {
	runCheck();
} else if (command === 'sync') {
	runSync();
} else {
	console.error(`Unknown command: ${command}`);
	console.error('Usage: node scripts/i18n.mjs [check|sync]');
	process.exitCode = 1;
}
