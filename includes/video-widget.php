<?php
if (!defined('ABSPATH')) exit;
add_action('init',function(){register_block_type('picsart/video',['api_version'=>3,'attributes'=>['id'=>['type'=>'number'],'poster'=>['type'=>'number'],'ratio'=>['type'=>'string','default'=>'16 / 9'],'mode'=>['type'=>'string','default'=>'autoplay'],'fit'=>['type'=>'string','default'=>'cover'],'loop'=>['type'=>'boolean','default'=>true]],'render_callback'=>function($a){
$id=absint($a['id']??0);if(!picsart_collection_public_media($id)||!in_array(get_post_mime_type($id),['video/mp4','video/webm'],true))return '';
$ratio=in_array($a['ratio']??'', ['16 / 9','9 / 16','1 / 1','3 / 4','4 / 3','21 / 9'],true)?$a['ratio']:'16 / 9';
$mode=in_array($a['mode']??'', ['autoplay','hover','hover-only','manual'],true)?$a['mode']:'manual';
$poster=absint($a['poster']??0);$poster_url=$poster&&picsart_collection_public_media($poster)&&wp_attachment_is_image($poster)?wp_get_attachment_url($poster):'';
wp_enqueue_script('picsart-video-widget',plugins_url('../assets/video-widget.js',__FILE__),[],filemtime(__DIR__.'/../assets/video-widget.js'),true);
return '<video class="picsart-video-widget" controls playsinline preload="none" tabindex="0" aria-label="'.esc_attr(get_the_title($id)?:__('Video','picsart-ai-image-editor')).'" data-playback="'.esc_attr($mode).'" src="'.esc_url(wp_get_attachment_url($id)).'"'.($poster_url?' poster="'.esc_url($poster_url).'"':'').($mode!=='manual'?' muted':'').(!empty($a['loop'])?' loop':'').' style="width:100%;aspect-ratio:'.esc_attr($ratio).';object-fit:'.esc_attr(($a['fit']??'cover')==='contain'?'contain':'cover').'"></video>';
}]);});
add_action('enqueue_block_editor_assets',function(){wp_enqueue_script('picsart-video-widget-editor',plugins_url('../assets/video-widget-editor.js',__FILE__),['wp-element','wp-blocks','wp-block-editor','wp-components'],filemtime(__DIR__.'/../assets/video-widget-editor.js'),true);});
