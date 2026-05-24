import type {
	ApiNode,
	ApiPolicy,
	ApiUser,
	Node,
	PreAuthKey,
	User,
} from '$lib/common/types';
import { debug } from '../debug';
import { apiPost, apiPut } from './base';
import type { ACLBuilder } from '../acl.svelte';
import { API_URL_NODE, API_URL_POLICY, API_URL_PREAUTHKEY, API_URL_USER } from './url';
import { createApiKey } from './create';
import { expireApiKey } from './delete';
import { App } from '$lib/States.svelte';
import { setsEqual } from '../funcs';

export async function renameUser(u: User, nameNew: string): Promise<User> {
	const path = `${API_URL_USER}/${u.id}/rename/${nameNew}`;
	const { user } = await apiPost<ApiUser>(path, undefined);
	debug('Renamed User from "' + u.name + '" to "' + nameNew + '"');
	return user;
}

export async function renameNode(n: Node, nameNew: string): Promise<Node> {
	const path = `${API_URL_NODE}/${n.id}/rename/${nameNew}`;
	const { node } = await apiPost<ApiNode>(path, undefined);
	debug('Renamed Node from "' + n.givenName + '" to "' + nameNew + '"');
	return node;
}

export async function changeNodeOwner(n: Node, newUserID: string): Promise<Node> {
	throw new Error(
		`Headscale 0.28.0 does not expose a public node owner reassignment endpoint (${n.id} -> ${newUserID}).`,
	);
}

export async function expirePreAuthKey(pak: PreAuthKey) {
	const path = `${API_URL_PREAUTHKEY}/expire`;
	const data = { id: pak.id };
	await apiPost(path, data);
}

export async function expireNode(n: Node, date?: string): Promise<Node> {
	const params = new URLSearchParams();
	if (date) {
		params.set('expiry', date);
	}
	const suffix = params.size > 0 ? `?${params.toString()}` : '';
	const path = `${API_URL_NODE}/${n.id}/expire${suffix}`;
	const { node } = await apiPost<ApiNode>(path);
	debug('Expired Node "' + n.givenName + '"' + (date ? ' at ' + date : ''));
	return node;
}

export async function setNodeTags(n: Node, tags: string[]): Promise<Node> {
	const path = `${API_URL_NODE}/${n.id}/tags`;
	tags = tags.map((tag) => (tag.startsWith('tag:') ? tag : 'tag:' + tag));
	const { node } = await apiPost<ApiNode>(path, { tags });
	debug('Set Tags for Node "' + n.givenName + '"');
	return node;
}

export async function enableRoutes(node: Node, ...routes: string[]): Promise<string[]> {
	const path = `${API_URL_NODE}/${node.id}/approve_routes`;
	const currentRoutes = new Set(node.approvedRoutes);
	const newRoutes = new Set(node.approvedRoutes.concat(routes));

	if (setsEqual(currentRoutes, newRoutes)) {
		return node.approvedRoutes; // No change needed
	}

	// fix headscale bug #2637
	const currentStatus = node.online;

	const { node: nodeNew } = await apiPost<ApiNode>(path, { routes: [...newRoutes] });
	debug(`Enabled Routes ${routes.join(', ')} for Node "${node.givenName}"`);
	nodeNew.online = currentStatus; // Preserve online status, #2637
	App.updateValue(App.nodes, nodeNew);
	return nodeNew.approvedRoutes;
}

export async function disableRoutes(node: Node, ...routes: string[]): Promise<string[]> {
	const path = `${API_URL_NODE}/${node.id}/approve_routes`;
	const currentRoutes = new Set(node.approvedRoutes);
	const newRoutes = new Set(node.approvedRoutes.filter((r) => !routes.includes(r)));

	if (setsEqual(currentRoutes, newRoutes)) {
		return node.approvedRoutes; // No change needed
	}

	// fix headscale bug #2637
	const currentStatus = node.online;

	const { node: nodeNew } = await apiPost<ApiNode>(path, { routes: [...newRoutes] });
	debug(`Disabled Routes ${routes.join(', ')} for Node "${node.givenName}"`);
	nodeNew.online = currentStatus; // Preserve online status, #2637
	App.updateValue(App.nodes, nodeNew);
	return nodeNew.approvedRoutes;
}

export async function setPolicy(acl: ACLBuilder) {
	const path = `${API_URL_POLICY}`
	await apiPut<ApiPolicy>(path, {"policy": acl.JSON(4)})
}

export async function refreshApiKey() {
	const apiKeyNew = await createApiKey();
	const apiKeyOld = App.apiKey.value
	await expireApiKey(apiKeyOld);
	App.apiKey.value = apiKeyNew
	App.apiKeyInfo.value.informedExpiringSoon = false
	App.apiKeyInfo.value.informedUnauthorized = false
}

export async function backfillNodeIPs(confirmed: boolean = false): Promise<string[]> {
	const params = new URLSearchParams({
		confirmed: String(confirmed),
	});
	const path = `${API_URL_NODE}/backfillips?${params.toString()}`;
	const { changes } = await apiPost<{ changes: string[] }>(path);
	debug('BackfillNodeIPs:', confirmed ? 'Applied' : 'Dry run', '- Changes:', changes.length);
	return changes;
}
