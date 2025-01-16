import type { DrawerStore, ToastStore } from '@skeletonlabs/skeleton';
import type { DrawerSettings } from '@skeletonlabs/skeleton';
import IPAddr from 'ipaddr.js';
import { debug } from './debug';
import { get } from 'svelte/store';
// import { ApiKeyStore } from '$lib/Stores';
import type { Direction, Node } from './types';
import { App } from '$lib/States.svelte';
// import { createApiKey } from './api';
// import { ApiKeyStore } from '$lib/Stores';

export function clone<T>(item: T): T {
	return JSON.parse(JSON.stringify(item)) as T
}

export function focus(el: HTMLElement | null) {
	if (el !== null) {
		el.focus();
	}
}

const DurationInfiniteString = '0001-01-01T00:00:00Z';
const DurationInfinite = new Date(DurationInfiniteString);
const ExpirationColorFuture = 'text-success-800 dark:text-success-400';
const ExpirationColorPast = 'text-error-600 dark:text-error-400';

export function isExpired(expiry: string): boolean {
	const date = new Date(expiry ?? DurationInfiniteString);
	const now = new Date();
	if (date.getTime() == DurationInfinite.getTime()) {
		return false;
	}
	return date.getTime() - now.getTime() < 0;
}

interface TimeDifference {
	future: boolean;
	finite: boolean;
	message: string;
}

export function getTime(
	msg?: string | null | Date,
	fallback: string = DurationInfiniteString,
): number {
	if (msg === undefined) {
		msg = new Date();
	}
	if (msg instanceof Date) {
		return msg.getTime();
	}
	return new Date(msg ?? fallback).getTime();
}

export function getTimeDifferenceMessage(time1: number): string {
	const difference = getTimeDifference(time1, new Date().getTime());
	return difference.finite ? difference.message : 'Does Not Expire';
}

export function getTimeDifferenceColor(td: TimeDifference): string {
	return !td.finite || td.future ? ExpirationColorFuture : ExpirationColorPast;
}

export function getTimeDifference(time1: number, time2?: number): TimeDifference {
	if (time2 === undefined) {
		time2 = new Date().getTime();
	}

	if (time1 == DurationInfinite.getTime()) {
		return {
			future: true,
			finite: false,
			message: 'Does Not Expire',
		};
	}

	time2 = Math.floor(time2 / 1000) * 1000;
	let difference = time1 - time2;
	const isFuture = difference > 0;
	let message = '';

	difference = Math.abs(difference);
	const seconds = Math.floor(difference / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const months = Math.floor(weeks / 4);

	if (months > 0) {
		message = `${months} month${months == 1 ? '' : 's'}`;
	} else if (weeks > 0) {
		message = `${weeks} week${weeks == 1 ? '' : 's'}`;
	} else if (days > 0) {
		message = `${days} day${days == 1 ? '' : 's'}`;
	} else if (hours > 0) {
		message = `${hours} hour${hours == 1 ? '' : 's'}`;
	} else if (minutes > 0) {
		message = `${minutes} minute${minutes == 1 ? '' : 's'}`;
	} else {
		message = `${seconds} second${seconds == 1 ? '' : 's'}`;
	}

	return {
		future: isFuture,
		finite: true,
		message: message + ` ${isFuture ? 'from now' : 'ago'}`,
	};
}

export function dateToStr(d: Date | string) {
	if (typeof d === 'string') {
		d = new Date(d);
	}

	return d.toLocaleString('en-US', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		//hour12: false
	});
}

export function toastSuccess(message: string, toastStore: ToastStore) {
	toastStore.trigger({
		message,
		background: 'variant-filled-success',
	});
}

export function toastWarning(message: string, toastStore: ToastStore) {
	toastStore.trigger({
		message,
		background: 'variant-filled-warning',
	});
}

export function toastError(message: string, toastStore: ToastStore, error?: Error) {
	if (error !== undefined) {
		if (message.length > 0) {
			message += ': ';
		}
		message += error.message;
	}
	toastStore.trigger({
		message,
		background: 'variant-filled-error',
	});
}

export function copyToClipboard(
	s: string,
	toastStore?: ToastStore,
	toastMessage = 'Copied to Clipboard!',
) {
	navigator.clipboard
		.writeText(s)
		.then(() => {
			if (toastStore != undefined) {
				toastSuccess(toastMessage, toastStore);
			}
		})
		.catch(() => {
			if (toastStore) {
				toastError('Failed to copy to clipboard!', toastStore);
			}
		});
}

export function isValidTag(tag: string): boolean {
	// the only restrictions I could find were to be all lowercase, no-spaces
	// I made it alphanumeric with dashes and underscores only
	return new RegExp(/^[a-z0-9-_]+$/, 'g').test(tag);
}

function getInverseMask(prefix: number, bitsTotal: number, bitsPart: number = 8) {
	const ibitmask = '0'.repeat(prefix) + '1'.repeat(bitsTotal - prefix);
	const imask = [] as number[];

	for (let i = 0; i < bitsTotal; i += bitsPart) {
		imask.push(parseInt(ibitmask.substring(i, i + bitsPart), 2));
	}

	return imask;
}

export function getInverseMask4(prefix: number): number[] {
	return getInverseMask(prefix, 32);
}

export function getInverseMask6(prefix: number): number[] {
	return getInverseMask(prefix, 128);
}

export function isValidCIDR(cidr: string): boolean {
	try {
		const [addr, mask] = IPAddr.parseCIDR(cidr);
		let imask: number[];
		if (addr instanceof IPAddr.IPv4) {
			imask = getInverseMask4(mask);
		} else if (addr instanceof IPAddr.IPv6) {
			imask = getInverseMask6(mask);
		} else {
			throw new Error('invalid address type');
		}

		const addrBytes = addr.toByteArray();

		if (imask.length != addrBytes.length) {
			throw new Error('mask and addr length mismtch');
		}

		for (let i = 0; i < imask.length; i++) {
			if ((imask[i] & addrBytes[i]) !== 0) {
				throw new Error('host bits set');
			}
		}

		return true;
	} catch (err) {
		debug(err);
	}
	return false;
}

function makeDrawerSettings(
	id: string,
	meta: unknown,
	position: 'top' | 'bottom' | 'left' | 'right' = 'right',
	width: string = 'w-10/12 md:w-9/12 lg:w-8/12 xl:w-6/12',
	padding: string = '',
) {
	return { id, position, width, padding, meta } as DrawerSettings;
}

export function openDrawer(drawerStore: DrawerStore, id: string, meta: unknown) {
	drawerStore.open(makeDrawerSettings(id, meta));
}
export function toOptions(values: string[]): {label: string, value:string}[] {
	return values.map(v => ({
		label: v,
		value: v,
	}))
}

export function getSortedNodes(nodes: Node[], sortMethod: string, sortDirection: Direction): Node[] {
	if (sortMethod === 'id') {
		nodes = nodes.sort((a: Node, b: Node) => {
			const aid = parseInt(a.id);
			const bid = parseInt(b.id);
			if (aid < bid) {
				return -1;
			}
			if (aid > bid) {
				return 1;
			}
			return 0;
		});
	} else if (sortMethod === 'name') {
		nodes = nodes.sort((a: Node, b: Node) => {
			if (a.givenName < b.givenName) {
				return -1;
			}
			if (a.givenName > b.givenName) {
				return 1;
			}
			return 0;
		});
	}
	if (sortDirection === 'down') {
		return nodes.reverse();
	}
	return nodes;
}

export function filterNode(node: Node, filterString: string): boolean {
	const routes = App.routes.value.filter((r) => (r.node ?? r.machine).id == node.id)
	if (routes.length == 0) {
		return false
	}
	if (filterString === '') {
		return true;
	}
	try {
		const r = RegExp(filterString);
		const getTag = (tag: string) => {
			if (tag.startsWith('tag:')) {
				return tag.substring(0, 4);
			}
			return tag;
		};
		return (
			r.test(node.name) ||
			r.test(node.givenName) ||
			node.forcedTags.map(getTag).some((tag) => r.test(tag)) ||
			node.validTags.map(getTag).some((tag) => r.test(tag))
		);
	} catch (err) {
		return true;
	}
}

export function getSortedFilteredNodes(
	nodes: Node[],
	filterString:string,
	sortMethod: string,
	sortDirection: Direction,
){
	return getSortedNodes(
		nodes.filter((node)=> filterNode(node, filterString)),
		sortMethod,
		sortDirection,
	)
}