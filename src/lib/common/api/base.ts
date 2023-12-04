import { ApiKeyStore, ApiUrlStore } from '$lib/Stores';
import { get } from 'svelte/store';

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
			Authorization: 'Bearer ' + get(ApiKeyStore),
			Accept: 'application/json',
		},
	};
}

export function toUrl(path: string): string {
	const base = get(ApiUrlStore);
	return base + path;
}

async function apiFetch<T>(path: string, init?: RequestInit, verbose: boolean = false): Promise<T> {
	const response = await fetch(toUrl(path), { ...headers(), ...init });
	if (verbose) {
		console.log(JSON.stringify(response));
	}
	return await toApiResponse<T>(response);
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

export async function apiTest(): Promise<boolean> {
	return true;
}
