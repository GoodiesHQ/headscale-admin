import { apiPost } from './base';
import {
	type ApiUser,
	type ApiPreAuthKey,
	type User,
	type Node,
	type ApiDevice,
	getApiDeviceNode,
} from '$lib/common/types';
import { API_URL_NODE, API_URL_PREAUTHKEY, API_URL_USER } from './url';
import { debug } from '../debug';

export async function createUser(username: string): Promise<User> {
	const data = { name: username };
	const { user } = await apiPost<ApiUser>(API_URL_USER, data);
	debug('Created user "' + username + '"');
	return user;
}

export async function createNode(key: string, username: string): Promise<Node> {
	if (!key.startsWith('nodekey:')) {
		key = 'nodekey:' + key;
	}
	const data = '?user=' + username + '&key=' + key;
	const device = getApiDeviceNode(await apiPost<ApiDevice>(API_URL_NODE + '/register' + data));
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
	const { preAuthKey } = await apiPost<ApiPreAuthKey>(API_URL_PREAUTHKEY, data);
	debug('Created PreAuthKey for user "' + user.name + '"');
	return preAuthKey;
}
