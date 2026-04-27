<?php
/**
 * Partial view for rendering color radio buttons with hidden input and color picker.
 *
 * @var mixed $args
 *
 * @package Picsart
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$picsart_ai_image_editor_colors    = $args['options'];
$picsart_ai_image_editor_value     = $args['value'];
$picsart_ai_image_editor_field_id  = $args['id'];
$picsart_ai_image_editor_picker_id = $picsart_ai_image_editor_field_id . '_picker';
$picsart_ai_image_editor_name      = $args['name'];
$picsart_ai_image_editor_is_custom = ! array_key_exists( $picsart_ai_image_editor_value, $picsart_ai_image_editor_colors )
	&& 'transparent' !== $picsart_ai_image_editor_value
	&& 'multicolor' !== $picsart_ai_image_editor_value;
?>

<?php if ( ! empty( $args['label'] ) ) : ?>
	<label for="<?php echo esc_attr( $picsart_ai_image_editor_field_id ); ?>"><?php echo esc_html( $args['label'] ); ?></label><br />
<?php endif; ?>

<input type="hidden" id="<?php echo esc_attr( $picsart_ai_image_editor_field_id ); ?>" name="<?php echo esc_attr( $picsart_ai_image_editor_name ); ?>" value="<?php echo esc_attr( $picsart_ai_image_editor_value ); ?>" />

<div
	class="picsart-radio-color-field"
	style="display: flex; flex-wrap: wrap; gap: 6px;"
	data-target="#<?php echo esc_attr( $picsart_ai_image_editor_field_id ); ?>"
	data-picker-target="#<?php echo esc_attr( $picsart_ai_image_editor_picker_id ); ?>"
>
	<?php
	foreach ( $picsart_ai_image_editor_colors as $picsart_ai_image_editor_color => $picsart_ai_image_editor_label ) :
		$picsart_ai_image_editor_selected = $picsart_ai_image_editor_color === $picsart_ai_image_editor_value;
		$picsart_ai_image_editor_border   = $picsart_ai_image_editor_selected ? '#333' : '#ccc';

		if ( 'transparent' === $picsart_ai_image_editor_color ) {
			$picsart_ai_image_editor_background = 'background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%); background-size:10px 10px; background-position:0 0, 5px 5px;';
		} elseif ( 'multicolor' === $picsart_ai_image_editor_color ) {
			$picsart_ai_image_editor_background = 'background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet);';
		} else {
			$picsart_ai_image_editor_background = 'background: ' . $picsart_ai_image_editor_color . ';';
		}

		$picsart_ai_image_editor_swatch_style = sprintf(
			'display: inline-block; width: 30px; height: 30px; border-radius: 4px; border: 2px solid %s; %s',
			$picsart_ai_image_editor_border,
			$picsart_ai_image_editor_background
		);
		?>
		<label style="cursor: pointer;" title="<?php echo esc_attr( $picsart_ai_image_editor_color ); ?>">
			<span class="picsart-color-option" data-color="<?php echo esc_attr( $picsart_ai_image_editor_color ); ?>" style="<?php echo esc_attr( $picsart_ai_image_editor_swatch_style ); ?>"></span>
		</label>
	<?php endforeach; ?>
</div>

<div id="<?php echo esc_attr( $picsart_ai_image_editor_picker_id ); ?>_wrapper" style="<?php echo esc_attr( 'margin-top:10px;' . ( ( 'multicolor' === $picsart_ai_image_editor_value || $picsart_ai_image_editor_is_custom ) ? '' : 'display:none;' ) ); ?>">
	<input type="text" id="<?php echo esc_attr( $picsart_ai_image_editor_picker_id ); ?>" class="picsart-color-picker" value="<?php echo esc_attr( $picsart_ai_image_editor_value ); ?>" />
</div>

<?php if ( ! empty( $args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $args['description'] ); ?></p>
<?php endif; ?>
