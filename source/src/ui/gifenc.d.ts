declare module 'gifenc/dist/gifenc.esm.js' {
 export function GIFEncoder(): {bytesView():Uint8Array;writeFrame(pixels:Uint8Array,width:number,height:number,options:Record<string,unknown>):void;finish():void;bytes():Uint8Array};
 export function quantize(pixels:Uint8Array|Uint8ClampedArray,maxColors:number,options?:Record<string,unknown>):number[][];
 export function applyPalette(pixels:Uint8Array|Uint8ClampedArray,palette:number[][],format?:string):Uint8Array;
}
