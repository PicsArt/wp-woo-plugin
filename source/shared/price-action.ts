/** A newly fetched price is presentation, never authorization from an earlier estimated-price click. */
export async function priceAction<T>(displayed:T|undefined,fetchExact:()=>Promise<T>,showExact:(quote:T)=>void,approve:(quote:T)=>Promise<void>,stillCurrent:()=>boolean=()=>true){
 if(displayed){await approve(displayed);return 'approved';}
 const quote=await fetchExact();if(!stillCurrent())return 'changed';showExact(quote);return 'quoted';
}
