import {NextRequest,NextResponse} from 'next/server'
import {randomBytes,createHash} from 'crypto'
import {withTransaction,query} from '@/lib/db'
import {calculate} from '@/lib/checkout'
import {currentUser} from '@/lib/auth'
import {settings} from '@/lib/store'
import {sendMail} from '@/lib/mailer'
import {cleanText,validEmail} from '@/lib/utils'
import {jsonError,safeRequest,limited,ip} from '@/lib/security'
export const runtime='nodejs'
export async function POST(req:NextRequest){
 if(!safeRequest(req))return jsonError('Origin denied',403)
 try{
  if(await limited('checkout:'+ip(req),20,30))return jsonError('Too many checkout attempts.',429)
  const b=await req.json();const name=cleanText(b.name,100),email=cleanText(b.email,150).toLowerCase(),phone=cleanText(b.phone,20),address=cleanText(b.address,250),city=cleanText(b.city,100),district=cleanText(b.district,60),postal=cleanText(b.postalCode,15),notes=cleanText(b.notes,500),bankRef=cleanText(b.bankReference,80),code=cleanText(b.coupon,40).toUpperCase(),method=b.paymentMethod
  if(name.length<2||!validEmail(email)||phone.length<9||address.length<8||city.length<2||!['cod','bank'].includes(method))return jsonError('Please complete your delivery details and payment method.')
  const s=await settings();if(method==='cod'&&s.cod_enabled!=='true'||method==='bank'&&s.bank_enabled!=='true')return jsonError('This payment method is currently disabled.')
  const idempotency=cleanText(b.idempotencyKey,80);if(!/^[0-9a-f-]{36}$/i.test(idempotency))return jsonError('Invalid checkout request.')
  const user=await currentUser();const receiptToken=randomBytes(32).toString('hex');const hash=createHash('sha256').update(receiptToken).digest('hex')
  const result=await withTransaction(async c=>{
   const existing=await c.query('SELECT order_number FROM orders WHERE idempotency_key=$1',[idempotency]);if(existing.rows.length)return{orderNumber:existing.rows[0].order_number,receiptToken:''}
   const q=await calculate(b.items,district,code,c,true)
   if(q.couponError)throw Error(q.couponError)
   if(q.total>100000000000)throw Error('Order total exceeds allowed maximum.')
   const number='DZN-'+Date.now().toString(36).toUpperCase()+'-'+randomBytes(3).toString('hex').toUpperCase()
   const order=await c.query(`INSERT INTO orders(order_number,user_id,customer_name,email,phone,address_line,city,district,postal_code,subtotal_cents,discount_cents,shipping_cents,total_cents,coupon_id,payment_method,payment_status,bank_reference,receipt_token_hash,customer_notes,idempotency_key)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`,
     [number,user?.id||null,name,email,phone,address,city,district,postal,q.subtotal,q.discount,q.shipping,q.total,q.couponId,method,method==='bank'?'pending_verification':'unpaid',bankRef,hash,notes,idempotency])
   const orderId=order.rows[0].id
   for(const item of q.products){
    const next=await c.query('UPDATE product_variants SET on_hand=on_hand-$1 WHERE id=$2 AND on_hand>=$1 RETURNING id',[item.quantity,item.id]);if(!next.rows.length)throw Error('Stock changed. Please try again.')
    await c.query(`INSERT INTO order_items(order_id,product_id,variant_id,product_name,variant_label,sku,quantity,unit_cents,line_total_cents) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[orderId,item.product_id,item.id,item.name,item.variant_label,item.sku,item.quantity,item.price,item.price*item.quantity])
    await c.query(`INSERT INTO inventory_movements(variant_id,delta,reason,reference_id) VALUES($1,$2,'order_placed',$3)`,[item.id,-item.quantity,orderId])
   }
   if(q.couponId)await c.query('UPDATE coupons SET used_count=used_count+1 WHERE id=$1',[q.couponId])
   await c.query(`INSERT INTO order_events(order_id,event,note) VALUES($1,'order_created',$2)`,[orderId,'Order placed with '+method])
   return{orderNumber:number,receiptToken}
  })
  try{await sendMail(email,`DZone Order ${result.orderNumber}`,`Thank you for shopping with DZone!\nOrder number: ${result.orderNumber}\nPayment: ${method==='cod'?'Cash on delivery':'Bank transfer, pending verification'}\nTrack your order: ${(process.env.NEXT_PUBLIC_SITE_URL||'').replace(/\/$/,'')}/track`)}catch(e){console.error('Order email unavailable',e)}
  return NextResponse.json({ok:true,...result})
 }catch(e:any){console.error('Checkout:',e?.message);const msg=e?.message||'Checkout unsuccessful';return jsonError(msg.includes('duplicate key')?'Order already submitted. Please track your order.':msg,400)}
}
