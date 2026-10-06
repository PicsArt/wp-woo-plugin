/** Dedicated OAuth utility models; not prompt-based generation choices. */
export const imageTools = [
 {model:'picsart-sod-v8-2',name:'Remove background',description:'Remove the background from the selected image.'},
 {model:'picsart-enhance',name:'Enhance',description:'Enhance and upscale the selected image.'},
] as const;
export const imageToolFor=(model:string)=>imageTools.find(tool=>tool.model===model);
