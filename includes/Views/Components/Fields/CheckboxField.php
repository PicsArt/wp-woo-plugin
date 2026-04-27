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

$picsart_ai_image_editor_is_checked = (bool) checked( $args['value'], '1', false );
$picsart_ai_image_editor_attrs      = array(
	'id'   => $args['id'],
	'name' => $args['name'],
) + ( $args['attributes'] ?? array() );

if ( ! empty( $args['label'] ) ) : ?>
	<label for="<?php echo esc_attr( $args['id'] ); ?>">
		<?php echo esc_html( $args['label'] ); ?>
	</label><br/>
<?php endif; ?>

	<input type="checkbox" value="1"<?php echo $picsart_ai_image_editor_is_checked ? ' checked="checked"' : ''; ?><?php \PICSART\Helpers\Render::echo_html_attrs( $picsart_ai_image_editor_attrs ); ?> />

<?php if ( ! empty( $args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $args['description'] ); ?></p>
<?php endif; ?>