import type { Node, User, PreAuthKey, ApiKey } from './types';
import { getPolicy } from './api';
import { App } from '$lib/States.svelte';

export type ExportFormat = 'json' | 'csv' | 'yaml';
export type ExportResource = 'users' | 'nodes' | 'preAuthKeys' | 'apiKeys' | 'policy';

export type ExportOptions = {
	format: ExportFormat;
	resources: ExportResource[];
	includeMetadata?: boolean;
};

function downloadFile(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function downloadJSON(data: any, filename: string) {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	downloadFile(blob, filename);
}

export function downloadCSV(data: any[], filename: string) {
	if (data.length === 0) {
		return;
	}

	// Extract all unique keys from all objects
	const keys = Array.from(
		new Set(data.flatMap((item) => Object.keys(item)))
	);

	// CSV header
	const csvHeader = keys.join(',');

	// CSV rows
	const csvRows = data.map((item) =>
		keys
			.map((key) => {
				const value = item[key];
				// Handle null/undefined
				if (value === null || value === undefined) {
					return '';
				}
				// Convert to string
				const strValue = String(value);
				// Escape special characters (quotes, commas, newlines)
				if (
					strValue.includes(',') ||
					strValue.includes('"') ||
					strValue.includes('\n')
				) {
					return `"${strValue.replace(/"/g, '""')}"`;
				}
				return strValue;
			})
			.join(',')
	);

	const csv = [csvHeader, ...csvRows].join('\n');
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	downloadFile(blob, filename);
}

// Flatten nested objects for CSV export
function flattenNode(node: Node) {
	return {
		id: node.id,
		name: node.name,
		givenName: node.givenName,
		user: node.user.name,
		ipAddresses: node.ipAddresses.join('; '),
		online: node.online,
		lastSeen: node.lastSeen || '',
		createdAt: node.createdAt,
		expiry: node.expiry || '',
		registerMethod: node.registerMethod,
		tags: node.tags.join('; '),
		approvedRoutes: node.approvedRoutes.join('; '),
		availableRoutes: node.availableRoutes.join('; '),
		subnetRoutes: node.subnetRoutes.join('; '),
	};
}

function flattenUser(user: User) {
	return {
		id: user.id,
		name: user.name,
		displayName: user.displayName || '',
		email: user.email || '',
		createdAt: user.createdAt,
		provider: user.provider || '',
		providerId: user.providerId || '',
	};
}

function flattenPreAuthKey(key: PreAuthKey) {
	return {
		id: key.id,
		key: key.key,
		user: key.user.name,
		reusable: key.reusable,
		ephemeral: key.ephemeral,
		used: key.used,
		expiration: key.expiration,
		createdAt: key.createdAt,
		aclTags: key.aclTags.join('; '),
	};
}

function flattenApiKey(key: ApiKey) {
	return {
		id: key.id,
		prefix: key.prefix,
		createdAt: key.createdAt,
		lastSeen: key.lastSeen || '',
		expiration: key.expiration || '',
	};
}

export async function exportHeadscaleData(options: ExportOptions) {
	const exportData: any = {};
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

	if (options.includeMetadata) {
		exportData.metadata = {
			exportedAt: new Date().toISOString(),
			apiUrl: App.apiUrl.value,
			format: options.format,
			resources: options.resources,
		};
	}

	// Collect data for each resource
	if (options.resources.includes('users')) {
		exportData.users = App.users.value;
	}

	if (options.resources.includes('nodes')) {
		exportData.nodes = App.nodes.value;
	}

	if (options.resources.includes('preAuthKeys')) {
		exportData.preAuthKeys = App.preAuthKeys.value;
	}

	if (options.resources.includes('apiKeys')) {
		// API Keys need to be fetched separately if not already in App state
		// For now, we'll skip this or require it to be fetched beforehand
		// exportData.apiKeys = await getApiKeys();
	}

	if (options.resources.includes('policy')) {
		try {
			exportData.policy = await getPolicy();
		} catch (error) {
			console.error('Failed to export policy:', error);
		}
	}

	const filename = `headscale-export-${timestamp}`;

	switch (options.format) {
		case 'json':
			downloadJSON(exportData, `${filename}.json`);
			break;

		case 'csv':
			// CSV needs separate files for each resource type
			if (options.resources.includes('users') && exportData.users) {
				downloadCSV(
					exportData.users.map(flattenUser),
					`${filename}-users.csv`
				);
			}
			if (options.resources.includes('nodes') && exportData.nodes) {
				downloadCSV(
					exportData.nodes.map(flattenNode),
					`${filename}-nodes.csv`
				);
			}
			if (options.resources.includes('preAuthKeys') && exportData.preAuthKeys) {
				downloadCSV(
					exportData.preAuthKeys.map(flattenPreAuthKey),
					`${filename}-preAuthKeys.csv`
				);
			}
			if (options.resources.includes('apiKeys') && exportData.apiKeys) {
				downloadCSV(
					exportData.apiKeys.map(flattenApiKey),
					`${filename}-apiKeys.csv`
				);
			}
			// Policy is not suitable for CSV export
			break;

		case 'yaml':
			// YAML export would require additional library
			// For now, we'll just export as JSON
			downloadJSON(exportData, `${filename}.yaml`);
			break;
	}
}

// Quick export functions for individual resources
export function exportUsers(format: 'json' | 'csv' = 'json') {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
	const filename = `headscale-users-${timestamp}`;

	if (format === 'json') {
		downloadJSON(App.users.value, `${filename}.json`);
	} else {
		downloadCSV(App.users.value.map(flattenUser), `${filename}.csv`);
	}
}

export function exportNodes(format: 'json' | 'csv' = 'json') {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
	const filename = `headscale-nodes-${timestamp}`;

	if (format === 'json') {
		downloadJSON(App.nodes.value, `${filename}.json`);
	} else {
		downloadCSV(App.nodes.value.map(flattenNode), `${filename}.csv`);
	}
}

export function exportPreAuthKeys(format: 'json' | 'csv' = 'json') {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
	const filename = `headscale-preAuthKeys-${timestamp}`;

	if (format === 'json') {
		downloadJSON(App.preAuthKeys.value, `${filename}.json`);
	} else {
		downloadCSV(App.preAuthKeys.value.map(flattenPreAuthKey), `${filename}.csv`);
	}
}

export async function exportPolicy() {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
	const filename = `headscale-policy-${timestamp}.json`;

	try {
		const policy = await getPolicy();
		// Policy is already a string (HuJSON format)
		const blob = new Blob([policy], { type: 'application/json' });
		downloadFile(blob, filename);
	} catch (error) {
		console.error('Failed to export policy:', error);
	}
}
