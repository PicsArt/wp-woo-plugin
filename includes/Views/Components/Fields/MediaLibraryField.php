<?php
/**
 * Partial view for rendering a media upload field with preview and remove.
 *
 * @var mixed $args Passed arguments from Render::field().
 *
 * @package Picsart
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$picsart_ai_image_editor_field_id   = $args['id'];
$picsart_ai_image_editor_media_id   = $args['value'];
$picsart_ai_image_editor_media_url  = is_numeric( $picsart_ai_image_editor_media_id )
	? wp_get_attachment_url( (int) $picsart_ai_image_editor_media_id )
	: $picsart_ai_image_editor_media_id;
$picsart_ai_image_editor_media_url  = $picsart_ai_image_editor_media_url ?: '';
$picsart_ai_image_editor_button_id  = $picsart_ai_image_editor_field_id . '_button';
$picsart_ai_image_editor_remove_id  = $picsart_ai_image_editor_field_id . '_remove';
$picsart_ai_image_editor_preview_id = $picsart_ai_image_editor_field_id . '_preview';

if ( ! empty( $args['label'] ) ) : ?>
	<label for="<?php echo esc_attr( $picsart_ai_image_editor_field_id ); ?>">
		<?php echo esc_html( $args['label'] ); ?>
	</label><br/>
<?php endif; ?>

<input type="hidden" id="<?php echo esc_attr( $picsart_ai_image_editor_field_id ); ?>" name="<?php echo esc_attr( $args['name'] ); ?>"
		value="<?php echo esc_attr( $picsart_ai_image_editor_media_url ); ?>"/>

<div
	class="picsart-media-library-field"
	style="margin-top:10px;display:flex;align-items:center;gap:10px;"
	data-field-target="#<?php echo esc_attr( $picsart_ai_image_editor_field_id ); ?>"
	data-preview-target="#<?php echo esc_attr( $picsart_ai_image_editor_preview_id ); ?>"
	data-select-target="#<?php echo esc_attr( $picsart_ai_image_editor_button_id ); ?>"
	data-remove-target="#<?php echo esc_attr( $picsart_ai_image_editor_remove_id ); ?>"
>
	<img src="<?php echo esc_url( $picsart_ai_image_editor_media_url ); ?>" id="<?php echo esc_attr( $picsart_ai_image_editor_preview_id ); ?>"
		style="<?php echo esc_attr( 'max-height:50px;' . ( $picsart_ai_image_editor_media_url ? '' : 'display:none;' ) ); ?>" alt=""/>
	<input type="button" class="button" id="<?php echo esc_attr( $picsart_ai_image_editor_button_id ); ?>"
			value="<?php esc_attr_e( 'Select Image', 'picsart-ai-image-editor' ); ?>"/>
	<input type="button" class="button" id="<?php echo esc_attr( $picsart_ai_image_editor_remove_id ); ?>"
			value="<?php esc_attr_e( 'Remove', 'picsart-ai-image-editor' ); ?>"
			style="<?php echo esc_attr( $picsart_ai_image_editor_media_url ? '' : 'display:none;' ); ?>" />
</div>

<?php if ( ! empty( $args['description'] ) ) : ?>
	<p class="description"><?php echo esc_html( $args['description'] ); ?></p>
<?php endif; ?>
