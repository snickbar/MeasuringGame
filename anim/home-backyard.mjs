import {installMovingHomeTaps} from './home-moving-taps.mjs';
export function installBackyardBugs(root,home,onTap){
  return installMovingHomeTaps(root,home,onTap,[
    {selector:'.hs-route[data-critter-index="0"]',subject:'bee',label:'Make the bee flutter',bounds:[319/1402,185/1122,889/1402,747/1122],bug:true},
    {selector:'.hs-route[data-critter-index="1"]',subject:'butterfly',label:'Make the butterfly flutter',bounds:[52/1313,55/1198,1217/1313,1065/1198],bug:true},
  ]);
}
