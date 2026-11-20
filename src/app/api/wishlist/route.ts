import {NextRequest,NextResponse} from 'next/server'
import {query} from '@/lib/db'
import {jsonError,safeRequest} from '@/lib/security'
export const runtime='nodejs'
export async function POST(req:NextRequest){if(!safeRequest(req))return jsonError('Origin denied',403);const data=await req.json();const ids=Array.isArray(data.ids)?data.ids.filter((x:any)=>typeof x==='string'&&/^[0-9a-f-]{36}$/i.test(x)).slice(0,50):[];if(!ids.length)return NextResponse.json({products:[]});const{rows}=await query<any>(`SELECT p.*,c.name AS category_name,v.id AS variant_id,v.label AS variant_label,v.sku,v.price_cents,v.compare_cents,v.on_hand FROM products p LEFT JOIN categories c ON c.id=p.category_id JOIN LATERAL(SELECT * FROM product_variants WHERE product_id=p.id AND active=true ORDER BY (on_hand>0) DESC,sort_order LIMIT 1)v ON true WHERE p.id=ANY($1::uuid[]) AND p.status='published'`,[ids]);return NextResponse.json({products:rows})}
