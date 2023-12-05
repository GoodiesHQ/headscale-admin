// TODO: add support for more specific errors so error handling can be far more graceful

import { informUserUnauthorized } from '$lib/Stores';
import type { ToastStore } from '@skeletonlabs/skeleton';
import { debug } from './debug';

export class ApiAuthError extends Error {
	constructor() {
		super();
	}
}
export class ApiAuthErrorUnauthorized extends ApiAuthError {
	constructor() {
		super();
	}
}

export function createPopulateErrorHandler(ToastStore: ToastStore) {
	return (err: unknown) => {
		if (err instanceof ApiAuthErrorUnauthorized) {
			informUserUnauthorized(ToastStore);
		}
		debug('Error Handler:', err);
	};
}
