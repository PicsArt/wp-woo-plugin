<?php
if (!defined('ABSPATH')) exit;
function picsart_notification_preferences($b) {
    $subject=hash('sha256',(string)($b['subject']??'')); $user=get_current_user_id();
    $prefs=get_user_meta($user,'_picsart_email_preferences',true); if (!is_array($prefs)) $prefs=[];
    if (array_key_exists('enabled',$b)) { $prefs[$subject]=rest_sanitize_boolean($b['enabled']) ? time()*1000 : 0; update_user_meta($user,'_picsart_email_preferences',$prefs); }
    $profile=get_userdata($user);$email=$profile?$profile->user_email:'';$parts=explode('@',$email);
    return ['enabledAt'=>$prefs[$subject]??0,'destination'=>strlen($parts[0]??'')?substr($parts[0],0,1).'***@'.($parts[1]??''):'No profile email'];
}
function picsart_send_notification($b) {
    $id=(string)($b['eventId']??'');$job=(string)($b['jobId']??'');
    $labels=['started'=>__('Generation started','picsart-ai-image-editor'),'ready'=>__('Your media is ready for review','picsart-ai-image-editor'),'exports'=>__('Your WordPress media was updated','picsart-ai-image-editor'),'attention'=>__('A Picsart request needs your attention','picsart-ai-image-editor'),'delayed'=>__('Generation is taking longer than expected','picsart-ai-image-editor')];
    if (!preg_match('/^[a-f0-9]{64}$/',$id) || !wp_is_uuid($job) || !isset($labels[$b['category']??''])) return picsart_video_error(__('Invalid notification.','picsart-ai-image-editor'));
    if (empty(picsart_notification_preferences(['subject'=>$b['subject']??''])['enabledAt'])) return ['status'=>'skipped'];
    $key='_picsart_mail_'.hash('sha256',get_current_user_id().'|'.$id);$old=get_option($key);
    if ($old && ($old['status']??'')!=='failed') return ['status'=>$old['status']==='accepted'?'accepted':'unknown'];
    $attempt=(int)($old['attempt']??0)+1; if ($attempt>5) return ['status'=>'unknown'];
    if (!picsart_receipt_add($key.'_attempt_'.$attempt,['status'=>'claimed'],'',false)) return ['status'=>'unknown'];
    if (!$old) picsart_receipt_add($key,['status'=>'sending','attempt'=>$attempt],'',false);
    update_option($key,['status'=>'sending','attempt'=>$attempt],false);
    $user=get_userdata(get_current_user_id());if (!$user || !is_email($user->user_email)) {update_option($key,['status'=>'failed','attempt'=>$attempt],false);return ['status'=>'failed','attempt'=>$attempt];}
    $title=$labels[$b['category']];$link=admin_url('admin.php?page=picsart-history').'#job-'.rawurlencode($job);
    $body=$title."\n\n".__('Open Picsart Commerce to review the result or request. Nothing is published automatically.','picsart-ai-image-editor')."\n".$link."\n\n".__('You requested these emails. Change email and category preferences in Picsart Commerce.','picsart-ai-image-editor');
    $accepted=wp_mail($user->user_email,'Picsart Commerce: '.$title,$body,['Content-Type: text/plain; charset=UTF-8']);
    update_option($key,['status'=>$accepted?'accepted':'failed','at'=>time(),'attempt'=>$attempt],false);
    return ['status'=>$accepted?'accepted':'failed'];
}
