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

$picsart_ai_image_editor_attrs = array(
	'id'   => $picsart_ai_image_editor_args['id'],
	'name' => $picsart_ai_image_editor_args['name'],
) + ( $picsart_ai_image_editor_args['attributes'] ?? array() );

if ( ! empty( $picsart_ai_image_editor_args['label'] ) ) :
	?>
	<label for="<?php echo esc_attr( $picsart_ai_image_editor_args['id'] ); ?>">
		<?php echo esc_html( $picsart_ai_image_editor_args['label'] ); ?>
	</label><br />
	<?php
endif;

?>
<textarea<?php \PICSART\Helpers\Render::echo_html_attrs( $picsart_ai_image_editor_attrs ); ?>>
	<?php echo esc_textarea( $picsart_ai_image_editor_args['value'] ); ?>
</textarea>

<?php if ( ! empty( $picsart_ai_image_editor_args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $picsart_ai_image_editor_args['description'] ); ?></p>
<?php endif; ?>