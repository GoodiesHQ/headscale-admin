import type { DrawerStore, ToastStore } from '@skeletonlabs/skeleton';
import type { DrawerSettings } from '@skeletonlabs/skeleton';
import IPAddr from 'ipaddr.js';
import { debug } from './debug';
import DOMPurify from 'dompurify';
import type { Direction, Node, OnlineStatus, User } from './types';
import { get } from 'svelte/store';
import { locale as i18nLocale, _ } from 'svelte-i18n';
import { App } from '$lib/States.svelte';

export function clone<T>(item: T): T {
	return JSON.parse(JSON.stringify(item)) as T
}

export function focus(el: HTMLElement | null) {
	if (el !== null) {
		el.focus();
	}
}

export function getUserAclName(user: User): string {
	const name = user.email ? user.email : user.name;
	if (name && !name.includes('@')) {
		return name + '@';
	}
	return name;
}

export function arraysEqual<T>(a: T[], b: T[]): boolean {
	if (a.length !== b.length) {
		return false
	}

	return JSON.stringify(a) == JSON.stringify(b)

	if (a === b) {
		return true;
	}

	if (a == null || b == null) {
		return false;
	}

	if (a.length !== b.length) {
		return false;
	}

	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
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

export function setsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
	if (set1.size !== set2.size) {
		return false;
	}

	for (const item of set1) {
		if (!set2.has(item)) {
			return false;
		}
	}

	return true;
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
	if (msg === null) {
		return DurationInfinite.getTime()
	}

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
	return difference.finite ? difference.message : (safeIsZh() ? '不过期' : 'Does Not Expire');
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
			message: safeIsZh() ? '不过期' : 'Does Not Expire',
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

	if (safeIsZh()) {
		if (months > 0) {
			message = `${months}个月`;
		} else if (weeks > 0) {
			message = `${weeks}周`;
		} else if (days > 0) {
			message = `${days}天`;
		} else if (hours > 0) {
			message = `${hours}小时`;
		} else if (minutes > 0) {
			message = `${minutes}分钟`;
		} else {
			message = `${seconds}秒`;
		}
	} else {
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
	}

	return {
		future: isFuture,
		finite: true,
		message: safeIsZh() ? `${message}${isFuture ? '后' : '前'}` : message + ` ${isFuture ? 'from now' : 'ago'}`,
	};
}

export function dateToStr(d: Date | string) {
	if (typeof d === 'string') {
		d = new Date(d);
	}

	if (safeIsZh()) {
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const hour = String(d.getHours()).padStart(2, '0');
		const minute = String(d.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day} ${hour}:${minute}`;
	}

	return d.toLocaleString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
}

function safeIsZh(): boolean {
	try {
		const lang = get(i18nLocale) ?? '';
		return lang === 'zh' || lang.startsWith('zh-');
	} catch {
		return false;
	}
}

export function toastSuccess(message: string, toastStore: ToastStore) {
	message = DOMPurify.sanitize(message)
	toastStore.trigger({
		message,
		background: 'variant-filled-success',
	});
}

export function toastWarning(message: string, toastStore: ToastStore) {
	message = DOMPurify.sanitize(message)
	toastStore.trigger({
		message,
		background: 'variant-filled-warning',
	});
}

export function toastError(message: string, toastStore: ToastStore, error?: Error) {
	message = DOMPurify.sanitize(message)
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
	toastMessage?: string,
) {
	const translate = get(i18nLocale); // This is actually the locale string, I need the formatter
    // Wait, let's use the same pattern as errors.ts
    const msg = toastMessage ?? get(_)( 'common.copySuccess' );

	navigator.clipboard
		.writeText(s)
		.then(() => {
			if (toastStore != undefined) {
				toastSuccess(msg, toastStore);
			}
		})
		.catch(() => {
			if (toastStore) {
				toastError(get(_)( 'common.copyFailed' ), toastStore);
			}
		});
}

export function isValidTag(tag: string): boolean {
	// the only restrictions I could find were to be all lowercase, no-spaces
	// I made it alphanumeric with dashes and underscores only
	return new RegExp(/^[a-z0-9-_]+$/).test(tag);
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

export function isValidIP(addr: string): boolean {
	try {
		IPAddr.parse(addr)
		return true
	} catch (err) {
		debug(err)
		return false
	}
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
export function toOptions(values: string[]): { label: string, value: string }[] {
	return values.map(v => ({
		label: v,
		value: v,
	}))
}

export function deduplicate<T>(arr: T[]): T[] {
	return Array.from(new Set(arr))
}

export function getSortedUsers(users: User[], sortMethod: string, sortDirection: Direction): User[] {
	if (sortMethod === 'id') {
		users = users.sort((a: User, b: User) => {
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
	}
	if (sortMethod === 'name') {
		users = users.sort((a: User, b: User) => {
			if (a.name < b.name) {
				return -1;
			}
			if (a.name > b.name) {
				return 1;
			}
			return 0;
		});
	}
	if (sortDirection === 'down') {
		return users.reverse();
	}
	return users;
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

export function filterUser(user: User, filterString: string, onlineStatus: OnlineStatus = "all"): boolean {
	try {
		if (
			(onlineStatus === 'online' && !App.nodes.value.filter((n) => n.user.id === user.id).some((n) => n.online)) ||
			(onlineStatus === 'offline' && App.nodes.value.filter((n) => n.user.id === user.id).some((n) => n.online))
		) {
			return false;
		}

		if (filterString === '') {
			return true;
		}

		const r = RegExp(filterString);
		return r.test(user.name) || r.test(user.name.toLowerCase());
	} catch (error) {
		return true;
	}
}

export function filterNode(node: Node, filterString: string, onlineStatus: OnlineStatus = "all"): boolean {
	if ((onlineStatus === "online" && !node.online) || (onlineStatus === "offline" && node.online)) {
		return false
	}

	if (filterString === '') {
		return true;
	}

	try {
		const r = RegExp(filterString);
		const getTag = (tag: string) => {
			if (tag.startsWith('tag:')) {
				return tag.substring(4);
			}
			return tag;
		};
		return (
			r.test(node.name) ||
			r.test(node.givenName) ||
			node.tags.map(getTag).some((tag) => r.test(tag))
		);
	} catch (err) {
		return true;
	}
}

export function getSortedFilteredUsers(
	users: User[],
	filterString: string,
	sortMethod: string,
	sortDirection: Direction,
	onlineStatus: OnlineStatus,
) {
	return getSortedUsers(
		users.filter((user) => filterUser(user, filterString, onlineStatus)),
		sortMethod,
		sortDirection,
	)
}

export function getSortedFilteredNodes(
	nodes: Node[],
	filterString: string,
	sortMethod: string,
	sortDirection: Direction,
	onlineStatus: OnlineStatus,
	ignoreRouteless: boolean = false,
) {
	let nodesSortedFiltered = getSortedNodes(
		nodes.filter((node) => filterNode(node, filterString, onlineStatus)),
		sortMethod,
		sortDirection,
	)
	if (ignoreRouteless === true) {
		return nodesSortedFiltered.filter((n) => {
			return n.availableRoutes.length > 0;
		})
	}
	return nodesSortedFiltered
}