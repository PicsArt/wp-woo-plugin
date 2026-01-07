<?php
/**
 * Partial view for rendering a text input field with optional label.
 *
 * @var mixed $args Passed arguments from Render::field().
 *
 * @package Picsasrt
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! empty( $args['label'] ) ) :
	?>
	<label for="<?php echo esc_attr( $args['id'] ); ?>">
		<?php echo esc_html( $args['label'] ); ?>
	</label><br/>
	<?php
endif;

$picsart_ai_image_editor_ai_image_editor_attr_string = \PICSART\Helpers\Render::build_html_attr(
	array(
		'id'    => $args['id'],
		'name'  => $args['name'],
		'type'  => $args['type'],
		'value' => $args['value'],
	) + ( $args['attributes'] ?? array() )
);
?>
	<input <?php echo $picsart_ai_image_editor_ai_image_editor_attr_string; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> />
<?php if ( ! empty( $args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $args['description'] ); ?></p>
<?php endif; ?>