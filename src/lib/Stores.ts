import { get, writable, type Writable } from 'svelte/store';
import type { User, Node, PreAuthKey, Route } from '$lib/common/types';
import { getUsers, getPreAuthKeys, getNodes, getRoutes } from '$lib/common/api/get';
import { localStorageStore } from '@skeletonlabs/skeleton';
import { debug } from './common/debug';

export const RouteStore: Writable<Route[]> = writable([]);
export const UserStore: Writable<User[]> = writable([]);
export const NodeStore: Writable<Node[]> = writable([]);
export const PreAuthKeyStore: Writable<PreAuthKey[]> = writable([]);
export const DebugStore: Writable<boolean> = localStorageStore('debug', false);
export const ApiValid: Writable<boolean> = writable(false);
export const ApiKeyStore: Writable<string> = localStorageStore('apiKey', '');
export const ApiUrlStore: Writable<string> = localStorageStore('apiUrl', '');
export const ApiTtlStore: Writable<number> = localStorageStore('apiTTL', 10000);

// Layouts
export type LayoutStyle = 'tile' | 'list';
export const LayoutUserStore: Writable<LayoutStyle> = localStorageStore('layoutUser', 'list');
export const LayoutNodeStore: Writable<LayoutStyle> = localStorageStore('layoutNode', 'list');

export function isInitialized(): boolean {
	return typeof window !== 'undefined';
}

export function hasApiKey(): boolean {
	return isInitialized() && !!get(ApiKeyStore);
}

export function hasApiUrl(): boolean {
	return isInitialized() && !!get(ApiUrlStore);
}

export function hasApi(): boolean {
	return hasApiUrl() && hasApiKey();
}

export async function hasValidApi(): Promise<boolean> {
	return hasApiUrl() && hasApiKey();
}

function populateStore<T>(store: Writable<T>, data: T, force = false) {
	if (force || JSON.stringify(get<T>(store)) != JSON.stringify(data)) {
		store.set(data);
	}
}

export function toggleLayout(store?: Writable<LayoutStyle>) {
	if (store) {
		store.set(get(store) == 'tile' ? 'list' : 'tile');
	}
}

export function toggleLayoutUser() {
	toggleLayout(LayoutUserStore);
}

export function toggleLayoutNode() {
	toggleLayout(LayoutNodeStore);
}

interface Identified {
	id: string;
}

export function updateStoreItem(store: Writable<Identified[]>, item: Identified) {
	store.set(get(store).map((itemOld) => (itemOld.id === item.id ? item : itemOld)));
}

export function appendStoreItem<T>(store: Writable<T[]>, item: T) {
	const items = get(store);
	items.push(item);
	store.set(items);
}

export async function populateUserStore(users?: User[]) {
	try {
		if (users === undefined) {
			users = await getUsers();
		}
		populateStore(UserStore, users);
	} catch (error) {
		debug(error);
	}
}

export async function populateNodeStore(nodes?: Node[]) {
	try {
		if (nodes === undefined) {
			nodes = await getNodes();
		}
		populateStore(NodeStore, nodes);
	} catch (error) {
		debug(error);
	}
}

export async function populatePreAuthKeyStore(preAuthKeys?: PreAuthKey[]) {
	try {
		if (preAuthKeys === undefined) {
			preAuthKeys = await getPreAuthKeys();
		}
		populateStore(PreAuthKeyStore, preAuthKeys);
	} catch (error) {
		debug(error);
	}
}

export async function populateRouteStore(routes?: Route[]) {
	try {
		if (routes === undefined) {
			routes = await getRoutes();
		}
		populateStore(RouteStore, routes);
	} catch (error) {
		debug(error);
	}
}

export async function populateStores(repeat: boolean = true) {
	if (hasApi()) {
		const promises = [];
		promises.push(populateUserStore());
		promises.push(populateNodeStore());
		promises.push(populatePreAuthKeyStore());
		promises.push(populateRouteStore());
		await Promise.allSettled(promises);
		debug('Populated All Stores');
	}

	if (repeat) {
		setTimeout(() => {
			populateStores(true);
		}, get(ApiTtlStore));
	}
}
