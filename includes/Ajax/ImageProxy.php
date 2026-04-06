<?php
/**
 * Class ImageProxy
 *
 * @package PICSART
 */

namespace PICSART\Ajax;

use PICSART\Helpers\APIErrorHandler;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class ImageProxy {

	/**
	 * Initializes WordPress hooks.
	 *
	 * @return void
	 */
	public function run(): void {
		add_action( 'wp_ajax_picsart_proxy', array( $this, 'picsart_proxy' ) );
	}

	/**
	 * Picsart Proxy.
	 *
	 * @return void
	 */
	public function picsart_proxy() {
		check_ajax_referer( 'picsart_proxy_nonce', 'nonce' );

		$url       = sanitize_url( wp_unslash( $_GET['url'] ?? '' ) );
		$image_url = esc_url_raw( $url );

		if ( ! filter_var( $image_url, FILTER_VALIDATE_URL ) ) {
			wp_send_json_error( __( 'Invalid URL provided', 'picsart-ai-image-editor' ) );
		}

		$response = wp_remote_get( $image_url );

		if ( is_wp_error( $response ) ) {
			wp_send_json_error( __( 'Failed to fetch image. Please check the URL and try again.', 'picsart-ai-image-editor' ) );
		}

		$status_code = wp_remote_retrieve_response_code( $response );

		// Check for HTTP errors.
		if ( ! APIErrorHandler::is_success_response( $status_code ) ) {
			$response_body = wp_remote_retrieve_body( $response );
			APIErrorHandler::handle_api_error( $status_code, $response_body, 'Image Proxy' );
			wp_send_json_error( APIErrorHandler::get_user_error_message( $status_code, 'image fetch', $response_body ) );
		}

		$content_type = wp_remote_retrieve_header( $response, 'content-type' );
		is_array( $content_type ) ? header( 'Content-Type: ' . $content_type[0] ) : header( 'Content-Type: ' . $content_type );
		header( 'Access-Control-Allow-Origin: *' );

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo wp_remote_retrieve_body( $response );
		exit;
	}
}
