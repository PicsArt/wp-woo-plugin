import React from 'react';
import type {Quote} from '../../shared/types';
import {imageTools} from '../../shared/image-tools';
import {useLiveQuote} from './hooks/useLiveQuote';

type Props={onlyModel?:string;regenerate?:boolean;subject?:string;sourceId?:string;enabled:boolean;busy:boolean;balance?:number;reserved:number;revision:number;request:<T>(path:string,body:unknown,signal?:AbortSignal)=>Promise<T>;onGenerate:(quote:Quote)=>Promise<void>};
function ToolAction({tool,...props}:Props & {tool:typeof imageTools[number]}) {
 const input={sourceId:props.sourceId,model:tool.model,prompt:tool.description};
 const key=props.enabled&&props.subject&&props.sourceId?JSON.stringify([props.subject,input]):null;
 const pricing=useLiveQuote(key,signal=>props.request<Quote>('/image-quotes',input,signal),props.revision,250);
 const quote=pricing.quote;
 const insufficient=quote!==undefined&&props.balance!==undefined&&props.balance-props.reserved<quote.total;
 return <div>
  <button type="button" disabled={props.busy||!quote||!key||insufficient} onClick={()=>{if(quote)void props.onGenerate(quote);}}>
   {props.regenerate?`Regenerate ${tool.name.toLowerCase()}`:tool.name} · {quote?`${quote.total} credits`:pricing.error?'price unavailable':props.sourceId?'checking credits…':'choose a photo'}
  </button>
  {insufficient&&<small>Not enough credits. Top up your Picsart balance.</small>}
  {pricing.error&&<p role="status">{pricing.error} <button type="button" disabled={props.busy} onClick={pricing.retry}>Retry price</button></p>}
 </div>;
}
export function ImageToolActions(props:Props) {
 return <section aria-label="Picsart image tools">
  {!props.regenerate&&<h3>Picsart image tools</h3>}
  <div className="action-row">{imageTools.filter(tool=>!props.onlyModel||tool.model===props.onlyModel).map(tool=><ToolAction key={tool.model} {...props} tool={tool}/>)}</div>
  <small>Clicking a tool spends the displayed credits. Review the result below before accepting it; your original stays unchanged.</small>
 </section>;
}
