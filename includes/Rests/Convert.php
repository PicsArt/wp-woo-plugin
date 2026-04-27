<?php
/**
 * REST controller for converting and saving external images.
 *
 * Provides a REST endpoint for downloading an image from a URL,
 * saving it to the WordPress media library and optionally assigning it
 * as a featured image to a post.
 *
 * @package Picsart
 * @subpackage REST
 * @since 1.0.0
 */

namespace PICSART\Rests;

use PICSART\API\PicsartAPI;
use PICSART\Helpers\Helpers;
use PICSART\Helpers\APIErrorHandler;
use WP_REST_Request;
use WP_REST_Response;

defined( 'ABSPATH' ) || exit;

/**
 * Class Convert
 *
 * Handles REST API logic for converting and storing remote images.
 *
 * @since 1.0.0
 */
class Convert {

	/**
	 * Endpoint path to be registered under the REST namespace.
	 *
	 * @var string
	 */
	private const ENDPOINT = 'convert';

	/**
	 * Initializes the class logic and registers WordPress hooks.
	 *
	 * @return void
	 * @since 1.0.0
	 */
	public function run(): void {
		add_action( 'rest_api_init', array( $this, 'register_endpoint' ) );
	}

	/**
	 * Registers the REST endpoint under the plugin namespace.
	 *
	 * Expected route: /{REST_URL}/{PICSART_PLUGIN_API_NAMESPACE}/convert
	 *
	 * @return void
	 * @since 1.0.0
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
				'permission_callback' => array( $this, 'check_permissions' ),
			)
		);
	}

	/**
	 * Checks if the current user has permissions to use this endpoint.
	 *
	 * Users must have the capability to 'upload_files'.
	 * WordPress handles the 'wp_rest' nonce check automatically for cookie-authenticated users.
	 *
	 * @return bool
	 * @since 1.0.0
	 */
	public function check_permissions(): bool {
		// Check if the user has the capability to upload files.
		return current_user_can( 'upload_files' );
	}

	/**
	 * Handles the REST request to download and save the image.
	 *
	 * @param WP_REST_Request $request The REST request instance.
	 * @return WP_REST_Response JSON response with image ID and URL on success,
	 *                          or error message and 404 status on failure.
	 * @throws \Exception
	 * @since 1.0.0
	 */
	public function handle_request( WP_REST_Request $request ): WP_REST_Response {
		$image_url       = esc_url_raw( $request->get_param( 'image_url' ) );
		$post_id         = absint( $request->get_param( 'post_id' ) );
		$term_id         = absint( $request->get_param( 'term_id' ) );
		$plugin          = sanitize_key( $request->get_param( 'plugin' ) );
		$upscale_factor  = sanitize_key( $request->get_param( 'upscale_factor' ) );
		$context         = sanitize_key( $request->get_param( 'context' ) );
		$new_image_url   = null;
		$image_id        = null;
		$api_status_code = null;
		$response_body   = '';

		// Set the context for APIErrorHandler to control admin notices.
		APIErrorHandler::set_context( $context );

		if ( ! $image_url ) {
			$error_message = __( 'Image URL is required', 'picsart-ai-image-editor' );
			APIErrorHandler::handle_error( $error_message );
			APIErrorHandler::set_context( '' );
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => $error_message,
				),
				404
			);
		}

		if ( ! $plugin ) {
			$error_message = __( 'Plugin is not setting.', 'picsart-ai-image-editor' );
			APIErrorHandler::handle_error( $error_message );
			APIErrorHandler::set_context( '' );
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => $error_message,
				),
				404
			);
		}

		switch ( $plugin ) {
			case 'remove_bg':
				$result          = $this->remove_bg( $image_url );
				$new_image_url   = $result['url'] ?? null;
				$api_status_code = $result['status_code'] ?? null;
				$response_body   = $result['response_body'] ?? '';
				break;
			case 'upscale_image':
				$result          = $this->upscale_image( $image_url, $upscale_factor );
				$new_image_url   = $result['url'] ?? null;
				$api_status_code = $result['status_code'] ?? null;
				$response_body   = $result['response_body'] ?? '';
				break;
			default:
				$error_message = __( 'Plugin is not set.', 'picsart-ai-image-editor' );
				APIErrorHandler::handle_error( $error_message );
				APIErrorHandler::set_context( '' );
				return new WP_REST_Response(
					array(
						'status'  => 'error',
						'message' => $error_message,
					),
					404
				);
		}

		if ( ! empty( $new_image_url ) && is_string( $new_image_url ) ) {
			$image_id = Helpers::save_image_to_media_library( $new_image_url );

			// Check if image was successfully saved.
			if ( 0 === $image_id ) {
				$error_message = __( 'Failed to save processed image to media library.', 'picsart-ai-image-editor' );
				APIErrorHandler::handle_error( $error_message );
				APIErrorHandler::set_context( '' );
				return new WP_REST_Response(
					array(
						'status'  => 'error',
						'message' => $error_message,
					),
					500
				);
			}
		} else {
			// Use appropriate error message based on API status code.
			if ( $api_status_code ) {
				$error_message = APIErrorHandler::get_user_error_message( $api_status_code, $context, $response_body );
				$http_code     = $api_status_code;
			} else {
				$error_message = __( 'Failed to process image with the selected plugin.', 'picsart-ai-image-editor' );
				$http_code     = 500;
			}
			APIErrorHandler::handle_error( $error_message );
			APIErrorHandler::set_context( '' );
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => $error_message,
				),
				$http_code
			);
		}

		if ( ! empty( $post_id ) ) {
			Helpers::assign_image_to_post( (int) $post_id, $image_id );
		}

		if ( ! empty( $term_id ) ) {
			Helpers::assign_image_to_term( (int) $term_id, $image_id );
		}

		// Handle success and show notice based on context.
		APIErrorHandler::handle_success( $plugin, null, $image_id );

		APIErrorHandler::set_context( '' );

		return new WP_REST_Response(
			array(
				'status'  => 'success',
				'result'  => array(
					'image_id'  => $image_id,
					'image_url' => $image_url,
					'body'      => $new_image_url,
				),
				'message' => APIErrorHandler::get_success_message( $plugin, $image_id ),
			),
			200
		);
	}

	/**
	 * Calls PicsartAPI to remove the background from the given image URL.
	 *
	 * @param string $image_url URL to the image.
	 * @return array<mixed> Array with 'url', 'status_code', and 'response_body'.
	 * @since 1.0.0
	 */
	private function remove_bg( string $image_url ): array {
		$settings = get_option( 'picsart_options' );
		$bg_color = null;

		if ( ! empty( $settings['remove_bg_color'] ) && 'transparent' !== $settings['remove_bg_color'] ) {
			$bg_color = $settings['remove_bg_color'];
		}

		try {
			$picsart  = new PicsartAPI();
			$response = $picsart->remove_bg(
				$image_url,
				array(
					'bg_color' => $bg_color,
				)
			);

			$response_code = $response['status'] ?? 0;
			$response_body = $response['body'] ?? '';

			// API errors are now handled in PicsartAPI class.
			if ( ! $response_code || ! APIErrorHandler::is_success_response( $response_code ) ) {
				return array(
					'url'           => false,
					'status_code'   => $response_code,
					'response_body' => $response_body,
				);
			}

			$json_body = $response['body'] ?? '';
			// Decode the JSON response body.
			if ( is_string( $json_body ) ) {
				$body_data = json_decode( $json_body, true );
			} else {
				// If the body is not a string, return false.
				return array(
					'url'           => false,
					'status_code'   => $response_code,
					'response_body' => $response_body,
				);
			}

			if ( isset( $body_data['data']['url'] ) ) {
				return array(
					'url'           => $body_data['data']['url'] ?? false,
					'status_code'   => $response_code,
					'response_body' => $response_body,
				);
			}

			return array(
				'url'           => false,
				'status_code'   => $response_code,
				'response_body' => $response_body,
			);
		} catch ( \Exception $e ) {
			// Error handling is already done in PicsartAPI.
			// The exception message is already user-friendly from APIErrorHandler.
			return array(
				'url'           => false,
				'status_code'   => 500, // We don't have the actual status code here.
				'response_body' => wp_json_encode( array( 'detail' => $e->getMessage() ) ),
			);
		}
	}

	/**
	 * Upscales an image using Picsart API.
	 *
	 * @param string $image_url URL to the image.
	 * @param string $upscale_factor Upscale factor (2x, 4x, 8x).
	 * @return array<mixed> Array with 'url', 'status_code', and 'response_body'.
	 * @since 1.0.0
	 */
	private function upscale_image( string $image_url, string $upscale_factor = '2x' ): array {
		// Default upscale factor if not provided.
		if ( empty( $upscale_factor ) ) {
			$upscale_factor = '2x';
		}

		// Convert upscale factor from "2x" format to "2" format for API.
		$upscale_value = str_replace( 'x', '', $upscale_factor );

		// Get format from input image URL, fallback to JPG.
		$format = $this->get_image_format_from_url( $image_url );
		if ( empty( $format ) ) {
			$format = 'JPG';
		}

		try {
			$picsart  = new PicsartAPI();
			$response = $picsart->upscale_image(
				$image_url,
				array(
					'upscale_factor' => $upscale_value,
					'format'         => $format,
				)
			);

			$response_code = $response['status'] ?? 0;
			$response_body = $response['body'] ?? '';

			// API errors are now handled in PicsartAPI class.
			if ( ! $response_code || ! APIErrorHandler::is_success_response( $response_code ) ) {
				return array(
					'url'           => false,
					'status_code'   => $response_code,
					'response_body' => $response_body,
				);
			}

			$json_body = $response['body'] ?? '';
			// Decode the JSON response body.
			if ( is_string( $json_body ) ) {
				$body_data = json_decode( $json_body, true );
			} else {
				// If the body is not a string, return false.
				return array(
					'url'           => false,
					'status_code'   => $response_code,
					'response_body' => $response_body,
				);
			}

			if ( isset( $body_data['data']['url'] ) ) {
				return array(
					'url'           => $body_data['data']['url'] ?? false,
					'status_code'   => $response_code,
					'response_body' => $response_body,
				);
			}

			return array(
				'url'           => false,
				'status_code'   => $response_code,
				'response_body' => $response_body,
			);
		} catch ( \Exception $e ) {
			// Error handling is already done in PicsartAPI.
			// The exception message is already user-friendly from APIErrorHandler.
			return array(
				'url'           => false,
				'status_code'   => 500, // We don't have the actual status code here.
				'response_body' => wp_json_encode( array( 'detail' => $e->getMessage() ) ),
			);
		}
	}

	/**
	 * Extracts image format from URL.
	 *
	 * @param string $image_url URL to the image.
	 * @return string|null Image format (JPG, PNG, WEBP) or null if not detected.
	 * @since 1.0.0
	 */
	private function get_image_format_from_url( string $image_url ): ?string {
		// Parse URL to get path.
		$parsed_url = wp_parse_url( $image_url );
		if ( ! isset( $parsed_url['path'] ) ) {
			return null;
		}

		// Get file extension.
		$path_info = pathinfo( $parsed_url['path'] );
		$extension = strtolower( $path_info['extension'] ?? '' );

		// Map extensions to API format values.
		$format_map = array(
			'jpg'  => 'JPG',
			'jpeg' => 'JPG',
			'png'  => 'PNG',
			'webp' => 'WEBP',
		);

		return $format_map[ $extension ] ?? null;
	}
}
