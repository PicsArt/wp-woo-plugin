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

$picsart_ai_image_editor_ai_image_editor_colors    = $args['options'];
$picsart_ai_image_editor_ai_image_editor_value     = $args['value'];
$picsart_ai_image_editor_ai_image_editor_field_id  = esc_attr( $args['id'] );
$picsart_ai_image_editor_ai_image_editor_picker_id = $picsart_ai_image_editor_ai_image_editor_field_id . '_picker';
$picsart_ai_image_editor_ai_image_editor_name      = esc_attr( $args['name'] );
$picsart_ai_image_editor_ai_image_editor_is_custom = ! array_key_exists( $picsart_ai_image_editor_ai_image_editor_value, $picsart_ai_image_editor_ai_image_editor_colors ) && 'transparent' !== $picsart_ai_image_editor_ai_image_editor_value && 'multicolor' !== $picsart_ai_image_editor_ai_image_editor_value;
?>

<?php if ( ! empty( $args['label'] ) ) : ?>
	<label for="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_field_id ); ?>"><?php echo esc_html( $args['label'] ); ?></label><br />
<?php endif; ?>

<input type="hidden" id="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_field_id ); ?>" name="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_name ); ?>" value="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_value ); ?>" />

<div style="display: flex; flex-wrap: wrap; gap: 6px;" data-target="#<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_field_id ); ?>" class="picsart-radio-color-field">
	<?php
	foreach ( $picsart_ai_image_editor_ai_image_editor_colors as $picsart_ai_image_editor_ai_image_editor_color => $picsart_ai_image_editor_ai_image_editor_label ) :
		$picsart_ai_image_editor_ai_image_editor_selected = $picsart_ai_image_editor_ai_image_editor_color === $picsart_ai_image_editor_ai_image_editor_value;
		$picsart_ai_image_editor_ai_image_editor_border   = $picsart_ai_image_editor_ai_image_editor_selected ? '#333' : '#ccc';

		if ( 'transparent'===$picsart_ai_image_editor_ai_image_editor_color ) {
			$picsart_ai_image_editor_ai_image_editor_background = 'background-image: linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%);
						   background-size:10px 10px; background-position:0 0, 5px 5px;';
		} elseif ( 'multicolor'===$picsart_ai_image_editor_ai_image_editor_color ) {
			$picsart_ai_image_editor_ai_image_editor_background = 'background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet);';
		} else {
			$picsart_ai_image_editor_ai_image_editor_background = 'background: ' . esc_attr( $picsart_ai_image_editor_ai_image_editor_color ) . ';';
		}
		?>
		<label style="cursor: pointer;" title="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_color ); ?>">
			<span class="picsart-color-option" data-color="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_color ); ?>"
					style="display: inline-block; width: 30px; height: 30px; border-radius: 4px; border: 2px solid <?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_border ); ?>; <?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_background ); ?>"></span>
		</label>
	<?php endforeach; ?>
</div>

<div id="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_picker_id ); ?>_wrapper" style="margin-top:10px; <?php echo ( 'multicolor' === $picsart_ai_image_editor_ai_image_editor_value || $picsart_ai_image_editor_ai_image_editor_is_custom ) ? '' : 'display:none;'; ?>">
	<input type="text" id="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_picker_id ); ?>" class="picsart-color-picker" value="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_value ); ?>" />
</div>

<?php if ( ! empty( $args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $args['description'] ); ?></p>
<?php endif; ?>

<script>
	jQuery(document).ready(function($) {
		const $field = $('#<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_field_id ); ?>');
		const $pickerWrapper = $('#<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_picker_id ); ?>_wrapper');
		const $picker = $('#<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_picker_id ); ?>');

		// Init wpColorPicker
		$picker.wpColorPicker({
			change: function(event, ui) {
				let val = ui.color.toString();
				$field.val(val).trigger('change');
			},
			clear: function() {
				$field.val('').trigger('change');
			}
		});

		$('.picsart-radio-color-field .picsart-color-option').on('click', function() {
			const selectedColor = $(this).data('color');

			// update UI
			$('.picsart-color-option').css('border', '2px solid #ccc');
			$(this).css('border', '2px solid #333');

			// update field
			$field.val(selectedColor).trigger('change');

			// toggle picker
			if (selectedColor === 'multicolor') {
				$pickerWrapper.slideDown();
				$picker.wpColorPicker('color', $field.val());
			} else {
				$pickerWrapper.slideUp();
			}
		});
	});
</script>