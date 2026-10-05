<?php
if (!defined('ABSPATH')) exit;
// Nonpublic inventory uses WordPress APIs; add_option remains the atomic claim.
add_action('init',function(){register_post_type('picsart_receipt',['public'=>false,'show_ui'=>false,'show_in_rest'=>false,'supports'=>[],'rewrite'=>false]);});
function picsart_receipt_add($key,$value,$deprecated='',$autoload=false) {
    if (get_option($key)!==false) return false;
    $id=wp_insert_post(['post_type'=>'picsart_receipt','post_status'=>'private','post_title'=>$key,'post_content'=>''],true);
    if (is_wp_error($id) || !$id) return false;
    if (add_option($key,$value,'',false)) return true;
    wp_delete_post($id,true); return false;
}
function picsart_expire_nonce($key) {
    if (!is_string($key) || !preg_match('/^_ppv_nonce_[a-f0-9]{64}$/',$key)) return;
    $expires=get_option($key); if (is_numeric($expires) && (int)$expires>time()) return;
    delete_option($key);
    foreach (get_posts(['post_type'=>'picsart_receipt','post_status'=>'private','title'=>$key,'numberposts'=>-1,'fields'=>'ids']) as $id) wp_delete_post($id,true);
}
add_action('picsart_expire_nonce','picsart_expire_nonce');
