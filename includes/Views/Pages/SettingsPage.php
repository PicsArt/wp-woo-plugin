<?php
/**
 * Settings Page
 *
 * @package PICSART
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$picsart_ai_image_editor_ai_image_editor_console_url      = 'https://console.picsart.io/wp?utm_campaign=[type]&utm_source=wordpress&utm_medium=[type_plugin]&utm_content=api,photo_editor&pcp_wp_instance=[path_to_wp]';
$picsart_ai_image_editor_ai_image_editor_console_url      = str_replace(
	array(
		'[type]',
		'[type_plugin]',
		'[path_to_wp]',
	),
	array(
		class_exists( 'WooCommerce' ) ? 'woocommerce' : 'wp',
		class_exists( 'WooCommerce' ) ? 'woocommerce_plugin' : 'wp_plugin',
		admin_url(),
	),
	$picsart_ai_image_editor_ai_image_editor_console_url
);
$picsart_ai_image_editor_ai_image_editor_onbording_points = array(
	array(
		'title'      => __( "Sign up or log in to access your dashboard.", "picsart-ai-image-editor" ),
		'link_label' => __( "Log in / Sign in", "picsart-ai-image-editor" ),
		'link_url'   => $picsart_ai_image_editor_ai_image_editor_console_url,
		'is_checked' => true,
	),
	array(
		'title'      => __( "Review product offerings and integration tools to discover available APIs and features.", "picsart-ai-image-editor" ),
		'link_label' => __( "Explore products", "picsart-ai-image-editor" ),
		'link_url'   => "https://picsart.io/all-api-products/",
		'is_checked' => false,
	),
	array(
		'title'      => __( "Monitor your API usage and track remaining credits to ensure seamless operations.", "picsart-ai-image-editor" ),
		'link_label' => __( "View usage", "picsart-ai-image-editor" ),
		'link_url'   => "#",
		'is_checked' => false,
	),
	array(
		'title'      => __( "View your billing information, track payments, and manage invoices.", "picsart-ai-image-editor" ),
		'link_label' => __( "Manage billing", "picsart-ai-image-editor" ),
		'link_url'   => "#",
		'is_checked' => false,
	),
)

?>

<div class="picsart-wrapper">
	<div class="mr-[1rem] mt-[1rem]">
		<div class="wlc-bg-accents-secondary wlc-px-[1rem] lg:wlc-px-[1.5rem] wlc-py-[1rem] wlc-rounded wlc-rounded-xs wlc-flex wlc-flex-wrap wlc-justify-between wlc-items-center">
			<div class="wlc-flex wlc-gap-[0.5rem]">
				<?php if ( defined( 'PICSART_PLUGIN_FILE' ) ) : ?>
					<div>
						<img src="
						<?php
						echo esc_url(
							plugin_dir_url( PICSART_PLUGIN_FILE ) . 'assets/icons/picsart-sygnet-light.png'
						);
						?>
"
							alt="<?php echo esc_attr__( "Picsart Sygnet", "picsart-ai-image-editor" ); ?>"
							class="wlc-min-w-[2.75rem] wlc-min-h-[2.75rem] wlc-block"
							width="44"
							height="44">
					</div>
				<?php endif; ?>
				<div>
					<h2 class="wlc-text-xl wlc-font-semibold wlc-text-white wlc-mt-0">
						<?php echo esc_attr__( "Picsart for WooCommerce", "picsart-ai-image-editor" ); ?>
					</h2>
					<p class="wlc-text-sm wlc-font-medium wlc-text-white wlc-pt-[0.25rem]">
						<?php echo esc_attr__( "Many print-on-demand services are finding a strong digital foothold as consumers evolve into SMBs and move further online to cover their business need", "picsart-ai-image-editor" ); ?>
					</p>
				</div>
			</div>
			<div class="wlc-w-full lg:wlc-w-auto wlc-mt-[1rem] xl:wlc-mt-0">
				<a href="#"
					class="picsart-button-outline "
					target="_blank"
				>
					<?php echo esc_attr__( 'Read more', 'picsart-ai-image-editor' ); ?>
				</a>
			</div>
		</div>

		<div class="wlc-bg-white wlc-border wlc-border-[#CFCFCF] wlc-border-l-border wlc-border-l-[0.4rem] wlc-pl-[1.1rem] wlc-px-[1.5rem] wlc-py-[1rem] wlc-mt-[1rem] wlc-flex wlc-flex-wrap wlc-justify-between ">
			<div class="wlc-flex wlc-gap-[0.5rem]">
				<?php if ( defined( 'PICSART_PLUGIN_FILE' ) ) : ?>
					<div>
						<img src="<?php echo esc_url( plugin_dir_url( PICSART_PLUGIN_FILE ) . 'assets/icons/picsart-sygnet-dark.png' ); ?>"
							alt="<?php echo esc_attr__( "Picsart Sygnet", "picsart-ai-image-editor" ); ?>"
							class="wlc-min-w-[2.75rem] wlc-min-h-[2.75rem] wlc-block"
							width="44"
							height="44">
					</div>
				<?php endif; ?>
				<div>
					<h2 class="wlc-text-xl wlc-font-semibold wlc-text-old-colors wlc-mt-0">
						<?php echo esc_attr__( "Continue your onboarding", "picsart-ai-image-editor" ); ?>
					</h2>

					<ul class="picsart-onbording-list">
						<?php foreach ( $picsart_ai_image_editor_ai_image_editor_onbording_points as $picsart_ai_image_editor_ai_image_editor_onbording_point ) : ?>
							<li class="<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_onbording_point['is_checked'] ? "is_checked" : "" ); ?>">
								<span>
									<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_onbording_point['title'] ); ?>
								</span>
								<a href="<?php echo esc_url( $picsart_ai_image_editor_ai_image_editor_onbording_point['link_url'] ); ?>"
									target="_blank"
									class="picsart-link"
								>
									<?php echo esc_attr( $picsart_ai_image_editor_ai_image_editor_onbording_point['link_label'] ); ?>
								</a>
							</li>
						<?php endforeach; ?>
					</ul>

				</div>
			</div>

			<div class="wlc-w-full wlc-mt-[1rem] wlc-h-[15.9375rem] xl:wlc-mt-0 lg:wlc-w-[28.4375rem]">
				<iframe width="100%"
						height="100%"
						class="wlc-rounded-xl"
						src="https://www.youtube.com/embed/K4TOrB7at0Y?si=1qtn5ieTfTfruKk8"
						title="YouTube video player"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						referrerpolicy="strict-origin-when-cross-origin"
						allowfullscreen></iframe>
			</div>
		</div>
	</div>
</div>

<div class="wrap">
	<?php settings_errors(); ?>
	<form action="options.php" method="post">
		<?php
		settings_fields( 'picsart_settings_group' );
		do_settings_sections( 'picsart_settings' );
		submit_button();
		?>
	</form>
</div>
