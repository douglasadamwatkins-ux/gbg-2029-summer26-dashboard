import { useState, useEffect, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, BarChart, Bar, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import gamesData from "./games-data.json";

// ── PALETTE ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#0b0f1a", panel:"#111827", border:"#1e2a3a",
  accent:"#e8a020", blue:"#3b82f6", green:"#22c55e",
  red:"#ef4444", teal:"#14b8a6", muted:"#4b5563",
  text:"#e2e8f0", subtext:"#94a3b8", purple:"#a855f7",
};

// ── TOURNAMENTS ──────────────────────────────────────────────────────────────
const TOURNAMENTS = [
  {id:"gbg-rr",      label:"GBG Round Robin",              games:[0,1,2],          color:C.green},
  {id:"mhs",         label:"Mile High Shootout",           games:[3,4,5,6],        color:C.blue},
  {id:"gb",          label:"Gold Rush Bracket",            games:[7,8,9,10],       color:C.purple},
  {id:"15u-natl",    label:"15U National Championship",    games:[11,12,13,14,15], color:C.teal},
  {id:"ftc",         label:"Five Tool Colorado Legends",   games:[16,17,18,19],    color:C.accent},
  {id:"fttx",        label:"Five Tool Texas Summer",       games:[20,21,22,23],    color:C.teal},
  {id:"wwba",        label:"WWBA National Championship",   games:[24],             color:"#f59e0b"},
];

// ── DERIVE DATA FROM games-data.json ──────────────────────────────────────────

// Build GAMES array
const GAMES = gamesData.games.map(g => ({
  id: g.id,
  date: g.date,
  opp: g.opponent,
  result: g.result,
  score: g.score
}));

// Build runs arrays
const GBG_RUNS = gamesData.games.map(g => g.gbgRuns);
const OPP_RUNS = gamesData.games.map(g => g.oppRuns);

// Build TEAM_GAMES
const TEAM_GAMES = gamesData.games.map(g => g.teamStats);

// Build PLAYER_GAME_LOG by iterating games and collecting per-player stats
const PLAYER_GAME_LOG = {};
const allPlayers = new Set();

// First pass: collect all player names
gamesData.games.forEach(game => {
  Object.keys(game.playerStats || {}).forEach(name => allPlayers.add(name));
});

// Second pass: build per-player arrays
allPlayers.forEach(player => {
  PLAYER_GAME_LOG[player] = gamesData.games.map(game => 
    game.playerStats[player] || {h:0,ab:0,r:0,d:0,t:0,hr:0,rbi:0,bb:0,hbp:0,sf:0,so:0,sb:0}
  );
});

// Build GRAYSON_GAMES from PLAYER_GAME_LOG
const GRAYSON_GAMES = (PLAYER_GAME_LOG["G Watkins"] || []).map(stats => ({
  ab: stats.ab,
  h: stats.h,
  d: stats.d,
  t: stats.t,
  hr: stats.hr,
  rbi: stats.rbi,
  bb: stats.bb,
  hbp: stats.hbp,
  sf: stats.sf,
  pos: stats.ab === 0 && stats.bb === 0 && stats.hbp === 0 ? "DNP" : "C"
}));

// Build ROSTER by summing season stats per player
const ROSTER = Array.from(allPlayers).map(name => {
  const games = PLAYER_GAME_LOG[name] || [];
  const stats = {ab:0, r:0, h:0, d:0, t:0, hr:0, rbi:0, bb:0, hbp:0, sf:0, so:0, sb:0};
  
  games.forEach(g => {
    Object.keys(stats).forEach(k => { stats[k] += g[k] || 0; });
  });
  
  const tb = stats.h - stats.d - stats.t - stats.hr + 2*stats.d + 3*stats.t + 4*stats.hr;
  const g = games.filter(game => (game.ab||0) + (game.bb||0) + (game.hbp||0) + (game.sf||0) > 0).length;
  
  const avg = stats.ab > 0 ? parseFloat((stats.h / stats.ab).toFixed(3)) : 0;
  const obp = (stats.ab + stats.bb + stats.hbp + stats.sf) > 0 
    ? parseFloat(((stats.h + stats.bb + stats.hbp) / (stats.ab + stats.bb + stats.hbp + stats.sf)).toFixed(3))
    : 0;
  const slg = stats.ab > 0 ? parseFloat((tb / stats.ab).toFixed(3)) : 0;
  const ops = parseFloat((obp + slg).toFixed(3));
  
  return {
    name,
    num: 0,
    g, ab: stats.ab, r: stats.r, h: stats.h, d: stats.d, t: stats.t, hr: stats.hr, tb,
    rbi: stats.rbi, bb: stats.bb, hbp: stats.hbp, sf: stats.sf, so: stats.so, sb: stats.sb,
    avg, obp, slg, ops
  };
}).sort((a,b) => b.h - a.h);

// Add TEAM row (cumulative totals)
const teamTotal = TEAM_GAMES.reduce((sum, game) => ({
  ab: sum.ab + game.ab,
  r: sum.r + game.r,
  h: sum.h + game.h,
  d: sum.d + game.d,
  t: sum.t + game.t,
  hr: sum.hr + game.hr,
  rbi: sum.rbi + game.rbi,
  bb: sum.bb + game.bb,
  hbp: sum.hbp + game.hbp,
  sf: sum.sf + game.sf,
  so: sum.so + game.so,
}), {ab:0, r:0, h:0, d:0, t:0, hr:0, rbi:0, bb:0, hbp:0, sf:0, so:0});

const teamTB = teamTotal.h - teamTotal.d - teamTotal.t - teamTotal.hr + 2*teamTotal.d + 3*teamTotal.t + 4*teamTotal.hr;
const teamAvg = teamTotal.ab > 0 ? parseFloat((teamTotal.h / teamTotal.ab).toFixed(3)) : 0;
const teamOBP = (teamTotal.ab + teamTotal.bb + teamTotal.hbp + teamTotal.sf) > 0 
  ? parseFloat(((teamTotal.h + teamTotal.bb + teamTotal.hbp) / (teamTotal.ab + teamTotal.bb + teamTotal.hbp + teamTotal.sf)).toFixed(3))
  : 0;
const teamSLG = teamTotal.ab > 0 ? parseFloat((teamTB / teamTotal.ab).toFixed(3)) : 0;
const teamOPS = parseFloat((teamOBP + teamSLG).toFixed(3));

ROSTER.push({
  name: "TEAM",
  num: 0,
  g: GAMES.length,
  ab: teamTotal.ab,
  r: teamTotal.r,
  h: teamTotal.h,
  d: teamTotal.d,
  t: teamTotal.t,
  hr: teamTotal.hr,
  tb: teamTB,
  rbi: teamTotal.rbi,
  bb: teamTotal.bb,
  hbp: teamTotal.hbp,
  sf: teamTotal.sf,
  so: teamTotal.so,
  sb: 0,
  avg: teamAvg,
  obp: teamOBP,
  slg: teamSLG,
  ops: teamOPS
});

// Build RECENT_GAMES_IDX
const RECENT_GAMES_IDX = GAMES.length >= 3 
  ? [GAMES.length - 3, GAMES.length - 2, GAMES.length - 1]
  : GAMES.length >= 2
  ? [GAMES.length - 2, GAMES.length - 1]
  : [0];

// Build GAME_BATTING and GAME_AB (last 3 games)
const GAME_BATTING = {};
const GAME_AB = {};

Array.from(allPlayers).forEach(name => {
  const games = PLAYER_GAME_LOG[name] || [];
  const last3 = games.slice(-3);
  GAME_BATTING[name] = last3.map(g => g.h || 0);
  GAME_AB[name] = last3.map(g => g.ab || 0);
});

// Pitching data (kept from dashboard)
const PITCHING = [
  {name:"J O'Connor",  num:12,g:6,ip:"18.2",h:16, r:16, er:11,bb:19, so:22,hbp:3,era:5.30,whip:1.88,k9:10.6, pitches:379,strikes:207},
  {name:"C Carter",    num:27,g:5,ip:"13.0",h:9, r:10, er:5,bb:12, so:16,hbp:2,era:3.46,whip:1.62,k9:11.1, pitches:253,strikes:133},
  {name:"J Seda",      num: 8,g:6,ip:"19.1",h:19, r:11, er:4,bb:10, so:23,hbp:2,era:1.86,whip:1.50,k9:10.7, pitches:300,strikes:180},
  {name:"C Davies",    num: 1,g:6,ip:"21.2",h:19, r:17, er:11,bb:13, so:23,hbp:0,era:4.57,whip:1.48,k9:9.5, pitches:335,strikes:221},
  {name:"J Holder",    num: 4,g:9,ip:"23.1",h:18, r:9, er:8,bb:14, so:12,hbp:2,era:3.09,whip:1.37,k9:4.6, pitches:327,strikes:192},
  {name:"C Sherpa",    num:22,g:3,ip:"4.0",h:3, r:2, er:2,bb:1, so:1,hbp:1,era:4.50,whip:1.00,k9:2.2, pitches:57,strikes:32},
  {name:"J Bradley",   num:14,g:8,ip:"20.2",h:20, r:17, er:15,bb:23, so:22,hbp:4,era:6.53,whip:2.09,k9:9.6, pitches:338,strikes:178},
  {name:"R Enochs",    num: 3,g:4,ip:"12.0",h:13, r:12, er:10,bb:11, so:8,hbp:3,era:7.50,whip:2.00,k9:6.0, pitches:169,strikes:98},
  {name:"E West",      num:30,g:4,ip:"10.0",h:13, r:15, er:7,bb:11, so:8,hbp:2,era:6.30,whip:2.40,k9:7.2, pitches:161,strikes:93},
];

// ── FUNCTIONS & COMPONENTS ────────────────────────────────────────────────────

function ipdec(s) {
  const [w,f] = String(s).split(".");
  return parseInt(w) + (f ? parseInt(f)/3 : 0);
}
function fmt(n, dec=3) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return n.toFixed(dec);
}
function recentAvg(name) {
  const h=(GAME_BATTING[name]||[]).reduce((a,b)=>a+b,0);
  const ab=(GAME_AB[name]||[]).reduce((a,b)=>a+b,0);
  return ab>0?h/ab:0;
}
function hotScore(name) {
  const hits=GAME_BATTING[name]||[0,0,0];
  const abs=GAME_AB[name]||[0,0,0];
  return hits.reduce((s,h,i)=>s+(abs[i]>0?(h/abs[i])*[1,2,3][i]:0),0);
}

// Compute H/AB over a subset of game indices for a single player
function playerSubsetStats(name, selIdx) {
  const log = PLAYER_GAME_LOG[name] || [];
  let h=0, ab=0;
  selIdx.forEach(i => { if(log[i]) { h+=log[i].h; ab+=log[i].ab; } });
  return { h, ab, avg: ab>0 ? h/ab : 0 };
}

// Last 3 games the named player was actually in the lineup (had a PA: AB+BB+HBP+SF > 0)
function last3InLineup(name) {
  const log = PLAYER_GAME_LOG[name] || [];
  const inLineup = log.filter(gm => (gm.ab||0)+(gm.bb||0)+(gm.hbp||0)+(gm.sf||0) > 0);
  const last3 = inLineup.slice(-3);
  const h = last3.reduce((a, gm) => a + (gm.h||0), 0);
  const ab = last3.reduce((a, gm) => a + (gm.ab||0), 0);
  return { h, ab, games: last3.length };
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
function Panel({children,style={}}) {
  return <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,padding:"18px 20px",...style}}>{children}</div>;
}
function Label({children,color=C.subtext,size=11,style={}}) {
  return <div style={{fontSize:size,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color,marginBottom:6,...style}}>{children}</div>;
}
function Stat({label,value,sub,color=C.text,size=28}) {
  return (
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:size,fontWeight:800,color,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.subtext,marginTop:2}}>{sub}</div>}
      <div style={{fontSize:10,color:C.muted,marginTop:4,textTransform:"uppercase",letterSpacing:"0.07em"}}>{label}</div>
    </div>
  );
}
function RecordBadge({result,score}) {
  const col=result==="W"?C.green:result==="L"?C.red:C.accent;
  return <span style={{background:`${col}22`,border:`1px solid ${col}`,color:col,borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:700,marginRight:4}}>{result} {score}</span>;
}
function SectionTitle({children,color=C.accent}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"24px 0 14px"}}>
      <div style={{height:2,width:20,background:color,borderRadius:2}}/>
      <div style={{fontSize:13,fontWeight:800,color,textTransform:"uppercase",letterSpacing:"0.1em"}}>{children}</div>
      <div style={{flex:1,height:1,background:C.border}}/>
    </div>
  );
}
function SeasonBadge() {
  return (
    <span title="This panel shows season totals — per-game splits not available for these stats."
      style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:9,fontWeight:700,color:C.muted,background:`${C.muted}18`,border:`1px solid ${C.muted}40`,borderRadius:4,padding:"2px 6px",letterSpacing:"0.08em",textTransform:"uppercase",cursor:"help"}}>
      ◆ Season
    </span>
  );
}

// ── GRAYSON HERO ──────────────────────────────────────────────────────────────
function GraysonHero({ selectedIdx }) {
  const season = ROSTER.find(p=>p.name==="G Watkins");
  const selGames = selectedIdx.map(i => GRAYSON_GAMES[i]);
  const selResults = selectedIdx.map(i => GAMES[i].result);
  const selGameLabels = selectedIdx.map(i => GAMES[i]);
  const isAll = selectedIdx.length === GAMES.length;

  // Aggregate Grayson stats over selected games
  const ab  = selGames.reduce((s,g)=>s+g.ab, 0);
  const h   = selGames.reduce((s,g)=>s+g.h,  0);
  const d   = selGames.reduce((s,g)=>s+g.d,  0);
  const t   = selGames.reduce((s,g)=>s+g.t,  0);
  const hr  = selGames.reduce((s,g)=>s+g.hr, 0);
  const rbi = selGames.reduce((s,g)=>s+g.rbi,0);
  const bb  = selGames.reduce((s,g)=>s+g.bb, 0);
  const hbp = selGames.reduce((s,g)=>s+g.hbp,0);
  const sf  = selGames.reduce((s,g)=>s+g.sf, 0);
  // SO not tracked per game — estimate by season rate × filtered AB
  const so  = ab > 0 ? Math.round(season.so  * ab / season.ab) : 0;
  const tb  = (h-d-t-hr) + 2*d + 3*t + 4*hr;
  const avg = ab>0 ? h/ab : 0;
  const obp = (ab+bb+hbp+sf)>0 ? (h+bb+hbp)/(ab+bb+hbp+sf) : 0;
  const slg = ab>0 ? tb/ab : 0;
  const ops = obp + slg;
  const gp  = selGames.filter(g => g.pos !== "DNP").length;
  const gw  = { avg, obp, slg, ops, rbi, d, t, hr, bb, so, hbp, sf, h, ab, g: gp };

  const last3games = selGames.slice(-3);
  const last3H = last3games.reduce((s,g)=>s+g.h,0);
  const last3AB= last3games.reduce((s,g)=>s+g.ab,0);
  const last3Avg = last3AB>0?last3H/last3AB:0;

  // Rolling cumulative AVG over selected games
  const rolling = (() => {
    let cumH=0,cumAB=0;
    return selGames.map((gm,i)=>{
      cumH+=gm.h; cumAB+=gm.ab;
      return {game:selGameLabels[i].opp.split(" ")[0], avg:cumAB>0?parseFloat((cumH/cumAB).toFixed(3)):0, result:selResults[i], h:gm.h, ab:gm.ab, rbi:gm.rbi};
    });
  })();

  // Win/loss splits over selected
  const splits = ["W","L","T"].map(res => {
    const gs = selGames.filter((_,i)=>selResults[i]===res);
    const ab2 = gs.reduce((s,g)=>s+g.ab,0), h2 = gs.reduce((s,g)=>s+g.h,0);
    const rbi2= gs.reduce((s,g)=>s+g.rbi,0), bb2 = gs.reduce((s,g)=>s+g.bb,0);
    return {res, ab:ab2, h:h2, rbi:rbi2, bb:bb2, avg:ab2>0?h2/ab2:0, games:gs.length};
  });

  // Streak: across selected games in chronological order
  const streaks = (() => {
    let cur=0,cur_cold=0;
    return selGames.map(gm=>{
      if(gm.ab===0) return {streak:cur,cold:cur_cold};
      if(gm.h>0){cur++;cur_cold=0;}else{cur_cold++;cur=0;}
      return {streak:cur,cold:cur_cold};
    });
  })();
  const currentStreak = streaks.length>0 ? streaks[streaks.length-1] : {streak:0,cold:0};

  // Position breakdown
  const posCounts={C:0,"1B":0,DH:0,EH:0,DNP:0};
  selGames.forEach(g=>{ if(posCounts[g.pos]!==undefined) posCounts[g.pos]++; });

  // Radar
  const radarData=[
    {stat:"AVG",     value:Math.round(gw.avg*100)},
    {stat:"OBP",     value:Math.round(gw.obp*100)},
    {stat:"SLG",     value:Math.round(gw.slg*100)},
    {stat:"XBH%",    value:Math.round((gw.d+gw.t+gw.hr)/Math.max(gw.h,1)*100)},
    {stat:"K-avoid", value:Math.round((1-gw.so/Math.max(gw.ab,1))*100)},
    {stat:"BB%",     value:Math.round(gw.bb/Math.max(gw.ab+gw.bb,1)*100)},
  ];

  const CustomDot=({cx,cy,payload})=>{
    const col=payload.result==="W"?C.green:payload.result==="L"?C.red:C.accent;
    return <circle cx={cx} cy={cy} r={5} fill={col} stroke={C.bg} strokeWidth={2}/>;
  };

  // Empty-selection guard
  if (selectedIdx.length === 0) {
    return (
      <Panel style={{gridColumn:"1 / -1",borderColor:`${C.accent}55`,borderWidth:2}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:`${C.accent}22`,border:`2px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:C.accent}}>21</div>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1}}>Grayson Watkins</div>
            <div style={{fontSize:12,color:C.subtext,marginTop:3}}>Catcher · #21 · GBG Colorado 2029</div>
          </div>
        </div>
        <div style={{padding:"40px 20px",textAlign:"center",color:C.muted,fontSize:13}}>No games selected — choose at least one game from the filter above.</div>
      </Panel>
    );
  }

  return (
    <Panel style={{gridColumn:"1 / -1",borderColor:`${C.accent}55`,borderWidth:2}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:`${C.accent}22`,border:`2px solid ${C.accent}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:C.accent}}>21</div>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1}}>Grayson Watkins {!isAll && <span style={{fontSize:10,color:C.accent,fontWeight:700,marginLeft:6,letterSpacing:"0.08em"}}>FILTERED</span>}</div>
          <div style={{fontSize:12,color:C.subtext,marginTop:3}}>Catcher · #21 · GBG Colorado 2029 {!isAll && <span style={{color:C.muted}}>· {gp} of {selectedIdx.length} games played</span>}</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:20,alignItems:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.subtext}}>Last 3 {isAll?"games":"selected"}</div>
            <div style={{fontSize:18,fontWeight:800,color:last3Avg>=0.300?C.green:last3Avg>0?C.accent:C.muted}}>{last3AB>0?`${last3H}-for-${last3AB}`:"No PA"}</div>
            <div style={{fontSize:11,color:C.subtext}}>{fmt(last3Avg)} avg</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.subtext}}>Hit streak</div>
            <div style={{fontSize:18,fontWeight:800,color:currentStreak.streak>0?C.green:C.muted}}>{currentStreak.streak>0?`${currentStreak.streak} G`:"—"}</div>
            <div style={{fontSize:11,color:C.subtext}}>current</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.subtext}}>Position</div>
            <div style={{fontSize:18,fontWeight:800,color:C.accent}}>{posCounts.C}C / {posCounts["1B"]}1B / {posCounts.DH}DH / {posCounts.EH}EH</div>
            <div style={{fontSize:11,color:C.subtext}}>{posCounts.DNP} DNP</div>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:8,marginBottom:20,background:`${C.accent}0a`,borderRadius:8,padding:"14px 10px",border:`1px solid ${C.accent}22`}}>
        <Stat label="AVG"  value={fmt(gw.avg)} color={C.accent}/>
        <Stat label="OBP"  value={fmt(gw.obp)}/>
        <Stat label="SLG"  value={fmt(gw.slg)}/>
        <Stat label="OPS"  value={fmt(gw.ops)}/>
        <Stat label="RBI"  value={gw.rbi}/>
        <Stat label="2B"   value={gw.d}/>
        <Stat label="BB/K" value={`${gw.bb}/${gw.so}`}/>
        <Stat label="XBH"  value={gw.d+gw.t+gw.hr}/>
      </div>

      {/* Charts row 1 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div>
          <Label>Cumulative AVG — Game by Game</Label>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={rolling} margin={{top:5,right:5,bottom:5,left:-20}}>
              <XAxis dataKey="game" tick={{fill:C.subtext,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,0.6]} tick={{fill:C.subtext,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v.toFixed(2)}/>
              <ReferenceLine y={TEAM_SEASON_AVG} stroke={C.green} strokeDasharray="4 2" strokeWidth={1}/>
              <Tooltip contentStyle={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={v=>[v.toFixed(3),"Cum AVG"]}/>
              <Line type="monotone" dataKey="avg" stroke={C.accent} strokeWidth={2.5} dot={<CustomDot/>} activeDot={{r:6,fill:C.accent}}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{fontSize:9,color:C.muted,textAlign:"center"}}>Dots = W/L/T · Green line = team season AVG{!isAll && " · over selected games"}</div>
        </div>
        <div>
          <Label>Skill Profile{!isAll && <span style={{color:C.muted,marginLeft:6,fontSize:9,fontWeight:500,letterSpacing:"normal",textTransform:"none"}}>(K-avoid uses season rate)</span>}</Label>
          <ResponsiveContainer width="100%" height={150}>
            <RadarChart data={radarData} margin={{top:0,right:20,bottom:0,left:20}}>
              <PolarGrid stroke={C.border}/>
              <PolarAngleAxis dataKey="stat" tick={{fill:C.subtext,fontSize:9}}/>
              <Radar dataKey="value" stroke={C.accent} fill={C.accent} fillOpacity={0.25} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Win/Loss splits + Contact quality */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div>
          <Label>Batting Splits by Game Result</Label>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {splits.map(s=>{
              const col=s.res==="W"?C.green:s.res==="L"?C.red:C.accent;
              return (
                <div key={s.res} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:`${col}0d`,borderRadius:8,border:`1px solid ${col}30`}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`${col}22`,border:`1px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:col,flexShrink:0}}>{s.res}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:C.subtext}}>{s.games} game{s.games!==1?"s":""} · {s.h}-for-{s.ab}</div>
                    <div style={{fontSize:9,color:C.muted}}>{s.rbi} RBI · {s.bb} BB</div>
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:col}}>{fmt(s.avg)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <Label>Contact &amp; Plate Discipline</Label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[
              {label:"K Rate",  value:`${gw.ab>0?(gw.so/gw.ab*100).toFixed(1):"0.0"}%`, sub:`${gw.so} K in ${gw.ab} AB`, color:gw.ab>0&&gw.so/gw.ab<0.20?C.green:C.red},
              {label:"BB Rate", value:`${(gw.ab+gw.bb)>0?(gw.bb/(gw.ab+gw.bb)*100).toFixed(1):"0.0"}%`, sub:`${gw.bb} walks`, color:C.teal},
              {label:"XBH/Hit", value:`${gw.h>0?(gw.d/gw.h*100).toFixed(0):"0"}%`, sub:`${gw.d} 2B of ${gw.h} H`, color:C.accent},
              {label:"BB/K",    value:fmt(gw.bb/Math.max(gw.so,1),2), sub:"walks per strikeout", color:gw.bb/Math.max(gw.so,1)>=0.5?C.green:C.muted},
            ].map(s=>(
              <div key={s.label} style={{background:`${s.color}10`,border:`1px solid ${s.color}30`,borderRadius:8,padding:"10px 12px",textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:800,color:s.color}}>{s.value}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.sub}</div>
                <div style={{fontSize:9,color:C.subtext,marginTop:2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:10}}>
            <Label style={{marginBottom:4}}>Position Games</Label>
            <div style={{display:"flex",gap:6}}>
              {[{pos:"C",count:posCounts.C,col:C.accent},{pos:"1B",count:posCounts["1B"],col:C.blue},{pos:"DH",count:posCounts.DH,col:C.teal},{pos:"EH",count:posCounts.EH,col:C.purple},{pos:"DNP",count:posCounts.DNP,col:C.muted}].map(p=>(
                <div key={p.pos} style={{flex:1,background:`${p.col}10`,border:`1px solid ${p.col}30`,borderRadius:7,padding:"7px",textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:800,color:p.col}}>{p.count}</div>
                  <div style={{fontSize:10,color:C.subtext}}>{p.pos}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game log */}
      <div>
        <Label>Game Log {!isAll && <span style={{color:C.accent,marginLeft:6,fontSize:9,letterSpacing:"normal",textTransform:"none",fontWeight:500}}>· {selectedIdx.length} selected</span>}</Label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {selGames.map((gm,i)=>{
            const res=selResults[i];
            const rc=res==="W"?C.green:res==="L"?C.red:C.accent;
            const hc=gm.ab===0?C.muted:gm.h>0?C.accent:C.subtext;
            return (
              <div key={i} style={{background:`${rc}12`,border:`1px solid ${rc}55`,borderRadius:7,padding:"5px 9px",minWidth:52,textAlign:"center"}}>
                <div style={{fontSize:8,color:C.subtext,marginBottom:1}}>{selGameLabels[i].opp.split(" ")[0]}</div>
                <div style={{fontSize:9,fontWeight:700,color:rc,marginBottom:2}}>{res}</div>
                <div style={{fontSize:12,fontWeight:700,color:hc}}>{gm.ab===0?"DNP":`${gm.h}/${gm.ab}`}</div>
                {gm.rbi>0&&<div style={{fontSize:8,color:C.teal}}>{gm.rbi} RBI</div>}
                {gm.d>0&&<div style={{fontSize:8,color:C.accent}}>2B</div>}
                <div style={{fontSize:8,color:C.muted,marginTop:2}}>{gm.pos}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// ── TEAM HERO ─────────────────────────────────────────────────────────────────
function TeamHero({ selectedIdx }) {
  const isAll = selectedIdx.length === GAMES.length;
  const selTeam = selectedIdx.map(i => TEAM_GAMES[i]);
  const selGbg  = selectedIdx.map(i => GBG_RUNS[i]);
  const selOpp  = selectedIdx.map(i => OPP_RUNS[i]);
  const selResults = selectedIdx.map(i => GAMES[i].result);
  const selLabels  = selectedIdx.map(i => GAMES[i]);

  if (selectedIdx.length === 0) {
    return (
      <Panel style={{gridColumn:"1 / -1",borderColor:`${C.blue}55`,borderWidth:2}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:`${C.blue}22`,border:`2px solid ${C.blue}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:C.blue}}>29</div>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1}}>GBG Colorado 2029</div>
            <div style={{fontSize:12,color:C.subtext,marginTop:3}}>Team Season Stats</div>
          </div>
        </div>
        <div style={{padding:"40px 20px",textAlign:"center",color:C.muted,fontSize:13}}>No games selected — choose at least one game from the filter above.</div>
      </Panel>
    );
  }

  const totAB  = selTeam.reduce((s,g)=>s+g.ab,0);
  const totH   = selTeam.reduce((s,g)=>s+g.h,0);
  const totRBI = selTeam.reduce((s,g)=>s+g.rbi,0);
  const totBB  = selTeam.reduce((s,g)=>s+g.bb,0);
  const totSO  = selTeam.reduce((s,g)=>s+g.so,0);
  const totTB  = selTeam.reduce((s,g)=>s+(g.h-g.d-g.t-g.hr)+2*g.d+3*g.t+4*g.hr,0);
  const avg = totAB>0?totH/totAB:0, obp = (totAB+totBB)>0?(totH+totBB)/(totAB+totBB):0;
  const slg = totAB>0?totTB/totAB:0, ops = obp+slg;
  const totScored  = selGbg.reduce((a,b)=>a+b,0);
  const totAllowed = selOpp.reduce((a,b)=>a+b,0);

  // W/L/T counts over selected
  const wins   = selResults.filter(r=>r==="W").length;
  const losses = selResults.filter(r=>r==="L").length;
  const ties   = selResults.filter(r=>r==="T").length;

  // Rolling
  const rolling=(()=>{
    let cAB=0,cH=0,cBB=0,cTB=0,cRD=0;
    return selTeam.map((gm,i)=>{
      cAB+=gm.ab; cH+=gm.h; cBB+=gm.bb;
      cTB+=(gm.h-gm.d-gm.t-gm.hr)+2*gm.d+3*gm.t+4*gm.hr;
      cRD+=selGbg[i]-selOpp[i];
      const cavg=cAB>0?cH/cAB:0;
      const cobp=(cAB+cBB)>0?(cH+cBB)/(cAB+cBB):0;
      return {game:selLabels[i].opp.split(" ")[0],avg:parseFloat(cavg.toFixed(3)),obp:parseFloat(cobp.toFixed(3)),rd:cRD,r:selGbg[i],opp_r:selOpp[i],result:selResults[i]};
    });
  })();

  // Win/loss splits
  const wSplit=["W","L","T"].map(res=>{
    const gs=selTeam.filter((_,i)=>selResults[i]===res);
    const ab2=gs.reduce((s,g)=>s+g.ab,0),h2=gs.reduce((s,g)=>s+g.h,0);
    const r2=gs.reduce((s,g)=>s+g.r,0),bb2=gs.reduce((s,g)=>s+g.bb,0),so2=gs.reduce((s,g)=>s+g.so,0);
    return {res,games:gs.length,avg:ab2>0?h2/ab2:0,rpg:gs.length>0?r2/gs.length:0,bb:bb2,so:so2};
  });

  // Run thresholds (over selected games)
  const thresholds=[
    {label:"Score 10+",wins:selResults.filter((r,i)=>selGbg[i]>=10&&r==="W").length,losses:selResults.filter((r,i)=>selGbg[i]>=10&&r==="L").length,ties:selResults.filter((r,i)=>selGbg[i]>=10&&r==="T").length,games:selGbg.filter(v=>v>=10).length},
    {label:"Score 6+", wins:selResults.filter((r,i)=>selGbg[i]>=6&&r==="W").length, losses:selResults.filter((r,i)=>selGbg[i]>=6&&r==="L").length, ties:selResults.filter((r,i)=>selGbg[i]>=6&&r==="T").length, games:selGbg.filter(v=>v>=6).length},
    {label:"Score 5+", wins:selResults.filter((r,i)=>selGbg[i]>=5&&r==="W").length, losses:selResults.filter((r,i)=>selGbg[i]>=5&&r==="L").length, ties:selResults.filter((r,i)=>selGbg[i]>=5&&r==="T").length, games:selGbg.filter(v=>v>=5).length},
    {label:"Score <5", wins:selResults.filter((r,i)=>selGbg[i]<5&&r==="W").length,  losses:selResults.filter((r,i)=>selGbg[i]<5&&r==="L").length, ties:selResults.filter((r,i)=>selGbg[i]<5&&r==="T").length, games:selGbg.filter(v=>v<5).length},
  ];

  const last3=selTeam.slice(-3);
  const l3H=last3.reduce((s,g)=>s+g.h,0),l3AB=last3.reduce((s,g)=>s+g.ab,0);
  const l3R=last3.reduce((s,g)=>s+g.r,0);

  const CustomDot=({cx,cy,payload})=>{
    const col=payload.result==="W"?C.green:payload.result==="L"?C.red:C.accent;
    return <circle cx={cx} cy={cy} r={5} fill={col} stroke={C.bg} strokeWidth={2}/>;
  };

  const recordStr = `${wins}-${losses}${ties>0?`-${ties}`:""}`;

  return (
    <Panel style={{gridColumn:"1 / -1",borderColor:`${C.blue}55`,borderWidth:2}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:`${C.blue}22`,border:`2px solid ${C.blue}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:C.blue}}>29</div>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:C.text,lineHeight:1}}>GBG Colorado 2029 {!isAll && <span style={{fontSize:10,color:C.blue,fontWeight:700,marginLeft:6,letterSpacing:"0.08em"}}>FILTERED</span>}</div>
          <div style={{fontSize:12,color:C.subtext,marginTop:3}}>{isAll?"Team Season Stats":"Selected Games"} · {selectedIdx.length} Game{selectedIdx.length!==1?"s":""} · {recordStr}</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:20,alignItems:"center"}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.subtext}}>Last 3 {isAll?"games":"selected"}</div>
            <div style={{fontSize:18,fontWeight:800,color:l3R>=12?C.green:l3R>=6?C.accent:C.red}}>{l3AB>0?`${l3H}/${l3AB}`:"—"}</div>
            <div style={{fontSize:11,color:C.subtext}}>{l3AB>0?(l3H/l3AB).toFixed(3):".000"} · {l3R} runs</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.subtext}}>Run diff</div>
            <div style={{fontSize:18,fontWeight:800,color:totScored>totAllowed?C.green:C.red}}>{totScored>totAllowed?"+":""}{totScored-totAllowed}</div>
            <div style={{fontSize:11,color:C.subtext}}>{totScored}–{totAllowed}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:C.subtext}}>BB/SO</div>
            <div style={{fontSize:18,fontWeight:800,color:totSO>0&&totBB/totSO>=0.9?C.green:C.accent}}>{totBB}/{totSO}</div>
            <div style={{fontSize:11,color:C.subtext}}>{totSO>0?(totBB/totSO).toFixed(2):"—"} ratio</div>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:8,marginBottom:20,background:`${C.blue}0a`,borderRadius:8,padding:"14px 10px",border:`1px solid ${C.blue}22`}}>
        <Stat label="AVG"   value={avg.toFixed(3)}  color={C.blue}/>
        <Stat label="OBP"   value={obp.toFixed(3)}/>
        <Stat label="SLG"   value={slg.toFixed(3)}/>
        <Stat label="OPS"   value={ops.toFixed(3)}/>
        <Stat label="Runs"  value={totScored}/>
        <Stat label="RBI"   value={totRBI}/>
        <Stat label="BB"    value={totBB}/>
        <Stat label="K"     value={totSO}/>
      </div>

      {/* Charts row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div>
          <Label>Team Cumulative AVG &amp; OBP</Label>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={rolling} margin={{top:5,right:5,bottom:5,left:-20}}>
              <XAxis dataKey="game" tick={{fill:C.subtext,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0.150,0.400]} tick={{fill:C.subtext,fontSize:9}} axisLine={false} tickLine={false} tickFormatter={v=>v.toFixed(2)}/>
              <ReferenceLine y={0.270} stroke={C.green} strokeDasharray="4 2" strokeWidth={1}/>
              <Tooltip contentStyle={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={(v,n)=>[v.toFixed(3),n==="avg"?"Team AVG":"OBP"]}/>
              <Line type="monotone" dataKey="avg" stroke={C.blue} strokeWidth={2.5} dot={<CustomDot/>} activeDot={{r:6}}/>
              <Line type="monotone" dataKey="obp" stroke={C.teal} strokeWidth={1.5} dot={false} strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{fontSize:9,color:C.muted,textAlign:"center"}}>Blue=AVG · Teal=OBP · Green line=.270{!isAll && " · over selected games"}</div>
        </div>
        <div>
          <Label>Run Differential — Cumulative</Label>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={rolling} margin={{top:5,right:5,bottom:5,left:-20}}>
              <XAxis dataKey="game" tick={{fill:C.subtext,fontSize:9}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.subtext,fontSize:9}} axisLine={false} tickLine={false}/>
              <ReferenceLine y={0} stroke={C.muted} strokeWidth={1}/>
              <Tooltip contentStyle={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={v=>[`${v>=0?"+":""}${v}`,"Run Diff"]}/>
              <Line type="monotone" dataKey="rd" stroke={C.green} strokeWidth={2.5} dot={<CustomDot/>} activeDot={{r:6}} fill={C.green}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{fontSize:9,color:C.muted,textAlign:"center"}}>Cumulative run differential over {isAll?"the season":"selected games"}</div>
        </div>
      </div>

      {/* Win/Loss splits + Run thresholds */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div>
          <Label>Team Batting Splits by Result</Label>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {wSplit.map(s=>{
              const col=s.res==="W"?C.green:s.res==="L"?C.red:C.accent;
              return (
                <div key={s.res} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:`${col}0d`,borderRadius:8,border:`1px solid ${col}30`}}>
                  <div style={{width:28,height:28,borderRadius:"50%",background:`${col}22`,border:`1px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:col,flexShrink:0}}>{s.res}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:C.subtext}}>{s.games} game{s.games!==1?"s":""} · {s.rpg.toFixed(1)} R/game</div>
                    <div style={{fontSize:9,color:C.muted}}>{s.bb} BB · {s.so} SO</div>
                  </div>
                  <div style={{fontSize:20,fontWeight:800,color:col}}>{fmt(s.avg)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <Label>Win % by Runs Scored</Label>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {thresholds.map(t=>{
              const pct=t.games>0?t.wins/t.games:0;
              const col=pct>=0.800?C.green:pct>=0.500?C.accent:C.red;
              return (
                <div key={t.label} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:`${C.border}50`,borderRadius:8}}>
                  <div style={{fontSize:11,color:C.text,minWidth:70}}>{t.label}</div>
                  <div style={{flex:1,height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct*100}%`,height:"100%",background:col,borderRadius:3}}/>
                  </div>
                  <div style={{fontSize:12,fontWeight:700,color:col,minWidth:40,textAlign:"right"}}>{t.wins}-{t.losses}{t.ties>0?`-${t.ties}`:""}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Runs per game */}
      <div>
        <Label>Runs Scored vs Allowed — Per Game</Label>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={rolling} margin={{top:5,right:5,bottom:5,left:-25}}>
            <XAxis dataKey="game" tick={{fill:C.subtext,fontSize:9}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.subtext,fontSize:9}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:11}} formatter={(v,n)=>[v,n==="r"?"GBG":"Opp"]}/>
            <Bar dataKey="r" name="GBG" radius={[3,3,0,0]}>{rolling.map((d,i)=><Cell key={i} fill={d.result==="W"?C.green:d.result==="L"?C.red:C.accent}/>)}</Bar>
            <Bar dataKey="opp_r" name="Opp" fill={C.muted} radius={[3,3,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Game log */}
      <div style={{marginTop:14}}>
        <Label>Game Log {!isAll && <span style={{color:C.blue,marginLeft:6,fontSize:9,letterSpacing:"normal",textTransform:"none",fontWeight:500}}>· {selectedIdx.length} selected</span>}</Label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {selTeam.map((gm,i)=>{
            const res=selResults[i];
            const rc=res==="W"?C.green:res==="L"?C.red:C.accent;
            const ga=gm.ab>0?gm.h/gm.ab:0;
            return (
              <div key={i} style={{background:`${rc}12`,border:`1px solid ${rc}55`,borderRadius:7,padding:"5px 9px",minWidth:60,textAlign:"center"}}>
                <div style={{fontSize:8,color:C.subtext,marginBottom:1}}>{selLabels[i].opp.split(" ")[0]}</div>
                <div style={{fontSize:9,fontWeight:700,color:rc,marginBottom:2}}>{res} {selLabels[i].score}</div>
                <div style={{fontSize:12,fontWeight:700,color:ga>=0.333?C.green:ga>0?C.accent:C.subtext}}>{gm.h}/{gm.ab}</div>
                <div style={{fontSize:8,color:C.subtext}}>{gm.r}R · {gm.rbi}RBI</div>
                <div style={{fontSize:8,color:C.muted}}>{ga>0?ga.toFixed(3):".000"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// ── PLAYER POPUP (full stats) ────────────────────────────────────────────────
function PlayerPopup({ player, onClose }) {
  const p = ROSTER.find(r => r.name === player.name);
  const pitch = PITCHING.find(r => r.name === player.name);
  const log = PLAYER_GAME_LOG[player.name] || [];
  if (!p) return null;

  // Rolling batting AVG
  let cumH=0, cumAB=0;
  const rollingBat = log.map((gm,i)=>{
    cumH+=gm.h; cumAB+=gm.ab;
    return { game:GAMES[i].opp.split(" ")[0], avg:cumAB>0?parseFloat((cumH/cumAB).toFixed(3)):0, h:gm.h, ab:gm.ab, result:GAMES[i].result };
  });

  // Rolling pitching ERA (if they pitched)
  const pitchGames = pitch ? (() => {
    // Per-game pitching from raw pitch data embedded in PITCHING
    // We approximate with season ERA line — show static bar for now
    return null;
  })() : null;

  const _ppL3=last3InLineup(p.name);
  const last3H=_ppL3.h, last3AB=_ppL3.ab;

  const BatDot=({cx,cy,payload})=>{
    const col=payload.result==="W"?C.green:payload.result==="L"?C.red:C.accent;
    return <circle cx={cx} cy={cy} r={4} fill={col} stroke={C.bg} strokeWidth={2}/>;
  };

  const isGrayson = p.name==="G Watkins";
  const accentCol = isGrayson ? C.accent : C.blue;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.80)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}} onClick={onClose}>
      <div style={{background:C.panel,border:`2px solid ${accentCol}55`,borderRadius:16,padding:"22px 24px",width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.7)"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:`${accentCol}22`,border:`2px solid ${accentCol}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:accentCol,flexShrink:0}}>{p.num}</div>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:isGrayson?C.accent:C.text,lineHeight:1}}>{p.name}</div>
            <div style={{fontSize:11,color:C.subtext,marginTop:2}}>#{p.num} · {p.g} games played</div>
          </div>
          <button onClick={onClose} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.border}`,color:C.subtext,borderRadius:6,width:30,height:30,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
        </div>

        {/* Batting stat strip */}
        <div style={{background:`${accentCol}08`,border:`1px solid ${accentCol}20`,borderRadius:10,padding:"12px 10px",marginBottom:16}}>
          <div style={{fontSize:9,color:accentCol,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Batting</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:10}}>
            {[
              {label:"AVG", value:p.avg.toFixed(3), color:p.avg>=0.350?C.green:p.avg>=0.250?C.text:C.muted},
              {label:"OBP", value:p.obp.toFixed(3), color:p.obp>=0.400?C.green:C.text},
              {label:"SLG", value:p.slg.toFixed(3), color:C.text},
              {label:"OPS", value:p.ops.toFixed(3), color:p.ops>=1.0?C.green:p.ops>=0.700?C.teal:C.muted},
              {label:"Last 3", value:last3AB>0?`${last3H}/${last3AB}`:"—", color:last3AB>0&&last3H/last3AB>=0.300?C.green:C.accent},
            ].map(s=>(
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:9,color:C.muted,marginTop:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {[
              {label:"G",  value:p.g},  {label:"AB",value:p.ab}, {label:"H", value:p.h},
              {label:"2B", value:p.d},  {label:"3B",value:p.t},  {label:"HR",value:p.hr},
              {label:"RBI",value:p.rbi},{label:"BB",value:p.bb}, {label:"SO",value:p.so},
              {label:"HBP",value:p.hbp},{label:"SF",value:p.sf}, {label:"TB",value:p.tb},
              {label:"SB", value:p.sb}, {label:"R", value:p.r},
            ].map(s=>(
              <div key={s.label} style={{textAlign:"center",padding:"5px 2px",background:`${C.border}40`,borderRadius:5}}>
                <div style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:8,color:C.muted,marginTop:2,textTransform:"uppercase"}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rolling AVG chart */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:10,fontWeight:600,color:C.subtext,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Cumulative AVG — Game by Game</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={rollingBat} margin={{top:4,right:8,bottom:4,left:-22}}>
              <XAxis dataKey="game" tick={{fill:C.subtext,fontSize:8}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,Math.max(0.550,Math.ceil(p.avg*10)/10+0.1)]} tick={{fill:C.subtext,fontSize:8}} axisLine={false} tickLine={false} tickFormatter={v=>v.toFixed(2)}/>
              <ReferenceLine y={TEAM_SEASON_AVG} stroke={C.green} strokeDasharray="4 2" strokeWidth={1}/>
              <Tooltip contentStyle={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:10}} formatter={v=>[v.toFixed(3),"Cum AVG"]} labelFormatter={(lbl,pl)=>{const d=pl?.[0]?.payload; return d?`${lbl} · ${d.h}/${d.ab} · ${d.result}`:lbl;}}/>
              <Line type="monotone" dataKey="avg" stroke={accentCol} strokeWidth={2.5} dot={<BatDot/>} activeDot={{r:6,fill:accentCol}}/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{fontSize:8,color:C.muted,textAlign:"center"}}>Green=W · Red=L · Amber=T · Green line=team season AVG</div>
        </div>

        {/* Game-by-game boxes */}
        <div style={{marginBottom: pitch ? 16 : 0}}>
          <div style={{fontSize:10,fontWeight:600,color:C.subtext,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>Game Log</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {log.map((gm,i)=>{
              const res=GAMES[i].result;
              const rc=res==="W"?C.green:res==="L"?C.red:C.accent;
              const hc=gm.ab===0?C.muted:gm.h>0?C.accent:C.subtext;
              return (
                <div key={i} style={{background:`${rc}12`,border:`1px solid ${rc}40`,borderRadius:6,padding:"4px 6px",textAlign:"center",minWidth:40}}>
                  <div style={{fontSize:7,color:C.subtext,marginBottom:1}}>{GAMES[i].opp.split(" ")[0]}</div>
                  <div style={{fontSize:8,fontWeight:700,color:rc}}>{res}</div>
                  <div style={{fontSize:11,fontWeight:700,color:hc}}>{gm.ab===0?"—":`${gm.h}/${gm.ab}`}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pitching section — only if they pitched */}
        {pitch && (
          <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:9,color:C.blue,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Pitching</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
              {[
                {label:"ERA",  value:pitch.era.toFixed(2), color:pitch.era<3?C.green:pitch.era<6?C.accent:C.red},
                {label:"WHIP", value:pitch.whip.toFixed(2),color:pitch.whip<1.3?C.green:pitch.whip<1.8?C.accent:C.red},
                {label:"K/9",  value:pitch.k9.toFixed(1),  color:pitch.k9>=10?C.green:C.teal},
                {label:"IP",   value:pitch.ip,              color:C.text},
              ].map(s=>(
                <div key={s.label} style={{textAlign:"center",padding:"8px 4px",background:`${C.blue}10`,border:`1px solid ${C.blue}20`,borderRadius:8}}>
                  <div style={{fontSize:20,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4,marginBottom:12}}>
              {[
                {label:"G",  value:pitch.g},   {label:"H",  value:pitch.h},
                {label:"R",  value:pitch.r},   {label:"ER", value:pitch.er},
                {label:"BB", value:pitch.bb},  {label:"SO", value:pitch.so},
                {label:"HBP",value:pitch.hbp}, {label:"P",  value:pitch.pitches},
                {label:"S",  value:pitch.strikes},{label:"S%",value:`${(pitch.strikes/pitch.pitches*100).toFixed(0)}%`},
              ].map(s=>(
                <div key={s.label} style={{textAlign:"center",padding:"5px 2px",background:`${C.border}40`,borderRadius:5}}>
                  <div style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:8,color:C.muted,marginTop:2,textTransform:"uppercase"}}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* ERA / K9 visual bars */}
            {[
              {label:"ERA",  val:pitch.era,   max:12,  good:3,  ok:6,  unit:""},
              {label:"K/9",  val:pitch.k9,    max:20,  good:10, ok:6,  unit:"",  invert:true},
              {label:"Strike%", val:pitch.strikes/pitch.pitches*100, max:100, good:62, ok:55, unit:"%", invert:true},
            ].map(m=>{
              const pct = Math.min(m.val/m.max,1);
              const col = m.invert
                ? (m.val>=m.good?C.green:m.val>=m.ok?C.accent:C.red)
                : (m.val<=m.good?C.green:m.val<=m.ok?C.accent:C.red);
              return (
                <div key={m.label} style={{marginBottom:6}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:9,color:C.subtext,textTransform:"uppercase",letterSpacing:"0.06em"}}>{m.label}</span>
                    <span style={{fontSize:9,fontWeight:700,color:col}}>{typeof m.val==="number"?m.val.toFixed(1):m.val}{m.unit}</span>
                  </div>
                  <div style={{height:5,background:C.border,borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${pct*100}%`,height:"100%",background:col,borderRadius:3}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{marginTop:14,fontSize:9,color:C.muted,textAlign:"center"}}>Tap outside to close</div>
      </div>
    </div>
  );
}

// ── PLAYER ROSTER TILES ───────────────────────────────────────────────────────
function PlayerRosterTiles({ onSelect }) {
  const order = [...ROSTER].sort((a,b) => a.num - b.num);
  return (
    <div style={{maxWidth:1100,margin:"20px auto 0"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{height:2,width:20,background:C.accent,borderRadius:2}}/>
        <div style={{fontSize:13,fontWeight:800,color:C.accent,textTransform:"uppercase",letterSpacing:"0.1em"}}>Player Cards</div>
        <div style={{flex:1,height:1,background:C.border}}/>
        <div style={{fontSize:10,color:C.muted}}>Tap any player for full season stats</div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {order.map(p => {
          const isPitcher = !!PITCHING.find(r=>r.name===p.name);
          const isGrayson = p.name==="G Watkins";
          const _l3=last3InLineup(p.name);
          const recentH=_l3.h;
          const recentAB=_l3.ab;
          const recentAvgVal = recentAB>0?recentH/recentAB:0;
          const hot = recentAvgVal>=0.333 && recentAB>=2;
          const cold = recentAvgVal===0 && recentAB>=3;
          const accentColor = isGrayson?C.accent:hot?C.green:cold?C.red:C.border;
          const avgColor = p.avg>=0.350?C.green:p.avg>=0.250?C.text:C.muted;

          return (
            <div key={p.name} onClick={()=>onSelect(p)}
              style={{
                background:C.panel, border:`2px solid ${accentColor}`,
                borderRadius:10, padding:"10px 8px", width:72, textAlign:"center",
                cursor:"pointer", transition:"transform 0.15s, border-color 0.15s",
                flexShrink:0, position:"relative",
              }}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=isGrayson?C.accent:C.blue;}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor=accentColor;}}
            >
              {/* Jersey number */}
              <div style={{width:36,height:36,borderRadius:"50%",background:isGrayson?`${C.accent}22`:`${C.blue}15`,border:`2px solid ${isGrayson?C.accent:C.blue}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px",fontSize:14,fontWeight:900,color:isGrayson?C.accent:C.blue}}>
                {p.num}
              </div>
              {/* Name */}
              <div style={{fontSize:9,fontWeight:700,color:isGrayson?C.accent:C.text,lineHeight:1.2,marginBottom:4}}>
                {p.name.split(" ")[1]||p.name}
              </div>
              {/* AVG */}
              <div style={{fontSize:12,fontWeight:800,color:avgColor,marginBottom:2}}>
                {p.avg.toFixed(3)}
              </div>
              {/* OPS */}
              <div style={{fontSize:9,color:C.subtext}}>{p.ops.toFixed(3)}</div>
              {/* Hot/cold indicator */}
              {hot && <div style={{position:"absolute",top:4,right:4,fontSize:8}}>🔥</div>}
              {cold && recentAB>=3 && <div style={{position:"absolute",top:4,right:4,fontSize:8}}>❄</div>}
              {/* Pitcher badge */}
              {isPitcher && <div style={{marginTop:4,fontSize:7,color:C.blue,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase"}}>P</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── HOT/COLD ─────────────────────────────────────────────────────────────────

function HotColdSection({ selectedIdx }) {
  const isAll = selectedIdx.length === GAMES.length;

  // Compute each player's H/AB:
  // - Unfiltered (default): use last-3-games data from GAME_BATTING/GAME_AB
  // - Filtered: sum PLAYER_GAME_LOG over selected games
  const withScore = ROSTER.map(p => {
    let h, ab, avg, score;
    if (isAll) {
      const l3 = last3InLineup(p.name);
      h = l3.h; ab = l3.ab;
      avg = ab > 0 ? h / ab : 0;
      score = avg;
    } else {
      const s = playerSubsetStats(p.name, selectedIdx);
      h = s.h; ab = s.ab; avg = s.avg;
      score = avg;
    }
    return {...p, recentAvg: avg, recentH: h, recentAB: ab, hotScore: score};
  }).filter(p => p.recentAB > 0);

  const sorted = [...withScore].sort((a,b)=>b.hotScore - a.hotScore);
  const hot  = sorted.slice(0,4);
  const cold = [...withScore].filter(p => p.recentAB >= 3).sort((a,b)=>a.hotScore - b.hotScore).slice(0,3);

  const subtitleSuffix = isAll
    ? "Last 3 Games"
    : `Selected ${selectedIdx.length} Game${selectedIdx.length!==1?"s":""}`;
  const formCountLabel = isAll ? "last 3" : `over ${selectedIdx.length}`;

  const Card=({p,isHot})=>{
    const col=isHot?C.green:C.red;
    const isGrayson=p.name==="G Watkins";
    return (
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:`${col}0d`,borderRadius:8,border:`1px solid ${isGrayson?C.accent:col}${isGrayson?"":30}`,borderWidth:isGrayson?2:1}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:`${isGrayson?C.accent:col}22`,border:`1px solid ${isGrayson?C.accent:col}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:isGrayson?C.accent:col,flexShrink:0}}>{p.num}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:isGrayson?C.accent:C.text}}>{p.name}</div>
          <div style={{fontSize:10,color:C.subtext}}>{p.recentH}-for-{p.recentAB} {formCountLabel}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:16,fontWeight:800,color:isGrayson?C.accent:col}}>{fmt(p.recentAvg)}</div>
          <div style={{fontSize:9,color:C.muted}}>{isAll?"recent avg":"sel avg"}</div>
        </div>
      </div>
    );
  };

  return (
    <Panel>
      <Label size={12} color={C.text}>Recent Form · {subtitleSuffix}</Label>
      {selectedIdx.length === 0 ? (
        <div style={{padding:"40px 12px",textAlign:"center",color:C.muted,fontSize:12}}>No games selected.</div>
      ) : (
        <>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.green,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>🔥 Running Hot</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>{hot.map(p=><Card key={p.name} p={p} isHot/>)}</div>
          </div>
          <div>
            <div style={{fontSize:10,color:C.red,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>❄ Running Cold</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>{cold.map(p=><Card key={p.name} p={p} isHot={false}/>)}</div>
          </div>
        </>
      )}
    </Panel>
  );
}

// ── TEAM OPS CHART ────────────────────────────────────────────────────────────
function TeamOPSChart({ isFiltered }) {
  const sorted=[...ROSTER].sort((a,b)=>b.ops-a.ops);
  const data=sorted.map(p=>({name:p.name.split(" ")[1]||p.name,ops:parseFloat(p.ops.toFixed(3)),isGrayson:p.name==="G Watkins"}));
  return (
    <Panel>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:0}}>
        <Label size={12} color={C.text} style={{marginBottom:0}}>Team OPS Rankings</Label>
        {isFiltered && <SeasonBadge/>}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} layout="vertical" margin={{top:0,right:40,bottom:0,left:10}}>
          <XAxis type="number" domain={[0,1.4]} tick={{fill:C.subtext,fontSize:10}} axisLine={false} tickLine={false}/>
          <YAxis type="category" dataKey="name" tick={{fill:C.subtext,fontSize:10}} axisLine={false} tickLine={false} width={58}/>
          <ReferenceLine x={0.800} stroke={C.muted} strokeDasharray="3 2"/>
          <Tooltip contentStyle={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={v=>[v.toFixed(3),"OPS"]}/>
          <Bar dataKey="ops" radius={[0,4,4,0]}>
            {data.map((d,i)=><Cell key={i} fill={d.isGrayson?C.accent:d.ops>=1.0?C.green:d.ops>=0.700?C.blue:C.muted}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div style={{fontSize:10,color:C.muted,marginTop:4}}>
        <span style={{color:C.accent}}>■</span> Grayson &nbsp;<span style={{color:C.green}}>■</span> OPS≥1.000 &nbsp;<span style={{color:C.blue}}>■</span> OPS≥.700
      </div>
    </Panel>
  );
}

// ── PITCH COUNT / LOAD ────────────────────────────────────────────────────────
function PitchLoadTable({ isFiltered }) {
  // sortKey: column key | null = default (last name)
  // sortDir: 1 = high→low, -1 = low→high
  // Cycle: null → desc(1) → asc(-1) → null
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  const lastName = name => name.split(" ").slice(-1)[0];

  const handleSort = key => {
    if (sortKey !== key) { setSortKey(key); setSortDir(1); }
    else if (sortDir === 1) { setSortDir(-1); }
    else { setSortKey(null); setSortDir(1); }
  };

  const getValue = (p, key) => {
    if (key === "spct") return p.strikes / p.pitches * 100;
    if (key === "pip")  return p.pitches / ipdec(p.ip);
    if (key === "ip")   return ipdec(p.ip);
    return p[key];
  };

  const sorted = [...PITCHING].sort((a, b) => {
    if (!sortKey) return lastName(a.name).localeCompare(lastName(b.name));
    const av = getValue(a, sortKey), bv = getValue(b, sortKey);
    return (av < bv ? 1 : av > bv ? -1 : 0) * sortDir;
  });

  const SortTh = ({ label, k, left }) => {
    const active = sortKey === k;
    const arrow = active ? (sortDir === 1 ? " ↓" : " ↑") : "";
    return (
      <th onClick={() => handleSort(k)} style={{
        padding:"5px 8px", textAlign: left ? "left" : "center",
        color: active ? C.accent : C.subtext, fontWeight:600, fontSize:10,
        textTransform:"uppercase", letterSpacing:"0.06em",
        borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap",
        cursor:"pointer", userSelect:"none",
        transition:"color 0.15s",
      }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.color=C.text; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.color=C.subtext; }}
      >{label}{arrow}</th>
    );
  };

  return (
    <Panel>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <Label size={12} color={C.text} style={{marginBottom:0}}>Pitching Load &amp; Efficiency</Label>
        {isFiltered && <SeasonBadge/>}
        {sortKey && (
          <button onClick={()=>{setSortKey(null);setSortDir(1);}} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:5,padding:"2px 8px",fontSize:10,cursor:"pointer"}}>
            Reset
          </button>
        )}
      </div>
      <div style={{fontSize:10,color:C.muted,marginBottom:8}}>Click any column header to sort · click again to reverse · third click resets</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr>
              <SortTh label="Pitcher"  k="name"   left />
              <SortTh label="G"        k="g"      />
              <SortTh label="IP"       k="ip"     />
              <SortTh label="Pitches"  k="pitches"/>
              <SortTh label="Strikes"  k="strikes"/>
              <SortTh label="Strike%"  k="spct"   />
              <SortTh label="P/IP"     k="pip"    />
              <SortTh label="ERA"      k="era"    />
              <SortTh label="K/9"      k="k9"     />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p,i)=>{
              const spct=(p.strikes/p.pitches*100).toFixed(1);
              const pip=(p.pitches/ipdec(p.ip)).toFixed(1);
              const loadCol=p.pitches>180?C.red:p.pitches>130?C.accent:C.green;
              const eraCol=p.era<3?C.green:p.era<6?C.accent:C.red;
              return (
                <tr key={i} style={{borderBottom:`1px solid ${C.border}22`}}>
                  <td style={{padding:"6px 8px",color:C.text,fontWeight:500}}>{p.name}</td>
                  <td style={{padding:"6px 8px",textAlign:"center",color:C.subtext}}>{p.g}</td>
                  <td style={{padding:"6px 8px",textAlign:"center",color:C.subtext}}>{p.ip}</td>
                  <td style={{padding:"6px 8px",textAlign:"center",fontWeight:700,color:loadCol}}>{p.pitches}</td>
                  <td style={{padding:"6px 8px",textAlign:"center",color:C.subtext}}>{p.strikes}</td>
                  <td style={{padding:"6px 8px",textAlign:"center",color:parseFloat(spct)>=60?C.green:parseFloat(spct)>=55?C.accent:C.red}}>{spct}%</td>
                  <td style={{padding:"6px 8px",textAlign:"center",color:C.subtext}}>{pip}</td>
                  <td style={{padding:"6px 8px",textAlign:"center",fontWeight:700,color:eraCol}}>{p.era.toFixed(2)}</td>
                  <td style={{padding:"6px 8px",textAlign:"center",color:C.teal}}>{p.k9.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{fontSize:10,color:C.muted,marginTop:8}}>Pitch load: <span style={{color:C.green}}>■</span> &lt;130 · <span style={{color:C.accent}}>■</span> 130-180 · <span style={{color:C.red}}>■</span> 180+ (monitor rest)</div>
    </Panel>
  );
}

// ── FULL ROSTER TABLE ─────────────────────────────────────────────────────────
function RosterTable({ selectedIdx }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState(1);

  const lastName = name => name.split(" ").slice(-1)[0];
  const isAll = selectedIdx.length === GAMES.length;

  const handleSort = key => {
    if (sortKey !== key) { setSortKey(key); setSortDir(1); }
    else if (sortDir === 1) { setSortDir(-1); }
    else { setSortKey(null); setSortDir(1); }
  };

  // Compute filtered roster from PLAYER_GAME_LOG when not showing all games
  const filteredRoster = isAll ? ROSTER.map(p => ({...p, pa: p.ab + p.bb + p.hbp + p.sf})) : ROSTER.map(p => {
    const log = PLAYER_GAME_LOG[p.name] || [];
    let h=0,ab=0,r=0,d=0,t=0,hr=0,rbi=0,bb=0,hbp=0,sf=0,so=0,sb=0,gp=0;
    selectedIdx.forEach(i => {
      const gm = log[i]; if (!gm) return;
      if ((gm.ab||0)+(gm.bb||0)+(gm.hbp||0)+(gm.sf||0) > 0) gp++;
      h+=gm.h||0; ab+=gm.ab||0; r+=gm.r||0; d+=gm.d||0; t+=gm.t||0; hr+=gm.hr||0;
      rbi+=gm.rbi||0; bb+=gm.bb||0; hbp+=gm.hbp||0; sf+=gm.sf||0; so+=gm.so||0; sb+=gm.sb||0;
    });
    const singles = h - d - t - hr;
    const tb = singles + 2*d + 3*t + 4*hr;
    const avg = ab>0 ? h/ab : 0;
    const pa = ab + bb + hbp + sf;
    const obp = pa>0 ? (h+bb+hbp)/pa : 0;
    const slg = ab>0 ? tb/ab : 0;
    const ops = obp + slg;
    return {name:p.name, num:p.num, g:gp, ab, pa, r, h, d, t, hr, tb, rbi, bb, hbp, sf, so, sb, avg, obp, slg, ops};
  });

  // Separate TEAM row from regular players for sorting
  const teamRow = filteredRoster.find(p => p.name === "TEAM");
  const playersOnly = filteredRoster.filter(p => p.name !== "TEAM");
  
  const sortedPlayers = [...playersOnly].sort((a, b) => {
    if (!sortKey) return lastName(a.name).localeCompare(lastName(b.name));
    const av = a[sortKey], bv = b[sortKey];
    return (av < bv ? 1 : av > bv ? -1 : 0) * sortDir;
  });
  
  // Append TEAM row at the end (always at bottom)
  const sorted = teamRow ? [...sortedPlayers, teamRow] : sortedPlayers;

  // Column definitions: key matches ROSTER field, label = header text
  const COLS = [
    {key:"name",  label:"Player", left:true, sticky:true},
    {key:"g",     label:"G"},
    {key:"ab",    label:"AB"},
    {key:"pa",    label:"PA"},
    {key:"r",     label:"R"},
    {key:"h",     label:"H"},
    {key:"d",     label:"2B"},
    {key:"t",     label:"3B"},
    {key:"hr",    label:"HR"},
    {key:"tb",    label:"TB"},
    {key:"rbi",   label:"RBI"},
    {key:"bb",    label:"BB"},
    {key:"hbp",   label:"HBP"},
    {key:"sf",    label:"SF"},
    {key:"so",    label:"SO"},
    {key:"sb",    label:"SB"},
    {key:"avg",   label:"AVG"},
    {key:"obp",   label:"OBP"},
    {key:"slg",   label:"SLG"},
    {key:"ops",   label:"OPS"},
  ];

  const SortTh = ({col}) => {
    const active = sortKey === col.key;
    const isDefault = !sortKey && col.key === "name";
    const arrow = active ? (sortDir === 1 ? " ↓" : " ↑") : isDefault ? " ↓" : "";
    const colColor = active ? C.accent : isDefault ? C.accent+"99" : C.subtext;
    return (
      <th onClick={() => handleSort(col.key)} style={{
        padding:"5px 8px", textAlign: col.left ? "left" : "center",
        color: colColor, fontWeight:600, fontSize:10,
        textTransform:"uppercase", letterSpacing:"0.06em",
        borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap",
        cursor:"pointer", userSelect:"none",
        ...(col.sticky ? {position:"sticky",left:0,zIndex:2,background:C.panel,borderRight:`1px solid ${C.border}`} : {}),
      }}
        onMouseEnter={e=>{ if(!active) e.currentTarget.style.color=C.text; }}
        onMouseLeave={e=>{ if(!active) e.currentTarget.style.color=colColor; }}
      >{col.label}{arrow}</th>
    );
  };

  return (
    <Panel style={{gridColumn:"1 / -1"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
        <Label size={12} color={C.text} style={{marginBottom:0}}>Full Batting Roster</Label>
        {!isAll && <span style={{fontSize:10,color:C.accent,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>· {selectedIdx.length} game{selectedIdx.length!==1?"s":""} selected</span>}
        {sortKey && (
          <button onClick={()=>{setSortKey(null);setSortDir(1);}} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.border}`,color:C.muted,borderRadius:5,padding:"2px 8px",fontSize:10,cursor:"pointer"}}>
            Reset to last name
          </button>
        )}
      </div>
      <div style={{fontSize:10,color:C.muted,marginBottom:8}}>Click any column header to sort ↓ · click again to reverse ↑ · third click resets to last name</div>
      <div style={{overflowX:"auto",position:"relative"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr>{COLS.map(col => <SortTh key={col.key} col={col}/>)}</tr>
          </thead>
          <tbody>
            {sorted.map((p,i)=>{
              const isGrayson=p.name==="G Watkins";
              const isTeam = p.name === "TEAM";
              return (
                <tr key={i} style={{background:isTeam?`${C.accent}05`:isGrayson?`${C.accent}10`:"transparent",borderBottom:isTeam?`2px solid ${C.border}`:`1px solid ${C.border}22`,borderTop:isTeam?`2px solid ${C.border}`:"none",fontWeight:isTeam?600:isGrayson?700:400}}>
                  <td style={{padding:"7px 8px",fontWeight:isTeam?600:isGrayson?700:400,color:isTeam?C.accent:isGrayson?C.accent:C.text,whiteSpace:"nowrap",position:"sticky",left:0,zIndex:1,background:isTeam?`${C.accent}05`:isGrayson?"#1a1200":C.panel,borderRight:`1px solid ${C.border}`}}>{p.name} <span style={{color:C.muted,fontSize:10,marginLeft:2}}>#{p.num}</span></td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.g}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.ab}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.pa}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.r}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.text}}>{p.h}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.d}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.t}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.hr}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.tb}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.text,fontWeight:600}}>{p.rbi}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.bb}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.hbp}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.sf}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.so}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{p.sb}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",fontWeight:700,color:p.avg>=0.350?C.green:p.avg>=0.250?C.text:C.muted}}>{fmt(p.avg)}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",fontWeight:600,color:p.obp>=0.400?C.green:C.subtext}}>{fmt(p.obp)}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",color:C.subtext}}>{fmt(p.slg)}</td>
                  <td style={{padding:"7px 8px",textAlign:"center",fontWeight:700,color:p.ops>=1.0?C.green:p.ops>=0.700?C.teal:C.muted}}>{fmt(p.ops)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ── TOURNAMENT SELECTOR ───────────────────────────────────────────────────────
function TournamentSelector({ selectedTournament, setSelectedTournament, setSelectedIdx }) {
  const allIdx = GAMES.map((_,i)=>i);
  
  const handleTournament = (tournamentId) => {
    if (selectedTournament === tournamentId) {
      // Clicking same tournament again: show all games
      setSelectedTournament(null);
      setSelectedIdx(allIdx);
    } else {
      // Select this tournament
      setSelectedTournament(tournamentId);
      const t = TOURNAMENTS.find(x => x.id === tournamentId);
      if (t) setSelectedIdx(t.games);
    }
  };

  return (
    <div style={{maxWidth:1100,margin:"0 auto 16px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={{height:2,width:20,background:C.accent,borderRadius:2}}/>
        <div style={{fontSize:13,fontWeight:800,color:C.accent,textTransform:"uppercase",letterSpacing:"0.1em"}}>Tournaments</div>
        <div style={{flex:1,height:1,background:C.border}}/>
        <div style={{fontSize:10,color:C.muted}}>Tap to filter by tournament · tap again to reset</div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {TOURNAMENTS.map(t => {
          const isActive = selectedTournament === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTournament(t.id)}
              style={{
                background: isActive ? `${t.color}22` : C.panel,
                border: `2px solid ${isActive ? t.color : C.border}`,
                color: isActive ? t.color : C.text,
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: isActive ? 700 : 600,
                cursor: "pointer",
                transition: "all 0.15s",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
              onMouseEnter={e=>{
                if(!isActive) e.currentTarget.style.borderColor = t.color;
              }}
              onMouseLeave={e=>{
                if(!isActive) e.currentTarget.style.borderColor = C.border;
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── GAME SELECTOR ─────────────────────────────────────────────────────────────
function GameSelector({ selectedIdx, setSelectedIdx }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const allIdx = GAMES.map((_,i)=>i);
  const isAll  = selectedIdx.length === GAMES.length;
  const isNone = selectedIdx.length === 0;

  const toggle = i => setSelectedIdx(s =>
    s.includes(i) ? s.filter(x=>x!==i) : [...s, i].sort((a,b)=>a-b)
  );
  const setAll  = () => setSelectedIdx(allIdx);
  const setNone = () => setSelectedIdx([]);
  const setWins   = () => setSelectedIdx(allIdx.filter(i=>GAMES[i].result==="W"));
  const setLosses = () => setSelectedIdx(allIdx.filter(i=>GAMES[i].result==="L"));
  const setLast5  = () => setSelectedIdx(allIdx.slice(-5));

  const quickBtn = (label, fn, active=false) => (
    <button key={label} onClick={fn} style={{
      background: active ? `${C.accent}22` : C.bg,
      border:`1px solid ${active?C.accent:C.border}`,
      color: active ? C.accent : C.text,
      borderRadius:6, padding:"5px 10px", fontSize:10, fontWeight:700,
      cursor:"pointer", letterSpacing:"0.06em", textTransform:"uppercase",
      transition:"border-color 0.15s, color 0.15s",
    }}>{label}</button>
  );

  const summary = isAll  ? `All ${GAMES.length} games`
                : isNone ? "No games"
                : `${selectedIdx.length} of ${GAMES.length} games`;

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        display:"flex", alignItems:"center", gap:8,
        background: isAll ? C.panel : `${C.accent}15`,
        border:`1px solid ${isAll?C.border:C.accent}`,
        color: isAll ? C.text : C.accent,
        borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600,
        cursor:"pointer",
      }}>
        <span style={{fontSize:11,letterSpacing:"0.08em",textTransform:"uppercase",color:isAll?C.subtext:C.accent,fontWeight:700}}>Games:</span>
        <span>{summary}</span>
        <span style={{fontSize:10,opacity:0.7}}>{open?"▴":"▾"}</span>
      </button>

      {open && (
        <div style={{
          position:"absolute", top:"100%", right:0, marginTop:6,
          background:C.panel, border:`1px solid ${C.border}`, borderRadius:10,
          padding:12, minWidth:340, zIndex:50,
          boxShadow:"0 12px 30px rgba(0,0,0,0.6)",
          maxHeight:"70vh", overflowY:"auto",
        }}>
          {/* Quick filters */}
          <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
            {quickBtn("All", setAll, isAll)}
            {quickBtn("None", setNone, isNone)}
            {quickBtn("Wins", setWins)}
            {quickBtn("Losses", setLosses)}
            {quickBtn("Last 5", setLast5)}
          </div>
          <div style={{height:1,background:C.border,margin:"4px 0 8px"}}/>
          {/* Game list — most recent first */}
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {[...allIdx].reverse().map(i => {
              const g = GAMES[i];
              const checked = selectedIdx.includes(i);
              const col = g.result==="W"?C.green:g.result==="L"?C.red:C.accent;
              return (
                <label key={i} style={{
                  display:"flex", alignItems:"center", gap:8,
                  padding:"6px 8px", cursor:"pointer", borderRadius:6,
                  background: checked ? `${C.border}40` : "transparent",
                  transition:"background 0.1s",
                }}
                  onMouseEnter={e=>{ if(!checked) e.currentTarget.style.background=`${C.border}20`; }}
                  onMouseLeave={e=>{ if(!checked) e.currentTarget.style.background="transparent"; }}
                >
                  <input type="checkbox" checked={checked} onChange={()=>toggle(i)} style={{accentColor:C.accent,cursor:"pointer"}}/>
                  <span style={{fontSize:11,color:C.muted,minWidth:28,fontWeight:600}}>#{g.id}</span>
                  <span style={{fontSize:11,color:C.subtext,minWidth:50}}>{g.date}</span>
                  <span style={{fontSize:11,color:C.text,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.opp}</span>
                  <span style={{fontSize:10,fontWeight:700,color:col,minWidth:50,textAlign:"right"}}>{g.result} {g.score}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const allIdx = GAMES.map((_,i)=>i);
  const [selectedIdx, setSelectedIdx] = useState(allIdx);
  const isFiltered = selectedIdx.length !== GAMES.length;

  // Record from selected games
  const selResults = selectedIdx.map(i => GAMES[i].result);
  const wins   = selResults.filter(r=>r==="W").length;
  const losses = selResults.filter(r=>r==="L").length;
  const ties   = selResults.filter(r=>r==="T").length;

  // Date range from selected games
  const dateRangeLabel = (() => {
    if (selectedIdx.length === 0) return "—";
    if (!isFiltered) return "May 30 – Jun 25";
    if (selectedIdx.length === 1) return GAMES[selectedIdx[0]].date;
    const first = GAMES[selectedIdx[0]].date;
    const last  = GAMES[selectedIdx[selectedIdx.length-1]].date;
    return `${first} – ${last}`;
  })();

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter',system-ui,sans-serif",color:C.text,padding:"20px 16px"}}>
      {selectedPlayer && <PlayerPopup player={selectedPlayer} onClose={()=>setSelectedPlayer(null)} />}
      {/* Header */}
      <div style={{maxWidth:1100,margin:"0 auto 14px"}}>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>GBG Colorado 2029</div>
            <div style={{fontSize:26,fontWeight:900,color:C.text,lineHeight:1}}>Season Dashboard</div>
          </div>
          <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}>
            {[{n:wins,l:"W",c:C.green},{n:losses,l:"L",c:C.red},{n:ties,l:"T",c:C.accent}].map(r=>(
              <div key={r.l} style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:900,color:r.c}}>{r.n}</div>
                <div style={{fontSize:10,color:C.subtext,textTransform:"uppercase"}}>{r.l}</div>
              </div>
            ))}
            <div style={{width:1,height:40,background:C.border,margin:"0 8px"}}/>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text}}>{selectedIdx.length} Game{selectedIdx.length!==1?"s":""}</div>
              <div style={{fontSize:10,color:C.subtext}}>{dateRangeLabel}</div>
            </div>
            <GameSelector selectedIdx={selectedIdx} setSelectedIdx={setSelectedIdx}/>
          </div>
        </div>
        {isFiltered && (
          <div style={{marginTop:10,fontSize:10,color:C.muted,display:"flex",alignItems:"center",gap:6}}>
            <span style={{color:C.accent}}>●</span>
            Filter active — Team &amp; Grayson panels, Hot/Cold, Batting Roster, and the header record reflect selected games. Panels marked <SeasonBadge/> show season totals (Pitching Load &amp; OPS rankings still by season).
            <button onClick={()=>{setSelectedIdx(allIdx); setSelectedTournament(null);}} style={{marginLeft:"auto",background:"none",border:`1px solid ${C.accent}`,color:C.accent,borderRadius:5,padding:"2px 8px",fontSize:10,cursor:"pointer",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Reset to all</button>
          </div>
        )}
      </div>

      {/* Tournament Selector */}
      <TournamentSelector selectedTournament={selectedTournament} setSelectedTournament={setSelectedTournament} setSelectedIdx={setSelectedIdx}/>

      {/* Grid */}
      <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14}}>
        <GraysonHero selectedIdx={selectedIdx}/>
        <TeamHero selectedIdx={selectedIdx}/>
        <HotColdSection selectedIdx={selectedIdx}/>
        <TeamOPSChart isFiltered={isFiltered}/>
        <PitchLoadTable isFiltered={isFiltered}/>
        <RosterTable selectedIdx={selectedIdx}/>
      </div>

      {/* Player Roster Tiles */}
      <PlayerRosterTiles onSelect={setSelectedPlayer} />

      <div style={{maxWidth:1100,margin:"16px auto 0",fontSize:10,color:C.muted,textAlign:"center"}}>
        Updated Jun 26 2026 · Stats verified by 3 independent agents · 11-8-1 through 20 games
      </div>
    </div>
  );
}
