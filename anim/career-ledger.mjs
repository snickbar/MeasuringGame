import {threeStarTeamFinishes} from './mode-awards.mjs';
import {roundCareerProfile} from './opponent-xp.mjs';
import {roundAccuracy} from './accuracy.mjs';

export const MODE_NAMES = {party:'Party',quick:'Quick Game',daily:'Daily',worlds:'Worlds',monthly:'Monthly',survival:'Survival',teamvteam:'Team vs Team',teamworlds:'Team Worlds',hlsurvival:'High/Low Survival',highstakes:'High Stakes'};
export const MODE_CODE = {party:0,quick:1,daily:2,worlds:3,monthly:4,survival:5,teamvteam:6,teamworlds:7,hlsurvival:8,highstakes:9};
export const safeKey = value => String(value).replace(/[.#$\[\]/]/g,'_');
const list = value => Array.isArray(value)?value:Object.values(value||{});
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
  if(!profile||!record?.key)return profile;
  const key=safeKey(record.key);
  if(record.kind==='round'){
    if(profile.careerRounds?.[key])return profile;
    const h=record.history,answered=h?.answered!==false&&Number.isFinite(h?.r);
    const inc={rounds:1,...record.inc};
    if(answered){inc.answeredRounds=1;inc.accuracyTotal=roundAccuracy(h.r);}
    else inc.missedRounds=1;
    const result=roundCareerProfile(profile,key,inc,record.maxima,record.players||{},record.playerId,h);
    if(!result)return profile;
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
    coins=(best-previous)*5;
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
    const old=profile.hlSurvival||{};coins=(record.survived||0)*2; // paid every run, like Team Worlds
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
    const old=profile.survival||{};coins=Math.max(0,record.survived-(old.best||0))*2;
    result.survival={...old,best:Math.max(old.best||0,record.survived),runs:(old.runs||0)+1,bestAccuracy:Math.max(old.bestAccuracy||0,record.accuracy)};
    stats.survivalRuns=(stats.survivalRuns||0)+1;
  }else if(record.mode==='daily'){
    const old=profile.dailyStreak||{},count=old.last===record.date?(old.count||1):old.last===record.yesterday?(old.count||0)+1:1;
    coins=({3:20,7:50,30:200})[count]||0;
    result.dailyStreak={count,best:Math.max(old.best||0,count),last:record.date};
    result.daily={...record.saved,done:true};stats.dailies=(stats.dailies||0)+1;
    result.dailyHistory={...profile.dailyHistory,[record.date]:{s:record.accuracy||0,t:record.t}};
  }else if(record.mode==='monthly'){
    result.monthly={...profile.monthly,...record.saved,done:true};coins=record.coins;
    stats.monthlies=(stats.monthlies||0)+1;stats['mc'+record.month.slice(5)]=1;
    result.monthlyHistory={...profile.monthlyHistory,[record.month]:{s:record.accuracy||0,t:record.t}};
  }else if(record.mode==='practice'){
    const old=profile.monthly||{},prev=(old.best||0)/(old.bestRounds||5);
    if(record.total/record.rounds>prev)result.monthly={...old,best:record.total,bestRounds:record.rounds};
  }
  const mode=record.mode==='practice'?'monthly':record.mode,old=profile.modeStats?.[mode]||{};
  result.modeStats={...profile.modeStats,[mode]:{...old,attempts:(old.attempts||0)+1,bestAccuracy:Math.max(old.bestAccuracy||0,record.accuracy||0)}};
  result.stats=stats;result.coins=(profile.coins||0)+coins;
  result.attemptReceipts={...profile.attemptReceipts,[key]:{mode:record.mode,coins,accuracy:record.accuracy||0,t:record.t}};
  result.attemptHistory=[...list(profile.attemptHistory),{...result.attemptReceipts[key],world:record.world||null,level:record.level||null,survived:record.survived??null}].slice(-60);
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
        const row=rows[0];await transaction(id,p=>applyCareerRecord(p,row));
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
