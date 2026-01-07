<?php
/**
 * REST controller for saving remote images in the media library.
 *
 * @package Picsart
 * @subpackage REST
 */

namespace PICSART\Rests;

use PICSART\Helpers\Helpers;
use PICSART\Helpers\APIErrorHandler;
use WP_REST_Request;
use WP_REST_Response;

defined( 'ABSPATH' ) || exit;

/**
 * Class SaveImage
 *
 * Provides a REST API endpoint for saving external images to the WordPress media library,
 * and optionally assigning them as featured images to posts.
 *
 * @since 1.0.0
 */
class SaveImage {

	/**
	 * REST route slug.
	 *
	 * @var string
	 */
	private const ENDPOINT = 'save-image';

	/**
	 * Registers the class's hooks with WordPress.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function run(): void {
		add_action( 'rest_api_init', array( $this, 'register_endpoint' ) );
	}

	/**
	 * Registers the REST API endpoint for image saving.
	 *
	 * Endpoint: /{REST_URL}/{PICSART_PLUGIN_API_NAMESPACE}/save-image
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_endpoint(): void {
		if ( ! defined( 'PICSART_PLUGIN_API_NAMESPACE' ) ) {
			return;
		}

		register_rest_route(
			PICSART_PLUGIN_API_NAMESPACE,
			self::ENDPOINT,
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => array( $this, 'check_nonce' ),
			)
		);
	}

	/**
	 * Validates the REST request using the X-WP-Nonce header.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The REST request instance.
	 * @return bool True if nonce is valid, false otherwise.
	 */
	public function check_nonce( WP_REST_Request $request ): bool {
		$nonce = $request->get_header( 'X-WP-Nonce' );

		if ( ! $nonce ) {
			return false;
		}

		return wp_verify_nonce( $nonce, 'wp_rest' ) !== false;
	}

	/**
	 * Handles the request to save a remote image to the media library.
	 *
	 * Optionally assigns the image as the featured image for a given post.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The REST request instance.
	 * @return WP_REST_Response JSON response with result data or error.
	 *
	 * @wp-rest-param string $image_url Required. Full URL of the image to save.
	 * @wp-rest-param int|null $post_id Optional. ID of the post to assign the image to.
	 */
	public function handle_request( WP_REST_Request $request ): WP_REST_Response {
		$image_url = esc_url_raw( $request->get_param( 'image_url' ) );
		$post_id   = absint( $request->get_param( 'post_id' ) );
		$term_id   = absint( $request->get_param( 'term_id' ) );

		if ( ! $image_url ) {
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => __( 'Image URL is required.', 'picsart-ai-image-editor' ),
				),
				404
			);
		}

		$image_id = Helpers::save_image_to_media_library( $image_url );

		if ( ! empty( $post_id ) ) {
			Helpers::assign_image_to_post( (int) $post_id, $image_id );
		}

		if ( ! empty( $term_id ) ) {
			Helpers::assign_image_to_term( (int) $term_id, $image_id );
		}

		return new WP_REST_Response(
			array(
				'status' => 'success',
				'result' => array(
					'image_id'  => $image_id,
					'image_url' => $image_url,
				),
			),
			200
		);
	}
}
