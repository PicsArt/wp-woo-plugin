<?php
/**
 * Class responsible for rendering the Picsart button for the featured image metabox in the Classic Editor.
 *
 * @package Picsart
 * @since 1.0.0
 */

namespace PICSART\Admin;

use PICSART\Helpers\Render;
use PICSART\Helpers\Helpers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class ButtonForOldEditor
 *
 * Adds a custom Picsart editing button to the featured image section in the WordPress Classic Editor.
 *
 * @package PICSART\Admin
 * @since 1.0.0
 */
class ButtonForOldEditor {

	/**
	 * Initializes the class and registers the WordPress hook.
	 *
	 * @return void
	 * @since 1.0.0
	 */
	public function run(): void {
		add_filter( 'admin_post_thumbnail_html', array( $this, 'picsart_button_featured_image' ), 10, 2 );
	}

	/**
	 * Appends the Picsart button to the featured image metabox in the Classic Editor.
	 *
	 * @param string $content The current HTML content of the featured image metabox.
	 * @param int    $post_id The ID of the current post.
	 *
	 * @return string Modified HTML content with the added Picsart button.
	 * @since 1.0.0
	 */
	public function picsart_button_featured_image( string $content, int $post_id ): string {
		$image_url = get_the_post_thumbnail_url( $post_id, 'full' ) ?: 'null';
		$has_image = Helpers::post_has_featured_image( $post_id );

		$buttons = '<div data-picsart-form style="padding: 10px;">';

		$buttons .= Render::component(
			'Button',
			array(
				'label'      => __( 'Edit with Picsart', 'picsart-ai-image-editor' ),
				'type'       => 'button',
				'attributes' => array(
					'data-picsart-method'    => 'editor',
					'data-picsart-image-url' => $image_url,
					'data-picsart-post-id'   => $post_id,
					'data-picsart-size'      => 'full',
				),
			),
			false
		);

		// Show Remove Background and Upscale buttons only if image exists.
		if ( $has_image && 'null' !== $image_url ) {
			$buttons .= Render::component(
				'Button',
				array(
					'label'       => __( 'Remove Background', 'picsart-ai-image-editor' ),
					'variant'     => 'secondary',
					'hidden_icon' => true,
					'type'        => 'submit',
					'attributes'  => array(
						'data-picsart-plugin'    => 'remove_bg',
						'data-picsart-image-url' => $image_url,
						'data-picsart-post-id'   => $post_id,
					),
				),
				false
			);

			$buttons .= Render::component(
				'UpscaleDropdown',
				array(
					'label'    => __( 'Upscale Image', 'picsart-ai-image-editor' ),
					'position' => 'bottom',
					'children' => array(
						array(
							'label'      => __( '2x', 'picsart-ai-image-editor' ),
							'attributes' => array(
								'data-picsart-plugin'    => 'upscale_image',
								'data-picsart-upscale'   => '2x',
								'data-picsart-image-url' => $image_url,
								'data-picsart-post-id'   => $post_id,
							),
						),
						array(
							'label'      => __( '4x', 'picsart-ai-image-editor' ),
							'attributes' => array(
								'data-picsart-plugin'    => 'upscale_image',
								'data-picsart-upscale'   => '4x',
								'data-picsart-image-url' => $image_url,
								'data-picsart-post-id'   => $post_id,
							),
						),
						array(
							'label'      => __( '8x', 'picsart-ai-image-editor' ),
							'attributes' => array(
								'data-picsart-plugin'    => 'upscale_image',
								'data-picsart-upscale'   => '8x',
								'data-picsart-image-url' => $image_url,
								'data-picsart-post-id'   => $post_id,
							),
						),
					),
				),
				false
			);
		}

		$buttons .= '</div>';

		return $content . $buttons;
	}
}
