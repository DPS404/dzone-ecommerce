import {NextRequest,NextResponse} from 'next/server'
import {query,withTransaction} from '@/lib/db'
import {isAdmin} from '@/lib/auth'
import {cleanText,slugify,districts,statuses} from '@/lib/utils'
import {jsonError,safeRequest} from '@/lib/security'
import {sendMail} from '@/lib/mailer'
export const runtime='nodejs'
const uuid=/^[a-f0-9-]{36}$/i
const allowedSettings=['store_name','tagline','announcement','hero_title','hero_subtitle','contact_email','contact_phone','contact_address','bank_details','cod_enabled','bank_enabled','default_shipping_cents','free_shipping_over_cents','footer_text','instagram','facebook']
function flag(v:any){return v===true||v==='true'||v==='on'}
function cash(v:any){const n=Number(v||0);if(!Number.isFinite(n)||n<0||n>999999999)return Error('Invalid price');return Math.round(n*100)}
function safeImages(x:any){return String(x||'').split(/[\n\r]+/).map(y=>y.trim()).filter(s=>(s.startsWith('https://')||s.startsWith('/demo/'))&&s.length<1500).slice(0,12)}
function safeUrl(s:any){const a=cleanText(s,1500);return a.startsWith('/')&&!a.startsWith('//')||a.startsWith('https://')?a:''}
async function audit(userId:string,action:string,type:string,id=''){await query('INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4)',[userId,action,type,id])}
export async function POST(req:NextRequest){
 if(!safeRequest(req))return jsonError('Origin denied',403)
 const user=await isAdmin();if(!user)return jsonError('Admin access required.',403)
 try{
  const {action,data:d}=await req.json();if(typeof action!=='string'||typeof d!=='object'||!d)return jsonError('Invalid request.')
  const section=action.split(':')[0]
  if(user.role==='staff'&&!['orders','inventory','tickets'].includes(section))return jsonError('Insufficient permissions.',403)
  let id=String(d.id||'')
  switch(action){
   case'categories:save':{
    const name=cleanText(d.name,90),slug=slugify(d.slug||name),icon=cleanText(d.icon,8)||'✦',sort=Number(d.sort_order)||0
    if(!name||!slug)return jsonError('Name and slug required.')
    const{rows}=id?await query('UPDATE categories SET name=$1,slug=$2,icon=$3,sort_order=$4,active=$5 WHERE id=$6 RETURNING id',[name,slug,icon,sort,flag(d.active),id]):await query('INSERT INTO categories(name,slug,icon,sort_order,active) VALUES($1,$2,$3,$4,$5) RETURNING id',[name,slug,icon,sort,flag(d.active)]);id=rows[0]?.id||id;break
   }
   case'products:save':{
    const name=cleanText(d.name,170),slug=slugify(d.slug||name),status=['draft','published','archived'].includes(d.status)?d.status:'draft',category=d.category_id&&uuid.test(d.category_id)?d.category_id:null
    const images=safeImages(d.images);const desc=cleanText(d.description,3000),details=cleanText(d.details,20000),seoTitle=cleanText(d.seo_title,160),seoDescription=cleanText(d.seo_description,350)
    if(!name||!slug)return jsonError('Product name and slug required.')
    const price=cash(d.price_rupees),compare=cash(d.compare_rupees),stock=Number(d.on_hand),sku=cleanText(d.sku,80),label=cleanText(d.variant_label,80)||'Default'
    if(price instanceof Error||compare instanceof Error||!sku||!Number.isInteger(stock)||stock<0||stock>1000000)return jsonError('Invalid primary variant price, SKU or stock.')
    let extras:any[]=[]
    try{extras=JSON.parse(String(d.variants_json||'[]'));if(!Array.isArray(extras)||extras.length>30)throw Error('Too many variants')}catch{return jsonError('Extra variants must contain a JSON array.')}
    for(const extra of extras){if(!cleanText(extra.sku,80)||cash(extra.price_rupees)instanceof Error||!Number.isInteger(Number(extra.on_hand))||Number(extra.on_hand)<0)return jsonError('Invalid additional variant.')}
    const result=await withTransaction(async c=>{
     let productId=id
     if(id){await c.query(`UPDATE products SET name=$1,slug=$2,category_id=$3,description=$4,details=$5,images=$6,status=$7,featured=$8,seo_title=$9,seo_description=$10,updated_at=now() WHERE id=$11`,[name,slug,category,desc,details,images,status,flag(d.featured),seoTitle,seoDescription,id])}
     else{const r=await c.query('INSERT INTO products(name,slug,category_id,description,details,images,status,featured,seo_title,seo_description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id',[name,slug,category,desc,details,images,status,flag(d.featured),seoTitle,seoDescription]);productId=r.rows[0].id}
     const inputs=[{sku,label,price,compare,stock,active:true},...extras.map(e=>({sku:cleanText(e.sku,80),label:cleanText(e.label,80)||'Option',price:cash(e.price_rupees) as number,compare:cash(e.compare_rupees) as number,stock:Number(e.on_hand),active:e.active!==false}))]
     const uniq=new Set<string>();for(const input of inputs){if(uniq.has(input.sku))throw Error('Duplicate SKUs in product');uniq.add(input.sku)}
     const existing=await c.query('SELECT * FROM product_variants WHERE product_id=$1 FOR UPDATE',[productId])
     for(let i=0;i<inputs.length;i++){
      const v=inputs[i];const found=existing.rows.find(x=>x.sku===v.sku)
      if(found){const delta=v.stock-found.on_hand;await c.query('UPDATE product_variants SET label=$1,price_cents=$2,compare_cents=$3,on_hand=$4,active=$5,sort_order=$6 WHERE id=$7',[v.label,v.price,v.compare||null,v.stock,v.active,i,found.id]);if(delta)await c.query("INSERT INTO inventory_movements(variant_id,delta,reason,actor_id) VALUES($1,$2,'admin_product_edit',$3)",[found.id,delta,user.id])}
      else{const r=await c.query('INSERT INTO product_variants(product_id,label,sku,price_cents,compare_cents,on_hand,active,sort_order) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',[productId,v.label,v.sku,v.price,v.compare||null,v.stock,v.active,i]);if(v.stock)await c.query("INSERT INTO inventory_movements(variant_id,delta,reason,actor_id) VALUES($1,$2,'initial_stock',$3)",[r.rows[0].id,v.stock,user.id])}
     }
     // Deactivate removed variants rather than deleting variants referenced by past orders.
     for(const old of existing.rows)if(!uniq.has(old.sku))await c.query('UPDATE product_variants SET active=false WHERE id=$1',[old.id])
     return productId
    });id=result;break
   }
   case'inventory:adjust':{
    const delta=Number(d.delta),reason=cleanText(d.reason,300);if(!uuid.test(d.variantId)||!Number.isInteger(delta)||!delta||Math.abs(delta)>100000||reason.length<3)return jsonError('Invalid stock adjustment.')
    await withTransaction(async c=>{const r=await c.query('UPDATE product_variants SET on_hand=on_hand+$1 WHERE id=$2 AND on_hand+$1>=0 RETURNING id',[delta,d.variantId]);if(!r.rows.length)throw Error('Invalid stock balance.');await c.query('INSERT INTO inventory_movements(variant_id,delta,reason,actor_id) VALUES($1,$2,$3,$4)',[d.variantId,delta,reason,user.id])});id=d.variantId;break
   }
   case'orders:save':{
    if(!uuid.test(id))return jsonError('Order ID required.')
    const status=cleanText(d.status,30),payment=cleanText(d.payment_status,40),courier=cleanText(d.courier,100),tracking=cleanText(d.tracking_number,120),notes=cleanText(d.admin_notes,1500)
    if(!statuses.includes(status)||!['unpaid','pending_verification','paid','refund_pending','refunded'].includes(payment))return jsonError('Invalid order or payment status.')
    await withTransaction(async c=>{
     const r=await c.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[id]);const o=r.rows[0];if(!o)throw Error('Order missing')
     const transitions:Record<string,string[]>={pending:['confirmed','cancelled'],confirmed:['processing','cancelled'],processing:['shipped','cancelled'],shipped:['delivered'],delivered:[],cancelled:[],returned:[]}
     if(status!==o.status&&!transitions[o.status]?.includes(status))throw Error(`Invalid status transition: ${o.status} → ${status}`)
     if(status==='delivered'&&!tracking&&!courier)throw Error('Enter shipping/courier details before delivery confirmation.')
     if(o.payment_status!==payment){if(payment==='paid'&&o.payment_method==='cod'&&status!=='delivered')throw Error('COD payment can be marked paid only after delivery.');if(payment==='refunded'&&o.payment_status!=='refund_pending')throw Error('Refund must first be pending.');if(payment==='refunded'&&notes.length<4)throw Error('Add a manual refund reference/note.');if(o.payment_status==='refunded'&&payment!=='refunded')throw Error('Refunded payments cannot be reopened.')}
     if(status==='cancelled'&&o.status!=='cancelled'){
      const{rows:items}=await c.query('SELECT variant_id,quantity FROM order_items WHERE order_id=$1',[id]);for(const item of items){if(item.variant_id){await c.query('UPDATE product_variants SET on_hand=on_hand+$1 WHERE id=$2',[item.quantity,item.variant_id]);await c.query("INSERT INTO inventory_movements(variant_id,delta,reason,actor_id,reference_id) VALUES($1,$2,'admin_cancellation',$3,$4)",[item.variant_id,item.quantity,user.id,id])}}
      if(o.coupon_id)await c.query('UPDATE coupons SET used_count=GREATEST(0,used_count-1) WHERE id=$1',[o.coupon_id])
      if(o.payment_status==='paid'&&payment==='paid')throw Error('Paid orders require refund_pending status when cancelled.')
     }
     await c.query('UPDATE orders SET status=$1,payment_status=$2,courier=$3,tracking_number=$4,admin_notes=$5,updated_at=now() WHERE id=$6',[status,payment,courier,tracking,notes,id])
     if(status!==o.status||payment!==o.payment_status)await c.query('INSERT INTO order_events(order_id,actor_id,event,note) VALUES($1,$2,$3,$4)',[id,user.id,`status:${status}/payment:${payment}`,notes])
    });break
   }
   case'customers:status':{
    if(user.role!=='admin'||!uuid.test(d.id))return jsonError('Not authorized.',403);const r=await query('UPDATE users SET is_active=$1,updated_at=now() WHERE id=$2 AND role=\'customer\' RETURNING id',[Boolean(d.active),d.id]);if(!r.rows.length)return jsonError('Customer not found.',404);id=d.id;break
   }
   case'coupons:save':{
    const code=cleanText(d.code,30).toUpperCase().replace(/[^A-Z0-9_-]/g,'');const kind=['percent','fixed'].includes(d.kind)?d.kind:'percent';const raw=Number(d.amount),amount=kind==='fixed'?cash(raw):Math.round(raw)
    const min=cash(d.min_spend_rupees);const usage=d.usage_limit?Number(d.usage_limit):null
    if(code.length<3||amount instanceof Error||min instanceof Error||amount<=0||kind==='percent'&&amount>100||usage!==null&&(!Number.isInteger(usage)||usage<1))return jsonError('Invalid coupon settings.')
    const data=[code,kind,amount,min,usage,d.starts_at||null,d.ends_at||null,flag(d.enabled)]
    if(id)await query('UPDATE coupons SET code=$1,kind=$2,amount=$3,min_spend_cents=$4,usage_limit=$5,starts_at=$6,ends_at=$7,enabled=$8 WHERE id=$9',[...data,id]);else{const r=await query('INSERT INTO coupons(code,kind,amount,min_spend_cents,usage_limit,starts_at,ends_at,enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',data);id=r.rows[0].id}break
   }
   case'shipping:save':{
    const name=cleanText(d.name,80),ds=String(d.districts||'').split(',').map(x=>x.trim()).filter(Boolean),fee=cash(d.fee_rupees),free=cash(d.free_above_rupees)
    if(!name||ds.length<1||ds.some(x=>!districts.includes(x))||fee instanceof Error||free instanceof Error)return jsonError('Provide zone name, valid Sri Lankan districts and fees.')
    const values=[name,ds,fee,free,flag(d.enabled)]
    if(id)await query('UPDATE shipping_zones SET name=$1,districts=$2,fee_cents=$3,free_above_cents=$4,enabled=$5 WHERE id=$6',[...values,id]);else{const r=await query('INSERT INTO shipping_zones(name,districts,fee_cents,free_above_cents,enabled) VALUES($1,$2,$3,$4,$5) RETURNING id',values);id=r.rows[0].id}break
   }
   case'banners:save':{
    const title=cleanText(d.title,160);if(!title)return jsonError('Title required.');const data=[title,cleanText(d.subtitle,500),safeUrl(d.image_url),cleanText(d.button_label,60)||'Shop now',safeUrl(d.button_url)||'/shop',Number(d.sort_order)||0,flag(d.enabled)]
    if(id)await query('UPDATE banners SET title=$1,subtitle=$2,image_url=$3,button_label=$4,button_url=$5,sort_order=$6,enabled=$7 WHERE id=$8',[...data,id]);else{const r=await query('INSERT INTO banners(title,subtitle,image_url,button_label,button_url,sort_order,enabled) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',data);id=r.rows[0].id}break
   }
   case'pages:save':{
    const title=cleanText(d.title,160),slug=slugify(d.slug||title);if(!title||!slug)return jsonError('Page title and slug required.');const data=[title,slug,cleanText(d.content,100000),cleanText(d.seo_title,160),cleanText(d.seo_description,350),flag(d.published)]
    if(id)await query('UPDATE pages SET title=$1,slug=$2,content=$3,seo_title=$4,seo_description=$5,published=$6,updated_at=now() WHERE id=$7',[...data,id]);else{const r=await query('INSERT INTO pages(title,slug,content,seo_title,seo_description,published) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',data);id=r.rows[0].id}break
   }
   case'reviews:status':{
    if(!['approved','rejected','pending'].includes(d.status)||!uuid.test(d.id))return jsonError('Invalid moderation request.');await query('UPDATE reviews SET status=$1 WHERE id=$2',[d.status,d.id]);id=d.id;break
   }
   case'returns:status':{
    if(!['approved','rejected','completed'].includes(d.status)||!uuid.test(d.id))return jsonError('Invalid return state.')
    await withTransaction(async c=>{
     const r=await c.query('SELECT * FROM returns WHERE id=$1 FOR UPDATE',[d.id]);const ret=r.rows[0];if(!ret)throw Error('Return not found')
     if(!((ret.status==='requested'&&['approved','rejected'].includes(d.status))||(ret.status==='approved'&&['completed','rejected'].includes(d.status))))throw Error('Invalid return transition')
     if(d.status==='completed'){
      const{rows:items}=await c.query('SELECT variant_id,quantity FROM order_items WHERE order_id=$1',[ret.order_id]);for(const item of items){if(item.variant_id){await c.query('UPDATE product_variants SET on_hand=on_hand+$1 WHERE id=$2',[item.quantity,item.variant_id]);await c.query("INSERT INTO inventory_movements(variant_id,delta,reason,actor_id,reference_id) VALUES($1,$2,'return_received',$3,$4)",[item.variant_id,item.quantity,user.id,ret.order_id])}}
      await c.query("UPDATE orders SET status='returned',payment_status=CASE WHEN payment_status='paid' THEN 'refund_pending' ELSE payment_status END WHERE id=$1",[ret.order_id])
     }
     await c.query('UPDATE returns SET status=$1,admin_note=$2 WHERE id=$3',[d.status,cleanText(d.admin_note,300),d.id])
     await c.query('INSERT INTO order_events(order_id,actor_id,event) VALUES($1,$2,$3)',[ret.order_id,user.id,'return_'+d.status])
    });id=d.id;break
   }
   case'tickets:status':{
    if(!['open','in_progress','resolved'].includes(d.status)||!uuid.test(d.id))return jsonError('Invalid ticket status.');await query('UPDATE tickets SET status=$1 WHERE id=$2',[d.status,d.id]);id=d.id;break
   }
   case'tickets:reply':{
    const message=cleanText(d.message,3000);if(message.length<2||!uuid.test(d.id))return jsonError('Reply cannot be empty.');await withTransaction(async c=>{await c.query('INSERT INTO ticket_replies(ticket_id,staff_id,message) VALUES($1,$2,$3)',[d.id,user.id,message]);await c.query("UPDATE tickets SET status='in_progress' WHERE id=$1",[d.id])});id=d.id;break
   }
   case'settings:save':{
    const pairs=Object.entries(d).filter(([key])=>allowedSettings.includes(key))
    for(const [key,value] of pairs){const text=cleanText(value,key==='bank_details'?4000:2000);if(['default_shipping_cents','free_shipping_over_cents'].includes(key)&&(!/^\d+$/.test(text)||Number(text)>1000000000))throw Error('Shipping values must be valid cents');if(['cod_enabled','bank_enabled'].includes(key)&&!['true','false'].includes(text))throw Error('Payment toggles must be true or false');await query('INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=now()',[key,text])}break
   }
   default:return jsonError('Unknown admin action.',404)
  }
  await audit(user.id,action,section,id)
  if(action==='orders:save'){try{const {rows}=await query<any>('SELECT email,order_number,status,payment_status,tracking_number,courier FROM orders WHERE id=$1',[id]);if(rows[0])await sendMail(rows[0].email,`DZone order update: ${rows[0].order_number}`,`Order: ${rows[0].order_number}\nStatus: ${rows[0].status}\nPayment: ${rows[0].payment_status}\nCourier: ${rows[0].courier||'Pending'}\nTracking: ${rows[0].tracking_number||'Pending'}`)}catch(e){console.error('Order update email skipped',e)}}
  if(action==='tickets:reply'){try{const {rows}=await query<any>('SELECT email,subject FROM tickets WHERE id=$1',[id]);if(rows[0])await sendMail(rows[0].email,`DZone support: ${rows[0].subject}`,cleanText(d.message,3000))}catch(e){console.error('Ticket reply email skipped',e)}}
  return NextResponse.json({ok:true,id})
 }catch(e:any){console.error('Admin action:',e);const msg=String(e.message||'Could not save changes');return jsonError(msg.includes('duplicate key')?'A record with this slug, code or SKU already exists.':msg.includes('foreign key')?'Referenced record not found.':msg,400)}
}
