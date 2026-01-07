<?php
/**
 * Button component.
 *
 * @var mixed $args Passed arguments from Render::field().
 *
 * @package Picsasrt
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$picsart_ai_image_editor_args = $args;
if ( empty( $picsart_ai_image_editor_args['label'] ) ) {
	esc_attr_e( 'Missing label in dropdown component', 'picsart-ai-image-editor' );

	return;
}

?>

<ul class="picsart-dropdown list <?php echo esc_attr( $picsart_ai_image_editor_args['position'] ?? 'bottom' ); ?>">
	<li>
		<div class="picsart-button list">
			<?php echo esc_attr( $picsart_ai_image_editor_args['label'] ); ?>

			<svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M10.7808 0.432373C10.8799 0.432373 10.9782 0.45205 11.0698 0.48999C11.1614 0.52791 11.2448 0.583043 11.3149 0.653076C11.3851 0.723186 11.441 0.806605 11.479 0.898193C11.5169 0.989771 11.5366 1.08813 11.5366 1.18726C11.5366 1.28637 11.5169 1.38474 11.479 1.47632C11.441 1.56797 11.3851 1.65128 11.3149 1.72144L6.78369 6.25269C6.71358 6.32285 6.6302 6.37876 6.53857 6.41675C6.44698 6.45466 6.34864 6.47437 6.24951 6.47437C6.15035 6.47433 6.05206 6.45472 5.96045 6.41675C5.86881 6.37874 5.78544 6.32288 5.71533 6.25269L1.18408 1.72144C1.04256 1.57978 0.963379 1.3875 0.963379 1.18726C0.963446 0.986986 1.04247 0.794693 1.18408 0.653076C1.3257 0.511459 1.51799 0.43244 1.71826 0.432373C1.9185 0.432373 2.11079 0.511557 2.25244 0.653076L6.24951 4.65112L10.2466 0.653076C10.3166 0.583011 10.4002 0.527952 10.4917 0.48999C10.5833 0.452057 10.6816 0.432406 10.7808 0.432373Z" fill="white" stroke="white" stroke-width="0.604167"/>
			</svg>
		</div>


		<?php if ( ! empty( $picsart_ai_image_editor_args['children'] ) || ! is_array( $picsart_ai_image_editor_args['children'] ) ) : ?>
			<ul class="picsart-dropdown-list">
				<?php foreach ( $picsart_ai_image_editor_args['children'] as $picsart_ai_image_editor_child ) : ?>
					<?php if ( !empty( $picsart_ai_image_editor_child['label'] ) ) : ?>
						<li>
							<<?php echo esc_attr( $picsart_ai_image_editor_child['tag'] ?? 'button' ); ?> <?php echo !empty( $picsart_ai_image_editor_child['attributes'] ) ? \PICSART\Helpers\Render::build_html_attr( $picsart_ai_image_editor_child['attributes'] ) : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
								<?php echo esc_attr( $picsart_ai_image_editor_child['label'] ); ?>
							</<?php echo esc_attr( $picsart_ai_image_editor_child['tag'] ?? 'button' ); ?>>
						</li>
					<?php endif ?>
				<?php endforeach; ?>
			</ul>
		<?php endif; ?>
	</li>
</ul>
