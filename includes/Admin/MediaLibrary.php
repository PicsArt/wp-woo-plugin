<?php
/**
 * Class responsible for rendering button on media library in both grid and list views.
 *
 * @package Picsart
 */

namespace PICSART\Admin;

use PICSART\Helpers\Render;
use WP_Post;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class MediaLibrary {

	/**
	 * @return void
	 */
	public function run(): void {
		add_filter( 'media_row_actions', array( $this, 'add_picsart_link_to_media_list' ), 10, 2 );
	}

	/**
	 * Adds Picsart "Edit" link to media library list view.
	 *
	 * @param string[] $actions Array of media row action links.
	 * @param WP_Post  $attachment Attachment post object.
	 *
	 * @since 1.0.0
	 * @return string[] Modified row actions with the Picsart link appended.
	 */
	public function add_picsart_link_to_media_list( array $actions, WP_Post $attachment ): array {
		// Only show for images.
		if ( ! wp_attachment_is_image( $attachment->ID ) ) {
			return $actions;
		}

		$image_url = wp_get_attachment_url( $attachment->ID );

		if ( ! $image_url ) {
			return $actions;
		}

		$picsart_link = Render::component(
			'ListButton',
			array(
				'label'      => __( 'Edit with Picsart', 'picsart-ai-image-editor' ),
				'variant'    => 'list',
				'attributes' => array(
					'data-picsart-method'    => 'editor',
					'data-picsart-image-url' => $image_url,
					'data-picsart-post-id'   => 'null',
					'data-picsart-size'      => 'full',
				),
			),
			false
		);

		$picsart_remove_bg = Render::component(
			'ListButton',
			array(
				'label'       => __( 'Remove Background', 'picsart-ai-image-editor' ),
				'variant'     => 'list',
				'hidden_icon' => true,
				'attributes'  => array(
					'data-picsart-plugin'    => 'remove_bg',
					'data-picsart-image-url' => $image_url,
					'data-picsart-post-id'   => 'null',
				),
			),
			false
		);

		$picsart_upscale = Render::component(
			'ListDropdown',
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
							'data-picsart-post-id'   => 'null',
						),
					),
					array(
						'label'      => __( '4x', 'picsart-ai-image-editor' ),
						'attributes' => array(
							'data-picsart-plugin'    => 'upscale_image',
							'data-picsart-upscale'   => '4x',
							'data-picsart-image-url' => $image_url,
							'data-picsart-post-id'   => 'null',
						),
					),
					array(
						'label'      => __( '8x', 'picsart-ai-image-editor' ),
						'attributes' => array(
							'data-picsart-plugin'    => 'upscale_image',
							'data-picsart-upscale'   => '8x',
							'data-picsart-image-url' => $image_url,
							'data-picsart-post-id'   => 'null',
						),
					),
				),
			),
			false
		);

		$actions['picsart_edit']      = $picsart_link;
		$actions['picsart_remove_bg'] = $picsart_remove_bg;
		$actions['picsart_upscale']   = $picsart_upscale;

		return $actions;
	}
}
