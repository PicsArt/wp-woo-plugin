(function(wp){
    'use strict';
    if(!wp.media||!wp.media.view.AttachmentFilters)return;
    ['All','Uploaded'].forEach(function(name){
        var Original=wp.media.view.AttachmentFilters[name];if(!Original)return;
        wp.media.view.AttachmentFilters[name]=Original.extend({createFilters:function(){
            Original.prototype.createFilters.apply(this,arguments);
            Object.keys(this.filters).forEach(function(key){this.filters[key].props.picsart_media=null;},this);
            this.filters.picsart={text:wp.i18n.__('Picsart created or edited','picsart-ai-image-editor'),priority:60,props:{picsart_media:'1',uploadedTo:null,author:null,status:null,orderby:'date',order:'DESC'}};
        }});
    });
})(window.wp);
