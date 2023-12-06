import { apiDelete } from './base';
import type { User, Node, Route } from '$lib/common/types';
import { UserStore, NodeStore, RouteStore, ApiEndpointsStore } from '$lib/Stores';
import { get } from 'svelte/store';
import { debug } from '../debug';

export async function deleteUser(user: User): Promise<boolean> {
	try {
		await apiDelete(`${get(ApiEndpointsStore).User}/${user.name}`);
		UserStore.set(get(UserStore).filter((u: User) => u.name != user.name));
		debug('Deleted User "' + user.name + '"');
		return true;
	} catch (error) {
		debug(error);
		return false;
	}
}

export async function deleteNode(node: Node): Promise<boolean> {
	try {
		await apiDelete(`${get(ApiEndpointsStore).Node}/${node.id}`);
		NodeStore.set(get(NodeStore).filter((m: Node) => m.id != node.id));
		debug('Deleted Node "' + node.name + '"');
		return true;
	} catch (error) {
		debug(error);
		return false;
	}
}

export async function deleteRoute(route: Route): Promise<boolean> {
	try {
		await apiDelete(`${get(ApiEndpointsStore).Routes}/${route.id}`);
		RouteStore.set(get(RouteStore).filter((r: Route) => r.id != route.id));
		debug('Deleted Route "' + route.prefix + '"');
		return true;
	} catch (error) {
		debug(error);
		return false;
	}
}
