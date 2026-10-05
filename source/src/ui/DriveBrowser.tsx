import {useEffect, useRef, useState} from 'react';
import type {DriveFolder, DriveListing, Source} from '../../shared/types';
import {FolderCache} from './folder-cache';

type Request = <T>(path:string,body?:unknown,signal?:AbortSignal)=>Promise<T>;
export function DriveIcon({kind='folder'}:{kind?:'folder'|'search'|'refresh'|'play'|'chevron'|'image'}) {
  const paths={folder:'M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z',search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',refresh:'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 3M18 18A8 8 0 0 1 5 15',play:'m9 5 11 7-11 7V5Z',chevron:'m9 5 7 7-7 7',image:'M3 3h18v18H3V3Zm0 14 6-6 5 5 3-3 4 4M8 7h.01'};
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}

/** Browsing owns its loading state; it never starts workspace polling or holds a write lock. */
export function DriveBrowser({request,onSelect,disabled=false}:{request:Request;onSelect:(source:Source)=>void;disabled?:boolean}) {
  const [listing,setListing]=useState<DriveListing>();
  const [path,setPath]=useState<DriveFolder[]>([]);
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState<'all'|'image'|'video'>('all');
  const [loading,setLoading]=useState(false);
  const [action,setAction]=useState('');
  const [error,setError]=useState('');
  const [previews,setPreviews]=useState<Record<string,string>>({});
  const [imports,setImports]=useState<Record<string,string>>({});
  const cache=useRef(new FolderCache());
  const navigation=useRef<AbortController>();
  const actionLock=useRef(false);
  const alive=useRef(true);
  const folderUid=path.at(-1)?.uid;
  const unavailable=disabled||!!action;
  async function openFolder(next:DriveFolder[],force=false) {
    navigation.current?.abort();
    const controller=new AbortController();navigation.current=controller;
    const uid=next.at(-1)?.uid;
    setPath(next);setSearch('');setError('');
    const cached=force?undefined:cache.current.get(uid);
    setListing(cached);setLoading(!cached);
    if(cached)return;
    try {
      const result=await request<DriveListing>(`/drive/browse${uid?`?folderUid=${encodeURIComponent(uid)}`:''}`,undefined,controller.signal);
      if(controller.signal.aborted||!alive.current)return;
      cache.current.set(uid,result);setListing(result);
    } catch(e) {
      if(!controller.signal.aborted&&alive.current)setError(e instanceof Error?e.message:'Could not load this folder. Try Refresh.');
    } finally {if(!controller.signal.aborted&&alive.current)setLoading(false);}
  }
  useEffect(()=>{alive.current=true;void openFolder([]);return()=>{alive.current=false;navigation.current?.abort();};},[]);
  async function perform(uid:string,fn:()=>Promise<void>) {
    if(actionLock.current||disabled)return;
    actionLock.current=true;setAction(uid);setError('');
    try {await fn();} catch(e) {if(alive.current)setError(e instanceof Error?e.message:'This action could not complete.');}
    finally {actionLock.current=false;if(alive.current)setAction('');}
  }
  const folders=listing?.folders.filter(f=>f.name.toLowerCase().includes(search.toLowerCase()))??[];
  const media=listing?[...listing.images.map(f=>({...f,type:'image' as const})),...listing.videos.map(f=>({...f,type:'video' as const}))]:[];
  const shown=media.filter(f=>(filter==='all'||f.type===filter)&&f.name.toLowerCase().includes(search.toLowerCase()));
  return <section className="drive-explorer" aria-label="Picsart Drive browser">
    <div className="drive-toolbar">
      <nav className="drive-breadcrumbs" aria-label="Drive folder path">
        <button disabled={unavailable} onClick={()=>void openFolder([])} aria-current={!path.length?'page':undefined}><DriveIcon/><span>Picsart Drive</span></button>
        {path.map((folder,index)=><span className="drive-crumb" key={folder.uid}><DriveIcon kind="chevron"/><button disabled={unavailable} title={folder.name} aria-current={index===path.length-1?'page':undefined} onClick={()=>void openFolder(path.slice(0,index+1))}>{folder.name||'Untitled folder'}</button></span>)}
      </nav>
      <label className="drive-search"><DriveIcon kind="search"/><input aria-label="Search this folder" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this folder"/></label>
    </div>
    {error&&<div className="drive-error" role="alert">{error}</div>}
    <div className="drive-workspace">
      <aside className="drive-sidebar" aria-label="Folders">
        <h3>Folders</h3>
        <button className={`drive-folder-row ${!path.length?'is-current':''}`} aria-current={!path.length?'location':undefined} disabled={unavailable} onClick={()=>void openFolder([])}><DriveIcon/><span>Drive home</span></button>
        {!!path.length&&<button className="drive-folder-row" disabled={unavailable} onClick={()=>void openFolder(path.slice(0,-1))}><span aria-hidden="true">←</span><span>Back to parent</span></button>}
        <div className="drive-folder-list" aria-busy={loading}>
          {folders.map(folder=><button className="drive-folder-row" key={folder.uid} title={folder.name} disabled={unavailable} onClick={()=>void openFolder([...path,folder])}><DriveIcon/><span>{folder.name||'Untitled folder'}</span><DriveIcon kind="chevron"/></button>)}
          {!loading&&!folders.length&&<p className="drive-sidebar-empty">{search?'No matching folders':'No subfolders'}</p>}
        </div>
      </aside>
      <div className="drive-content" aria-busy={loading}>
        <div className="drive-content-heading"><div><h3>{path.at(-1)?.name||'Your media'}</h3>{listing&&<span>{shown.length} {shown.length===1?'file':'files'}</span>}</div>
          <div className="drive-filters" role="group" aria-label="Media type">{(['all','image','video'] as const).map(value=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{value==='all'?'All':value==='image'?'Images':'Videos'}</button>)}</div>
        </div>
        {loading?<div className="drive-loading" role="status"><DriveIcon kind="refresh"/>Loading folder…</div>:<div className="drive-media-grid">
          {shown.map(file=><article key={file.uid} className="drive-media-card" aria-label={file.name||`Untitled ${file.type}`}>
            <div className="drive-thumbnail">
              {file.type==='video'&&previews[file.uid]?<video src={previews[file.uid]} controls preload="metadata" aria-label={file.name||'Drive video'}/>:<>
                {file.url?<img src={file.url} alt={file.name} loading="lazy" decoding="async"/>:<div className="drive-no-preview"><DriveIcon kind={file.type==='image'?'image':'play'}/></div>}
                {file.type==='video'&&<button className="drive-play" aria-label={`Preview ${file.name||'video'}`} disabled={unavailable} onClick={()=>void perform(file.uid,async()=>{
                  const params=new URLSearchParams({uid:file.uid,type:'video'});if(folderUid)params.set('folderUid',folderUid);
                  const result=await request<{url:string}>(`/drive/media?${params}`);
                  if(alive.current)setPreviews(p=>({...p,[file.uid]:result.url}));
                })}><DriveIcon kind="play"/></button>}
              </>}
            </div>
            <div className="drive-media-info"><h4 title={file.name}>{file.name||`Untitled ${file.type}`}</h4><span>{file.type==='image'?'Image':'Video'}</span></div>
            <div className="drive-media-actions">
              {file.type==='image'&&<button className="drive-use-photo" disabled={unavailable} onClick={()=>void perform(file.uid,async()=>{
                const result=await request<Source>('/drive/images/select',{uid:file.uid,folderUid});if(alive.current)onSelect(result);
              })}>Use photo</button>}
              <button className="drive-add" disabled={unavailable||['READY','FAILED'].includes(imports[file.uid])} title="Use the original file as is in WordPress Media" onClick={()=>void perform(file.uid,async()=>{
                const result=await request<{status:string}>('/drive/import',{uid:file.uid,type:file.type,folderUid});
                if(alive.current)setImports(p=>({...p,[file.uid]:result.status}));
              })}>{imports[file.uid]==='READY'?'Added to WordPress':imports[file.uid]==='IMPORTING'?'Check import':imports[file.uid]==='FAILED'?'Import failed':'Add to WordPress'}</button>
            </div>
            {action===file.uid&&<small role="status">Working…</small>}
            {imports[file.uid]==='IMPORTING'&&<small role="status">WordPress is processing this file.</small>}
            {imports[file.uid]==='FAILED'&&<small role="status">Check this file in WordPress Media Library.</small>}
          </article>)}
        </div>}
        {!loading&&listing&&!shown.length&&<div className="drive-empty"><DriveIcon kind="image"/><strong>{search?'No matching media':filter==='all'?'No media in this folder':`No ${filter}s in this folder`}</strong><p>{search?'Try another name or clear your search.':'Choose a folder from the left to keep browsing.'}</p>{search&&<button onClick={()=>setSearch('')}>Clear search</button>}</div>}
      </div>
    </div>
    <footer className="drive-footer"><span>Original files stay in Picsart Drive.{listing&&[listing.folders,listing.images,listing.videos].some(items=>items.length>=100)&&' Showing up to 100 of each type.'}</span><button disabled={unavailable||loading} onClick={()=>void openFolder(path,true)}><DriveIcon kind="refresh"/>Refresh</button></footer>
  </section>;
}
