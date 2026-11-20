'use client'
import { createContext,useContext,useEffect,useMemo,useState } from 'react'
export type CartItem={variantId:string;productId:string;name:string;slug:string;image:string;variant:string;price:number;stock:number;qty:number}
type CartApi={items:CartItem[];add:(item:CartItem)=>void;update:(id:string,qty:number)=>void;remove:(id:string)=>void;clear:()=>void;count:number}
const Context=createContext<CartApi|null>(null)
export function CartProvider({children}:{children:React.ReactNode}){
 const [items,setItems]=useState<CartItem[]>([]); const [ready,setReady]=useState(false)
 useEffect(()=>{try{const raw=localStorage.getItem('dzone_cart');if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))setItems(parsed.slice(0,50))}}catch{}setReady(true)},[])
 useEffect(()=>{if(ready)localStorage.setItem('dzone_cart',JSON.stringify(items))},[items,ready])
 const api=useMemo<CartApi>(()=>({items,add:(item)=>setItems(prev=>{const old=prev.find(x=>x.variantId===item.variantId);return old?prev.map(x=>x.variantId===item.variantId?{...x,qty:Math.min(x.qty+item.qty,Math.max(item.stock,1))}:x):[...prev,item]}),update:(id,qty)=>setItems(prev=>prev.map(x=>x.variantId===id?{...x,qty:Math.max(1,Math.min(qty,x.stock))}:x)),remove:id=>setItems(prev=>prev.filter(x=>x.variantId!==id)),clear:()=>setItems([]),count:items.reduce((s,x)=>s+x.qty,0)}),[items])
 return <Context.Provider value={api}>{children}</Context.Provider>
}
export function useCart(){const ctx=useContext(Context);if(!ctx)throw Error('Cart context missing');return ctx}
