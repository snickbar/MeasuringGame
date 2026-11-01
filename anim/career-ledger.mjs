import {threeStarTeamFinishes} from './mode-awards.mjs';
import {roundCareerProfile} from './opponent-xp.mjs';
import {roundAccuracy} from './accuracy.mjs';
import {recordDiscoveries} from './discoveries.mjs';
import {isRetiredMonthlyRecord} from './monthly-challenge.mjs';

export const MODE_NAMES = {party:'Party',quick:'Quick Game',daily:'Daily',worlds:'Worlds',monthly:'Monthly',survival:'Survival',teamvteam:'Team vs Team',teamworlds:'Team Worlds',hlsurvival:'High/Low Survival',highstakes:'High Stakes',bluff:'Bluff',whichbigger:'Which Is Bigger'};
export const MODE_CODE = {party:0,quick:1,daily:2,worlds:3,monthly:4,survival:5,teamvteam:6,teamworlds:7,hlsurvival:8,highstakes:9,bluff:10,whichbigger:11};
export const safeKey = value => String(value).replace(/[.#$\[\]/]/g,'_');
const list = value => Array.isArray(value)?value:Object.values(value||{});
// Seed older profiles from the history still available; then keep totals even
// after the rolling history evicts a round. A replayed receipt never increments.
export function objectFrequency(profile, mode='all'){
  const saved=profile.objectFrequency;
  if(saved?.version===1)return {...(mode==='all'?saved.all:saved.modes?.[mode])};
  const counts={};
  for(const h of list(profile.history)){
    if(mode!=='all'&&(h.mode||Object.keys(MODE_CODE).find(m=>MODE_CODE[m]===h.s))!==mode)continue;
    for(const id of new Set([h.u,h.g].filter(Boolean)))counts[id]=(counts[id]||0)+1;
  }
  return counts;
}
function recordObjectFrequency(profile,h,mode){
  const all=objectFrequency(profile),modes={};
  for(const name of Object.keys(MODE_CODE))modes[name]=objectFrequency(profile,name);
  modes[mode]={...(modes[mode]||{})};
  for(const id of new Set([h?.u,h?.g].filter(Boolean))){all[id]=(all[id]||0)+1;modes[mode][id]=(modes[mode][id]||0)+1;}
  return {version:1,all,modes};
}
// Every entry ever recorded, newest first by actual timestamp - never evicted. Works for
// date-keyed maps (daily/monthly, where key order and t order happen to agree) and for
// per-game-keyed maps (teamHistory, where keys aren't chronological) alike. Keeps every field
// each record carries (not just s/t) - teamHistory/teamWorldsHistory rows also carry
// partnerName/myAvatar/partnerAvatar/accuracy for the info screens' best-list cards.
export function historyRows(historyMap){
  return Object.keys(historyMap||{}).map(key=>({key,...historyMap[key]})).sort((a,b)=>b.t-a.t);
}
// Highest scores first; Array#sort is stable, so among equal scores the one
// earlier in `rows` (the more recent one, since historyRows sorts newest-first) stays first.
export function topScores(rows,n=3){
  return rows.slice().sort((a,b)=>b.s-a.s).slice(0,n);
}
export function discover(profile,u,g){
  if(!u||!g)return profile;
  return {...profile,seenObjects:{...profile.seenObjects,[u]:true,[g]:true},
    seenCombos:{...profile.seenCombos,[[u,g].sort().join('|')]:true}};
}
export function applyCareerRecord(profile,record){
  if(!profile||!record?.key||isRetiredMonthlyRecord(record))return profile;
  const key=safeKey(record.key);
  if(record.kind==='bluffRound'){
    if(profile.careerRounds?.[key])return profile;
    const result=roundCareerProfile(profile,key,{rounds:1},{},record.players||{},record.playerId,record.history);
    const old=profile.modeStats?.bluff||{};
    result.modeStats={...profile.modeStats,bluff:{...old,rounds:(old.rounds||0)+1,makerTurns:(old.makerTurns||0)+(record.maker?1:0),
      judged:(old.judged||0)+(record.maker?0:1),votes:(old.votes||0)+(record.submitted?1:0),correctVotes:(old.correctVotes||0)+(record.correct?1:0),
      missedVotes:(old.missedVotes||0)+(!record.maker&&!record.submitted?1:0),fooled:(old.fooled||0)+(record.fooled||0)}};
    result.objectFrequency=recordObjectFrequency(profile,record.history,'bluff');
    result.objectDiscoveries=recordDiscoveries(profile,[record.history.u,record.history.g],{t:record.history.t,round:key,session:record.history.match,mode:'bluff'});
    return discover(result,record.history.u,record.history.g);
  }
  if(record.kind==='round'){
    if(profile.careerRounds?.[key])return profile;
    const h=record.history,answered=h?.answered!==false&&Number.isFinite(h?.r);
    const inc={rounds:1,...record.inc};
    if(answered){inc.answeredRounds=1;inc.accuracyTotal=roundAccuracy(h.r);}
    else inc.missedRounds=1;
    const result=roundCareerProfile(profile,key,inc,record.maxima,record.players||{},record.playerId,h);
    if(!result)return profile;
    result.objectFrequency=recordObjectFrequency(profile,h,record.mode);
    const mode=record.mode,old=profile.modeStats?.[mode]||{};
    result.modeStats={...profile.modeStats,[mode]:{...old,rounds:(old.rounds||0)+1,answered:(old.answered||0)+(answered?1:0),
      accuracyTotal:(old.accuracyTotal||0)+(answered?roundAccuracy(h.r):0),
      rawAccuracyTotal:(old.rawAccuracyTotal||0)+(answered?roundAccuracy(Number.isFinite(h.rawR)?h.rawR:h.r):0),
      spotOns:(old.spotOns||0)+(inc.spotOns||0),perfects:(old.perfects||0)+(inc.perfects||0)}};
    if (mode === 'highstakes' && record.hsProgress) {
      const oldHs = profile.hsStats || {}, progress = record.hsProgress;
      result.hsStats = { ...oldHs, roundsPlayed: (oldHs.roundsPlayed || 0) + 1,
        roundsWon: (oldHs.roundsWon || 0) + (progress.won ? 1 : 0),
        bluffs: (oldHs.bluffs || 0) + (progress.bluff ? 1 : 0),
        biggestWin: Math.max(oldHs.biggestWin || 0, progress.payout || 0),
        peakStack: Math.max(oldHs.peakStack || 0, progress.peak || 0) };
    }
    result.objectDiscoveries=recordDiscoveries(profile,[h?.u,h?.g],{t:h?.t??record.t??0,round:key,session:h?.match||record.session||String(record.key).replace(/_round_\d+$/,''),mode});
    return discover(result,h?.u,h?.g);
  }
  if(record.kind==='match'){
    if(profile.careerGames?.[key])return profile;
    const stats={...profile.stats},mode=record.mode,old=profile.modeStats?.[mode]||{};
    stats.gamesPlayed=(stats.gamesPlayed||0)+1;
    if(record.won)stats.gamesWon=(stats.gamesWon||0)+1;
    if(record.group)stats.groupGames=(stats.groupGames||0)+1;
    const levels=[...new Set(record.opponents||[])],difficulty=levels.length===1?levels[0]:'mixed';
    const prior=profile.difficultyStats?.[difficulty]||{};
    return {...profile,stats,careerGames:{...profile.careerGames,[key]:record},
      ...(mode==='quick'?{difficultyStats:{...profile.difficultyStats,[difficulty]:{games:(prior.games||0)+1,wins:(prior.wins||0)+(record.won?1:0)}}}:{}),
      modeStats:{...profile.modeStats,[mode]:{...old,games:(old.games||0)+1,wins:(old.wins||0)+(record.won?1:0),podiums:(old.podiums||0)+(record.place<=3?1:0)}},
      matches:[...list(profile.matches),record].slice(-100),
      // Every Team vs Team game ever played, keyed by its own unique game key (not a
      // calendar date like dailyHistory/monthlyHistory) since "your best teams" wants
      // every game, not one slot per day - feeds the info screen's best-teams card.
      ...(mode==='teamvteam'?{teamHistory:{...profile.teamHistory,[key]:{s:record.score||0,t:record.t,accuracy:record.accuracy||0,
        myAvatar:record.myAvatar||null,partnerName:record.partnerName||'Partner',partnerAvatar:record.partnerAvatar||null}}}:{})};
  }
  if(record.kind!=='attempt'||profile.attemptReceipts?.[key])return profile;
  let result={...profile},coins=0;
  const stats={...profile.stats};
  if(record.mode==='worlds'){
    const levels=profile.worlds?.[record.world]||{},previous=levels['l'+record.level]||0,best=Math.max(previous,record.stars);
    coins=Math.max(0,record.stars||0)*5;
    result.worlds={...profile.worlds,[record.world]:{...levels,['l'+record.level]:best}};
    stats.worldLevels=(stats.worldLevels||0)+1;
    const old=profile.worldRecords?.[record.world]?.['l'+record.level]||{};
    result.worldRecords={...profile.worldRecords,[record.world]:{...profile.worldRecords?.[record.world],
      ['l'+record.level]:{bestAccuracy:Math.max(old.bestAccuracy||0,record.accuracy),attempts:(old.attempts||0)+1,lastAccuracy:record.accuracy}}};
  }else if(record.mode==='teamworlds'){
    // Mirrors the solo 'worlds' branch above: a running best-stars-per-World purely to decide
    // coin gain (never shown directly), kept separate from the immutable per-attempt history
    // below (which IS shown - "your top 5" - and is never updated in place, per the user's own
    // spec: "if you play again with them it'll be a new entry").
    const levels=profile.teamWorlds?.[record.world]||{},previous=levels.bestStars||0,best=Math.max(previous,record.stars);
    coins=(record.stars||0)*5; // team games pay for every star, every game - replayable and re-collectable
    result.teamWorlds={...profile.teamWorlds,[record.world]:{...levels,bestStars:best}};
    stats.teamWorldsAttempts=(stats.teamWorldsAttempts||0)+1;
    stats.threeStarTeamWorlds=threeStarTeamFinishes(profile)+(record.stars===3?1:0);
    result.teamWorldsHistory={...profile.teamWorldsHistory,[record.world]:{...profile.teamWorldsHistory?.[record.world],
      [key]:{s:record.accuracy||0,t:record.t,myAvatar:record.myAvatar||null,partnerName:record.partnerName||'Partner',partnerAvatar:record.partnerAvatar||null}}};
  }else if(record.mode==='hlsurvival'){
    // High/Low Survival: a duo game scored in rounds survived. Coins are paid for every round survived,
    // every run; every run is kept as its own history row for the "your best runs" list.
    const old=profile.hlSurvival||{};coins=((record.survived||0)+Math.max(0,Math.min(record.survived||0,record.themedWins||0)))*2; // themed wins pay double; receipt remains idempotent
    result.hlSurvival={...old,best:Math.max(old.best||0,record.survived||0),runs:(old.runs||0)+1,
      bestStreak:Math.max(old.bestStreak||0,record.bestStreak||0)};
    stats.hlSurvivalRuns=(stats.hlSurvivalRuns||0)+1;
    result.hlHistory={...profile.hlHistory,[key]:{s:record.survived||0,t:record.t,rounds:record.rounds||0,syncStreak:record.bestStreak||0,
      accuracy:record.accuracy||0,myAvatar:record.myAvatar||null,partnerName:record.partnerName||'Partner',partnerAvatar:record.partnerAvatar||null}};
  }else if(record.mode==='highstakes'){
    // High Stakes: coins come pre-computed on the record (finishing place + ghost bounty); the rest are running tallies.
    const old=profile.hsStats||{};coins=Math.max(0,Math.floor(record.coins||0));
    result.hsStats={games:(old.games||0)+1,roundsPlayed:(old.roundsPlayed||0)+(record.roundsRecorded?0:(record.rounds||0)),roundsWon:(old.roundsWon||0)+(record.roundsRecorded?0:(record.roundsWon||0)),
      bluffs:(old.bluffs||0)+(record.roundsRecorded?0:(record.bluffs||0)),biggestWin:Math.max(old.biggestWin||0,record.biggestWin||0),peakStack:Math.max(old.peakStack||0,record.peak||0),
      ghostCoins:(old.ghostCoins||0)+(record.ghost||0),knockedOut:(old.knockedOut||0)+(record.out?1:0)};
    stats.highStakesGames=(stats.highStakesGames||0)+1;
  }else if(record.mode==='survival'){
    const old=profile.survival||{};coins=Math.max(0,record.survived)*3+Math.max(0,Math.min(record.survived||0,record.themedWins||0))*2;
    result.survival={...old,best:Math.max(old.best||0,record.survived),runs:(old.runs||0)+1,bestAccuracy:Math.max(old.bestAccuracy||0,record.accuracy)};
    stats.survivalRuns=(stats.survivalRuns||0)+1;
  }else if(record.mode==='whichbigger'){
    // Which Is Bigger: scored in correct picks in a row of one run (3 lives). Coins: 1 per 2 right picks, rounded up, on every run.
    const old=profile.whichBigger||{};coins=Math.ceil(Math.max(0,record.score||0)/2);
    // Your own top five runs (best first); nothing is posted anywhere.
    const top=[...list(old.top),...((record.score||0)>0?[{s:record.score,t:record.t||Date.now()}]:[])].sort((a,b)=>b.s-a.s||a.t-b.t).slice(0,5);
    result.whichBigger={...old,best:Math.max(old.best||0,record.score||0),runs:(old.runs||0)+1,rounds:(old.rounds||0)+(record.rounds||0),top};
    stats.whichBiggerRuns=(stats.whichBiggerRuns||0)+1;
  }else if(record.mode==='daily'){
    const old=profile.dailyStreak||{},count=old.last===record.date?(old.count||1):old.last===record.yesterday?(old.count||0)+1:1;
    coins=10+(({3:20,7:50,30:200})[count]||0);
    result.dailyStreak={count,best:Math.max(old.best||0,count),last:record.date};
    result.daily={...record.saved,done:true};stats.dailies=(stats.dailies||0)+1;
    result.dailyHistory={...profile.dailyHistory,[record.date]:{s:record.accuracy||0,t:record.t,...(record.perfect?{p:1}:{})}};
  }else if(record.mode==='monthly'){
    // One record per monthly LEVEL finished for real (1-3: a third of the pack each; 4: the Mega run).
    // The month counts as played once levels 1-3 are all done; Mega is a bonus and doesn't change that.
    coins=Math.max(0,Math.floor(record.coins||0));
    const same=profile.monthly&&profile.monthly.key===record.month&&profile.monthly.format===record.format;
    const old=same?profile.monthly:{key:record.month,format:record.format,levels:{}};
    const level=record.level||1,prior=old.levels?.[level]||{};
    const levels={...old.levels,[level]:{...prior,...record.saved,acc:record.accuracy||0,done:true}};
    const nowDone=[1,2,3].every(l=>levels[l]?.done),wasDone=!!old.done&&same;
    result.monthly={...old,key:record.month,format:record.format,combos:record.combos||old.combos,levels,done:nowDone};
    stats.monthlyLevels=(stats.monthlyLevels||0)+1;
    if(nowDone&&!wasDone){
      stats.monthlies=(stats.monthlies||0)+1;stats['mc'+record.month.slice(5)]=1;
      const avg=([1,2,3].reduce((a,l)=>a+(levels[l].acc||0),0))/3;
      result.monthlyHistory={...profile.monthlyHistory,[record.month]:{s:Math.round(avg*10)/10,t:record.t}};
    }
  }else if(record.mode==='practice'){
    // A replay of a monthly level: no leaderboard, no progress; it pays half the coins a real try would.
    coins=Math.max(0,Math.floor(record.coins||0));
    const old=profile.monthly||{},prev=(old.best||0)/(old.bestRounds||5);
    if(record.total/record.rounds>prev)result.monthly={...old,best:record.total,bestRounds:record.rounds};
  }
  const mode=record.mode==='practice'?'monthly':record.mode,old=profile.modeStats?.[mode]||{};
  result.modeStats={...profile.modeStats,[mode]:{...old,attempts:(old.attempts||0)+1,bestAccuracy:Math.max(old.bestAccuracy||0,record.accuracy||0)}};
  // Coin booster: one charge doubles what this finished game/run pays.
  const boosted=coins>0&&(profile.booster|0)>0;
  if(boosted)result.booster=(profile.booster|0)-1;
  const paid=boosted?coins*2:coins;
  result.stats=stats;result.coins=(profile.coins||0)+paid;
  result.attemptReceipts={...profile.attemptReceipts,[key]:{mode:record.mode,coins:paid,accuracy:record.accuracy||0,t:record.t,...(boosted?{boosted:true,base:coins}:{})}};
  result.attemptHistory=[...list(profile.attemptHistory),{...result.attemptReceipts[key],world:record.world||null,level:record.level||null,survived:record.survived??null,stars:record.stars??null,partnerName:record.partnerName||null,rounds:record.rounds??null}].slice(-60);
  return result;
}

// Owner-scoped durable outbox. A lost response retries the SAME record key.
// Completed rounds and seen pairs survive abandoning a game, while only a
// final match record can increase completed games or wins.
export function createCareerLedger({owner,transaction,storage=localStorage,onPending=()=>{},onSaved=()=>{}}){
  let flushing=null;
  const storageKey=id=>'mg_career_pending_'+id;
  function read(id){try{return JSON.parse(storage.getItem(storageKey(id))||'[]');}catch{return [];}}
  function write(id,rows){storage.setItem(storageKey(id),JSON.stringify(rows));if(owner()===id)onPending(rows.length);}
  async function flush(){
    if(flushing)return flushing;
    const id=owner();if(!id)return;
    flushing=Promise.resolve().then(async()=>{try{
      let rows=read(id);onPending(rows.length);
      while(rows.length){
        const row=rows[0];
        if(isRetiredMonthlyRecord(row)){rows=read(id).filter(r=>r.key!==row.key);write(id,rows);continue;}
        await transaction(id,p=>applyCareerRecord(p,row));
        await onSaved(row,id);
        rows=read(id).filter(r=>r.key!==row.key);write(id,rows);
      }
    }catch{onPending(read(id).length);}}).finally(()=>{flushing=null;});
    return flushing;
  }
  function save(row){
    const id=owner();if(!id)throw Error('Missing player profile');
    const rows=read(id);if(!rows.some(r=>r.key===row.key)){rows.push(JSON.parse(JSON.stringify(row)));write(id,rows);}
    void flush();
  }
  return {save,flush,pending:()=>read(owner()).length};
}
