/* =========================================================
Корзина: список позиций {code, size, qty} в localStorage.
Добавление обрабатывается здесь для ВСЕХ страниц: любая кнопка
с атрибутом data-add-to-cart кладёт вещь в корзину и показывает тост.
Код вещи берётся из data-code или из ближайшей карточки [data-product-code].
Размер — из data-size или из выбранного .size.on в этой же карточке.
========================================================= */
import {PRODUCTS} from './products.js';

const KEY='dagolf_cart_items';

export function getItems(){
try{
const raw=JSON.parse(localStorage.getItem(KEY));
return Array.isArray(raw)?raw.filter(i=>i&&i.code&&i.size&&i.qty>0):[];
}catch(e){return [];}
}
export function saveItems(list){
try{localStorage.setItem(KEY,JSON.stringify(list));}catch(e){}
syncBadges();
}
export function addToCart(code,size){
if(!code||!size){
console.error('DAGOLF: addToCart(code,size) — нет кода вещи или размера');
return cartCount();
}
const items=getItems();
const f=items.find(i=>i.code===code&&i.size===size);
if(f)f.qty+=1;else items.push({code,size,qty:1});
saveItems(items);
return cartCount();
}
export function setQty(code,size,qty){
let items=getItems();
const f=items.find(i=>i.code===code&&i.size===size);
if(!f)return;
f.qty=qty;
items=items.filter(i=>i.qty>0);
saveItems(items);
}
export function removeItem(code,size){
saveItems(getItems().filter(i=>!(i.code===code&&i.size===size)));
}
export function clearCart(){saveItems([]);}
export function cartCount(){return getItems().reduce((s,i)=>s+i.qty,0);}
export function syncBadges(){
document.querySelectorAll('.cartN').forEach(b=>b.textContent=cartCount());
}
export function fmtPrice(n){return n.toLocaleString('ru-RU')+' ₽';}
export function plural(n,one,few,many){
const m10=n%10,m100=n%100;
if(m10===1&&m100!==11)return one;
if(m10>=2&&m10<=4&&(m100<12||m100>14))return few;
return many;
}

/* ---------- единый обработчик добавления для всех страниц ---------- */
function name(code){return PRODUCTS.find(p=>p.code===code)?.name||'Вещь';}
function toast(html){
const t=document.querySelector('#toast'),m=document.querySelector('#toastMsg');
if(!t||!m)return;
m.innerHTML=html;
t.classList.remove('show');
void t.offsetWidth; /* перезапуск анимации при повторном добавлении */
t.classList.add('show');
clearTimeout(toast._t);
toast._t=setTimeout(()=>t.classList.remove('show'),2600);
}
document.addEventListener('click',e=>{
const b=e.target.closest('[data-add-to-cart]');
if(!b)return;
let code=b.dataset.code;
let size=b.dataset.size;
if(!code){
const card=b.closest('[data-product-code]');
code=card?.dataset.productCode;
}
if(!size){
const scope=b.closest('[data-product-code]')||document;
const sel=scope.querySelector('.size.on');
size=sel?.dataset.s||'M';
}
if(!code)return;
addToCart(code,size);
toast(`<b>${name(code)}</b> · размер ${size} — в корзине`);
});

/* при первой загрузке страницы — сразу синхронизируем счётчики */
syncBadges();
