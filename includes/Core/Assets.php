<?php
/**
 * Assets
 *
 * @package Picsart
 */

namespace PICSART\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Assets {


	/**
	 * @return void
	 */
	public function run() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
	}

	/**
	 * Enqueue main CSS file in wp-admin only.
	 */
	public function enqueue_admin_assets(): void {
		if (
			! defined( 'PICSART_PLUGIN_FILE' ) ||
			! defined( 'PICSART_PLUGIN_VERSION' ) ||
			! defined( 'PICSART_PLUGIN_API_NAMESPACE' )
		) {
			return;
		}

		$options     = get_option( 'picsart_options' );
		$api_key     = $options['api_key'] ?? '';
		$property_id = $options['property_id'] ?? '';

		$plugin_dist_path = plugin_dir_path( PICSART_PLUGIN_FILE ) . 'dist/';
		$plugin_dist_url  = plugin_dir_url( PICSART_PLUGIN_FILE ) . 'dist/';

		$file_path = $plugin_dist_path . 'main.css';
		$file_url  = $plugin_dist_url . 'main.css';

		if ( file_exists( $file_path ) ) {
			wp_enqueue_style(
				'picsart-admin-styles',
				$file_url,
				array(),
				filemtime( $file_path ) ?: PICSART_PLUGIN_VERSION
			);
		}

		$file_path = $plugin_dist_path . 'loader.css';
		$file_url  = $plugin_dist_url . 'loader.css';

		if ( file_exists( $file_path ) ) {
			wp_enqueue_style(
				'picsart-loader-styles',
				$file_url,
				array(),
				filemtime( $file_path ) ?: PICSART_PLUGIN_VERSION
			);
		}

		$file_path = $plugin_dist_path . 'modal.css';
		$file_url  = $plugin_dist_url . 'modal.css';

		if ( file_exists( $file_path ) ) {
			wp_enqueue_style(
				'picsart-modal-styles',
				$file_url,
				array(),
				filemtime( $file_path ) ?: PICSART_PLUGIN_VERSION
			);
		}

		$file_path = $plugin_dist_path . 'admin.js';
		$file_url  = $plugin_dist_url . 'admin.js';

		if ( file_exists( $file_path ) ) {
			wp_enqueue_script(
				'picsart-admin-scripts',
				$file_url,
				array( 'wp-element' ),
				filemtime( $file_path ) ?: PICSART_PLUGIN_VERSION,
				true
			);

			wp_localize_script(
				'picsart-admin-scripts',
				'PICSART',
				array(
					'AJAX_URL'    => admin_url( 'admin-ajax.php' ),
					'REST_NONCE'  => wp_create_nonce( 'wp_rest' ),
					'REST_URL'    => rest_url() . PICSART_PLUGIN_API_NAMESPACE,
					'API_KEY'     => $api_key,
					'PROPERTY_ID' => $property_id,
				)
			);
		}

		wp_enqueue_script(
			'picsart-sdk-script',
			'https://sdk.picsart.io/cdn?v=1.13.1&key=sdk',
			array(),
			'1.13.1',
			true
		);

		$file_path = $plugin_dist_path . 'picsart-admin.js';
		$file_url  = $plugin_dist_url . 'picsart-admin.js';

		if ( file_exists( $file_path ) ) {
			wp_enqueue_script(
				'picsart-admin-global',
				$file_url,
				array( 'media-views', 'wp-data' ),
				filemtime( $file_path ) ?: PICSART_PLUGIN_VERSION,
				true
			);

			wp_localize_script(
				'picsart-admin-global',
				'picsart_admin_data',
				array(
					'messages' => array(
						'no_featured_image'   => __( 'This post does not have a featured image. Please set a featured image first.', 'picsart-ai-image-editor' ),
						'no_plugin_specified' => __( 'No operation specified. Please try again.', 'picsart-ai-image-editor' ),
						'invalid_image_url'   => __( 'Invalid image URL. Please try again.', 'picsart-ai-image-editor' ),
					),
					'form'     => $this->get_media_library_form_html(),
				)
			);
		}
	}

	/**
	 * Get media library form HTML for JavaScript injection
	 *
	 * @return array<mixed, mixed> Array of HTML components for media library actions.
	 */
	private function get_media_library_form_html(): array {
		if ( ! class_exists( 'PICSART\Helpers\Render' ) ) {
			return array();
		}

		return array(
			\PICSART\Helpers\Render::component(
				'Button',
				array(
					'label'      => __( 'Edit with Picsart', 'picsart-ai-image-editor' ),
					'type'       => 'button',
					'attributes' => array(
						'data-picsart-method'    => 'editor',
						'data-picsart-size'      => 'full',
						'data-picsart-post-id'   => 'null',
						'data-picsart-image-url' => '#',
					),
				),
				false
			),
			\PICSART\Helpers\Render::component(
				'Button',
				array(
					'label'       => __( 'Remove Background', 'picsart-ai-image-editor' ),
					'variant'     => 'secondary',
					'hidden_icon' => true,
					'type'        => 'submit',
					'attributes'  => array(
						'data-picsart-plugin'    => 'remove_bg',
						'data-picsart-post-id'   => 'null',
						'data-picsart-image-url' => '#',
					),
				),
				false
			),
			\PICSART\Helpers\Render::component(
				'UpscaleDropdown',
				array(
					'label'    => __( 'Upscale Image', 'picsart-ai-image-editor' ),
					'position' => 'top',
					'children' => array(
						array(
							'label'      => __( '2x', 'picsart-ai-image-editor' ),
							'attributes' => array(
								'data-picsart-plugin'    => 'upscale_image',
								'data-picsart-upscale'   => '2x',
								'data-picsart-image-url' => '#',
							),
						),
						array(
							'label'      => __( '4x', 'picsart-ai-image-editor' ),
							'attributes' => array(
								'data-picsart-plugin'    => 'upscale_image',
								'data-picsart-upscale'   => '4x',
								'data-picsart-image-url' => '#',
							),
						),
						array(
							'label'      => __( '8x', 'picsart-ai-image-editor' ),
							'attributes' => array(
								'data-picsart-plugin'    => 'upscale_image',
								'data-picsart-upscale'   => '8x',
								'data-picsart-image-url' => '#',
							),
						),
					),
				),
				false
			),
		);
	}
}
