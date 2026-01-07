<?php
/**
 * Plugin deactivation logic for Picsart plugin.
 *
 * @package Picsart
 * @subpackage Activation
 */

namespace PICSART\Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Class Activate
 *
 * Handles actions to perform upon plugin activation.
 *
 * @since 1.0.0
 */
class Deactivate {

	/**
	 * Registers the plugin activation hook.
	 *
	 * Should be called during plugin bootstrap (e.g. in main loader class).
	 * Ensures that WordPress will call `self::register_hook()` on activation.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function run(): void {
		if ( ! defined( 'PICSART_PLUGIN_FILE' ) ) {
			return;
		}

		register_deactivation_hook( PICSART_PLUGIN_FILE, array( self::class, 'register_hook' ) );
	}

	/**
	 * Callback executed during plugin activation.
	 *
	 * Currently flushes rewrite rules to ensure new custom endpoints or rewrites work immediately.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hook(): void {
		flush_rewrite_rules();
	}
}
