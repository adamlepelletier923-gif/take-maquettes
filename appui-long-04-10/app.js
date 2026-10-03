const langs = ['fr','en','es','de','it','pt'];
const query = new URLSearchParams(location.search);
let lang = langs.includes(query.get('lang')) ? query.get('lang') : 'fr';
let display = ['light','dark','both'].includes(query.get('theme')) ? query.get('theme') : (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
const states = Object.fromEntries(['current',...Array.from({length:10},(_,i)=>String(i+1).padStart(2,'0'))].map(id=>[id,{kind:'photo',state:'comments',retained:'comments',page:0}]));
if (states[query.get('d')]) {
  const s=states[query.get('d')];
  if (['photo','text','anonymous'].includes(query.get('kind'))) s.kind=query.get('kind');
  if (['comments','empty','loading'].includes(query.get('state'))) s.state=query.get('state');
}
const specs = [
  {id:'01',family:'A',font:18,line:26,radius:24,count:3},
  {id:'02',family:'A',font:18,line:26,radius:26,count:3},
  {id:'03',family:'A',font:22,line:31,radius:24,count:1},
  {id:'04',family:'A',font:18,line:26,radius:24,count:3},
  {id:'05',family:'A',font:18,line:26,radius:24,count:2},
  {id:'06',family:'B',font:16,line:23,radius:24,count:3},
  {id:'07',family:'B',font:17,line:24,radius:24,count:2},
  {id:'08',family:'B',font:16,line:23,radius:24,count:3},
  {id:'09',family:'B',font:18,line:26,radius:24,count:2},
  {id:'10',family:'C',font:18,line:26,radius:24,count:3}
];
function t(key, values={}) {
  const text=LOCALES[lang][key];
  if (text===undefined) throw new Error(`Missing translation ${lang}:${key}`);
  return text.replace(/\{\{(\w+)\}\}/g,(_,k)=>String(values[k]??''));
}
function esc(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function pct(value) { return new Intl.NumberFormat(lang,{style:'percent',maximumFractionDigits:0}).format(value); }
function num(value, digits=2) { return new Intl.NumberFormat(lang,{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(value); }
function icon(name) {
  const paths={
    chat:'<path d="M21 11.5a9 9 0 0 1-9 9 9 9 0 0 1-4.1-1L3 21l1.5-4.8A9 9 0 1 1 21 11.5Z"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    ghost:'<path d="M5 21V10a7 7 0 0 1 14 0v11l-3-2-4 2-4-2-3 2Z"/><path d="M9 10h.01M15 10h.01"/>',
    repeat:'<path d="m17 2 4 4-4 4M3 11V8a2 2 0 0 1 2-2h16M7 22l-4-4 4-4m14-1v3a2 2 0 0 1-2 2H3"/>',
    send:'<path d="m22 2-7 20-4-9-9-4L22 2ZM22 2 11 13"/>',
    home:'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3V10Z"/>',
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bars:'<path d="M4 18v2M9 14v6m5-10v10m5-15v15"/>',
    battery:'<rect x="2" y="6" width="18" height="12" rx="3"/><path d="M23 10v4"/><path d="M6 9h10v6H6Z" fill="currentColor" stroke="none"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
}
function avatar(person,size=36) {
  if (person==='anonymous') return `<span class="mist-avatar" aria-hidden="true">${icon('ghost')}</span>`;
  return `<img class="avatar" src="img/${person}.jpg" width="${size}" height="${size}" alt="" loading="lazy">`;
}
function question(kind) { return t(kind==='text' ? 'textQuestion' : 'photoQuestion'); }
function author(kind,showDots=true) {
  if (kind==='anonymous') return `<div class="author mist-author">${avatar('anonymous',24)}<span>${t('anonymous')}</span><span class="time">· ${t('timeHours',{count:2})}</span></div>`;
  return `<div class="author">${avatar('lea',24)}<span>Léa Morel</span><span class="time">· ${t('timeHours',{count:2})}</span>${showDots?'<span class="dots" aria-hidden="true">···</span>':''}</div>`;
}
function votes() {
  return `<div class="vote-result"><span class="yes">${t('yes')} ${pct(.64)}</span><span class="no">${t('no')} ${pct(.36)}</span></div><div class="vote-rail" aria-hidden="true"><i></i><i></i></div>`;
}
function photograph(kind,cls='photo') { return kind==='text' ? '' : `<img class="${cls}" src="img/plage.jpg" width="780" height="339" alt="" loading="lazy">`; }
function feedRow(kind,other=false) {
  return `<div class="feed-row">${other ? `<div class="author">${avatar('karim',24)}<span>Karim Diallo</span><span class="time">· ${t('timeMinutes',{count:3})}</span></div>` : author(kind)}<p class="question">${esc(other?t('otherQuestion'):question(kind))}</p>${other?'<img class="photo" src="img/montagne.jpg" width="780" height="339" alt="" loading="lazy">':photograph(kind)}${votes()}<div class="feed-actions">${icon('ghost')}${icon('repeat')}${icon('send')}${icon('chat')}<span>${t('voteCount',{count:124})}</span></div></div>`;
}
function background(kind) {
  return `<div class="background" aria-hidden="true"><div class="status"><span>9:41</span><div class="island"></div><div class="system-icons">${icon('bars')}${icon('battery')}</div></div><div class="feed-nav"><span>${t('takes')}</span><span>${t('friends')}</span></div>${feedRow(kind)}${feedRow('text',true)}<div class="bottom-nav">${icon('home')}${icon('search')}${icon('chat')}${icon('user')}</div></div>`;
}
function commentsData(kind) {
  const suffix=kind==='text'?'Text':'Photo';
  return [
    {person:'karim',name:'Karim Diallo',time:t('timeSeconds',{count:40}),body:t(`comment${suffix}1`),likes:12},
    {person:'anonymous',name:null,time:t('timeMinutes',{count:3}),body:t(`comment${suffix}2`),likes:4},
    {person:'maya',name:'Maya Rossi',time:t('timeHours',{count:2}),body:t(`comment${suffix}3`),likes:8}
  ];
}
function comment(c,mode) {
  const identity=`<div class="byline">${c.name?`<span class="name">${esc(c.name)}</span>`:''}<span class="time">${esc(c.time)}</span></div>`;
  const text=`<p class="comment-text">${esc(c.body)}</p>`;
  const likes=`<div class="comment-like" aria-label="${esc(t('commentLikes',{count:c.likes}))}">${icon('heart')}<span>${c.likes}</span></div>`;
  if (mode==='04') return `<div class="comment">${text}<div class="identity-after">${avatar(c.person,24)}${identity}${likes}</div></div>`;
  return `<div class="comment">${avatar(c.person)}<div class="comment-main">${identity}${text}${likes}</div></div>`;
}
function empty() { return `<div class="empty-region">${icon('chat')}<strong>${t('emptyTitle')}</strong><p>${t('emptyBody')}</p></div>`; }
function close() { return `<button class="close" data-action="close" aria-label="${esc(t('close'))}">${icon('close')}</button>`; }
function heading(count,showClose=true) { return `<div class="peek-heading"><span>${t('comments')}<span class="heading-count">${count}</span></span>${showClose?close():''}</div>`; }
function headerTake(id,kind) {
  if (id==='09') return `<div class="poster ${kind==='text'?'no-photo':''}">${photograph(kind)}${kind==='text'?'':'<div class="scrim"></div>'}<p class="question">${esc(question(kind))}</p>${author(kind,false)}<button class="close ${kind==='text'?'plain-close':'hero-close'}" data-action="close" aria-label="${esc(t('close'))}">${icon('close')}</button></div>`;
  if (id==='07') return `<div class="compact-take">${photograph(kind)}${author(kind,false)}<p class="question">${esc(question(kind))}</p><button class="close ${kind==='text'?'plain-close':'hero-close'}" data-action="close" aria-label="${esc(t('close'))}">${icon('close')}</button></div>`;
  if (id==='08') return `<div class="compact-take">${author(kind,false)}<div class="mini-question">${photograph(kind)}<p class="question">${esc(question(kind))}</p></div></div>`;
  return `<div class="compact-take">${author(kind,false)}<p class="question">${esc(question(kind))}</p>${photograph(kind)}${votes()}<div class="time">${t('voteCount',{count:124})}</div></div>`;
}
function frame(id,theme) {
  const s=states[id]; const spec=specs.find(x=>x.id===id); const isCurrent=id==='current';
  const emptyShown=(s.state==='loading'?s.retained:s.state)==='empty';
  const all=commentsData(s.kind); const count=emptyShown?0:3;
  const shown=id==='03' ? [all[s.page]] : all.slice(0,isCurrent?3:spec.count);
  const body=emptyShown?empty():`<div class="comments">${shown.map(c=>comment(c,id)).join('')}</div>`;
  let header='';
  if (!isCurrent) {
    if (id==='02') header+='<div class="grab" aria-hidden="true"></div>';
    if (spec.family==='B') header+=headerTake(id,s.kind);
    if (id==='10') header+=`<div class="recall">${esc(question(s.kind))}</div>`;
    header+=heading(count,!['07','09'].includes(id));
  }
  const pager=id==='03'&&!emptyShown?`<div class="comment-pages">${[0,1,2].map(i=>`<button data-action="page" data-page="${i}" aria-pressed="${s.page===i}" aria-label="${esc(t('commentPage',{count:i+1}))}">${i+1}</button>`).join('')}</div>`:'';
  const loading=isCurrent?'':`<div class="loading-notice" aria-live="polite">${s.state==='loading'?t('loading'):''}</div>`;
  const peek=`<div class="peek">${header}${body}${pager}${loading}<button class="open-discussion" data-action="open">${t('openDiscussion')}${icon('arrow')}</button></div>`;
  const foreground=isCurrent?`<div class="current-stack"><div class="current-take">${feedRow(s.kind)}</div>${peek}</div>`:peek;
  return `<figure class="phone-wrap" data-theme="${theme}"><figcaption class="theme-caption">${t(theme)} · 390 × 844 pt</figcaption><div class="phone blur ${isCurrent?'current':`d${id}`} ${s.kind==='text'?'text-case':''}" data-id="${id}" data-kind="${s.kind}" data-state="${s.state}" data-theme="${theme}" aria-label="${esc(`${isCurrent?t('current'):t('name'+id)} · ${t(theme)}`)}">${background(s.kind)}<button class="dim" data-action="close" aria-label="${esc(t('close'))}"></button>${foreground}<button class="reopen" data-action="reopen">${t('reopen')}</button><div class="home-indicator" aria-hidden="true"></div></div></figure>`;
}
function controls(id) {
  const s=states[id];
  return `<div class="controls"><div class="seg" role="group" aria-label="${esc(t('fixtureKind'))}">${['photo','text','anonymous'].map(k=>`<button data-kind="${k}" data-dir="${id}" aria-pressed="${s.kind===k}">${t(k)}</button>`).join('')}</div><div class="seg state-controls" role="group" aria-label="${esc(t('fixtureState'))}">${['comments','empty','loading'].map(k=>`<button data-comment-state="${k}" data-dir="${id}" aria-pressed="${s.state===k}" title="${esc(t(k==='comments'?'withComments':k==='empty'?'emptyOption':'loadingOption'))}">${t(k==='comments'?'comments':k==='empty'?'emptyShort':'refreshShort')}</button>`).join('')}</div></div>`;
}
function direction(spec) {
  const {id,font,line,radius,family}=spec;
  return `<article class="direction" id="d${id}"><div class="copy"><span class="tag ${id==='01'?'rec-tag':''}">${id==='01'?t('recommend'):family}</span><div class="direction-top"><h3>${t('name'+id)}</h3><span class="number">${id}</span></div><p class="description">${t('desc'+id)}</p><p class="cotes">${t('proposalCotes',{font,line,radius})}</p></div>${controls(id)}<div class="pair">${frame(id,'light')}${frame(id,'dark')}</div></article>`;
}
let jev;
function source(label,description,url) { return `<div class="source-row"><strong>${label}</strong><p>${description}</p><a href="${url}" target="_blank" rel="noopener noreferrer">${url.replace('https://','')}</a></div>`; }
function render() {
  document.documentElement.lang=lang;
  document.body.dataset.display=display;
  document.body.dataset.pageTheme=display==='dark'?'dark':'light';
  document.querySelector('meta[name="theme-color"]').content=display==='dark'?'#000000':'#FFFFFF';
  document.title=t('title');
  const r=jev.recommendation;
  const sha='b34dfbfdb5ba3c1eaf5d8cfe1402877e09d6af33';
  const sourceBase=`https://github.com/TakeAppAIOrg/take-app/blob/${sha}/apps/mobile/src/`;
  document.getElementById('app').innerHTML=`
    <header class="intro"><div class="eyebrow">${t('eyebrow')}</div><h1>${t('title')}</h1><p class="lede">${t('subtitle')}</p><blockquote class="owner-quote">${t('quote')}</blockquote><p class="notice">${t('instructions')}</p><p class="notice">${t('scrollHint')}</p></header>
    <div class="toolbar"><div class="seg" role="group" aria-label="${esc(t('theme'))}">${['light','dark','both'].map(mode=>`<button data-display="${mode}" aria-pressed="${display===mode}">${t(mode)}</button>`).join('')}</div><select id="language" aria-label="${esc(t('language'))}">${langs.map((l,i)=>`<option value="${l}" ${lang===l?'selected':''}>${['Français','English','Español','Deutsch','Italiano','Português'][i]}</option>`).join('')}</select></div>
    <div class="rec"><span class="tag rec-tag">${t('recommend')}</span><div class="rec-title"><a href="#d01">01 · ${t('name01')}</a></div><p class="description">${t('recommendReason')}</p><p class="probability">${t('choiceProbability',{p1:pct(r.probabilities['01']),p5:pct(r.probabilities['05']),p2:pct(r.probabilities['02']),p6:pct(r.probabilities['06']),confidence:pct(r.confidence)})}</p><p class="notice">${t('uncertainty')}</p><nav class="jump"><a href="#current">${t('current')}</a><a href="#familyA">${t('familyA')}</a><a href="#familyB">${t('familyB')}</a><a href="#d10">${t('familyC')}</a><a href="#ranking">${t('rankTitle')}</a></nav></div>
    <section id="current" class="direction"><div class="copy"><span class="tag">${t('current')}</span><h2>${t('currentTitle')}</h2><p class="description">${t('currentDescription')}</p><p class="notice">${t('reconstructed')}</p></div>${controls('current')}<div class="pair">${frame('current','light')}${frame('current','dark')}</div></section>
    <div class="section-label" id="familyA">${t('familyA')}</div>${specs.filter(s=>s.family==='A').map(direction).join('')}
    <div class="section-label" id="familyB">${t('familyB')}</div>${specs.filter(s=>s.family==='B').map(direction).join('')}
    <div class="section-label">${t('familyC')}</div>${direction(specs[9])}
    <section class="sources" id="ranking"><h2>${t('rankTitle')}</h2><p class="notice">${t('rankMethod')}</p><div class="rank-table-wrap"><table class="rank-table"><thead><tr><th>${t('direction')}</th><th>${t('legibility')}</th><th>${t('fidelity')}</th><th>${t('coherence')}</th><th>${t('weighted')}</th></tr></thead><tbody>${jev.ranking.map(row=>`<tr><td><a href="#d${row.id}">${row.id} · ${t('name'+row.id)}</a></td><td>${num(row.legibility)}</td><td>${num(row.fidelity)}</td><td>${num(row.coherence)}</td><td>${num(row.weighted)}</td></tr>`).join('')}</tbody></table></div><a href="jev.json">${t('jevEvidence')}</a></section>
    <section class="sources"><h2>${t('sourceTitle')}</h2>
      ${source('X',t('xNote'),'https://help.x.com/en/using-x/x-conversations')}
      ${source('Instagram',t('instagramNote'),'https://www.ubergizmo.com/2016/01/instagram-peek-returns-to-android/')}
      ${source('iOS · Apple',t('iosNote'),'https://developer.apple.com/design/human-interface-guidelines/context-menus')}
      ${source('origin/main · b34dfbfdb5',t('codeNote'),sourceBase+'components/feed/TakeCommentsPeekOverlay.tsx#L25')}
      <div class="source-row"><p>${t('codeCorrection')}</p><a href="${sourceBase}components/feed/useCommentsPeekGesture.ts#L14">useCommentsPeekGesture.ts</a> · <a href="${sourceBase}components/feed/CommentsPeekCard.tsx#L59">CommentsPeekCard.tsx</a> · <a href="${sourceBase}components/poll/TakeActionsProvider.tsx#L40">TakeActionsProvider.tsx</a></div>
      ${source('Inter · design-tokens.ts',t('paletteNote'),sourceBase+'constants/design-tokens.ts#L16')}
      <p class="notice">${t('productRules')}</p>
      ${source(t('photo'),t('photosCredit'),'https://adamlepelletier923-gif.github.io/take-directions-2/')}
      <p class="notice">${t('limits')}</p>
    </section>`;
  document.querySelectorAll('.phone').forEach(phone=>{phone.dataset.closed='false';});
}
function updateURL(id) {
  const p=new URLSearchParams({lang,theme:display});
  if(id) { const s=states[id]; p.set('d',id);p.set('kind',s.kind);p.set('state',s.state); }
  history.replaceState(null,'',`${location.pathname}?${p}${location.hash}`);
}
function redrawFrames(id) {
  const container=document.querySelector(id==='current'?'#current .pair':`#d${id} .pair`);
  const positions=Array.from(container.querySelectorAll('.phone')).map(phone=>({theme:phone.dataset.theme,kind:phone.dataset.kind,top:phone.querySelector('.comments')?.scrollTop??0}));
  container.innerHTML=frame(id,'light')+frame(id,'dark');
  positions.forEach(position=>{if(position.kind===states[id].kind){const comments=container.querySelector(`.phone[data-theme="${position.theme}"] .comments`);if(comments)comments.scrollTop=position.top;}});
  const controlsNode=document.querySelector(id==='current'?'#current .controls':`#d${id} .controls`);
  controlsNode.outerHTML=controls(id);
  updateURL(id);
}
document.addEventListener('click',event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.display) {
    display=target.dataset.display;document.body.dataset.display=display;document.body.dataset.pageTheme=display==='dark'?'dark':'light';document.querySelector('meta[name="theme-color"]').content=display==='dark'?'#000000':'#FFFFFF';
    document.querySelectorAll('[data-display]').forEach(b=>b.setAttribute('aria-pressed',String(b===target)));updateURL();return;
  }
  if(target.dataset.kind&&target.dataset.dir) { states[target.dataset.dir].kind=target.dataset.kind;redrawFrames(target.dataset.dir);return; }
  if(target.dataset.commentState&&target.dataset.dir) { const id=target.dataset.dir;const state=target.dataset.commentState;states[id].state=state;if(state!=='loading')states[id].retained=state;redrawFrames(id);return; }
  const phone=target.closest('.phone');if(!phone)return;
  const action=target.dataset.action;
  if(action==='close') {phone.classList.add('closed');phone.dataset.closed='true';phone.querySelector('.reopen').focus({preventScroll:true});}
  if(action==='reopen') {phone.classList.remove('closed');phone.dataset.closed='false';phone.querySelector('.open-discussion').focus({preventScroll:true});}
  if(action==='page') {states[phone.dataset.id].page=Number(target.dataset.page);redrawFrames(phone.dataset.id);}
  if(action==='open') { const dialog=document.createElement('div');dialog.className='mock-dialog';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label',t('mockTitle'));dialog.innerHTML=`<h4>${t('mockTitle')}</h4><p>${t('mockBody')}</p><button data-action="back">${t('backPreview')}</button>`;phone.append(dialog);phone.querySelector('.peek').inert=true;phone.querySelector('.dim').inert=true;dialog.querySelector('button').focus({preventScroll:true}); }
  if(action==='back') {phone.querySelector('.mock-dialog')?.remove();phone.querySelector('.peek').inert=false;phone.querySelector('.dim').inert=false;phone.querySelector('.open-discussion').focus({preventScroll:true});}
});
document.addEventListener('change',event=>{
  if(event.target.id==='language') {lang=event.target.value;render();updateURL();return;}
  const id=event.target.dataset.stateDir;if(!id)return;
  const state=event.target.value;states[id].state=state;if(state!=='loading')states[id].retained=state;redrawFrames(id);
});
document.addEventListener('keydown',event=>{
  const activeDialog=document.activeElement?.closest('.mock-dialog');
  if(event.key==='Tab'&&activeDialog){event.preventDefault();activeDialog.querySelector('button').focus({preventScroll:true});return;}
  if(event.key!=='Escape')return;
  const phone=document.activeElement?.closest('.phone');if(!phone)return;
  if(phone.querySelector('.mock-dialog')) phone.querySelector('[data-action=back]').click();
  else phone.querySelector('[data-action=close]').click();
});
fetch('jev.json').then(r=>{if(!r.ok)throw new Error('Jev evidence unavailable');return r.json();}).then(data=>{jev=data;render();});
