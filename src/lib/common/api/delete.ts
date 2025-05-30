import { apiDelete, apiPost } from './base';
import type { User, Node } from '$lib/common/types';
import { debug } from '../debug';
import { API_URL_APIKEY, API_URL_NODE, API_URL_USER } from './url';
import { App } from '$lib/States.svelte';

export async function expireApiKey(apiKey: string) {
	if (apiKey.indexOf('.') > -1) {
		apiKey = apiKey.split('.').at(0) || '';
	}
	if (!apiKey) {
		debug('Invalid API Key/Prefix');
		return;
	}
	try {
		await apiPost(`${API_URL_APIKEY}/expire`, { prefix: apiKey });
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