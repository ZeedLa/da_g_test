/* =========================================================
js/main.js — логика главной страницы (index.html)
Каталог — в products.js, корзина — в cart.js.
========================================================= */
import {PRODUCTS} from './products.js';
import {addToCart,syncBadges} from './cart.js';

/* =========================================================
0. Утилиты
========================================================= */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const lerp=(a,b,t)=>a+(b-a)*t, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

syncBadges();

/* =========================================================
1. Типографика героя + циклическая смена второй строки
========================================================= */
$$('#heroTitle .line').forEach(line=>{
const txt=line.textContent; line.textContent='';
[...txt].forEach((c,i)=>{
const s=document.createElement('span');
s.className='ch'; s.textContent=c===' ' ? '\u00A0' : c;
s.style.setProperty('--d',(0.15+i*0.035)+'s');
line.appendChild(s);
});
});
requestAnimationFrame(()=>document.body.classList.add('ready'));
setTimeout(()=>$$('.hero-meta,.hero-right').forEach(el=>el.classList.add('in')),400);

/* --- цикл слов: «для гольфа» → «для жизни» → «для вас» … --- */
const CYCLE_WORDS=['для гольфа','для жизни','для вас','для стиля','для побед'];
const cycleLine=$$('#heroTitle .line')[1];
let cycleIdx=0;
function buildCycleChars(text){
cycleLine.textContent='';
[...text].forEach(c=>{
const s=document.createElement('span');
s.className='ch';s.textContent=c===' '?'\u00A0':c;
s.style.transition='none';
s.style.transform='translateY(115%)';
s.style.opacity='0';
cycleLine.appendChild(s);
});
}
function cycleText(){
if(typeof idx!=='undefined'&&idx!==0)return; /* крутим только на первом экране */
const chars=cycleLine.querySelectorAll('.ch');
if(!chars.length)return;
chars.forEach((ch,i)=>{
ch.style.transition=`transform .42s cubic-bezier(.55,0,.1,1) ${i*.022}s,opacity .38s ease ${i*.022}s`;
ch.style.transform='translateY(-115%)';
ch.style.opacity='0';
});
setTimeout(()=>{
cycleIdx=(cycleIdx+1)%CYCLE_WORDS.length;
buildCycleChars(CYCLE_WORDS[cycleIdx]);
void cycleLine.offsetHeight;
cycleLine.querySelectorAll('.ch').forEach((ch,i)=>{
ch.style.transition=`transform .58s cubic-bezier(.2,.85,.25,1) ${i*.03}s,opacity .52s ease ${i*.03}s`;
ch.style.transform='translateY(0)';
ch.style.opacity='1';
});
},420+chars.length*22+100);
}
if(!reduced)setTimeout(()=>setInterval(cycleText,4200),4800);

/* =========================================================
2. Меню
========================================================= */
const burger=$('#burger');
burger.addEventListener('click',()=>{
const open=document.body.classList.toggle('menu-open');
burger.setAttribute('aria-expanded',open);
});
const closeMenu=()=>{document.body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false');};

/* =========================================================
3. Каталог пришёл из products.js
========================================================= */

/* =========================================================
4. Слайдер (+ драг мышкой на десктопе и свайп на смартфоне)
========================================================= */
const track=$('#track');
PRODUCTS.forEach((p,i)=>{
const el=document.createElement('article');
el.className='card';el.style.setProperty('--d',(i%4)*0.09+'s');
el.tabIndex=0;
el.setAttribute('role','link');
el.setAttribute('aria-label',`${p.name} — открыть страницу вещи`);
el.innerHTML=`
<div class="card-img">
<img class="ph-a" src="Items/item_${p.code}1.jpg" alt="${p.name} — вид 1" loading="lazy" draggable="false">
<img class="ph-b" src="Items/item_${p.code}2.jpg" alt="${p.name} — вид 2" loading="lazy" draggable="false">
<div class="card-buy">
<div class="sizes">
<button class="size" data-s="S">S</button>
<button class="size" data-s="M">M</button>
</div>
<button class="add">в корзину</button>
</div>
</div>
<div class="card-meta">
<div><h4>${p.name}</h4><p>${p.desc}</p></div>
<span class="price">${p.price}</span>
</div>`;
track.appendChild(el);
});
const prevB=$('#prev'),nextB=$('#next'),countEl=$('#count'),colLayer=$('#colLayer'),sliderEl=$('.slider');
let idxS=0,perView=4;
const pad=n=>String(n).padStart(2,'0');
const GAP=24;
function calcPer(){perView=innerWidth>1150?4:innerWidth>760?2:1;}
function calcStep(){
const w=track.getBoundingClientRect().width;
return (w-(perView-1)*GAP)/perView+GAP;
}
function sliderSet(x){track.style.transform=`translateX(${x}px)`;}
function sliderGo(){
const max=Math.max(0,PRODUCTS.length-perView);idxS=clamp(idxS,0,max);
track.style.transition='';                      /* возвращаем CSS-анимацию для доводки */
sliderSet(-idxS*calcStep());
countEl.textContent=`${pad(idxS+1)}–${pad(Math.min(idxS+perView,PRODUCTS.length))} / ${pad(PRODUCTS.length)}`;
prevB.disabled=idxS===0;nextB.disabled=idxS>=max;
}
prevB.addEventListener('click',()=>{idxS--;sliderGo();});
nextB.addEventListener('click',()=>{idxS++;sliderGo();});
addEventListener('resize',()=>{calcPer();sliderGo();});
calcPer();sliderGo();

/* ---------- драг мышкой (десктоп) и свайп (смартфон) ---------- */
let dragging=false,dragX0=0,dragBase=0,dragDX=0,dragMoved=false;
let vel=0,lastPX=0,lastPT=0,suppressClick=false;
sliderEl.addEventListener('pointerdown',e=>{
if(dragging||!e.isPrimary)return;
if(e.pointerType==='mouse'&&e.button!==0)return;
dragging=true;dragMoved=false;
dragX0=lastPX=e.clientX;dragDX=0;vel=0;lastPT=performance.now();
dragBase=-idxS*calcStep();
track.style.transition='none';                  /* лента следует за рукой без анимации */
sliderEl.classList.add('grabbing');
});
addEventListener('pointermove',e=>{
if(!dragging)return;
dragDX=e.clientX-dragX0;
if(Math.abs(dragDX)>4)dragMoved=true;
const step=calcStep(),max=Math.max(0,PRODUCTS.length-perView);
let x=dragBase+dragDX;
const lo=-max*step,hi=0;                        /* «резинка» на краях списка */
if(x>hi)x=hi+(x-hi)*.3;
if(x<lo)x=lo+(x-lo)*.3;
sliderSet(x);
const now=performance.now(),dt=now-lastPT;
if(dt>0){vel=vel*.6+((e.clientX-lastPX)/dt)*.4;lastPX=e.clientX;lastPT=now;}
});
function endDrag(){
if(!dragging)return;
dragging=false;
sliderEl.classList.remove('grabbing');
const step=calcStep(),max=Math.max(0,PRODUCTS.length-perView);
let target=Math.round(idxS-dragDX/step);        /* доводка до ближайшей позиции */
if(Math.abs(vel)>.45&&Math.abs(dragDX)>10){     /* резкий бросок — ещё шаг по инерции */
target=vel<0?Math.max(target,idxS+1):Math.min(target,idxS-1);
}
idxS=clamp(target,0,max);
if(dragMoved){suppressClick=true;setTimeout(()=>suppressClick=false,300);}
sliderGo();
}
addEventListener('pointerup',endDrag);
addEventListener('pointercancel',endDrag);
addEventListener('blur',endDrag);
sliderEl.addEventListener('dragstart',e=>e.preventDefault());

/* тост */
/* тост: ретриггер, не блокирует клики, не обрезается */
const toast=$('#toast'),toastMsg=$('#toastMsg');let toastT;
function showToast(html){
toastMsg.innerHTML=html;
toast.classList.remove('show');
void toast.offsetWidth; /* перезапуск анимации при повторном добавлении */
toast.classList.add('show');
clearTimeout(toastT);
toastT=setTimeout(()=>toast.classList.remove('show'),2600);
}

/* клики по карточкам: размеры/корзина — на месте, всё остальное — на страницу вещи */
track.addEventListener('click',e=>{
if(suppressClick){e.preventDefault();e.stopPropagation();return;} /* клик сразу после драга — игнор */
const sizeB=e.target.closest('.size');
if(sizeB){
const card=sizeB.closest('.card');
card.querySelectorAll('.size').forEach(s=>s.classList.remove('on'));
sizeB.classList.add('on');return;
}
const addB=e.target.closest('.add');
if(addB){
const card=addB.closest('.card');
const i=[...track.children].indexOf(card);
let sel=card.querySelector('.size.on');
if(!sel){sel=card.querySelector('.size[data-s="M"]');sel.classList.add('on');}
addToCart(PRODUCTS[i].code, sel.dataset.s);
showToast(`<b>${PRODUCTS[i].name}</b> · размер ${sel.dataset.s} — в корзине`);
return;
}
const card=e.target.closest('.card');
if(card){
const i=[...track.children].indexOf(card);
location.href='item.html?code='+PRODUCTS[i].code;
}
});
/* клавиатура: Enter/Space открывает страницу вещи */
track.addEventListener('keydown',e=>{
if(e.key==='Enter'||e.key===' '){
const card=e.target.closest('.card');
if(card){
e.preventDefault();
const i=[...track.children].indexOf(card);
location.href='item.html?code='+PRODUCTS[i].code;
}
}
});

/* =========================================================
5. Поэкранная навигация: один жест = один экран (0–5)
========================================================= */
const STEPS=[
{n:'02',k:'DA',t:'Мы назвали бренд самым коротким словом, которое понимают везде.'},
{n:'03',k:'DA',t:'«Да» — это когда вещь села с первого раза. Когда поло не нужно одёргивать после замаха, а после игры не нужно переодеваться, чтобы поехать на ужин.'},
{n:'04',k:'DA',t:'Когда цвет ровно тот, что вы искали, и больше его нет ни у кого.'},
];
const heroLayer=$('#heroLayer'),stmtLayer=$('#stmtLayer'),stmtInner=$('#stmtInner'),vidLayer=$('#vidLayer');
let idx=0,locked=false,curStep=-1,stmtWasOn=false,colSeen=false;
let setCam=()=>{};
let staticUpd=()=>{}; /* в режиме статичных фонов подставляет фон текущего экрана */
function renderStep(s){
const d=STEPS[s];
stmtInner.innerHTML=
`<p class="kicker"><b>${d.n}</b><img class="ast" src="asteriks.svg" alt="" aria-hidden="true" draggable="false">${d.k}</p>`+
`<p class="txt">${d.t}</p>`+
(d.cta?`<button class="btn" data-go="4">${d.cta} <i>→</i></button>`:'');
}
function applyView(){
heroLayer.classList.toggle('off',idx!==0);
const on=idx>=1&&idx<=3;
stmtLayer.classList.toggle('on',on);
/* десктоп: слева только экран 2; на смартфоне все три слева через CSS */
stmtLayer.classList.toggle('left',idx===1);
if(on){
const s=idx-1;
if(s!==curStep){
if(curStep===-1||!stmtWasOn){renderStep(s);curStep=s;}
else{
stmtInner.classList.add('fade');
setTimeout(()=>{
renderStep(s);curStep=s;
stmtInner.classList.remove('fade');
},reduced?0:340);
}
}
}
stmtWasOn=on;
colLayer.classList.toggle('on',idx===4);
if(idx===4&&!colSeen){colSeen=true;colLayer.classList.add('in');sliderGo();}
vidLayer.classList.toggle('on',idx===5);
document.body.classList.toggle('scrolled',idx>0);
document.body.classList.toggle('at-hero',idx===0); /* подсказка скролла — только на экране 1 */
setCam(Math.min(idx,3));
staticUpd();
}
function go(n){
n=clamp(n,0,5);
if(n===idx||locked)return;
locked=true;setTimeout(()=>locked=false,reduced?120:1050);
idx=n;applyView();closeMenu();
}
/* колесо */
let acc=0,lastWheel=0;
addEventListener('wheel',e=>{
if(document.body.classList.contains('menu-open')){e.preventDefault();return;}
if(idx===4){
const canDown=colLayer.scrollTop+colLayer.clientHeight<colLayer.scrollHeight-8;
const canUp=colLayer.scrollTop>4;
if(e.deltaY>0&&canDown)return;
if(e.deltaY<0&&canUp)return;
}
if(idx===5){
if(e.deltaY<0&&vidLayer.scrollTop>4)return;
if(e.deltaY>0&&vidLayer.scrollTop+vidLayer.clientHeight<vidLayer.scrollHeight-8)return;
}
e.preventDefault();
if(locked){acc=0;return;}
const now=performance.now();
if(now-lastWheel>260)acc=0;
lastWheel=now;
acc+=e.deltaY;
if(Math.abs(acc)>70){const dir=acc>0?1:-1;acc=0;go(idx+dir);}
},{passive:false});
/* свайпы */
let tY=null,tX=null;
addEventListener('touchstart',e=>{tY=e.touches[0].clientY;tX=e.touches[0].clientX;},{passive:true});
addEventListener('touchend',e=>{
if(tY===null)return;
const dy=tY-e.changedTouches[0].clientY, dx=tX-e.changedTouches[0].clientX;
tY=null;
if(Math.abs(dy)>60&&Math.abs(dy)>Math.abs(dx)){
if(idx===4&&e.target.closest('#colLayer')){
const atBottom=colLayer.scrollTop+colLayer.clientHeight>=colLayer.scrollHeight-24;
const atTop=colLayer.scrollTop<=4;
if(dy>0&&!atBottom)return;
if(dy<0&&!atTop)return;
}
if(idx===5&&e.target.closest('#vidLayer')&&vidLayer.scrollHeight>vidLayer.clientHeight+8)return;
go(idx+(dy>0?1:-1));
}
},{passive:true});
/* клавиатура */
addEventListener('keydown',e=>{
if(['ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();go(idx+1);}
else if(['ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(idx-1);}
else if(e.key==='Home')go(0);
else if(e.key==='End')go(5);
});
/* ссылки data-go */
document.addEventListener('click',e=>{
const g=e.target.closest('[data-go]');
if(g){e.preventDefault();go(+g.dataset.go);}
});

/* переход с других страниц: index.html?go=0…5 */
const startGo=parseInt(new URLSearchParams(location.search).get('go'),10);
if(Number.isFinite(startGo))idx=clamp(startGo,0,5);
applyView();

/* =========================================================
5.5. Автофит большой надписи в футере по доступной ширине
========================================================= */
const bfWord = $('.bf-word');
const bfFit = $('.bf-fit');
if (bfWord && bfFit) {
let bfLastWidth = 0;
let bfRaf = 0;
const fitBigFoot = (force = false) => {
const avail = bfWord.getBoundingClientRect().width;
if (!avail) return;
if (!force && bfLastWidth && Math.abs(avail - bfLastWidth) < 0.5) {
return;
}
const currentWidth = bfFit.getBoundingClientRect().width;
if (!currentWidth) return;
// Если уже почти вписались — лишний раз не дёргаем размер
if (bfWord.style.fontSize && Math.abs(avail - currentWidth) <= 0.6) {
bfLastWidth = avail;
return;
}
const currentSize = parseFloat(getComputedStyle(bfWord).fontSize);
if (!currentSize) return;
const nextSize = currentSize * (avail / currentWidth);
bfWord.style.fontSize = nextSize.toFixed(3) + 'px';
bfLastWidth = avail;
};
const scheduleFit = (force = false) => {
cancelAnimationFrame(bfRaf);
bfRaf = requestAnimationFrame(() => fitBigFoot(force));
};
// Первый расчёт
scheduleFit(true);
// Ресайз окна
addEventListener('resize', () => scheduleFit(true));
// Полная загрузка страницы
addEventListener('load', () => scheduleFit(true));
// Когда догрузятся веб-шрифты — обязательно пересчитать
if (document.fonts && document.fonts.ready) {
document.fonts.ready.then(() => scheduleFit(true));
}
// Если ширина контейнера меняется по layout-причинам
if ('ResizeObserver' in window) {
new ResizeObserver(() => {
const w = bfWord.getBoundingClientRect().width;
if (w && (!bfLastWidth || Math.abs(w - bfLastWidth) > 0.5)) {
scheduleFit(true);
}
}).observe(bfWord);
}
}

/* =========================================================
6. Видео-экран
========================================================= */
const vid=$('#brandVideo'),vidSound=$('#vidSound'),vidPause=$('#vidPause');
if(vid){
vidSound.addEventListener('click',()=>{
vid.muted=!vid.muted;
vidSound.textContent=vid.muted?'✕':'♪';
vidSound.setAttribute('aria-pressed',String(!vid.muted));
if(!vid.muted&&vid.paused)vid.play().catch(()=>{});
});
vidPause.addEventListener('click',()=>{
if(vid.paused){vid.play().catch(()=>{});}else{vid.pause();}
});
vid.addEventListener('play',()=>vidPause.textContent='❚❚');
vid.addEventListener('pause',()=>vidPause.textContent='▶');
vid.addEventListener('error',()=>showToast('<b>brandvideo.mp4</b> не найден — положите видео рядом с index.html'));
new IntersectionObserver(es=>es.forEach(en=>{
if(reduced)return;
if(en.isIntersecting){vid.play().catch(()=>{});}else{vid.pause();}
}),{threshold:.2}).observe(vid);
}

/* =========================================================
6.5. Прелоадер и политика загрузки
ДЕСКТОП: только 100% — при обрыве повторяем попытки до успеха,
заглушки не показываются никогда.
СМАРТФОН: одна попытка; ошибка или 15 с без новых данных —
вместо 3D на экраны 1–4 встают статичные фоны static/bg1…bg4.jpg.
========================================================= */
const ldBar=$('#ldBar'),ldFill=$('#ldFill'),ldStatus=$('#ldStatus');
const stageEl=$('#stage');
const setLd=t=>{ldStatus.textContent=t;};
const hideLoader=()=>$('#loader').classList.add('done');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const bootAt=performance.now();
const isMobile=matchMedia('(max-width:760px)').matches;
function onGlbProgress(ev){
if(ev.lengthComputable&&ev.total>0){
/* сервер отдал размер файла — рисуем честные проценты */
ldBar.classList.remove('ind');
const p=Math.min(1,ev.loaded/ev.total);
ldFill.style.width=(p*100).toFixed(1)+'%';
setLd('загрузка сцены… '+Math.round(p*100)+'%');
}else if(ev.loaded){
/* размер неизвестен — показываем, сколько уже скачано */
setLd('загрузка сцены… '+(ev.loaded/1048576).toFixed(1).replace('.',',')+' мб');
}
}
/* одна попытка загрузки. На смартфоне: если 15 секунд не приходит
ни байта — считаем это недогрузом (возвращаем null). Десктоп ждёт
столько, сколько нужно: браузер сам оборвёт мёртвое соединение. */
function loadGlb(GLTFLoader){
return new Promise(res=>{
let settled=false,idle=0;
const done=v=>{if(!settled){settled=true;clearTimeout(idle);res(v);}};
const arm=()=>{clearTimeout(idle);if(isMobile)idle=setTimeout(()=>done(null),15000);};
arm();
new GLTFLoader().load('dagolf_scene.glb',done,ev=>{arm();onGlbProgress(ev);},()=>done(null));
});
}
/* статичные фоны вместо непрогрузившейся 3D-сцены (только смартфон) */
function staticFallback(){
document.body.classList.add('static-bg');
staticUpd=()=>{stageEl.style.backgroundImage='url(static/bg'+(Math.min(idx,3)+1)+'.jpg)';};
staticUpd();
/* даём видимому фону шанс догрузиться до снятия прелоадера,
остальные три подтягиваются в фоне */
const cur='static/bg'+(Math.min(idx,3)+1)+'.jpg';
const wait=new Promise(r=>{const im=new Image();im.onload=im.onerror=r;im.src=cur;});
return Promise.race([wait,sleep(3000)]).then(()=>{
for(let i=1;i<=4;i++){const im=new Image();im.src='static/bg'+i+'.jpg';}
});
}

/* =========================================================
7. 3D-сцена (запускается только с полностью догруженным GLB)
========================================================= */
async function initScene(THREE,gltf){
const {EffectComposer}=await import('three/addons/postprocessing/EffectComposer.js');
const {RenderPass}=await import('three/addons/postprocessing/RenderPass.js');
const {BokehPass}=await import('three/addons/postprocessing/BokehPass.js');
const {UnrealBloomPass}=await import('three/addons/postprocessing/UnrealBloomPass.js');
const {OutputPass}=await import('three/addons/postprocessing/OutputPass.js');
const PAPER=0xe9e2ce; /* бежевый фон/туман сцены */
/* рендерер занимает ровно #stage
(на десктопе весь экран, на смартфоне — нижние 56vh) */
const stW=()=>stageEl.clientWidth||innerWidth;
const stH=()=>stageEl.clientHeight||innerHeight;
/* preserveDrawingBuffer нужен, чтобы читать пиксели кадра для плашки */
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(stW(),stH());
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
stageEl.appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.background=new THREE.Color(PAPER);
scene.fog=new THREE.Fog(PAPER,9,30);
const cam=new THREE.PerspectiveCamera(42,stW()/stH(),0.05,300);
const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,cam));
const bokeh=new BokehPass(scene,cam,{focus:8,aperture:0,maxblur:0});
composer.addPass(bokeh);
const bloom=new UnrealBloomPass(
new THREE.Vector2(stW(),stH()),.26,.55,.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());
/* ---- бесшовная плашка ----
Сэмплируем верх кадра; берём только яркость (оттенок игнорируется)
и маппим её в бежевый диапазон #E3D9BE(227,217,190)…#FAF6E8(250,246,232). */
const smp=document.createElement('canvas');smp.width=1;smp.height=1;
const smpCtx=smp.getContext('2d',{willReadFrequently:true});
const bgT={r:250,g:246,b:232};
const bgC={r:250,g:246,b:232};
let lastSmp=0,lastCss='';
function sampleTop(){
const cv=renderer.domElement;
if(cv.width<4||cv.height<4)return;
const strip=Math.max(2,Math.round(cv.height*.015));
try{
smpCtx.clearRect(0,0,1,1);
smpCtx.drawImage(cv,0,0,cv.width,strip,0,0,1,1);
const d=smpCtx.getImageData(0,0,1,1).data;
if(d[3]>0){
const lum=.2126*d[0]+.7152*d[1]+.0722*d[2];
const t=clamp(lum/255,0,1); /* 0 = тёмный беж, 1 = бумага */
bgT.r=Math.round(227+(250-227)*t);
bgT.g=Math.round(217+(246-217)*t);
bgT.b=Math.round(190+(232-190)*t);
}
}catch(e){}
}
let center=new THREE.Vector3(),radius=6;
const cams=[];
const dofSet=new Set(['camera3','camera4']);
function setupLights(){
scene.add(new THREE.HemisphereLight(0xffffff,0xd2c5a6,1.2));
const lamp=(color,i,dx,dy,dz)=>{
const l=new THREE.DirectionalLight(color,i);
const off=new THREE.Vector3(dx,dy,dz).normalize().multiplyScalar(Math.max(radius*2.5,10));
l.position.copy(center).add(off);
l.target.position.copy(center);
scene.add(l,l.target);
return l;
};
lamp(0xffffff,2.6, 1.4,1.8, 1.2);
lamp(0xf7f0de,1.1,-1.6, .6,  .9);
lamp(0xffffff,2.0, -.5,1.4,-1.6);
}
function defaultCams(){
const defs=[[0,.18,1.0,'Camera1'],[1.05,.42,1.15,'Camera2'],[-0.95,.16,1.05,'Camera3'],[2.8,.9,1.3,'Camera4']];
defs.forEach(([az,el,dd,name])=>{
const c=new THREE.PerspectiveCamera(40,stW()/stH(),.1,radius*25);
c.position.set(
center.x+Math.sin(az)*Math.cos(el)*radius*dd*1.6,
center.y+Math.sin(el)*radius*dd*1.6+.4,
center.z+Math.cos(az)*Math.cos(el)*radius*dd*1.6);
c.lookAt(center);c.name=name;cams.push(c);
});
}
function fitFog(){scene.fog.near=radius*1.7;scene.fog.far=radius*7;}
/* сцена уже догружена — добавляем и вычитываем камеры */
scene.add(gltf.scene);
const box=new THREE.Box3().setFromObject(gltf.scene);
box.getCenter(center);
radius=Math.max(.001,box.getSize(new THREE.Vector3()).length()/2);
gltf.scene.traverse(o=>{
if(o.isCamera){
o.aspect=stW()/stH();o.updateProjectionMatrix();
cams.push(o);
const u=o.userData||{};
if(u.dof===true||u.dof===1||u.dof==='true')dofSet.add(o.name.toLowerCase());
}
});
cams.sort((a,b)=>{
const na=+((a.name.match(/(\d+)/)||[])[1]||99);
const nb=+((b.name.match(/(\d+)/)||[])[1]||99);
return na-nb;
});
if(!cams.length)defaultCams();
fitFog();
setupLights();
if(cams.length<4)console.warn('Найдено камер:',cams.length,'— недостающие дополнены дефолтными');
const state={pos:new THREE.Vector3(),quat:new THREE.Quaternion(),fov:42};
const tgt  ={pos:new THREE.Vector3(),quat:new THREE.Quaternion(),fov:42,dof:0,focus:8};
let dofAmt=0,focus=8;
/* кадрам 3–4 чуть расширяем угол обзора — сцена влезает целиком,
позиции камер остаются «задуманными». Нужен другой масштаб — правьте числа. */
const FOV_BOOST=[0,0,6,6];
setCam=i=>{
const ii=clamp(i,0,cams.length-1);
const c=cams[ii];
c.updateMatrixWorld();
tgt.pos.setFromMatrixPosition(c.matrixWorld);
tgt.quat.setFromRotationMatrix(c.matrixWorld);
tgt.fov=(c.fov||42)+(FOV_BOOST[ii]||0);
tgt.focus=tgt.pos.distanceTo(center);
tgt.dof=dofSet.has((c.name||'').toLowerCase())?1:0;
};
setCam(0);
state.pos.copy(tgt.pos);state.quat.copy(tgt.quat);state.fov=tgt.fov;
const mouse={x:0,y:0,tx:0,ty:0};
if(!reduced)addEventListener('pointermove',e=>{
mouse.tx=(e.clientX/innerWidth-.5)*2;
mouse.ty=(e.clientY/innerHeight-.5)*2;
},{passive:true});
let prevT=performance.now();
renderer.setAnimationLoop(t=>{
const dt=Math.min(.05,(t-prevT)/1000);prevT=t;
const k=reduced?1:1-Math.exp(-dt*2.3);
state.pos.lerp(tgt.pos,k);
state.quat.slerp(tgt.quat,k);
state.fov+=(tgt.fov-state.fov)*k;
dofAmt+=(tgt.dof-dofAmt)*(1-Math.exp(-dt*2));
focus+=(tgt.focus-focus)*k;
mouse.x=lerp(mouse.x,mouse.tx,1-Math.exp(-dt*4));
mouse.y=lerp(mouse.y,mouse.ty,1-Math.exp(-dt*4));
cam.position.copy(state.pos);
cam.quaternion.copy(state.quat);
cam.fov=state.fov;cam.updateProjectionMatrix();
if(!reduced){
const par=radius*.001;
cam.translateX(mouse.x*par);
cam.translateY(-mouse.y*par*.5);
cam.rotateY(mouse.x*.003);
cam.rotateX(-mouse.y*.002);
}
bokeh.enabled=dofAmt>.004;
bokeh.uniforms.focus.value=focus;
bokeh.uniforms.aperture.value=.0028*dofAmt;
bokeh.uniforms.maxblur.value=.011*dofAmt;
composer.render();
/* сэмпл верхнего края кадра → плавное перекрашивание плашки и фейда */
if(t-lastSmp>110){lastSmp=t;sampleTop();}
const kb=reduced?1:1-Math.exp(-dt*4);
bgC.r+=(bgT.r-bgC.r)*kb;bgC.g+=(bgT.g-bgC.g)*kb;bgC.b+=(bgT.b-bgC.b)*kb;
const css=`${Math.round(bgC.r)},${Math.round(bgC.g)},${Math.round(bgC.b)}`;
if(css!==lastCss){lastCss=css;document.documentElement.style.setProperty('--scene-bg',css);}
});
setCam(Math.min(idx,3));
addEventListener('resize',()=>{
cam.aspect=stW()/stH();cam.updateProjectionMatrix();
renderer.setSize(stW(),stH());
composer.setSize(stW(),stH());
bokeh.materialBokeh.uniforms['aspect'].value=cam.aspect;
cams.forEach(c=>{if(c.isPerspectiveCamera){c.aspect=stW()/stH();c.updateProjectionMatrix();}});
sliderGo();
});
}

/* =========================================================
8. Запуск
========================================================= */
async function boot(){
setLd('загрузка сцены…');
const THREE=await import('three');
const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
let gltf=null;
if(isMobile){
/* смартфон: одна попытка, при недогрузе — статичные фоны */
gltf=await loadGlb(GLTFLoader);
if(!gltf){
setLd('сцена не догрузилась — лёгкие фоны');
await staticFallback();
await Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),sleep(1200)]);
setLd('готово');
hideLoader();
return;
}
}else{
/* десктоп: никаких заглушек — ждём 100% сколько потребуется */
let attempt=0;
while(!gltf){
attempt++;
if(attempt>1){
ldBar.classList.add('ind');
ldFill.style.width='0%';
setLd('связь прервалась — пробуем ещё раз ('+attempt+')');
await sleep(2000);
}
gltf=await loadGlb(GLTFLoader);
}
}
ldBar.classList.remove('ind');
ldFill.style.width='100%';
setLd('сцена загружена');
await initScene(THREE,gltf);
/* минимум 0,45 с на экране; ждём первые кадры и шрифты */
await sleep(Math.max(0,450-(performance.now()-bootAt)));
await Promise.all([
document.fonts?document.fonts.ready:Promise.resolve(),
new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))
]);
setLd('готово');
hideLoader();
}
/* десктоп не сдаётся даже при сбое библиотек или WebGL;
смартфон в любой непонятной ситуации уходит на статичные фоны */
(async()=>{
if(isMobile){
try{await boot();}
catch(e){
console.warn('3D недоступен:',e);
setLd('сцена недоступна — лёгкие фоны');
await staticFallback();
await Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),sleep(1200)]);
setLd('готово');
hideLoader();
}
}else{
for(;;){
try{await boot();return;}
catch(e){
console.warn('3D недоступен:',e);
setLd('проблема со связью — пробуем ещё раз');
await sleep(3000);
}
}
}
})();
