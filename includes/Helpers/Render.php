<?php
/**
 * Class responsible for rendering views and components.
 *
 * @package Picsart
 */

namespace PICSART\Helpers;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Render {

	/**
	 * Renders a view file from the Pages directory.
	 *
	 * @param string $path Relative path to the view file (without extension).
	 * @param mixed  $data Data to be passed to the view.
	 * @param bool   $display Whether to immediately display the rendered content.
	 *
	 * @return string Rendered HTML output.
	 */
	public static function view( string $path, mixed $data = array(), bool $display = true ): string {
		$path = self::get_path( $path );

		return self::render( $path, $data, $display );
	}

	/**
	 * Renders a component file from the Components directory.
	 *
	 * @param string $path Relative path to the component file (without extension).
	 * @param mixed  $data Data to be passed to the component.
	 * @param bool   $display Whether to immediately display the rendered content.
	 *
	 * @return string Rendered HTML output.
	 */
	public static function component( string $path, mixed $data, bool $display = true ): string {
		$path = self::get_path( $path, true );

		return self::render( $path, $data, $display );
	}

	/**
	 * Handles the actual file rendering with optional output buffering.
	 *
	 * @param string $path Full path to the PHP file.
	 * @param mixed  $args Data to be extracted for use in the file.
	 * @param bool   $display Whether to echo the rendered content.
	 *
	 * @return string Rendered HTML content.
	 */
	public static function render( string $path, mixed $args, bool $display ): string {
		if ( file_exists( $path ) ) {
			ob_start();
			include $path;
			$output = ob_get_clean();
		}

		if ( empty( $output ) ) {
			$output = esc_attr( __( 'Component not found', 'picsart-ai-image-editor' ) );
		}

		if ( $display ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			print $output;
		}

		return $output;
	}

	/**
	 * Returns the full absolute path to a view or component file.
	 *
	 * @param string $path Relative path to the file.
	 * @param bool   $is_component Whether it's a component (vs. page).
	 *
	 * @return string Full file path.
	 */
	public static function get_path( string $path, bool $is_component = false ): string {
		if ( ! defined( 'PICSART_PLUGIN_DIR' ) ) {
			return "";
		}

		$base = PICSART_PLUGIN_DIR . DIRECTORY_SEPARATOR . 'includes' . DIRECTORY_SEPARATOR . 'Views' . DIRECTORY_SEPARATOR;

		if ( $is_component ) {
			return $base . 'Components' . DIRECTORY_SEPARATOR . $path . '.php';
		}

		return $base . 'Pages' . DIRECTORY_SEPARATOR . $path . '.php';
	}

	/**
	 * Renders a form field component based on its type.
	 *
	 * @param mixed $args Configuration array for the field (type, name, id, value, etc.).
	 *
	 * @return void
	 */
	public static function field( mixed $args = array() ): void {
		$defaults = array(
			'type'        => 'text',
			'name'        => '',
			'id'          => '',
			'value'       => '',
			'label'       => '',
			'description' => '',
			'options'     => array(),
			'attributes'  => array(),
		);

		$args = wp_parse_args( $args, $defaults );

		switch ( $args['type'] ) {
			case 'textarea':
				self::component( 'Fields/TextareaField', $args );
				break;

			case 'select':
				self::component( 'Fields/SelectField', $args );
				break;

			case 'radio-colors':
				self::component( 'Fields/RadioColorsField', $args );
				break;

			case 'checkbox':
				self::component( 'Fields/CheckboxField', $args );
				break;

			case 'media':
				self::component( 'Fields/MediaLibraryField', $args );
				break;

			case 'border-radius':
				self::component( 'Fields/BorderRadiusField', $args );
				break;

			default:
				self::component( 'Fields/TextField', $args );
				break;
		}
	}

	/**
	 * Converts an associative array of HTML attributes into a string.
	 *
	 * @param array<string, string> $attributes Array of attributes (e.g., ['class' => 'btn']).
	 *
	 * @return string HTML-safe attributes string.
	 */
	public static function build_html_attr( array $attributes ): string {
		return ' ' . implode(
			' ',
			array_map(
				function ( $attr, $value ) {
					if ( ! $value ) {
						return '';
					}

					return sprintf( '%s="%s"', esc_attr( $attr ), esc_attr( $value ) );
				},
				array_keys( $attributes ),
				$attributes
			)
		);
	}
}
