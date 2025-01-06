import { ApiEndpointsStore } from '$lib/Stores';
import { apiGet } from '$lib/common/api';
import { isApiMachines, isApiNodes } from '$lib/common/types';
import type {
	ApiDevices,
	ApiUsers,
	ApiPreAuthKeys,
	ApiRoutes,
	Node,
	User,
	PreAuthKey,
	Route,
	ApiPolicy,
} from '$lib/common/types';
import { get } from 'svelte/store';

export async function getUsers(init?: RequestInit): Promise<User[]> {
	const { users } = await apiGet<ApiUsers>(get(ApiEndpointsStore).User, init);
	return users;
}

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
			apiGet<ApiPreAuthKeys>(get(ApiEndpointsStore).PreAuthKey + '?user=' + username, init),
		);
	});

	promises.forEach(async (p) => {
		const { preAuthKeys } = await p;
		preAuthKeysAll = preAuthKeysAll.concat(preAuthKeys);
	});

	await Promise.all(promises);
	return preAuthKeysAll;
}

export async function getNodes(): Promise<Node[]> {
	const devices = await apiGet<ApiDevices>(get(ApiEndpointsStore).Node);
	if (isApiMachines(devices)) {
		const { machines } = devices;
		return machines;
	}
	if (isApiNodes(devices)) {
		const { nodes } = devices;
		return nodes;
	}
	return [];
}

export async function getRoutes(): Promise<Route[]> {
	const { routes } = await apiGet<ApiRoutes>(get(ApiEndpointsStore).Routes);
	return routes;
}

export async function getPolicy(): Promise<string> {
	const { policy } = await apiGet<ApiPolicy>(get(ApiEndpointsStore).Policy)
	return policy
}
