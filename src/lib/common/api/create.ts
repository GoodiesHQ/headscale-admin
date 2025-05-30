import { apiPost } from './base';
import {
	type ApiApiKey,
	type ApiNode,
	type ApiPreAuthKey,
	type ApiUser,
	type Node,
	type User,
} from '$lib/common/types';
import { debug } from '$lib/common/debug';
import { API_URL_APIKEY, API_URL_NODE, API_URL_PREAUTHKEY, API_URL_USER } from './url';

export async function createApiKey() {
	// create 90-day API Key
	const date = new Date();
	date.setDate(date.getDate() + 90);
	const data = { expiration: date.toISOString() };
	const { apiKey } = await apiPost<ApiApiKey>(API_URL_APIKEY, data);
	debug('Created API Key "...' + apiKey.slice(-10) + '"')
	return apiKey;
}

export async function createUser(username: string): Promise<User> {
	if (username.length === 0) {
		throw new Error("Username cannot be empty")
	}
	const data = { name: username };
	const { user } = await apiPost<ApiUser>(API_URL_USER, data);
	debug('Created user "' + username + '"');
	return user;
}

export async function createNode(key: string, username: string): Promise<Node> {
	const data = '?user=' + username + '&key=' + key;
	const { node } = await apiPost<ApiNode>(API_URL_NODE + '/register' + data)
	debug('Created Node "' + node.givenName + '" for user "' + username + '"');
	return node;
}

export async function createPreAuthKey(
	user: User,
	ephemeral: boolean,
	reusable: boolean,
	expiration: Date | string,
) {
	const data = {
		user: user.id,
		reusable,
		ephemeral,
		expiration: new Date(expiration).toISOString(),
	};
	const { preAuthKey } = await apiPost<ApiPreAuthKey>(API_URL_PREAUTHKEY, data);
	debug('Created PreAuthKey for user "' + user.name + '"');
	return preAuthKey;
}
