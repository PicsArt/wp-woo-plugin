import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('plugin/picsart-product-videos/assets',{recursive:true});
// Use WordPress's registered React instead of distributing another copy (guideline 13).
const wordpressReact={name:'wordpress-react',setup(builder){
 builder.onResolve({filter:/^(react|react-dom\/client)$/},args=>({path:args.path,namespace:'wordpress'}));
 builder.onLoad({filter:/.*/,namespace:'wordpress'},()=>({contents:`const e=window.wp.element; export default e; export const {createElement,Fragment,createRoot,useState,useEffect,useRef,useMemo,useCallback,useReducer,useLayoutEffect,useContext,createContext,memo,forwardRef}=e;`,loader:'js'}));
}};
await build({entryPoints:['src/ui/main.tsx'],bundle:true,minify:true,legalComments:'external',sourcemap:false,format:'iife',target:['es2022'],tsconfigRaw:{compilerOptions:{jsx:'react'}},jsx:'transform',jsxFactory:'wp.element.createElement',jsxFragment:'wp.element.Fragment',plugins:[wordpressReact],outfile:'plugin/picsart-product-videos/assets/studio.js',define:{'process.env.NODE_ENV':'"production"'}});

await build({entryPoints:['src/ui/gif-encoder.worker.ts'],bundle:true,minify:true,format:'iife',target:['es2022'],outfile:'plugin/picsart-product-videos/assets/gif-encoder.worker.js'});

const cssPath='plugin/picsart-product-videos/assets/studio.css';
let css=await readFile(cssPath,'utf8');
// CSS @scope prevents all original selectors from leaking into WordPress admin.
css='@scope (#picsart-studio) {'+css.replaceAll(':root',':scope').replace(/body\s*\{/g,':scope{')+'}\n#picsart-studio{font-family:system-ui,sans-serif;font-size:14px;color:#162d3d;}';
await writeFile(cssPath,css);
await writeFile(cssPath,'\n#picsart-studio select{background-image:none;appearance:auto;}\n#picsart-studio .topbar{top:32px;}\n@media(max-width:782px){#picsart-studio .topbar{top:46px;}}\n',{flag:'a'});
