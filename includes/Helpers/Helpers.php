<?php
/**
 * Helper methods for working with media in WordPress.
 *
 * @package Picsart
 * @subpackage Helpers
 */

namespace PICSART\Helpers;

defined( 'ABSPATH' ) || exit;

/**
 * Class Helpers
 *
 * Provides static methods for downloading remote images and assigning them as post thumbnails.
 *
 * @since 1.0.0
 */
class Helpers {

	/**
	 * Downloads an image from a remote URL and saves it to the WordPress media library.
	 *
	 * Uses core WordPress media functions to sideload the image and create an attachment.
	 *
	 * @since 1.0.0
	 *
	 * @param string $image_url The full URL to the image to be downloaded.
	 * @return int The attachment ID of the saved image on success, or 0 on failure.
	 */
	public static function save_image_to_media_library( string $image_url ): int {
		// Validate URL format.
		if ( ! filter_var( $image_url, FILTER_VALIDATE_URL ) ) {
			error_log( 'Picsart Plugin: Invalid URL provided to save_image_to_media_library: ' . $image_url ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return 0;
		}

		$includes_path = defined( 'ABSPATH' ) ? ABSPATH . 'wp-admin/includes/' : __DIR__ . '/../../../../../wp-admin/includes/';

		foreach ( array( 'file.php', 'image.php', 'media.php' ) as $file ) {
			if ( file_exists( $includes_path . $file ) ) {
				require_once $includes_path . $file;
			}
		}

		$tmp = download_url( $image_url );

		if ( is_wp_error( $tmp ) ) {
			error_log( 'Picsart Plugin: Failed to download image from URL: ' . $image_url . ' Error: ' . $tmp->get_error_message() ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			return 0;
		}

		// Generate a better filename for processed images.
		$url_parts = wp_parse_url( $image_url );
		$filename  = basename( $url_parts['path'] ?? 'picsart-processed-image.jpg' );

		// If filename doesn't have extension, add .jpg as default.
		if ( ! pathinfo( $filename, PATHINFO_EXTENSION ) ) {
			$filename .= '.jpg';
		}

		$file_array = array(
			'name'     => $filename,
			'tmp_name' => $tmp,
		);

		$attachment_id = media_handle_sideload( $file_array, 0 );

		if ( is_wp_error( $attachment_id ) ) {
			error_log( 'Picsart Plugin: Failed to save image to media library. Error: ' . $attachment_id->get_error_message() ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			if ( file_exists( $file_array['tmp_name'] ) ) {
				wp_delete_file( $file_array['tmp_name'] ); // Clean up temp file on error.
			}
			return 0;
		}

		return $attachment_id;
	}

	/**
	 * Assigns a given image ID as the featured image (post thumbnail) for a specific post.
	 *
	 * This will only assign the image if both the post and image exist and the image is a valid attachment.
	 *
	 * @since 1.0.0
	 *
	 * @param int $post_id  The ID of the post to assign the image to.
	 * @param int $image_id The attachment ID of the image to assign.
	 * @return void
	 */
	public static function assign_image_to_post( int $post_id, int $image_id ): void {
		if ( ! $post_id || ! $image_id ) {
			return;
		}

		if ( get_post( $post_id ) && wp_attachment_is_image( $image_id ) ) {
			set_post_thumbnail( $post_id, $image_id );
		}
	}

	/**
	 * Assigns a given image ID as the thumbnail for a specific taxonomy term.
	 *
	 * This will only assign the image if both the term and image exist and the image is a valid attachment.
	 *
	 * @since 1.0.0
	 *
	 * @param int $term_id  The ID of the term to assign the image to.
	 * @param int $image_id The attachment ID of the image to assign.
	 * @return void
	 */
	public static function assign_image_to_term( int $term_id, int $image_id ): void {
		if ( ! $term_id || ! $image_id ) {
			return;
		}

		if ( get_term( $term_id ) && wp_attachment_is_image( $image_id ) ) {
			update_term_meta( $term_id, 'thumbnail_id', $image_id );
		}
	}

	/**
	 * Extracts the original filename from an attachment ID.
	 *
	 * @since 1.0.0
	 *
	 * @param int $attachment_id The attachment ID.
	 * @return string The original filename or empty string if not found.
	 */
	public static function get_original_filename_from_attachment( int $attachment_id ): string {
		if ( ! $attachment_id || ! wp_attachment_is_image( $attachment_id ) ) {
			return '';
		}

		$file_path = get_attached_file( $attachment_id );
		if ( $file_path ) {
			return basename( $file_path );
		}

		return '';
	}

	/**
	 * Determines if a post ID refers to a media attachment.
	 *
	 * @since 1.0.0
	 *
	 * @param int $post_id The post ID to check.
	 * @return bool True if it's an attachment, false otherwise.
	 */
	public static function is_attachment( int $post_id ): bool {
		return get_post_type( $post_id ) === 'attachment';
	}

	/**
	 * Check if taxonomy supports image thumbnails.
	 *
	 * @param string $taxonomy The taxonomy name.
	 *
	 * @return bool True if taxonomy supports thumbnails, false otherwise.
	 */
	public static function taxonomy_supports_thumbnails( string $taxonomy ): bool {
		// Check if taxonomy has registered thumbnail meta.
		$meta_keys = get_registered_meta_keys( 'term' );
		if ( isset( $meta_keys['thumbnail_id'] ) ) {
			return true;
		}

		// Check if any term in this taxonomy has thumbnail_id meta.
		$terms_with_thumbnails = get_terms(
			array(
				'taxonomy'   => $taxonomy,
				'hide_empty' => false,
				'meta_query' => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					array(
						'key'     => 'thumbnail_id',
						'compare' => 'EXISTS',
					),
				),
				'number'     => 1,
			)
		);

		return ! empty( $terms_with_thumbnails );
	}

	/**
	 * Check if a post has a featured image.
	 *
	 * @param int $post_id The post ID to check.
	 *
	 * @return bool True if post has featured image, false otherwise.
	 */
	public static function post_has_featured_image( int $post_id ): bool {
		return has_post_thumbnail( $post_id );
	}
}
