import { API_URL_NODE, API_URL_POLICY, API_URL_PREAUTHKEY, API_URL_USER, apiGet } from '$lib/common/api';
import type {
	ApiNodes,
	ApiPolicy,
	ApiPreAuthKeys,
	ApiUsers,
	Node,
	PreAuthKey,
	User,
} from '$lib/common/types';
import { debug } from '../debug';

export async function getPreAuthKeys(
	user_ids?: string[],
	init?: RequestInit,
): Promise<PreAuthKey[]> {
	if (user_ids == undefined) {
		user_ids = (await getUsers(init)).map((u) => u.id);
	}
	const promises: Promise<ApiPreAuthKeys>[] = [];
	let preAuthKeysAll: PreAuthKey[] = [];

	user_ids.forEach(async (user_id: string) => {
		if(user_id != ""){
			promises.push(
				apiGet<ApiPreAuthKeys>(API_URL_PREAUTHKEY + '?user=' + user_id, init),
			);
		}
	});

	promises.forEach(async (p) => {
		const { preAuthKeys } = await p;
		preAuthKeysAll = preAuthKeysAll.concat(preAuthKeys);
	});

	await Promise.all(promises);
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

export async function getPolicy(): Promise<string> {
	const { policy } = await apiGet<ApiPolicy>(API_URL_POLICY)
	return policy
}
