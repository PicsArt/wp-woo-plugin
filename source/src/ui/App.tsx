import {ImageToolActions} from './ImageToolActions';
import {imageToolFor} from '../../shared/image-tools';
import {recoverActiveImage,imageIsRunning} from './active-image';
import {HelpPanels} from './HelpPanels';
import {SupportPanel} from './SupportPanel';
import {historyLink,videoHandoffLink} from './platform';
import {PicsartLogo} from './PicsartLogo';
import {AccountSettings} from './AccountSettings';
import {AccountBalance} from './AccountBalance';
import NativeImageEditor from './NativeImageEditor';
import LocalVideoTools from './LocalVideoTools';
import {priceAction} from '../../shared/price-action';
import {MarketingExports} from './MarketingExports';
import {studioLink} from './platform';
import {normalizeProductPrompt} from '../../shared/saved-template';
import {resolveDefault} from '../../shared/model-sync';
import {useModelSync} from './hooks/useModelSync';
import {MusicEditor} from './MusicEditor';
import {EmailGifEditor} from './EmailGifEditor';
import {StudioHelp, NotificationPreferences, CloudPrivacy} from './StudioHelp';
import {WorkspaceUpdates} from './WorkspaceUpdates';
import {filterHistory,historyWithActive} from './history';
import {DriveBrowser} from "./DriveBrowser";
import modelPolicy from '../../shared/model-policy.json';
import bundledModels from "../../shared/model-catalog.json";
import { usePricingCatalog } from "./hooks/usePricingCatalog";
import { estimatePrice } from "../../shared/pricing";
import { cached, restoreQuotes } from "./quote-cache";
import { Button } from "./Button";
import { friendlyModel, statusLabel } from "./labels";
import { selectVideoVariant, closestAspectRatio, type VideoVariant } from "../../shared/video-options";
import { useLiveQuote, preloadQuote, invalidateQuote } from "./hooks/useLiveQuote";
import { useEffect, useState, useRef } from "react";
import type {
  State,
  Quote,
  ModelSchema,
  Product,
  Job,
  Source,
  DeviceLoginStatus,
} from "../../shared/types";
import { platformEndpoint, platformFetch } from "./platform";
import { normalizePhoto } from "./photo";
import { getCreditShortfall } from "./credits";
import { DeviceSignIn } from "./DeviceSignIn";
import { applyDeviceStatus, pendingView, type DeviceView } from "./device-sign-in";
const schemaCache = new Map<string, ModelSchema>(Object.entries(bundledModels.schemas) as [string, ModelSchema][]);
let queue: Promise<unknown> = Promise.resolve();
class RequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}
function endpoint(path: string) {
  const input = new URL(path, "https://route.invalid");
  const url = new URL(window.picsartStudio.endpoint, window.location.href);
  for (const [key,value] of input.searchParams) url.searchParams.set(key,value);
  url.searchParams.set("route", input.pathname);
  return url.href;
}
async function request<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  // Device sign-in must not wait behind a long /tick: the code expires in minutes.
  const independent = path === "/quotes" || path === "/image-quotes" || path.startsWith("/auth/device/") || (body === undefined && /^\/drive\/(browse|media)(?:\?|$)/.test(path));
  const task = (independent ? Promise.resolve() : queue)
    .catch(() => {})
    .then(async () => {
      signal?.throwIfAborted();
      const headers: Record<string, string> = {};
      if (body !== undefined && !(body instanceof FormData))
        headers["Content-Type"] = "application/json";
      const init = {
        method: body === undefined ? "GET" : "POST",
        headers,
        ...(independent ? {signal} : {}),
        // Finish dispatched requests before releasing the queue. Aborting fetch
        // does not cancel the server's workspace lease or provider request.
        body:
          body === undefined
            ? undefined
            : body instanceof FormData
              ? body
              : JSON.stringify(body),
      };
      // Only explicit BUSY responses are retried; unknown mutations are not.
      const busyDeadline=Date.now()+26000;
      for (let attempt = 0; ; attempt++) {
        const r = await platformFetch(endpoint(path), init);
        if (!r.ok) {
          const e = await r.json().catch(() => ({
            message: `WordPress endpoint returned HTTP ${r.status}.`,
          }));
          if (e.code === "BUSY" && Date.now()<busyDeadline) {
            await new Promise((r) =>
              setTimeout(r, Math.min(500 * 2 ** attempt, 2500)),
            );
            signal?.throwIfAborted();
            continue;
          }
          throw new RequestError(e.message ?? "Request failed.", e.code);
        }
        return r.json() as Promise<T>;
      }
    });
  if (!independent) queue = task;
  return task;
}
async function video(id: string) {
  return (await request<{ url: string }>(`/jobs/${id}/video`)).url;
}
function BlogDestination({job,run,busy}:{job:Job;run:(fn:()=>Promise<unknown>,action?:string)=>Promise<void>;busy:boolean}){
 const [title,setTitle]=useState(job.quote.source?.productName??job.quote.source?.name??'Generated image'),[body,setBody]=useState(''),[link,setLink]=useState('');const intent=useRef(crypto.randomUUID());
 if(!job.mediaId||!job.reviewedAt)return null;
 return <details className="review-notice"><summary>Create a blog draft</summary><label>Post title<input value={title} maxLength={200} onChange={e=>{setTitle(e.target.value);intent.current=crypto.randomUUID();setLink('');}}/></label><label>Post body<textarea value={body} maxLength={10000} onChange={e=>{setBody(e.target.value);intent.current=crypto.randomUUID();setLink('');}}/></label><p>Your reviewed media is embedded in a new draft. Publish only after reviewing in WordPress.</p>{link?<a href={link}>Open draft in WordPress</a>:<button disabled={busy||!title.trim()} onClick={()=>void run(async()=>{const r=await request<{editUrl:string}>(`/jobs/${job.id}/blog-draft`,{title,content:body,requestId:intent.current});setLink(r.editUrl);},`job:${job.id}:draft`)}>Create draft</button>}</details>;
}
function FailureDetail({job}:{job:Job}) {
  if(!['STOPPED','UNKNOWN_SUBMISSION','IMPORT_UNKNOWN','RECONCILIATION_REQUIRED'].includes(job.status))return null;
  const message=job.events.at(-1)?.message.replace(/https?:\/\/\S+/g,'[service]').replace(/[A-Za-z0-9_+/.=-]{64,}/g,'[redacted]').slice(0,400);
  return <p role="status">{message ?? 'This operation needs review.'} No automatic generation retry was made.</p>;
}
function Result({
  job,
  run,
  busy,
  onReuse,
}: {
  onReuse: (job:Job,changeMedia?:boolean)=>void;
  job: Job;
  run: (fn: () => Promise<unknown>, action?: string) => Promise<void>;
  busy: boolean;
}) {
  const [url, setUrl] = useState(job.previewUrl ?? "");
  const [action, setAction] = useState("");
  const [zoom, setZoom] = useState(false);
  const [recipeName,setRecipeName]=useState(job.quote.template.name);
  const [recipeSaved,setRecipeSaved]=useState(false);
  const [regeneration,setRegeneration]=useState<Quote>();
  const [gifOpen,setGifOpen]=useState(false);
  const [videoError, setVideoError] = useState("");
  const [videoAttempt, setVideoAttempt] = useState(0);
  const acting = useRef(false);
  async function act(name: string, fn: () => Promise<unknown>) {
    if (acting.current || busy) return;
    acting.current = true;
    setAction(name);
    try {
      await run(fn, `job:${job.id}:${name}`);
    } finally {
      acting.current = false;
      setAction("");
    }
  }
  const retained = [
    "REVIEW",
    "ACCEPTED",
    "REJECTED",
    "IMPORTING",
    "SAVED",
    "ATTACHING",
    "ATTACHED",
  ].includes(job.status);
  useEffect(() => {
    if (!retained) return;
    if (job.previewUrl && videoAttempt === 0) { setUrl(job.previewUrl); return; }
    let cancelled = false;
    setVideoError("");
    void video(job.id).then(
      (value) => {
        if (!cancelled) setUrl(value);
      },
      (error) => {
        if (!cancelled)
          setVideoError(
            error instanceof Error
              ? error.message
              : "Could not load the video.",
          );
      },
    );
    return () => {
      cancelled = true;
    };
  }, [job.id, job.previewUrl, retained, videoAttempt]);
  const uncertain = [
    "UNKNOWN_SUBMISSION",
    "RECONCILIATION_REQUIRED",
    "ORPHANED_SPEND",
    "IMPORT_UNKNOWN",
  ].includes(job.status);
  return (
    <article id={`job-${job.id}`} tabIndex={-1} className="live-card result-card">
      <div className="live-row">
        <h3>{job.quote.source?.productName ?? job.quote.source?.name}</h3>
        <span className={`status-pill status-${job.status.toLowerCase()}`}>
          {statusLabel(job.status)}
        </span>
      </div>
      <p className="live-muted">
        {job.quote.template.name} · {job.maximum} credits approved · {new Date(job.approvedAt).toLocaleString()}
        {["QUEUED", "SUBMITTING", "GENERATING", "PERSISTING"].includes(job.status) && job.progress !== undefined ? ` · ${job.progress}%` : ""}
      </p>
      <details><summary>Generation prompt</summary><pre style={{whiteSpace:"pre-wrap"}}>{typeof job.quote.params.prompt==="string"?job.quote.params.prompt:job.quote.template.prompt}</pre></details>
      <FailureDetail job={job} />
      {job.status==='RECONCILIATION_REQUIRED'&&job.upstream&&<div className="review-notice"><p>Check the existing generation without starting or paying for another one.</p><button disabled={busy} onClick={()=>void run(()=>request(`/jobs/${job.id}/check-result`,{}),`job:${job.id}:check-result`)}>Check existing result</button></div>}
      {["QUEUED", "SUBMITTING", "GENERATING", "PERSISTING"].includes(job.status) && <div className="edit-progress" role="status" aria-busy="true">
        <strong>{job.status === "PERSISTING" ? "Preparing your generated video…" : job.status === "QUEUED" ? "Your video is queued…" : "Generating your video…"}</strong>
        <progress aria-label="Generation progress" max={100} value={job.status === "GENERATING" && job.progress !== undefined && job.progress < 100 ? job.progress : undefined} />
        <p>This updates automatically. Your video will appear here when ready.</p>
      </div>}
      {uncertain && (
        <div className="review-notice" role="status">
          The last action needs checking. Do not generate another video to retry
          this job. Check the activity and credit details below and your Picsart
          Drive before contacting support with this job ID:{" "}
          <code>{job.id}</code>.
        </div>
      )}
      {retained && (!url || videoError) && (
        <div role="status">
          {videoError ? (
            <>
              <p>{videoError}</p>
              <Button
                priority="secondary"
                onClick={() => setVideoAttempt((n) => n + 1)}
              >
                Retry loading video
              </Button>
            </>
          ) : (
            "Loading video…"
          )}
        </div>
      )}
      {url && (
        <>
          <div className={`comparison-grid ${zoom ? "comparison-large" : ""}`}>
            <figure>
              <img
                src={job.quote.source?.url}
                alt={`Original photo of ${job.quote.source?.productName ?? job.quote.source?.name}`}
              />
              <figcaption>
                Original photo{" "}
                <button className="text-button" onClick={() => setZoom(!zoom)}>
                  {zoom ? "Reduce view" : "Enlarge comparison"}
                </button>
              </figcaption>
            </figure>
            <figure>
              <video
                controls
                controlsList="nofullscreen"
                playsInline
                preload="auto"
                src={url}
                onLoadedData={() => setVideoError("")}
                onError={() => setVideoError("Could not load this video. Retry loading it.")}
                aria-label="Generated video"
              />
              <figcaption>Generated video{" "}
                <a href={url} target="_blank" rel="noopener noreferrer">Open video in new tab ↗</a>
              </figcaption>
            </figure>
          </div>
        </>
      )}
      {(job.status==='REVIEW'||(job.status==='SAVED'&&!job.reviewedAt))&&<div className="action-row"><Button disabled={busy||!url||!!videoError} onClick={()=>void act('review',()=>request(`/jobs/${job.id}/review`,{accept:true}))}>Accept video</Button><Button priority="secondary" disabled={busy} onClick={()=>void act('reject',()=>request(`/jobs/${job.id}/review`,{accept:false,reason:'Merchant declined result'}))}>Reject video</Button></div>}
      {retained&&<div className="review-notice"><button disabled={busy||!job.quote.output} onClick={()=>void act('regenerate-quote',async()=>{setRegeneration(undefined);const q=await request<Quote>('/quotes',{sourceId:job.quote.source?.id,model:job.quote.model,templateId:job.quote.template.id,promptTemplate:normalizeProductPrompt(job.quote.promptTemplate??job.quote.template.prompt),loop:job.quote.loop??job.quote.template.id==='still',...job.quote.output});setRegeneration(q);})}>Regenerate with this photo</button> <button disabled={busy} onClick={()=>onReuse(job,false)}>Change settings</button> <button disabled={busy} onClick={()=>onReuse(job,true)}>Use another photo</button>{regeneration&&<div role="region" aria-label="Approve regeneration"><p>A new generation costs {regeneration.total} credits. The existing result stays in history.</p><Button disabled={busy} onClick={()=>void act('regenerate',async()=>{if(Date.now()>=regeneration.expiresAt){setRegeneration(undefined);throw new Error('Quote expired. Request a new regeneration price.');}await request('/approvals',{quoteId:regeneration.id,ticket:regeneration.ticket,maximum:regeneration.total,approved:true,idempotencyKey:regeneration.id});setRegeneration(undefined);})}>Approve {regeneration.total} credits and regenerate</Button> <button disabled={busy} onClick={()=>setRegeneration(undefined)}>Cancel</button></div>}</div>}
      {["ACCEPTED", "IMPORTING", "SAVED", "ATTACHING", "ATTACHED"].includes(
        job.status,
      ) && (
        <div className="action-row">
          <Button
            priority="secondary"
            disabled={busy}
            onClick={() =>
              void act("download", async () => {
                const asset = await request<{
                  url: string;
                  downloadUrl: string;
                }>(`/jobs/${job.id}/video`);
                const a = document.createElement("a");
                a.href = asset.downloadUrl;
                a.download = `Picsart-${job.id}.mp4`;
                a.click();
              })
            }
          >
            {action === "download" ? "Preparing download…" : "Download MP4"}
          </Button>
          {["ACCEPTED"].includes(job.status) && (
            <Button
              disabled={busy}
              onClick={() =>
                void act("save", () => request(`/jobs/${job.id}/save`, {}))
              }
            >
              {action === "save"
                ? "Saving to WordPress…"
                : "Copy to WordPress Media Library"}
            </Button>
          )}
          {["SAVED", "ATTACHING"].includes(job.status) && (
            <Button
              disabled={busy}
              onClick={() =>
                void act("attach", () => request(`/jobs/${job.id}/attach`, {}))
              }
            >
              {action === "attach"
                ? "Adding to product…"
                : "Add to product"}
            </Button>
          )}
        </div>
      )}
      {job.reviewedAt && job.status!=="REJECTED" && url && <div className="review-notice">
        <div className="action-row"><button disabled={busy} onClick={()=>void act('share',async()=>{if(!navigator.share)throw new Error('Sharing is unavailable in this browser. Download the video and upload it in your social app.');const response=await fetch(url);if(!response.ok)throw new Error('Could not prepare sharing. Download the video instead.');const file=new File([await response.blob()],`Picsart-${job.id}.mp4`,{type:'video/mp4'});if(!navigator.canShare?.({files:[file]}))throw new Error('This browser cannot share video files. Download the video instead.');await navigator.share({files:[file],title:job.quote.source?.productName??'Product video'});})}>Share video</button><button aria-expanded={gifOpen} onClick={()=>setGifOpen(!gifOpen)}>Create email GIF</button></div>
        <MusicEditor url={url}/>{gifOpen&&<EmailGifEditor url={url} name={`Picsart-${job.id}`}/>}
        <details><summary>Save these settings</summary><p>Reuse this model, prompt and format with another product. Each generation has a new credit quote.</p><label>Settings name <input maxLength={80} value={recipeName} onChange={e=>setRecipeName(e.target.value)}/></label><button disabled={busy||!recipeName.trim()||recipeSaved} onClick={()=>void act('recipe',async()=>{await request('/saved-templates',{jobId:job.id,name:recipeName});setRecipeSaved(true);})}>{recipeSaved?'Settings saved':job.status==='REVIEW'?'Approve result and save settings':'Save settings'}</button></details>
      </div>}
      {job.status==='ATTACHED'&&<div className="review-notice"><p>Remove this video from the product listing while keeping the file in WordPress and Picsart Drive.</p><button disabled={busy} onClick={()=>void act('detach',()=>request(`/jobs/${job.id}/detach`,{}))}>{action==='detach'?'Removing from product…':'Remove from product listing'}</button></div>}
      <InsertIntoPost job={job}/><BlogDestination job={job} run={run} busy={busy}/>{job.mediaId&&job.reviewedAt&&['SAVED','ATTACHED'].includes(job.status)&&<p className="destination-note">Added to your <a href={`upload.php?item=${encodeURIComponent(job.mediaId)}`}>WordPress Media Library</a>.</p>}{job.mediaId&&job.reviewedAt&&['SAVED','ATTACHED'].includes(job.status)&&<MarketingExports attachmentId={job.mediaId} image={url} video={job.quote.kind!=='image'} title={job.quote.source?.name}/>}{job.reviewReason && (
        <p className="destination-note">Review feedback: {job.reviewReason}</p>
      )}
      {retained && (
        <p className="destination-note">
          {job.storageBackend === "legacy-private" ? "Your generated video is retained privately in WordPress." : <>Your generated video is retained in Picsart Drive. <a href="https://picsart.com/files" target="_blank" rel="noopener noreferrer">Open Picsart Drive</a>.</>}{" "}
          {job.status === "ATTACHED"
            ? "This video has been added to the product video section."
            : job.mediaId ? "Your WordPress copy is ready in the Media Library." : "Download it or copy it to WordPress Media Library."}
        </p>
      )}
    </article>
  );
}
function ImageResult({
  selected,
  job,
  run,
  busy,
  onUse,
}: {
  job: Job;
  run: (fn: () => Promise<unknown>, action?: string) => Promise<void>;
  busy: boolean;
  onUse: (id: string) => void;
  selected: boolean;
}) {
  const [url, setUrl] = useState(job.previewUrl ?? "");
  const [error, setError] = useState("");
  const [imageLoaded,setImageLoaded]=useState(false);
  useEffect(()=>{setImageLoaded(false);},[url]);
  const [attempt, setAttempt] = useState(0);
  const ready = ["REVIEW", "ACCEPTED", "REJECTED", "SAVED", "ATTACHED"].includes(job.status);
  const reviewed = !!job.reviewedAt && ["ACCEPTED", "SAVED", "ATTACHED"].includes(job.status);
  const copied = reviewed && !!job.mediaId && ["SAVED", "ATTACHED"].includes(job.status);
  useEffect(() => {
    if (!ready) return;
    if (job.previewUrl && attempt === 0) { setUrl(job.previewUrl); return; }
    let active = true;
    setError("");
    void video(job.id).then(
      (value) => {
        if (active) setUrl(value);
      },
      (e) => {
        if (active) setError(e.message);
      },
    );
    return () => {
      active = false;
    };
  }, [job.id, job.previewUrl, ready, attempt]);
  return (
    <article id={`job-${job.id}`} tabIndex={-1} className="live-card result-card">
      <h3>
        {job.quote.source ? `Photo edit · ${job.quote.source.productName ?? job.quote.source.name}` : 'Generated image'}
      </h3>
      <p>
        {job.status === "GENERATING"
          ? "Editing photo"
          : job.status === "IMPORT_UNKNOWN"
            ? "Photo save needs checking"
            : statusLabel(job.status)}{" "}
        · {friendlyModel(job.quote.model)} · {job.maximum} credits approved
      </p>
      <p>{job.quote.template.prompt}</p>
      <FailureDetail job={job} />
      {job.status==='RECONCILIATION_REQUIRED'&&job.upstream&&<div className="review-notice"><p>Check the existing generation without starting or paying for another one.</p><button disabled={busy} onClick={()=>void run(()=>request(`/jobs/${job.id}/check-result`,{}),`job:${job.id}:check-result`)}>Check existing result</button></div>}
      {job.status === "IMPORT_UNKNOWN" && (
        <div className="review-notice">
          <p>
            The render is saved in the job record. This checks whether saving
            can safely finish without generating again.
          </p>
          <Button
            disabled={busy}
            onClick={() =>
              void run(
                () => request(`/jobs/${job.id}/finish-photo-save`, {}),
                `job:${job.id}:finish-photo-save`,
              )
            }
          >
            Finish saving photo
          </Button>
        </div>
      )}
      {ready && !url && (
        <div role="status">
          {error || "Loading edited photo…"}
          {error && (
            <button onClick={() => setAttempt((n) => n + 1)}>
              Retry loading photo
            </button>
          )}
        </div>
      )}
      {url && (
        <div className="comparison-grid">
          {job.quote.source && <figure>
            <img src={job.quote.source.url} alt="Original product photo" />
            <figcaption>Original photo</figcaption>
          </figure>}
          <figure>
            <img src={url} alt="Generated image" onLoad={()=>{setImageLoaded(true);setError('');}} onError={()=>{setImageLoaded(false);setError('The image preview could not load. Refresh the preview before accepting.');}}/>
            <figcaption>
              {copied ? "Generated image · saved to WordPress Media Library" : reviewed ? "Generated image · accepted and ready to use" : job.status==='REJECTED' ? "Generated image · discarded" : "Generated image · review before saving"}
            </figcaption>
          </figure>
        </div>
      )}
      {error&&url&&<p role="alert">{error} <button onClick={()=>{setUrl('');setAttempt(n=>n+1);}}>Retry loading photo</button></p>}{url&&(job.status==='REVIEW'||(job.status==='SAVED'&&!job.reviewedAt))&&<button disabled={busy||!imageLoaded} onClick={()=>void run(()=>request(`/jobs/${job.id}/review`,{accept:true}),`job:${job.id}:review`)}>Accept image</button>}
      {job.mediaId&&job.reviewedAt&&['SAVED','ATTACHED'].includes(job.status)&&job.quote.source?.productId&&<div className="action-row"><button disabled={busy} onClick={()=>void run(()=>request(`/jobs/${job.id}/apply-image`,{targetType:'featured'}),`job:${job.id}:apply`)}>Apply to original featured image</button><button disabled={busy} onClick={()=>void run(()=>request(`/jobs/${job.id}/apply-image`,{targetType:'gallery'}),`job:${job.id}:apply`)}>Replace original gallery image</button></div>}
      <InsertIntoPost job={job}/><BlogDestination job={job} run={run} busy={busy}/>{job.mediaId&&job.reviewedAt&&['SAVED','ATTACHED'].includes(job.status)&&<p className="destination-note">Added to your <a href={`upload.php?item=${encodeURIComponent(job.mediaId)}`}>WordPress Media Library</a>.</p>}{job.mediaId&&job.reviewedAt&&['SAVED','ATTACHED'].includes(job.status)&&<MarketingExports attachmentId={job.mediaId} image={url} video={job.quote.kind!=='image'} title={job.quote.source?.name}/>}
      {url&&job.storageBackend!=='legacy-private'&&<p className="destination-note">Your generated image is retained in Picsart Drive. <a href="https://picsart.com/files" target="_blank" rel="noopener noreferrer">Open Picsart Drive</a>.{!job.mediaId&&(reviewed ? ' Your accepted image is ready to copy to WordPress Media Library.' : job.status==='REVIEW' ? ' Review and accept it before copying it to WordPress Media Library.' : '')}</p>}
      {url&&job.reviewedAt&&['ACCEPTED','SAVED','ATTACHED'].includes(job.status)&&<div className="action-row"><a href={url} target="_blank" rel="noopener noreferrer" download={`Picsart-${job.id}.png`}>Download image</a>{job.status==='ACCEPTED'&&<button disabled={busy} onClick={()=>void run(()=>request(`/jobs/${job.id}/save`,{}),`job:${job.id}:save`)}>Copy to WordPress Media Library</button>}</div>}
      {url && ["REVIEW", "ACCEPTED", "SAVED", "ATTACHED"].includes(job.status) && (
        <p role="status">{selected
          ? "Your next video will use this image. Choose a video style, then click Generate."
          : reviewed ? "Use this image as the starting point for a video." : "Accept this image after reviewing it, then choose Use image for video."}</p>
      )}
      {url && ["REVIEW", "ACCEPTED", "SAVED", "ATTACHED"].includes(job.status) && (
        <div className="action-row">
          <Button
            disabled={busy||!["ACCEPTED","SAVED","ATTACHED"].includes(job.status)||!job.reviewedAt||!imageLoaded}
            onClick={() =>
              void run(async () => {
                const selected = await request<Source>(
                  `/jobs/${job.id}/use-photo`,
                  {},
                );
                onUse(selected.id);
              }, `job:${job.id}:use-photo`)
            }
          >
            {selected ? "Selected for your next video" : "Use image for video"}
          </Button>
          {job.status === "REVIEW" && (
            <Button
              priority="secondary"
              disabled={busy}
              onClick={() =>
                void run(
                  () => request(`/jobs/${job.id}/review`, { accept: false }),
                  `job:${job.id}:reject`,
                )
              }
            >
              Discard image
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
function InsertIntoPost({job}:{job:Job}) {
  if(!window.opener||!job.mediaId||!job.reviewedAt||!['SAVED','ATTACHED'].includes(job.status))return null;
  const params=new URLSearchParams(location.search);
  if(params.has('picsart_insert'))sessionStorage.setItem('picsart-editor-insert',JSON.stringify({token:params.get('picsart_insert'),kind:params.get('picsart_kind')}));
  let context:{token:string;kind:string};try{context=JSON.parse(sessionStorage.getItem('picsart-editor-insert')||'null');}catch{return null;}
  if(!context||context.kind!==(job.quote.kind==='image'?'image':'video'))return null;
  return <button onClick={()=>window.opener.postMessage({type:'picsart-insert',token:context.token,id:Number(job.mediaId)},location.origin)}>Insert into post</button>;
}
export default function App() {
  const workspaceView=window.picsartStudio.workspaceView??"videos";
  useEffect(()=>{const p=new URLSearchParams(location.search);if(window.opener&&p.has('picsart_insert'))sessionStorage.setItem('picsart-editor-insert',JSON.stringify({token:p.get('picsart_insert'),kind:p.get('picsart_kind')}));},[]);
  const pricingCatalog = usePricingCatalog();
  const [state, setState] = useState<State>();
  const [priceNotice,setPriceNotice]=useState<{message:string;key:string}>();
  const [error, setError] = useState("");
  const [busyAction, setBusyAction] = useState("");
  const busy = !!busyAction;
  const actionLock = useRef(false);
  const [productSearch, setProductSearch] = useState("");
  const [historySearch,setHistorySearch]=useState("");
  const [historyKind,setHistoryKind]=useState("all");
  const [historyStatus,setHistoryStatus]=useState("all");
  const [showArchived,setShowArchived]=useState(false);
  const [savedTemplateId,setSavedTemplateId]=useState("");
  const [promptTemplate,setPromptTemplate]=useState("");
  const [templateLoop,setTemplateLoop]=useState(false);
  const [showChecklist,setShowChecklist]=useState(true);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  useEffect(() => {setDriveOpen(false);requestAnimationFrame(()=>document.getElementById('picsart-video-settings')?.focus());}, [state?.auth.subject]);
  const [device, setDevice] = useState<DeviceView>();
  // Attempts this tab finished or cancelled; a state read already in flight must not reopen them.
  const closedAttempts = useRef(new Set<string>());
  const modelSync = useModelSync(state?.auth.subject, request);
  const models = modelSync.catalog?.video ?? bundledModels.video;
  const appliedDefault=useRef<string>();
  const modelChosen=useRef(false);
  const reusedSourceAspect=useRef<string>();
  const appliedHandoff=useRef<string>();
  const [model, setModel] = useState(resolveDefault(undefined,modelPolicy.defaultVideoModel,bundledModels.video.map(m=>m.id)));
  const schema = modelSync.catalog?.schemas[model] ?? schemaCache.get(model);
  useEffect(()=>{modelChosen.current=false;appliedDefault.current=undefined;},[state?.auth.subject]);
  useEffect(()=>{const subject=state?.auth.subject;if(subject&&modelSync.catalog&&appliedDefault.current!==subject){appliedDefault.current=subject;if(!modelChosen.current)setModel(resolveDefault(modelSync.defaultModel,modelSync.catalog.configuredDefault,models.map(m=>m.id)));}},[state?.auth.subject,modelSync.catalog,modelSync.defaultModel]);
  const [source, setSource] = useState("");
  const [template, setTemplate] = useState("hero");
  const [requestedDuration, setDuration] = useState(5);
  const [requestedResolution, setResolution] = useState("1080p");
  const [requestedAspect, setAspect] = useState("9:16");
  const [customPrompt, setCustomPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [editModel, setEditModel] = useState(bundledModels.image[0]?.id ?? "");

  const [pollError, setPollError] = useState("");
  const [quoteRevision, setQuoteRevision] = useState(0);
  const [confirmingPrice,setConfirmingPrice]=useState<"image"|"video">();
  const confirmingPriceLock=useRef(false);
  const currentPriceKeys=useRef({image:"",video:""});
  const defaultPriceAccount = useRef<string>();
  const previousAccount = useRef<string>();
  const submitting = useRef(false);
  const [activeVideoId, setActiveVideoId] = useState<string>();
  const [activeEditId, setActiveEditId] = useState<string>();
  const restoredEditAccount = useRef<string>();
  const editContext = JSON.stringify([workspaceView,window.picsartStudio.attachmentId,window.picsartStudio.productId,new URLSearchParams(location.search).get('picsart_insert')]);
  const activeEditStorageKey = (subject:string) => `picsart-active-image-v1:${window.picsartStudio.wpEndpoint}:${window.picsartStudio.userId}:${subject}:${editContext}`;
  useEffect(()=>{
    if (!state) return;
    const subject = state.auth.authenticated ? state.auth.subject : undefined;
    if (restoredEditAccount.current === subject) return;
    restoredEditAccount.current = subject;
    let restored:string|undefined;
    try {
      const id = subject && localStorage.getItem(activeEditStorageKey(subject));
      const contextual = !!(window.picsartStudio.attachmentId || window.picsartStudio.productId || new URLSearchParams(location.search).get('picsart_insert'));
      const job = recoverActiveImage(state.jobs,subject,id,!contextual && workspaceView==='images');
      restored = job?.id;
      if (job && workspaceView === 'images') {
        if (window.picsartStudio.attachmentId) navigationImageLoaded.current=true;
        setEditPrompt(job.quote.template.prompt);setEditModel(job.quote.model);
        setImageInputMode(job.quote.source ? 'photo' : 'text');
        if (job.quote.source) setSource(job.quote.source.id);
      }
    } catch { /* Storage is optional; current-page review still works. */ }
    setActiveEditId(restored);
  },[state]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cursor, setCursor] = useState<string>();
  const initialProduct=useRef(false);
  useEffect(()=>{
    const id=window.picsartStudio.productId;
    if(!state || !window.picsartStudio.hasWooCommerce || !id || initialProduct.current)return;
    initialProduct.current=true;
    void request<Product>(`/products/${encodeURIComponent(id)}/select`,{}).then(p=>{
      setProducts([p]);setCatalogOpen(true);setSource(p.photos[0]?.id??'');
      return refresh();
    }).catch(e=>setError(e instanceof Error?e.message:'Could not load product.'));
  },[!!state]);
  useEffect(()=>{const resume=()=>{void refresh().catch(()=>{});};window.addEventListener("focus",resume);return()=>window.removeEventListener("focus",resume);},[]);
  useEffect(()=>{void platformFetch(`${window.picsartStudio.wpEndpoint}/preferences`).then(r=>r.json()).then(p=>setShowChecklist(!p.dismissed)).catch(()=>{});},[]);
  async function saveChecklist(dismissed:boolean){
    try{const r=await platformFetch(`${window.picsartStudio.wpEndpoint}/preferences`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dismissed})});const data=await r.json();if(!r.ok)throw new Error(data.message||'Could not save checklist preference.');setShowChecklist(!data.dismissed);}catch(e){setError(e instanceof Error?e.message:'Could not save checklist preference.');}
  }
  async function refresh() {
    const s = await request<State>("/state");
    restoreQuotes(s.auth.subject, s.quotes ?? []);
    // Queue the default quote before state updates start background catalog requests.
    if (s.auth.canGenerate && s.sources[0] && defaultPriceAccount.current !== s.auth.subject) {
      defaultPriceAccount.current = s.auth.subject;
      const defaults = selectVideoVariant(bundledModels.videoOptions['seedance-2.5'].standard, {duration:5,resolution:'1080p',aspectRatio:''});
      const input = {
        sourceId: s.sources[0].id, templateId: "hero", model: "seedance-2.5",
        duration: defaults.duration, resolution: defaults.resolution, aspectRatio: defaults.aspectRatio,
      };
      void preloadQuote(JSON.stringify([s.auth.subject, input]), () => request<Quote>("/quotes", input))
        .then(() => setQuoteRevision(v => v + 1))
        .catch(() => { /* The active price lookup displays errors and offers retry. */ });
      setModel(current => current || "seedance-2.5");
    }
    setState(s);
    const resumed = s.auth.pendingDevice;
    if (resumed && !closedAttempts.current.has(resumed.attemptId)) setDevice(current => current ?? pendingView(resumed));
    if (s.auth.canGenerate && !new URLSearchParams(location.search).has("changeMedia")) setSource(current => current || s.sources[0]?.id || "");
    if (
      s.auth.authenticated &&
      s.jobs.some((j) =>
        ["QUEUED", "GENERATING", "PERSISTING", "IMPORTING"].includes(j.status),
      )
    ) {
      const tick = await request<{ jobs: Job[] }>("/tick", {});
      s.jobs = tick.jobs;
      setState(current => current ? { ...current, jobs: tick.jobs } : current);
      // Persist completed renders immediately instead of waiting through another state request.
      if (tick.jobs.some(job => job.status === "PERSISTING")) {
        const saved = await request<{ jobs: Job[] }>("/tick", {});
        s.jobs = saved.jobs;
        setState(current => current ? { ...current, jobs: saved.jobs } : current);
      }
    }

  }
  async function run(fn: () => Promise<unknown>, action = "workspace") {
    if (actionLock.current) return;
    actionLock.current = true;
    setBusyAction(action);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      if (e instanceof RequestError && e.code === "BALANCE")
        await refresh().catch(() => {});
      setError(e instanceof Error ? e.message : "The action failed.");
    } finally {
      actionLock.current = false;
      setBusyAction("");
    }
  }
  function closeDevice() {
    setDevice(current => {
      if (current?.attemptId) closedAttempts.current.add(current.attemptId);
      return undefined;
    });
  }
  function deviceStatus(status: DeviceLoginStatus) {
    const next = applyDeviceStatus(device, status);
    if (next === device) return;
    if (next === "connected" || next === undefined) {
      closeDevice();
      void refresh().catch(() => { /* The workspace poll retries. */ });
    } else setDevice(next);
  }
  function connectPicsart() {
    // Open the tab inside the click so popup blockers allow it; the code stays visible here for matching.
    const tab = window.open("about:blank", "picsart-connect");
    if (tab) {
      tab.opener = null;
      tab.document.title = "Connecting to Picsart…";
      tab.document.body.textContent = "Preparing Picsart sign-in…";
    }
    void run(async () => {
      try {
        const started = await request<DeviceLoginStatus>("/auth/device/start", {});
        // An earlier approval may finish instead of a new code starting.
        if (started.status === "connected") { tab?.close(); closeDevice(); return; }
        if (started.status !== "pending") throw new Error("Picsart sign-in could not start. Try again.");
        if (device?.attemptId && device.attemptId !== started.attemptId) closedAttempts.current.add(device.attemptId);
        setDevice(pendingView(started));
        if (started.finishing) tab?.close();
        else if (tab && !tab.closed) tab.location.replace(started.verificationUriComplete ?? started.verificationUri);
      } catch (error) {
        tab?.close();
        throw error;
      }
    }, "connect");
  }
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        await refresh();
        if (active) setPollError("");
      } catch (e) {
        if (active && !(e instanceof RequestError && e.code === "BUSY"))
          setPollError(
            e instanceof Error ? e.message : "Could not refresh the workspace.",
          );
      }
      if (active) timer = setTimeout(poll, 5000);
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    if (!state) return;
    const subject = state.auth.authenticated ? state.auth.subject : undefined;
    // Temporary credit or Drive failures disable generation without losing the photo.
    if (previousAccount.current && previousAccount.current !== subject) {
      defaultPriceAccount.current = undefined;
      appliedHandoff.current=undefined;reusedSourceAspect.current=undefined;
      setSource("");
      setSavedTemplateId("");setPromptTemplate("");setTemplateLoop(false);
      setProducts([]);
      setCursor(undefined);
      setCatalogOpen(false);
    }
    previousAccount.current = subject;
  }, [state?.auth.authenticated, state?.auth.subject]);
  useEffect(() => {
    if (!state?.auth.canGenerate) return;
    setModel(current => current || bundledModels.video[0]?.id || "");
    setEditModel(current => current || bundledModels.image[0]?.id || "");
  }, [state?.auth.canGenerate]);
  useEffect(()=>{
    if(workspaceView!=='videos'||!state?.auth.canGenerate||!state.auth.subject)return;
    const params=new URLSearchParams(location.search),reuse=params.get('reuse'),sourceId=params.get('source');
    if(!reuse&&!sourceId)return;
    const key=`${state.auth.subject}:${reuse??sourceId}`;
    if(appliedHandoff.current===key)return;
    appliedHandoff.current=key;
    if(sourceId){
      if(state.sources.some(item=>item.id===sourceId))setSource(sourceId);
      else setError('This image is unavailable for the connected account. Choose another photo.');
      return;
    }
    const job=state.jobs.find(item=>item.id===reuse&&item.quote.kind!=='image');
    if(!job){setError('These settings are unavailable for the connected account. Open History and choose a result.');return;}
    modelChosen.current=true;setModel(job.quote.model);setTemplate('hero');setSavedTemplateId('reused');
    setPromptTemplate(normalizeProductPrompt(job.quote.promptTemplate??job.quote.template.prompt));
    setTemplateLoop(job.quote.loop??job.quote.template.id==='still');
    if(job.quote.output){setDuration(job.quote.output.duration);setResolution(job.quote.output.resolution);setAspect(job.quote.output.aspectRatio);}
    if(params.get('changeMedia')==='1'){setSource('');}
    else if(job.quote.source) {const reused=job.quote.source;reusedSourceAspect.current=reused.id;setState(current=>current?{...current,sources:current.sources.some(item=>item.id===job.quote.source?.id)?current.sources:[...current.sources,reused]}:current);setSource(reused.id);}
  },[state?.auth.subject,state?.auth.canGenerate]);
  const [imageInputMode,setImageInputMode]=useState<'text'|'photo'>('text');
  const textImage=workspaceView==='images'&&imageInputMode==='text';
  const editModels=(modelSync.catalog?.image??bundledModels.image).filter(m=>{const s=modelSync.catalog?.schemas[m.id]??schemaCache.get(m.id);return !!s&&(textImage?!s.schema.required?.includes('imageUrls'):!!s.schema.properties.imageUrls);});
  useEffect(()=>{if(editModels.length&&!editModels.some(m=>m.id===editModel)){setEditModel(editModels[0].id);setQuoteRevision(value=>value+1);}},[textImage,modelSync.catalog,editModel]);
  const selectedPhoto = state?.sources.find(item => item.id === source);
  const editedJob = state?.jobs.find(job => `edit-${job.id}` === source);
  const originalPhoto = editedJob?.quote.source ?? selectedPhoto;
  const hasEditedStart = !!editedJob && selectedPhoto?.url !== originalPhoto?.url;
  const activeEdit = state?.jobs.find(job => job.id === activeEditId);
  const editRunning = !!activeEditId && !activeEdit || imageIsRunning(activeEdit);
  const activeVideo = state?.jobs.find(job => job.id === activeVideoId);
  const videoRunning = !!activeVideoId && (!activeVideo || ["QUEUED", "SUBMITTING", "GENERATING", "PERSISTING"].includes(activeVideo.status));
  const videoStatus = !activeVideo ? "Starting video generation…"
    : activeVideo.status === "QUEUED" ? "Your video is queued…"
    : activeVideo.status === "PERSISTING" ? "Video generated · preparing your video…"
    : "Generating your video…";
  const editStatus = !activeEdit ? "Starting image generation…"
    : activeEdit.status === "QUEUED" ? "Your image is queued…"
    : activeEdit.status === "GENERATING" ? "Generating your image…"
    : activeEdit.status === "PERSISTING" ? "Image ready · saving result…"
    : "Preparing your image…";
  const editInput = {
    ...(textImage ? {} : {sourceId: originalPhoto?.id ?? source}),
    prompt: editPrompt.trim(),
    model: editModel,
    quality: "medium",
  };
  const editPricing = useLiveQuote(
    state?.auth.canGenerate && (textImage || source) && editModel && editPrompt.trim()
      ? JSON.stringify([state?.auth.subject, editInput]) : null,
    signal => request<Quote>("/image-quotes", editInput, signal),
    quoteRevision,
    250,
  );
  const modelVariants = ((modelSync.catalog?.videoOptions ?? bundledModels.videoOptions) as Record<string, {standard:VideoVariant[];loop:VideoVariant[]}>)[model]?.[(savedTemplateId?templateLoop:template === 'still') ? 'loop' : 'standard'] ?? [];
  const {duration, resolution, aspectRatio, durations: allowedDurations, resolutions, aspects} = selectVideoVariant(
    modelVariants,
    {duration: requestedDuration, resolution: requestedResolution, aspectRatio: requestedAspect},
  );
  useEffect(() => {
    setDuration(duration);
    setResolution(resolution);
    setAspect(aspectRatio);
  }, [duration, resolution, aspectRatio]);
  useEffect(() => {
    if (!selectedPhoto || schema?.model !== model) return;
    if(reusedSourceAspect.current===source)return;
    reusedSourceAspect.current=undefined;
    const closest = closestAspectRatio(selectedPhoto.width, selectedPhoto.height, aspects);
    if (closest) setAspect(closest);
  }, [source, selectedPhoto?.width, selectedPhoto?.height]);
  const quoteInput = {
    sourceId: source,
    templateId: template,
    ...(savedTemplateId?{promptTemplate,loop:templateLoop}:{}),
    ...(template === "custom" ? { customPrompt: customPrompt.trim() } : {}),
    model,
    duration,
    resolution,
    aspectRatio,
  };
  const inputKey = JSON.stringify([state?.auth.subject, quoteInput]);
  const canPrice = !!(
    state?.auth.canGenerate &&
    source &&
    model &&
    (schema?.model === model || cached(inputKey)) &&
    (!allowedDurations || allowedDurations.includes(duration)) &&
    (template !== "custom" || customPrompt.trim().length >= 10)
  );
  const quoteKey = canPrice ? inputKey : null;
  const pricing = useLiveQuote(
    quoteKey,
    (signal) => request<Quote>("/quotes", quoteInput, signal),
    quoteRevision,
    template === "custom" ? 450 : 0,
  );
  const quote = pricing.quote;
  const videoEstimate = estimatePrice(pricingCatalog, model, {kind: "video", duration, resolution});
  const editQualityControl = schemaCache.get(editModel)?.schema.properties.quality;
  const editQuality = editQualityControl ? (!editQualityControl.enum || editQualityControl.enum.includes("medium") ? "medium" : String(editQualityControl.default ?? editQualityControl.enum[0])) : null;
  const editEstimate = estimatePrice(pricingCatalog, editModel, {kind: "image"});
  const videoCreditShortfall = getCreditShortfall(
    state?.credits?.balance,
    state?.reserved ?? 0,
    quote?.total,
  );
  const editCreditShortfall = getCreditShortfall(
    state?.credits?.balance,
    state?.reserved ?? 0,
    editPricing.quote?.total,
  );
  currentPriceKeys.current={image:JSON.stringify([state?.auth.subject,editInput]),video:inputKey};
  async function startGeneration(kind:"image"|"video") {
    if(confirmingPriceLock.current || submitting.current || actionLock.current)return;
    const approved=kind==='image'?editPricing.quote:quote;
    if(approved){await priceAction(approved,async()=>approved,()=>{},generate);return;}
    const estimate=kind==='image'?editEstimate:videoEstimate;
    const maximum=Number(estimate?.split('–').at(-1));
    if(!Number.isFinite(maximum))return;
    const key=currentPriceKeys.current[kind];
    confirmingPriceLock.current=true;setConfirmingPrice(kind);setError('');setPriceNotice(undefined);
    try {
      await priceAction(undefined,()=>preloadQuote(key,()=>request<Quote>(kind==='image'?'/image-quotes':'/quotes',kind==='image'?editInput:quoteInput)),priced=>{
        setQuoteRevision(value=>value+1);
        setPriceNotice({key,message:`The exact account price is ${priced.total} credits. Review this amount and click Generate again to approve it.`});
      },generate,()=>currentPriceKeys.current[kind]===key);
    } catch(error) {setError(error instanceof Error?error.message:'Could not confirm the account price.');}
    finally {confirmingPriceLock.current=false;setConfirmingPrice(undefined);}
  }
  async function generate(approvedQuote?: Quote) {
    if (!approvedQuote || submitting.current || actionLock.current) return;
    if (approvedQuote.kind !== "image" && (editRunning || approvedQuote.source?.id !== source)) {
      setError("Wait for your edited starting photo and its updated price before generating.");
      return;
    }
    if (Date.now() >= approvedQuote.expiresAt) {
      setQuoteRevision((v) => v + 1);
      setError(
        "This credit quote expired. Check the updated price and click again.",
      );
      return;
    }
    setPriceNotice(undefined);
    submitting.current = true;
    if (approvedQuote.kind === "image") setActiveEditId("submitting");
    else setActiveVideoId("submitting");
    try {
      await run(async () => {
        const submitted = await request<{ id: string }>("/approvals", {
          quoteId: approvedQuote.id,
          ...(approvedQuote.ticket ? {ticket:approvedQuote.ticket} : {}),
          maximum: approvedQuote.total,
          approved: true,
          idempotencyKey: approvedQuote.id,
        });
        if (approvedQuote.kind === "image") {
          setActiveEditId(submitted.id);
          try { if (state?.auth.subject) localStorage.setItem(activeEditStorageKey(state.auth.subject),submitted.id); } catch { /* Optional reload continuity. */ }
        }
        else setActiveVideoId(submitted.id);
        invalidateQuote(approvedQuote.id);
        setQuoteRevision((v) => v + 1);
      }, approvedQuote.kind === "image" ? "edit" : "generate");
    } finally {
      submitting.current = false;
      setActiveEditId(current => current === "submitting" ? undefined : current);
      setActiveVideoId(current => current === "submitting" ? undefined : current);
    }
  }
  const navigationImageLoaded=useRef(false);
  useEffect(()=>{
    const id=Number(window.picsartStudio.attachmentId);
    if(navigationImageLoaded.current||!id||!state?.auth.canGenerate||!['images','videos'].includes(workspaceView))return;
    navigationImageLoaded.current=true;
    setImageInputMode('photo');
    void run(()=>importWordPressImage(id),'upload');
  },[state?.auth.canGenerate,workspaceView]);
  async function importWordPressImage(id:number,filename='wordpress-image.jpg') {
    const response=await platformFetch(`${window.picsartStudio.wpEndpoint}/media-bytes?attachmentId=${id}`);
    const bytes=await response.json();if(!response.ok)throw new Error(bytes.message||'Could not read this image.');
    const file=new File([Uint8Array.from(atob(bytes.base64),c=>c.charCodeAt(0))],filename,{type:bytes.mime});
    const data=new FormData();data.append('photo',await normalizePhoto(file),'wordpress-image.jpg');
    const source=await request<{id:string}>('/sources',data);setSource(source.id);setCatalogOpen(false);
  }
  function chooseWordPressMedia() {
    type Frame={on:(event:string,handler:()=>void)=>void;open:()=>void;state:()=>{get:(key:string)=>{first:()=>{toJSON:()=>{id:number;filename?:string}}}}};
    const media=(window as unknown as {wp?:{media?:(options:unknown)=>Frame}}).wp?.media;
    if(!media){setError('Media Library could not load. Refresh this page and try again.');return;}
    const cloud=!!state?.auth.canGenerate;
    const frame=media({title:'Choose an image from WordPress Media Library',button:{text:cloud?'Use image with Picsart':'Edit image locally'},library:{type:'image'},multiple:false});
    frame.on('select',()=>{
      const selected=frame.state().get('selection').first().toJSON();
      if(!cloud){window.location.assign(`${studioLink('images')}&attachment_id=${selected.id}`);return;}
      void run(()=>importWordPressImage(selected.id,selected.filename),'upload');
    });frame.open();
  }
  async function loadProducts(next?: string) {
    const p = await request<{ products: Product[]; nextCursor?: string }>(
      `/products${next ? `?cursor=${encodeURIComponent(next)}` : ""}`,
    );
    setProducts((v) => (next ? [...v, ...p.products] : p.products));
    setCursor(p.nextCursor);
  }
  if (!state)
    return (
      <main className="live-main">

        <SupportPanel/><h1>Picsart Commerce</h1>
        <p>{error || pollError || "Connecting to your workspace…"}</p>
        <a href={studioLink('images')}>Open local image tools</a> <a href={studioLink('video-tools')}>Work with your own video</a>
        {(error||pollError)&&<button onClick={()=>void refresh().catch(e=>setPollError(e instanceof Error?e.message:"Could not refresh the workspace."))}>Retry connection</button>}
      </main>
    );
  if(state.auth.canGenerate && window.picsartStudio.view==='images')return <><AccountBalance state={state}/><NativeImageEditor/><SupportPanel account={state.auth.subject}/></>;
  if(state.auth.canGenerate && window.picsartStudio.view==='video-tools')return <><AccountBalance state={state}/><LocalVideoTools/><SupportPanel account={state.auth.subject}/></>;
  return (
    <>
      <SupportPanel account={state.auth.subject}/>
      <AccountBalance state={state} shortfall={!!videoCreditShortfall||!!editCreditShortfall}/>
      <header className="topbar">
        <div className="brand">
          <a className="picsart-wordmark" href="https://picsart.com/commerce/" target="_blank" rel="noopener noreferrer"><PicsartLogo/></a>
          <span className="divider" />
          <strong>Commerce</strong>
        </div>
        <div className="picsart-header-account">
          <span>{state.auth.name && <span>{state.auth.name} · </span>}
          {state.credits
            ? `${state.credits.balance} credits`
            : state.auth.authenticated
              ? "Balance unavailable"
              : "Connect to view balance"}</span>
          <a className="picsart-settings-link" href="admin.php?page=picsart-settings" aria-label="Picsart settings" title="Settings" aria-current={workspaceView==='settings'?'page':undefined}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9.5 3-.5 2-2 .9-1.9-.6-2.5 4.3 1.5 1.4v2l-1.5 1.4 2.5 4.3 1.9-.6 2 .9.5 2h5l.5-2 2-.9 1.9.6 2.5-4.3-1.5-1.4v-2l1.5-1.4-2.5-4.3-1.9.6-2-.9-.5-2z"/><circle cx="12" cy="12" r="3"/></svg></a>
        </div>
      </header>
      <main className="live-main">
        {state.auth.canGenerate&&<>
        <nav className="picsart-workspace-nav" aria-label="Picsart Commerce"><a aria-current={workspaceView==='videos'?'page':undefined} href="admin.php?page=picsart-studio">Video generation</a><a aria-current={workspaceView==='images'?'page':undefined} href="admin.php?page=picsart-image-generation">Image generation</a><a aria-current={workspaceView==='history'?'page':undefined} href="admin.php?page=picsart-history">History</a></nav>
        {workspaceView!=='settings'&&<>
        <div className="action-row">{workspaceView==='images'&&<a href={studioLink('images')}>Image editor</a>}{workspaceView==='videos'&&<a href={studioLink('video-tools')}>Work with your own video</a>}<a href="https://picsart.com/pricing/" target="_blank" rel="noopener noreferrer">Manage plans and credits</a></div>
        <HelpPanels><StudioHelp/>
        <CloudPrivacy/>
        <NotificationPreferences state={state} request={request} onSaved={refresh}/>
        <WorkspaceUpdates state={state} onOpen={id=>{setShowArchived(!!state.jobs.find(job=>job.id===id)?.archivedAt);setHistorySearch('');setHistoryKind('all');setHistoryStatus('all');requestAnimationFrame(()=>{const card=document.getElementById(`job-${id}`);card?.scrollIntoView({block:'start'});card?.focus();});}}/></HelpPanels>{!!state.pendingAccountRecovery&&<p role="status" className="review-notice">{state.pendingAccountRecovery} unfinished operation(s) belong to a previously connected Picsart account. Reconnect that original account to resume checking their existing results. No replacement generation will be started automatically.</p>}
        {workspaceView==='videos'&&(showChecklist?<details className="review-notice" open><summary>Get started</summary><ol><li>{state.auth.authenticated?'Connected to Picsart':'Connect your Picsart account using the button below'}</li><li><a href="#picsart-source">{source?'Your source photo is selected — change it if needed':'Choose a product photo, Drive image or upload'}</a></li><li><a href="#picsart-video-settings">Choose a style, then review and approve the exact credit price</a></li><li><a href="admin.php?page=picsart-history">Review your result in History, download it or copy it to WordPress</a></li></ol><p>Purchases happen on Picsart.com. Connecting does not start a generation or spend credits.</p><button disabled={busy} onClick={()=>void saveChecklist(true)}>Dismiss checklist</button></details>:<button disabled={busy} onClick={()=>void saveChecklist(false)}>Show getting-started checklist</button>)}
        </>}
        </>}
        <div className="title-account-row">
          <h1>{workspaceView==='settings'?'Settings':!state.auth.canGenerate?'Connect Picsart':workspaceView==='images'?'Image generation':workspaceView==='history'?'History':'Video generation'}</h1>
            {!state.auth.canGenerate ? (
              !device && <button
                className="picsart-connect-button"
                type="button"
                aria-busy={busyAction === "connect" || busyAction === "access"}
                disabled={busy}
                onClick={() => {
                  if (state.auth.authenticated && !state.auth.requiresReconnect && (state.creditError || state.generationError)) {
                    void run(async () => {}, 'access');
                    return;
                  }
                  connectPicsart();
                }}
              >
                {busyAction === "connect"
                  ? "Preparing sign-in…"
                  : busyAction === 'access' ? 'Checking access…'
                  : state.auth.authenticated && !state.auth.requiresReconnect && (state.creditError || state.generationError) ? 'Check access again'
                  : state.auth.authenticated ? "Reconnect Picsart" : "Connect Picsart"}
              </button>
            ) : (
              <span className="picsart-connected-status"><span aria-hidden="true">✓</span> Connected</span>
            )}
        </div>
        <p>
          {state.auth.canGenerate ? 'Your Picsart account is connected. Use your Picsart credits for generation; manage subscriptions and credit purchases on Picsart.com.' : state.auth.authenticated ? 'Your account is signed in, but access needs attention. Follow the instructions below to continue.' : 'Sign in to Picsart and authorize the connection to activate your tools. This page updates automatically when you finish. Subscriptions and credit purchases are managed on Picsart.com.'}
        </p>
        {priceNotice&&Object.values(currentPriceKeys.current).includes(priceNotice.key)&&<div className="review-notice" role="status">{priceNotice.message} <button aria-label="Dismiss price information" onClick={()=>setPriceNotice(undefined)}>×</button></div>}
        {(error || pollError) && (
          <div className="live-error" role="alert">
            {error || pollError}
            <button
              onClick={() => {
                setError("");
                setPollError("");
              }}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}
          {device && (
            <DeviceSignIn
              view={device}
              request={request}
              busy={busy}
              onStatus={deviceStatus}
              onRestart={connectPicsart}
              onClose={() => closeDevice()}
              onCancel={attemptId => { closeDevice(); void run(() => request("/auth/device/cancel", {attemptId}), "cancel"); }}
            />
          )}
          {state.creditError && <p role="status">{state.creditError}</p>}
          {state.auth.loginError && <p role="alert">{state.auth.loginError}</p>}
          {state.generationError && <p role="status">{state.generationError}</p>}
        {workspaceView==='settings'&&<AccountSettings state={state} busy={busy} disconnecting={busyAction==='disconnect'} onDisconnect={()=>void run(()=>request('/auth/disconnect',{}),'disconnect')}/>}
        {state.auth.canGenerate&&workspaceView!=='settings'&&<>
        <div className="live-columns" hidden={workspaceView==='history'}>
          <div>
            <section className="live-card media-source-card">
              <h2 id="picsart-source">{workspaceView==='images'?'Create an image':'1. Choose your media'}</h2>
                  {workspaceView==='images'&&<fieldset><legend>Starting point</legend><label><input type="radio" checked={textImage} onChange={()=>setImageInputMode('text')}/> Describe an image</label><label><input type="radio" checked={!textImage} onChange={()=>setImageInputMode('photo')}/> Use a selected photo</label></fieldset>}
              {!textImage && <>
              <p>
                {window.picsartStudio.hasWooCommerce ? 'Browse your Drive, choose a WooCommerce product or WordPress media, or upload a photo.' : 'Browse your Drive, choose WordPress media, or upload a photo.'} Use images for generation or add original images and videos to WordPress.
              </p>
              <label
                className="upload-control"
                aria-disabled={busy || !state.auth.canGenerate}
              >
                <span>Upload photo</span>
                <input
                  aria-label="Upload product photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy || !state.auth.canGenerate}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      void run(async () => {
                        const data = new FormData();
                        data.append(
                          "photo",
                          await normalizePhoto(f),
                          f.name.replace(/\.[^.]+$/, "") + ".jpg",
                        );
                        const s = await request<{ id: string }>(
                          "/sources",
                          data,
                        );
                        setSource(s.id);
                      }, "upload");
                    e.target.value = "";
                  }}
                />
              </label>
              {busyAction === "upload" && (
                <p role="status">Uploading photo to Picsart Drive…</p>
              )}
              <button disabled={busy} onClick={chooseWordPressMedia}>Browse WordPress Media Library</button>
              <p className="live-muted">{state.auth.canGenerate ? 'Using an image here uploads a copy to Picsart Drive. Your WordPress original stays unchanged.' : 'Choose a WordPress image to edit locally. Connect Picsart to use it with AI tools.'}</p>
              {window.picsartStudio.hasWooCommerce && state.wordpress.connected ? (
                <>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setCatalogOpen(!catalogOpen);
                      if (!products.length)
                        void run(() => loadProducts(), "products");
                    }}
                  >
                    {busyAction === "products"
                      ? "Loading products…"
                      : catalogOpen
                        ? "Close product browser"
                        : "Browse WooCommerce products"}
                  </button>
                  {catalogOpen && (
                    <>
                      <label className="live-field">
                        Find a product
                        <input
                          type="search"
                          placeholder="Search loaded products by name or SKU"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                      </label>
                      <div className="live-products">
                        {products
                          .filter((p) =>
                            `${p.name} ${p.sku}`
                              .toLowerCase()
                              .includes(productSearch.toLowerCase()),
                          )
                          .map((p) => (
                            <button
                              className={`product-option ${state.sources.find((s) => s.id === source)?.productId === p.id ? "selected" : ""}`}
                              key={p.id}
                              disabled={busy || !p.photos.length}
                              onClick={() =>
                                run(async () => {
                                  const selected = await request<Product>(
                                    `/products/${encodeURIComponent(p.id)}/select`,
                                    {},
                                  );
                                  setSource(selected.photos[0]?.id ?? "");
                                  setCatalogOpen(false);requestAnimationFrame(()=>document.getElementById('picsart-video-settings')?.focus());
                                })
                              }
                            >
                              {p.photos[0] ? (
                                <img src={p.photos[0].url} alt="" />
                              ) : (
                                <span className="no-photo">No photo</span>
                              )}
                              <span>
                                <strong>{p.name}</strong>
                                <small>
                                  {p.sku || "No SKU"}
                                  {!p.photos.length
                                    ? " · Add a photo in WordPress first"
                                    : ""}
                                </small>
                              </span>
                            </button>
                          ))}
                      </div>
                      {busyAction === "products" && (
                        <p role="status">Loading your products…</p>
                      )}
                      {busyAction !== "products" &&
                        !products.filter((p) =>
                          `${p.name} ${p.sku}`
                            .toLowerCase()
                            .includes(productSearch.toLowerCase()),
                        ).length && (
                          <p>
                            No matching products in this page. Try another
                            search or load more products.
                          </p>
                        )}
                      {cursor && (
                        <button onClick={() => run(() => loadProducts(cursor))}>
                          Load more products
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : null}
              <button
                disabled={busy || !state.auth.authenticated}
                aria-expanded={driveOpen}
                onClick={() => {
                  setDriveOpen(!driveOpen);
                  if (!driveOpen) setCatalogOpen(false);
                }}
              >
                {driveOpen ? "Close Drive browser" : "Browse Picsart Drive"}
              </button>
              {driveOpen && <DriveBrowser key={state.auth.subject} request={request} disabled={busy} onSelect={selected => {
                setState(current => current ? {...current,sources:[...current.sources.filter(item=>item.id!==selected.id),selected]} : current);
                setSource(selected.id);setDriveOpen(false);requestAnimationFrame(()=>document.getElementById('picsart-video-settings')?.focus());
              }}/> }
              <details className="photo-library" open={!source}>
                <summary>
                  {source
                    ? "Change selected photo"
                    : `Photo library (${state.sources.length})`}
                </summary>
                <div className="live-photos">
                  {state.sources.map((p) => (
                    <button
                      key={p.id}
                      className={`live-photo ${source === p.id ? "selected" : ""}`}
                      aria-pressed={source === p.id}
                      disabled={busy}
                      onClick={() => setSource(p.id)}
                    >
                      <img src={p.url} alt={p.name} />
                      <span>{p.productName ?? p.name}</span>
                    </button>
                  ))}
                </div>
              </details>
              {source && (
                <div className="selected-source">
                  <img
                    src={originalPhoto?.url}
                    alt="Selected product photo"
                  />
                  <div>
                    <strong>
                      {originalPhoto?.productName ?? originalPhoto?.name}
                    </strong>
                    <p>{hasEditedStart ? "Original photo · edited version selected below" : "Your video will use this photo."}</p>
                  </div>
                </div>
              )}
              <small>
                Uploads are stored in Picsart Drive. Original product photos stay in WordPress; a copy is sent to Picsart when you request a generation price.
              </small>
              </>}
              {!textImage && source && <ImageToolActions subject={state.auth.subject} sourceId={selectedPhoto?.id}
                enabled={state.auth.canGenerate} busy={busy || editRunning || !!confirmingPrice}
                balance={state.credits?.balance} reserved={state.reserved} revision={quoteRevision} request={request} onGenerate={generate}/>}
              {(source || workspaceView==='images') && (
                <details className="photo-library" open={workspaceView==='images'||!!activeEditId?true:undefined}>
                  <summary>{workspaceView==='images'?'Generate an image':'Edit photo with AI (optional)'}</summary>
                  <p>{textImage ? 'Describe the image you want to create. No reference photo is needed.' : 'Describe how to transform your selected photo.'} Review the result here before saving it. It also stays in History.</p>
                  <label className="live-field">
                    Image description
                    <textarea
                      value={editPrompt}
                      maxLength={1200}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder={textImage ? "An ivory ceramic vase in warm morning light on a travertine plinth…" : "Place the product on a cream studio background. Preserve its shape, color and labels."}
                    />
                  </label>
                  <div className="edit-controls">
                  <label className="live-field">
                    Image model
                    <select
                      disabled={!editModels.length}
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                    >
                      {!editModels.length && (
                        <option value="">
                          No image models available
                        </option>
                      )}
                      {editModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    disabled={
                      busy || editRunning || !!confirmingPrice || !editPrompt.trim() || (!textImage && !originalPhoto) ||
                      (!editPricing.quote && editEstimate === undefined) ||
                      !state.auth.canGenerate ||
                      (!!state.credits &&
                        state.credits.balance - state.reserved <
                          (editPricing.quote?.total ?? 0))
                    }
                    onClick={() => void startGeneration("image")}
                  >
                    {editRunning
                      ? editStatus
                      : confirmingPrice === "image" ? "Confirming account price…"
                      : editPricing.loading
                      ? editEstimate !== undefined ? `Generate image · ~${editEstimate} credits` : "Generate image · loading price…"
                      : editPricing.quote
                        ? `Generate image · ${editPricing.quote.total} credits`
                        : editEstimate !== undefined ? `Generate image · ~${editEstimate} credits` : "Generate image"}
                  </Button>
                  </div>
                  {editRunning && (
                    <div className="edit-progress" role="status" aria-live="polite" aria-busy="true">
                      <strong>{editStatus}</strong>
                      {activeEdit?.previewUrl ? <img src={activeEdit.previewUrl} alt="Generated image preview" /> : <progress aria-label="Image generation progress" />}
                      <p>Your generated image will appear here for review.</p>
                    </div>
                  )}
                  {activeEdit && !editRunning && (
                    <section aria-label="Image editing result" aria-live="polite">
                      <ImageResult key={activeEdit.id} job={activeEdit} run={run} busy={busy}
                        selected={source === `edit-${activeEdit.id}`}
                        onUse={id=>window.location.assign(videoHandoffLink('source',id))} />
                      {imageToolFor(activeEdit.quote.model) && <ImageToolActions regenerate onlyModel={activeEdit.quote.model}
                        subject={state.auth.subject} sourceId={activeEdit.quote.source?.id} enabled={state.auth.canGenerate}
                        busy={busy || editRunning || !!confirmingPrice} balance={state.credits?.balance} reserved={state.reserved}
                        revision={quoteRevision} request={request} onGenerate={generate}/>}
                      {!imageToolFor(activeEdit.quote.model) && ["REVIEW", "ACCEPTED", "SAVED", "ATTACHED", "REJECTED"].includes(activeEdit.status) && (
                        <div className="action-row">
                          <Button disabled={busy || !!confirmingPrice || !editPrompt.trim() || !editModels.length || !editPricing.quote || !!editCreditShortfall}
                            onClick={()=>void startGeneration("image")}>{editPricing.quote ? `Regenerate image · ${editPricing.quote.total} credits` : "Regenerate image · loading price…"}</Button>
                          <p>Uses the settings above. Clicking Regenerate spends the displayed credits for a new image. This result stays in History.</p>
                        </div>
                      )}
                    </section>
                  )}
                  <small className="edit-price-note">{editQuality ? `${friendlyModel(editQuality)} quality · ` : ""}1 image{!editPricing.quote && editEstimate !== undefined ? " · Estimated price; account pricing may differ." : ""}</small>
                  {!editModels.length ? (
                    <small className="edit-price-note">
                      Photo editing will be ready when an image model is
                      available. You can still make a video from your original
                      photo.
                    </small>
                  ) : (
                    !editPrompt.trim() && (
                      <small className="edit-price-note">
                        Add instructions to confirm your account’s exact price.
                      </small>
                    )
                  )}
                  {editCreditShortfall && (
                    <div className="credit-warning" role="alert">
                      <p>
                        This edit needs {editCreditShortfall.required} credits;
                        you have {editCreditShortfall.available} available.
                      </p>
                    </div>
                  )}
                  {editPricing.error && (
                    <div role="alert">
                      <p>{editPricing.error}</p>
                      <button
                        className="secondary"
                        onClick={() => {
                          editPricing.retry();
                        }}
                      >
                        Refresh edit options
                      </button>
                    </div>
                  )}
                </details>
              )}
            </section>
            <section className="live-card video-settings" hidden={workspaceView!=='videos'}>
              <h2 id="picsart-video-settings" tabIndex={-1}>2. Set your video style</h2>
              {hasEditedStart && (
                <div className="video-start-photo">
                  <img src={state.sources.find(s => s.id === source)?.url} alt="Starting photo for your video" />
                  <div>
                    <strong>New edited photo</strong>
                    <p>This edited image will be used to start your next video.</p>
                  </div>
                </div>
              )}

              {!!(state.savedTemplates?.length||savedTemplateId)&&(<label className="live-field">Saved settings<select value={savedTemplateId} onChange={e=>{const t=state.savedTemplates?.find(t=>t.id===e.target.value);setSavedTemplateId(t?.id??'');setPromptTemplate(t?normalizeProductPrompt(t.promptTemplate):'');modelChosen.current=true;setTemplateLoop(t?.loop??false);if(t){setModel(t.model);setTemplate('hero');setDuration(t.duration);setResolution(t.resolution);setAspect(t.aspectRatio);}}}><option value="">Choose settings yourself</option>{savedTemplateId==='reused'&&<option value="reused">Reused generation settings</option>}{state.savedTemplates?.map(t=><option key={t.id} value={t.id} disabled={!models.some(m=>m.id===t.model)}>{t.name}{!models.some(m=>m.id===t.model)?" — model unavailable":""}</option>)}</select></label>)}
              {savedTemplateId&&<div className="review-notice"><label className="live-field">Saved prompt<textarea maxLength={6000} value={promptTemplate} onChange={e=>setPromptTemplate(e.target.value)}/><span>Keep {'{{product_info}}'} to insert the selected product details. Review product-specific wording before generating.</span></label><label><input type="checkbox" checked={templateLoop} onChange={e=>setTemplateLoop(e.target.checked)}/> Return to the starting frame where supported</label></div>}
              <label className="live-field">
                Video style
                <select
                  value={template}
                  onChange={(e) => {setTemplate(e.target.value);setSavedTemplateId("");setPromptTemplate("");setTemplateLoop(false);}}
                >
                  {state.templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  <option value="custom">Custom style</option>
                </select>
              </label>
              <p className="style-description">
                {template === "custom"
                  ? "Describe your camera movement, atmosphere and lighting."
                  : state.templates.find((t) => t.id === template)?.prompt.split("\n\n")[0]}
              </p>
              {template === "custom" && (
                <label className="live-field">
                  Your creative direction
                  <textarea
                    rows={5}
                    minLength={10}
                    maxLength={1200}
                    value={customPrompt}
                    placeholder="For example: a slow push toward the product with soft evening light and a calm, minimal background."
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    aria-describedby="custom-style-help"
                  />
                  <small id="custom-style-help">
                    {customPrompt.trim().length}/1,200 characters · At least 10.
                    The prompt asks the model to preserve product details.
                    Review the result for changes.
                  </small>
                </label>
              )}
              <div className="video-controls">
              <label className="live-field">
                Video model
                <select
                  value={model}
                  onChange={(e) => {modelChosen.current=true;setModel(e.target.value);}}
                  disabled={!models.length}
                >
                  {!models.length && (
                    <option>
                      {state.auth.canGenerate
                        ? "Loading available models…"
                        : "Connect Picsart to load models"}
                    </option>
                  )}
                  {models.map((m) => (
                    <option value={m.id} key={m.id}>
                      {friendlyModel(m.name)}
                    </option>
                  ))}
                </select>
              </label>
              {state.auth.authenticated && models.some(m=>m.id===model) && <div className="model-preference">
                {modelSync.syncing&&<p role="status">Updating available models…</p>}
                <p>Default: {friendlyModel(models.find(m=>m.id===resolveDefault(modelSync.defaultModel,modelPolicy.defaultVideoModel,models.map(m=>m.id)))?.name??modelPolicy.defaultVideoModel)}</p>
                {model!==resolveDefault(modelSync.defaultModel,modelPolicy.defaultVideoModel,models.map(m=>m.id))&&<button className="secondary" disabled={busy||modelSync.syncing} onClick={()=>void run(()=>modelSync.saveDefault(model),"model-default")}>Make {friendlyModel(models.find(m=>m.id===model)?.name??model)} my default</button>}
                {modelSync.defaultModel&&modelSync.defaultModel!==modelPolicy.defaultVideoModel&&<button className="secondary" disabled={busy||modelSync.syncing} onClick={()=>void run(()=>modelSync.saveDefault(null),"model-default")}>Reset default to Seedance 2.5</button>}
                {modelSync.defaultModel&&!models.some(m=>m.id===modelSync.defaultModel)&&<p>Your saved model is unavailable. An available model is selected instead.</p>}
                {modelSync.error&&<p role="status">{modelSync.error}</p>}
              </div>}
              <div className="live-row">
                <label className="live-field">
                  Duration
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {allowedDurations
                      .filter((v) => Number(v) > 0 && Number(v) <= 15)
                      .map((v) => (
                        <option key={String(v)} value={String(v)}>
                          {String(v)} seconds
                        </option>
                      ))}
                  </select>
                </label>
                <label className="live-field">
                  Resolution
                  <select
                    value={resolution}
                    disabled={resolutions.length <= 1}
                    onChange={(e) => setResolution(e.target.value)}
                  >
                    {resolutions
                      .map((v) => (
                        <option key={v} value={v}>{v || "Automatic (model controlled)"}</option>
                      ))}
                  </select>
                </label>
                <label className="live-field">
                  Aspect ratio
                  <select
                    disabled={aspects.length <= 1}
                    value={aspectRatio}
                    onChange={(e) => setAspect(e.target.value)}
                  >
                    {aspects
                      .map((v) => (
                        <option key={v} value={v}>{!v ? "Follows source photo" : v === "adaptive" || v === "auto" ? `${v} (model controlled)` : v}</option>
                      ))}
                  </select>
                </label>
              </div>
              </div>
              <div className="generation-panel">
              <Button
                className="generate-button"
                disabled={
                  busy || videoRunning || editRunning ||
                  (!quote && videoEstimate === undefined) || !!confirmingPrice ||
                  (!!quote && Date.now() >= quote.expiresAt) || !canPrice ||
                  !state.auth.canGenerate ||
                  (!!state.credits &&
                    state.credits.balance - state.reserved < (quote?.total ?? Number(videoEstimate?.split("–").at(-1))))
                }
                onClick={() => {
                  setError("");
                  void startGeneration("video");
                }}
              >
                {videoRunning ? videoStatus
                  : editRunning ? "Waiting for edited photo…"
                  : !state.auth.canGenerate ? state.auth.authenticated ? "Generation access unavailable" : "Connect Picsart to generate"
                  : !source ? "Select a photo to generate"
                  : template === "custom" && customPrompt.trim().length < 10
                    ? videoEstimate !== undefined ? `Generate · ~${videoEstimate} credits` : `Add ${10 - customPrompt.trim().length} more characters`
                  : !model || schema?.model !== model && !cached(inputKey) ? "Loading model settings…"
                  : confirmingPrice === "video" ? "Confirming account price…"
                  : busy ? "Updating workspace…"
                  : pricing.error ? videoEstimate !== undefined ? `Generate · ~${videoEstimate} credits` : "Account price unavailable"
                  : pricing.loading || !quote || Date.now() >= quote.expiresAt
                    ? videoEstimate !== undefined ? `Generate · ~${videoEstimate} credits` : "Checking price…"
                  : videoCreditShortfall ? "Not enough credits"
                  : `Generate · ${quote.total} credits`}
              </Button>
              {videoEstimate !== undefined && !quote && <p className="live-muted" data-testid="video-estimate">Estimated price: {videoEstimate} credits. Final account price is confirmed before generation.</p>}
              <p className="live-muted" aria-live="polite">
                {editRunning ? "Review and accept the edited photo below before using it for a video." : videoRunning ? "Follow progress and review your video in History." : !state.auth.canGenerate
                  ? state.auth.authenticated ? "Your account is signed in. Generation remains unavailable until credit access is enabled." : "Connect Picsart to see your live credit price and generate."
                  : !source
                    ? "Select a photo to see the live credit price."
                    : template === "custom" && customPrompt.trim().length < 10
                      ? "Add at least 10 characters for your custom style."
                      : pricing.loading
                        ? videoEstimate !== undefined ? "Estimated price; the account price is confirmed when you click Generate." : "Checking the current price for your selection."
                        : quote
                          ? "Clicking Generate spends the displayed credits for one video."
                          : ""}
              </p>
              {activeVideo && <p><a href={historyLink(activeVideo.id)}>Open video in History</a></p>}
              {activeVideo && !videoRunning && <p role="status">{["REVIEW", "ACCEPTED"].includes(activeVideo.status) ? "Your video is ready in History." : statusLabel(activeVideo.status)}</p>}
              {videoCreditShortfall && (
                <div className="credit-warning" role="alert">
                  <p>
                    This video needs {videoCreditShortfall.required} credits;
                    you have {videoCreditShortfall.available} available.
                  </p>
                </div>
              )}
              {pricing.error && (
                <div role="alert">
                  <p>{pricing.error}</p>
                  <button className="secondary" onClick={pricing.retry}>
                    Retry price check
                  </button>
                </div>
              )}
              </div>
            </section>
            {state.setup.length > 0 && (
              <details className="live-card">
                <summary>WordPress connection setup</summary>
                {state.setup.map((t) => (
                  <p key={t}>{t}</p>
                ))}
                <p>
                  Photo uploads and downloads work without a WordPress installation.
                </p>
              </details>
            )}
          </div>
        </div>
        {workspaceView==='history'&&<section>
          <h2 id="picsart-history">{workspaceView==='history'?'All generations':workspaceView==='images'?'Your images':'Your videos'}</h2><div className="action-row"><label><input type="checkbox" checked={showArchived} onChange={e=>setShowArchived(e.target.checked)}/> Show archived generations</label><button disabled={busy} onClick={()=>void run(async()=>{const data=await request('/history/export');const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='picsart-history.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'history-export')}>Export history JSON</button></div>
          {showArchived&&<div className="review-notice"><p>Move archived, finished jobs out of this workspace to make room for new generations. Their records remain in the history export; media in Picsart Drive and WordPress stays available.</p><button disabled={busy||!state.jobs.some(j=>j.archivedAt&&j.reservation===0&&['ACCEPTED','REJECTED','SAVED','ATTACHED','STOPPED'].includes(j.status))} onClick={()=>void run(()=>request('/history/prune',{jobIds:state.jobs.filter(j=>j.archivedAt&&j.reservation===0&&['ACCEPTED','REJECTED','SAVED','ATTACHED','STOPPED'].includes(j.status)).map(j=>j.id)}),'history-prune')}>Move finished archives out of workspace</button></div>}
          <div className="action-row"><label>Search history <input type="search" value={historySearch} onChange={e=>setHistorySearch(e.target.value)}/></label><div className="media-type-filters" role="group" aria-label="Media type">{([["image","Images"],["video","Videos"]] as const).map(([kind,label])=><button type="button" key={kind} aria-pressed={historyKind===kind} onClick={()=>setHistoryKind(historyKind===kind?"all":kind)}>{label}</button>)}</div><label>Status <select value={historyStatus} onChange={e=>setHistoryStatus(e.target.value)}><option value="all">All statuses</option><option value="ready">Ready</option><option value="working">In progress</option><option value="attention">Needs attention</option></select></label><button onClick={()=>{setHistorySearch('');setHistoryKind('all');setHistoryStatus('all');}}>Clear filters</button></div>
          {!!state.jobs.length&&!historyWithActive(state.jobs,historySearch,historyKind,historyStatus,showArchived).length&&<p>No generations match this view. Clear filters or switch the archive view to see other results.</p>}
          {state.jobs.length ? (
            historyWithActive(state.jobs,historySearch,historyKind,historyStatus,showArchived).filter(j=>workspaceView==='history'||(workspaceView==='images'?j.quote.kind==='image':j.quote.kind!=='image')).map((j) =>
              <div key={j.id}>{['REVIEW','ACCEPTED','REJECTED','SAVED','ATTACHED','STOPPED'].includes(j.status)&&j.reservation===0&&<button disabled={busy} onClick={()=>void run(()=>request(`/jobs/${j.id}/archive`,{archived:!j.archivedAt}),'archive')}>{j.archivedAt?'Restore to history':'Archive from history'}</button>}{j.quote.kind === "image" ? (
                <ImageResult
                  key={j.id}
                  job={j}
                  run={run}
                  busy={busy}
                  selected={source === `edit-${j.id}`}
                  onUse={id=>window.location.assign(videoHandoffLink('source',id))}
                />
              ) : (
                <Result key={j.id} job={j} run={run} busy={busy} onReuse={(job,changeMedia=false)=>{window.location.assign(videoHandoffLink('reuse',job.id,changeMedia));}} />
              )}</div>,
            )
          ) : (
            <div className="live-card">
              <p>Your generations will appear here, ready for review.</p>
            </div>
          )}
        </section>}
        </>}
      </main>

    </>
  );
}
