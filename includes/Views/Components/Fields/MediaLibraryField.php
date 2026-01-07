<?php
/**
 * Partial view for rendering a media upload field with preview and remove.
 *
 * @var mixed $args Passed arguments from Render::field().
 *
 * @package Picsasrt
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$picsart_ai_image_editor_ai_image_editor_media_id   = esc_attr( $args['value'] );
$picsart_ai_image_editor_ai_image_editor_media_url  = is_numeric( $picsart_ai_image_editor_ai_image_editor_media_id ) ? wp_get_attachment_url( (int) $picsart_ai_image_editor_ai_image_editor_media_id ) : $picsart_ai_image_editor_ai_image_editor_media_id;
$picsart_ai_image_editor_ai_image_editor_button_id  = $args['id'] . '_button';
$picsart_ai_image_editor_ai_image_editor_remove_id  = $args['id'] . '_remove';
$picsart_ai_image_editor_ai_image_editor_preview_id = $args['id'] . '_preview';

if ( ! empty( $args['label'] ) ) : ?>
	<label for="<?php echo esc_attr( $args['id'] ); ?>">
		<?php echo esc_html( $args['label'] ); ?>
	</label><br/>
<?php endif; ?>

<input type="hidden" id="<?php echo esc_attr( $args['id'] ); ?>" name="<?php echo esc_attr( $args['name'] ); ?>"
		value="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_media_url ?: "" ); ?>"/>
<div style="margin-top:10px;display:flex;align-items:center;gap:10px;">
	<img src="<?php echo esc_url( $picsart_ai_image_editor_ai_image_editor_media_url ?: "" ); ?>" id="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_preview_id ); ?>"
		style="max-height:50px;<?php echo $picsart_ai_image_editor_ai_image_editor_media_url ? '' : 'display:none;'; ?>"/>
	<input type="button" class="button" id="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_button_id ); ?>"
			value="<?php esc_attr_e( 'Select Image', 'picsart-ai-image-editor' ); ?>"/>
	<input type="button" class="button" id="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_remove_id ); ?>"
			value="<?php esc_attr_e( 'Remove', 'picsart-ai-image-editor' ); ?>" <?php echo $picsart_ai_image_editor_ai_image_editor_media_url ? '' : 'style="display:none;"'; ?> />
</div>

<?php if ( ! empty( $args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $args['description'] ); ?></p>
<?php endif; ?>

<script>
	jQuery(document).ready(function ($) {
		let frame;
		$('#<?php echo esc_js( $picsart_ai_image_editor_ai_image_editor_button_id ); ?>').on('click', function (e) {
			e.preventDefault();
			if (frame) {
				frame.open();
				return;
			}
			frame = wp.media({
				multiple: false
			});
			frame.on('select', function () {
				let attachment = frame.state().get('selection').first().toJSON();
				$('#<?php echo esc_js( $args['id'] ); ?>').val(attachment.url);
				$('#<?php echo esc_js( $picsart_ai_image_editor_ai_image_editor_preview_id ); ?>').attr('src', attachment.url).show();
				$('#<?php echo esc_js( $picsart_ai_image_editor_ai_image_editor_remove_id ); ?>').show();
			});
			frame.open();
		});
		$('#<?php echo esc_js( $picsart_ai_image_editor_ai_image_editor_remove_id ); ?>').on('click', function () {
			$('#<?php echo esc_js( $args['id'] ); ?>').val('');
			$('#<?php echo esc_js( $picsart_ai_image_editor_ai_image_editor_preview_id ); ?>').hide();
			$(this).hide();
		});
	});
</script>