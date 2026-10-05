<?php
/** Explicit operator recovery; never silently repeat an uncertain write. */
if (!defined('ABSPATH')) exit;
if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('picsart unlock-destination',function($args,$assoc){
        $type=$args[0]??'';$target=absint($args[1]??0);
        if (!in_array($type,['featured','gallery','variation','term'],true)||!$target) WP_CLI::error('Usage: wp picsart unlock-destination <featured|gallery|variation|term> <id> --yes');
        $key='_picsart_commerce_target_'.hash('sha256',$type.'|'.$target);$lock=get_option($key);
        if (!$lock) {WP_CLI::success('No pending destination lock.');return;}
        WP_CLI::log('Recorded lock time: '.gmdate('c',(int)$lock));WP_CLI::log('Current destination: '.wp_json_encode(picsart_commerce_value($type,$target)));
        if (time()-(int)$lock<300) WP_CLI::error('The operation may still be active. Wait at least five minutes and inspect the destination.');
        WP_CLI::confirm('Have you stopped active Picsart apply/restore requests and inspected this destination? This clears the lock only; it does not replay or restore media.',$assoc);
        delete_option($key);WP_CLI::success('Lock cleared. Review the destination again before applying or restoring.');
    });
}
