import { apiDelete, apiPost } from './base';
import type { User, Node } from '$lib/common/types';
import { debug } from '../debug';
import { API_URL_APIKEY, API_URL_NODE, API_URL_USER } from './url';
import { App } from '$lib/States.svelte';

/**
 * Extract raw prefix from formatted prefix returned by headscale API
 * - New format (12-char): "hskey-api-XXXXXXXXXXXX-***" -> "XXXXXXXXXXXX"
 * - Legacy format (7-char): "XXXXXXX***" -> "XXXXXXX"
 */
function extractRawPrefix(formattedPrefix: string): string {
	// Remove "hskey-api-" prefix and "-***" suffix for new format
	if (formattedPrefix.startsWith('hskey-api-')) {
		return formattedPrefix.replace('hskey-api-', '').replace('-***', '');
	}
	// Remove "***" suffix for legacy format
	return formattedPrefix.replace('***', '');
}

export async function expireApiKey(apiKey: string) {
	if (apiKey.indexOf('.') > -1) {
		apiKey = apiKey.split('.').at(0) || '';
	}
	if (!apiKey) {
		debug('Invalid API Key/Prefix');
		return;
	}
	// Extract raw prefix if it's formatted
	const rawPrefix = extractRawPrefix(apiKey);
	try {
		await apiPost(`${API_URL_APIKEY}/expire`, { prefix: rawPrefix });
		debug('Expired API Key with Prefix ' + apiKey);
	} catch (error) {
		debug(error);
	}
}

export async function deleteUser(user: User): Promise<boolean> {
	try {
		await apiDelete(`${API_URL_USER}/${user.id}`);
		App.users.value = App.users.value.filter((u: User) => u.id != user.id)
		debug('Deleted User "' + user.name + '"');
		return true;
	} catch (error) {
		debug(error);
		return false;
	}
}

export async function deleteNode(node: Node): Promise<boolean> {
	try {
		await apiDelete(`${API_URL_NODE}/${node.id}`);
		App.nodes.value = App.nodes.value.filter((n: Node) => n.id != node.id);
		debug('Deleted Node "' + node.name + '"');
		return true;
	} catch (error) {
		debug(error);
		return false;
	}
}

export async function deleteApiKey(idOrPrefix: string | number): Promise<boolean> {
	try {
		let path: string;
		if (typeof idOrPrefix === 'number') {
			// Delete by ID using query parameter
			path = `${API_URL_APIKEY}?id=${idOrPrefix}`;
		} else {
			// Extract raw prefix from formatted prefix before deleting
			const rawPrefix = extractRawPrefix(idOrPrefix);
			path = `${API_URL_APIKEY}/${rawPrefix}`;
		}
		await apiDelete(path);
		debug('Deleted API Key: ' + idOrPrefix);
		return true;
	} catch (error) {
		debug(error);
		return false;
	}
}