// Approved bottle artwork; runtime values are supplied by the room.
export const oceanTemplate = `  <main class="rs-main">
   <div class="rs-question"></div>
   <div class="rs-player rs-high" data-revealed="false"><div class="rs-player-content"><span class="rs-avatar" aria-hidden="true"></span><span class="rs-name"><small class="rs-role high-role">▲ HIGH</small></span><span class="rs-pick">said <b data-high-pick>2.84</b><small data-high-off>60% higher</small></span><span class="rs-check" data-high-check>✓</span></div><span class="rs-wait">HIGH pick · not revealed yet</span></div>
   <div class="rs-middle">
     <div class="oc-stage" role="img" aria-label="The message bottle marks the correct answer at sea level">
  <div class="oc-cloud one"></div><div class="oc-cloud two"></div>
  <div class="oc-water"></div><span class="oc-zone above">ABOVE THE ANSWER</span><span class="oc-zone below">BELOW THE ANSWER</span>
  <div class="oc-guide bird-guide"></div><div class="oc-guide shark-guide"></div>
  <div class="oc-animal oc-bird"><div class="oc-art"><img class="normal" src="anim/high-low-art/bird.webp" alt="Flying golden bird"><img class="reaction" src="anim/high-low-art/wet-bird-v3.webp" alt="Startled soaking wet bird"><img class="cheer" src="anim/high-low-art/bird-cheer-v9.webp" alt="Happy celebrating bird"><img class="defeat" src="anim/high-low-art/bird-defeat-v12.webp" alt="Disappointed bird after losing the round"></div><div class="oc-badge high"><b data-high>2.84</b></div></div>
  <div class="oc-animal oc-shark"><div class="oc-art"><img class="normal" src="anim/high-low-art/shark.webp" alt="Swimming blue shark"><img class="reaction" src="anim/high-low-art/scared.webp" alt="Scared shark out of the water"><img class="cheer" src="anim/high-low-art/shark-cheer-v9.webp" alt="Happy celebrating shark"><img class="defeat" src="anim/high-low-art/shark-defeat-v12.webp" alt="Disappointed shark after losing the round"></div><div class="oc-badge low"><b data-low>1</b></div></div>
  <div class="oc-water-veil"></div><div class="oc-surface"></div>
  <div class="oc-boat"><div class="oc-boat-float"><img src="anim/high-low-art/answer-bottle-v11.webp" alt="Message bottle with the answer on the paper inside"><div class="oc-sail-answer"><b>1.78</b></div></div></div>
  <div class="oc-splash bird-splash" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><div class="oc-splash shark-splash" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
  <i class="oc-bubble a"></i><i class="oc-bubble b"></i><i class="oc-bubble c"></i>
 <div class="rs-gap vg-overlay" data-ready="false" role="group" aria-label="Gap between your picks">
 <div class="vg-caption"><span>WATERLINE ZONE</span><strong data-ratio>—</strong><small data-gap-status>Both picks needed</small></div>
 <div class="cw-meter" role="meter" aria-label="Green gap zone around the answer, with HIGH and LOW guess markers" aria-valuemin="1" aria-valuemax="4" aria-valuenow="1">
 <div class="cw-track"><span class="cw-green"></span></div>
 <span class="cw-waterline" aria-hidden="true"></span>
 <span class="cw-high"><b>H</b></span><span class="cw-low"><b>L</b></span>
<span class="cw-number-high" aria-label="HIGH guess on the meter"><b data-meter-high>2.84</b></span>
<span class="cw-number-low" aria-label="LOW guess on the meter"><b data-meter-low>1</b></span>
<i class="cw-label-link cw-link-high" aria-hidden="true"></i><i class="cw-label-link cw-link-low" aria-hidden="true"></i>
</div>
</div>

</div>
   </div>
   <div class="rs-player rs-low" data-revealed="false"><div class="rs-player-content"><span class="rs-avatar" aria-hidden="true"></span><span class="rs-name"><small class="rs-role low-role">▼ LOW</small></span><span class="rs-pick">said <b data-low-pick>1</b><small data-low-off>44% lower</small></span><span class="rs-check" data-low-check>✓</span></div><span class="rs-wait">LOW pick · not revealed yet</span></div>
   <div class="rs-verdict" aria-live="polite" data-verdict>The message bottle brings the correct answer.</div>
  </main>`;
