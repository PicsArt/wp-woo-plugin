<?php
/**
 * Plugin Name: Picsart AI Image Editor
 * Plugin URI: https://picsart.com/
 * Description: Picsart AI Image Editor is a powerful WordPress plugin that leverages advanced AI technology to enhance and transform your images effortlessly. With a suite of AI-driven tools, you can easily edit, retouch, and create stunning visuals directly within your WordPress dashboard. Whether you're a blogger, photographer, or business owner, Picsart AI Image Editor simplifies the image editing process, allowing you to produce professional-quality images with just a few clicks.
 * Requires at least: 6.3
 * Requires PHP: 7.4
 * Version:     1.0.5
 * Author:      Picsart
 * Author URI:  https://picsart.com/
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: picsart-ai-image-editor
 * Domain Path: /languages
 * Network: true
 *
 * @package PicPlugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'PICSART_PLUGIN_FILE' ) ) {
	define( 'PICSART_PLUGIN_FILE', __FILE__ );
}

if ( ! defined( 'PICSART_PLUGIN_DIR' ) ) {
	define( 'PICSART_PLUGIN_DIR', __DIR__ );
}

if ( ! defined( 'PICSART_PLUGIN_VERSION' ) ) {
	define( 'PICSART_PLUGIN_VERSION', '1.0.5' );
}

if ( ! defined( 'PICSART_PLUGIN_API_NAMESPACE' ) ) {
	define( 'PICSART_PLUGIN_API_NAMESPACE', 'picsart/v1' );
}

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/includes/Core/App.php';

PICSART\Core\App::init();
