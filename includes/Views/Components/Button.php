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

$picsart_ai_image_editor_args     = $args;
$picsart_ai_image_editor_html_tag = $picsart_ai_image_editor_args['tag'] ?? 'button';
if ( 'button' === $picsart_ai_image_editor_html_tag && empty( $picsart_ai_image_editor_args['type'] ) ) {
	$picsart_ai_image_editor_args['attributes']['type'] = 'button';
}
$picsart_ai_image_editor_label              = $picsart_ai_image_editor_args['label'] ?? '';
$picsart_ai_image_editor_variant            = $picsart_ai_image_editor_args['variant'] ?? 'normal';
$picsart_ai_image_editor_args['attributes'] = array_merge( $picsart_ai_image_editor_args['attributes'] ?? array(), array( 'class' => 'picsart-button ' . $picsart_ai_image_editor_variant ) );

?>

<<?php echo esc_attr( $picsart_ai_image_editor_html_tag ); ?><?php \PICSART\Helpers\Render::echo_html_attrs( $picsart_ai_image_editor_args['attributes'] ?? array() ); ?>>
<?php if ( ! isset( $picsart_ai_image_editor_args['hidden_icon'] ) ) : ?>
	<svg xmlns="http://www.w3.org/2000/svg" width="15" height="16" viewBox="0 0 15 16" fill="none">
		<path d="M4.93853 10.1811C5.31163 10.4162 5.71558 10.5984 6.1388 10.7225C6.57782 10.8493 7.03182 10.913 7.50019 10.913C8.12716 10.9164 8.74874 10.7971 9.32995 10.562C9.87899 10.3293 10.3802 9.99684 10.8081 9.58154C11.2364 9.16338 11.5793 8.66603 11.8179 8.11711C12.0633 7.55406 12.1879 6.94586 12.1839 6.33169C12.188 5.71731 12.0634 5.10888 11.8179 4.54565C11.5814 4.00016 11.238 3.50755 10.8081 3.09683C10.3802 2.68151 9.879 2.34909 9.32995 2.11638C8.75109 1.87178 8.12859 1.74728 7.50019 1.75042C6.87178 1.74728 6.24929 1.87178 5.67043 2.11638C5.1183 2.35132 4.61278 2.6834 4.1779 3.09683C3.75539 3.51075 3.41732 4.0028 3.18246 4.54565C2.93702 5.10888 2.81235 5.71731 2.81651 6.33169V13.8256C2.81651 13.943 2.85585 14.0454 2.93391 14.1328C3.02134 14.2109 3.12376 14.2502 3.24116 14.2502H4.5145C4.56864 14.2516 4.6225 14.2419 4.67276 14.2217C4.72302 14.2016 4.76862 14.1713 4.80676 14.1328C4.89481 14.0454 4.93853 13.943 4.93853 13.8256V10.1811ZM10.0619 6.33169C10.0619 7.02487 9.80768 7.61502 9.29997 8.10275C8.80288 8.59047 8.20274 8.83465 7.50019 8.83465C7.16424 8.83937 6.83071 8.77708 6.51911 8.65141C6.20752 8.52574 5.92409 8.33922 5.68542 8.10275C5.1877 7.61502 4.93853 7.02487 4.93853 6.33169C4.93853 5.6485 5.1877 5.06335 5.68542 4.57562C5.92409 4.33915 6.20752 4.15262 6.51911 4.02695C6.83071 3.90129 7.16424 3.83899 7.50019 3.84372C8.20274 3.84372 8.80288 4.08727 9.3006 4.57562C9.80768 5.06272 10.0619 5.6485 10.0619 6.33169Z"
				fill="white"/>
	</svg>
<?php endif; ?>

<?php echo esc_html( $picsart_ai_image_editor_label ); ?>
</<?php echo esc_attr( $picsart_ai_image_editor_html_tag ); ?>>