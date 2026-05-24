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
import { mapApiPreAuthKey } from './mappers';

export async function createApiKey(expirationDays?: number) {
	// create API Key with custom expiration (default: 90 days)
	const days = expirationDays ?? 90;
	const date = new Date();
	date.setDate(date.getDate() + days);
	const data = days > 0 ? { expiration: date.toISOString() } : {}; // no expiration if days <= 0
	const { apiKey } = await apiPost<ApiApiKey>(API_URL_APIKEY, data);
	debug('Created API Key "...' + apiKey.slice(-10) + '" (expires in ' + days + ' days)')
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
	const params = new URLSearchParams({
		user: username,
		key,
	});
	const { node } = await apiPost<ApiNode>(`${API_URL_NODE}/register?${params.toString()}`);
	debug('Created Node "' + node.givenName + '" for user "' + username + '"');
	return node;
}

export async function createPreAuthKey(
	user: User,
	ephemeral: boolean,
	reusable: boolean,
	expiration: Date | string,
	tags: string[] = [],
) {
	const data = {
		user: user.id,
		reusable,
		ephemeral,
		expiration: new Date(expiration).toISOString(),
		aclTags: tags.map((tag) => (tag.startsWith('tag:') ? tag : 'tag:' + tag)),
	};
	const { preAuthKey } = await apiPost<ApiPreAuthKey>(API_URL_PREAUTHKEY, data);
	debug('Created PreAuthKey for user "' + user.name + '"');
	return mapApiPreAuthKey(preAuthKey, user);
}
