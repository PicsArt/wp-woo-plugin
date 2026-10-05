export function httpsLink(value:string){const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)throw Error('Use a public HTTPS link.');return url.href;}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function bannerHtml(input:{heading:string;destination:string;image:string;alt:string;video?:boolean}){
 const destination=escape(httpsLink(input.destination)),image=escape(httpsLink(input.image));
 if(input.heading.length>120||input.alt.length>300)throw Error('Shorten the heading or image description.');
 return `<!doctype html><html><head><meta charset="utf-8"><title>${escape(input.heading)}</title></head><body><table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="600" style="width:100%;max-width:600px"><tr><td><h1>${escape(input.heading)}</h1><a href="${destination}"><img src="${image}" alt="${escape(input.alt)}" width="600" style="width:100%;height:auto;display:block;border:0"></a><p><a href="${destination}">${input.video?'Watch video':'Learn more'}</a></p></td></tr></table></td></tr></table></body></html>`;
}
function icsText(s:string){return s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,c=>'\\'+c);}
export function calendarReminder(input:{id:string;title:string;at:string;link:string},now=Date.now()){
 const date=new Date(input.at);if(!Number.isFinite(date.getTime())||date.getTime()<=now)throw Error('Choose a future date and time.');
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(input.id)||!input.title.trim()||input.title.length>120)throw Error('Add a title up to 120 characters.');
 const stamp=(d:Date)=>d.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');const url=httpsLink(input.link);
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Picsart//Commerce//EN','BEGIN:VEVENT',`UID:${input.id}@picsart-commerce`,`DTSTAMP:${stamp(new Date(now))}`,`DTSTART:${stamp(date)}`,`SUMMARY:${icsText(input.title)}`,`DESCRIPTION:${icsText('Review and publish manually. '+url)}`,`URL:${url}`,'END:VEVENT','END:VCALENDAR',''].map(line=>{let lines=[''],bytes=0;for(const c of line){const n=new TextEncoder().encode(c).length;if(bytes+n>73){lines.push(' ');bytes=1;}lines[lines.length-1]+=c;bytes+=n;}return lines.join('\r\n');}).join('\r\n');
}
