'use client'
import Link from 'next/link'
import {ShoppingBag} from 'lucide-react'
import {useCart} from '@/components/CartProvider'
import {money} from '@/lib/utils'
import type {Product} from '@/lib/store'
export default function ProductCard({p}:{p:Product}){const {add}=useCart();const image=p.images?.[0]||'/demo/placeholder.svg';return <article className="product-card"><Link href={'/product/'+p.slug} className="product-visual"><img src={image} alt={p.name} loading="lazy"/>{p.compare_cents&&p.compare_cents>p.price_cents?<span className="product-tag">SALE</span>:null}</Link><div className="product-info"><div className="small-muted">{p.category_name||'DZone Select'}</div><Link href={'/product/'+p.slug}><h3>{p.name}</h3></Link><div><span className="product-price">{money(p.price_cents)}</span>{p.compare_cents&&p.compare_cents>p.price_cents?<span className="price-old">{money(p.compare_cents)}</span>:null}</div><div className="product-cta"><button className="btn btn-secondary" disabled={p.on_hand<=0} onClick={()=>add({variantId:p.variant_id,productId:p.id,name:p.name,slug:p.slug,image,variant:p.variant_label,price:p.price_cents,stock:p.on_hand,qty:1})}><ShoppingBag size={16}/>{p.on_hand>0?'Add to cart':'Sold out'}</button></div></div></article>}
