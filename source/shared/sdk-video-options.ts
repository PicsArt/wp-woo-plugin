import {Model} from '@picsart/ai-sdk';
import type {ModelSchema} from './types';
import {photoInput} from './video-input';
import {displayResolution, type VideoVariant} from './video-options';
type SdkParams = ReturnType<ReturnType<typeof Model>['params']>;
type SdkEnum = ReturnType<SdkParams['enum']>;
const enabled=(entry:SdkEnum):Array<string|number> => !entry || entry.disabled ? [] : entry.options.filter(o=>!o.disabled).map(o=>o.id);
/** Validate context-dependent disabled options as well as the SDK base schema. */
export function acceptsSdkParams(model:string,params:Record<string,unknown>) {
 const m=Model(model);
 if(!m.validate(params).valid)return false;
 const constrained=m.paramsFor(params);
 return Object.entries(params).every(([key,value])=>{
  const base=constrained.param(key);
  const entry=base?.kind==='enum'?constrained.enum(key):base?.kind==='range'?constrained.range(key):base;
  if(!entry)return true;
  if(entry.disabled)return false;
  if(entry.kind==='enum')return entry.options.some(o=>!o.disabled && String(o.id)===String(value));
  if(entry.kind==='range')return typeof value==='number' && value>=entry.min && value<=entry.max;
  return true;
 });
}
/** Seedance's lower resolutions are always 8-bit; omit its disabled depth control. */
export function omitDisabledColorDepth(model:string,params:Record<string,unknown>) {
 if(Model(model).paramsFor(params).enum('colorDepth')?.disabled)delete params.colorDepth;
 return params;
}
export function sdkVideoVariants(schema:ModelSchema,loop=false):VideoVariant[] {
 const m=Model(schema.model),p=schema.schema.properties;
 const base:Record<string,unknown>={...m.params().getDefaults(),prompt:'A gentle camera movement around the product.',...photoInput(schema,'https://example.org/photo.jpg',loop)};
 // These controls are filled only when the constrained SDK exposes them.
 for(const key of ['resolution','quality','aspectRatio','duration'])delete base[key];
 if(p.count)base.count=1;
 if(p.generateAudio)base.generateAudio=false;
 if(p.enhancePrompt)base.enhancePrompt=false;
 if(p.promptExpansionMode?.enum?.includes('disabled'))base.promptExpansionMode='disabled';
 const qualityKey=p.resolution?'resolution':p.quality?'quality':undefined;
 const first=m.paramsFor(base);
 const resolutions=qualityKey?enabled(first.enum(qualityKey)):[''];
 const rows:VideoVariant[]=[];
 for(const resolution of resolutions){
  const withQuality=omitDisabledColorDepth(schema.model,{...base,...(qualityKey?{[qualityKey]:resolution}:{})});
  const controls=m.paramsFor(withQuality);
  const ar=controls.aspectRatio();
  const aspects=!ar||ar.disabled?['']:enabled(ar);
  for(const aspectRatio of aspects){
   const context={...withQuality,...(aspectRatio!==''?{aspectRatio:String(aspectRatio)}:{})};
   const duration=m.paramsFor(context).duration();
   if(!duration||duration.disabled)continue;
   const values=duration.kind==='enum'?enabled(duration).map(Number):Array.from({length:Math.max(0,Math.floor((duration.max-duration.min)/(duration.step||1))+1)},(_,i)=>duration.min+i*(duration.step||1));
   const durations=values.filter(n=>Number.isFinite(n)&&n>0&&acceptsSdkParams(schema.model,{...context,duration:p.duration.type==='string'?String(n):n}));
   if(durations.length)rows.push({resolution:displayResolution(resolution),aspectRatio:String(aspectRatio),durations});
  }
 }
 return rows;
}
