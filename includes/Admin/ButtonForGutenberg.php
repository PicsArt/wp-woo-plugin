<?php
/**
 * Class responsible for rendering Picsart button for feature image in gutenberg.
 *
 * @package Picsart
 */

namespace PICSART\Admin;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ButtonForGutenberg {
	/**
	 * @return void
	 */
	public function run(): void {
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_image_button_assets' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_feature_image_button_assets' ) );
	}

	/**
	 * @return void
	 */
	public function enqueue_block_image_button_assets(): void {
		if ( ! defined( 'PICSART_PLUGIN_FILE' ) || ! defined( 'PICSART_PLUGIN_VERSION' ) ) {
			return;
		}

		wp_enqueue_script(
			'picsart-block-image-button',
			plugin_dir_url( PICSART_PLUGIN_FILE ) . 'dist/block-image-button.js',
			array(
				'wp-blocks',
				'wp-blocks',
				'wp-element',
				'wp-block-editor',
				'wp-components',
				'wp-compose',
				'wp-hooks',
				'wp-i18n',
			),
			filemtime( plugin_dir_path( PICSART_PLUGIN_FILE ) . 'dist/block-image-button.js' ) ?: PICSART_PLUGIN_VERSION,
			true
		);
	}

	/**
	 * @return void
	 */
	public function enqueue_feature_image_button_assets(): void {
		if ( ! defined( 'PICSART_PLUGIN_FILE' ) || ! defined( 'PICSART_PLUGIN_VERSION' ) ) {
			return;
		}

		wp_enqueue_script(
			'picsart-feature-image-button',
			plugin_dir_url( PICSART_PLUGIN_FILE ) . 'dist/feature-image-button.js',
			array(
				'wp-blocks',
				'wp-element',
				'wp-edit-post',
				'wp-components',
				'wp-data',
				'wp-hooks',
				'wp-plugins',
				'wp-compose',
			),
			filemtime( plugin_dir_path( PICSART_PLUGIN_FILE ) . 'dist/feature-image-button.js' ) ?: PICSART_PLUGIN_VERSION,
			true
		);

		wp_localize_script(
			'picsart-feature-image-button',
			'picsart_gutenberg_data',
			array(
				'edit_button'      => \PICSART\Helpers\Render::component(
					'Button',
					array(
						'label'      => __( 'Edit with Picsart', 'picsart-ai-image-editor' ),
						'type'       => 'button',
						'attributes' => array(
							'data-picsart-method'    => 'editor',
							'data-picsart-image-url' => '#',
							'data-picsart-post-id'   => 'null',
							'data-picsart-size'      => 'full',
						),
					),
					false
				),
				'remove_bg_button' => \PICSART\Helpers\Render::component(
					'Button',
					array(
						'label'       => __( 'Remove Background', 'picsart-ai-image-editor' ),
						'variant'     => 'secondary',
						'hidden_icon' => true,
						'type'        => 'button',
						'attributes'  => array(
							'data-picsart-plugin'    => 'remove_bg',
							'data-picsart-image-url' => '#',
							'data-picsart-post-id'   => 'null',
						),
					),
					false
				),
				'upscale_dropdown' => \PICSART\Helpers\Render::component(
					'UpscaleDropdown',
					array(
						'label'    => __( 'Upscale Image', 'picsart-ai-image-editor' ),
						'position' => 'bottom',
						'children' => array(
							array(
								'label'      => __( '2x', 'picsart-ai-image-editor' ),
								'attributes' => array(
									'data-picsart-plugin'  => 'upscale_image',
									'data-picsart-upscale' => '2x',
									'data-picsart-image-url' => '#',
									'data-picsart-post-id' => 'null',
								),
							),
							array(
								'label'      => __( '4x', 'picsart-ai-image-editor' ),
								'attributes' => array(
									'data-picsart-plugin'  => 'upscale_image',
									'data-picsart-upscale' => '4x',
									'data-picsart-image-url' => '#',
									'data-picsart-post-id' => 'null',
								),
							),
							array(
								'label'      => __( '8x', 'picsart-ai-image-editor' ),
								'attributes' => array(
									'data-picsart-plugin'  => 'upscale_image',
									'data-picsart-upscale' => '8x',
									'data-picsart-image-url' => '#',
									'data-picsart-post-id' => 'null',
								),
							),
						),
					),
					false
				),
			)
		);
	}
}
