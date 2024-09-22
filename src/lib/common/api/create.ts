import { apiPost } from './base';
import {
	type ApiUser,
	type ApiPreAuthKey,
	type User,
	type Node,
	type ApiDevice,
	getApiDeviceNode,
	type ApiApiKey,
} from '$lib/common/types';
import { ApiEndpointsStore } from '$lib/Stores';
import { debug } from '../debug';
import { get } from 'svelte/store';

export async function createApiKey() {
	// create 90-day API Key
	const date = new Date();
	date.setDate(date.getDate() + 90);
	const data = { expiration: date.toISOString() };
	const { apiKey } = await apiPost<ApiApiKey>(get(ApiEndpointsStore).ApiKey, data);
	debug('Created API Key "...' + apiKey.slice(-10) + '"')
	return apiKey;
}

export async function createUser(username: string): Promise<User> {
	const data = { name: username };
	const { user } = await apiPost<ApiUser>(get(ApiEndpointsStore).User, data);
	debug('Created user "' + username + '"');
	return user;
}

export async function createNode(key: string, username: string): Promise<Node> {
	if (!key.startsWith('nodekey:') && !key.startsWith('mkey:')) {
		key = 'nodekey:' + key;
	}
	const data = '?user=' + username + '&key=' + key;
	const device = getApiDeviceNode(
		await apiPost<ApiDevice>(get(ApiEndpointsStore).Node + '/register' + data),
	);
	debug('Created Node "' + device.givenName + '" for user "' + username + '"');
	return device;
}

export async function createPreAuthKey(
	user: User,
	ephemeral: boolean,
	reusable: boolean,
	expiration: Date | string,
) {
	const data = {
		user: user.name,
		reusable,
		ephemeral,
		expiration: new Date(expiration).toISOString(),
	};
	const { preAuthKey } = await apiPost<ApiPreAuthKey>(get(ApiEndpointsStore).PreAuthKey, data);
	debug('Created PreAuthKey for user "' + user.name + '"');
	return preAuthKey;
}
