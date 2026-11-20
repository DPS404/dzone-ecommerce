import {notFound,redirect} from 'next/navigation'
import {isAdmin} from '@/lib/auth'
import {query} from '@/lib/db'
import AdminSection from '@/components/AdminSection'
const allowed=['orders','products','inventory','categories','customers','coupons','shipping','banners','pages','reviews','returns','tickets','reports','settings']
export default async function AdminSectionPage({params}:{params:Promise<{section:string}>}){
 const {section}=await params;if(!allowed.includes(section))notFound()
 const user=await isAdmin();if(!user)redirect('/login');if(user.role==='staff'&&!['orders','inventory','tickets'].includes(section))redirect('/admin')
 let rows:any[]=[];let categories:any[]=[];let settings:any[]=[]
 switch(section){
  case'orders':({rows}=await query<any>(`SELECT o.*,(SELECT coalesce(json_agg(json_build_object('name',i.product_name,'sku',i.sku,'quantity',i.quantity,'unit_cents',i.unit_cents)),'[]'::json) FROM order_items i WHERE i.order_id=o.id) AS items FROM orders o ORDER BY o.created_at DESC LIMIT 200`));break
  case'products':({rows}=await query<any>(`SELECT p.*,c.name AS category_name,(SELECT json_agg(json_build_object('id',v.id,'label',v.label,'sku',v.sku,'price_cents',v.price_cents,'compare_cents',v.compare_cents,'on_hand',v.on_hand,'active',v.active) ORDER BY v.sort_order) FROM product_variants v WHERE v.product_id=p.id) AS variants FROM products p LEFT JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC LIMIT 250`));({rows:categories}=await query<any>('SELECT id,name FROM categories ORDER BY name'));break
  case'inventory':({rows}=await query<any>(`SELECT v.*,p.name AS product_name,p.status FROM product_variants v JOIN products p ON p.id=v.product_id ORDER BY v.on_hand ASC LIMIT 300`));break
  case'categories':({rows}=await query<any>('SELECT * FROM categories ORDER BY sort_order,name'));break
  case'customers':({rows}=await query<any>(`SELECT u.id,u.full_name,u.email,u.phone,u.role,u.is_active,u.created_at,(SELECT count(*) FROM orders o WHERE o.user_id=u.id) AS orders_count FROM users u ORDER BY created_at DESC LIMIT 250`));break
  case'coupons':({rows}=await query<any>('SELECT * FROM coupons ORDER BY created_at DESC'));break
  case'shipping':({rows}=await query<any>('SELECT * FROM shipping_zones ORDER BY name'));break
  case'banners':({rows}=await query<any>('SELECT * FROM banners ORDER BY sort_order'));break
  case'pages':({rows}=await query<any>('SELECT * FROM pages ORDER BY title'));break
  case'reviews':({rows}=await query<any>('SELECT r.*,u.full_name,p.name AS product_name FROM reviews r JOIN users u ON u.id=r.user_id JOIN products p ON p.id=r.product_id ORDER BY r.created_at DESC LIMIT 250'));break
  case'returns':({rows}=await query<any>('SELECT r.*,o.order_number,u.full_name FROM returns r JOIN orders o ON o.id=r.order_id JOIN users u ON u.id=r.user_id ORDER BY r.created_at DESC LIMIT 250'));break
  case'tickets':({rows}=await query<any>(`SELECT t.*,(SELECT coalesce(json_agg(json_build_object('message',tr.message,'created_at',tr.created_at)),'[]'::json) FROM ticket_replies tr WHERE tr.ticket_id=t.id) AS replies FROM tickets t ORDER BY t.created_at DESC LIMIT 250`));break
  case'reports':({rows}=await query<any>(`SELECT to_char(date_trunc('day',created_at),'YYYY-MM-DD') AS day,count(*) AS orders,COALESCE(SUM(total_cents),0) AS gross FROM orders GROUP BY date_trunc('day',created_at) ORDER BY day DESC LIMIT 30`));break
  case'settings':({rows:settings}=await query<any>('SELECT * FROM settings ORDER BY key'));break
 }
 return <AdminSection section={section} rows={rows} categories={categories} settings={settings} role={user.role}/>
}
