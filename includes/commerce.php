<?php
/** Native, non-destructive media tools for Picsart Commerce. */
if (!defined('ABSPATH')) exit;
function picsart_commerce_permission($r) {
    return current_user_can('upload_files') && wp_verify_nonce($r->get_header('X-WP-Nonce'), 'wp_rest') ? true : picsart_video_error(__('Media permission and a valid session are required.', 'picsart-ai-image-editor'),403);
}
function picsart_commerce_image($id) { return get_post_type($id)==='attachment' && wp_attachment_is_image($id) && current_user_can('edit_post',$id); }
function picsart_commerce_target($type,$id) {
    if ($type==='term') return current_user_can('edit_term',$id) && get_term($id) && !is_wp_error(get_term($id));
    if (!in_array($type,['featured','variation','gallery'],true) || !current_user_can('edit_post',$id)) return false;
    if ($type==='gallery') return get_post_type($id)==='product';
    if ($type==='variation') return get_post_type($id)==='product_variation';
    return (bool)get_post($id) && post_type_supports(get_post_type($id),'thumbnail');
}
function picsart_commerce_value($type,$id) { return $type==='term' ? absint(get_term_meta($id,'thumbnail_id',true)) : ($type==='gallery' ? (string)get_post_meta($id,'_product_image_gallery',true) : absint(get_post_meta($id,'_thumbnail_id',true))); }
function picsart_commerce_write($type,$id,$value,$expected) {
    global $wpdb;
    $kind=$type==='term'?'term':'post';$key=$type==='term'?'thumbnail_id':($type==='gallery'?'_product_image_gallery':'_thumbnail_id');
    $table=$kind==='term'?$wpdb->termmeta:$wpdb->postmeta;$column=$kind.'_id';
    $raw=get_metadata($kind,$id,$key,true);$normalized=$type==='gallery'?(string)$raw:absint($raw);
    if ($normalized!==$expected) return false;
    if (metadata_exists($kind,$id,$key)) {
        // Atomic comparison is required; update_metadata ignores an empty previous value.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.SlowDBQuery -- Indexed object ID bounds this compare-and-swap to one object; metadata cache invalidated immediately below.
        $changed=$wpdb->update($table,['meta_value'=>maybe_serialize($value)],[$column=>$id,'meta_key'=>$key,'meta_value'=>maybe_serialize($raw)]);
    } else {
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Atomic insert-if-absent; WordPress add_metadata uses a separate non-atomic existence check.
        $changed=$wpdb->query($wpdb->prepare('INSERT INTO %i (%i, meta_key, meta_value) SELECT %d, %s, %s WHERE NOT EXISTS (SELECT 1 FROM %i WHERE %i = %d AND meta_key = %s)',$table,$column,$id,$key,maybe_serialize($value),$table,$column,$id,$key));
    }
    wp_cache_delete($id,$kind.'_meta');return $changed===1;
}
add_action('rest_api_init',function(){
    foreach (['media-bytes'=>['GET','picsart_commerce_bytes'],'image-restores'=>['GET','picsart_commerce_restores'],'media-source'=>['GET','picsart_commerce_source'],'image-save'=>['POST','picsart_commerce_save'],'image-apply'=>['POST','picsart_commerce_apply'],'image-restore'=>['POST','picsart_commerce_restore'],'preferences'=>[['GET','POST'],'picsart_commerce_preferences'],'blog-draft'=>['POST','picsart_commerce_draft']] as $route=>$spec) register_rest_route('picsart/v1','/'.$route,['methods'=>$spec[0],'permission_callback'=>'picsart_commerce_permission','callback'=>$spec[1]]);
});
function picsart_commerce_source($r) {
    $id=absint($r['attachmentId']); if (!picsart_commerce_image($id)) return picsart_video_error(__('Image unavailable.','picsart-ai-image-editor'),403);
    $size=wp_get_attachment_image_src($id,'full');
    return ['attachmentId'=>$id,'url'=>wp_get_attachment_url($id),'width'=>$size[1]??0,'height'=>$size[2]??0,'title'=>get_the_title($id),'caption'=>get_post_field('post_excerpt',$id),'alt'=>get_post_meta($id,'_wp_attachment_image_alt',true)];
}
function picsart_commerce_save($r) {
    $source=absint($r['sourceId']); if (!picsart_commerce_image($source)) return picsart_video_error(__('You cannot edit this source.','picsart-ai-image-editor'),403);
    $request=(string)$r['requestId']; if (!preg_match('/^[A-Za-z0-9_-]{16,100}$/',$request)) return picsart_video_error(__('A stable request ID is required.','picsart-ai-image-editor'));
    $files=$r->get_file_params(); $file=$files['image']??null;
    if (!$file || $file['error']!==UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name']) || $file['size']>20*1024*1024) return picsart_video_error(__('Choose an image up to 20 MB.','picsart-ai-image-editor'));
    $mime=wp_get_image_mime($file['tmp_name']); $ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
    $dimensions=getimagesize($file['tmp_name']);
    if (!isset($ext[$mime]) || !$dimensions || $dimensions[0]*$dimensions[1]>40000000) return picsart_video_error(__('Choose a JPEG, PNG or WebP up to 40 megapixels.','picsart-ai-image-editor'));
    $operation=sanitize_key($r['operation']??'edit');
    if (!in_array($operation,['edit','watermark','brand-mark'],true)) return picsart_video_error(__('Unsupported local image operation.','picsart-ai-image-editor'));
    $recipe=(string)($r['recipe']??''); if (strlen($recipe)>8192) return picsart_video_error(__('Edit description is too large.','picsart-ai-image-editor'));
    $recipe_data=$recipe ? json_decode($recipe,true) : []; if (!is_array($recipe_data)) return picsart_video_error(__('Invalid edit description.','picsart-ai-image-editor'));
    $fingerprint=hash('sha256',$source.'|'.$operation.'|'.$recipe.'|'.hash_file('sha256',$file['tmp_name']));
    $key='_picsart_commerce_save_'.hash('sha256',get_current_user_id().'|'.$request); $old=get_option($key);
    if ($old) { if (($old['fingerprint']??'')!==$fingerprint) return picsart_video_error(__('Request ID already used for another edit.','picsart-ai-image-editor'),409); if (!empty($old['result']) && picsart_commerce_image($old['result']['attachmentId'])) return $old['result']; return picsart_video_error(__('Save is pending. Check Media Library before retrying.','picsart-ai-image-editor'),409); }
    if (!picsart_receipt_add($key,['fingerprint'=>$fingerprint],'',false)) return picsart_video_error(__('Save already started.','picsart-ai-image-editor'),409);
    require_once ABSPATH.'wp-admin/includes/file.php'; require_once ABSPATH.'wp-admin/includes/media.php'; require_once ABSPATH.'wp-admin/includes/image.php';
    $file['name']=sanitize_file_name(get_the_title($source).'-picsart.'.$ext[$mime]);
    $id=media_handle_sideload($file,0);
    if (is_wp_error($id)) { delete_option($key); return $id; }
    update_post_meta($id,'_picsart_source_id',$source); update_post_meta($id,'_picsart_operation',$operation);
    update_post_meta($id,'_picsart_recipe',wp_slash(wp_json_encode($recipe_data)));
    update_post_meta($id,'_picsart_marked',in_array($operation,['watermark','brand-mark'],true) || (bool)get_post_meta($source,'_picsart_marked',true) || in_array(get_post_meta($source,'_picsart_operation',true),['watermark','brand-mark'],true));
    update_post_meta($id,'_wp_attachment_image_alt',get_post_meta($source,'_wp_attachment_image_alt',true));
    $original=get_post($source); wp_update_post(['ID'=>$id,'post_excerpt'=>$original->post_excerpt,'post_content'=>$original->post_content]);
    $result=['attachmentId'=>$id,'url'=>wp_get_attachment_url($id),'sourceId'=>$source]; update_option($key,['fingerprint'=>$fingerprint,'result'=>$result],false); return $result;
}
function picsart_commerce_apply($r) {
    $type=sanitize_key($r['targetType']); $target=absint($r['targetId']); $image=absint($r['attachmentId']);
    if (!picsart_commerce_target($type,$target) || !picsart_commerce_image($image)) return picsart_video_error(__('You cannot change this destination.','picsart-ai-image-editor'),403);
    if (((bool)get_post_meta($image,'_picsart_marked',true) || in_array(get_post_meta($image,'_picsart_operation',true),['watermark','brand-mark'],true)) && in_array(get_post_type($target),['product','product_variation'],true)) return picsart_video_error(__('Marked copies cannot replace product listing images. Use the clean original.','picsart-ai-image-editor'),409);
    $lock='_picsart_commerce_target_'.hash('sha256',$type.'|'.$target); if (!picsart_receipt_add($lock,time(),'',false)) return picsart_video_error(__('Another change is pending.','picsart-ai-image-editor'),409);
    try {
        $before=picsart_commerce_value($type,$target); $expected=absint($r['expectedPreviousId']); $after=$image;
        $intent='_picsart_commerce_intent_'.hash('sha256',get_current_user_id().'|'.$type.'|'.$target.'|'.$image.'|'.$expected); $prior=get_option($intent);
        if (is_array($prior) && $before===$prior['current']) return $prior;
        if ($type==='gallery') { $ids=array_values(array_filter(array_map('absint',explode(',',$before)))); if ($expected && !in_array($expected,$ids,true)) return picsart_video_error(__('Gallery changed. Review it again.','picsart-ai-image-editor'),409); if ($expected) $ids=array_map(fn($id)=>$id===$expected?$image:$id,$ids); elseif (!in_array($image,$ids,true)) $ids[]=$image; $after=implode(',',array_unique($ids)); }
        elseif ($before!==$expected) return picsart_video_error(__('Image changed. Review it again.','picsart-ai-image-editor'),409);
        $receipt=wp_generate_uuid4(); $record=['user'=>get_current_user_id(),'type'=>$type,'target'=>$target,'before'=>$before,'after'=>$after];
        if (!picsart_receipt_add('_picsart_commerce_apply_'.$receipt,$record,'',false)) return picsart_video_error(__('Could not reserve restore receipt. Nothing changed.','picsart-ai-image-editor'),409); if (!picsart_commerce_write($type,$target,$after,$before)) return picsart_video_error(__('The destination changed during this edit. Nothing was overwritten. Review it again.','picsart-ai-image-editor'),409);
        if (picsart_commerce_value($type,$target)!==$after) return picsart_video_error(__('The destination did not update. Review it before trying again.','picsart-ai-image-editor'),500);
        if ($type==='term') add_term_meta($target,'_picsart_restore_receipt',$receipt); else add_post_meta($target,'_picsart_restore_receipt',$receipt);
        $result=['receiptId'=>$receipt,'attachmentId'=>$image,'previous'=>$before,'current'=>$after]; if (!get_option($intent)) picsart_receipt_add($intent,$result,'',false); else update_option($intent,$result,false); return $result;
    } finally { delete_option($lock); }
}
function picsart_commerce_restore($r) {
    $receipt=sanitize_text_field($r['receiptId']); if (!wp_is_uuid($receipt)) return picsart_video_error(__('Invalid restore receipt.','picsart-ai-image-editor')); $record=get_option('_picsart_commerce_apply_'.$receipt);
    if (!$record || $record['user']!==get_current_user_id() || !picsart_commerce_target($record['type'],$record['target'])) return picsart_video_error(__('Restore unavailable.','picsart-ai-image-editor'),403);
    $originals=$record['type']==='gallery'?array_filter(array_map('absint',explode(',',$record['before']))):array_filter([absint($record['before'])]);foreach ($originals as $original) if (!picsart_commerce_image($original)) return picsart_video_error(__('The previous image is unavailable. The current image was not changed.','picsart-ai-image-editor'),409);
    $lock='_picsart_commerce_target_'.hash('sha256',$record['type'].'|'.$record['target']); if (!picsart_receipt_add($lock,time(),'',false)) return picsart_video_error(__('Another change is pending.','picsart-ai-image-editor'),409);
    try { if (picsart_commerce_value($record['type'],$record['target'])!==$record['after']) return picsart_video_error(__('Destination changed since this edit. Nothing restored.','picsart-ai-image-editor'),409); if (!picsart_commerce_write($record['type'],$record['target'],$record['before'],$record['after'])) return picsart_video_error(__('The destination changed during restore. Review it again.','picsart-ai-image-editor'),409); if (picsart_commerce_value($record['type'],$record['target'])!==$record['before']) return picsart_video_error(__('The previous image could not be restored. Review the destination and try again.','picsart-ai-image-editor'),500); return ['restored'=>true]; } finally { delete_option($lock); }
}
function picsart_commerce_consent() {
    $prefs=get_user_meta(get_current_user_id(),'_picsart_preferences',true);
    return is_array($prefs) && !empty($prefs['consent']);
}
function picsart_commerce_preferences($r) {
    $key='_picsart_preferences'; $prefs=get_user_meta(get_current_user_id(),$key,true); if (!is_array($prefs)) $prefs=['consent'=>false,'notifications'=>true,'dismissed'=>false];
    if ($r->get_method()==='POST') { foreach (['consent','notifications','dismissed'] as $field) if ($r->has_param($field)) $prefs[$field]=rest_sanitize_boolean($r[$field]); update_user_meta(get_current_user_id(),$key,$prefs); }
    return $prefs;
}
function picsart_commerce_draft($r) {
    if (!current_user_can('edit_posts')) return picsart_video_error(__('Draft permission required.','picsart-ai-image-editor'),403);
    $id=absint($r['attachmentId']); if (get_post_type($id)!=='attachment' || !current_user_can('edit_post',$id) || !in_array(get_post_mime_type($id),['image/png','image/jpeg','image/webp','video/mp4','video/webm'],true)) return picsart_video_error(__('Media unavailable.','picsart-ai-image-editor'),403);
    $title=sanitize_text_field($r['title']); if (!$title) return picsart_video_error(__('Enter a draft title.','picsart-ai-image-editor'));
    $request=(string)$r['requestId']; if (!preg_match('/^[A-Za-z0-9_-]{16,100}$/',$request)) return picsart_video_error(__('A stable request ID is required.','picsart-ai-image-editor'));
    $key='_picsart_commerce_draft_'.hash('sha256',get_current_user_id().'|'.$request); $fingerprint=hash('sha256',$id.'|'.$title.'|'.wp_kses_post($r['content']??'')); $old=get_option($key);
    if ($old) { if (($old['fingerprint']??'')!==$fingerprint) return picsart_video_error(__('Request ID already used.','picsart-ai-image-editor'),409); if (!empty($old['result']) && current_user_can('edit_post',$old['result']['postId'])) return $old['result']; return picsart_video_error(__('Draft creation pending. Check your drafts.','picsart-ai-image-editor'),409); }
    if (!picsart_receipt_add($key,['fingerprint'=>$fingerprint],'',false)) return picsart_video_error(__('Draft already started.','picsart-ai-image-editor'),409);
    $media=wp_attachment_is_image($id)?wp_get_attachment_image($id,'large'):wp_video_shortcode(['src'=>wp_get_attachment_url($id),'preload'=>'metadata']);
    $post=wp_insert_post(['post_type'=>'post','post_status'=>'draft','post_title'=>$title,'post_content'=>wp_kses_post($r['content']??'').wp_kses_post($media),'post_author'=>get_current_user_id()],true);
    if (is_wp_error($post)) { delete_option($key); return $post; } set_post_thumbnail($post,$id); $result=['postId'=>$post,'editUrl'=>get_edit_post_link($post,'raw')]; update_option($key,['fingerprint'=>$fingerprint,'result'=>$result],false); return $result;
}
function picsart_commerce_link($id,$post=0,$term=0,$target='') { return add_query_arg(['_picsart_context'=>wp_create_nonce('picsart_navigation'),'page'=>'picsart-studio','view'=>'images','attachment_id'=>$id,'post_id'=>$post,'term_id'=>$term,'target'=>$target],admin_url('admin.php')); }
function picsart_commerce_button($id,$post=0,$term=0,$target='') { return '<a class="button" href="'.esc_url(picsart_commerce_link($id,$post,$term,$target)).'">'.esc_html__('Edit with Picsart','picsart-ai-image-editor').'</a>'; }
function picsart_media_ai_actions($id) {
    $args=['_picsart_context'=>wp_create_nonce('picsart_navigation'),'attachment_id'=>absint($id)];
    $image=add_query_arg(array_merge($args,['page'=>'picsart-image-generation']),admin_url('admin.php'));
    $video=add_query_arg(array_merge($args,['page'=>'picsart-studio']),admin_url('admin.php'));
    return '<a class="button" href="'.esc_url($image).'">'.esc_html__('Edit with AI','picsart-ai-image-editor').'</a> <a class="button" href="'.esc_url($video).'">'.esc_html__('Generate video','picsart-ai-image-editor').'</a>';
}
add_filter('media_row_actions',function($actions,$post){ if (picsart_commerce_image($post->ID)) $actions['picsart']=picsart_media_ai_actions($post->ID); return $actions; },10,2);
add_filter('attachment_fields_to_edit',function($fields,$post){ if (picsart_commerce_image($post->ID)) $fields['picsart']=['label'=>'Picsart','input'=>'html','html'=>picsart_media_ai_actions($post->ID)]; return $fields; },10,2);
add_filter('admin_post_thumbnail_html',function($html,$id){ $image=get_post_thumbnail_id($id); return $image && current_user_can('edit_post',$id) ? $html.picsart_commerce_button($image,$id,0,get_post_type($id)==='product_variation'?'variation':'featured') : $html; },10,2);
add_action('init',function(){ foreach (get_taxonomies(['public'=>true]) as $tax) add_action($tax.'_edit_form_fields',function($term){ $image=absint(get_term_meta($term->term_id,'thumbnail_id',true)); if ($image && current_user_can('edit_term',$term->term_id)) echo '<tr><th>'.esc_html__('Picsart','picsart-ai-image-editor').'</th><td>'.wp_kses_post(picsart_commerce_button($image,0,$term->term_id,'term')).'</td></tr>'; }); });
add_action('add_meta_boxes_product',function(){
    add_meta_box('picsart-gallery-tools',__('Picsart image tools','picsart-ai-image-editor'),function($post){
        $context=['_picsart_context'=>wp_create_nonce('picsart_navigation'),'page'=>'picsart-image-generation','product_id'=>$post->ID,'post_id'=>$post->ID];
        $generate=add_query_arg($context,admin_url('admin.php'));
        $edit=add_query_arg($context+['attachment_id'=>get_post_thumbnail_id($post->ID)],admin_url('admin.php'));
        echo '<p>'.esc_html__('Generate a new product image or edit an existing image with AI.','picsart-ai-image-editor').'</p><p><a class="button" href="'.esc_url($generate).'">'.esc_html__('Generate image','picsart-ai-image-editor').'</a> <a class="button" href="'.esc_url($edit).'">'.esc_html__('Edit with AI','picsart-ai-image-editor').'</a></p>';
        $ids=array_filter(array_map('absint',explode(',',get_post_meta($post->ID,'_product_image_gallery',true))));
        foreach($ids as $id){
            if(!picsart_commerce_image($id))continue;
            $url=add_query_arg($context+['attachment_id'=>$id],admin_url('admin.php'));
            echo '<p>'.esc_html(get_the_title($id)).' <a class="button" href="'.esc_url($url).'">'.esc_html__('Edit with AI','picsart-ai-image-editor').'</a></p>';
        }
    },'product','side','high');
});
add_action('woocommerce_product_after_variable_attributes',function($index,$data,$variation){ $id=get_post_thumbnail_id($variation->ID); if ($id && current_user_can('edit_post',$variation->ID)) echo wp_kses_post(picsart_commerce_button($id,$variation->ID,0,'variation')); },10,3);
add_shortcode('picsart_media',function($attributes){ $a=shortcode_atts(['id'=>0],$attributes); $id=absint($a['id']); if (get_post_type($id)!=='attachment' || !in_array(get_post_status($id),['inherit','publish'],true)) return ''; $parent=wp_get_post_parent_id($id); if ($parent && get_post_status($parent)!=='publish') return ''; if (wp_attachment_is_image($id)) return wp_get_attachment_image($id,'large'); if (in_array(get_post_mime_type($id),['video/mp4','video/webm'],true)) { $url=wp_get_attachment_url($id); return $url ? wp_video_shortcode(['src'=>esc_url($url),'preload'=>'metadata']) : ''; } return '';  });
add_action('init',function(){ register_block_type('picsart/media',['api_version'=>3,'attributes'=>['id'=>['type'=>'number','default'=>0],'url'=>['type'=>'string'],'mediaType'=>['type'=>'string'],'alt'=>['type'=>'string']],'render_callback'=>fn($a)=>do_shortcode('[picsart_media id="'.absint($a['id']??0).'"]')]); });
add_action('enqueue_block_editor_assets',function(){
    wp_enqueue_script('picsart-native',plugins_url('../assets/native.js',__FILE__),['wp-hooks','wp-element','wp-components','wp-block-editor','wp-blocks','wp-i18n','wp-server-side-render','wp-data','wp-api-fetch','wp-rich-text'],filemtime(__DIR__.'/../assets/native.js'),true);
    wp_localize_script('picsart-native','picsartNative',['tools'=>picsart_commerce_link(0)]);
});
add_action('admin_enqueue_scripts',function($hook){ if ($hook==='toplevel_page_picsart-studio') wp_enqueue_media(); });
function picsart_onboarding_notice() {
    if (!current_user_can('upload_files')) return;
    $prefs=get_user_meta(get_current_user_id(),'_picsart_preferences',true);
    if (!empty($prefs['dismissed'])) return;
    // Consent is not a connection. Check consented accounts asynchronously so admin pages never wait for the service.
    $check=!empty($prefs['consent']) && picsart_video_configured();
    echo '<div id="picsart-onboarding-notice" class="notice notice-info"'.($check?' hidden':'').'><p><strong>'.esc_html__('Picsart is installed.','picsart-ai-image-editor').'</strong> '.esc_html__('Connect your account to create and edit images and videos with Picsart Commerce.','picsart-ai-image-editor').' <a class="button button-primary" href="'.esc_url(admin_url('admin.php?page=picsart-studio')).'">'.esc_html__('Connect Picsart','picsart-ai-image-editor').'</a></p><form method="post" action="'.esc_url(admin_url('admin-post.php')).'"><input type="hidden" name="action" value="picsart_notice"><input type="hidden" name="preference" value="dismissed">';
    wp_nonce_field('picsart_notice');
    echo '<p>'.esc_html__('You choose what to create and approve any credit cost before generation.','picsart-ai-image-editor').' <button class="button-link">'.esc_html__('Dismiss onboarding','picsart-ai-image-editor').'</button></p></form></div>';
}
add_action('admin_notices','picsart_onboarding_notice');
add_action('admin_post_picsart_notice',function(){ if (!current_user_can('upload_files')) wp_die(esc_html__('Permission required.','picsart-ai-image-editor')); check_admin_referer('picsart_notice'); $prefs=get_user_meta(get_current_user_id(),'_picsart_preferences',true); if (!is_array($prefs)) $prefs=[]; $prefs['dismissed']=true; update_user_meta(get_current_user_id(),'_picsart_preferences',$prefs); wp_safe_redirect(wp_get_referer() ?: admin_url()); exit; });

// Reads only an attachment the current user can edit; no arbitrary URL parameter.
function picsart_commerce_bytes($r) {
    $id=absint($r['attachmentId']); if (!picsart_commerce_image($id)) return picsart_video_error(__('Image unavailable.','picsart-ai-image-editor'),403);
    $file=get_attached_file($id);$temporary=false;
    if (!$file || !is_file($file)) {
        require_once ABSPATH.'wp-admin/includes/file.php';$file=wp_tempnam('picsart-source');$temporary=true;
        $url=wp_get_attachment_url($id);
        if (!$url || wp_parse_url($url,PHP_URL_SCHEME)!=='https') {wp_delete_file($file);return picsart_video_error(__('Offloaded image requires HTTPS.','picsart-ai-image-editor'));}
        $response=wp_safe_remote_get($url,['timeout'=>20,'stream'=>true,'filename'=>$file,'limit_response_size'=>20*1024*1024+1,'redirection'=>2]);
        if (is_wp_error($response) || wp_remote_retrieve_response_code($response)!==200) {wp_delete_file($file);return picsart_video_error(__('Could not retrieve the selected attachment.','picsart-ai-image-editor'),502);}
    }
    try {
        $mime=wp_get_image_mime($file);$size=getimagesize($file);
        if (filesize($file)>20*1024*1024 || !in_array($mime,['image/jpeg','image/png','image/webp'],true) || !$size || $size[0]*$size[1]>24000000) return picsart_video_error(__('Choose a supported image up to 20 MB and 24 megapixels.','picsart-ai-image-editor'));
        return ['base64'=>base64_encode(file_get_contents($file)),'mime'=>$mime];
    } finally {if ($temporary) wp_delete_file($file);}
}
function picsart_commerce_restores($r) {
    $type=sanitize_key($r['targetType']);$id=absint($r['targetId']);if (!picsart_commerce_target($type,$id)) return picsart_video_error(__('Destination unavailable.','picsart-ai-image-editor'),403);
    $receipts=$type==='term'?get_term_meta($id,'_picsart_restore_receipt'):get_post_meta($id,'_picsart_restore_receipt');$items=[];
    foreach (array_slice(array_reverse($receipts),0,50) as $receipt) {$record=get_option('_picsart_commerce_apply_'.$receipt);if ($record && $record['user']===get_current_user_id() && $record['type']===$type && $record['target']===$id && $record['after']===picsart_commerce_value($type,$id)) $items[]=['receiptId'=>$receipt,'previous'=>$record['before'],'current'=>$record['after']];}
    return $items;
}

add_action('rest_api_init',function(){register_rest_route('picsart/v1','/brand-defaults',['methods'=>['GET','POST'],'permission_callback'=>'picsart_commerce_permission','callback'=>function($r){
    $settings=get_option('_picsart_brand_defaults',[]);if (!is_array($settings)) $settings=[];
    if ($r->get_method()==='POST') {
        if (!current_user_can('manage_options')) return picsart_video_error(__('Administrator permission required to change site defaults.','picsart-ai-image-editor'),403);
        if (!empty($r['migrateLegacy'])) {$old=get_option('picsart_options',[]);$input=['logoId'=>absint($old['watermark_image']??0),'radius'=>absint($old['watermark_radius']??4),'mark'=>'brand'];} else $input=$r->get_params();
        $logo=absint($input['logoId']??0);if ($logo&&!picsart_commerce_image($logo)) return picsart_video_error(__('Choose an accessible logo from Media Library.','picsart-ai-image-editor'),403);
        $settings=['logoId'=>$logo,'radius'=>max(0,min(100,(int)($input['radius']??0))),'mark'=>in_array($input['mark']??'',['none','brand','protective'],true)?$input['mark']:'brand','text'=>mb_substr(sanitize_text_field($input['text']??''),0,120),'opacity'=>max(.01,min(1,(float)($input['opacity']??.7))),'size'=>max(.01,min(.5,(float)($input['size']??.06))),'corner'=>in_array($input['corner']??'',['bottom-right','bottom-left','top-right','top-left'],true)?$input['corner']:'bottom-right','color'=>sanitize_hex_color($input['color']??'#ffffff')?:'#ffffff'];update_option('_picsart_brand_defaults',$settings,false);
    }
    return ['settings'=>$settings,'canManage'=>current_user_can('manage_options')];
}]);});

// Provenance filter preserves WordPress permissions and other attachment constraints.
add_action('wp_enqueue_media',function(){
    wp_enqueue_script('picsart-media-filter',plugins_url('../assets/media-filter.js',__FILE__),['media-views','wp-i18n'],filemtime(__DIR__.'/../assets/media-filter.js'),true);
});
add_filter('ajax_query_attachments_args',function($args){
    if (sanitize_key(wp_unslash($_REQUEST['query']['picsart_media']??''))!=='1') return $args;
    $origin=['relation'=>'OR',['key'=>'_picsart_created','compare'=>'EXISTS'],['key'=>'_picsart_operation','compare'=>'EXISTS']];
    $args['meta_query']=empty($args['meta_query'])?$origin:['relation'=>'AND',$args['meta_query'],$origin];
    return $args;
});
// Backfill only verified plugin import receipts, never filenames or user-entered titles.
add_action('admin_init',function(){
    if (!current_user_can('manage_options') || get_option('picsart_media_origin_done')) return;
    $page=max(1,(int)get_option('picsart_media_origin_page',1));
    $receipts=get_posts(['post_type'=>'picsart_receipt','post_status'=>'private','posts_per_page'=>100,'paged'=>$page,'orderby'=>'ID','order'=>'ASC']);
    foreach($receipts as $receipt){
        if(strpos($receipt->post_title,'_ppv_import_')!==0)continue;
        $value=get_option($receipt->post_title);
        if(is_array($value)&&!empty($value['id'])&&get_post_type((int)$value['id'])==='attachment')update_post_meta((int)$value['id'],'_picsart_created',1);
    }
    if(count($receipts)<100)update_option('picsart_media_origin_done',1,false);
    else update_option('picsart_media_origin_page',$page+1,false);
});

require_once __DIR__.'/media-sources.php';

// Promote the tools once per editor; later user moves/collapses remain respected.
add_action('current_screen',function($screen){
    if($screen->base!=='post'||$screen->post_type!=='product'||!current_user_can('edit_products'))return;
    $user=get_current_user_id();if(get_user_meta($user,'_picsart_tools_placement_v1',true))return;
    $order=get_user_option('meta-box-order_product');
    if(is_array($order)){
        foreach($order as $context=>$ids)$order[$context]=implode(',',array_diff(explode(',',$ids),['picsart-studio-entry','picsart-gallery-tools']));
        $side=array_values(array_filter(explode(',',$order['side']??'')));
        $position=array_search('submitdiv',$side,true);array_splice($side,$position===false?0:$position+1,0,['picsart-studio-entry','picsart-gallery-tools']);
        $order['side']=implode(',',$side);update_user_option($user,'meta-box-order_product',$order,true);
    }
    foreach(['closedpostboxes_product','metaboxhidden_product'] as $key){
        $value=get_user_option($key);if(is_array($value))update_user_option($user,$key,array_values(array_diff($value,['picsart-studio-entry','picsart-gallery-tools'])),true);
    }
    update_user_meta($user,'_picsart_tools_placement_v1',1);
});
