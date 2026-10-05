(function (wp) {
    'use strict';
    if (!wp || !wp.element) return;
    var el = wp.element.createElement;
    function link(id, post, target) { var url = new URL(picsartNative.tools); url.searchParams.set('attachment_id', id || 0); if (post) url.searchParams.set('post_id', post); if (target) url.searchParams.set('target', target); return url.href; }
    // Inline images in RichText (paragraphs, headings, captions) are not core/image blocks.
    if(wp.richText)wp.richText.registerFormatType('picsart/edit-inline-image',{
        title:'Edit image with AI',tagName:'span',className:'picsart-inline-image-action',
        edit:function(props){
            var active=wp.richText.getActiveObject(props.value);
            var pending=wp.element.useRef(null), latest=wp.element.useRef(props);
            latest.current=props;
            var status=wp.element.useState(''),error=status[0],setError=status[1];
            wp.element.useEffect(function(){return function(){if(pending.current)window.removeEventListener('message',pending.current);};},[]);
            if(!active||active.type!=='core/image')return null;
            var attributes=active.attributes||{},match=(attributes.className||'').match(/(?:^|\s)wp-image-(\d+)(?:\s|$)/),id=match?Number(match[1]):0;
            function launch(){
                setError('');
                if(!id){setError('Choose this image from the WordPress Media Library first, then edit it with AI.');return;}
                if(pending.current)window.removeEventListener('message',pending.current);
                var original=props.value, start=original.start,end=original.end;
                var block=wp.data.select('core/block-editor').getSelectedBlock();
                var snapshot=block&&JSON.stringify(block.attributes),clientId=block&&block.clientId;
                var token=crypto.randomUUID(),url=new URL(picsartNative.tools);
                url.searchParams.delete('view');url.searchParams.set('page','picsart-image-generation');url.searchParams.set('attachment_id',id);
                url.searchParams.set('picsart_insert',token);url.searchParams.set('picsart_kind','image');
                var child=window.open(url.href,'picsart-'+token,'width=1200,height=850');
                if(!child){setError('Allow the Picsart window to open, then try again.');return;}
                var importing=false;
                function receive(event){
                    var data=event.data;
                    if(event.origin!==location.origin||event.source!==child||!data||data.type!=='picsart-insert'||data.token!==token||!Number.isSafeInteger(data.id)||data.id<1||importing)return;
                    importing=true;
                    wp.apiFetch({path:'/wp/v2/media/'+data.id}).then(function(media){
                        if(media.media_type!=='image'||!media.mime_type.startsWith('image/'))throw new Error('Choose an image result.');
                        var current=clientId&&wp.data.select('core/block-editor').getBlock(clientId);
                        if(!current||JSON.stringify(current.attributes)!==snapshot)throw new Error('This content changed while editing. Your result is saved in Media Library; use Replace image to select it.');
                        latest.current.onChange(wp.richText.insertObject(original,{type:'core/image',attributes:Object.assign({},attributes,{className:(attributes.className||'').replace(/wp-image-\d+/, 'wp-image-'+media.id),url:media.source_url})},start,end));
                        window.removeEventListener('message',receive);pending.current=null;child.close();
                    }).catch(function(e){importing=false;setError(e.message||'Could not replace the inline image.');});
                }
                pending.current=receive;window.addEventListener('message',receive);
            }
            return el(wp.element.Fragment,{},el(wp.blockEditor.RichTextToolbarButton,{icon:'format-image',title:'Edit image with AI',onClick:launch}),error?el(wp.components.Notice,{status:'error',onRemove:function(){setError('');}},error):null);
        }
    });
    var generationEditors={};
    ['image','video'].forEach(function(kind){
        wp.blocks.registerBlockType('picsart/generate-'+kind, {
            apiVersion:3, title:kind==='image'?'Generate image with Picsart':'Generate video with Picsart',
            icon:kind==='image'?'format-image':'video-alt3', category:'media', keywords:['AI','Picsart','generate'],
            edit:generationEditors[kind]=function(props){
                var state=wp.element.useState(''), error=state[0], setError=state[1];
                var pending=wp.element.useRef(null);
                wp.element.useEffect(function(){return function(){if(pending.current)window.removeEventListener('message',pending.current.listener);};},[]);
                function launch(){
                    setError('');
                    if(pending.current){window.removeEventListener('message',pending.current.listener);pending.current=null;}
                    var token=crypto.randomUUID(), url=new URL(picsartNative.tools);
                    url.searchParams.delete('view');url.searchParams.delete('attachment_id');
                    url.searchParams.set('page',kind==='image'?'picsart-image-generation':'picsart-studio');
                    if(props.sourceId)url.searchParams.set('attachment_id',props.sourceId);
                    var original=wp.data.select('core/block-editor').getBlock(props.clientId);
                    var originalId=original&&original.attributes&&original.attributes.id, originalUrl=original&&original.attributes&&original.attributes.url;
                    url.searchParams.set('picsart_insert',token);url.searchParams.set('picsart_kind',kind);
                    var child=window.open(url.href,'picsart-'+token,'width=1200,height=850');
                    if(!child){setError('Allow this window to open, then try again.');return;}
                    var importing=false;
                    function receive(event){
                        var data=event.data;
                        if(event.origin!==location.origin||event.source!==child||!data||data.type!=='picsart-insert'||data.token!==token||!Number.isSafeInteger(data.id)||data.id<1||importing)return;
                        importing=true;
                        wp.apiFetch({path:'/wp/v2/media/'+data.id}).then(function(media){
                            if(media.media_type!==(kind==='image'?'image':'file')||!media.mime_type.startsWith(kind+'/'))throw new Error('Choose a generated '+kind+'.');
                            if(!wp.data.select('core/block-editor').getBlock(props.clientId))throw new Error('The insertion block was removed.');
                            if(props.compact){
                                var current=wp.data.select('core/block-editor').getBlock(props.clientId);
                                if(current.name!=='core/image'||((props.sourceId||props.replaceExisting)?(current.attributes.id!==originalId||current.attributes.url!==originalUrl):(current.attributes.id||current.attributes.url)))throw new Error('This image block has changed. Choose an empty Image block.');
                                wp.data.dispatch('core/block-editor').updateBlockAttributes(props.clientId,{id:media.id,url:media.source_url,alt:props.sourceId?current.attributes.alt||'':media.alt_text||''});
                            }else wp.data.dispatch('core/block-editor').replaceBlock(props.clientId,wp.blocks.createBlock('core/'+kind,{id:media.id,src:kind==='video'?media.source_url:undefined,url:kind==='image'?media.source_url:undefined,alt:media.alt_text||''}));
                            window.removeEventListener('message',receive);pending.current=null;child.close();
                        }).catch(function(e){importing=false;setError(e.message||'Could not insert media. Try again.');});
                    }
                    window.addEventListener('message',receive);pending.current={listener:receive};
                }
                var blockProps=wp.blockEditor.useBlockProps();
                if(props.compact){
                    var control=el(wp.element.Fragment,{},el(props.toolbar?wp.components.ToolbarButton:(props.menu||props.settings)?wp.components.MenuItem:wp.components.Button,{variant:props.menu||props.settings?undefined:'secondary',icon:props.toolbar?'admin-customizer':undefined,onClick:launch,disabled:props.edit&&!props.sourceId},wp.i18n.__(props.edit?(props.toolbar?'Picsart: Edit with AI':'Edit with AI'):(props.toolbar?'Picsart: Generate image':'Generate image'),'picsart-ai-image-editor')),error?el('p',{role:'alert'},error):null);
                    return props.settings?el(wp.blockEditor.BlockSettingsMenuControls,{},control):control;
                }
                return el('div',blockProps,el('p',{},'Create and review your '+kind+' in Picsart, then choose Insert into post. Your unsaved post stays open.'),el(wp.components.Button,{variant:'primary',onClick:launch},kind==='image'?'Generate image':'Generate video'),error?el('p',{role:'alert'},error):null);
            },save:function(){return null;}
        });
    });
    if(wp.hooks&&wp.blockEditor)wp.hooks.addFilter('editor.BlockEdit','picsart/ai-image-settings',function(Original){
        return function(props){
            return el(wp.element.Fragment,{},el(Original,props),props.name==='core/image'&&props.isSelected?el(wp.element.Fragment,{},
                el(generationEditors.image,{clientId:props.clientId,compact:true,settings:true,edit:true,sourceId:props.attributes.id}),
                el(generationEditors.image,{clientId:props.clientId,compact:true,settings:true,replaceExisting:true})):null);
        };
    });
    if(wp.hooks&&wp.blockEditor)wp.hooks.addFilter('editor.BlockEdit','picsart/ai-image-toolbar',function(Original){
        return function(props){
            return el(wp.element.Fragment,{},el(Original,props),props.name==='core/image'&&props.isSelected?
                el(wp.blockEditor.BlockControls,{group:'other'},el(wp.components.ToolbarGroup,{},el(generationEditors.image,{clientId:props.clientId,compact:true,toolbar:true,edit:true,sourceId:props.attributes.id}),el(generationEditors.image,{clientId:props.clientId,compact:true,toolbar:true,replaceExisting:true}))):null);
        };
    });
    if(wp.hooks&&wp.blockEditor)wp.hooks.addFilter('editor.MediaReplaceFlow','picsart/generate-image-menu',function(Original){
        return function(props){
            var context=wp.blockEditor.useBlockEditContext();
            var block=context.clientId&&wp.data.select('core/block-editor').getBlock(context.clientId);
            if(!block||block.name!=='core/image'||block.attributes.id||block.attributes.url||props.multiple)return el(Original,props);
            var children=props.children;
            return el(Original,Object.assign({},props,{children:function(args){
                return el(wp.element.Fragment,{},typeof children==='function'?children(args):children,el(generationEditors.image,{clientId:context.clientId,compact:true,menu:true}));
            }}));
        };
    });
    if(wp.hooks&&wp.blockEditor)wp.hooks.addFilter('editor.BlockEdit','picsart/image-placeholder',function(Original){
        return function(props){
            var wrapper=wp.element.useRef(null), state=wp.element.useState(null), target=state[0],setTarget=state[1];
            var empty=props.name==='core/image'&&!props.attributes.id&&!props.attributes.url;
            wp.element.useEffect(function(){
                if(!empty||!wrapper.current){setTarget(null);return;}
                var root=wrapper.current;
                function locate(){setTarget(root.querySelector('.block-editor-media-placeholder .components-placeholder__fieldset'));}
                locate();var observer=new MutationObserver(locate);observer.observe(root,{childList:true,subtree:true});return function(){observer.disconnect();};
            },[empty,props.clientId]);
            if(!empty)return el(Original,props);
            return el('div',{ref:wrapper,style:{display:'contents'}},el(Original,props),target?wp.element.createPortal(el(generationEditors.image,Object.assign({},props,{compact:true})),target):null);
        };
    });
    if (wp.hooks && wp.blockEditor) wp.hooks.addFilter('editor.BlockEdit', 'picsart/image-tools', function (Original) { return function (props) { return el(wp.element.Fragment, {}, el(Original, props), props.name === 'core/image' && props.isSelected && props.attributes.id ? el(wp.blockEditor.InspectorControls, {}, el(wp.components.PanelBody, { title: wp.i18n.__('Picsart image tools', 'picsart-ai-image-editor') }, el('a', { href: link(props.attributes.id), target: '_blank', rel: 'noopener noreferrer' }, wp.i18n.__('Edit a copy in Picsart', 'picsart-ai-image-editor')), el('p', {}, wp.i18n.__('Save your edited copy to Media Library, then use Replace to select it here. Your unsaved page stays open.', 'picsart-ai-image-editor')))) : null); }; });
    if (wp.hooks) wp.hooks.addFilter('editor.PostFeaturedImage', 'picsart/featured-tools', function (Original) { return function (props) { return el(wp.element.Fragment, {}, el(Original, props), props.media && props.media.id ? el('a', { href: link(props.media.id), target: '_blank', rel: 'noopener noreferrer' }, wp.i18n.__('Edit a copy with Picsart, then select it from Media Library', 'picsart-ai-image-editor')) : null); }; });
    if (wp.blocks && wp.blockEditor) wp.blocks.registerBlockType('picsart/media', { apiVersion: 3, title: wp.i18n.__('Picsart media', 'picsart-ai-image-editor'), icon: 'format-image', category: 'media', attributes: { id: { type: 'number', default: 0 }, url:{type:'string'}, mediaType:{type:'string'}, alt:{type:'string'} }, edit: function (props) { return el(wp.components.PanelBody, {}, el(wp.blockEditor.MediaUploadCheck, {}, el(wp.blockEditor.MediaUpload, { allowedTypes: ['image','video'], value: props.attributes.id, onSelect: function (media) { props.setAttributes({ id: media.id,url:media.url,mediaType:media.type,alt:media.alt||'' }); }, render: function (args) { return el(wp.components.Button, { variant: 'secondary', onClick: args.open }, wp.i18n.__('Select Picsart media', 'picsart-ai-image-editor')); } })), props.attributes.id ? el(wp.serverSideRender, { block: 'picsart/media', attributes: props.attributes }) : null); }, save: function (props) { var a=props.attributes;if(!/^https?:\/\//.test(a.url||''))return null;return a.mediaType==='video'?el('video',{src:a.url,controls:true,preload:'none',style:{maxWidth:'100%'}}):el('img',{src:a.url,alt:a.alt||'',style:{maxWidth:'100%',height:'auto'}}); } });
})(window.wp);
