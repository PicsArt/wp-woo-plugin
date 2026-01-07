<?php
/**
 * Initializes all plugin features for both backend and frontend.
 *
 * @package Picsart
 * @subpackage Core
 */

namespace PICSART\Core;

use PICSART\Activation\Activate;
use PICSART\Activation\Deactivate;
use PICSART\Activation\Uninstall;
use PICSART\Admin\ButtonForGutenberg;
use PICSART\Admin\ButtonForOldEditor;
use PICSART\Admin\Lists;
use PICSART\Admin\MediaLibrary;
use PICSART\Admin\TaxonomyEdit;
use PICSART\Admin\SettingsPage;
use PICSART\Ajax\ImageProxy;
use PICSART\Helpers\AdminNotices;
use PICSART\Rests\Convert;
use PICSART\Rests\SaveBlob;
use PICSART\Rests\SaveImage;
use PICSART\Webhooks\Activation;

defined( 'ABSPATH' ) || exit;

/**
 * Class App
 *
 * The main bootstrap class for initializing all plugin modules.
 *
 * This includes activation lifecycle handlers, REST API endpoints,
 * admin page setup, Gutenberg integration, and media enhancements.
 *
 * @since 1.0.0
 */
class App {

	/**
	 * Initializes the plugin by registering all core modules.
	 *
	 * Called typically on the `plugins_loaded` or theme `after_setup_theme` action.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public static function init(): void {
		// Register lifecycle events.
		Activate::run();
		Deactivate::run();
		Uninstall::run();

		// Register REST API routes.
		( new Activation() )->run();
		( new SaveImage() )->run();
		( new SaveBlob() )->run();
		( new Convert() )->run();
		( new ImageProxy() )->run();

		// Admin-only features.
		if ( is_admin() ) {
			( new Fonts() )->run();
			( new Assets() )->run();
			( new AdminNotices() )->run();
			( new SettingsPage() )->run();
			( new MediaLibrary() )->run();
			( new TaxonomyEdit() )->run();
			( new ButtonForGutenberg() )->run();
			( new ButtonForOldEditor() )->run();
			( new Modal() )->run();
		}
	}
}
