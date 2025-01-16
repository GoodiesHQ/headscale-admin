import { API_URL_NODE, API_URL_POLICY, API_URL_PREAUTHKEY, API_URL_ROUTES, API_URL_USER, apiGet } from '$lib/common/api';
import type {
	ApiNodes,
	ApiPolicy,
	ApiPreAuthKeys,
	ApiRoutes,
	ApiUsers,
	Node,
	PreAuthKey,
	Route,
	User,
} from '$lib/common/types';

export async function getPreAuthKeys(
	usernames?: string[],
	init?: RequestInit,
): Promise<PreAuthKey[]> {
	if (usernames == undefined) {
		usernames = (await getUsers(init)).map((u) => u.name);
	}
	const promises: Promise<ApiPreAuthKeys>[] = [];
	let preAuthKeysAll: PreAuthKey[] = [];

	usernames.forEach(async (username: string) => {
		promises.push(
			apiGet<ApiPreAuthKeys>(API_URL_PREAUTHKEY + '?user=' + username, init),
		);
	});

	promises.forEach(async (p) => {
		const { preAuthKeys } = await p;
		preAuthKeysAll = preAuthKeysAll.concat(preAuthKeys);
	});

	await Promise.all(promises);
	return preAuthKeysAll;
}

export async function getUsers(init?: RequestInit): Promise<User[]> {
	const { users } = await apiGet<ApiUsers>(API_URL_USER, init);
	return users;
}

export async function getNodes(): Promise<Node[]> {
	const { nodes } = await apiGet<ApiNodes>(API_URL_NODE);
	return nodes;
}

export async function getRoutes(): Promise<Route[]> {
	const { routes } = await apiGet<ApiRoutes>(API_URL_ROUTES);
	return routes;
}

export async function getPolicy(): Promise<string> {
	const { policy } = await apiGet<ApiPolicy>(API_URL_POLICY)
	return policy
}
