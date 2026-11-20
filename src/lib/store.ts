import { query } from '@/lib/db'
export type Product = {
 id:string; name:string; slug:string; description:string; details:string; images:string[]; featured:boolean;status:string;
 category_id:string|null; category_name?:string; category_slug?:string;
 variant_id:string; variant_label:string; sku:string; price_cents:number; compare_cents:number|null; on_hand:number;
}
export async function settings() {
  const defaults: Record<string,string> = {
    store_name:'DZone', tagline:'Better finds. Every day.', announcement:'Free shipping on selected orders · Islandwide delivery',
    hero_title:'Discover your next favourite thing.', hero_subtitle:'Thoughtfully curated essentials, standout prices, and an easy shopping experience.',
    contact_email:'hello@example.com', contact_phone:'+94 77 000 0000', contact_address:'Sri Lanka',
    bank_details:'Bank: Your Bank\nAccount Name: Your Business\nAccount No: 0000000000\nBranch: Colombo',
    cod_enabled:'true',bank_enabled:'true',default_shipping_cents:'45000',free_shipping_over_cents:'2500000',
    instagram:'',facebook:'',logo_url:'',footer_text:'Curated products. Trusted service.',
  }
  const { rows } = await query<{key:string;value:string}>('SELECT key,value FROM settings')
  for(const row of rows) defaults[row.key] = row.value
  return defaults
}
export async function categories() {
  const {rows}=await query<{id:string;name:string;slug:string;icon:string;active:boolean;sort_order:number}>('SELECT * FROM categories WHERE active=true ORDER BY sort_order,name')
  return rows
}
export async function products(filters:{q?:string;category?:string;sort?:string;featured?:boolean;limit?:number;page?:number}={}) {
  const cond=["p.status='published'",'v.active=true']
  const params:unknown[]=[]
  if(filters.category){params.push(filters.category);cond.push(`c.slug=$${params.length}`)}
  if(filters.q){params.push('%'+filters.q.slice(0,100)+'%');cond.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR c.name ILIKE $${params.length})`)}
  if(filters.featured)cond.push('p.featured=true')
  const order = ({newest:'p.created_at DESC',price_low:'v.price_cents ASC',price_high:'v.price_cents DESC',name:'p.name ASC'} as Record<string,string>)[filters.sort||'']||'p.created_at DESC'
  params.push(Math.min(Math.max(filters.limit||24,1),100)); const limitParam=params.length
  params.push((Math.max(filters.page||1,1)-1)*(filters.limit||24));const offsetParam=params.length
  const {rows}=await query<Product>(`SELECT p.*,c.name AS category_name,c.slug AS category_slug,
     v.id AS variant_id,v.label AS variant_label,v.sku,v.price_cents,v.compare_cents,v.on_hand
    FROM products p LEFT JOIN categories c ON c.id=p.category_id
    JOIN LATERAL (SELECT * FROM product_variants WHERE product_id=p.id AND active=true ORDER BY (on_hand>0) DESC,sort_order,id LIMIT 1) v ON true
    WHERE ${cond.join(' AND ')} ORDER BY ${order} LIMIT $${limitParam} OFFSET $${offsetParam}`,params)
  return rows
}
export async function productBySlug(slug:string) {
  const {rows}=await query<any>(`SELECT p.*,c.name AS category_name,c.slug AS category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=$1 AND p.status='published' LIMIT 1`,[slug])
  const product=rows[0]; if(!product)return null
  const {rows:variants}=await query<any>('SELECT * FROM product_variants WHERE product_id=$1 AND active=true ORDER BY sort_order,label',[product.id])
  const {rows:reviews}=await query<any>(`SELECT r.rating,r.body,r.created_at,u.full_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE r.product_id=$1 AND r.status='approved' ORDER BY r.created_at DESC LIMIT 30`,[product.id])
  return {...product,variants,reviews}
}
export async function homepageBanner() {
  const {rows}=await query<any>('SELECT * FROM banners WHERE enabled=true ORDER BY sort_order LIMIT 1')
  return rows[0]||null
}
