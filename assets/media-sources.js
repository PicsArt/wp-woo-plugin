(function(wp){
    'use strict';
    if(!wp.media||!wp.apiFetch)return;
    var __=function(text){return wp.i18n.__(text,'picsart-ai-image-editor');};
    function request(route,body,params){
        var query=new URLSearchParams(Object.assign({route:route},params||{}));
        return wp.apiFetch({path:'/picsart/v1/studio?'+query,method:body?'POST':'GET',data:body});
    }
    function button(label,action){var el=document.createElement('button');el.type='button';el.className='button';el.textContent=__(label);el.addEventListener('click',action);return el;}
    function message(el,text){el.textContent=text;}
    function selectAttachment(frame,original,id){
        var attachment=wp.media.attachment(Number(id));
        return attachment.fetch().then(function(){frame.setState(original);frame.content.render('browse');var selection=frame.state().get('selection');if(selection){if(selection.multiple)selection.add(attachment);else selection.reset([attachment]);}});
    }
    var SourceView=wp.media.View.extend({
        className:'picsart-media-source',
        initialize:function(options){this.original=options.original;this.path=[];this.serial=0;},
        render:function(){
            var self=this;this.el.style.cssText='padding:24px;overflow:auto;height:100%;box-sizing:border-box';
            this.el.replaceChildren();var heading=document.createElement('h2');heading.textContent=__('Picsart Drive');this.el.appendChild(heading);this.el.appendChild(button('Back to Media Library',function(){self.controller.setState(self.original);self.controller.content.render('browse');}));
            var disclosure=document.createElement('p');disclosure.textContent=__('Choose a file to copy into WordPress Media Library. The WordPress copy can be publicly accessible. Your original stays in Picsart Drive.');this.el.appendChild(disclosure);
            this.status=document.createElement('p');this.status.setAttribute('role','status');this.el.appendChild(this.status);
            this.list=document.createElement('div');this.el.appendChild(this.list);this.load();return this;
        },
        load:async function(){
            var self=this,serial=++this.serial;message(this.status,__('Loading Drive…'));this.list.replaceChildren();
            try{
                var folder=this.path.length?this.path[this.path.length-1]:null;
                var result=await request('/drive/browse',null,folder?{folderUid:folder.uid}:{});if(serial!==this.serial)return;
                message(this.status,folder?folder.name:__('Your Drive files'));
                if(folder)this.list.appendChild(button('Back to parent',function(){self.path.pop();self.load();}));
                (result.folders||[]).forEach(function(f){self.list.appendChild(button(f.name,function(){self.path.push(f);self.load();}));});
                var files=(result.images||[]).map(function(f){return Object.assign({},f,{type:'image'});}).concat((result.videos||[]).map(function(f){return Object.assign({},f,{type:'video'});}));
                files.forEach(function(file){
                    var row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:12px;margin:12px 0';
                    if(file.url){var img=document.createElement('img');img.src=file.url;img.alt='';img.loading='lazy';img.style.cssText='width:80px;height:64px;object-fit:contain';row.appendChild(img);}
                    var name=document.createElement('span');name.textContent=(file.name||__('Untitled'))+' ('+file.type+')';row.appendChild(name);
                    var add=button('Copy to WordPress and select',async function(){
                        add.disabled=true;message(self.status,__('Copying…'));
                        try{var imported=await request('/drive/import',{uid:file.uid,type:file.type,folderUid:folder?folder.uid:undefined});
                            if(imported.status==='READY'&&imported.mediaId){await selectAttachment(self.controller,self.original,imported.mediaId);}
                            else if(imported.status==='FAILED'){add.textContent=__('Import failed');message(self.status,__('Check this file in WordPress Media Library.'));return;}
                            else{add.textContent=__('Check import');message(self.status,__('WordPress is processing this file. Check import to continue.'));}
                        }catch(e){message(self.status,e.message||__('Import could not be confirmed. Check Media Library before retrying.'));}
                        add.disabled=false;
                    });row.appendChild(add);self.list.appendChild(row);
                });
                if(!files.length&&!result.folders.length)message(this.status,__('This folder is empty.'));
            }catch(e){if(serial!==this.serial)return;message(this.status,e.message||__('Connect Picsart to browse Drive.'));var link=document.createElement('a');link.href=picsartMediaSources.tools;link.target='_blank';link.rel='noopener';link.textContent=__('Open Picsart connection');this.list.appendChild(link);}
        },
        remove:function(){this.serial++;return wp.media.View.prototype.remove.apply(this,arguments);}
    });
    function generate(frame,kind,attachmentId){
                    var original=frame.state().id,token=crypto.randomUUID(),url=new URL(picsartMediaSources.tools,location.href);
                    url.searchParams.set('page',kind==='video'?'picsart-studio':'picsart-image-generation');url.searchParams.delete('view');url.searchParams.set('picsart_insert',token);url.searchParams.set('picsart_kind',kind);
                    if(attachmentId)url.searchParams.set('attachment_id',String(attachmentId));
                    var child=window.open(url.href,'_blank');if(!child)return;
                    var busy=false;
                    function receive(event){var data=event.data;if(event.origin!==location.origin||event.source!==child||!data||data.type!=='picsart-insert'||data.token!==token||!Number.isInteger(data.id)||data.id<1||busy)return;
                        busy=true;wp.apiFetch({path:'/wp/v2/media/'+data.id}).then(function(media){if(media.media_type!==(kind==='image'?'image':'file')||typeof media.mime_type!=='string'||!media.mime_type.startsWith(kind+'/'))throw new Error('Unexpected media type');return selectAttachment(frame,original,media.id);}).then(cleanup).catch(function(){busy=false;});
                    }
                    function cleanup(){window.removeEventListener('message',receive);clearInterval(timer);}
                    window.addEventListener('message',receive);var timer=setInterval(function(){if(child.closed)cleanup();},1000);frame.once('close',cleanup);
    }
    // Extend the native inline uploader, including the empty-library upload view.
    var InlineUploader=wp.media.view.UploaderInline;
    if(InlineUploader)wp.media.view.UploaderInline=InlineUploader.extend({render:function(){
        InlineUploader.prototype.render.apply(this,arguments);
        var frame=this.controller,state=frame&&frame.state(),library=state&&state.get('library'),type=library&&library.props&&library.props.get('type');
        if(!state||type==='audio'||(/playlist/.test(state.id)&&!/video/.test(state.id)))return this;
        var kind=type==='video'||/video-playlist/.test(state.id)?'video':'image',area=this.el.querySelector('.upload-ui');
        if(area&&!area.querySelector('.picsart-upload-generate')){
            var row=document.createElement('p');row.className='picsart-upload-generate';row.style.margin='16px 0 0';
            row.appendChild(button(kind==='video'?'Generate video with Picsart':'Generate image with Picsart',function(){generate(frame,kind);}));area.appendChild(row);
        }
        return this;
    }});
    var initialize=wp.media.view.MediaFrame.prototype.initialize;
    wp.media.view.MediaFrame.prototype.initialize=function(){
        initialize.apply(this,arguments);var frame=this;
        this.on('router:render:browse',function(router){
            var state=frame.state(),library=state&&state.get('library'),type=library&&library.props&&library.props.get('type');
            if(type==='audio'||(state&&/playlist/.test(state.id)&&!/video/.test(state.id)))return;
            var kind=type==='video'||(state&&/video-playlist/.test(state.id))?'video':'image';
            router.set('picsart-generate',{text:__(kind==='video'?'Generate video with Picsart':state&&state.id==='featured-image'?'Generate featured image with Picsart':'Generate image with Picsart'),priority:60,click:function(){generate(frame,kind);}});
        });
        this.on('content:render:browse',function(view){
            if(!view||!view.toolbar)return;
            var state=frame.state(),library=state&&state.get('library');
            var selection=state&&state.get('selection');
            if(selection){
                var edit=new wp.media.view.Button({controller:frame,text:__('Edit selected image with AI'),priority:-74,disabled:true,click:function(){var selected=selection.first();if(selected&&selected.get('type')==='image')generate(frame,'image',selected.id);}});
                function updateEdit(){var selected=selection.first();edit.model.set('disabled',!selected||selected.get('type')!=='image');}
                edit.listenTo(selection,'add remove reset selection:single',updateEdit);updateEdit();view.toolbar.set('picsart-edit-selected',edit);
            }
            if(state&&state.id==='featured-image'){
                view.toolbar.set('picsart-featured-generate',new wp.media.view.Button({controller:frame,text:__('Generate featured image with Picsart'),priority:-75,click:function(){generate(frame,'image');}}));
            }
            if(state&&(/video-playlist/.test(state.id)||(library&&library.props&&library.props.get('type')==='video'))){
                view.toolbar.set('picsart-generate-video',new wp.media.view.Button({controller:frame,text:__('Generate video with Picsart'),priority:-75,click:function(){generate(frame,'video');}}));
            }
        });
        this.on('menu:render:default',function(view){
            if(picsartMediaSources.productVideo)view.set({'picsart-product-video':{text:__('Product video'),priority:85,click:function(){window.open(picsartMediaSources.productVideo,'_blank','noopener');}}});
            view.set({
                'picsart-drive':{text:__('Picsart Drive'),priority:180,click:function(){var original=frame.state().id;frame.content.set(new SourceView({controller:frame,original:original}));}},
                'picsart-generate-video':{text:__('Generate video with Picsart'),priority:182,click:function(){generate(frame,'video');}},
                'picsart-generate':{text:__('Generate image with Picsart'),priority:181,click:function(){
                    generate(frame,'image');
                }}
            });
        });
    };
    // Public catalog categories remain disabled until the supported reuse contract is available.
})(window.wp);
