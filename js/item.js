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
$('#crumbNum').textContent=`${pad(idx+1)} / ${pad(PRODUCTS.length)}`;
$('#prodNum').textContent=pad(idx+1);
$('#prodTitle').textContent=p.name;
$('#prodPrice').textContent=p.price;
$('#prodDesc').textContent=p.desc;
$('#prodList').innerHTML=p.info.map(t=>`<li>${t}</li>`).join('');

const base=`Items/item_${p.code}`;
$('#prodImgA').src=base+'1.jpg'; $('#prodImgA').alt=`${p.name} — вид 1`;
$('#prodImgB').src=base+'2.jpg'; $('#prodImgB').alt=`${p.name} — вид 2`;
$('#pthImgA').src=base+'1.jpg';  $('#pthImgB').src=base+'2.jpg';

/* ---------- галерея: вид 1 / вид 2 ---------- */
function prodView(v){
$('#prodMain').classList.toggle('show-b',v===1);
$$('#prodThumbs .pth').forEach((b,i)=>b.classList.toggle('on',i===v));
$('#prodViewN').textContent=v+1;
}
$('#prodMain').addEventListener('click',()=>prodView($('#prodMain').classList.contains('show-b')?0:1));
$('#prodThumbs').addEventListener('click',e=>{
const b=e.target.closest('.pth'); if(b)prodView(+b.dataset.v);
});

/* ---------- размеры ---------- */
$('#prodSizes').addEventListener('click',e=>{
const s=e.target.closest('.size'); if(!s)return;
$$('#prodSizes .size').forEach(x=>x.classList.remove('on'));
s.classList.add('on');
});

/* ---------- в корзину ---------- */
$('#prodAdd').addEventListener('click',()=>{
let sel=$('#prodSizes .size.on')||$('#prodSizes .size[data-s="M"]');
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

/* ---------- другие вещи ---------- */
const rel=[...PRODUCTS.slice(idx+1),...PRODUCTS.slice(0,idx)].slice(0,4);
$('#relRow').innerHTML=rel.map(r=>`
<a class="rel-card" href="item.html?code=${r.code}">
<span class="rel-img"><img src="Items/item_${r.code}1.jpg" alt="${r.name}" loading="lazy"></span>
<span class="rel-meta"><b>${r.name}</b><i>${r.price}</i></span>
</a>`).join('');