import type { ToastStore } from '@skeletonlabs/skeleton';
import type { ExpirationMessage, Node } from './types';
import IPAddr from 'ipaddr.js';
import { debug } from './debug';

export function focus(el: HTMLElement | null) {
	if (el !== null) {
		el.focus();
	}
}

const DurationInfiniteString = '0001-01-01T00:00:00Z';
const DurationInfinite = new Date(DurationInfiniteString);
const ExpirationColorFuture = 'text-success-800 dark:text-success-400';
const ExpirationColorPast = 'text-error-600 dark:text-error-400';

export function isExpired(node: Node): boolean {
	const date = new Date(node.expiry ?? DurationInfiniteString);
	const now = new Date();
	if (date.getTime() == DurationInfinite.getTime()) {
		return false;
	}
	return date.getTime() - now.getTime() < 0;
}

export function getExpirationMessage(node: Node): ExpirationMessage {
	const date = new Date(node.expiry ?? DurationInfiniteString);
	if (date.getTime() == DurationInfinite.getTime()) {
		return {
			message: 'Does Not Expire',
			color: ExpirationColorFuture,
		};
	}

	const now = new Date();
	let difference = date.getTime() - now.getTime();
	const isFuture = difference > 0;

	difference = Math.abs(difference);
	const seconds = Math.floor(difference / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	let message: string;
	if (days > 0) {
		message = `${days} day${days == 1 ? '' : 's'}`;
	} else if (hours > 0) {
		message = `${hours} hour${hours == 1 ? '' : 's'}`;
	} else if (minutes > 0) {
		message = `${minutes} minute${minutes == 1 ? '' : 's'}`;
	} else {
		message = `${seconds} second${seconds == 1 ? '' : 's'}`;
	}
	return {
		message: message + `  ${isFuture ? 'from now' : 'ago'}`,
		color: isFuture ? ExpirationColorFuture : ExpirationColorPast,
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
		debug(addr, mask);
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
