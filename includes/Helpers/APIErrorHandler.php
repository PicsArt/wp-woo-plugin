<?php
/**
 * Helper class for handling Picsart API errors and responses.
 *
 * @package Picsart
 * @subpackage Helpers
 */

namespace PICSART\Helpers;

use PICSART\Helpers\AdminNotices;

defined( 'ABSPATH' ) || exit;

/**
 * Class APIErrorHandler
 *
 * Handles Picsart API error responses and provides user-friendly error messages
 * based on HTTP status codes and API error responses.
 *
 * @since 1.0.0
 */
class APIErrorHandler {

	/**
	 * Current request context to determine if admin notices should be shown.
	 *
	 * @var string
	 */
	private static string $current_context = '';

	/**
	 * Status page URL for checking service status.
	 *
	 * @var string
	 */
	private const STATUS_URL = 'https://status.picsart.io/';

	/**
	 * Support email for technical issues.
	 *
	 * @var string
	 */
	private const SUPPORT_EMAIL = 'apitechsupport@picsart.com';

	/**
	 * Sets the current request context.
	 *
	 * @since 1.0.0
	 *
	 * @param string $context The request context (e.g., 'gutenberg').
	 * @return void
	 */
	public static function set_context( string $context ): void {
		self::$current_context = $context;
	}

	/**
	 * Gets the current request context.
	 *
	 * @since 1.0.0
	 *
	 * @return string The current request context.
	 */
	public static function get_context(): string {
		return self::$current_context;
	}

	/**
	 * Checks if admin notices should be shown based on current context.
	 *
	 * @since 1.0.0
	 *
	 * @return bool True if admin notices should be shown, false otherwise.
	 */
	public static function should_show_admin_notice(): bool {
		return 'gutenberg' !== self::$current_context;
	}

	/**
	 * Gets localized error messages for given status code.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $status_code HTTP status code.
	 * @return array<string, string> Localized error messages.
	 */
	private static function get_localized_messages( mixed $status_code ): array {
		$default_messages = array(
			'user'  => __( 'An unexpected error occurred. Please try again.', 'picsart-ai-image-editor' ),
			// translators: %d: HTTP status code.
			'admin' => sprintf( __( 'Unknown error: HTTP %d', 'picsart-ai-image-editor' ), $status_code ),
		);

		if ( ! is_int( $status_code ) ) {
			return $default_messages;
		}

		$messages_map = array(
			400 => array(
				'user'  => __( 'Invalid request. Please check your input and try again.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Bad request: Invalid syntax or missing required parameters.', 'picsart-ai-image-editor' ),
			),
			401 => array(
				'user'  => __( 'Authentication failed. Please check your API key configuration.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Unauthorized: API key is missing or invalid. Check plugin settings.', 'picsart-ai-image-editor' ),
			),
			402 => array(
				'user'  => __( 'Payment required. You have reached your API usage limit.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Payment required: Credits exhausted or subscription limit reached.', 'picsart-ai-image-editor' ),
			),
			403 => array(
				'user'  => __( 'Access denied. You don\'t have permission to perform this action.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Forbidden: Insufficient permissions for this API key.', 'picsart-ai-image-editor' ),
			),
			404 => array(
				'user'  => __( 'Resource not found. The requested image or service is unavailable.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Not found: Invalid API endpoint or image URL.', 'picsart-ai-image-editor' ),
			),
			405 => array(
				'user'  => __( 'Operation not supported. Please try a different action.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Method not allowed: Incorrect HTTP method used.', 'picsart-ai-image-editor' ),
			),
			406 => array(
				'user'  => __( 'Request format not acceptable. Please try again.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Not acceptable: Missing or invalid Accept header (application/json required).', 'picsart-ai-image-editor' ),
			),
			413 => array(
				'user'  => __( 'File too large. Please use a smaller image.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Request entity too large: File size exceeds maximum limit.', 'picsart-ai-image-editor' ),
			),
			415 => array(
				'user'  => __( 'Unsupported file format. Please use a supported image format.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Unsupported media type: Invalid Content-Type header or file format.', 'picsart-ai-image-editor' ),
			),
			422 => array(
				'user'  => __( 'Unable to process your request. Please check your image and try again.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Unprocessable content: Invalid parameters or inaccessible image URL.', 'picsart-ai-image-editor' ),
			),
			429 => array(
				'user'  => __( 'Too many requests. Please wait a moment and try again.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Rate limit exceeded: Too many API calls in the given time period.', 'picsart-ai-image-editor' ),
			),
			431 => array(
				'user'  => __( 'Request too large. Please try again with fewer parameters.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Request header fields too large: Headers exceed server limit.', 'picsart-ai-image-editor' ),
			),
			500 => array(
				'user'  => __( 'Server error occurred. Please try again later.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Internal server error: Unexpected condition on Picsart servers.', 'picsart-ai-image-editor' ),
			),
			503 => array(
				'user'  => __( 'Service temporarily unavailable. Please try again later.', 'picsart-ai-image-editor' ),
				'admin' => __( 'Service unavailable: Temporary outage or maintenance.', 'picsart-ai-image-editor' ),
			),
		);

		return $messages_map[ $status_code ] ?? $default_messages;
	}

	/**
	 * Handles API error response and shows appropriate notices.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed  $status_code HTTP status code.
	 * @param string $response_body API response body (optional).
	 * @param string $context Context where error occurred (optional).
	 * @param bool   $show_admin_notice Whether to show admin notice.
	 * @return array<string, mixed> Formatted error information.
	 */
	public static function handle_api_error( mixed $status_code, string $response_body = '', string $context = '', bool $show_admin_notice = null ): array {
		$error_info = self::get_error_info( $status_code, $response_body );

		// Add context if provided.
		if ( ! empty( $context ) ) {
			$error_info['context'] = $context;
		}

		// Show admin notice based on context or explicit parameter.
		$should_show_notice = $show_admin_notice ?? self::should_show_admin_notice();
		if ( $should_show_notice ) {
			self::show_error_notice( $error_info );
		}

		// Log error for debugging.
		self::log_api_error( $error_info );

		return $error_info;
	}

	/**
	 * Gets formatted error information based on status code.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed  $status_code HTTP status code.
	 * @param string $response_body API response body (optional).
	 * @return array<string, mixed> Error information array.
	 */
	public static function get_error_info( mixed $status_code, string $response_body = '' ): array {
		$messages = self::get_localized_messages( $status_code );

		$error_info = array(
			'status_code'          => $status_code,
			'user_message'         => $messages['user'],
			'admin_message'        => $messages['admin'],
			'is_recoverable'       => self::is_recoverable_error( $status_code ),
			'requires_user_action' => self::requires_user_action( $status_code ),
			'timestamp'            => current_time( 'mysql' ),
		);

		// Parse API response for additional details.
		if ( ! empty( $response_body ) ) {
			$parsed_response = self::parse_api_response( $response_body );
			if ( ! empty( $parsed_response ) ) {
				$error_info['api_details'] = $parsed_response;

				// Override user message if API provides a clearer one.
				if ( isset( $parsed_response['detail'] ) && ! empty( $parsed_response['detail'] ) ) {
					// Use the detailed API message for user-facing error.
					$error_info['user_message'] = sanitize_text_field( $parsed_response['detail'] );
				} elseif ( isset( $parsed_response['message'] ) && ! empty( $parsed_response['message'] ) ) {
					// Fallback to the general API message.
					$error_info['user_message'] = sanitize_text_field( $parsed_response['message'] );
				}

				// Store API message separately for logging.
				if ( isset( $parsed_response['message'] ) ) {
					$error_info['api_message'] = $parsed_response['message'];
				}
			}
		}

		// Add helpful links and actions.
		$error_info['help_links'] = self::get_help_links( $status_code );

		return $error_info;
	}

	/**
	 * Shows admin notice for the error.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $error_info Error information.
	 * @return void
	 */
	private static function show_error_notice( array $error_info ): void {
		$message = self::format_admin_notice_message( $error_info );
		$type    = $error_info['is_recoverable'] ? 'warning' : 'error';

		AdminNotices::add_notice( $message, $type, true, false );
	}

	/**
	 * Formats error message for admin notice.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $error_info Error information.
	 * @return string Formatted message.
	 */
	private static function format_admin_notice_message( array $error_info ): string {
		$message = '<strong>' . __( 'Picsart API Error:', 'picsart-ai-image-editor' ) . '</strong> ' . $error_info['user_message'];

		// Add context if available and it's not an API endpoint.
		if ( ! empty( $error_info['context'] ) ) {
			$context = $error_info['context'];
			// Don't show technical API endpoints like "tools/1.0/upscale" to users.
			if ( ! preg_match( '/^[a-z]+\/\d+\.\d+\/[a-z_]+$/', $context ) ) {
				$message .= ' <em>(' . esc_html( $context ) . ')</em>';
			}
		}

		// Add helpful links.
		if ( ! empty( $error_info['help_links'] ) ) {
			$message .= '<br><small>';
			$links    = array();
			foreach ( $error_info['help_links'] as $link ) {
				$links[] = sprintf(
					'<a href="%s" target="_blank">%s</a>',
					esc_url( $link['url'] ),
					esc_html( $link['text'] )
				);
			}
			$message .= implode( ' | ', $links );
			$message .= '</small>';
		}

		return $message;
	}

	/**
	 * Logs API error for debugging.
	 *
	 * @since 1.0.0
	 *
	 * @param array<string, mixed> $error_info Error information.
	 * @return void
	 */
	private static function log_api_error( array $error_info ): void {
		$log_message = sprintf(
			'Picsart API Error - Status: %d, Message: %s',
			$error_info['status_code'],
			$error_info['admin_message']
		);

		if ( ! empty( $error_info['context'] ) ) {
			$log_message .= ', Context: ' . $error_info['context'];
		}

		if ( ! empty( $error_info['api_details'] ) ) {
			$log_message .= ', API Details: ' . wp_json_encode( $error_info['api_details'] );
		}

		error_log( 'Picsart Plugin: ' . $log_message ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}

	/**
	 * Determines if error is recoverable.
	 *
	 * @since 1.0.0
	 *
	 * @param int $status_code HTTP status code.
	 * @return bool True if error is recoverable.
	 */
	private static function is_recoverable_error( int $status_code ): bool {
		$recoverable_codes = array( 429, 500, 503, 413, 422 );
		return in_array( $status_code, $recoverable_codes, true );
	}

	/**
	 * Determines if error requires user action.
	 *
	 * @since 1.0.0
	 *
	 * @param int $status_code HTTP status code.
	 * @return bool True if user action is required.
	 */
	private static function requires_user_action( int $status_code ): bool {
		$user_action_codes = array( 400, 401, 402, 403, 415, 422 );
		return in_array( $status_code, $user_action_codes, true );
	}

	/**
	 * Gets helpful links based on error type.
	 *
	 * @since 1.0.0
	 *
	 * @param int $status_code HTTP status code.
	 * @return array<array<string, string>> Array of help links.
	 */
	private static function get_help_links( int $status_code ): array {
		$links = array();

		switch ( $status_code ) {
			case 401:
			case 403:
				$links[] = array(
					'url'  => admin_url( 'admin.php?page=picsart-settings' ),
					'text' => 'Check API Settings',
				);
				break;

			case 402:
				$links[] = array(
					'url'  => 'https://console.picsart.io/',
					'text' => 'Picsart Console',
				);
				break;

			case 429:
			case 500:
			case 503:
				$links[] = array(
					'url'  => self::STATUS_URL,
					'text' => 'Service Status',
				);
				break;

			case 413:
			case 415:
				$links[] = array(
					'url'  => 'https://docs.picsart.io/docs/creative-apis-supported-input-and-output-formats',
					'text' => 'Supported Formats',
				);
				break;
		}

		// Always add general help link for non-recoverable errors.
		if ( ! self::is_recoverable_error( $status_code ) ) {
			$links[] = array(
				'url'  => 'mailto:' . self::SUPPORT_EMAIL,
				'text' => 'Contact Support',
			);
		}

		return $links;
	}

	/**
	 * Parses API response body for error details.
	 *
	 * @since 1.0.0
	 *
	 * @param string $response_body API response body.
	 * @return array<string, mixed>|null Parsed response or null if invalid.
	 */
	private static function parse_api_response( string $response_body ): ?array {
		$decoded = json_decode( $response_body, true );

		if ( json_last_error() !== JSON_ERROR_NONE ) {
			return null;
		}

		return $decoded;
	}

	/**
	 * Creates user-friendly error message for frontend display.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed  $status_code HTTP status code.
	 * @param string $context Context where error occurred (optional).
	 * @param string $response_body API response body (optional).
	 * @return string User-friendly error message.
	 */
	public static function get_user_error_message( mixed $status_code, string $context = '', string $response_body = '' ): string {
		$error_info = self::get_error_info( $status_code, $response_body );
		$message    = $error_info['user_message'];

		// Add context if available and it's not a technical API endpoint.
		if ( ! empty( $context ) ) {
			// Don't show technical API endpoints like "tools/1.0/upscale" to users.
			if ( ! preg_match( '/^[a-z]+\/\d+\.\d+\/[a-z_]+$/', $context ) ) {
				$message = sprintf( '%s (%s)', $message, $context );
			}
		}

		// Add retry suggestion for recoverable errors.
		if ( $error_info['is_recoverable'] ) {
			$message .= ' ' . __( 'Please try again in a few moments.', 'picsart-ai-image-editor' );
		}

		return $message;
	}

	/**
	 * Checks if API response indicates success.
	 *
	 * @since 1.0.0
	 *
	 * @param mixed $status_code HTTP status code.
	 * @return bool True if successful.
	 */
	public static function is_success_response( $status_code ): bool {
		if ( ! is_int( $status_code ) ) {
			return false;
		}

		return $status_code >= 200 && $status_code < 300;
	}

	/**
	 * Gets retry delay for recoverable errors.
	 *
	 * @since 1.0.0
	 *
	 * @param int $status_code HTTP status code.
	 * @return int Recommended retry delay in seconds.
	 */
	public static function get_retry_delay( int $status_code ): int {
		switch ( $status_code ) {
			case 429: // Rate limit.
				return 60; // 1 minute.
			case 503: // Service unavailable.
				return 300; // 5 minutes.
			case 500: // Server error.
				return 30; // 30 seconds.
			default:
				return 10; // 10 seconds default.
		}
	}

	/**
	 * Handles successful API operation and shows success notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string   $operation The operation type (remove_bg, upscale_image).
	 * @param bool     $show_admin_notice Whether to show admin notice.
	 * @param int|null $image_id Image ID to create link in success message.
	 * @return void
	 */
	public static function handle_success( string $operation, bool $show_admin_notice = null, ?int $image_id = null ): void {
		$should_show_notice = $show_admin_notice ?? self::should_show_admin_notice();
		if ( $should_show_notice ) {
			$message = self::get_success_message( $operation, $image_id );
			AdminNotices::add_success( $message, true, false );
		}
	}

	/**
	 * Handles operation error and shows error notice.
	 *
	 * @since 1.0.0
	 *
	 * @param string $message The error message.
	 * @param bool   $show_admin_notice Whether to show admin notice.
	 * @return void
	 */
	public static function handle_error( string $message, bool $show_admin_notice = null ): void {
		$should_show_notice = $show_admin_notice ?? self::should_show_admin_notice();
		if ( $should_show_notice ) {
			AdminNotices::add_error( $message, true, false );
		}
	}

	/**
	 * Gets localized success message for operation.
	 *
	 * @since 1.0.0
	 *
	 * @param string   $operation The operation type.
	 * @param int|null $image_id Image ID to create link in success message.
	 * @return string Localized success message.
	 */
	public static function get_success_message( string $operation, ?int $image_id = null ): string {
		$image_word = __( 'Image', 'picsart-ai-image-editor' );
		if ( $image_id ) {
			$edit_url   = admin_url( 'post.php?post=' . $image_id . '&action=edit' );
			$image_word = sprintf( '<a href="%s" target="_blank">%s</a>', esc_url( $edit_url ), esc_html__( 'Image', 'picsart-ai-image-editor' ) );
		}

		switch ( $operation ) {
			case 'remove_bg':
				return sprintf(
					/* translators: %s: The word "Image" which can be a link */
					__( 'Background removed successfully! %s has been saved to your media library.', 'picsart-ai-image-editor' ),
					$image_word
				);
			case 'upscale_image':
				return sprintf(
					/* translators: %s: The word "Image" which can be a link */
					__( '%s upscaled successfully! Enhanced image has been saved to your media library.', 'picsart-ai-image-editor' ),
					$image_word
				);
			case 'save_blob':
				return sprintf(
					/* translators: %s: The word "Image" which can be a link */
					__( '%s saved successfully to media library!', 'picsart-ai-image-editor' ),
					$image_word
				);
			default:
				return sprintf(
					/* translators: %s: The word "Image" which can be a link */
					__( 'Operation completed successfully! %s has been saved to your media library.', 'picsart-ai-image-editor' ),
					$image_word
				);
		}
	}
}
