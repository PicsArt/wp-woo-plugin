<?php
/** Local drafts only: no provider or recipient is contacted. */
if (!defined('ABSPATH')) exit;
add_action('init',function(){register_post_type('picsart_marketing',['public'=>false,'show_ui'=>false,'show_in_rest'=>false,'supports'=>['title'],'rewrite'=>false]);});
add_action('rest_api_init',function(){register_rest_route('picsart/v1','/marketing-drafts',['methods'=>['GET','POST'],'permission_callback'=>function($r){$permission=picsart_commerce_permission($r);return $permission===true&&current_user_can('edit_posts')?true:picsart_video_error(__('Draft permission required.','picsart-ai-image-editor'),403);},'callback'=>'picsart_marketing_drafts']);});
function picsart_marketing_drafts($r) {
    if ($r->get_method()==='GET') {return array_map(fn($p)=>['id'=>$p->ID,'title'=>$p->post_title,'draft'=>get_post_meta($p->ID,'_picsart_marketing',true)],get_posts(['post_type'=>'picsart_marketing','post_status'=>'private','author'=>get_current_user_id(),'numberposts'=>50]));}
    $type=sanitize_key($r['kind']);$id=absint($r['attachmentId']);$title=mb_substr(sanitize_text_field($r['heading']),0,120);$link=picsart_collection_https($r['destination']);$request=(string)$r['requestId'];
    if (!in_array($type,['email','reminder'],true)||!$title||!$link||!wp_is_uuid($request)||get_post_type($id)!=='attachment'||!current_user_can('edit_post',$id)) return picsart_video_error(__('Choose media, a heading and an HTTPS destination.','picsart-ai-image-editor'));
    $poster=picsart_collection_https($r['poster']??'');$at=sanitize_text_field($r['at']??'');
    if ($type==='email'&&!wp_attachment_is_image($id)&&!$poster) return picsart_video_error(__('A public HTTPS poster image is required for a video email banner.','picsart-ai-image-editor'));
    if ($type==='reminder'&&(!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/',$at)||!strtotime($at)||strtotime($at)<=time())) return picsart_video_error(__('Choose a future reminder time.','picsart-ai-image-editor'));
    $data=['kind'=>$type,'attachmentId'=>$id,'heading'=>$title,'destination'=>$link,'poster'=>$poster,'at'=>$at,'image'=>wp_get_attachment_url($id),'video'=>!wp_attachment_is_image($id),'uid'=>$request];$hash=hash('sha256',wp_json_encode($data));$key='_picsart_commerce_marketing_'.hash('sha256',get_current_user_id().'|'.$request);$previous=get_option($key);
    if ($previous) {if (($previous['hash']??'')!==$hash) return picsart_video_error(__('Request already used for another draft.','picsart-ai-image-editor'),409);if (!empty($previous['id'])) return ['id'=>$previous['id'],'draft'=>$data];return picsart_video_error(__('Draft creation is pending. Inspect saved drafts before retrying.','picsart-ai-image-editor'),409);}
    if (!picsart_receipt_add($key,['hash'=>$hash],'',false)) return picsart_video_error(__('Draft creation already started.','picsart-ai-image-editor'),409);
    $post=wp_insert_post(['post_type'=>'picsart_marketing','post_status'=>'private','post_author'=>get_current_user_id(),'post_title'=>$title,'meta_input'=>['_picsart_marketing'=>$data]],true);
    if (is_wp_error($post)||!$post) return picsart_video_error(__('Could not confirm the draft. Inspect saved drafts before retrying.','picsart-ai-image-editor'),500);
    update_option($key,['hash'=>$hash,'id'=>$post],false);return ['id'=>$post,'draft'=>$data];
}
