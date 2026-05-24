import { API_URL_APIKEY, API_URL_NODE, API_URL_POLICY, API_URL_PREAUTHKEY, API_URL_USER, apiGet } from '$lib/common/api';
import type {
	ApiApiKeys,
	ApiKey,
	ApiNodes,
	ApiPolicy,
	ApiPreAuthKeys,
	ApiUsers,
	Node,
	PreAuthKey,
	User,
} from '$lib/common/types';
import { debug } from '../debug';
import { mapApiPreAuthKeys } from './mappers';

export async function getPreAuthKeys(
	user_ids?: string[],
	init?: RequestInit,
): Promise<PreAuthKey[]> {
	const { preAuthKeys } = await apiGet<ApiPreAuthKeys>(API_URL_PREAUTHKEY, init);
	const allowedUsers = user_ids !== undefined ? new Set(user_ids.filter((id) => id !== '')) : undefined;
	const grouped = new Map<string, any[]>();

	for (const key of preAuthKeys ?? []) {
		const userId = String(key.user?.id ?? '');
		if (!userId) {
			debug('Skipping PreAuthKey without user information', key);
			continue;
		}
		if (allowedUsers && !allowedUsers.has(userId)) {
			continue;
		}
		const group = grouped.get(userId) ?? [];
		group.push(key);
		grouped.set(userId, group);
	}

	let preAuthKeysAll: PreAuthKey[] = [];
	grouped.forEach((keys, userId) => {
		const user = keys[0]?.user;
		if (!user) {
			return;
		}
		const mappedKeys = mapApiPreAuthKeys(keys, user);
		preAuthKeysAll = preAuthKeysAll.concat(mappedKeys);
		debug(`Mapped ${mappedKeys.length} PreAuthKeys for user ${userId}`);
	});

	debug(`Total PreAuthKeys loaded: ${preAuthKeysAll.length}`);
	return preAuthKeysAll;
}

type GetUserOptions = 
	{id: string, name?: never, email?: never} |
	{id?: never, name: string, email?: never} |
	{id?: never, name?: never, email: string}

export async function getUsers(init?: RequestInit, options?: GetUserOptions): Promise<User[]> {
	let url = API_URL_USER;
	if (options !== undefined){
		if(options.id !== undefined) {
			url += "?id=" + options.id
		} else if (options.name !== undefined) {
			url += "?name=" + options.name
		} else if (options.email !== undefined) {
			url += "?email=" + options.email
		} else {
			throw new Error("Invalid User Parameters")
		}
	}
	const { users } = await apiGet<ApiUsers>(url, init);
	return users;
}

export async function getNodes(): Promise<Node[]> {
	const { nodes } = await apiGet<ApiNodes>(API_URL_NODE);
	return nodes;
}

export async function getNode(nodeId: string | number): Promise<Node> {
	const { node } = await apiGet<{ node: Node }>(`${API_URL_NODE}/${nodeId}`);
	debug('Fetched Node ID:', nodeId);
	return node;
}

export async function getPolicy(): Promise<string> {
	const { policy } = await apiGet<ApiPolicy>(API_URL_POLICY)
	return policy
}

export async function getApiKeys(init?: RequestInit): Promise<ApiKey[]> {
	const { apiKeys } = await apiGet<ApiApiKeys>(API_URL_APIKEY, init);
	return apiKeys;
}

export async function getHealth(): Promise<{ databaseConnectivity: boolean }> {
	const { databaseConnectivity } = await apiGet<{ databaseConnectivity: boolean }>('/api/v1/health');
	debug('Health check - DB connectivity:', databaseConnectivity);
	return { databaseConnectivity };
}
