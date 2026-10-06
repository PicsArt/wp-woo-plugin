<?php
if (!defined('ABSPATH')) exit;
function picsart_plugin_row_links($links, $file) {
    if ($file !== plugin_basename(PICSART_PLUGIN_ENTRY) || !current_user_can('upload_files')) return $links;
    $preferences=get_user_meta(get_current_user_id(),'_picsart_preferences',true);
    $configured=picsart_video_configured();
    $status=!$configured?__('Setup required','picsart-ai-image-editor'):(empty($preferences['consent'])?__('Not connected','picsart-ai-image-editor'):__('Checking connection…','picsart-ai-image-editor'));
    $links[]='<a href="'.esc_url(admin_url('admin.php?page=picsart-settings')).'">'.esc_html__('Settings','picsart-ai-image-editor').'</a>';
    $links[]='<a id="picsart-plugin-connect" href="'.esc_url(admin_url('admin.php?page=picsart-studio')).'">'.esc_html($configured?__('Connect account','picsart-ai-image-editor'):__('Set up Picsart','picsart-ai-image-editor')).'</a>';
    $links[]='<span id="picsart-plugin-status" role="status">'.esc_html__('Your Picsart account:','picsart-ai-image-editor').' <span>'.esc_html($status).'</span></span>';
    return $links;
}
add_filter('plugin_row_meta','picsart_plugin_row_links',10,2);
add_action('admin_enqueue_scripts',function($hook){
    if (!current_user_can('upload_files')||!picsart_video_configured()) return;
    $preferences=get_user_meta(get_current_user_id(),'_picsart_preferences',true);
    if (empty($preferences['consent']) || ($hook!=='plugins.php' && !empty($preferences['dismissed']))) return;
    wp_enqueue_script('picsart-plugin-row',plugins_url('plugin-row.js',__FILE__),[], filemtime(__DIR__.'/plugin-row.js'),true);
    wp_localize_script('picsart-plugin-row','picsartPluginRow',[
        'url'=>add_query_arg('route','/state',rest_url('picsart/v1/studio')),'nonce'=>wp_create_nonce('wp_rest'),
        'connected'=>__('Connected','picsart-ai-image-editor'),'disconnected'=>__('Not connected','picsart-ai-image-editor'),
        'reconnect'=>__('Reconnect required','picsart-ai-image-editor'),'unavailable'=>__('Status unavailable','picsart-ai-image-editor'),
        'manage'=>__('Manage account','picsart-ai-image-editor'),'connect'=>__('Connect account','picsart-ai-image-editor'),
        'settings'=>admin_url('admin.php?page=picsart-settings')
    ]);
});
