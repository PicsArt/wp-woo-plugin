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
	esc_html_e( 'Missing label in dropdown component', 'picsart-ai-image-editor' );

	return;
}

?>

<div class="picsart-dropdown <?php echo esc_attr( $args['position'] ?? 'bottom' ); ?>">
	<div class="picsart-button secondary">
		<?php echo esc_html( $args['label'] ); ?>

		<svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none">
			<path d="M11.7808 5.43237C11.8799 5.43237 11.9782 5.45205 12.0698 5.48999L12.2007 5.55933C12.2416 5.58669 12.2799 5.61809 12.3149 5.65308L12.4087 5.76733C12.4362 5.80849 12.46 5.85223 12.479 5.89819L12.522 6.03979C12.5316 6.08823 12.5366 6.13763 12.5366 6.18726C12.5366 6.2368 12.5316 6.28635 12.522 6.33472L12.479 6.47632C12.46 6.52222 12.4362 6.56608 12.4087 6.60718L12.3149 6.72144L7.78369 11.2527C7.74868 11.2877 7.7104 11.319 7.66943 11.3464L7.53857 11.4167C7.44698 11.4547 7.34864 11.4744 7.24951 11.4744C7.19988 11.4743 7.15049 11.4694 7.10205 11.4597L6.96045 11.4167C6.91448 11.3977 6.87074 11.374 6.82959 11.3464L6.71533 11.2527L2.18408 6.72144C2.04256 6.57978 1.96338 6.3875 1.96338 6.18726C1.96345 5.98699 2.04247 5.79469 2.18408 5.65308L2.29932 5.55933C2.4225 5.47713 2.568 5.43242 2.71826 5.43237L2.8667 5.44702C3.01173 5.47605 3.14627 5.547 3.25244 5.65308L7.24951 9.65112L11.2466 5.65308L11.3608 5.55933C11.4019 5.53188 11.4459 5.50899 11.4917 5.48999L11.6333 5.44702C11.6818 5.43735 11.7311 5.43239 11.7808 5.43237Z"
				fill="#5b00ee" stroke="#5b00ee" stroke-width="0.604167"/>
		</svg>
	</div>


	<?php if ( ! empty( $args['children'] ) || ! is_array( $args['children'] ) ) : ?>
		<ul class="picsart-dropdown-list">
			<?php foreach ( $args['children'] as $picsart_ai_image_editor_child ) : ?>
				<?php if ( !empty( $picsart_ai_image_editor_child['label'] ) ) : ?>
					<li>
						<<?php echo esc_attr( $picsart_ai_image_editor_child['tag'] ?? 'button' ); ?><?php \PICSART\Helpers\Render::echo_html_attrs( $picsart_ai_image_editor_child['attributes'] ?? array() ); ?>>
							<?php echo esc_html( $picsart_ai_image_editor_child['label'] ); ?>
						</<?php echo esc_attr( $picsart_ai_image_editor_child['tag'] ?? 'button' ); ?>>
					</li>
				<?php endif ?>
			<?php endforeach; ?>
		</ul>
	<?php endif; ?>
</div>
