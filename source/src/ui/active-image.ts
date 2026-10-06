import type {Job} from '../../shared/types';
export function recoverActiveImage(jobs:Job[],subject:string|undefined,savedId?:string|null,allowLatest=true){
 if(!subject)return undefined;
 // /state and /tick already filter by account and omit the subject from public jobs.
 const images=jobs.filter(job=>(!job.subject||job.subject===subject)&&job.quote.kind==='image'&&!job.archivedAt);
 return images.find(job=>job.id===savedId) ?? (allowLatest ? images.filter(job=>job.status==='REVIEW').sort((a,b)=>b.approvedAt-a.approvedAt)[0] : undefined);
}
export function imageIsRunning(job?:Job){
 return !!job&&['QUEUED','SUBMITTING','GENERATING','PERSISTING'].includes(job.status);
}
