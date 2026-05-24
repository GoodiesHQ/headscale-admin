import { App } from '$lib/States.svelte';
import { ApiAuthErrorUnauthorized } from '../errors';
import { debug } from '../debug';

// errors received from headscale
export type ApiError = {
	code: number;
	message: string;
	details: unknown[];
};

export type ApiResponse<T> = T | ApiError;

function isApiError<T>(response: ApiResponse<T>): response is ApiError {
	return (response as ApiError).code !== undefined;
}

async function toApiResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const text = await response.text();
		if (text === 'Unauthorized') {
			throw new ApiAuthErrorUnauthorized();
		}

		try{
			const data = JSON.parse(text)
			if (isApiError(data)) {
				throw new Error(data.message);
			}
		} catch(e) {
			if (!(e instanceof SyntaxError)) {
				throw e
			}
		}


		// unspecified errors
		throw new Error('Unspecified Error: ' + text);
	}

	const data = await response.json();
	if (isApiError(data)) {
		throw new Error(data.message);
	}

	return data as T;
}

function headers(): { headers: HeadersInit } {
	if (typeof window === 'undefined') {
		return { headers: {} };
	}
	return {
		headers: {
			Authorization: 'Bearer ' + App.apiKey.value,
			Accept: 'application/json',
		},
	};
}

function mergeHeaders(initHeaders?: HeadersInit, includeJsonBody: boolean = false): Headers {
	const result = new Headers(headers().headers);

	if (initHeaders !== undefined) {
		const provided = new Headers(initHeaders);
		provided.forEach((value, key) => {
			result.set(key, value);
		});
	}

	if (includeJsonBody && !result.has('Content-Type')) {
		result.set('Content-Type', 'application/json');
	}

	return result;
}

export function toUrl(path: string): string {
	let base = App.apiUrl.value;
	if (!base && typeof window !== 'undefined') {
		base = window.location.origin;
	}
	if (!base.endsWith('/')) {
		base += '/';
	}
	if (path.startsWith('/')) {
		path = path.substring(1);
	}
	return new URL(path, base).href;
}

async function apiFetch<T>(path: string, init?: RequestInit, verbose: boolean = false): Promise<T> {
	try {
		const response = await fetch(toUrl(path), {
			...init,
			headers: mergeHeaders(init?.headers, init?.body !== undefined),
		});
		if (verbose) {
			debug(response);
		}
		const apiResponse = await toApiResponse<T>(response);
		if (App.apiKeyInfo.value.authorized !== true) {
			App.apiKeyInfo.value = {
				...App.apiKeyInfo.value,
				authorized: true,
			};
		}
		return apiResponse;
	} catch (err) {
		if (err instanceof Error) {
			debug('Fetch Error:', err.message);
		}
		throw err;
	}
}

export async function apiGet<T>(
	path: string,
	init?: RequestInit,
	verbose: boolean = false,
): Promise<T> {
	return await apiFetch<T>(path, init, verbose);
}

export async function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
	return await apiFetch<T>(path, { method: 'DELETE', ...init });
}

export async function apiPost<T>(
	path: string,
	data?: unknown,
	init?: RequestInit,
	verbose: boolean = false,
): Promise<T> {
	const requestInit: RequestInit = { method: 'POST', ...init };
	if (data !== undefined) {
		requestInit.body = JSON.stringify(data);
	}
	return await apiFetch<T>(path, requestInit, verbose);
}

export async function apiPut<T>(
	path: string,
	data?: unknown,
	init?: RequestInit,
	verbose: boolean = false,
): Promise<T> {
	const requestInit: RequestInit = { method: 'PUT', ...init };
	if (data !== undefined) {
		requestInit.body = JSON.stringify(data);
	}
	return await apiFetch<T>(path, requestInit, verbose);
}

export async function apiTest(): Promise<boolean> {
	return true;
}
