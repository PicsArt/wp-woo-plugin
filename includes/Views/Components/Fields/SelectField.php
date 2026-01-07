<?php
/**
 * Partial view for rendering a select dropdown.
 *
 * @var mixed $args Passed arguments from Render::field().
 *
 * @package Picsasrt
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
	<select <?php echo $picsart_ai_image_editor_ai_image_editor_attr_string; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
		<?php
		foreach ( $args['options'] as $picsart_ai_image_editor_ai_image_editor_val => $picsart_ai_image_editor_ai_image_editor_label ) :
			$picsart_ai_image_editor_ai_image_editor_selected = selected( $args['value'], $picsart_ai_image_editor_ai_image_editor_val, false );
			?>
			<option value="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_val ); ?>" <?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_selected ); ?>>
				<?php echo esc_html( $picsart_ai_image_editor_ai_image_editor_label ); ?>
			</option>
		<?php endforeach; ?>
	</select>

<?php if ( ! empty( $args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $args['description'] ); ?></p>
<?php endif; ?>