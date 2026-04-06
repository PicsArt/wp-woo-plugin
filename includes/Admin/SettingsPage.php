<?php
/**
 * Class SettingsPage
 *
 * Handles the admin settings page for the Picsart Editor integration in WordPress.
 *
 * @package PICSART
 */

namespace PICSART\Admin;

use PICSART\Helpers\Render;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class SettingsPage
 *
 * Creates a settings page for Picsart Editor integration inside the WordPress admin panel.
 * Includes API key and image-related configuration for site admins.
 */
class SettingsPage {

	/**
	 * @var array<string,string> ALLOWED_COLORS List of allowed colors for background removal.
	 */
	private const ALLOWED_COLORS = array(
		'multicolor'  => '',
		'transparent' => '',
		'#FFFFFF'     => '',
		'#000000'     => '',
		'#7D7D7D'     => '',
		'#C0C0C0'     => '',
		'#0066FF'     => '',
		'#55CCFF'     => '',
		'#68F936'     => '',
		'#FF9330'     => '',
		'#FF1D1E'     => '',
		'#FF25A8'     => '',
	);

	/**
	 * Initializes WordPress hooks to register the settings page and load required assets.
	 *
	 * @return void
	 */
	public function run(): void {
		add_action( 'admin_menu', array( $this, 'register_settings_page' ) );
		add_action( 'admin_init', array( $this, 'settings_init' ) );
		add_action( 'admin_init', array( $this, 'handle_url_parameters' ) );

		add_action(
			'admin_enqueue_scripts',
			function ( $hook ) {
				if ( 'woocommerce_page_picsart-settings' === $hook || 'toplevel_page_picsart-settings' === $hook ) {
					wp_enqueue_media();
					wp_enqueue_style( 'wp-color-picker' );
					wp_enqueue_script( 'wp-color-picker' );
				}
			}
		);
	}

	/**
	 * Registers the settings page under WooCommerce (if active) or as a top-level admin menu item.
	 *
	 * @return void
	 */
	public function register_settings_page(): void {
		if ( ! defined( 'PICSART_PLUGIN_FILE' ) ) {
			return;
		}

		if ( class_exists( 'WooCommerce' ) ) {
			add_submenu_page(
				'woocommerce',
				__( 'Picsart Editor', 'picsart-ai-image-editor' ),
				__( 'Picsart Editor', 'picsart-ai-image-editor' ),
				'manage_options',
				'picsart-settings',
				array( $this, 'render_settings_page' )
			);
		} else {
			add_menu_page(
				__( 'Picsart', 'picsart-ai-image-editor' ),
				__( 'Picsart', 'picsart-ai-image-editor' ),
				'manage_options',
				'picsart-settings',
				array( $this, 'render_settings_page' ),
				plugins_url( 'assets/icons/picsart-icon.png', PICSART_PLUGIN_FILE ),
				99
			);
		}
	}

	/**
	 * Registers settings, sections, and fields for the Picsart options page.
	 *
	 * @return void
	 */
	public function settings_init(): void {
		register_setting(
			'picsart_settings_group',
			'picsart_options',
			array(
				'sanitize_callback' => array( $this, 'sanitize_picsart_options' ),
			)
		);

		add_settings_section(
			'picsart_section_main',
			__( 'API Settings', 'picsart-ai-image-editor' ),
			function () {
				echo '<p style="margin: 0;">' . esc_html__( 'Configure your Picsart API credentials.', 'picsart-ai-image-editor' ) . '</p>';
			},
			'picsart_settings'
		);

		add_settings_field(
			'picsart_api_key',
			__( 'Picsart API Key', 'picsart-ai-image-editor' ),
			array( $this, 'picsart_field_api_key_render' ),
			'picsart_settings',
			'picsart_section_main'
		);

		add_settings_field(
			'picsart_property_id',
			__( 'Picsart Property ID', 'picsart-ai-image-editor' ),
			array( $this, 'picsart_field_property_id_render' ),
			'picsart_settings',
			'picsart_section_main'
		);

		add_settings_field(
			'picsart_customer_id',
			__( 'Picsart Customer ID', 'picsart-ai-image-editor' ),
			array( $this, 'picsart_field_customer_id_render' ),
			'picsart_settings',
			'picsart_section_main'
		);

		add_settings_section(
			'picsart_section_image',
			__( 'Image Settings', 'picsart-ai-image-editor' ),
			function () {
				echo '<p style="margin: 0;">' . esc_html__( 'Configure image settings for your product images.', 'picsart-ai-image-editor' ) . '</p>';
			},
			'picsart_settings'
		);

		add_settings_field(
			'picsart_watermark_image',
			__( 'Watermark Image', 'picsart-ai-image-editor' ),
			array( $this, 'picsart_field_watermark_image_render' ),
			'picsart_settings',
			'picsart_section_image'
		);

		add_settings_field(
			'picsart_watermark_radius',
			__( 'Watermark corner radius', 'picsart-ai-image-editor' ),
			array( $this, 'picsart_field_watermark_radius_render' ),
			'picsart_settings',
			'picsart_section_image'
		);

		add_settings_field(
			'picsart_remove_bg_color',
			__( 'Choose colour for Remove Background', 'picsart-ai-image-editor' ),
			array( $this, 'picsart_field_remove_bg_color_render' ),
			'picsart_settings',
			'picsart_section_image'
		);
	}

	/**
	 * Renders the actual HTML output for the settings page.
	 *
	 * @return void
	 */
	public function render_settings_page(): void {
		Render::view( 'SettingsPage' );
	}

	/**
	 * Renders the input field for API Key.
	 *
	 * @return void
	 */
	public function picsart_field_api_key_render(): void {
		$options = get_option( 'picsart_options' );
		Render::field(
			array(
				'type'        => 'text',
				'name'        => 'picsart_options[api_key]',
				'id'          => 'picsart_api_key',
				'value'       => $options['api_key'] ?? '',
				'description' => __( 'Enter your Picsart API key. You can find this in your Picsart account.', 'picsart-ai-image-editor' ),
				'attributes'  => array(
					'min'   => 0,
					'style' => 'width:350px;',
				),
			)
		);
	}

	/**
	 * Renders the input field for Property ID.
	 *
	 * @return void
	 */
	public function picsart_field_property_id_render(): void {
		$options = get_option( 'picsart_options' );
		Render::field(
			array(
				'type'        => 'text',
				'name'        => 'picsart_options[property_id]',
				'id'          => 'picsart_property_id',
				'value'       => $options['property_id'] ?? '',
				'description' => __( 'Enter your Picsart Property ID.', 'picsart-ai-image-editor' ),
				'attributes'  => array(
					'min'   => 0,
					'style' => 'width:350px;',
				),
			)
		);
	}

	/**
	 * Renders the input field for Customer ID.
	 *
	 * @return void
	 */
	public function picsart_field_customer_id_render(): void {
		$options = get_option( 'picsart_options' );
		Render::field(
			array(
				'type'        => 'text',
				'name'        => 'picsart_options[customer_id]',
				'id'          => 'picsart_customer_id',
				'value'       => $options['customer_id'] ?? '',
				'description' => __( 'Enter your Picsart Customer ID.', 'picsart-ai-image-editor' ),
				'attributes'  => array(
					'min'   => 0,
					'style' => 'width:350px;',
				),
			)
		);
	}

	/**
	 * Renders the media uploader field for watermark image.
	 *
	 * @return void
	 */
	public function picsart_field_watermark_image_render(): void {
		$options = get_option( 'picsart_options' );
		Render::field(
			array(
				'type'        => 'media',
				'name'        => 'picsart_options[watermark_image]',
				'id'          => 'picsart_watermark_image',
				'value'       => $options['watermark_image'] ?? '',
				'description' => __( 'Select an image to use as watermark for your product images.', 'picsart-ai-image-editor' ),
			)
		);
	}

	/**
	 * Renders the input field for watermark border radius.
	 *
	 * @return void
	 */
	public function picsart_field_watermark_radius_render(): void {
		$options = get_option( 'picsart_options' );
		Render::field(
			array(
				'type'       => 'border-radius',
				'name'       => 'picsart_options[watermark_radius]',
				'id'         => 'picsart_watermark_radius',
				'value'      => $options['watermark_radius'] ?? 4,
				'attributes' => array(
					'min'   => 0,
					'style' => 'width:80px;',
				),
			)
		);
	}

	/**
	 * Renders the color picker for background removal.
	 *
	 * @return void
	 */
	public function picsart_field_remove_bg_color_render(): void {
		$options = get_option( 'picsart_options' );
		Render::field(
			array(
				'type'    => 'radio-colors',
				'name'    => 'picsart_options[remove_bg_color]',
				'id'      => 'picsart_remove_bg_color',
				'value'   => $options['remove_bg_color'] ?? '',
				'options' => self::ALLOWED_COLORS,
			)
		);
	}

	/**
	 * Handles the processing of URL parameters related to the plugin's settings.
	 *
	 * Validates user permissions and ensures the operation occurs on the correct page.
	 * Cleans input parameters and updates plugin options in the database if necessary.
	 * Triggers a success notification upon successful update.
	 *
	 * @return void
	 */
	public function handle_url_parameters() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$data = wp_slash( $_GET ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		if ( isset( $data['page'] ) && 'picsart-settings' === $data['page'] ) {

			$api_key     = isset( $data['api_key'] ) ? sanitize_text_field( $data['api_key'] ) : null;
			$property_id = isset( $data['property_id'] ) ? sanitize_text_field( $data['property_id'] ) : null;

			if ( null !== $api_key || null !== $property_id ) {
				$options = get_option( 'picsart_options', array() );
				if ( ! is_array( $options ) ) {
					$options = array();
				}
				if ( null !== $api_key ) {
					$options['api_key'] = $api_key;
				}
				if ( null !== $property_id ) {
					$options['property_id'] = $property_id;
				}

				update_option( 'picsart_options', $options );
			}
		}
	}

	/**
	 * Sanitizes the plugin options before saving to the database.
	 *
	 * @param array<string,mixed>|null $input The input data from the settings form.
	 *
	 * @return array<string,mixed> The sanitized data.
	 */
	public function sanitize_picsart_options( $input ): array {
		// Start with the existing options to preserve any not in the form.
		$output = get_option( 'picsart_options', array() );

		if ( ! is_array( $output ) ) {
			$output = array();
		}

		if ( ! is_array( $input ) ) {
			$input = array();
		}

		$options = array_merge( $output, $input );

		$clean_output = array();

		// Sanitize API Key.
		$clean_output['api_key'] = isset( $options['api_key'] )
			? sanitize_text_field( $options['api_key'] )
			: '';

		// Sanitize Property ID.
		$clean_output['property_id'] = isset( $options['property_id'] )
			? sanitize_text_field( $options['property_id'] )
			: '';

		// Sanitize Customer ID.
		$clean_output['customer_id'] = isset( $options['customer_id'] )
			? sanitize_text_field( $options['customer_id'] )
			: '';

		// Sanitize Watermark Image (assuming 'media' field saves an attachment ID).
		$clean_output['watermark_image'] = isset( $options['watermark_image'] )
			? absint( $options['watermark_image'] )
			: '';

		// Sanitize Watermark Radius ('border-radius' field saves an integer).
		$clean_output['watermark_radius'] = isset( $options['watermark_radius'] )
			? absint( $options['watermark_radius'] )
			: 4;

		$clean_output['remove_bg_color'] = '';
		if ( isset( $options['remove_bg_color'] ) && in_array( $options['remove_bg_color'], array_keys( self::ALLOWED_COLORS ), true ) ) {
			$clean_output['remove_bg_color'] = $options['remove_bg_color'];
		}

		return $clean_output;
	}
}
