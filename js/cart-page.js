/* =========================================================
js/cart-page.js — страница корзины (cart.html)
Читает позиции из cart.js и рисует список + итог.
========================================================= */
import {PRODUCTS} from './products.js';
import {getItems,setQty,removeItem,clearCart,cartCount,syncBadges,fmtPrice,plural} from './cart.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const FREE_FROM=10000, DELIVERY=490;

/* меню */
const burger=$('#burger');
if(burger){
burger.addEventListener('click',()=>{
const open=document.body.classList.toggle('menu-open');
burger.setAttribute('aria-expanded',open);
});
}
syncBadges();

/* тост (для уведомления «заказ оформлен») */
const toast=$('#toast'),toastMsg=$('#toastMsg');let toastT;
function showToast(html){
if(!toast||!toastMsg)return;
toastMsg.innerHTML=html;
toast.classList.remove('show');
void toast.offsetWidth;
toast.classList.add('show');
clearTimeout(toastT);
toastT=setTimeout(()=>toast.classList.remove('show'),2600);
}

const listEl=$('#cItems'),gridEl=$('#cGrid'),emptyEl=$('#cEmpty'),doneEl=$('#cDone');
const countEl=$('#cCount');

function totals(items){
const sub=items.reduce((s,it)=>{
const p=PRODUCTS.find(p=>p.code===it.code);
return s+(p?p.num*it.qty:0);
},0);
const deliv=sub>=FREE_FROM?0:DELIVERY;
return {sub,deliv,total:sub+deliv};
}
function show(which){
gridEl.hidden=which!=='grid';
emptyEl.hidden=which!=='empty';
doneEl.hidden=which!=='done';
}

function render(){
const items=getItems();
const count=cartCount();
countEl.textContent=count?`${count} ${plural(count,'вещь','вещи','вещей')}`:'пусто';

if(!items.length){show('empty');return;}
show('grid');

listEl.innerHTML=items.map(it=>{
const p=PRODUCTS.find(p=>p.code===it.code);
if(!p)return '';
return `
<div class="c-item">
<a class="c-img" href="item.html?code=${p.code}" aria-label="${p.name} — открыть страницу вещи">
<img src="Items/item_${p.code}1.jpg" alt="${p.name}" loading="lazy" draggable="false">
</a>
<div class="c-meta">
<h3><a href="item.html?code=${p.code}">${p.name}</a></h3>
<p>размер ${it.size} · ${p.desc}</p>
</div>
<div class="c-ctrl">
<div class="c-qty" role="group" aria-label="Количество">
<button class="cq" data-act="dec" data-code="${p.code}" data-size="${it.size}" aria-label="На одну меньше">−</button>
<span class="cq-num">${it.qty}</span>
<button class="cq" data-act="inc" data-code="${p.code}" data-size="${it.size}" aria-label="На одну больше">+</button>
</div>
<span class="c-price">${fmtPrice(p.num*it.qty)}</span>
<button class="c-rm" data-act="rm" data-code="${p.code}" data-size="${it.size}">убрать</button>
</div>
</div>`;
}).join('');

const {sub,deliv,total}=totals(items);
$('#cSub').textContent=fmtPrice(sub);
$('#cDel').textContent=deliv?fmtPrice(deliv):'бесплатно';
$('#cTotal').textContent=fmtPrice(total);
const hint=$('#cHint');
if(deliv>0){hint.hidden=false;$('#cLeft').textContent=fmtPrice(FREE_FROM-sub);}
else hint.hidden=true;
}

/* количество / удаление */
listEl.addEventListener('click',e=>{
const b=e.target.closest('[data-act]');
if(!b)return;
const {act,code,size}=b.dataset;
const it=getItems().find(i=>i.code===code&&i.size===size);
if(act==='inc')setQty(code,size,(it?it.qty:0)+1);
else if(act==='dec')setQty(code,size,(it?it.qty:0)-1);
else if(act==='rm')removeItem(code,size);
render();
});

/* оформление заказа (демо) */
$('#cOrder')?.addEventListener('click',()=>{
if(!cartCount())return;
const n=pad(1+Math.floor(Math.random()*98));
clearCart();
$('#cMsg').innerHTML=`заказ <b>№${n}</b> оформлен · партия 001 · подтверждение придёт в telegram`;
countEl.textContent='пусто';
show('done');
showToast(`<b>заказ №${n}</b> — оформлен`);
});

render();
