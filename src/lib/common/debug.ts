import { App } from "$lib/States.svelte";

export const version = '0.24-dev';

export function debug(...data: unknown[]) {
	// output if console debugging is enabled
	if (App.debug.value) {
		console.log(new Date().toLocaleTimeString('en-US', { hour12: false }), ...data);
	}
}
