// TODO: add support for more specific errors so error handling can be far more graceful

import { informUserUnauthorized } from '$lib/States.svelte';
import type { ToastStore } from '@skeletonlabs/skeleton';
import { debug } from './debug';
import { _ } from 'svelte-i18n';
import { get } from 'svelte/store';

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

export function localizeError(err: unknown): string {
	const errorMsg = err instanceof Error ? err.message : String(err);
	const translate = get(_);

	if (errorMsg.includes('cannot remove all tags from a node')) {
		return translate('cards.cannotRemoveAllTags');
	}

	if (errorMsg.includes('re-authenticating with') || errorMsg.includes('force-reauth')) {
		return translate('cards.taggedToUserReauthRequired');
	}

	if (errorMsg.includes('are invalid or not permitted')) {
		return translate('cards.tagsNotPermitted');
	}

	return errorMsg;
}
