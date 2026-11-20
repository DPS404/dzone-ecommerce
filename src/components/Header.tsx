'use client'
import Link from 'next/link'
import { Search, ShoppingBag,UserRound,Heart,Menu } from 'lucide-react'
import {useCart} from '@/components/CartProvider'
export default function Header({name,announcement,userName,isStaff}:{name:string;announcement:string;userName?:string;isStaff?:boolean}){
 const {count}=useCart()
 return <><div className="announcement">{announcement}</div><header className="header"><div className="container header-main"><Link className="logo" href="/">{name}<span>.</span></Link><nav className="nav"><Link href="/shop">Shop all</Link><Link href="/shop?sort=newest">New arrivals</Link><Link href="/shop?sort=price_low">Best prices</Link><Link href="/contact">Contact</Link></nav><form action="/shop" className="search-header"><Search size={18}/><input name="q" aria-label="Search products" placeholder="Search products, categories and more..."/></form><div className="head-actions"><Link className="iconlink" href="/wishlist" title="Wishlist"><Heart/><span>Wishlist</span></Link><Link className="iconlink" href={isStaff?'/admin':userName?'/account':'/login'} title="Account"><UserRound/><span>{isStaff?'Admin':userName?userName.split(' ')[0]:'Account'}</span></Link><Link className="iconlink" href="/cart" title="Cart"><ShoppingBag/><span>Cart</span>{count>0&&<span className="cartcount">{count}</span>}</Link></div></div><nav className="mobile-nav"><Link href="/shop">Shop all</Link><Link href="/shop?sort=newest">New arrivals</Link><Link href="/track">Track order</Link><Link href="/contact">Support</Link></nav></header></>
}
