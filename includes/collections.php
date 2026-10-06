<?php
/** Native collection layouts. WordPress draft/publish controls remain authoritative. */
if (!defined('ABSPATH')) exit;
function picsart_collection_presets() {
    return ['square-small'=>['1 / 1','small','carousel'],'square-medium'=>['1 / 1','medium','carousel'],'square-large'=>['1 / 1','large','carousel'],'portrait'=>['3 / 4','medium','carousel'],'landscape'=>['16 / 9','large','carousel'],'stories'=>['9 / 16','small','carousel'],'hero'=>['16 / 9','hero','hero'],'spotlight'=>['1 / 1','large','spotlight'],'brand-story'=>['16 / 9','large','story'],'editorial'=>['3 / 4','large','editorial'],'seasonal'=>['16 / 9','hero','banner']];
}
function picsart_collection_public_media($id) {
    if (get_post_type($id)!=='attachment' || !in_array(get_post_status($id),['inherit','publish'],true)) return false;
    $parent=wp_get_post_parent_id($id); return !$parent || get_post_status($parent)==='publish';
}
function picsart_collection_https($url) {return wp_parse_url((string)$url,PHP_URL_SCHEME)==='https'?esc_url_raw($url,['https']):'';}
function picsart_collection_render($a) {
    $presets=picsart_collection_presets();$preset=$presets[$a['preset']??'square-medium']??$presets['square-medium'];
    $ratio=in_array($a['ratio']??'', ['1 / 1','3 / 4','16 / 9','9 / 16'],true)?$a['ratio']:$preset[0];
    $size=in_array($a['size']??'', ['small','medium','large','hero'],true)?$a['size']:$preset[1];
    $fit=($a['fit']??'contain')==='cover'?'cover':'contain';$gap=max(0,min(64,(int)($a['gap']??16)));$radius=max(0,min(40,(int)($a['radius']??0)));
    $x=max(0,min(100,(int)($a['focusX']??50)));$y=max(0,min(100,(int)($a['focusY']??50)));$items=[];$seen=[];
    foreach (array_slice(is_array($a['items']??null)?$a['items']:[],0,20) as $item) {
        $id=absint($item['id']??0);if (!$id || isset($seen[$id]) || !picsart_collection_public_media($id)) continue;$seen[$id]=true;
        $mime=get_post_mime_type($id);$url=wp_get_attachment_url($id);if (!$url) continue;
        $style='aspect-ratio:'.$ratio.';object-fit:'.$fit.';object-position:'.$x.'% '.$y.'%;border-radius:'.$radius.'px';
        $title=mb_substr(sanitize_text_field($item['title']??get_the_title($id)),0,120);$alt=mb_substr(sanitize_text_field($item['alt']??get_post_meta($id,'_wp_attachment_image_alt',true)),0,300);
        if (wp_attachment_is_image($id)) $media='<img loading="lazy" src="'.esc_url($url).'" alt="'.esc_attr($alt).'" style="'.esc_attr($style).'">';
        elseif (in_array($mime,['video/mp4','video/webm'],true)) {
            $poster=absint($item['poster']??0);$poster_url=$poster&&picsart_collection_public_media($poster)&&wp_attachment_is_image($poster)?wp_get_attachment_url($poster):'';
            $start=max(0,min(7200,(float)($item['start']??0)));$end=max(0,min(7200,(float)($item['end']??0)));if ($end && $end<=$start) $end=0;
            $media='<video controls playsinline preload="none" style="'.esc_attr($style).'" src="'.esc_url($url).'" data-start="'.esc_attr($start).'" data-end="'.esc_attr($end).'"'.($poster_url?' poster="'.esc_url($poster_url).'"':'').(!empty($item['mute'])||!empty($item['autoplay'])?' muted':'').(!empty($item['loop'])?' loop':'').(!empty($item['autoplay'])?' data-autoplay="1"':'').'>';
            $captions=picsart_collection_https($item['captions']??'');if ($captions) $media.='<track kind="captions" label="'.esc_attr__('Captions','picsart-ai-image-editor').'" src="'.esc_url($captions).'" default>';
            $media.='</video>';
        } else continue;
        $link=picsart_collection_https($item['link']??'');$caption=!empty($a['showTitles'])?'<figcaption>'.esc_html($title).'</figcaption>':'';
        $transcript=mb_substr(sanitize_textarea_field($item['transcript']??''),0,6000);if ($transcript) $caption.='<details><summary>'.esc_html__('Transcript','picsart-ai-image-editor').'</summary><p>'.nl2br(esc_html($transcript)).'</p></details>';
        $items[]='<figure class="picsart-collection-item">'.$media.$caption.($link?'<a href="'.esc_url($link).'">'.esc_html($title?:__('View product','picsart-ai-image-editor')).'</a>':'').'</figure>';
    }
    if (!$items) return '';
    wp_enqueue_style('picsart-collections',plugins_url('../assets/collections.css',__FILE__),[],'1.1.2');wp_enqueue_script('picsart-collections',plugins_url('../assets/collections.js',__FILE__),[],'1.1.2',true);
    $heading=mb_substr(sanitize_text_field($a['heading']??''),0,120);$description=mb_substr(sanitize_textarea_field($a['description']??''),0,800);$cta=picsart_collection_https($a['ctaUrl']??'');$label=mb_substr(sanitize_text_field($a['ctaLabel']??''),0,60);
    $text=($heading?'<h2>'.esc_html($heading).'</h2>':'').($description?'<p>'.nl2br(esc_html($description)).'</p>':'').($cta&&$label?'<a href="'.esc_url($cta).'">'.esc_html($label).'</a>':'');
    return '<section class="picsart-collection picsart-layout-'.esc_attr($preset[2]).' picsart-size-'.esc_attr($size).((($a['textSide']??'left')==='right')?' picsart-text-right':'').'" style="--picsart-gap:'.esc_attr($gap).'px" aria-label="'.esc_attr($heading?:__('Picsart media collection','picsart-ai-image-editor')).'"><div class="picsart-collection-copy">'.$text.'</div><div class="picsart-collection-track" tabindex="0">'.implode('',$items).'</div>'.(count($items)>1?'<div class="picsart-collection-controls"><button type="button" data-step="-1">'.esc_html__('Previous','picsart-ai-image-editor').'</button><span aria-live="polite"></span><button type="button" data-step="1">'.esc_html__('Next','picsart-ai-image-editor').'</button></div>':'').'</section>';
}
add_action('init',function(){register_block_type('picsart/collection',['api_version'=>3,'attributes'=>['items'=>['type'=>'array','default'=>[]],'preset'=>['type'=>'string','default'=>'square-medium'],'ratio'=>['type'=>'string'],'size'=>['type'=>'string'],'heading'=>['type'=>'string'],'description'=>['type'=>'string'],'ctaLabel'=>['type'=>'string'],'ctaUrl'=>['type'=>'string'],'gap'=>['type'=>'number','default'=>16],'radius'=>['type'=>'number','default'=>0],'fit'=>['type'=>'string','default'=>'contain'],'focusX'=>['type'=>'number','default'=>50],'focusY'=>['type'=>'number','default'=>50],'textSide'=>['type'=>'string','default'=>'left'],'showTitles'=>['type'=>'boolean','default'=>false]],'render_callback'=>'picsart_collection_render']);});
add_action('enqueue_block_editor_assets',function(){wp_enqueue_script('picsart-collection-editor',plugins_url('../assets/collection-editor.js',__FILE__),['wp-element','wp-blocks','wp-block-editor','wp-components','wp-i18n','wp-server-side-render'],filemtime(__DIR__.'/../assets/collection-editor.js'),true);});

// Load collection layout rules in both the frontend and Gutenberg's iframe.
add_action('enqueue_block_assets',function(){
    wp_enqueue_style('picsart-collections',plugins_url('../assets/collections.css',__FILE__),[],filemtime(__DIR__.'/../assets/collections.css'));
});
