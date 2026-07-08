import { App } from '$lib/States.svelte';

export const version = '0.29.2';

export function debug(...data: unknown[]) {
	// output if console debugging is enabled
	if (App.debug.value) {
		console.log(new Date().toLocaleTimeString('en-US', { hour12: false }), ...data);
	}
}

const SENSITIVE_KEYS = new Set([
	'apiKey',
	'key',
	'nodeKey',
	'machineKey',
	'discoKey',
	'preAuthKey',
]);

const REDACTED_CIRCULAR_VALUE = '[Circular]';

function maskSensitiveValue(value: unknown): unknown {
	if (typeof value !== 'string') {
		return value;
	}

	if (value.length <= 8) {
		return '***';
	}

	return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function redactDebugData<T>(data: T): T {
	const seen = new WeakSet<object>();

	function redact(value: unknown, key = ''): unknown {
		if (SENSITIVE_KEYS.has(key) && typeof value === 'string') {
			return maskSensitiveValue(value);
		}

		if (value instanceof Date) {
			return value.toISOString();
		}

		if (typeof value === 'bigint') {
			return value.toString();
		}

		if (value === null || typeof value !== 'object') {
			return value;
		}

		if (seen.has(value)) {
			return REDACTED_CIRCULAR_VALUE;
		}
		seen.add(value);

		try {
			if (Array.isArray(value)) {
				return value.map((item) => redact(item));
			}

			return Object.fromEntries(
				Object.entries(value).map(([entryKey, entryValue]) => [
					entryKey,
					redact(entryValue, entryKey),
				]),
			);
		} finally {
			seen.delete(value);
		}
	}

	return redact(data) as T;
}

export function debugJson(label: string, data: unknown) {
	if (App.debug.value) {
		console.log(label, JSON.stringify(redactDebugData(data), null, 4));
	}
}
