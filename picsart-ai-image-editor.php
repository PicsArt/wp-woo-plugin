<?php
/**
 * Plugin Name: Picsart Commerce
 * Description: Turn product photos into videos with Picsart. Includes photo editing, Drive browsing, explicit credit approval and Media Library publishing. Cloud tools require a Picsart account and a configured service connection.
 * Author: Picsart
 * Author URI: https://picsart.com
 * Plugin URI: https://picsart.com/commerce/
 * Version: 1.1.2
 * Requires at least: 6.8
 * Requires PHP: 8.2
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: picsart-ai-image-editor
 */
if (!defined('ABSPATH')) exit;
define('PICSART_PLUGIN_ENTRY',__FILE__);
require_once __DIR__ . '/includes/plugin-row.php';
require_once __DIR__ . '/includes/receipts.php';
require_once __DIR__ . '/includes/api.php';
require_once __DIR__ . '/includes/commerce.php';
require_once __DIR__ . '/includes/notifications.php';
require_once __DIR__ . '/includes/collections.php';
require_once __DIR__ . '/includes/video-widget.php';
require_once __DIR__ . '/includes/marketing.php';
require_once __DIR__ . '/includes/recovery.php';
register_activation_hook(__FILE__, function () { foreach (['administrator','shop_manager'] as $name) {$role=get_role($name);if ($role) $role->add_cap('picsart_generate');} });
function picsart_navigation_context() {
    if (!isset($_GET['_picsart_context']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_picsart_context'])),'picsart_navigation')) return [];
    return ['view'=>sanitize_key(wp_unslash($_GET['view']??'')), 'attachmentId'=>absint($_GET['attachment_id']??0), 'postId'=>absint($_GET['post_id']??0)?:null, 'termId'=>absint($_GET['term_id']??0)?:null, 'target'=>sanitize_key(wp_unslash($_GET['target']??''))?:null, 'productId'=>absint($_GET['product_id']??0)?:null];
}
add_action('admin_menu', function () {
    $render=function () { echo '<div id="picsart-studio"></div>'; };
    add_menu_page(__('Picsart','picsart-ai-image-editor'), __('Picsart','picsart-ai-image-editor'), 'upload_files', 'picsart-studio', function () {
        if (!current_user_can('upload_files')) return;
        if ((!defined('PICSART_SERVICE_URL') || !defined('PICSART_BRIDGE_SECRET') || !defined('PICSART_INSTALLATION_ID')) && !in_array((picsart_navigation_context()['view']??''), ['images','video-tools'], true)) {
            echo '<div class="wrap"><h1>'.esc_html__('Picsart Commerce','picsart-ai-image-editor').'</h1><p>'.esc_html__('Cloud tools are not configured on this site yet. Your administrator can complete service setup. Local image tools are available now.','picsart-ai-image-editor').'</p><a class="button button-primary" href="'.esc_url(picsart_commerce_link(0)).'">'.esc_html__('Edit images','picsart-ai-image-editor').'</a></div>'; return;
        }
        echo '<div id="picsart-studio"></div>';
    }, plugins_url('images/picsart-icon.svg',__FILE__), 58);
    add_submenu_page('picsart-studio',__('Video generation','picsart-ai-image-editor'),__('Video generation','picsart-ai-image-editor'),'upload_files','picsart-studio',$render);
    add_submenu_page('picsart-studio',__('Image generation','picsart-ai-image-editor'),__('Image generation','picsart-ai-image-editor'),'upload_files','picsart-image-generation',$render);
    add_submenu_page('picsart-studio',__('History','picsart-ai-image-editor'),__('History','picsart-ai-image-editor'),'upload_files','picsart-history',$render);
    add_submenu_page('picsart-studio',__('Settings','picsart-ai-image-editor'),__('Settings','picsart-ai-image-editor'),'upload_files','picsart-settings',$render);
});
add_action('admin_enqueue_scripts', function ($hook) {
    if (!in_array($hook,['toplevel_page_picsart-studio','picsart-commerce_page_picsart-image-generation','picsart-commerce_page_picsart-history'],true) && !str_ends_with($hook,'_page_picsart-image-generation') && !str_ends_with($hook,'_page_picsart-history') && !str_ends_with($hook,'_page_picsart-settings')) return;
    if (!picsart_video_configured() && !in_array((picsart_navigation_context()['view']??''), ['images','video-tools'], true)) return;
    wp_enqueue_media();
    wp_enqueue_style('picsart-studio', plugins_url('assets/studio.css', __FILE__), [], '1.1.2-' . (string) filemtime(__DIR__ . '/assets/studio.css'));
    wp_enqueue_script('picsart-studio', plugins_url('assets/studio.js', __FILE__), ['wp-element'], '1.1.2-' . (string) filemtime(__DIR__ . '/assets/studio.js'), true);
    wp_add_inline_script('picsart-studio', 'window.picsartStudio=' . wp_json_encode([
        'userId'=>get_current_user_id(), 'workspaceView'=>str_ends_with($hook,'_page_picsart-settings')?'settings':(str_ends_with($hook,'_page_picsart-image-generation')?'images':(str_ends_with($hook,'_page_picsart-history')?'history':'videos')), 'hasWooCommerce'=>function_exists('wc_get_products'), 'endpoint'=>rest_url('picsart/v1/studio'), 'wpEndpoint'=>rest_url('picsart/v1'), 'assetsUrl'=>plugins_url('assets/',__FILE__), 'nonce'=>wp_create_nonce('wp_rest'),
        ...picsart_navigation_context(), 'navigationNonce'=>wp_create_nonce('picsart_navigation'),
        'consent'=>picsart_commerce_consent()
    ]) . ';', 'before');
});
add_action('add_meta_boxes', function ($post_type,$post) {
    $type=get_post_type_object($post_type);
    if(!$post||!$type||!$type->show_ui||!current_user_can('edit_post',$post->ID)||!current_user_can('upload_files')||(!post_type_supports($post_type,'editor')&&!post_type_supports($post_type,'thumbnail')))return;
    add_meta_box('picsart-studio-entry', __('Picsart Commerce','picsart-ai-image-editor'), function ($post) {
        $context=['_picsart_context'=>wp_create_nonce('picsart_navigation'),'post_id'=>$post->ID];
        if($post->post_type==='product')$context['product_id']=$post->ID;
        $image=get_post_thumbnail_id($post->ID);
        $actions=[
            [__('Generate video','picsart-ai-image-editor'),add_query_arg($context+['page'=>'picsart-studio'],admin_url('admin.php'))],
            [__('Generate image','picsart-ai-image-editor'),add_query_arg($context+['page'=>'picsart-image-generation'],admin_url('admin.php'))],
            [__('Edit image with AI','picsart-ai-image-editor'),add_query_arg($context+['page'=>'picsart-image-generation','attachment_id'=>$image],admin_url('admin.php'))],
            [__('Crop, resize and watermark','picsart-ai-image-editor'),picsart_commerce_link($image,$post->ID,0,'featured')],
            [__('View History','picsart-ai-image-editor'),admin_url('admin.php?page=picsart-history')]
        ];
        echo '<p>'.esc_html__('Create and edit images and videos with Picsart. Review results before adding them to your content.','picsart-ai-image-editor').'</p><div style="display:flex;flex-direction:column;gap:8px">';
        foreach($actions as $action)echo '<a class="button" href="'.esc_url($action[1]).'">'.esc_html($action[0]).'</a>';
        echo '</div>';

    }, $post_type, 'side', 'high');
},10,2);
// A theme-independent video section preserves the native image gallery unchanged.
add_action('woocommerce_after_single_product_summary', function () {
    global $product;
    if (!$product) return;
    $ids = get_post_meta($product->get_id(), '_picsart_video_ids', true);
    if (!is_array($ids) || !$ids) return;
    $ids=array_filter($ids,function($id) use ($product){$markup=get_post_meta($product->get_id(),'_picsart_native_video_markup_'.$id,true);return !$markup||!str_contains(get_post_field('post_content',$product->get_id()),$markup);});if (!$ids) return;
    echo '<section class="picsart-product-videos"><h2>' . esc_html__('Product videos', 'picsart-ai-image-editor') . '</h2>';
    foreach ($ids as $id) { $markup=get_post_meta($product->get_id(),'_picsart_native_video_markup_'.$id,true);if ($markup&&str_contains(get_post_field('post_content',$product->get_id()),$markup))continue; $url = wp_get_attachment_url($id); if ($url) echo wp_kses_post(wp_video_shortcode(['src'=>$url, 'preload'=>'metadata'])); }
    echo '</section>';
}, 15);

add_action('admin_bar_menu',function($bar){
    if (!is_admin() || !current_user_can('upload_files')) return;
    $bar->add_node(['id'=>'picsart-account','title'=>'','href'=>'https://picsart.com/pricing/','parent'=>'top-secondary','meta'=>['class'=>'picsart-account-balance','target'=>'_blank','rel'=>'noopener noreferrer']]);
},100);
add_action('admin_head',function(){echo '<style>#wp-admin-bar-picsart-account{display:none}#wp-admin-bar-picsart-account:not([hidden]) a{font-weight:600}body:has(#picsart-studio) #wp-admin-bar-picsart-account:not([hidden]){display:block}#wp-admin-bar-picsart-account[hidden]{display:none!important}@media(max-width:782px){#wpadminbar li#wp-admin-bar-picsart-account{display:none}body:has(#picsart-studio) #wpadminbar li#wp-admin-bar-picsart-account:not([hidden]){display:block}#wp-admin-bar-picsart-account a{font-size:12px!important;padding:0 8px!important}}</style>';});
