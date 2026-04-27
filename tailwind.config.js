/** @type {import('tailwindcss').Config} */
module.exports = {
	prefix: 'wlc-',
	corePlugins: {
		preflight: false,
	},
	content: [
		'./src/css/**/*.css',
		'./includes/Views/Components/**/*.php',
		'./includes/Views/Pages/**/*.php',
	],
	theme: {
		minHeight: {
			auto: 'auto',
		},
		colors: {
			transparent: 'transparent',
			current: 'currentColor',
			white: '#FFFFFF',
			black: '#000000',
			'accents-secondary': '#5A00EE',
			'accents-tertiary': '#F2F2F2',
			'old-colors': '#080808',
			border: '#895BEF',
		},
		extend: {
			backgroundImage: {
				'checkbox-light':
					"url('./../../assets/icons/checkbox-light.svg')",
				'checkbox-dark':
					"url('./../../assets/icons/checkbox-dark.svg')",
			},
		},
	},
	plugins: [],
};
