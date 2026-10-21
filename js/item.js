/* =========================================================
js/item.js — логика страницы вещи (item.html?code=…)
Данные — в products.js, корзина — в cart.js.
Каждый раздел защищён: отсутствие элемента не роняет страницу.
========================================================= */
import {PRODUCTS} from './products.js';
import {cartAdd,syncBadges} from './cart.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* меню (то же поведение, что на главной) */
const burger=$('#burger');
if(burger){
burger.addEventListener('click',()=>{
const open=document.body.classList.toggle('menu-open');
burger.setAttribute('aria-expanded',open);
});
}

syncBadges();

/* ---------- тост ---------- */
const toast=$('#toast'),toastMsg=$('#toastMsg');let toastT;
function showToast(html){
if(!toast||!toastMsg)return;
toastMsg.innerHTML=html;
toast.classList.remove('show');
void toast.offsetWidth; /* перезапуск анимации при повторном добавлении */
toast.classList.add('show');
clearTimeout(toastT);
toastT=setTimeout(()=>toast.classList.remove('show'),2600);
}

/* ---------- чтение товара из адресной строки ---------- */
const code=new URLSearchParams(location.search).get('code');
const idx=PRODUCTS.findIndex(p=>p.code===code);
if(idx<0){location.replace('index.html?go=4');throw new Error('неизвестный код вещи: '+code);}
const p=PRODUCTS[idx];

document.title=`${p.name} · DAGOLF`;
if($('#iCount'))$('#iCount').textContent=`${pad(idx+1)} / ${pad(PRODUCTS.length)}`;
if($('#iNum'))$('#iNum').textContent=pad(idx+1);
if($('#iPrice'))$('#iPrice').textContent=p.price;
if($('#iDesc'))$('#iDesc').textContent=p.desc;
if($('#iList'))$('#iList').innerHTML=p.info.map(t=>`<li>${t}</li>`).join('');

/* заголовок: каждое слово — строка; первая залита, остальные контуром (как .h1) */
if($('#iTitle')){
$('#iTitle').innerHTML=p.name.split(' ').map((w,i)=>
`<span class="line"><span style="--d:${(.1+i*.09).toFixed(2)}s">${w}</span></span>`
).join('');
}

const base=`Items/item_${p.code}`;
const setSrc=(id,src,alt)=>{const el=$(id);if(el){el.src=src;if(alt!==undefined)el.alt=alt;}};
setSrc('#iImgA',base+'1.jpg',`${p.name} — вид 1`);
setSrc('#iImgB',base+'2.jpg',`${p.name} — вид 2`);
setSrc('#ithImgA',base+'1.jpg');
setSrc('#ithImgB',base+'2.jpg');

/* =========================================================
Галерея: кнопки-стрелки и лупа поверх фото, миниатюры,
свайп, клавиатура, параллакс за курсором, зум с панорамой.
========================================================= */
const gMain=$('#iMain');
if(gMain){
const gImgs=[$('#iImgA'),$('#iImgB')].filter(Boolean);
const gThumbs=$$('#iThumbs .ith');
const gNum=$('#iViewN'),gProg=$('#iProg'),zoomBtn=$('#iZoom');
let gView=0;

const setView=v=>{
gView=((v%2)+2)%2;
gImgs.forEach((im,i)=>im.classList.toggle('is-on',i===gView));
gThumbs.forEach((b,i)=>b.classList.toggle('on',i===gView));
if(gNum)gNum.textContent=pad(gView+1);
if(gProg)gProg.style.width=((gView+1)/2*100)+'%';
};
/* точка, вокруг которой зумуем/панорамируем (в % внутри кадра) */
const setOrigin=(x,y)=>{
const r=gMain.getBoundingClientRect();
if(!r.width||!r.height)return;
gMain.style.setProperty('--ox',clamp((x-r.left)/r.width*100,0,100).toFixed(2)+'%');
gMain.style.setProperty('--oy',clamp((y-r.top)/r.height*100,0,100).toFixed(2)+'%');
};
const resetFx=()=>{
gMain.style.setProperty('--px','0%');
gMain.style.setProperty('--py','0%');
};
const setZoom=(on,x,y)=>{
gMain.classList.toggle('zoomed',on);
if(zoomBtn){
zoomBtn.classList.toggle('on',on);
zoomBtn.setAttribute('aria-pressed',String(on));
zoomBtn.setAttribute('aria-label',on?'Отдалить':'Приблизить');
}
if(on){if(x!=null)setOrigin(x,y);}
else{
gMain.style.setProperty('--ox','50%');
gMain.style.setProperty('--oy','50%');
resetFx();
}
};
const toggleZoom=(x,y)=>setZoom(!gMain.classList.contains('zoomed'),x,y);

setView(0);

/* явные кнопки поверх фото */
$('#iPrev')?.addEventListener('click',()=>setView(gView-1));
$('#iNext')?.addEventListener('click',()=>setView(gView+1));
zoomBtn?.addEventListener('click',()=>{
const r=gMain.getBoundingClientRect();
toggleZoom(r.left+r.width/2,r.top+r.height/2);
});

/* миниатюры */
$('#iThumbs')?.addEventListener('click',e=>{
const b=e.target.closest('.ith');if(b)setView(+b.dataset.v);
});

/* жесты: тап = зум, свайп = смена вида, в зуме — панорама */
let gDown=false,gX0=0,gY0=0,gMoved=false;
gMain.addEventListener('pointerdown',e=>{
if(!e.isPrimary||e.target.closest('.i-ctl'))return;
gDown=true;gMoved=false;gX0=e.clientX;gY0=e.clientY;
if(gMain.classList.contains('zoomed'))setOrigin(e.clientX,e.clientY);
});
gMain.addEventListener('pointermove',e=>{
if(!e.isPrimary)return;
if(gMain.classList.contains('zoomed')){setOrigin(e.clientX,e.clientY);return;}
if(gDown){
if(Math.abs(e.clientX-gX0)>8||Math.abs(e.clientY-gY0)>8)gMoved=true;
return;
}
if(e.pointerType==='mouse'&&!reduced){ /* лёгкий параллакс за курсором */
const r=gMain.getBoundingClientRect();
if(!r.width||!r.height)return;
gMain.style.setProperty('--px',(((e.clientX-r.left)/r.width-.5)*-1.6).toFixed(3)+'%');
gMain.style.setProperty('--py',(((e.clientY-r.top)/r.height-.5)*-1.6).toFixed(3)+'%');
}
});
gMain.addEventListener('pointerup',e=>{
if(!gDown)return;
gDown=false;
if(e.target.closest('.i-ctl'))return;
const dx=e.clientX-gX0,dy=e.clientY-gY0;
/* короткий тап — зум в точку (повторный — обратно) */
if(!gMoved&&Math.abs(dx)<6&&Math.abs(dy)<6){toggleZoom(e.clientX,e.clientY);return;}
if(gMain.classList.contains('zoomed'))return;
/* горизонтальный свайп — смена вида (по кругу) */
if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.2)setView(gView+(dx<0?1:-1));
});
gMain.addEventListener('pointercancel',()=>{gDown=false;});
gMain.addEventListener('pointerleave',()=>{if(!gMain.classList.contains('zoomed'))resetFx();});
gMain.addEventListener('dragstart',e=>e.preventDefault());

/* клавиатура на галерее */
gMain.addEventListener('keydown',e=>{
if(e.key==='ArrowRight'){e.preventDefault();setView(gView+1);}
else if(e.key==='ArrowLeft'){e.preventDefault();setView(gView-1);}
else if(e.key==='Enter'||e.key===' '){
e.preventDefault();
const r=gMain.getBoundingClientRect();
toggleZoom(r.left+r.width/2,r.top+r.height/2);
}
else if(e.key==='Escape'&&gMain.classList.contains('zoomed')){e.preventDefault();setZoom(false);}
});
}

/* ---------- размеры ---------- */
$('#iSizes')?.addEventListener('click',e=>{
const s=e.target.closest('.size'); if(!s)return;
$$('#iSizes .size').forEach(x=>x.classList.remove('on'));
s.classList.add('on');
});

/* ---------- в корзину ---------- */
$('#iAdd')?.addEventListener('click',()=>{
let sel=$('#iSizes .size.on')||$('#iSizes .size[data-s="M"]');
if(!sel)return;
sel.classList.add('on');
cartAdd(1);
showToast(`<b>${p.name}</b> · размер ${sel.dataset.s} — в корзине`);
});

/* ---------- пред./след. вещь ---------- */
const prevP=PRODUCTS[(idx-1+PRODUCTS.length)%PRODUCTS.length];
const nextP=PRODUCTS[(idx+1)%PRODUCTS.length];
const pnPrev=$('#pnPrev'),pnNext=$('#pnNext');
if(pnPrev){pnPrev.href=`item.html?code=${prevP.code}`;pnPrev.querySelector('span').textContent=prevP.name;}
if(pnNext){pnNext.href=`item.html?code=${nextP.code}`;pnNext.querySelector('span').textContent=nextP.name;}

/* ---------- другие вещи: те же карточки, что в коллекции ---------- */
const relRow=$('#relRow');
if(relRow){
const rel=[...PRODUCTS.slice(idx+1),...PRODUCTS.slice(0,idx)].slice(0,4);
relRow.innerHTML=rel.map(r=>`
<a class="rel-card" href="item.html?code=${r.code}">
<div class="card-img">
<img class="ph-a" src="Items/item_${r.code}1.jpg" alt="${r.name}" loading="lazy" draggable="false">
</div>
<div class="card-meta">
<div><h4>${r.name}</h4><p>${r.desc}</p></div>
<span class="price">${r.price}</span>
</div>
</a>`).join('');
}

/* =========================================================
Автофит большой надписи в футере (тот же, что на главной)
========================================================= */
const bfWord=$('.bf-word'),bfFit=$('.bf-fit');
if(bfWord&&bfFit){
let bfLastWidth=0,bfRaf=0;
const fitBigFoot=(force=false)=>{
const avail=bfWord.getBoundingClientRect().width;
if(!avail)return;
if(!force&&bfLastWidth&&Math.abs(avail-bfLastWidth)<.5)return;
const currentWidth=bfFit.getBoundingClientRect().width;
if(!currentWidth)return;
if(bfWord.style.fontSize&&Math.abs(avail-currentWidth)<=.6){bfLastWidth=avail;return;}
const currentSize=parseFloat(getComputedStyle(bfWord).fontSize);
if(!currentSize)return;
bfWord.style.fontSize=(currentSize*(avail/currentWidth)).toFixed(3)+'px';
bfLastWidth=avail;
};
const scheduleFit=(force=false)=>{
cancelAnimationFrame(bfRaf);
bfRaf=requestAnimationFrame(()=>fitBigFoot(force));
};
scheduleFit(true);
addEventListener('resize',()=>scheduleFit(true));
addEventListener('load',()=>scheduleFit(true));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>scheduleFit(true));
if('ResizeObserver' in window){
new ResizeObserver(()=>{
const w=bfWord.getBoundingClientRect().width;
if(w&&(!bfLastWidth||Math.abs(w-bfLastWidth)>.5))scheduleFit(true);
}).observe(bfWord);
}
}
