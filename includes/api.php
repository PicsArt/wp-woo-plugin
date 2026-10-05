<?php
if (!defined('ABSPATH')) exit;
function picsart_video_error($message, $status = 400) { return new WP_Error('picsart_error', $message, ['status'=>$status]); }
function picsart_video_configured() { return defined('PICSART_SERVICE_URL') && defined('PICSART_BRIDGE_SECRET') && defined('PICSART_INSTALLATION_ID'); }
function picsart_video_permission() { return current_user_can('upload_files') ? true : picsart_video_error(__('Media permission required.','picsart-ai-image-editor'), 403); }
add_action('rest_api_init', function () {
    register_rest_route('picsart/v1', '/studio', ['methods'=>['GET','POST'], 'permission_callback'=>'picsart_video_permission', 'callback'=>'picsart_video_proxy']);
    register_rest_route('picsart/v1', '/internal', ['methods'=>'POST', 'permission_callback'=>'picsart_video_internal_permission', 'callback'=>'picsart_video_internal']);
});
function picsart_video_proxy(WP_REST_Request $request) {
    if (!picsart_video_configured()) return picsart_video_error(__('The Picsart connection is not configured. Contact your site administrator.','picsart-ai-image-editor'), 503);
    $consent=get_user_meta(get_current_user_id(), '_picsart_preferences', true);
    if (empty($consent['consent'])) return picsart_video_error(__('Review and accept Picsart service data sharing before connecting or using cloud tools.','picsart-ai-image-editor'),403);
    $params = $request->get_query_params(); unset($params['rest_route']);
    $route = $params['route'] ?? '/state';
    if (!is_string($route) || !preg_match('#^/[a-zA-Z0-9/_-]+$#', $route)) return picsart_video_error(__('Invalid studio route.','picsart-ai-image-editor'));
    if (str_starts_with($route, '/auth/') && !in_array($route, ['/auth/prepare','/auth/start','/auth/repair','/auth/disconnect'], true)) return picsart_video_error(__('Use the sign-in window.','picsart-ai-image-editor'), 403);
    if (in_array($route, ['/approvals','/tick','/image-tools'], true) && !current_user_can('picsart_generate')) return picsart_video_error(__('Your administrator must grant Picsart generation permission.','picsart-ai-image-editor'), 403);
    // Site-wide, demand-driven daily catalog refresh. No cron or account data in this cache.
    $catalog_request=$route==='/model-catalog' && $request->get_method()==='GET';
    $catalog_cache_key='_picsart_model_catalog_v3';
    if($catalog_request){
        $saved=get_option($catalog_cache_key,[]);
        $attempt=(int)get_option($catalog_cache_key.'_attempt',0);
        if($attempt && time()-$attempt<DAY_IN_SECONDS){
            return !empty($saved['catalog']) ? new WP_REST_Response($saved,200,['Cache-Control'=>'no-store']) : picsart_video_error(__('Model refresh was already attempted today. Using bundled options until the next daily refresh.','picsart-ai-image-editor'),503);
        }
        // Atomic lease makes concurrent users and page requests share one refresh.
        $lock=$catalog_cache_key.'_lock';
        if(!add_option($lock,time(),'','no')){
            if(time()-(int)get_option($lock)>120)delete_option($lock);
            return !empty($saved['catalog']) ? new WP_REST_Response($saved,200,['Cache-Control'=>'no-store']) : picsart_video_error(__('Model catalog is being refreshed.','picsart-ai-image-editor'),503);
        }
        $latest_attempt=(int)get_option($catalog_cache_key.'_attempt',0);
        if($latest_attempt && time()-$latest_attempt<DAY_IN_SECONDS){
            delete_option($lock);
            $latest=get_option($catalog_cache_key,[]);
            return !empty($latest['catalog']) ? new WP_REST_Response($latest,200,['Cache-Control'=>'no-store']) : picsart_video_error(__('Daily model refresh already started.','picsart-ai-image-editor'),503);
        }
        update_option($catalog_cache_key.'_attempt',time(),false);
    }
    $body = $request->get_body(); $content_type = $request->get_header('content-type') ?: 'application/json';
    if (in_array($route, ['/sources','/image-tools'], true) && $request->get_method() === 'POST') {
        $files = $request->get_file_params(); $photo = $files['photo'] ?? null;
        if (!$photo || $photo['error'] || !is_uploaded_file($photo['tmp_name']) || $photo['size'] > 15 * 1024 * 1024) return picsart_video_error(__('Choose a photo up to 15 MB.','picsart-ai-image-editor'));
        $mime=wp_get_image_mime($photo['tmp_name']); $extensions=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
        if (!isset($extensions[$mime])) return picsart_video_error(__('Choose a JPEG, PNG or WebP photo.','picsart-ai-image-editor'));
        $filename='product-photo.'.$extensions[$mime];
        $boundary = 'Picsart' . wp_generate_password(24, false);
        $body = '--'.$boundary."\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"{$filename}\"\r\nContent-Type: {$mime}\r\n\r\n" . file_get_contents($photo['tmp_name']) . "\r\n--".$boundary."--\r\n";
        if ($route === '/image-tools') {
            $body = substr($body, 0, -strlen('--'.$boundary."--\r\n"));
            foreach (['operation','factor','background','requestId'] as $field) $body .= '--'.$boundary."\r\nContent-Disposition: form-data; name=\"".$field."\"\r\n\r\n".sanitize_text_field($request->get_param($field))."\r\n";
            $body .= '--'.$boundary."--\r\n";
        }
        $content_type = 'multipart/form-data; boundary='.$boundary;
    }
    if (strlen($body) > 16*1024*1024) return picsart_video_error(__('Request too large.','picsart-ai-image-editor'), 413);
    $query = '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
    $time = (string) round(microtime(true)*1000); $nonce = wp_generate_uuid4(); $user = (string) get_current_user_id();
    $signature = hash_hmac('sha256', "$time\n$nonce\n$user\n".PICSART_INSTALLATION_ID."\n".$request->get_method()."\n$query\n$body", PICSART_BRIDGE_SECRET);
    $response = wp_remote_request(rtrim(PICSART_SERVICE_URL, '/') . '/api/studio' . $query, [
        'method'=>$request->get_method(), 'body'=>$body, 'timeout'=>100, 'redirection'=>0,
        'headers'=>['Content-Type'=>$content_type, 'Origin'=>get_option('home'), 'X-Picsart-Time'=>$time, 'X-Picsart-Nonce'=>$nonce, 'X-Picsart-User'=>$user, 'X-Picsart-Instance'=>PICSART_INSTALLATION_ID, 'X-Picsart-Signature'=>$signature]
    ]);
    if($catalog_request){
        $data=is_wp_error($response)?null:json_decode(wp_remote_retrieve_body($response),true);
        $valid=!is_wp_error($response)&&wp_remote_retrieve_response_code($response)===200&&is_array($data['catalog']['image']??null)&&is_array($data['catalog']['video']??null)&&is_array($data['catalog']['schemas']??null);
        if($valid)update_option($catalog_cache_key,$data,false);
        delete_option($catalog_cache_key.'_lock');
        if(!$valid&&!empty($saved['catalog']))return new WP_REST_Response($saved+['error'=>'Daily model refresh failed; saved options remain available.'],200,['Cache-Control'=>'no-store']);
    }
    if (is_wp_error($response)) return picsart_video_error(__('The Picsart connection is currently unavailable. Check the status of your last action before trying again.','picsart-ai-image-editor'), 502);
    $data = json_decode(wp_remote_retrieve_body($response), true);
    return new WP_REST_Response($data ?: ['message'=>'The Picsart connection returned an unexpected response.'], wp_remote_retrieve_response_code($response), ['Cache-Control'=>'no-store']);
}
function picsart_video_internal_permission(WP_REST_Request $request) {
    if (!picsart_video_configured()) return picsart_video_error(__('Service unavailable.','picsart-ai-image-editor'), 503);
    $time=$request->get_header('x-picsart-time'); $nonce=$request->get_header('x-picsart-nonce'); $sig=$request->get_header('x-picsart-signature');
    if (!ctype_digit($time) || abs(microtime(true)*1000-(float)$time)>60000 || strlen($nonce)<16) return picsart_video_error(__('Invalid service request.','picsart-ai-image-editor'), 401);
    $expected=hash_hmac('sha256', "$time\n$nonce\n".$request->get_body(), PICSART_BRIDGE_SECRET);
    if (!hash_equals($expected,$sig)) return picsart_video_error(__('Invalid service signature.','picsart-ai-image-editor'),401);
    $key='_ppv_nonce_'.hash('sha256',$nonce);
    if (!picsart_receipt_add($key,time()+120,'',false)) return picsart_video_error(__('Request already used.','picsart-ai-image-editor'),401);
    wp_schedule_single_event(time()+125,'picsart_expire_nonce',[$key]);
    $input=$request->get_json_params();
    if (($input['instanceId']??'')!==PICSART_INSTALLATION_ID) return picsart_video_error(__('Installation mismatch.','picsart-ai-image-editor'),403);
    wp_set_current_user(absint($input['userId']??0));
    $consent=get_user_meta(get_current_user_id(), '_picsart_preferences', true);
    if (empty($consent['consent'])) return picsart_video_error(__('Picsart service consent required.','picsart-ai-image-editor'),403);
    return picsart_video_permission();
}
function picsart_video_product($id) {
    if (!function_exists('wc_get_product')) return picsart_video_error(__('Install WooCommerce to browse products.','picsart-ai-image-editor'),409);
    if (!current_user_can('edit_post',$id)) return picsart_video_error(__('You cannot edit this product.','picsart-ai-image-editor'),403);
    $p=wc_get_product($id); if (!$p) return picsart_video_error(__('Product not found.','picsart-ai-image-editor'),404);
    $photos=[];
    foreach (array_unique(array_merge([$p->get_image_id()],$p->get_gallery_image_ids())) as $attachment) {
        $image=wp_get_attachment_image_src($attachment,'full'); if (!$image) continue;
        $photos[]=['id'=>"$id:$attachment",'url'=>$image[0],'width'=>$image[1],'height'=>$image[2],'name'=>get_the_title($attachment),'productId'=>(string)$id,'productName'=>$p->get_name(),'sku'=>$p->get_sku(),'instanceId'=>PICSART_INSTALLATION_ID];
    }
    return ['id'=>(string)$id,'name'=>$p->get_name(),'sku'=>$p->get_sku(),'photos'=>$photos];
}
function picsart_video_internal(WP_REST_Request $request) {
    $b=$request->get_json_params(); $action=$b['action']??'';
    if ($action==='apply-image') return picsart_commerce_apply($b);
    if ($action==='blog-draft') return picsart_commerce_draft($b);
    if ($action==='notification-preferences') return picsart_notification_preferences($b);
    if ($action==='notification') return picsart_send_notification($b);
    if ($action==='products') {
        if (!function_exists('wc_get_products')) return ['products'=>[]];
        $page=max(1,absint($b['cursor']??1)); $rows=wc_get_products(['limit'=>50,'page'=>$page,'status'=>['publish','draft','private'],'orderby'=>'ID','order'=>'ASC']);
        $products=[]; foreach ($rows as $p) { $item=picsart_video_product($p->get_id()); if (!is_wp_error($item)) $products[]=$item; }
        return ['products'=>$products,'nextCursor'=>count($rows)===50?(string)($page+1):null];
    }
    if ($action==='product') return picsart_video_product(absint($b['id']??0));
    if ($action==='source') {
        require_once ABSPATH.'wp-admin/includes/file.php';
        $product=picsart_video_product(absint($b['productId']??0)); if (is_wp_error($product)) return $product;
        $photo=null; foreach ($product['photos'] as $candidate) if ($candidate['id']===($b['sourceId']??'')) $photo=$candidate;
        if (!$photo) return picsart_video_error(__('Product photo changed. Select it again.','picsart-ai-image-editor'),409);
        $parts=explode(':',$photo['id']); $path=get_attached_file(absint($parts[1]));
        if (!$path || !is_file($path) || filesize($path)>15*1024*1024) return picsart_video_error(__('Product photo is unavailable or exceeds 15 MB.','picsart-ai-image-editor'));
        $editor=wp_get_image_editor($path); if (is_wp_error($editor)) return picsart_video_error(__('This photo cannot be prepared.','picsart-ai-image-editor'));
        $size=$editor->get_size(); if (min($size['width'],$size['height'])<640 || max($size['width'],$size['height'])>8192) return picsart_video_error(__('Choose a photo from 640 to 8192 pixels.','picsart-ai-image-editor'));
        $mime=wp_get_image_mime($path); $extensions=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
        if (!isset($extensions[$mime])) return picsart_video_error(__('Choose a JPEG, PNG or WebP source.','picsart-ai-image-editor'));
        $tmp=wp_tempnam('picsart-source'); $saved=$editor->save($tmp,$mime);
        if (is_wp_error($saved)) { wp_delete_file($tmp); return picsart_video_error(__('Could not prepare the product photo.','picsart-ai-image-editor')); }
        $bytes=file_get_contents($saved['path']); wp_delete_file($saved['path']); if ($tmp!==$saved['path']) wp_delete_file($tmp);
        return ['base64'=>base64_encode($bytes),'name'=>'product-photo.'.$extensions[$mime]];
    }
    if ($action==='import') return picsart_video_import($b);
    if ($action==='file' || $action==='download') {
        $id=absint($b['id']??0);
        if (get_post_type($id)!=='attachment' || !current_user_can('edit_post',$id)) return picsart_video_error(__('Media not available.','picsart-ai-image-editor'),404);
        $url=wp_get_attachment_url($id);
        return $action==='download' ? ['downloadUrls'=>[['url'=>$url]]] : ['_id'=>(string)$id,'operationStatus'=>'READY','private'=>false];
    }
    if ($action==='detach') {
        $id=absint($b['productId']??0); $media=absint($b['mediaId']??0); $p=picsart_video_product($id);
        if (is_wp_error($p)) return $p;
        if ($p['sku']!==($b['sku']??'')) return picsart_video_error(__('Product identity changed. Review it again.','picsart-ai-image-editor'),409);
        if (get_post_type($media)!=='attachment' || !current_user_can('edit_post',$media) || !str_starts_with((string)get_post_mime_type($media),'video/')) return picsart_video_error(__('Choose a video from your Media Library.','picsart-ai-image-editor'),403);
        $native=picsart_native_product_video($id,$media,true);if (is_wp_error($native)) return $native;
        $ids=get_post_meta($id,'_picsart_video_ids',true); if (!is_array($ids)) $ids=[];
        $remaining=array_values(array_filter($ids,fn($existing)=>absint($existing)!==$media));
        if ($remaining!==$ids) update_post_meta($id,'_picsart_video_ids',$remaining);
        return ['ok'=>true,'alreadyRemoved'=>!in_array($media,array_map('absint',$ids),true)];
    }
    if ($action==='attach') {
        $id=absint($b['productId']??0); $media=absint($b['mediaId']??0); $p=picsart_video_product($id);
        if (is_wp_error($p)) return $p;
        if ($p['sku']!==($b['sku']??'')) return picsart_video_error(__('Product identity changed. Review it again.','picsart-ai-image-editor'),409);
        if (get_post_type($media)!=='attachment' || !current_user_can('edit_post',$media) || !str_starts_with((string)get_post_mime_type($media),'video/')) return picsart_video_error(__('Choose a video from your Media Library.','picsart-ai-image-editor'));
        $native=picsart_native_product_video($id,$media);if (is_wp_error($native)) return $native;
        $ids=get_post_meta($id,'_picsart_video_ids',true); if (!is_array($ids)) $ids=[];
        if (!in_array($media,$ids,true)) { $ids[]=$media; update_post_meta($id,'_picsart_video_ids',$ids); }
        return ['ok'=>true];
    }
    return picsart_video_error(__('Unknown platform action.','picsart-ai-image-editor'),404);
}
function picsart_video_import($b) {
    if (!empty($b['options']['private'])) return picsart_video_error(__('Private legacy imports are unsupported.','picsart-ai-image-editor'));
    $url=esc_url_raw($b['url']??'');
    if (wp_parse_url($url,PHP_URL_SCHEME)!=='https' || !wp_http_validate_url($url)) return picsart_video_error(__('Media requires a public HTTPS URL.','picsart-ai-image-editor'));
    $key=hash('sha256',get_current_user_id().'|'.$url.'|'.($b['options']['displayName']??''));
    $receipt='_ppv_import_'.$key; $old=get_option($receipt);
    if (is_array($old) && !empty($old['id'])) return ['file'=>['_id'=>(string)$old['id']]];
    if (!picsart_receipt_add($receipt,['status'=>'started'],'',false)) return picsart_video_error(__('Import outcome is uncertain. Inspect Media Library before retrying.','picsart-ai-image-editor'),409);
    require_once ABSPATH.'wp-admin/includes/file.php'; require_once ABSPATH.'wp-admin/includes/media.php'; require_once ABSPATH.'wp-admin/includes/image.php';
    $tmp=wp_tempnam(); $limit=100*1024*1024;
    $r=wp_safe_remote_get($url,['timeout'=>60,'stream'=>true,'filename'=>$tmp,'limit_response_size'=>$limit+1,'redirection'=>3]);
    if (is_wp_error($r) || wp_remote_retrieve_response_code($r)!==200 || filesize($tmp)>$limit) { wp_delete_file($tmp); return picsart_video_error(__('Could not download media within the 100 MB limit.','picsart-ai-image-editor'),502); }
    $mime=(new finfo(FILEINFO_MIME_TYPE))->file($tmp); $extensions=['video/mp4'=>'mp4','video/webm'=>'webm','image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'];
    if (!isset($extensions[$mime])) { wp_delete_file($tmp); return picsart_video_error(__('Unsupported media format.','picsart-ai-image-editor')); }
    $name=sanitize_file_name(pathinfo($b['options']['displayName']??'Picsart',PATHINFO_FILENAME)).'.'.$extensions[$mime];
    $id=media_handle_sideload(['name'=>$name,'tmp_name'=>$tmp,'type'=>$mime,'error'=>0,'size'=>filesize($tmp)],0);
    if (is_wp_error($id)) { wp_delete_file($tmp); return $id; }
    update_post_meta($id,'_picsart_created',1);
    update_option($receipt,['status'=>'ready','id'=>$id],false);
    return ['file'=>['_id'=>(string)$id]];
}

/** Write a portable video into the merchant-approved product description. */
function picsart_native_product_video($id,$media,$remove=false) {
    global $wpdb;$post=get_post($id);$before=$post->post_content;$key='_picsart_native_video_markup_'.$media;$markup=get_post_meta($id,$key,true);
    if (!$markup) {if ($remove) return true;$url=wp_get_attachment_url($media);if (!$url) return picsart_video_error(__('Video file unavailable.','picsart-ai-image-editor'),409);$markup='<div class="picsart-product-video" data-picsart-media="'.absint($media).'"><video controls playsinline preload="metadata" style="max-width:100%" src="'.esc_url($url).'"></video></div>';update_post_meta($id,$key,$markup);}
    if ($remove) {$after=str_replace($markup,'',$before);if ($after===$before) return true;} else {if (str_contains($before,$markup)) return true;$after=$before."\n".$markup;}
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Conditional content write avoids overwriting simultaneous merchant edits; cache cleared below.
    $changed=$wpdb->update($wpdb->posts,['post_content'=>$after,'post_modified'=>current_time('mysql'),'post_modified_gmt'=>current_time('mysql',true)],['ID'=>$id,'post_content'=>$before]);clean_post_cache($id);
    if ($changed!==1) return picsart_video_error(__('Product content changed. Reload and review it before trying again.','picsart-ai-image-editor'),409);
    if (function_exists('wc_delete_product_transients')) wc_delete_product_transients($id);return true;
}
