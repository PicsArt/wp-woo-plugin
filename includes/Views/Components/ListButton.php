<?php
/**
 * ListButton component.
 *
 * @var mixed $args Passed arguments from Render::field().
 *
 * @package Picsart
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$picsart_ai_image_editor_args     = $args;
$picsart_ai_image_editor_html_tag = $args['tag'] ?? 'button';
if ( 'button' === $picsart_ai_image_editor_html_tag && empty( $picsart_ai_image_editor_args['type'] ) ) {
	$picsart_ai_image_editor_args['attributes']['type'] = 'button';
}
$picsart_ai_image_editor_label              = $picsart_ai_image_editor_args['label'] ?? '';
$picsart_ai_image_editor_variant            = $picsart_ai_image_editor_args['variant'] ?? 'normal';
$picsart_ai_image_editor_args['attributes'] = array_merge( $picsart_ai_image_editor_args['attributes'] ?? array(), array( 'class' => 'picsart-button ' . $picsart_ai_image_editor_variant ) );

?>

<<?php echo esc_attr( $picsart_ai_image_editor_html_tag ); ?><?php \PICSART\Helpers\Render::echo_html_attrs( $picsart_ai_image_editor_args['attributes'] ?? array() ); ?>>
<?php if ( ! isset( $picsart_ai_image_editor_args['hidden_icon'] ) ) : ?>
	<svg width="11" height="14" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M2.93853 9.18105C3.31163 9.41621 3.71558 9.59842 4.1388 9.72248C4.57782 9.84926 5.03182 9.91295 5.50019 9.91295C6.12716 9.91637 6.74874 9.79715 7.32995 9.56199C7.87899 9.32927 8.38017 8.99684 8.80812 8.58154C9.23635 8.16338 9.5793 7.66603 9.81792 7.11711C10.0633 6.55406 10.1879 5.94586 10.1839 5.33169C10.188 4.71731 10.0634 4.10888 9.81792 3.54565C9.58137 3.00016 9.23802 2.50755 8.80812 2.09683C8.38018 1.68151 7.879 1.34909 7.32995 1.11638C6.75109 0.871777 6.12859 0.747277 5.50019 0.750424C4.87178 0.747277 4.24929 0.871777 3.67043 1.11638C3.1183 1.35132 2.61278 1.6834 2.1779 2.09683C1.75539 2.51075 1.41732 3.0028 1.18246 3.54565C0.937016 4.10888 0.812352 4.71731 0.816507 5.33169V12.8256C0.816507 12.943 0.85585 13.0454 0.933911 13.1328C1.02134 13.2109 1.12376 13.2502 1.24116 13.2502H2.5145C2.56864 13.2516 2.6225 13.2419 2.67276 13.2217C2.72302 13.2016 2.76862 13.1713 2.80676 13.1328C2.89481 13.0454 2.93853 12.943 2.93853 12.8256V9.18105ZM8.06185 5.33169C8.06185 6.02487 7.80768 6.61502 7.29997 7.10275C6.80288 7.59047 6.20274 7.83465 5.50019 7.83465C5.16424 7.83937 4.83071 7.77708 4.51911 7.65141C4.20752 7.52574 3.92409 7.33922 3.68542 7.10275C3.1877 6.61502 2.93853 6.02487 2.93853 5.33169C2.93853 4.6485 3.1877 4.06335 3.68542 3.57562C3.92409 3.33915 4.20752 3.15262 4.51911 3.02695C4.83071 2.90129 5.16424 2.83899 5.50019 2.84372C6.20274 2.84372 6.80288 3.08727 7.3006 3.57562C7.80768 4.06272 8.06185 4.6485 8.06185 5.33169Z" fill="white"/>
	</svg>
<?php endif; ?>

<?php echo esc_html( $picsart_ai_image_editor_label ); ?>
</<?php echo esc_attr( $picsart_ai_image_editor_html_tag ); ?>>