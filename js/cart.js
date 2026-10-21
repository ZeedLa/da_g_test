/* =========================================================
Корзина: список позиций {code, size, qty} в localStorage.
Общая для всех страниц; счётчик .cartN синхронизируется сам.
========================================================= */
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
/* 14900 → «14 900 ₽» */
export function fmtPrice(n){return n.toLocaleString('ru-RU')+' ₽';}
/* русские склонения: plural(3,'вещь','вещи','вещей') → «вещи» */
export function plural(n,one,few,many){
const m10=n%10,m100=n%100;
if(m10===1&&m100!==11)return one;
if(m10>=2&&m10<=4&&(m100<12||m100>14))return few;
return many;
}
