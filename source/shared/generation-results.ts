import type {Job} from './types';

/** Generation pages retain this session's versions; History owns global filters. */
export function visibleGenerationJobs(jobs:Job[], options:{
  view:string;sessionIds:readonly string[];showArchived:boolean;kind:string;search:string;
}):Job[]{
  const history=options.view==='history';
  const ids=new Set(options.sessionIds);
  return jobs.filter(job=>{
    const kind=job.quote.kind??'video';
    if(!history)return ids.has(job.id)&&!job.archivedAt&&kind===(options.view==='images'?'image':'video');
    return (options.showArchived||!job.archivedAt)&&
      (options.kind==='all'||kind===options.kind)&&
      `${job.quote.source?.name??job.quote.template.prompt} ${job.quote.source?.productName??''}`.toLowerCase().includes(options.search.toLowerCase());
  }).sort((a,b)=>b.approvedAt-a.approvedAt);
}
