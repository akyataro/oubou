const VER='2026-11-10c';
let ROOM=new URLSearchParams(location.search).get('room')||'';
const COVERS = [
  { f: 'cover_darkblue.jpg', n: '標準仕様' },
  { f: 'cover_blue.jpg', n: 'ライトノベル' },
  { f: 'cover_red.jpg', n: 'サスペンス' },
  { f: 'cover_novel.jpg', n: '歴史・純文学' },
  { f: 'cover_occult.jpg', n: 'オカルト' },
  { f: 'cover_fantasy.jpg', n: 'ファンタジー' },
  { f: 'cover_romance.jpg', n: '恋愛小説' },
  { f: 'cover_picturebook.jpg', n: '絵本・キッズ' },
  { f: 'cover_sf.jpg', n: 'SF・近未来' },
  { f: 'cover_action.jpg', n: 'アクション' },
  { f: 'cover_daily.jpg', n: '日常・エッセイ' },
  { f: 'cover_academic.jpg', n: '学術・実用書' },
  { f: 'cover_business.jpg', n: 'ビジネス' },
  { f: 'cover_japanese.jpg', n: '和風・時代劇' }
];

const FONTS = {
  'serif': "'Noto Serif JP', serif",
  'sans': "'Noto Sans JP', sans-serif",
  'retro': "'Kaisei Decol', serif",
  'delicate': "'Hina Mincho', serif",
  'scary': "'Yuji Syuku', serif",
  'cute': "'Yusei Magic', sans-serif"
};

const defaultDesign = () => ({ ttl:{x:75, y:50, s:1, d:'v'}, au:{x:25, y:85, s:1, d:'v'} });
let S=null,me=null,code=null,base=location.origin+location.pathname,err='';
let sel={t:null, b:null, cov:'cover_darkblue.jpg', color:'black', font:'serif', design: defaultDesign()};
let savedCovScroll = 0;

const $=document.getElementById('app');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const call=(a,p)=>{
  const q=new URLSearchParams({a});
  Object.entries(p||{}).forEach(([k,v])=>{if(v!==null&&v!==undefined)q.set(k,v)});
  return fetch(GAS+'?'+q.toString()).then(r=>r.json());
};
try{const k=localStorage.getItem('obh');if(k){const o=JSON.parse(k);if(!ROOM||ROOM===o.code){code=o.code;me=o.id}}}catch(e){}

async function act(a,p){
  err='';
  try{const r=await call(a,Object.assign({code,id:me},p||{}));
    if(r.err){err=r.err;if(S)toast(r.err);render();return}
    if(r.closed){leaveRoom('');return}
    if(r.id&&r.code){code=r.code;me=r.id;try{localStorage.setItem('obh',JSON.stringify({code,id:me}))}catch(e){}poll();return}
    if(a==='submit') sel={t:null, b:null, cov:'cover_darkblue.jpg', color:'black', font:'serif', design: defaultDesign()};
    S=r;render();
  }catch(e){err='通信に失敗しました。もう一度お試しください';if(S)toast(err);render()}
}
function leaveRoom(msg){
  code=null;me=null;S=null;sel={t:null, b:null, cov:'cover_darkblue.jpg', color:'black', font:'serif', design: defaultDesign()};err=msg||'';ROOM='';
  try{localStorage.removeItem('obh')}catch(e){}
  try{history.replaceState(null,'',location.pathname)}catch(e){}
  document.getElementById('modal').innerHTML='';
  render();
}
async function poll(){
  if(!code)return;
  try{const r=await call('get',{code,id:me,v:S?S.v:null});
    if(r.same)return;
    if(r.err){leaveRoom(S&&r.err==='部屋が見つかりません'?'部屋が終了しました。新しい部屋に参加するか、作成してください':r.err);return}
    if(!S||r.v!==S.v){if(S&&(r.phase!==S.phase||r.round!==S.round))sel={t:null, b:null, cov:'cover_darkblue.jpg', color:'black', font:'serif', design: defaultDesign()};S=r;render()}
  }catch(e){}
}
(async function loop(){try{await poll()}catch(e){}setTimeout(loop,S&&S.remote?2000:3000)})();
document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
addEventListener('resize',()=>{if(S)render()});

function start(){
  const n=document.getElementById('name').value,c=document.getElementById('code').value.trim();
  c?act('join',{name:n,code:c}):act('create',{name:n});
}
function pick(k,i){sel[k]=i;render()}
let modalFn=null;
function ask(msg,okLabel,fn,noLabel){
  modalFn=fn;
  document.getElementById('modal').innerHTML=`<div class="mback"><div class="mbox"><p>${msg}</p><div class="row2">${noLabel===null?'':`<button class="ghost" onclick="modalNo()">${noLabel||'やめる'}</button>`}<button class="red" onclick="modalOk()">${okLabel}</button></div></div></div>`;
}
function modalNo(){modalFn=null;document.getElementById('modal').innerHTML=''}
function modalOk(){const f=modalFn;modalNo();if(f)f()}
let toastT=0;
function toast(msg){const el=document.getElementById('toastbox');el.innerHTML=`<div id="toast">${esc(msg)}</div>`;clearTimeout(toastT);toastT=setTimeout(()=>{el.innerHTML=''},3500)}

function resetGame(){ask('この部屋を終了します。<br>参加者・チャット・ここまでの進行がすべて消え、全員が最初の画面に戻ります。','終了する',()=>act('reset'))}
function inviteUrl(){return base+'?room='+S.code}
function share(){
  const u=inviteUrl();
  const t=`横暴編集長（タイトル大喜利）に参加してね。部屋コード：${S.code}\n`;
  if(navigator.share){navigator.share({title:'横暴編集長',text:t,url:u}).catch(()=>{})}
  else location.href='https://line.me/R/msg/text/?'+encodeURIComponent(t+u);
}
function copyUrl(){
  const u=inviteUrl();
  const fb=()=>ask('下のリンクを長押ししてコピーしてください。<br><input readonly value="'+esc(u)+'" onclick="this.select()">','閉じる',null,null);
  try{(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>toast('リンクをコピーしました')).catch(fb)}catch(e){fb()}
}
function swap(k){
  ask((k==='T'?'上':'下')+'の札5枚をすべて山札と交換します。<br>1ラウンドに1回しか使えません。','交換する',()=>{if(k==='T')sel.t=null;else sel.b=null;act('swap',{k})});
}
function askRVote(id){
  const s=S.subs.find(x=>x.id===id);if(!s)return;
  ask('次の作品に投票します。<br><b>'+esc(s.t+s.b)+'</b><br>投票後は変更できません。','投票する',()=>act('rvote',{target:id}));
}
function askFinal(i){
  const x=S.hist[i];if(!x)return;
  ask('次のタイトルに投票します。<br><b>'+esc(x.t+x.b)+'</b><br>投票後は変更できません。','投票する',()=>act('vote',{idx:i}));
}

let logOpen=true,seenCn=0,justSent=false;
const online=()=>!!(S&&S.remote);
function toggleLog(){logOpen=!logOpen;if(logOpen&&S)seenCn=S.cn||0;renderChat()}
async function sendChat(){
  const i=document.getElementById('cmsg');if(!i)return;
  const m=i.value.trim();if(!m)return;
  i.value='';logOpen=true;justSent=true;
  await act('chat',{m});
  const j=document.getElementById('cmsg');if(j)j.focus();
}
function renderChat(){
  const el=document.getElementById('chat');
  document.body.classList.toggle('online',online());
  if(!online()){el.innerHTML='';return}
  if(!document.getElementById('cmsg')){
    el.innerHTML=`<div class="ctop"><input id="cmsg" maxlength="60" placeholder="チャット（60文字まで）" autocomplete="off" enterkeyhint="send" onkeydown="if(event.key==='Enter'&&!event.isComposing)sendChat()"><button class="red" id="cbtnsend" onclick="sendChat()">送信</button><button class="ghost" id="clogbtn" onclick="toggleLog()"></button></div><div id="clog"></div>`;
  }
  const un=logOpen?0:Math.max(0,(S.cn||0)-seenCn);
  document.getElementById('clogbtn').innerHTML=(logOpen?'閉じる':'チャット')+(un?`<b>${un}</b>`:'');
  const log = document.getElementById('clog');
  if(!logOpen){log.style.display='none';return}
  log.style.display='block';
  const near=log.scrollHeight-log.scrollTop-log.clientHeight<48;
  log.innerHTML = (S.chat || []).map(x => {
    const isOwn = x.n === (S.players.find(p => p.id === S.me) || {}).name;
    return `<div class="cm ${isOwn ? 'own' : ''}"><b>${esc(x.n)}</b><span>${esc(x.m)}</span></div>`;
  }).join('') || '<div class="cm" style="opacity:.6; text-align:center;">まだメッセージはありません</div>';
  if(near||justSent){log.scrollTop=log.scrollHeight;justSent=false}
  seenCn=S.cn||0;
}

let dTarget = null, dStartX = 0, dStartY = 0, dInitX = 0, dInitY = 0, dBookW = 0, dBookH = 0;
window.dragStart = function(e, target) {
  if (e.button !== undefined && e.button !== 0) return;
  dTarget = target;
  dStartX = e.clientX;
  dStartY = e.clientY;
  dInitX = sel.design[target].x;
  dInitY = sel.design[target].y;
  const rect = e.currentTarget.closest('.bk').getBoundingClientRect();
  dBookW = rect.width;
  dBookH = rect.height;
  e.stopPropagation();
  e.currentTarget.setPointerCapture(e.pointerId);
};
window.dragMove = function(e, target) {
  if (dTarget !== target) return;
  e.preventDefault();
  let nx = dInitX + ((e.clientX - dStartX) / dBookW) * 100;
  let ny = dInitY + ((e.clientY - dStartY) / dBookH) * 100;
  sel.design[target].x = Math.max(0, Math.min(100, nx));
  sel.design[target].y = Math.max(0, Math.min(100, ny));
  e.currentTarget.style.left = `${sel.design[target].x}%`;
  e.currentTarget.style.top = `${sel.design[target].y}%`;
};
window.dragEnd = function(e) {
  dTarget = null;
  try { e.currentTarget.releasePointerCapture(e.pointerId); } catch(e){}
};

const L=s=>String(s).replace(/\d{1,3}/g,'0').length;
const spine=(c,o)=>{const t=c.k==='T';return `<button class="sp ${t?'top':'bot'} ${o.on?'sel':''}" ${o.click?`onclick="${o.click}"`:'disabled'}><i class="mk">${t?'上':'下'}</i><span>${esc(c.s)}</span></button>`};
const sides=(items,lab)=>{const mk=k=>items.filter(x=>x.c.k===k).map(x=>spine(x.c,x)).join('');
  return `<div class="two"><div class="side top"><h3>${lab[0]}</h3><div class="rack">${mk('T')}</div></div><div class="side bot"><h3>${lab[1]}</h3><div class="rack">${mk('B')}</div></div></div>`};

const bk = (t, b, w, by, covInfo, interactive = false) => {
  let img = 'cover_darkblue.jpg', col = 'black', fnt = 'serif', d = defaultDesign();
  if (covInfo) {
    const p = covInfo.split('|');
    img = p[0] || img;
    if (p[1]) col = p[1];
    if (p[2]) {
      if (p[2].startsWith('{')) {
        try { Object.assign(d, JSON.parse(p[2])) } catch(e){}
      } else {
        fnt = p[2];
        if (p[3]) try { Object.assign(d, JSON.parse(p[3])) } catch(e){}
      }
    }
  }
  const ff = FONTS[fnt] || FONTS['serif'];
  const fw = fnt === 'delicate' ? 'font-weight:400;' : '';
  const tc = col === 'white' ? '#fdfdfd' : '#1b2430';
  const ts = col === 'white' ? '0 1px 4px rgba(0,0,0,0.9), 0 2px 10px rgba(0,0,0,0.8)' : '0 1px 4px rgba(255,255,255,0.9), 0 2px 10px rgba(255,255,255,0.8)';
  const mx = Math.max(L(t), L(b), 1);
  const baseFs = Math.max(12, Math.floor(Math.min(1.05 * w / mx, .232 * w)));

  const tFs = baseFs * d.ttl.s;
  const aFs = (w * 0.05) * d.au.s;

  const tStyle = `left:${d.ttl.x}%; top:${d.ttl.y}%; writing-mode:${d.ttl.d==='v'?'vertical-rl':'horizontal-tb'}; display:flex; flex-direction:column; gap:${tFs*0.5}px;`;
  const aStyle = `left:${d.au.x}%; top:${d.au.y}%; writing-mode:${d.au.d==='v'?'vertical-rl':'horizontal-tb'}; font-size:${aFs}px; ${fw}`;

  const evTitle = interactive ? `onpointerdown="dragStart(event,'ttl')" onpointermove="dragMove(event,'ttl')" onpointerup="dragEnd(event)" onpointercancel="dragEnd(event)"` : '';
  const evAuthor = interactive ? `onpointerdown="dragStart(event,'au')" onpointermove="dragMove(event,'au')" onpointerup="dragEnd(event)" onpointercancel="dragEnd(event)"` : '';
  const cls = interactive ? 'drag-box interactive' : 'drag-box';

  return `<div class="bk" style="--w:${w}px;--cov:url('${img}');--tc:${tc};--ts:${ts};--ff:${ff}">
    <div class="${cls}" style="${tStyle}" ${evTitle}>
      <div class="ln" style="font-size:${tFs}px; ${fw}">${esc(t)}</div>
      <div class="ln" style="font-size:${tFs}px; ${fw}">${esc(b)}</div>
    </div>
    ${by ? `<div class="${cls} au" style="${aStyle}" ${evAuthor}>${esc(by)}</div>` : ''}
  </div>`;
};

const tsp=(t,b,by,cls,click,covInfo)=>{
  let fnt = 'serif';
  if(covInfo){
    const p = covInfo.split('|');
    if(p[2] && !p[2].startsWith('{')) fnt = p[2];
  }
  const ff = FONTS[fnt] || FONTS['serif'];
  const fw = fnt === 'delicate' ? 'font-weight:400;' : '';
  const tag=click===undefined?'div':'button';
  const at=click===undefined?'':click===null?'disabled':`onclick="${click}"`;
  return `<${tag} class="tsp ${cls||''}" ${at}><span class="tt" style="font-family:${ff}; ${fw}">${esc(t)}<i class="gp"></i>${esc(b)}</span><span class="by" style="font-family:${ff}; ${fw}">${esc(by||'')}</span></${tag}>`;
};

function render(){
  if(!S){
    $.innerHTML=`
    <div class="hero-container">
      <div class="hero-inner">
        <div class="login-box">
          <input id="name" placeholder="名前（10文字まで）" maxlength="10" autocomplete="off">
          <input id="code" placeholder="部屋コード（参加時）" inputmode="numeric" value="${esc(ROOM)}">
          <button class="red wide" onclick="start()">${ROOM?'参加する':'部屋を作る／参加する'}</button>
          ${err?`<div class="msg">${esc(err)}</div>`:''}
        </div>
      </div>
    </div>`;
    document.body.style.padding = '0';
    $.style.padding = '0';
    $.style.maxWidth = '100%';
    renderChat();return;
  }

  document.body.style.padding = '';
  $.style.padding = '12px';
  $.style.maxWidth = '640px';

  const P=S.players,ph=S.phase,nm=id=>(P.find(x=>x.id===id)||{}).name||'',host=S.host===S.me;
  const title=ph==='lobby'?'準備中':ph==='vote'?'最終投票':ph==='final'?'結果発表':`第${S.round}号／全${S.rounds}号`;
  let h=`<div class="bar"><span>部屋 ${S.code}</span><span>${title}</span></div>`;
  if(S.ver!==VER)h+=`<div class="verbanner">画面とサーバーのバージョンが合っていません。ページを再読み込みしてください。直らない場合は、GASの「デプロイを管理」から新バージョンをデプロイし直してください。</div>`;
  h+=`<div class="score">`+P.map(x=>{
    const on=ph==='present'?S.turn===x.id:(ph==='write'||ph==='rvote'||ph==='vote')?x.done:false;
    return `<span class="${on?'ok':''}"><b>${esc(x.name)}</b></span>`}).join('')+`</div>`;

  if(ph==='lobby'){
    h+=`<p>参加者が集まったら開始します（${P.length}人／2〜8人）</p><div class="code">${S.code}</div>`;
    h+=`<img alt="参加用QRコード" width="200" height="200" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(base+'?room='+S.code)}">`;
    h+=`<div class="row2"><button class="ghost" onclick="share()">LINEなどで招待</button><button class="ghost" onclick="copyUrl()">リンクをコピー</button></div><p class="hint" style="word-break:break-all">${esc(inviteUrl())}</p>`;
    h+=host?`<h2>遊び方</h2><div class="row2"><button class="${S.remote?'ghost':'red'}" onclick="act('setmode',{remote:0})">対面</button><button class="${S.remote?'red':'ghost'}" onclick="act('setmode',{remote:1})">オンライン</button></div><p class="hint">対面：発表者のスマホ画面を、みんなに直接見せる<br>オンライン：発表のタイトルが全員の画面に表示され、チャットも使えます</p>`:`<p class="hint">遊び方：${S.remote?'オンライン（発表のタイトルが全員の画面に表示され、チャットも使えます）':'対面（発表者のスマホ画面を直接見せます）'}</p>`;
    if(host)h+=`<h2>会議の回数</h2><div class="nums">`+[1,2,3,4,5,6,7,8].map(n=>`<button class="${n===S.rounds?'red':'ghost'}" onclick="act('setrounds',{n:${n}})">${n}</button>`).join('')+`</div><button class="red wide" onclick="act('start')">ゲーム開始</button>`;
    else h+=`<p>会議は全${S.rounds}回です。ホストが開始するのを待っています</p>`;

  }else if(ph==='write'){
    if(S.mine){
      h += `<div class="stamp-container">
              <div class="msg">提出しました。全員の提出を待っています</div>
              <div class="stamp-v">提出済</div>
            </div>`+bk(S.mine.t,S.mine.b,Math.min(200,innerWidth-48),nm(S.me),S.mine.cov);
    }else{
      h+=`<div class="msg">手札から、上の札と下の札を1枚ずつ選んでタイトルを作ってください</div>`;
      h+=sides(S.hand.map((c,i)=>({c,on:c.k==='T'?sel.t===i:sel.b===i,click:`pick('${c.k==='T'?'t':'b'}',${i})`})),['上の札','下の札']);
      const sw=S.swapped;
      h+=`<div class="row2 rev"><button class="ghost" ${sw?'disabled':''} onclick="swap('T')">上の札をすべて交換</button><button class="ghost" ${sw?'disabled':''} onclick="swap('B')">下の札をすべて交換</button></div>`+(sw?`<p class="hint">${sw==='T'?'上':'下'}の札を交換しました。交換は1ラウンドに1回です</p>`:`<p class="hint">山札と交換できます（1ラウンドに1回、上か下のどちらか）</p>`);

      const ok=sel.t!==null&&sel.b!==null;

      if(ok){
        h+=`<h2>表紙プレビュー ＆ 配置調整</h2>`;
        h+=`<div style="display:flex;justify-content:center;margin-bottom:12px;">`+bk(S.hand[sel.t].s,S.hand[sel.b].s, Math.min(240,innerWidth-32), nm(S.me), sel.cov+'|'+sel.color+'|'+sel.font+'|'+JSON.stringify(sel.design), true)+`</div>`;

        h+=`<div style="background:rgba(0,0,0,0.4); padding:12px; border-radius:8px; margin-bottom:20px; box-shadow:inset 0 2px 6px rgba(0,0,0,0.3);">
          <div style="font-size:13px; color:#ffe45c; margin-bottom:10px; text-align:center; font-weight:700;">※プレビュー上の文字は指で動かせます</div>

          <div style="display:flex; gap:6px; align-items:center; margin-bottom:8px;">
            <span style="font-size:14px; width:70px; font-weight:700;">タイトル</span>
            <button class="ghost" style="padding:6px; flex:1; font-size:14px;" onclick="sel.design.ttl.s=Math.max(0.5, Math.round((sel.design.ttl.s-0.1)*10)/10);render()">縮小</button>
            <button class="ghost" style="padding:6px; flex:1; font-size:14px;" onclick="sel.design.ttl.s=Math.min(2.0, Math.round((sel.design.ttl.s+0.1)*10)/10);render()">拡大</button>
          </div>

          <div style="display:flex; gap:6px; align-items:center; margin-bottom:8px;">
            <span style="font-size:14px; width:70px; font-weight:700;">作者名</span>
            <button class="ghost" style="padding:6px; flex:1; font-size:14px;" onclick="sel.design.au.s=Math.max(0.5, Math.round((sel.design.au.s-0.1)*10)/10);render()">縮小</button>
            <button class="ghost" style="padding:6px; flex:1; font-size:14px;" onclick="sel.design.au.s=Math.min(2.0, Math.round((sel.design.au.s+0.1)*10)/10);render()">拡大</button>
          </div>

          <div style="display:flex; gap:6px; align-items:center;">
            <span style="font-size:14px; width:70px; font-weight:700;">向き / 色</span>
            <button class="ghost" style="padding:6px; flex:1; font-size:14px;" onclick="const nd=sel.design.ttl.d==='v'?'h':'v';sel.design.ttl.d=nd;sel.design.au.d=nd;render()">縦/横 切替</button>
            <button class="${sel.color==='black'?'red':'ghost'}" style="padding:6px; flex:1; font-size:14px;" onclick="sel.color='black';render()">黒</button>
            <button class="${sel.color==='white'?'red':'ghost'}" style="padding:6px; flex:1; font-size:14px;" onclick="sel.color='white';render()">白</button>
          </div>
        </div>`;
      }

      h+=`<h2>表紙デザイン</h2><div class="cov-select" onscroll="savedCovScroll=this.scrollLeft">`+COVERS.map(c=>`<div class="cov-item ${sel.cov===c.f?'sel':''}" onclick="sel.cov='${c.f}';render()"><img src="${c.f}" alt="${c.n}"><p>${c.n}</p></div>`).join('')+`</div>`;

      h+=`<h2>フォント</h2><div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
        <button class="${sel.font==='serif'?'red':'ghost'}" style="font-family:'Noto Serif JP',serif; padding:8px 12px; font-size:14px; flex:1; min-width:80px;" onclick="sel.font='serif';render()">明朝</button>
        <button class="${sel.font==='sans'?'red':'ghost'}" style="font-family:'Noto Sans JP',sans-serif; padding:8px 12px; font-size:14px; flex:1; min-width:80px;" onclick="sel.font='sans';render()">ゴシック</button>
        <button class="${sel.font==='retro'?'red':'ghost'}" style="font-family:'Kaisei Decol',serif; padding:8px 12px; font-size:14px; flex:1; min-width:80px;" onclick="sel.font='retro';render()">レトロ</button>
        <button class="${sel.font==='delicate'?'red':'ghost'}" style="font-family:'Hina Mincho',serif; font-weight:400; padding:8px 12px; font-size:14px; flex:1; min-width:80px;" onclick="sel.font='delicate';render()">繊細</button>
        <button class="${sel.font==='scary'?'red':'ghost'}" style="font-family:'Yuji Syuku',serif; padding:8px 12px; font-size:14px; flex:1; min-width:80px;" onclick="sel.font='scary';render()">ホラー</button>
        <button class="${sel.font==='cute'?'red':'ghost'}" style="font-family:'Yusei Magic',sans-serif; padding:8px 12px; font-size:14px; flex:1; min-width:80px;" onclick="sel.font='cute';render()">手書き</button>
      </div>`;

      h+=`<button class="red wide" ${ok?'':'disabled'} style="margin-top:16px;" onclick="act('submit',{t:sel.t,b:sel.b,cov:sel.cov+'|'+sel.color+'|'+sel.font+'|'+JSON.stringify(sel.design)})">この表紙デザインで提出</button>`;
    }

  }else if(ph==='present'){
    const my=S.turn===S.me;
    if(S.cur){
      const w=Math.floor(Math.min(innerWidth-32,(innerHeight-130)/1.4));
      h+=`<div class="stage"><div class="stagebody">${bk(S.cur.t,S.cur.b,w,nm(S.cur.id),S.cur.cov)}</div><div class="stagebar"><div class="row2">${S.cur.id===S.me?`<button class="red" onclick="act('endshow')">発表終了</button>`:`<div class="who">${esc(nm(S.cur.id))} さんが発表中</div>`}</div></div></div>`;
    }else{
      h+=`<div class="msg">${S.showing?esc(nm(S.turn))+' さんが発表中です。発表者の画面を見てください':my?(S.remote?'あなたの番です。準備ができたら発表してください':'あなたの番です。画面を他の人に見せながら発表してください'):esc(nm(S.turn))+' さんの発表を待っています'}</div>`;
      if(my)h+=`<button class="red wide" onclick="act('reveal')">発表する</button>`;
      if(S.mine&&!S.presented.includes(S.me))h+=`<h2>あなたのタイトル（まだ公開されていません）</h2>`+bk(S.mine.t,S.mine.b,Math.min(200,innerWidth-48),nm(S.me),S.mine.cov);
    }

  }else if(ph==='rvote'){
    const done=S.myRVote!==null;
    h += `<div class="stamp-container">
            <div class="msg">${done ? '投票しました。全員の投票を待っています' : '一番いいと思う作品に投票してください（自分の作品には投票できません）'}</div>
            ${done ? '<div class="stamp-v">投票済</div>' : ''}
          </div>`;
    h+=`<div class="shelf">`+S.subs.map(s=>s.id===S.me?tsp(s.t,s.b,'あなたの作品（選べません）','dash',null,s.cov):tsp(s.t,s.b,nm(s.id),S.myRVote===s.id?'win':'',done?null:`askRVote('${s.id}')`,s.cov)).join('')+`</div>`;

  }else if(ph==='rresult'){
    const R=S.rres,last=S.round>=S.rounds;
    h+=`<div class="msg">${R.counts?'今回残す作品が決まりました（同数の場合は、それぞれ残します）':'今回の作品は、すべて最終投票の候補になります'}</div>`;
    h+=`<div class="shelf">`+S.subs.map(s=>tsp(s.t,s.b,nm(s.id)+(R.counts?'・'+R.counts[s.id]+'票':''),R.kept.includes(s.id)?'win':'',undefined,s.cov)).join('')+`</div>`;
    h+=host?`<button class="red wide" onclick="act('next')">${last?'最終投票へ':'次の号へ'}</button>`:`<p>ホストが${last?'最終投票':'次の号'}に進めます</p>`;

  }else if(ph==='vote'){
    const done=S.myVote!==null;
    h += `<div class="stamp-container">
            <div class="msg">${!done ? '残ったタイトルです。一番いいと思うものに投票してください（自分の作品も選べます）' : '投票しました。全員の投票を待っています'}</div>
            ${done ? '<div class="stamp-v">投票済</div>' : ''}
          </div>`;
    h+=`<div class="shelf">`+S.hist.map((x,i)=>tsp(x.t,x.b,`第${x.r}号・${nm(x.id)}`,S.myVote===i?'win':'',S.myVote===null?`askFinal(${i})`:null,x.cov)).join('')+`</div>`;

  }else if(ph==='final'){
    const mx=Math.max(...S.votes),win=S.hist.map((_,i)=>i).filter(i=>S.votes[i]===mx);
    const idx=S.hist.map((_,i)=>i).sort((a,b)=>S.votes[b]-S.votes[a]||a-b);
    const names=win.map(i=>`「${S.hist[i].t}${S.hist[i].b}」`).join('と');
    h+=`<div class="verdict">討論の末、出版する本が決まりました。<br>今回出版する本は${esc(names)}です！${win.length>1?'<small>同率1位のため、複数冊を出版します</small>':''}</div>`;
    const w=win.length===1?Math.min(300,innerWidth-48):Math.min(220,Math.floor((innerWidth-44)/2));
    h+=`<div class="wins">`+win.map(i=>{const x=S.hist[i];return `<div>${bk(x.t,x.b,w,nm(x.id),x.cov)}<div class="vt">${S.votes[i]}票</div></div>`}).join('')+`</div>`;
    h+=`<h2>投票結果</h2><div class="shelf">`+idx.map(i=>{const x=S.hist[i];return tsp(x.t,x.b,`第${x.r}号・${nm(x.id)}・${S.votes[i]}票`,S.votes[i]===mx?'win':'',undefined,x.cov)}).join('')+`</div>`;
    h+=host?`<button class="red wide" onclick="act('again')">もう一度遊ぶ</button>`:`<p>ホストが「もう一度遊ぶ」を選べます</p>`;
  }
  if(!S.cur)h+=`<button class="ghost wide" style="margin-top:28px;font-size:16px" onclick="resetGame()">部屋を終了して最初からやり直す</button>`;
  $.innerHTML=h;
  renderChat();

  const csel = document.querySelector('.cov-select');
  if(csel) csel.scrollLeft = savedCovScroll;
}
render();
