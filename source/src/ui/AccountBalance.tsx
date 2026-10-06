import {useEffect} from 'react';
import type {State} from '../../shared/types';
import {packageUsageThreshold} from './credits';
const topUp='https://picsart.com/pricing/';
export function AccountBalance({state,shortfall=false}:{state:State;shortfall?:boolean}){
 const credits=state.auth.authenticated?state.credits:null;
 const available=credits?Math.max(0,credits.balance-state.reserved):null;
 const threshold=packageUsageThreshold(credits?.packageUsage);
 const low=available!==null&&(available===0||shortfall||threshold===90);
 useEffect(()=>{
  const node=document.getElementById('wp-admin-bar-picsart-account');
  if(!node)return;
  node.hidden=!state.auth.authenticated;
  const link=node.querySelector('a');if(!link)return;
  link.textContent=credits?`Picsart · ${credits.balance.toLocaleString()} credits${low?' · Top up':''}`:'Picsart · Balance unavailable';
  link.setAttribute('href',topUp);link.setAttribute('target','_blank');link.setAttribute('rel','noopener noreferrer');
  link.setAttribute('aria-label',credits?`Picsart balance: ${credits.balance.toLocaleString()} credits. ${low?'Top up':'Manage credits'} on Picsart.com`:'Picsart balance unavailable. Manage your account on Picsart.com');
  return()=>{node.hidden=true;};
 },[state.auth.authenticated,credits?.balance,low]);
 if(!credits)return null;
 return <div className="picsart-credit-status" role="status">
  {threshold&&<p>You’ve used at least {threshold}% of your package credits.</p>}
  {low&&<p>{available===0?'No credits available for a new generation.':shortfall?'Your available balance is below the price of this generation.':'Your package credits are running low.'} <a href={topUp} target="_blank" rel="noopener noreferrer">Top up on Picsart.com</a></p>}
 </div>;
}
