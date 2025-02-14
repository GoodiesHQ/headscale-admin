import { App } from "$lib/States.svelte";

export const version = '0.25.0';

export function debug(...data: unknown[]) {
	// output if console debugging is enabled
	if (App.debug.value) {
		console.log(new Date().toLocaleTimeString('en-US', { hour12: false }), ...data);
	}
}
