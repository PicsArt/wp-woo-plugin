<?php
/**
 * Fonts
 *
 * Loads custom Gilroy fonts and preloads them for improved performance in the WordPress admin area.
 *
 * @package Picsart
 * @since 1.0.0
 */

namespace PICSART\Core;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Fonts
 *
 * Handles registration and optimization of custom font assets used in the admin panel.
 *
 * @package PICSART\Core
 * @since 1.0.0
 */
class Fonts {

	/**
	 * Initializes WordPress hooks for font registration and preload.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function run(): void {
		add_action( 'admin_enqueue_scripts', array( $this, 'register_fonts' ) );
		add_filter( 'style_loader_tag', array( $this, 'add_preload_to_fonts' ), 10, 2 );
	}

	/**
	 * Registers and injects the Gilroy font family as inline @font-face CSS.
	 *
	 * @since 1.0.0
	 * @return void
	 */
	public function register_fonts(): void {
		$base_url = plugin_dir_url( __DIR__ ) . '../assets/';

		if ( ! defined( 'PICSART_PLUGIN_VERSION' ) ) {
			return;
		}

		wp_register_style( 'picsart-fonts', false, array(), PICSART_PLUGIN_VERSION );
		wp_enqueue_style( 'picsart-fonts' );

		$font_face = "
		@font-face {
			font-family: 'Gilroy';
			src: url('{$base_url}Gilroy-Regular.woff') format('woff');
			font-weight: 500;
			font-style: normal;
			font-display: swap;
		}
		@font-face {
			font-family: 'Gilroy';
			src: url('{$base_url}Gilroy-Medium.woff') format('woff');
			font-weight: 600;
			font-style: normal;
			font-display: swap;
		}
		";

		wp_add_inline_style( 'picsart-fonts', $font_face );
	}

	/**
	 * Adds <link rel="preload"> tags for Gilroy fonts to improve loading performance.
	 *
	 * @param string $html   The original <link> tag for the stylesheet.
	 * @param string $handle The handle of the enqueued stylesheet.
	 *
	 * @return string Modified HTML with preload links prepended.
	 * @since 1.0.0
	 */
	public function add_preload_to_fonts( $html, $handle ): string {
		if ( 'picsart-fonts' === $handle ) {
			$dist_url = plugin_dir_url( __DIR__ ) . '../assets/';

			$preload = "
				<link rel='preload' href='{$dist_url}Gilroy-Regular.woff' as='font' type='font/woff' crossorigin='anonymous' />
				<link rel='preload' href='{$dist_url}Gilroy-Medium.woff' as='font' type='font/woff' crossorigin='anonymous' />
			";

			return $preload . $html;
		}

		return $html;
	}
}
