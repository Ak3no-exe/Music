import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { openDB } from 'idb';
import './style.css';

const db = await openDB('musicbox', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('songs')) db.createObjectStore('songs', {keyPath:'id'});
    if (!db.objectStoreNames.contains('folders')) db.createObjectStore('folders', {keyPath:'id'});
    if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', {keyPath:'id'});
    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', {keyPath:'id'});
  }
});

const state = {
  page: 'home',
  songs: [],
  folders: [],
  playlists: [],
  settings: {theme:'dark', color:'#8b5cf6', username:'Utilisateur'},
  current: null,
  audio: new Audio()
};

const $ = s => document.querySelector(s);
const uid = () => crypto.randomUUID();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = sec => {
  if (!Number.isFinite(sec)) return '0:00';
  sec=Math.max(0,Math.floor(sec)); return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
};

async function load(){
  state.songs = await db.getAll('songs');
  state.folders = await db.getAll('folders');
  state.playlists = await db.getAll('playlists');
  const s = await db.get('settings','main');
  if(s) state.settings={...state.settings,...s.value};
  applyTheme();
}

async function saveSettings(){ await db.put('settings',{id:'main',value:state.settings}); }
function applyTheme(){
  document.documentElement.dataset.theme=state.settings.theme;
  document.documentElement.style.setProperty('--accent',state.settings.color);
}

function icon(name){ return ({home:'⌂',library:'♫',playlists:'▣',profile:'◉',settings:'⚙',heart:'♥',folder:'▰',search:'⌕',add:'＋',back:'‹',play:'▶',pause:'Ⅱ',next:'›',prev:'‹',shuffle:'⤨',repeat:'↻',more:'⋯'})[name]||'•'; }

function render(){
  document.title=`MusicBox`;
  $('#app').innerHTML=`
    <div class="shell">
      <header class="topbar">
        <div><div class="brand">Music<span>Box</span></div><div class="sub">Ta musique, simplement.</div></div>
        <button class="iconbtn" data-action="settings">${icon('settings')}</button>
      </header>
      <main id="content">${renderPage()}</main>
      ${state.current ? renderPlayer() : ''}
      <nav class="nav">${[['home','Accueil'],['library','Bibliothèque'],['playlists','Playlists'],['profile','Profil']].map(([p,t])=>`
        <button class="${state.page===p?'active':''}" data-page="${p}"><b>${icon(p)}</b><small>${t}</small></button>`).join('')}</nav>
    </div>`;
  bind();
}

function renderPage(){
  if(state.page==='library') return `
    <section class="page">
      <div class="pagehead"><div><h1>Bibliothèque</h1><p>${state.songs.length} titre(s)</p></div><button class="primary" data-action="import">${icon('add')} Importer</button></div>
      <div class="search"><span>${icon('search')}</span><input id="search" placeholder="Rechercher une musique..." /></div>
      <div class="chips"><button data-sort="title">Titre</button><button data-sort="artist">Artiste</button><button data-sort="album">Album</button><button data-sort="date">Ajout</button></div>
      <div id="songlist">${renderSongs(state.songs)}</div>
    </section>`;
  if(state.page==='playlists') return `
    <section class="page">
      <div class="pagehead"><div><h1>Playlists</h1><p>${state.playlists.length} playlist(s)</p></div><button class="primary" data-action="newplaylist">${icon('add')} Créer</button></div>
      <div class="grid">${state.playlists.map(p=>`<button class="card playlist" data-playlist="${p.id}"><div class="cover">${p.artwork?'':'♫'}</div><strong>${esc(p.name)}</strong><span>${p.songIds?.length||0} titres</span></button>`).join('')}</div>
    </section>`;
  if(state.page==='profile') return `
    <section class="page">
      <div class="profileHero"><div class="avatar">♫</div><h1>${esc(state.settings.username)}</h1><button class="secondary" data-action="profile">Modifier le profil</button></div>
      <div class="stats"><div><b>${state.songs.length}</b><span>Musiques</span></div><div><b>${state.playlists.length}</b><span>Playlists</span></div><div><b>${state.folders.length}</b><span>Dossiers</span></div></div>
      <div class="sectionTitle">Paramètres</div>
      <button class="setting" data-action="settings"><span>⚙️</span><div><b>Apparence</b><small>Thème et couleur</small></div><i>›</i></button>
      <button class="setting" data-action="backup"><span>💾</span><div><b>Sauvegarde</b><small>Exporter ou importer tes données</small></div><i>›</i></button>
    </section>`;
  if(state.page==='settings') return renderSettings();
  return `
    <section class="page home">
      <div class="welcome"><div><span>Bienvenue sur</span><h1>MusicBox</h1><p>Ta bibliothèque musicale hors connexion.</p></div><button class="primary" data-action="import">${icon('add')} Importer</button></div>
      <div class="sectionTitle">Écoutes récentes</div>
      ${state.songs.length ? renderSongs(state.songs.slice(-5).reverse()) : `<div class="empty"><div class="emptyIcon">♫</div><h3>Ta bibliothèque est vide</h3><p>Importe tes fichiers audio pour commencer.</p><button class="primary" data-action="import">Importer de la musique</button></div>`}
      <div class="sectionTitle">Playlists</div>
      <div class="grid compact">${state.playlists.slice(0,4).map(p=>`<button class="card playlist" data-playlist="${p.id}"><div class="cover">♫</div><strong>${esc(p.name)}</strong><span>${p.songIds?.length||0} titres</span></button>`).join('')}</div>
    </section>`;
}

function renderSettings(){
  return `<section class="page"><div class="pagehead"><div><h1>Paramètres</h1><p>Personnalise MusicBox</p></div></div>
    <div class="sectionTitle">Apparence</div>
    <div class="settingBox"><b>Mode</b><div class="seg">${[['dark','Sombre'],['light','Clair'],['auto','Auto']].map(([v,t])=>`<button class="${state.settings.theme===v?'sel':''}" data-theme="${v}">${t}</button>`).join('')}</div></div>
    <div class="settingBox"><b>Couleur principale</b><div class="colors">${['#8b5cf6','#3b82f6','#22c55e','#f97316','#ef4444','#ec4899','#14b8a6'].map(c=>`<button style="background:${c}" class="${state.settings.color===c?'sel':''}" data-color="${c}"></button>`).join('')}</div><input type="color" id="customColor" value="${state.settings.color}"></div>
    <div class="sectionTitle">Données</div>
    <button class="setting" data-action="backup"><span>💾</span><div><b>Exporter mes données</b><small>Créer une sauvegarde locale JSON</small></div><i>›</i></button>
    <button class="setting" data-action="restore"><span>📥</span><div><b>Importer mes données</b><small>Restaurer une sauvegarde</small></div><i>›</i></button>
  </section>`;
}

function renderSongs(songs){
  if(!songs.length) return `<div class="empty small"><div class="emptyIcon">♫</div><p>Aucune musique trouvée.</p></div>`;
  return songs.map(s=>`<div class="song">
    <button class="songmain" data-play="${s.id}"><div class="thumb">♫</div><div class="meta"><b>${esc(s.title||s.name||'Sans titre')}</b><span>${esc(s.artist||'Artiste inconnu')} · ${esc(s.album||'Album inconnu')}</span></div><time>${fmt(s.duration)}</time></button>
    <button class="heart ${s.favorite?'on':''}" data-fav="${s.id}">${icon('heart')}</button>
    <button class="more" data-songmenu="${s.id}">${icon('more')}</button>
  </div>`).join('');
}

function renderPlayer(){
  const s=state.songs.find(x=>x.id===state.current); if(!s) return '';
  return `<div class="player"><div class="playerInfo"><div class="miniCover">♫</div><div><b>${esc(s.title||'Sans titre')}</b><span>${esc(s.artist||'Artiste inconnu')}</span></div></div><div class="controls"><button data-player="prev">${icon('prev')}</button><button class="playBtn" data-player="toggle">${state.audio.paused?icon('play'):icon('pause')}</button><button data-player="next">${icon('next')}</button></div></div>`;
}

async function importFiles(){
  const input=document.createElement('input'); input.type='file'; input.multiple=true; input.accept='audio/*,.mp3,.wav,.flac,.aac,.m4a,.ogg';
  input.onchange=async()=>{ for(const file of [...input.files]){
    const song={id:uid(),name:file.name,title:file.name.replace(/\.[^.]+$/,''),artist:'',album:'',duration:0,uri:null,dateAdded:Date.now(),favorite:false};
    try{
      const path=`music/${song.id}_${file.name.replace(/[^\w.\- ]/g,'_')}`;
      await Filesystem.writeFile({path,data:await blobToBase64(file),directory:Directory.Data,recursive:true});
      song.uri=path;
    }catch(e){ song.uri=null; }
    await db.put('songs',song); state.songs.push(song);
  } render(); };
  input.click();
}
function blobToBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob);});}

async function play(id){
  const s=state.songs.find(x=>x.id===id); if(!s)return;
  state.current=id;
  if(s.uri){
    try{ const r=await Filesystem.readFile({path:s.uri,directory:Directory.Data}); state.audio.src=`data:audio/*;base64,${r.data}`; state.audio.play(); }catch(e){ toast('Fichier audio indisponible'); }
  } else toast('Fichier audio indisponible');
  render();
}
function toast(t){let e=document.createElement('div');e.className='toast';e.textContent=t;document.body.append(e);setTimeout(()=>e.remove(),2200);}

async function bind(){
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{state.page=b.dataset.page;render()});
  document.querySelectorAll('[data-action="settings"]').forEach(b=>b.onclick=()=>{state.page='settings';render()});
  document.querySelectorAll('[data-action="import"]').forEach(b=>b.onclick=importFiles);
  document.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>play(b.dataset.play));
  document.querySelectorAll('[data-fav]').forEach(b=>b.onclick=async()=>{const s=state.songs.find(x=>x.id===b.dataset.fav);s.favorite=!s.favorite;await db.put('songs',s);render()});
  document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=async()=>{state.settings.theme=b.dataset.theme;await saveSettings();applyTheme();render()});
  document.querySelectorAll('[data-color]').forEach(b=>b.onclick=async()=>{state.settings.color=b.dataset.color;await saveSettings();applyTheme();render()});
  const custom=$('#customColor'); if(custom) custom.oninput=async()=>{state.settings.color=custom.value;await saveSettings();applyTheme()};
  const search=$('#search'); if(search) search.oninput=()=>{$('#songlist').innerHTML=renderSongs(state.songs.filter(s=>(s.title+' '+s.artist+' '+s.album).toLowerCase().includes(search.value.toLowerCase())))};
  document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{const k=b.dataset.sort; state.songs.sort((a,z)=>k==='date'?z.dateAdded-a.dateAdded:String(a[k]||'').localeCompare(String(z[k]||'')));render()});
  document.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>{
    const i=state.songs.findIndex(x=>x.id===state.current), act=b.dataset.player;
    if(act==='toggle'){state.audio.paused?state.audio.play():state.audio.pause();render()}
    if(act==='next'&&state.songs[i+1])play(state.songs[i+1].id);
    if(act==='prev'&&state.songs[i-1])play(state.songs[i-1].id);
  });
  document.querySelectorAll('[data-action="newplaylist"]').forEach(b=>b.onclick=async()=>{const name=prompt('Nom de la playlist');if(name){const p={id:uid(),name,songIds:[],dateCreated:Date.now()};await db.put('playlists',p);state.playlists.push(p);render()}});
  document.querySelectorAll('[data-playlist]').forEach(b=>b.onclick=()=>{const p=state.playlists.find(x=>x.id===b.dataset.playlist);toast(`${p.name} · ${p.songIds?.length||0} titres`)});
  document.querySelectorAll('[data-action="profile"]').forEach(b=>b.onclick=async()=>{const n=prompt('Nom d’utilisateur',state.settings.username);if(n){state.settings.username=n;await saveSettings();render()}});
  document.querySelectorAll('[data-action="backup"]').forEach(b=>b.onclick=exportData);
  document.querySelectorAll('[data-action="restore"]').forEach(b=>b.onclick=importData);
}
async function exportData(){
  const data={version:1,songs:state.songs,folders:state.folders,playlists:state.playlists,settings:state.settings};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='MusicBox-backup.json';a.click();URL.revokeObjectURL(a.href);
}
async function importData(){
  const input=document.createElement('input');input.type='file';input.accept='.json';input.onchange=async()=>{try{const d=JSON.parse(await input.files[0].text());for(const s of d.songs||[])await db.put('songs',s);for(const f of d.folders||[])await db.put('folders',f);for(const p of d.playlists||[])await db.put('playlists',p);if(d.settings){state.settings=d.settings;await saveSettings()}await load();render();toast('Sauvegarde restaurée')}catch(e){toast('Sauvegarde invalide')}};input.click();
}

state.audio.onended=()=>{const i=state.songs.findIndex(x=>x.id===state.current);if(state.songs[i+1])play(state.songs[i+1].id)};
await load(); render();