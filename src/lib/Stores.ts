import { get, writable, type Writable } from 'svelte/store';
import { Mutex } from 'async-mutex';

import type { User, Node, PreAuthKey, Route, ApiKeyInfo, ApiApiKeys } from '$lib/common/types';
import { getUsers, getPreAuthKeys, getNodes, getRoutes } from '$lib/common/api/get';
import { localStorageStore, type ToastStore } from '@skeletonlabs/skeleton';
import { API_URL_APIKEY, apiGet } from './common/api';
import { toastError } from './common/funcs';

export const RouteStore: Writable<Route[]> = writable([]);
export const UserStore: Writable<User[]> = writable([]);
export const NodeStore: Writable<Node[]> = writable([]);
export const PreAuthKeyStore: Writable<PreAuthKey[]> = writable([]);
export const DebugStore: Writable<boolean> = localStorageStore('debug', false);
export const ApiValid: Writable<boolean> = writable(false);
export const ApiUrlStore: Writable<string> = localStorageStore<string>('apiUrl', '');
export const ApiKeyStore: Writable<string> = localStorageStore<string>('apiKey', '');
export const ApiKeyInfoStore: Writable<ApiKeyInfo> = localStorageStore<ApiKeyInfo>('apiKeyInfo', {
	authorized: null,
	expires: '',
	informedUnauthorized: false,
	informedExpiringSoon: false,
} as ApiKeyInfo);
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

export function hasValidApi(): boolean {
	return hasApi() && get(ApiKeyInfoStore).authorized === true;
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
	if (users === undefined) {
		users = await getUsers();
	}
	populateStore(UserStore, users);
}

export async function populateNodeStore(nodes?: Node[]) {
	if (nodes === undefined) {
		nodes = await getNodes();
	}
	populateStore(NodeStore, nodes);
}

export async function populatePreAuthKeyStore(preAuthKeys?: PreAuthKey[]) {
	if (preAuthKeys === undefined) {
		preAuthKeys = await getPreAuthKeys();
	}
	populateStore(PreAuthKeyStore, preAuthKeys);
}

export async function populateRouteStore(routes?: Route[]) {
	if (routes === undefined) {
		routes = await getRoutes();
	}
	populateStore(RouteStore, routes);
}

export async function populateApiKeyInfoStore() {
	const { apiKeys } = await apiGet<ApiApiKeys>(`${API_URL_APIKEY}`);
	const apiKey = get(ApiKeyStore);
	const myKey = apiKeys.filter((key) => apiKey.startsWith(key.prefix))[0];
	const info = get(ApiKeyInfoStore);
	info.expires = myKey.expiration;
	info.authorized = true;
	ApiKeyInfoStore.set(info);
}

export async function populateStores(handler?: (err: unknown) => void, repeat: boolean = true) {
	if (hasValidApi()) {
		const promises = [];
		promises.push(populateUserStore());
		promises.push(populateNodeStore());
		promises.push(populatePreAuthKeyStore());
		promises.push(populateRouteStore());
		promises.push(populateApiKeyInfoStore());
		await Promise.allSettled(promises);
		promises.forEach((p) => p.catch(handler));
	}

	if (repeat) {
		setTimeout(() => {
			populateStores(handler, true);
		}, get(ApiTtlStore));
	}
}

const storageMu = new Mutex();

export function informUserUnauthorized(toastStore: ToastStore) {
	storageMu.runExclusive(() => {
		const storedApiKeyInfo = get(ApiKeyInfoStore);
		if (storedApiKeyInfo.informedUnauthorized === true) {
			return;
		}
		toastError('API Key is Unauthorized or Invalid', toastStore);
		storedApiKeyInfo.informedUnauthorized = true;
		storedApiKeyInfo.authorized = false;
		ApiKeyInfoStore.set(storedApiKeyInfo);
	});
}

export function informUserExpiringSoon(toastStore: ToastStore) {
	storageMu.runExclusive(() => {
		const storedApiKeyInfo = get(ApiKeyInfoStore);
		if (storedApiKeyInfo.informedExpiringSoon === true) {
			return;
		}
		toastError('API Key Expires Soon', toastStore);
		storedApiKeyInfo.informedUnauthorized = true;
		storedApiKeyInfo.authorized = false;
		ApiKeyInfoStore.set(storedApiKeyInfo);
	});
}
