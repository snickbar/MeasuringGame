// Cancel sounds rather than suspending their timeline and replaying them later.
export function createAudioLifecycle({visible,scope,enabled,stopMedia}) {
 const sources=new Set(),contexts=new Set();let epoch=0,route=scope(),audible=visible()&&enabled(),permitted=true;
 function stop(){for(const node of sources){try{node.stop(0);}catch{}}sources.clear();stopMedia();}
 function sync(){const next=scope(),on=visible()&&enabled();if(next!==route||on!==audible){epoch++;route=next;audible=on;stop();if(!on)for(const ctx of contexts)try{ctx.suspend()?.catch(()=>{});}catch{}}return audible&&permitted;}
 function ticket(){return {epoch:(sync(),epoch),allowed:audible&&permitted};}
 function valid(t){return sync()&&t.allowed&&t.epoch===epoch;}
 return {
  sync,canPlay:sync,
  stop(){epoch++;stop();},
  context(ctx){contexts.add(ctx);return ctx;},
  source(node){sources.add(node);node.addEventListener?.('ended',()=>sources.delete(node),{once:true});return node;},
  guard(fn){const t=ticket();return function(...args){if(valid(t))return fn.apply(this,args);};},
  // Scheduled UI/game work still runs after navigation; only its old audio is suppressed.
  scoped(fn){if(typeof fn!=='function')return fn;const t=ticket();return function(...args){const previous=permitted;permitted=valid(t);try{return fn.apply(this,args);}finally{permitted=previous;}};}
 };
}
