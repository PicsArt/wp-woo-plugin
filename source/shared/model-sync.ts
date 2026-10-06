import bundledCatalog from './model-catalog.json';
import modelPolicy from './model-policy.json';
import type { ModelSchema, VideoModel } from './types';
import type { VideoVariant } from './video-options';
// Stable content revision shared by browser and server; upgrades invalidate fresh caches too.
const catalogContent=JSON.stringify([bundledCatalog,modelPolicy]);
export const MODEL_CATALOG_REVISION=Array.from(catalogContent).reduce((hash,char)=>Math.imul(hash^char.charCodeAt(0),16777619)>>>0,2166136261).toString(16);
export const MODEL_SYNC_INTERVAL=24*60*60*1000;
export interface SyncedModels {
 syncedAt:number; revision?:string; configuredDefault:string;
 video:VideoModel[]; image?:VideoModel[];
 schemas:Record<string,ModelSchema>;
 videoOptions:Record<string,{standard:VideoVariant[];loop:VideoVariant[]}>;
}
export interface ModelSyncReply { catalog?:SyncedModels; lastAttemptAt?:number; error?:string; defaultModel?:string }
export function syncDue(last:number|undefined,now:number){return !last||now-last>=MODEL_SYNC_INTERVAL||last>now;}
export function resolveDefault(preferred:string|undefined,configured:string,ids:string[]){return preferred&&ids.includes(preferred)?preferred:ids.includes(configured)?configured:ids[0]??'';}

export function catalogSyncDue(catalog:SyncedModels|undefined,now:number){return catalog?.revision!==MODEL_CATALOG_REVISION||syncDue(catalog?.syncedAt,now);}
