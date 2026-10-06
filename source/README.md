# Rebuilding the browser assets

Use Node.js 24 and npm. From this source directory run `npm ci --ignore-scripts` followed by `npm run build`. The build writes `plugin/picsart-product-videos/assets/`; copy the generated studio.js, studio.css, gif-encoder.worker.js and any .LEGAL.txt files into the installed plugin assets directory. The build uses WordPress wp.element; it does not bundle React. The included gifenc source is MIT licensed. The companion cloud service is separately hosted and is not executed by this browser build. No service credentials are included.
