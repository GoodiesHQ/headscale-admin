import { getApiDeviceNode } from '$lib/common/types';
import type {
	ApiDevice,
	ApiRoute,
	ApiUser,
	ApiPolicy,
	Node,
	PreAuthKey,
	Route,
	User,
} from '$lib/common/types';
import { debug } from '../debug';
import { apiPost, apiPut } from './base';
import type { ACLBuilder } from '../acl.svelte';
import { API_URL_NODE, API_URL_POLICY, API_URL_PREAUTHKEY, API_URL_ROUTES, API_URL_USER } from './url';

export async function renameUser(u: User, nameNew: string): Promise<User> {
	const path = `${API_URL_USER}/${u.name}/rename/${nameNew}`;
	const { user } = await apiPost<ApiUser>(path, undefined);
	debug('Renamed User from "' + u.name + '" to "' + nameNew + '"');
	return user;
}

export async function renameNode(n: Node, nameNew: string): Promise<Node> {
	const path = `${API_URL_NODE}/${n.id}/rename/${nameNew}`;
	const device = await apiPost<ApiDevice>(path, undefined);
	debug('Renamed Node from "' + n.givenName + '" to "' + nameNew + '"');
	return getApiDeviceNode(device);
}

export async function changeNodeOwner(n: Node, newUser: string): Promise<Node> {
	const path = `${API_URL_NODE}/${n.id}/user?user=${newUser}`;
	const device = await apiPost<ApiDevice>(path, undefined);
	debug('Re-assigned Node from "' + n.user.name + '" to "' + newUser + '"');
	return getApiDeviceNode(device);
}

export async function expirePreAuthKey(pak: PreAuthKey) {
	const path = `${API_URL_PREAUTHKEY}/expire`;
	const data = { user: pak.user, key: pak.key };
	await apiPost(path, data);
}

export async function expireNode(n: Node): Promise<Node> {
	const path = `${API_URL_NODE}/${n.id}/expire`;
	const device = await apiPost<ApiDevice>(path, undefined);
	debug('Expired Node "' + n.givenName + '"');
	return getApiDeviceNode(device);
}

export async function setNodeTags(n: Node, tags: string[]): Promise<Node> {
	const path = `${API_URL_NODE}/${n.id}/tags`;
	tags = tags.map((tag) => (tag.startsWith('tag:') ? tag : 'tag:' + tag));
	const device = await apiPost<ApiDevice>(path, { tags });
	debug('Set Tags for Node "' + n.givenName + '"');
	return getApiDeviceNode(device);
}

export async function enableRoute(r: Route): Promise<Route> {
	const path = `${API_URL_ROUTES}/${r.id}/enable`;
	const { route } = await apiPost<ApiRoute>(path);
	debug('Enabled Route "' + r.prefix + '"');
	return route;
}

export async function disableRoute(r: Route): Promise<Route> {
	const path = `${API_URL_ROUTES}/${r.id}/disable`;
	const { route } = await apiPost<ApiRoute>(path);
	debug('Disabled Route "' + r.prefix + '"');
	return route;
}

export async function setPolicy(acl: ACLBuilder) {
	const path = `${API_URL_POLICY}`
	await apiPut<ApiPolicy>(path, {"policy": acl.JSON()})
}
