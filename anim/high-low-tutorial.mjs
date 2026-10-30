import {mountHighLowReveal} from './high-low-reveal.mjs';

// Deliberately simple hypothetical values: the same answer throughout the lesson.
export const HIGH_LOW_EXAMPLES = {
  safe: {high:12,low:8,passed:true},
  under: {high:9,low:8,passed:false},
  over: {high:12,low:11,passed:false},
  wide: {high:20,low:5,passed:false},
};

export function mountHighLowTutorial(container,example) {
  const picks=HIGH_LOW_EXAMPLES[example];
  let destroyed=false,timer=null,scene;
  const data={currentQuestion:{answer:10,prompt:'Example: the correct answer is 10'},
    hlLast:{...picks,limit:2.5},hlRoles:{bird:'high',shark:'low'},
    players:{bird:{name:'HIGH'},shark:{name:'LOW'}},revealIndex:0};
  scene=mountHighLowReveal(container,data,{
    onSettled:index=>{
      if(destroyed||index>=2)return;
      timer=setTimeout(()=>{if(!destroyed){data.revealIndex=index+1;scene.update(data);}},350);
    },
  });
  scene.root.querySelector('.vg-caption>span').textContent='EXAMPLE · LIMIT 2.5×';
  return ()=>{destroyed=true;clearTimeout(timer);scene.destroy();};
}
