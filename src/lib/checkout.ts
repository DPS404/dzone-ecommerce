import {query} from '@/lib/db'
import {settings} from '@/lib/store'
import {districts} from '@/lib/utils'
export type BasketItem={variantId:string;quantity:number}
export type Quote={subtotal:number;shipping:number;discount:number;total:number;couponId:string|null;couponError:string|null;products:Array<{id:string;quantity:number;name:string;product_id:string;variant_label:string;sku:string;price:number;stock:number}>}
const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export async function calculate(items:BasketItem[],district:string,code='',conn?:any,lock=false):Promise<Quote>{
 if(!Array.isArray(items)||items.length<1||items.length>40||!districts.includes(district))throw Error('Invalid basket or district.')
 const fetcher=(sql:string,params:unknown[]=[]):Promise<any>=>conn?conn.query(sql,params):query(sql,params)
 const clean=new Map<string,number>();for(const item of items){if(typeof item.variantId!=='string'||!uuidPattern.test(item.variantId)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>50)throw Error('Invalid item quantity.');clean.set(item.variantId,(clean.get(item.variantId)||0)+item.quantity)}
 if([...clean.values()].some(v=>v>50))throw Error('Too many units selected.')
 let subtotal=0;const rows:Quote['products']=[]
 // Sorted row locks avoid opposite lock order in concurrent checkouts.
 for(const id of [...clean.keys()].sort()){
  const r=await fetcher(`SELECT v.id,v.label,v.sku,v.price_cents,v.on_hand,v.active,p.name,p.id AS product_id,p.status FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=$1 ${lock?'FOR UPDATE OF v':''}`,[id])
  const v=r.rows[0];if(!v||v.status!=='published'||!v.active)throw Error('Some items are no longer available.')
  const quantity=clean.get(id)!;if(quantity>v.on_hand)throw Error(`${v.name}: only ${v.on_hand} items in stock.`)
  const price=Number(v.price_cents);subtotal+=price*quantity;rows.push({id,quantity,name:v.name,product_id:v.product_id,variant_label:v.label,sku:v.sku,price,stock:v.on_hand})
 }
 const r=await fetcher(`SELECT * FROM shipping_zones WHERE enabled=true AND $1=ANY(districts) ORDER BY fee_cents ASC LIMIT 1`,[district]);const zone=r.rows[0]
 const setting=await settings();let shipping=zone?Number(zone.fee_cents):Number(setting.default_shipping_cents||45000)
 const threshold=zone?Number(zone.free_above_cents||0):Number(setting.free_shipping_over_cents||0)
 if(threshold>0&&subtotal>=threshold)shipping=0
 let discount=0;let couponId:string|null=null;let couponError:string|null=null
 if(code.trim()){
  const cr=await fetcher(`SELECT * FROM coupons WHERE code=$1 ${lock?'FOR UPDATE':''}`,[code.trim().toUpperCase()]);const coupon=cr.rows[0]
  if(!coupon||!coupon.enabled||coupon.starts_at&&new Date(coupon.starts_at).getTime()>Date.now()||coupon.ends_at&&new Date(coupon.ends_at).getTime()<Date.now()||coupon.usage_limit!==null&&coupon.used_count>=coupon.usage_limit||subtotal<Number(coupon.min_spend_cents))couponError='Coupon is invalid, expired, exhausted or below minimum spend.'
  else{couponId=coupon.id;discount=coupon.kind==='percent'?Math.round(subtotal*Math.min(coupon.amount,100)/100):Math.min(subtotal,coupon.amount)}
 }
 return{products:rows,subtotal,shipping,discount,total:Math.max(0,subtotal-discount)+shipping,couponId,couponError}
}
