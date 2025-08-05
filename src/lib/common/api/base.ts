import { App } from '$lib/States.svelte';
import { ApiAuthErrorUnauthorized } from '../errors';
import { debug } from '../debug';

// Custom error for 404 responses
export class ApiNotFoundError extends Error {
	constructor(message: string = 'Resource not found') {
		super(message);
		this.name = 'ApiNotFoundError';
	}
}

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

		// Handle 404 errors specifically
		if (response.status === 404) {
			throw new ApiNotFoundError(`Resource not found: ${response.url}`);
		}

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

export function toUrl(path: string): string {
	return new URL(path, App.apiUrl.value).href
}

async function apiFetch<T>(path: string, init?: RequestInit, verbose: boolean = false): Promise<T> {
	try {
		const response = await fetch(toUrl(path), { ...headers(), ...init });
		if (verbose) {
			debug(response);
		}
		const apiResponse = await toApiResponse<T>(response);
		if (App.apiKeyInfo.value.authorized === null) {
			App.apiKeyInfo.value.authorized = true
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
	data: unknown = null,
	init?: RequestInit,
	verbose: boolean = false,
): Promise<T> {
	const body = JSON.stringify(data ?? {});
	return await apiFetch<T>(path, { method: 'POST', body, ...init }, verbose);
}

export async function apiPut<T>(
	path: string,
	data: unknown = null,
	init?: RequestInit,
	verbose: boolean = false,
): Promise<T> {
	const body = JSON.stringify(data ?? {});
	return await apiFetch<T>(path, { method: 'PUT', body, ...init }, verbose);
}

export async function apiTest(): Promise<boolean> {
	return true;
}
