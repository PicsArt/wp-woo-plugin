<?php
if (!defined('ABSPATH')) exit;
// Fixed Picsart endpoint from the partnership Reddit app. Never proxy a caller URL.
function picsart_catalog_url($url) {
    $parts=wp_parse_url(is_string($url)?$url:'');
    return is_array($parts) && ($parts['scheme']??'')==='https' && preg_match('/^cdn[0-9]*\.picsart\.com$/i',$parts['host']??'') && empty($parts['user']) && empty($parts['pass']) && empty($parts['port']) ? esc_url_raw($url) : '';
}
function picsart_catalog_items($data) {
    $items=[];
    foreach (($data['response']??[]) as $group) foreach (($group['data']??[]) as $item) {
        if (($item['license']??'')!=='fte' || ($item['is_paid']??true)!==false || !in_array($item['type']??'', ['photo','video'],true)) continue;
        $id=(string)($item['id']??''); $author=sanitize_text_field($item['user']['name']??$item['user']['username']??'');
        if (!preg_match('/^[0-9]+$/',$id) || !$author) continue;
        // In this feed url is the poster; preview_url is the actual video file.
        $video=$item['type']==='video';$url=picsart_catalog_url($video?($item['preview_url']??''):($item['url']??''));
        if (!$url || ($video && !preg_match('/\.mp4$/i',wp_parse_url($url,PHP_URL_PATH)??''))) continue;
        $page='https://picsart.com/i/'.$id;
        $items[]=['sourceId'=>$id,'title'=>sanitize_text_field($item['title']??'')?:$author.' — Picsart','url'=>$url,'previewUrl'=>picsart_catalog_url($item['url']??''),'mediaType'=>$video?'video':'image','alt'=>sanitize_text_field($item['title']??''),'caption'=>esc_html($author).' · <a href="'.esc_url($page).'">Picsart</a>','pageUrl'=>$page];
    }
    return $items;
}
add_action('rest_api_init',function(){register_rest_route('picsart/v1','/catalog',[
    'methods'=>'GET','permission_callback'=>'picsart_commerce_permission','callback'=>function($request){
        $check=new WP_REST_Request('GET');$check->set_query_params(['route'=>'/state']);
        $state=picsart_video_proxy($check);
        if (is_wp_error($state)) return $state;
        $account=$state->get_data();
        if ($state->get_status()!==200 || empty($account['auth']['authenticated']) || !empty($account['auth']['requiresReconnect'])) return picsart_video_error(__('Connect Picsart to browse its media.','picsart-ai-image-editor'),403);
        $page=max(1,absint($request['page']??1));
        if($page>100)return new WP_REST_Response([],200,['Cache-Control'=>'no-store']);
        $key='picsart_catalog_v1_'.$page;$items=get_transient($key);
        if ($items===false) {
            $response=wp_safe_remote_get('https://api.picsart.com/users/network/cold-start?use_featured_feed=true&limit=60&offset='.(($page-1)*60),['timeout'=>20,'redirection'=>0,'limit_response_size'=>2097152,'headers'=>['User-Agent'=>'PicsartWordPress/1.0']]);
            if(is_wp_error($response)||wp_remote_retrieve_response_code($response)!==200)return picsart_video_error(__('Picsart featured media could not be loaded. Try again.','picsart-ai-image-editor'),502);
            $data=json_decode(wp_remote_retrieve_body($response),true);
            if(!is_array($data)||!isset($data['response']))return picsart_video_error(__('Unexpected Picsart catalog response.','picsart-ai-image-editor'),502);
            $items=picsart_catalog_items($data);set_transient($key,$items,300);
        }
        return new WP_REST_Response($items,200,['Cache-Control'=>'no-store']);
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
