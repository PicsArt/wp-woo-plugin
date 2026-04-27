<?php
/**
 * Handles activation webhook requests from Picsart.
 *
 * @package Picsart
 * @subpackage Webhooks
 */

namespace PICSART\Webhooks;

defined( 'ABSPATH' ) || exit;

/**
 * Class Activation
 *
 * Provides a REST endpoint to receive activation data (like API key)
 * from Picsart backend and store it in WordPress options.
 *
 * @since 1.0.0
 */
class Activation {

	/**
	 * REST endpoint slug.
	 *
	 * @var string
	 */
	const ENDPOINT = 'activate';

	/**
	 * List of allowed IP addresses for this webhook.
	 *
	 * @var string[]
	 */
	const ALLOWED_IP = array(
		'127.0.0.1',
	);

	/**
	 * Registers the REST API endpoint during WordPress initialization.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function run() {
		add_action( 'rest_api_init', array( $this, 'register_endpoint' ) );
	}

	/**
	 * Registers the REST endpoint under the plugin's namespace.
	 *
	 * Endpoint: /{REST_URL}/{PICSART_PLUGIN_API_NAMESPACE}/activate
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_endpoint() {
		if ( ! defined( 'PICSART_PLUGIN_API_NAMESPACE' ) ) {
			return;
		}

		register_rest_route(
			PICSART_PLUGIN_API_NAMESPACE,
			self::ENDPOINT,
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_request' ),
				'permission_callback' => array( $this, 'check_ip_permission' ),
			)
		);
	}

	/**
	 * Verifies that the incoming request is from an allowed IP address.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if the client IP is allowed, false otherwise.
	 */
	public function check_ip_permission() {
		$server_data  = wp_unslash( $_SERVER );
		$forwarded_ip = isset( $server_data['HTTP_X_FORWARDED_FOR'] ) ? wp_unslash( $server_data['HTTP_X_FORWARDED_FOR'] ) : '';
		$remote_ip    = isset( $server_data['REMOTE_ADDR'] ) ? wp_unslash( $server_data['REMOTE_ADDR'] ) : '';
		$raw_ip       = $forwarded_ip ?: $remote_ip;

		if ( strpos( $raw_ip, ',' ) !== false ) {
			$raw_ip = explode( ',', $raw_ip )[0];
		}

		$client_ip = sanitize_text_field( trim( $raw_ip ) );

		return in_array( $client_ip, self::ALLOWED_IP, true );
	}

	/**
	 * Handles the activation webhook request from Picsart.
	 *
	 * Expects the following POST parameters:
	 * - `api_key` (string)      The API key issued by Picsart.
	 * - `property_id` (string)  The associated property ID.
	 *
	 * @since 1.0.0
	 *
	 * @param \WP_REST_Request $request The REST request object.
	 *
	 * @return \WP_REST_Response Response object with status or error message.
	 */
	public function handle_request( \WP_REST_Request $request ) {
		$api_key     = sanitize_text_field( $request->get_param( 'api_key' ) );
		$property_id = sanitize_text_field( $request->get_param( 'property_id' ) );

		if ( empty( $api_key ) || empty( $property_id ) ) {
			return new \WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => __( 'Missing API_KEY or PROPERTY_ID', 'picsart-ai-image-editor' ),
				),
				400
			);
		}

		update_option(
			'picsart_options',
			array(
				'api_key'     => $api_key,
				'property_id' => $property_id,
			)
		);

		return new \WP_REST_Response(
			array( 'status' => 'success' ),
			200
		);
	}
}
