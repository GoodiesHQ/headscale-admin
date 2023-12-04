import { DebugStore } from '$lib/Stores';
import { get } from 'svelte/store';

export function debug(...data: unknown[]) {
	// output is console debugging is enabled
	if (get(DebugStore)) {
		console.log(...data);
	}
}
