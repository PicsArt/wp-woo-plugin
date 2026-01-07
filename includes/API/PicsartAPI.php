<?php
/**
 * Class PicsartAPI
 *
 * Modular wrapper for interacting with the Picsart API.
 *
 * @package PICSART\API
 * @since 1.0.0
 */

namespace PICSART\API;

use PICVendor\GuzzleHttp\Client;
use PICVendor\GuzzleHttp\Exception\RequestException;
use PICSART\Helpers\APIErrorHandler;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PicsartAPI {

	/**
	 * Removes background from an image.
	 *
	 * @since 1.0.0
	 *
	 * @param string                          $image_path URL or local path to the image.
	 * @param array<string, string|int|float> $options Additional parameters for the API.
	 *
	 * @return array<string, string|int> ['body' => string, 'status' => int]
	 * @throws \Exception
	 */
	public function remove_bg( string $image_path, array $options = array() ): array {
		return $this->send_request( 'tools/1.0/removebg', $image_path, $options );
	}

	/**
	 * Upscales an image.
	 *
	 * @since 1.0.0
	 *
	 * @param string                          $image_path URL or local path to the image.
	 * @param array<string, string|int|float> $options Additional parameters for the API.
	 *
	 * @return array<string, string|int> ['body' => string, 'status' => int]
	 * @throws \Exception
	 */
	public function upscale_image( string $image_path, array $options = array() ): array {
		return $this->send_request( 'tools/1.0/upscale', $image_path, $options );
	}

	/**
	 * Sends a multipart POST request to the Picsart API.
	 *
	 * @since 1.0.0
	 *
	 * @param string                          $endpoint Picsart API endpoint path (e.g., tools/1.0/removebg).
	 * @param string                          $image_path URL or local path to the image.
	 * @param array<string, string|int|float> $options Optional request parameters.
	 *
	 * @return array<string, string|int> ['body' => string, 'status' => int]
	 * @throws \Exception
	 */
	protected function send_request( string $endpoint, string $image_path, array $options ): array {
		$api_key = $this->get_api_key();

		$multipart = $this->build_multipart( $image_path, $options );

		$client = new Client(
			array(
				'base_uri' => 'https://api.picsart.io/',
				'timeout'  => 10,
			)
		);

		try {
			$response = $client->post(
				$endpoint,
				array(
					'headers'   => array(
						'X-Picsart-API-Key' => $api_key,
					),
					'multipart' => $multipart,
				)
			);

			$status_code = $response->getStatusCode();
			$body        = (string) $response->getBody();

			// Check for API errors even on successful HTTP response.
			if ( ! APIErrorHandler::is_success_response( $status_code ) ) {
				APIErrorHandler::handle_api_error( $status_code, $body, $endpoint );
				// Return error response instead of throwing exception.
				return array(
					'body'   => $body,
					'status' => $status_code,
				);
			}

			return array(
				'body'   => $body,
				'status' => $status_code,
			);
		} catch ( RequestException $e ) {
			// @phpstan-ignore-next-line
			$status_code = $e->hasResponse() ? $e->getResponse()->getStatusCode() : 500;
			// @phpstan-ignore-next-line
			$error_body = $e->hasResponse() ? (string) $e->getResponse()->getBody() : '';

			// Handle API error through our error handler.
			APIErrorHandler::handle_api_error( $status_code, $error_body, $endpoint );

			// Return error response instead of throwing exception.
			return array(
				'body'   => $error_body,
				'status' => $status_code,
			);
		}
	}

	/**
	 * Builds a multipart array for Guzzle based on input and options.
	 *
	 * @since 1.0.0
	 *
	 * @param string                          $image_path Path or URL to the image.
	 * @param array<string, string|int|float> $options Extra fields for the request.
	 *
	 * @return array<int, array<string, mixed>> Guzzle multipart format.
	 * @throws \Exception
	 */
	protected function build_multipart( string $image_path, array $options ): array {
		$multipart = array();

		global $wp_filesystem;

		if ( filter_var( $image_path, FILTER_VALIDATE_URL ) ) {
			$multipart[] = array(
				'name'     => 'image_url',
				'contents' => $image_path,
			);
		} elseif ( file_exists( $image_path ) ) {
			$multipart[] = array(
				'name'     => 'image',
				'contents' => $wp_filesystem->get_contents( $image_path ),
				'filename' => basename( $image_path ),
			);
		} else {
			throw new \Exception( esc_attr( __( 'Invalid image path or URL.', 'picsart-ai-image-editor' ) ) );
		}

		foreach ( $options as $key => $value ) {
			$multipart[] = array(
				'name'     => $key,
				'contents' => $value,
			);
		}

		return $multipart;
	}

	/**
	 * Retrieves the Picsart API key from the WordPress options.
	 *
	 * @since 1.0.0
	 *
	 * @return string API key
	 * @throws \Exception If key is missing.
	 */
	protected function get_api_key(): string {
		$plugin_options = get_option( 'picsart_options' );
		$api_key        = $plugin_options['api_key'] ?? '';

		if ( empty( $api_key ) ) {
			throw new \Exception( esc_attr( __( 'Picsart API key not found. Please configure it in the settings.', 'picsart-ai-image-editor' ) ) );
		}

		return $api_key;
	}
}
