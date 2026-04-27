<?php
/**
 * Plugin uninstall logic for Picsart plugin.
 *
 * @package Picsart
 * @subpackage Activation
 */

namespace PICSART\Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Class Uninstall
 *
 * Handles cleanup logic when the plugin is permanently deleted.
 *
 * @since 1.0.0
 */
class Uninstall {


	/**
	 * Registers the plugin uninstall hook.
	 *
	 * Should be called during plugin bootstrap (e.g. in App::init()).
	 * Ensures that WordPress will call `self::register_hook()` when the plugin is deleted via the admin panel.
	 *
	 * @return void
	 * @since 1.0.0
	 */
	public static function run(): void {
		if ( !defined( 'PICSART_PLUGIN_FILE' ) ) {
			return;
		}

		register_uninstall_hook( PICSART_PLUGIN_FILE, array( self::class, 'register_hook' ) );
	}

	/**
	 * Callback executed when the plugin is uninstalled.
	 *
	 * Use this to delete options, remove transients, custom tables,
	 * or any other data your plugin stores in the database.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public static function register_hook(): void {
		delete_option( 'picsart_options' );
	}
}
