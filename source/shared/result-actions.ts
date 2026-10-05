export const initialActions=['publish','share','download'];
export const actionIds=[...initialActions,'media','music','gif'];
export function visibleActions(recent:string[]) { return [...new Set([...recent.filter(id=>actionIds.includes(id)),...initialActions])]; }
export function promoteAction(recent:string[],id:string) {return actionIds.includes(id)?[id,...recent.filter(x=>x!==id&&actionIds.includes(x))]:recent;}
