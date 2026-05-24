import { join } from 'path'
import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { skeleton } from '@skeletonlabs/tw-plugin'

export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}', join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')],
	theme: {
		extend: {},
	},
	plugins: [
		forms,
		typography,
		skeleton({
			themes: {
				preset: [
					{
						name: 'skeleton',
						enhancements: true,
					},
					{
						name: 'wintry',
						enhancements: true,
					},
					{
						name: 'modern',
						enhancements: true,
					},
					{
						name: 'hamlindigo',
						enhancements: true,
					},
					{
						name: 'rocket',
						enhancements: true,
					},
					{
						name: 'sahara',
						enhancements: true,
					},
					{
						name: 'gold-nouveau',
						enhancements: true,
					},
					{
						name: 'vintage',
						enhancements: true,
					},
					{
						name: 'seafoam',
						enhancements: true,
					},
					{
						name: 'crimson',
						enhancements: true,
					},
				],
				custom: [
					{
						name: 'decula',
						label: 'Decula',
						properties: {
							'--theme-font-family-base': 'system-ui',
							'--theme-font-family-heading': 'system-ui',
							'--theme-font-color-base': '40, 42, 54',    /* Dark text for Light Mode */
							'--theme-font-color-dark': '248, 248, 242',  /* Light text for Dark Mode */
							'--theme-rounded-base': '6px',
							'--theme-rounded-container': '6px',
							'--theme-border-base': '1px',

							/* Primary: Purple #bd93f9 */
							'--color-primary-50': '244, 239, 254',
							'--color-primary-100': '233, 223, 253',
							'--color-primary-200': '211, 191, 251',
							'--color-primary-300': '189, 147, 249', /* Base in 300 for lighter feel? No stick to 500 */
							'--color-primary-400': '174, 134, 235',
							'--color-primary-500': '189, 147, 249', /* #bd93f9 */
							'--color-primary-600': '166, 121, 226',
							'--color-primary-700': '143, 95, 209',
							'--color-primary-800': '120, 69, 192',
							'--color-primary-900': '97, 43, 175',

							/* Secondary: Pink #ff79c6 */
							'--color-secondary-50': '255, 242, 250',
							'--color-secondary-100': '255, 225, 244',
							'--color-secondary-200': '255, 191, 232',
							'--color-secondary-300': '255, 157, 220',
							'--color-secondary-400': '255, 139, 209',
							'--color-secondary-500': '255, 121, 198', /* #ff79c6 */
							'--color-secondary-600': '230, 96, 170',
							'--color-secondary-700': '204, 71, 142',
							'--color-secondary-800': '179, 46, 114',
							'--color-secondary-900': '153, 21, 86',

							/* Tertiary: Cyan #8be9fd */
							'--color-tertiary-50': '240, 252, 255',
							'--color-tertiary-100': '225, 249, 255',
							'--color-tertiary-200': '196, 244, 255',
							'--color-tertiary-300': '167, 238, 254',
							'--color-tertiary-400': '153, 235, 253',
							'--color-tertiary-500': '139, 233, 253', /* #8be9fd */
							'--color-tertiary-600': '98, 198, 230',
							'--color-tertiary-700': '57, 163, 207',
							'--color-tertiary-800': '16, 128, 184',
							'--color-tertiary-900': '0, 93, 161',

							/* Success: Green #50fa7b */
							'--color-success-50': '241, 255, 244',
							'--color-success-100': '227, 255, 233',
							'--color-success-200': '180, 253, 200',
							'--color-success-300': '130, 251, 161',
							'--color-success-400': '105, 250, 142',
							'--color-success-500': '80, 250, 123', /* #50fa7b */
							'--color-success-600': '56, 205, 96',
							'--color-success-700': '32, 160, 69',
							'--color-success-800': '8, 115, 42',
							'--color-success-900': '0, 70, 15',

							/* Warning: Orange #ffb86c */
							'--color-warning-50': '255, 248, 240',
							'--color-warning-100': '255, 240, 225',
							'--color-warning-200': '255, 222, 186',
							'--color-warning-300': '255, 203, 147',
							'--color-warning-400': '255, 194, 128',
							'--color-warning-500': '255, 184, 108', /* #ffb86c */
							'--color-warning-600': '217, 149, 81',
							'--color-warning-700': '179, 114, 54',
							'--color-warning-800': '140, 79, 27',
							'--color-warning-900': '102, 44, 0',

							/* Error: Red #ff5555 */
							'--color-error-50': '255, 240, 240',
							'--color-error-100': '255, 225, 225',
							'--color-error-200': '255, 180, 180',
							'--color-error-300': '255, 135, 135',
							'--color-error-400': '255, 110, 110',
							'--color-error-500': '255, 85, 85',   /* #ff5555 */
							'--color-error-600': '210, 60, 60',
							'--color-error-700': '165, 35, 35',
							'--color-error-800': '120, 10, 10',
							'--color-error-900': '75, 0, 0',

							/* Surface: Based on Dracula Grays */
							/* 900=BG, 800=CurrentLine, 700=Commentish */
							'--color-surface-50': '248, 248, 242',  /* FG #f8f8f2 */
							'--color-surface-100': '235, 235, 236',
							'--color-surface-200': '212, 215, 219',
							'--color-surface-300': '174, 181, 201',
							'--color-surface-400': '136, 147, 182',
							'--color-surface-500': '98, 114, 164',  /* Comment #6272a4 */
							'--color-surface-600': '82, 89, 112',
							'--color-surface-700': '68, 71, 90',    /* Current Line #44475a */
							'--color-surface-800': '52, 55, 70',    /* Lighter BG */
							'--color-surface-900': '40, 42, 54',    /* Background #282a36 */
						}
					}
				],
			},
		}),
	],
} satisfies Config;
