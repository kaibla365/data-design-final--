const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let currentUser = null, players = [], rosters = [];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function notice(msg="") { $("#notice").textContent = msg; }
async function api(url, options={}) {
  const response = await fetch(url, { credentials:"same-origin", headers:{"Content-Type":"application/json", ...(options.headers||{})}, ...options });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
function showApp(user) {
  currentUser=user; $("#auth").classList.add("hidden"); $("#app").classList.remove("hidden"); $("#logout").classList.remove("hidden");
  $("#welcome").textContent=`Signed in as ${user.username} (${user.role})`;
  $("#adminTab").classList.toggle("hidden", user.role!=="admin");
  loadPlayers(); loadRosters(); loadStats();
}
function showAuth() { currentUser=null; $("#auth").classList.remove("hidden"); $("#app").classList.add("hidden"); $("#logout").classList.add("hidden"); }
function table(rows, cols) {
  if (!rows.length) return "<p class='muted'>No records to display yet.</p>";
  return `<div class="table-wrap"><table><thead><tr>${cols.map(c=>`<th>${esc(c[1])}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${esc(c[0](r))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
$("#loginForm").addEventListener("submit", async e=>{e.preventDefault();try{const f=Object.fromEntries(new FormData(e.target));const d=await api("/api/auth/login",{method:"POST",body:JSON.stringify(f)});notice("");showApp(d.user)}catch(err){notice(err.message)}});
$("#registerForm").addEventListener("submit", async e=>{e.preventDefault();try{const f=Object.fromEntries(new FormData(e.target));const d=await api("/api/auth/register",{method:"POST",body:JSON.stringify(f)});notice("");showApp(d.user)}catch(err){notice(err.message)}});
$("#logout").addEventListener("click",async()=>{try{await api("/api/auth/logout",{method:"POST"});showAuth();notice("You have logged out.")}catch(e){notice(e.message)}});
$$("nav button").forEach(b=>b.addEventListener("click",()=>{$$(".tab").forEach(t=>t.classList.add("hidden"));$("#"+b.dataset.tab).classList.remove("hidden")}));
async function loadPlayers() {
  try {
    const q=new URLSearchParams(); if($("#playerSearch").value)q.set("search",$("#playerSearch").value);if($("#playerSport").value)q.set("sport",$("#playerSport").value);
    players=await api("/api/players?"+q.toString()); renderPlayers();
    $("#adminPlayer").innerHTML=players.map(p=>`<option value="${p._id}">${esc(p.name)} — ${esc(p.sport)} (${esc(p.position)})</option>`).join("");
  } catch(e){notice(e.message)}
}
function renderPlayers(){
  $("#playerList").innerHTML=players.map(p=>`<article class="item"><h3>${esc(p.name)}</h3><span class="tag">${esc(p.sport)}</span><span class="tag">${esc(p.position)}</span><p class="muted">${esc(p.proTeam)}</p>${currentUser?.role==="fan"?`<button data-add="${p._id}">Add to roster</button>`:""}</article>`).join("")||"<p class='muted'>No players found. An administrator can add players.</p>";
  $$("[data-add]").forEach(b=>b.addEventListener("click",()=>addPlayerToRoster(b.dataset.add)));
}
$("#searchPlayers").addEventListener("click",loadPlayers);
$("#playerSearch").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();loadPlayers()}});
$("#playerSport").addEventListener("change",loadPlayers);
$("#rosterForm").addEventListener("submit",async e=>{e.preventDefault();try{const f=Object.fromEntries(new FormData(e.target));const roster=await api("/api/rosters",{method:"POST",body:JSON.stringify({...f,players:[]})});notice(`Created roster: ${roster.teamName}`);e.target.reset();await loadRosters()}catch(err){notice(err.message)}});
async function loadRosters(all=false){
  try{rosters=await api("/api/rosters"+(all?"?all=true":""));renderRosters()}catch(e){notice(e.message)}
}
function renderRosters(){
  $("#rosterList").innerHTML=rosters.map(r=>`<article class="item"><h3>${esc(r.teamName)}</h3><span class="tag">${esc(r.sport)}</span><span class="tag">${esc(r.ownerName)}</span><p>${r.players.length} players · ${r.weeklyStats?.points||0} points</p><p class="muted">${r.players.map(p=>esc(p.name)).join(", ")||"No players selected yet."}</p><button data-roster="${r._id}">Manage players</button></article>`).join("")||"<p class='muted'>No rosters yet. Create one above.</p>";
  $$("[data-roster]").forEach(b=>b.addEventListener("click",()=>manageRoster(b.dataset.roster)));
}
async function manageRoster(id){
  const r=rosters.find(x=>x._id===id);if(!r)return;
  const eligible=players.filter(p=>p.sport===r.sport);
  const current=new Set(r.players.map(p=>p._id));
  const list=eligible.map(p=>`${current.has(p._id)?"[x]":"[ ]"} ${p.name} (${p.position}) — ${p._id}`).join("\n");
  const choice=prompt(`Edit ${r.teamName}. Copy/paste comma-separated player IDs from the list below.\n\n${list}\n\nCurrent IDs: ${[...current].join(",")}`);
  if(choice===null)return;
  try{const ids=choice.split(",").map(x=>x.trim()).filter(Boolean);await api(`/api/rosters/${id}/players`,{method:"PATCH",body:JSON.stringify({players:ids})});notice("Roster updated.");await loadRosters()}catch(e){notice(e.message)}
}
async function addPlayerToRoster(playerId){
  const mine=rosters.filter(r=>r.ownerId===currentUser.id || r.ownerName===currentUser.username);
  if(!mine.length){notice("Create a roster first, then add players.");return}
  const names=mine.map((r,i)=>`${i+1}. ${r.teamName} (${r.sport})`).join("\n");
  const answer=prompt(`Choose roster number:\n${names}`);
  const r=mine[Number(answer)-1];if(!r)return;
  if(!r.players.some(p=>p._id===playerId))r.players.push(players.find(p=>p._id===playerId));
  try{await api(`/api/rosters/${r._id}/players`,{method:"PATCH",body:JSON.stringify({players:r.players.map(p=>p._id)})});notice("Player added to roster.");await loadRosters()}catch(e){notice(e.message)}
}
$("#showAllRosters").addEventListener("click",()=>loadRosters(true));
async function loadStats(){
  try{const q=new URLSearchParams();if($("#statsWeek").value)q.set("week",$("#statsWeek").value);if($("#statsSeason").value)q.set("season",$("#statsSeason").value);const rows=await api("/api/stats?"+q.toString());$("#statsList").innerHTML=table(rows,[ [r=>r.playerId?.name||"Unknown","Player"],[r=>r.sport,"Sport"],[r=>r.week,"Week"],[r=>r.season,"Season"],[r=>r.points,"Points"],[r=>r.touchdowns,"TD"],[r=>r.passingYards,"Pass Yds"],[r=>r.rushingYards,"Rush Yds"] ])}catch(e){notice(e.message)}
}
$("#loadStats").addEventListener("click",loadStats);
$("#playerForm").addEventListener("submit",async e=>{e.preventDefault();try{const f=Object.fromEntries(new FormData(e.target));await api("/api/players",{method:"POST",body:JSON.stringify(f)});notice("Player added.");e.target.reset();await loadPlayers()}catch(err){notice(err.message)}});
$("#statsForm").addEventListener("submit",async e=>{e.preventDefault();try{const f=Object.fromEntries(new FormData(e.target));for(const k of ["week","season","points","touchdowns","passingYards","rushingYards","receivingYards","rebounds","assists"])if(f[k]!==undefined)f[k]=Number(f[k]);await api("/api/stats",{method:"POST",body:JSON.stringify(f)});notice("Game statistics submitted.");await loadStats()}catch(err){notice(err.message)}});
$("#loadHistory").addEventListener("click",async()=>{try{const d=await api("/api/history");$("#historyList").innerHTML=table(d.records,[ [r=>r.season,"Season"],[r=>r.teamName,"Random team"],[r=>r.playerName,"Random player"],[r=>r.sport,"Sport"],[r=>r.position,"Position"],[r=>r.points,"Points"] ]);notice(d.notice)}catch(e){notice(e.message)}});
(async()=>{try{const d=await api("/api/auth/me");showApp(d.user)}catch(_){showAuth()}})();
