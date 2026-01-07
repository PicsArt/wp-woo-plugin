const wordpressPrettierConfig = require('@wordpress/prettier-config')

module.exports = {
	...wordpressPrettierConfig,
	arrowParens: 'always',
	bracketSpacing: true,
	endOfLine: 'lf',
	htmlWhitespaceSensitivity: 'css',
	insertPragma: false,
	singleAttributePerLine: false,
	bracketSameLine: false,
	jsxBracketSameLine: false,
	jsxSingleQuote: false,
	printWidth: 80,
	proseWrap: 'preserve',
	quoteProps: 'as-needed',
	requirePragma: false,
	semi: false,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'es5',
	useTabs: true,
	vueIndentScriptAndStyle: true,
}
