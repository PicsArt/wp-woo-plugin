<?php
if (!defined('WP_UNINSTALL_PLUGIN')) exit;
foreach (['administrator','shop_manager'] as $picsart_role_name) {$role=get_role($picsart_role_name);if ($role) $role->remove_cap('picsart_generate');}
// Published attachments and product videos belong to the merchant and are preserved.
$picsart_keys=get_option('_picsart_receipt_inventory',[]);
foreach (array_keys(is_array($picsart_keys)?$picsart_keys:[]) as $picsart_key) if (str_starts_with($picsart_key,'_ppv_') || str_starts_with($picsart_key,'_picsart_commerce_') || str_starts_with($picsart_key,'_picsart_mail_')) delete_option($picsart_key);
delete_option('_picsart_receipt_inventory'); delete_option('_picsart_receipt_inventory_lock');
wp_unschedule_hook('picsart_expire_nonce');

delete_metadata('user',0,'_picsart_preferences','',true);

delete_metadata('user',0,'_picsart_email_preferences','',true);

do {
    $picsart_inventory=get_posts(['post_type'=>'picsart_receipt','post_status'=>'any','numberposts'=>100]);
    foreach ($picsart_inventory as $picsart_item) {
        $picsart_key=$picsart_item->post_title;
        if (str_starts_with($picsart_key,'_ppv_') || str_starts_with($picsart_key,'_picsart_commerce_') || str_starts_with($picsart_key,'_picsart_mail_')) delete_option($picsart_key);
        wp_delete_post($picsart_item->ID,true);
    }
} while (count($picsart_inventory)===100);

delete_option('_picsart_brand_defaults');

foreach (['_picsart_model_catalog_v3','_picsart_model_catalog_v3_attempt','_picsart_model_catalog_v3_lock','_picsart_model_catalog_v2','_picsart_model_catalog_v2_attempt','_picsart_model_catalog_v2_lock'] as $picsart_catalog_key) delete_option($picsart_catalog_key);
