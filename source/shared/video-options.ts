export function displayResolution(value: unknown) {
  const normalized = String(value).toLowerCase();
  return normalized === 'hd' ? '720p' : normalized === 'fhd' ? '1080p' : normalized;
}

export function closestAspectRatio(width: number, height: number, values: unknown[] = ['9:16', '16:9', '1:1']) {
  if (!(width > 0 && height > 0)) return undefined;
  const ratios = values.map(String).filter(v => /^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(v));
  const distance = (value: string) => {
    const [w, h] = value.split(':').map(Number);
    return Math.abs(Math.log((w / h) / (width / height)));
  };
  return ratios.sort((a, b) => distance(a) - distance(b))[0];
}

export interface VideoVariant {resolution:string;aspectRatio:string;durations:number[]}
export function selectVideoVariant(rows:VideoVariant[],current:{duration:number;resolution:string;aspectRatio:string}) {
 const resolutions=[...new Set(rows.map(r=>r.resolution))];
 const resolution=resolutions.includes(current.resolution)?current.resolution:resolutions[0]??'';
 const atResolution=rows.filter(r=>r.resolution===resolution);
 const aspects=[...new Set(atResolution.map(r=>r.aspectRatio))];
 const aspectRatio=aspects.includes(current.aspectRatio)?current.aspectRatio:aspects[0]??'';
 const durations=atResolution.find(r=>r.aspectRatio===aspectRatio)?.durations??[];
 const duration=durations.includes(current.duration)?current.duration:durations[0]??0;
 return {resolution,aspectRatio,duration,resolutions,aspects,durations};
}
