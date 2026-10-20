/* =========================================================
js/item.js — логика страницы вещи (item.html?code=…)
Данные — в products.js, корзина — в cart.js.
========================================================= */
import {PRODUCTS} from './products.js';
import {cartAdd,syncBadges} from './cart.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');

/* меню (то же поведение, что на главной) */
const burger=$('#burger');
if(burger){
burger.addEventListener('click',()=>{
const open=document.body.classList.toggle('menu-open');
burger.setAttribute('aria-expanded',open);
});
}

syncBadges();

/* тост */
const toast=$('#toast');let toastT;
function showToast(html){
toast.innerHTML=html;toast.classList.add('show');
clearTimeout(toastT);toastT=setTimeout(()=>toast.classList.remove('show'),1900);
}

/* ---------- чтение товара из адресной строки ---------- */
const code=new URLSearchParams(location.search).get('code');
const idx=PRODUCTS.findIndex(p=>p.code===code);
if(idx<0){location.replace('index.html?go=4');throw new Error('неизвестный код вещи: '+code);}
const p=PRODUCTS[idx];

document.title=`${p.name} · DAGOLF`;
$('#iCount').textContent=`${pad(idx+1)} / ${pad(PRODUCTS.length)}`;
$('#iNum').textContent=pad(idx+1);
$('#iPrice').textContent=p.price;
$('#iDesc').textContent=p.desc;
$('#iList').innerHTML=p.info.map(t=>`<li>${t}</li>`).join('');

/* заголовок: каждое слово — строка; первая залита, остальные контуром (как .h1) */
$('#iTitle').innerHTML=p.name.split(' ').map((w,i)=>
`<span class="line"><span style="--d:${(.1+i*.09).toFixed(2)}s">${w}</span></span>`
).join('');

const base=`Items/item_${p.code}`;
$('#iImgA').src=base+'1.jpg'; $('#iImgA').alt=`${p.name} — вид 1`;
$('#iImgB').src=base+'2.jpg'; $('#iImgB').alt=`${p.name} — вид 2`;
$('#ithImgA').src=base+'1.jpg'; $('#ithImgB').src=base+'2.jpg';

/* ---------- галерея: вид 1 / вид 2 ---------- */
function setView(v){
$('#iMain').classList.toggle('show-b',v===1);
$$('#iThumbs .ith').forEach((b,i)=>b.classList.toggle('on',i===v));
$('#iViewN').textContent=v+1;
}
$('#iMain').addEventListener('click',()=>setView($('#iMain').classList.contains('show-b')?0:1));
$('#iThumbs').addEventListener('click',e=>{
const b=e.target.closest('.ith'); if(b)setView(+b.dataset.v);
});

/* ---------- размеры ---------- */
$('#iSizes').addEventListener('click',e=>{
const s=e.target.closest('.size'); if(!s)return;
$$('#iSizes .size').forEach(x=>x.classList.remove('on'));
s.classList.add('on');
});

/* ---------- в корзину ---------- */
$('#iAdd').addEventListener('click',()=>{
let sel=$('#iSizes .size.on')||$('#iSizes .size[data-s="M"]');
sel.classList.add('on');
cartAdd(1);
showToast(`<b>${p.name}</b> · размер ${sel.dataset.s} — в корзине`);
});

/* ---------- пред./след. вещь ---------- */
const prevP=PRODUCTS[(idx-1+PRODUCTS.length)%PRODUCTS.length];
const nextP=PRODUCTS[(idx+1)%PRODUCTS.length];
const pnPrev=$('#pnPrev'),pnNext=$('#pnNext');
pnPrev.href=`item.html?code=${prevP.code}`;
pnPrev.querySelector('span').textContent=prevP.name;
pnNext.href=`item.html?code=${nextP.code}`;
pnNext.querySelector('span').textContent=nextP.name;

/* ---------- другие вещи: те же карточки, что в коллекции ---------- */
const rel=[...PRODUCTS.slice(idx+1),...PRODUCTS.slice(0,idx)].slice(0,4);
$('#relRow').innerHTML=rel.map(r=>`
<a class="rel-card" href="item.html?code=${r.code}">
<div class="card-img">
<img class="ph-a" src="Items/item_${r.code}1.jpg" alt="${r.name}" loading="lazy" draggable="false">
</div>
<div class="card-meta">
<div><h4>${r.name}</h4><p>${r.desc}</p></div>
<span class="price">${r.price}</span>
</div>
</a>`).join('');

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
