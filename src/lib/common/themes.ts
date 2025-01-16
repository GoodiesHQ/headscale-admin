export const ALL_THEMES = [
	'skeleton',
	'wintry',
	'modern',
	'rocket',
	'seafoam',
	'vintage',
	'sahara',
	'hamlindigo',
	'gold-nouveau',
	'crimson',
];

export function setTheme(theme: string) {
	document.body.setAttribute('data-theme', theme)
}