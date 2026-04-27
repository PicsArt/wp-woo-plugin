<?php
/**
 * Helper class for managing WordPress admin notices.
 *
 * @package Picsart
 * @subpackage Helpers
 */

namespace PICSART\Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Class AdminNotices
 *
 * Provides functionality for creating, storing, and displaying admin notices
 * across different admin pages with various types and persistence options.
 *
 * @since 1.0.0
 */
class AdminNotices {

	/**
	 * Option name for storing persistent notices.
	 *
	 * @var string
	 */
	private const NOTICES_OPTION = 'picsart_admin_notices';

	/**
	 * Notice types.
	 *
	 * @var array<string>
	 */
	private const NOTICE_TYPES = array(
		'success',
		'error',
		'warning',
		'info',
	);

	/**
	 * Registers the class's hooks with WordPress.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function run(): void {
		add_action( 'admin_enqueue_scripts', array( $this, 'register_dismiss_script' ) );
		add_action( 'admin_notices', array( $this, 'display_notices' ) );
		add_action( 'wp_ajax_picsart_dismiss_notice', array( $this, 'dismiss_notice_ajax' ) );
	}

	/**
	 * Registers the dismiss-notice script. It is enqueued on demand when a
	 * dismissible notice is rendered.
	 *
	 * @since 1.0.6
	 *
	 * @return void
	 */
	public function register_dismiss_script(): void {
		if ( ! defined( 'PICSART_PLUGIN_FILE' ) || ! defined( 'PICSART_PLUGIN_VERSION' ) ) {
			return;
		}

		$asset_path = plugin_dir_path( PICSART_PLUGIN_FILE ) . 'assets/js/admin-notices.js';
		$asset_url  = plugin_dir_url( PICSART_PLUGIN_FILE ) . 'assets/js/admin-notices.js';

		wp_register_script(
			'picsart-admin-notices',
			$asset_url,
			array( 'jquery' ),
			file_exists( $asset_path ) ? (string) filemtime( $asset_path ) : PICSART_PLUGIN_VERSION,
			true
		);

		wp_localize_script(
			'picsart-admin-notices',
			'picsartAdminNotices',
			array(
				'ajaxurl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'picsart_dismiss_notice' ),
			)
		);
	}

	/**
	 * Adds a notice to be displayed.
	 *
	 * @since 1.0.0
	 *
	 * @param string $message     The notice message.
	 * @param string $type        Notice type: 'success', 'error', 'warning', 'info'.
	 * @param bool   $dismissible Whether the notice can be dismissed.
	 * @param bool   $persistent  Whether to store the notice across page loads.
	 * @param string $id          Unique ID for the notice (optional).
	 * @return void
	 */
	public static function add_notice( string $message, string $type = 'info', bool $dismissible = true, bool $persistent = false, string $id = '' ): void {
		if ( ! in_array( $type, self::NOTICE_TYPES, true ) ) {
			$type = 'info';
		}

		$notice = array(
			'id'          => $id ?: wp_generate_uuid4(),
			'message'     => $message,
			'type'        => $type,
			'dismissible' => $dismissible,
			'timestamp'   => time(),
		);

		if ( $persistent ) {
			self::store_persistent_notice( $notice );
		} else {
			self::store_session_notice( $notice );
		}
	}

	/**
	 * Adds a success notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $message     The success message.
	 * @param bool   $dismissible Whether the notice can be dismissed.
	 * @param bool   $persistent  Whether to store the notice across page loads.
	 * @param string $id          Unique ID for the notice (optional).
	 * @return void
	 */
	public static function add_success( string $message, bool $dismissible = true, bool $persistent = false, string $id = '' ): void {
		self::add_notice( $message, 'success', $dismissible, $persistent, $id );
	}

	/**
	 * Adds an error notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $message     The error message.
	 * @param bool   $dismissible Whether the notice can be dismissed.
	 * @param bool   $persistent  Whether to store the notice across page loads.
	 * @param string $id          Unique ID for the notice (optional).
	 * @return void
	 */
	public static function add_error( string $message, bool $dismissible = true, bool $persistent = false, string $id = '' ): void {
		self::add_notice( $message, 'error', $dismissible, $persistent, $id );
	}

	/**
	 * Adds a warning notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $message     The warning message.
	 * @param bool   $dismissible Whether the notice can be dismissed.
	 * @param bool   $persistent  Whether to store the notice across page loads.
	 * @param string $id          Unique ID for the notice (optional).
	 * @return void
	 */
	public static function add_warning( string $message, bool $dismissible = true, bool $persistent = false, string $id = '' ): void {
		self::add_notice( $message, 'warning', $dismissible, $persistent, $id );
	}

	/**
	 * Adds an info notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $message     The info message.
	 * @param bool   $dismissible Whether the notice can be dismissed.
	 * @param bool   $persistent  Whether to store the notice across page loads.
	 * @param string $id          Unique ID for the notice (optional).
	 * @return void
	 */
	public static function add_info( string $message, bool $dismissible = true, bool $persistent = false, string $id = '' ): void {
		self::add_notice( $message, 'info', $dismissible, $persistent, $id );
	}

	/**
	 * Removes a specific notice by ID.
	 *
	 * @since 1.0.0
	 *
	 * @param string $id The notice ID to remove.
	 * @return bool True if notice was removed, false otherwise.
	 */
	public static function remove_notice( string $id ): bool {
		// Remove from session notices.
		$session_notices = self::get_session_notices();
		$session_updated = false;
		foreach ( $session_notices as $key => $notice ) {
			if ( $notice['id'] === $id ) {
				unset( $session_notices[ $key ] );
				$session_updated = true;
			}
		}
		if ( $session_updated ) {
			self::set_session_notices( array_values( $session_notices ) );
		}

		// Remove from persistent notices.
		$persistent_notices = self::get_persistent_notices();
		$persistent_updated = false;
		foreach ( $persistent_notices as $key => $notice ) {
			if ( $notice['id'] === $id ) {
				unset( $persistent_notices[ $key ] );
				$persistent_updated = true;
			}
		}
		if ( $persistent_updated ) {
			update_option( self::NOTICES_OPTION, array_values( $persistent_notices ) );
		}

		return $session_updated || $persistent_updated;
	}

	/**
	 * Clears all notices.
	 *
	 * @since 1.0.0
	 *
	 * @param bool $persistent_only Whether to clear only persistent notices.
	 * @return void
	 */
	public static function clear_notices( bool $persistent_only = false ): void {
		if ( ! $persistent_only ) {
			self::set_session_notices( array() );
		}
		delete_option( self::NOTICES_OPTION );
	}

	/**
	 * Displays all stored notices.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function display_notices(): void {
		$notices = array_merge(
			self::get_session_notices(),
			self::get_persistent_notices()
		);

		// Clear session notices after displaying.
		self::set_session_notices( array() );

		foreach ( $notices as $notice ) {
			$this->render_notice( $notice );
		}
	}

	/**
	 * Handles AJAX request to dismiss a notice.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function dismiss_notice_ajax(): void {
		check_ajax_referer( 'picsart_dismiss_notice', 'nonce' );

		$notice_id = sanitize_text_field( wp_unslash( $_POST['notice_id'] ?? '' ) );
		if ( empty( $notice_id ) ) {
			wp_die( 'Invalid notice ID.' );
		}

		$removed = self::remove_notice( $notice_id );

		wp_send_json_success( array( 'removed' => $removed ) );
	}

	/**
	 * Stores a notice in the session.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string,mixed> $notice The notice data.
	 * @return void
	 */
	private static function store_session_notice( array $notice ): void {
		$notices   = self::get_session_notices();
		$notices[] = $notice;
		self::set_session_notices( $notices );
	}

	/**
	 * Stores a notice persistently in the database.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string,mixed> $notice The notice data.
	 * @return void
	 */
	private static function store_persistent_notice( array $notice ): void {
		$notices   = self::get_persistent_notices();
		$notices[] = $notice;
		update_option( self::NOTICES_OPTION, $notices );
	}

	/**
	 * Gets session notices.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string,mixed> Array of notice data.
	 */
	private static function get_session_notices(): array {
		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return array();
		}
		$transient_key   = 'picsart_notices_' . $user_id;
		$session_notices = get_transient( $transient_key );
		return is_array( $session_notices ) ? $session_notices : array();
	}

	/**
	 * Sets session notices.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string|int,mixed> $notices Array of notice data.
	 * @return void
	 */
	private static function set_session_notices( array $notices ): void {
		$user_id = get_current_user_id();

		if ( ! $user_id ) {
			return;
		}
		$transient_key = 'picsart_notices_' . $user_id;
		if ( empty( $notices ) ) {
			delete_transient( $transient_key );
		} else {
			set_transient( $transient_key, $notices, 5 * MINUTE_IN_SECONDS ); // 5 minutes expiry
		}
	}

	/**
	 * Gets persistent notices from the database.
	 *
	 * @since 1.0.0
	 *
	 * @return array<string,mixed> Array of notice data.
	 */
	private static function get_persistent_notices(): array {
		return get_option( self::NOTICES_OPTION, array() );
	}

	/**
	 * Renders a single notice.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string,mixed> $notice The notice data.
	 * @return void
	 */
	private function render_notice( array $notice ): void {
		$classes = array( 'notice', 'notice-' . $notice['type'] );

		if ( $notice['dismissible'] ) {
			$classes[] = 'is-dismissible';
		}

		$class_string = implode( ' ', $classes );
		$notice_id    = $notice['id'];

		echo '<div class="' . esc_attr( $class_string ) . '" data-notice-id="' . esc_attr( $notice_id ) . '">';
		echo '<p>' . wp_kses_post( $notice['message'] ) . '</p>';

		if ( $notice['dismissible'] ) {
			echo '<button type="button" class="notice-dismiss picsart-notice-dismiss" data-notice-id="' . esc_attr( $notice_id ) . '">';
			echo '<span class="screen-reader-text">' . esc_html__( 'Dismiss this notice.', 'picsart-ai-image-editor' ) . '</span>';
			echo '</button>';
		}

		echo '</div>';

		if ( $notice['dismissible'] ) {
			wp_enqueue_script( 'picsart-admin-notices' );
		}
	}
}
