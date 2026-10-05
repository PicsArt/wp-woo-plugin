import type {DriveListing} from '../../shared/types';
/** One cache per mounted account browser. Expired entries require an explicit read. */
export class FolderCache {
  private entries=new Map<string,{at:number;listing:DriveListing}>();
  constructor(private now=Date.now,private ttl=60000,private limit=20) {}
  get(uid?:string) {
    const entry=this.entries.get(uid??'');
    if(!entry||this.now()-entry.at>=this.ttl){this.entries.delete(uid??'');return undefined;}
    return entry.listing;
  }
  set(uid:string|undefined,listing:DriveListing) {
    const key=uid??'';this.entries.delete(key);
    if(this.entries.size>=this.limit)this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key,{at:this.now(),listing});
  }
}
