<?php
/**
 * Partial view for rendering a checkbox input.
 *
 * @var mixed $args Passed arguments from Render::field().
 *
 * @package Picsasrt
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$picsart_ai_image_editor_ai_image_editor_checked     = checked( $args['value'], '1', false );
$picsart_ai_image_editor_ai_image_editor_attr_string = \PICSART\Helpers\Render::build_html_attr(
	array(
		'id'   => $args['id'],
		'name' => $args['name'],
	) + ( $args['attributes'] ?? array() )
);

if ( ! empty( $args['label'] ) ) : ?>
	<label for="<?php echo esc_attr( $args['id'] ); ?>">
		<?php echo esc_html( $args['label'] ); ?>
	</label><br/>
<?php endif; ?>

	<input type="checkbox"
			value="1" <?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_checked ); ?> <?php echo $picsart_ai_image_editor_ai_image_editor_attr_string; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> />

<?php if ( ! empty( $args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $args['description'] ); ?></p>
<?php endif; ?>