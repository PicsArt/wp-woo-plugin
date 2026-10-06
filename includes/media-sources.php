<?php
if (!defined('ABSPATH')) exit;
// Public catalog is unavailable until Picsart provides a supported reuse, attribution,
// canonical URL and takedown contract. Never infer publication rights from a featured feed.
add_action('rest_api_init',function(){register_rest_route('picsart/v1','/catalog',[
    'methods'=>'GET','permission_callback'=>'picsart_commerce_permission','callback'=>function(){
        return picsart_video_error(__('Picsart public media browsing is not available yet. Use your Picsart Drive or WordPress Media Library.','picsart-ai-image-editor'),503);
    }
]);});
add_action('wp_enqueue_media',function(){
    if(!current_user_can('upload_files'))return;
    wp_enqueue_script('picsart-media-sources',plugins_url('../assets/media-sources.js',__FILE__),['media-views','wp-api-fetch','wp-data','wp-i18n','wp-dom-ready'],filemtime(__DIR__.'/../assets/media-sources.js'),true);
    $post=get_post();$product_url='';
    if($post && $post->post_type==='product' && function_exists('wc_get_product') && current_user_can('edit_post',$post->ID)) {
        $product_url=add_query_arg(['page'=>'picsart-studio','product_id'=>$post->ID,'_picsart_context'=>wp_create_nonce('picsart_navigation')],admin_url('admin.php'));
    }
    wp_localize_script('picsart-media-sources','picsartMediaSources',['tools'=>picsart_commerce_link(0),'productVideo'=>$product_url]);
});
