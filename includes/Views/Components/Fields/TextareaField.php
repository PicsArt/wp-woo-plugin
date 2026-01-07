<?php
/**
 * Partial view for rendering a textarea input.
 *
 * @var mixed $args Passed arguments from Render::field().
 *
 * @package Picsasrt
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$picsart_ai_image_editor_args = $args;

$picsart_ai_image_editor_ai_image_editor_attr_string = \PICSART\Helpers\Render::build_html_attr(
	array(
		'id'   => $picsart_ai_image_editor_args['id'],
		'name' => $picsart_ai_image_editor_args['name'],
	) + ( $picsart_ai_image_editor_args['attributes'] ?? array() )
);

if ( ! empty( $picsart_ai_image_editor_args['label'] ) ) :
	?>
	<label for="<?php echo esc_attr( $picsart_ai_image_editor_args['id'] ); ?>">
		<?php echo esc_html( $picsart_ai_image_editor_args['label'] ); ?>
	</label><br />
	<?php
endif;

?>
<textarea <?php echo $picsart_ai_image_editor_ai_image_editor_attr_string; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<?php echo esc_textarea( $picsart_ai_image_editor_args['value'] ); ?>
</textarea>

<?php if ( ! empty( $picsart_ai_image_editor_args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $picsart_ai_image_editor_args['description'] ); ?></p>
<?php endif; ?>