<?php
/**
 * Class responsible for rendering Picsart buttons on taxonomy edit pages.
 *
 * @package Picsart
 */

namespace PICSART\Admin;

use PICSART\Helpers\Helpers;
use PICSART\Helpers\Render;
use WP_Term;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class TaxonomyEdit {

	/**
	 * Initialize hooks for taxonomy edit pages.
	 *
	 * @return void
	 */
	public function run(): void {
		// Add buttons to taxonomy edit pages (like product_cat).
		add_action( 'init', array( $this, 'add_taxonomy_edit_hooks' ) );
	}

	/**
	 * Add hooks for taxonomy edit pages.
	 *
	 * @return void
	 */
	public function add_taxonomy_edit_hooks(): void {
		// Get all public taxonomies.
		$taxonomies = get_taxonomies( array( 'public' => true ), 'names' );

		foreach ( $taxonomies as $taxonomy ) {
			// Add action hooks for each taxonomy edit form.
			add_action( "{$taxonomy}_edit_form_fields", array( $this, 'add_picsart_buttons_to_taxonomy_edit' ), 10, 1 );
		}
	}

	/**
	 * Add Picsart buttons to taxonomy edit forms.
	 *
	 * @param WP_Term $term The term being edited.
	 *
	 * @return void
	 */
	public function add_picsart_buttons_to_taxonomy_edit( WP_Term $term ): void {
		// Check if this taxonomy supports thumbnails.
		if ( ! Helpers::taxonomy_supports_thumbnails( $term->taxonomy ) ) {
			return;
		}

		// Get term meta image or fallback to null.
		$term_image_id = get_term_meta( $term->term_id, 'thumbnail_id', true );
		$image_url     = null;
		$has_image     = false;

		if ( $term_image_id ) {
			$image_url = wp_get_attachment_image_url( $term_image_id, 'full' );
			$has_image = ! empty( $image_url );
		}

		?>
		<tr class="form-field picsart-taxonomy-buttons">
			<th scope="row">
				<label><?php esc_html_e( 'Picsart Tools', 'picsart-ai-image-editor' ); ?></label>
			</th>
			<td>
				<div data-picsart-form>
					<?php
					Render::component(
						'Button',
						array(
							'label'      => esc_attr__( 'Edit with Picsart', 'picsart-ai-image-editor' ),
							'type'       => 'button',
							'attributes' => array(
								'data-picsart-method'    => 'editor',
								'data-picsart-image-url' => esc_url( $image_url ?: 'null' ),
								'data-picsart-term-id'   => esc_attr( (string) $term->term_id ),
								'data-picsart-size'      => 'full',
							),
						),
						true
					);

					// Show Remove Background and Upscale buttons only if image exists.
					if ( $has_image && is_string( $image_url ) ) {
						Render::component(
							'Button',
							array(
								'label'       => esc_attr__( 'Remove Background', 'picsart-ai-image-editor' ),
								'variant'     => 'secondary',
								'hidden_icon' => true,
								'type'        => 'button',
								'attributes'  => array(
									'data-picsart-plugin'  => 'remove_bg',
									'data-picsart-image-url' => esc_url( $image_url ),
									'data-picsart-term-id' => esc_attr( (string) $term->term_id ),
								),
							),
							true
						);

						Render::component(
							'UpscaleDropdown',
							array(
								'label'    => esc_attr__( 'Upscale Image', 'picsart-ai-image-editor' ),
								'position' => 'bottom',
								'children' => array(
									array(
										'label'      => esc_attr__( '2x', 'picsart-ai-image-editor' ),
										'attributes' => array(
											'data-picsart-plugin'    => 'upscale_image',
											'data-picsart-upscale'   => '2x',
											'data-picsart-image-url' => esc_url( $image_url ),
											'data-picsart-term-id'   => esc_attr( (string) $term->term_id ),
										),
									),
									array(
										'label'      => __( '4x', 'picsart-ai-image-editor' ),
										'attributes' => array(
											'data-picsart-plugin'    => 'upscale_image',
											'data-picsart-upscale'   => '4x',
											'data-picsart-image-url' => esc_url( $image_url ),
											'data-picsart-term-id'   => esc_attr( (string) $term->term_id ),
										),
									),
									array(
										'label'      => __( '8x', 'picsart-ai-image-editor' ),
										'attributes' => array(
											'data-picsart-plugin'    => 'upscale_image',
											'data-picsart-upscale'   => '8x',
											'data-picsart-image-url' => esc_url( $image_url ),
											'data-picsart-term-id'   => esc_attr( (string) $term->term_id ),
										),
									),
								),
							),
							true
						);
					}
					?>
				</div>
				<p class="description">
					<?php esc_html_e( 'Edit the image using Picsart tools.', 'picsart-ai-image-editor' ); ?>
				</p>
			</td>
		</tr>
		<?php
	}
}
