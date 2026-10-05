import type {ModelSchema} from './types';
export interface VideoInput {prompt:string;url:string;duration:number;resolution:string;aspectRatio:string;loop?:boolean}
/** Keep catalog constraints and submitted photo input in the same SDK mode. */
export function photoInput(s:ModelSchema,url:string,loop=false):Record<string,unknown> {
 const p=s.schema.properties;
 const params:Record<string,unknown>=s.model==='minimax-h3' && p.imageUrls && !loop ? {imageUrls:[url]} : p.startFrame ? {startFrame:url} : {imageUrls:[url]};
 if(loop && p.startFrame && p.endFrame)params.endFrame=url;
 return params;
}
