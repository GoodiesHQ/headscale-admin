import { browser } from '$app/environment';
import { init, register, locale } from 'svelte-i18n';

export const SUPPORTED_LOCALES = ['en', 'zh'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_STORAGE_KEY = 'locale';
const LOCALE_COOKIE_KEY = 'locale';
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_OPTIONS = [
	{
		code: 'en',
		label: 'English',
		description: 'Use English throughout the interface.',
	},
	{
		code: 'zh',
		label: '简体中文',
		description: '使用简体中文浏览和管理整个控制台。',
	},
] as const;

register('en', () => import('./locales/en.json'));
register('zh', () => import('./locales/zh.json'));

function normalizeLocale(value?: string | null): SupportedLocale | null {
	if (!value) {
		return null;
	}

	let candidate = value.trim();

	try {
		const parsed = JSON.parse(candidate);
		if (typeof parsed === 'string') {
			candidate = parsed.trim();
		}
	} catch {
		// Ignore non-JSON values and fall back to the raw string.
	}

	const normalized = candidate.toLowerCase();

	if (normalized === 'zh' || normalized.startsWith('zh-')) {
		return 'zh';
	}

	if (normalized === 'en' || normalized.startsWith('en-')) {
		return 'en';
	}

	return null;
}

function readLocaleFromCookie(): SupportedLocale | null {
	if (!browser) {
		return null;
	}

	const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
	return normalizeLocale(match ? decodeURIComponent(match[1]) : null);
}

function readLocaleFromStorage(): SupportedLocale | null {
	if (!browser) {
		return null;
	}

	return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
}

function readNavigatorLocale(): SupportedLocale {
	if (!browser) {
		return DEFAULT_LOCALE;
	}

	return normalizeLocale(window.navigator.language) ?? DEFAULT_LOCALE;
}

export function hasStoredLocalePreference(): boolean {
	return readLocaleFromCookie() !== null || readLocaleFromStorage() !== null;
}

export function getStoredLocale(): SupportedLocale | null {
	return readLocaleFromCookie() ?? readLocaleFromStorage();
}

export function getInitialLocale(): SupportedLocale {
	return getStoredLocale() ?? readNavigatorLocale();
}

export function persistLocalePreference(localeCode: SupportedLocale): SupportedLocale {
	if (!browser) {
		return localeCode;
	}

	window.localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(localeCode));
	document.cookie = `${LOCALE_COOKIE_KEY}=${encodeURIComponent(localeCode)}; Max-Age=${LOCALE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
	document.documentElement.lang = localeCode;
	return localeCode;
}

init({
	fallbackLocale: DEFAULT_LOCALE,
	initialLocale: getInitialLocale(),
});

// Set the locale immediately for SSR compatibility
locale.set(getInitialLocale());
