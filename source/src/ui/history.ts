import type {Job} from '../../shared/types';
const ready=new Set(['REVIEW','ACCEPTED','SAVED','ATTACHED']);
const working=new Set(['QUEUED','SUBMITTING','GENERATING','PERSISTING','IMPORTING','ATTACHING']);
export function filterHistory(jobs:Job[],search:string,kind:string,status:string){
 const query=search.trim().toLocaleLowerCase();
 return jobs.filter(job=>(kind==='all'||(job.quote.kind??'video')===kind)&&(status==='all'||(status==='ready'?ready.has(job.status):status==='working'?working.has(job.status):!ready.has(job.status)&&!working.has(job.status)))&&(!query||[job.id,job.quote.source?.name,job.quote.source?.productName,job.quote.template.name,job.quote.model].filter(Boolean).join(' ').toLocaleLowerCase().includes(query)));
}

export function historyWithActive(jobs:Job[],search:string,kind:string,status:string,archived:boolean){const active=jobs.filter(j=>working.has(j.status));const ids=new Set(active.map(j=>j.id));return [...active,...filterHistory(jobs.filter(j=>(archived?!!j.archivedAt:!j.archivedAt)&&!ids.has(j.id)),search,kind,status)];}
