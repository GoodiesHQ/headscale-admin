import { DebugStore } from '$lib/Stores';
import { get } from 'svelte/store';

export const version = '0.1.9b';

export function debug(...data: unknown[]) {
	// output if console debugging is enabled
	if (get(DebugStore)) {
		console.log(new Date().toLocaleTimeString('en-US', { hour12: false }), ...data);
	}
}
