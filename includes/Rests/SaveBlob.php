<?php
/**
 * REST controller for saving blob image data to the media library.
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
 * Class SaveBlob
 *
 * Provides a REST API endpoint for saving blob image data to the WordPress media library,
 * and optionally assigning them as featured images to posts.
 *
 * @since 1.0.0
 */
class SaveBlob {

	/**
	 * REST route slug.
	 *
	 * @var string
	 */
	private const ENDPOINT = 'save-blob';

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
	 * Registers the REST API endpoint for blob image saving.
	 *
	 * Endpoint: /{REST_URL}/{PICSART_PLUGIN_API_NAMESPACE}/save-blob
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
	 * Handles the request to save blob image data to the media library.
	 *
	 * Optionally assigns the image as the featured image for a given post/term.
	 *
	 * @since 1.0.0
	 *
	 * @param WP_REST_Request $request The REST request instance.
	 * @return WP_REST_Response JSON response with result data or error.
	 */
	public function handle_request( WP_REST_Request $request ): WP_REST_Response {
		$files             = $request->get_file_params();
		$post_id           = absint( $request->get_param( 'post_id' ) );
		$term_id           = absint( $request->get_param( 'term_id' ) );
		$original_filename = sanitize_text_field( $request->get_param( 'original_filename' ) );
		$original_url      = esc_url_raw( $request->get_param( 'original_url' ) );

		// Check if we received a blob file upload.
		if ( empty( $files['image'] ) ) {
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => __( 'Image blob is required.', 'picsart-ai-image-editor' ),
				),
				400
			);
		}

		$image_file = $files['image'];

		// Check for upload errors.
		if ( isset( $image_file['error'] ) && UPLOAD_ERR_OK !== $image_file['error'] ) {
			// translators: %d is the upload error code.
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					// translators: %d is the upload error code.
					'message' => sprintf( __( 'Blob upload error: %d', 'picsart-ai-image-editor' ), $image_file['error'] ),
				),
				400
			);
		}

		// Check file size.
		if ( empty( $image_file['size'] ) || 1 > $image_file['size'] ) {
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => __( 'Empty blob received.', 'picsart-ai-image-editor' ),
				),
				400
			);
		}

		// Validate blob content and convert to proper image.
		$processed_blob = $this->process_blob_data( $image_file );
		if ( is_wp_error( $processed_blob ) ) {
			// translators: Error message from blob processing.
			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => $processed_blob->get_error_message(),
				),
				400
			);
		}

		// Generate filename based on original image and detected blob type.
		$filename = $this->generate_edited_filename( $original_filename, $original_url, (string) $post_id, $processed_blob );

		// Save the processed blob to media library.
		$image_id = $this->save_blob_to_media_library( $processed_blob, $filename );

		if ( 0 === $image_id ) {
			// Use APIErrorHandler for better error reporting.
			APIErrorHandler::handle_api_error( 500, '', 'Blob save to media library' );

			return new WP_REST_Response(
				array(
					'status'  => 'error',
					'message' => APIErrorHandler::get_user_error_message( 500, 'media library save' ),
				),
				500
			);
		}

		// Assign to post or term if provided.
		if ( ! empty( $post_id ) ) {
			// Check if this is a media attachment - if so, don't assign as featured image
			// but we could replace the original attachment or create a new one.
			if ( ! Helpers::is_attachment( (int) $post_id ) ) {
				Helpers::assign_image_to_post( (int) $post_id, $image_id );
			}
		}

		if ( ! empty( $term_id ) ) {
			Helpers::assign_image_to_term( (int) $term_id, $image_id );
		}

		$image_url = wp_get_attachment_url( $image_id );

		// Handle success and show notice.
		APIErrorHandler::handle_success( 'save_blob', true, $image_id );

		return new WP_REST_Response(
			array(
				'status'  => 'success',
				'result'  => array(
					'image_id'  => $image_id,
					'image_url' => $image_url,
				),
				'message' => __( 'Image saved successfully to media library!', 'picsart-ai-image-editor' ),
			),
			200
		);
	}

	/**
	 * Processes blob data and validates it as an image.
	 *
	 * @param array<string,mixed> $blob_file The blob file data from $_FILES.
	 * @return array<string,mixed>|\WP_Error Processed blob data or WP_Error on failure.
	 */
	private function process_blob_data( array $blob_file ) {
		// Read the blob content.
		$blob_content = file_get_contents( $blob_file['tmp_name'] );
		if ( false === $blob_content ) {
			return new \WP_Error( 'blob_read_failed', __( 'Failed to read blob content.', 'picsart-ai-image-editor' ) );
		}

		// Detect image type from blob content.
		$image_info = $this->detect_image_type_from_blob( $blob_content );
		if ( is_wp_error( $image_info ) ) {
			return $image_info;
		}

		// Create a temporary file with proper extension.
		$temp_file = tempnam( sys_get_temp_dir(), 'picsart_blob_' );
		if ( ! $temp_file ) {
			return new \WP_Error( 'temp_file_failed', __( 'Failed to create temporary file.', 'picsart-ai-image-editor' ) );
		}

		// Write blob content to temp file.
		$written = file_put_contents( $temp_file, $blob_content );
		if ( false === $written ) {
			wp_delete_file( $temp_file );
			return new \WP_Error( 'blob_write_failed', __( 'Failed to write blob to temporary file.', 'picsart-ai-image-editor' ) );
		}

		// Return processed file data.
		return array(
			'tmp_name' => $temp_file,
			'name'     => 'blob.' . $image_info['extension'],
			'type'     => $image_info['mime_type'],
			'size'     => strlen( $blob_content ),
			'error'    => UPLOAD_ERR_OK,
		);
	}

	/**
	 * Detects image type from blob content using image headers.
	 *
	 * @param mixed $blob_content The blob binary content.
	 * @return array<string,mixed>|\WP_Error Array with mime_type and extension, or WP_Error on failure.
	 */
	private function detect_image_type_from_blob( mixed $blob_content ) {
		// Use getimagesizefromstring to detect image type.
		$image_info = getimagesizefromstring( $blob_content );
		if ( false === $image_info ) {
			return new \WP_Error( 'invalid_image', __( 'Blob content is not a valid image.', 'picsart-ai-image-editor' ) );
		}

		$mime_type = $image_info['mime'] ?: '';

		// Map MIME types to extensions.
		$mime_to_extension = array(
			'image/jpeg' => 'jpg',
			'image/jpg'  => 'jpg',
			'image/png'  => 'png',
			'image/gif'  => 'gif',
			'image/webp' => 'webp',
			'image/bmp'  => 'bmp',
		);

		if ( ! isset( $mime_to_extension[ $mime_type ] ) ) {
			return new \WP_Error(
				'unsupported_format',
				sprintf(
					// translators: %1$s is the detected MIME type, %2$s is the list of supported formats.
					__( 'Unsupported image format: %1$s. Supported formats: %2$s', 'picsart-ai-image-editor' ),
					$mime_type,
					implode( ', ', array_keys( $mime_to_extension ) )
				)
			);
		}

		return array(
			'mime_type' => $mime_type,
			'extension' => $mime_to_extension[ $mime_type ],
		);
	}

	/**
	 * Generates an appropriate filename for the edited image.
	 *
	 * @param string              $original_filename Original filename if available.
	 * @param string              $original_url Original image URL if available.
	 * @param string              $post_id Post ID if available (to get filename from attachment).
	 * @param array<string,mixed> $processed_blob Processed blob data with type information.
	 * @return string Generated filename.
	 */
	private function generate_edited_filename( $original_filename = '', $original_url = '', $post_id = '', $processed_blob = array() ): string {
		$filename  = 'picsart-image';
		$extension = 'jpg';

		// Try to get extension from processed blob first.
		if ( ! empty( $processed_blob['type'] ) ) {
			$mime_to_extension = array(
				'image/jpeg' => 'jpg',
				'image/jpg'  => 'jpg',
				'image/png'  => 'png',
				'image/gif'  => 'gif',
				'image/webp' => 'webp',
				'image/bmp'  => 'bmp',
			);

			if ( isset( $mime_to_extension[ $processed_blob['type'] ] ) ) {
				$extension = $mime_to_extension[ $processed_blob['type'] ];
			}
		}

		// Try to get filename from attachment if post_id is provided.
		if ( ! empty( $post_id ) && Helpers::is_attachment( (int) $post_id ) ) {
			$attachment_filename = Helpers::get_original_filename_from_attachment( (int) $post_id );
			if ( ! empty( $attachment_filename ) ) {
				$path_info = pathinfo( $attachment_filename );
				$filename  = $path_info['filename'];
				// Keep extension from blob if available, otherwise use original.
				if ( empty( $processed_blob['type'] ) ) {
					$extension = $path_info['extension'] ?? $extension;
				}
			}
		} elseif ( ! empty( $original_filename ) ) {
			// Try to extract filename from original_filename first.
			$path_info = pathinfo( $original_filename );
			$filename  = $path_info['filename'];
			// Keep extension from blob if available, otherwise use original.
			if ( empty( $processed_blob['type'] ) ) {
				$extension = $path_info['extension'] ?? $extension;
			}
		} elseif ( ! empty( $original_url ) ) {
			// Fallback to extracting from URL.
			$url_parts = wp_parse_url( $original_url );
			$path      = $url_parts['path'] ?? '';
			if ( $path ) {
				$path_info = pathinfo( basename( $path ) );
				$filename  = $path_info['filename'];
				// Keep extension from blob if available, otherwise use original.
				if ( empty( $processed_blob['type'] ) ) {
					$extension = $path_info['extension'] ?? $extension;
				}
			}
		}

		// Append "-edited" suffix.
		$filename = sanitize_file_name( $filename . '-edited' );

		return $filename . '.' . $extension;
	}

	/**
	 * Saves blob data to WordPress media library.
	 *
	 * @param array<string,mixed> $file_data File data from $_FILES.
	 * @param string              $filename Target filename.
	 * @return int Attachment ID on success, 0 on failure.
	 */
	private function save_blob_to_media_library( array $file_data, string $filename ): int {
		// Load required WordPress files.
		$includes_path = defined( 'ABSPATH' ) ? ABSPATH . 'wp-admin/includes/' : __DIR__ . '/../../../../../wp-admin/includes/';

		foreach ( array( 'file.php', 'image.php', 'media.php' ) as $file ) {
			if ( file_exists( $includes_path . $file ) ) {
				require_once $includes_path . $file;
			}
		}

		// Prepare file array for media_handle_sideload.
		$file_array = array(
			'name'     => $filename,
			'tmp_name' => $file_data['tmp_name'],
			'type'     => $file_data['type'],
			'size'     => $file_data['size'],
			'error'    => $file_data['error'],
		);

		// Handle the upload.
		$attachment_id = media_handle_sideload( $file_array, 0 );

		// Clean up temporary file if it exists.
		if ( isset( $file_data['tmp_name'] ) && file_exists( $file_data['tmp_name'] ) ) {
			wp_delete_file( $file_data['tmp_name'] );
		}

		if ( is_wp_error( $attachment_id ) ) {
			error_log( 'Picsart Plugin: Failed to save blob to media library. Error: ' . $attachment_id->get_error_message() ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return 0;
		}

		return $attachment_id;
	}
}
