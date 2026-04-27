const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
	mode: isProduction ? 'production' : 'development',
	entry: {
		main: path.resolve(__dirname, 'src/css/main.css'),
		modal: path.resolve(__dirname, 'src/css/modal.css'),
		loader: path.resolve(__dirname, 'src/css/loader.css'),
		'picsart-admin': path.resolve(__dirname, 'src/js/picsart-admin.js'),
		'block-image-button': path.resolve(
			__dirname,
			'src/js/block-image-button.js'
		),
		'feature-image-button': path.resolve(
			__dirname,
			'src/js/feature-image-button.js'
		),
		admin: path.resolve(__dirname, 'src/js/index.js'),
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				include: path.resolve(__dirname, 'src'),
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					'postcss-loader',
				],
			},
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: '[name].css',
		}),
	],
	optimization: {
		minimize: isProduction,
		minimizer: [new CssMinimizerPlugin()],
	},
	stats: 'minimal',
	externals: {
		'@wordpress/blocks': ['wp', 'blocks'],
		'@wordpress/element': ['wp', 'element'],
		'@wordpress/edit-post': ['wp', 'editPost'],
		'@wordpress/components': ['wp', 'components'],
		'@wordpress/data': ['wp', 'data'],
		'@wordpress/hooks': ['wp', 'hooks'],
		'@wordpress/plugins': ['wp', 'plugins'],
		'@wordpress/compose': ['wp', 'compose'],
		react: 'React',
		'react-dom': 'ReactDOM',
	},
};
