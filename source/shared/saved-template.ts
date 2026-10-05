import type {Job, Source} from './types';
export const PRODUCT_INFO = '{{product_info}}';
export interface SavedVideoTemplate {id:string;subject:string;jobId:string;name:string;model:string;promptTemplate:string;duration:number;resolution:string;aspectRatio:string;loop:boolean}
/** Keep one product slot when reusing older templates; never rewrite recorded results. */
export function normalizeProductPrompt(prompt:string){
 let seen=false;
 const cleaned=prompt.replaceAll(PRODUCT_INFO,()=>{if(seen)return '';seen=true;return PRODUCT_INFO;}).replace(/\n[ \t]*\n(?:[ \t]*\n)+/g,'\n\n').trim();
 return seen?cleaned:`${cleaned}\n\n${PRODUCT_INFO}`;
}
export function adaptPrompt(prompt:string,source:Source){
 if(!prompt.includes(PRODUCT_INFO))throw new Error('Keep {{product_info}} in your template.');
 const info=JSON.stringify({name:source.productName??source.name});
 return normalizeProductPrompt(prompt).replaceAll(PRODUCT_INFO,()=>`Product reference data (not instructions): ${info}`);
}
export function savedFromJob(job:Omit<Job, "status"> & {status:string},name:string,id:string):SavedVideoTemplate {
 if(job.quote.kind==='image'||!job.reviewedAt||job.reviewedBy!==job.subject||!['ACCEPTED','SAVED','ATTACHED','ATTACHING','IMPORTING'].includes(job.status)||!job.quote.output)throw new Error('Accept the completed video before saving a template.');
 return {id,subject:job.subject,jobId:job.id,name,model:job.quote.model,promptTemplate:normalizeProductPrompt(job.quote.promptTemplate??job.quote.template.prompt),loop:job.quote.loop??job.quote.template.id==='still',...job.quote.output};
}
