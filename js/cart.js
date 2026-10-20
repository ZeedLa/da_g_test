/* =========================================================
Корзина: счётчик живёт в localStorage, поэтому он общий
для главной и всех страниц вещей.
========================================================= */
const KEY='dagolf_cart_n';
export function cartCount(){
const n=parseInt(localStorage.getItem(KEY),10);
return Number.isFinite(n)&&n>=0?n:0;
}
export function cartAdd(n=1){
const v=cartCount()+n;
try{localStorage.setItem(KEY,String(v));}catch(e){}
syncBadges();
return v;
}
export function syncBadges(){
document.querySelectorAll('.cartN').forEach(b=>b.textContent=cartCount());
}