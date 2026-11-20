import {NextRequest,NextResponse} from 'next/server'
import {currentUser} from '@/lib/auth'
import {query} from '@/lib/db'
import {cleanText} from '@/lib/utils'
import {jsonError,safeRequest} from '@/lib/security'
export const runtime='nodejs'
export async function POST(req:NextRequest){if(!safeRequest(req))return jsonError('Origin denied',403);const u=await currentUser();if(!u)return jsonError('Sign in first.',401);const b=await req.json();const rating=Number(b.rating),body=cleanText(b.body,1500);if(!Number.isInteger(rating)||rating<1||rating>5||body.length<10)return jsonError('Provide a rating and review of at least 10 characters.');const{rows}=await query('SELECT 1 FROM order_items i JOIN orders o ON o.id=i.order_id WHERE i.product_id=$1 AND o.user_id=$2 AND o.status=\'delivered\' LIMIT 1',[b.productId,u.id]);if(!rows.length)return jsonError('Only customers with a delivered order can review this product.',403);await query('INSERT INTO reviews(product_id,user_id,rating,body) VALUES($1,$2,$3,$4) ON CONFLICT(product_id,user_id) DO UPDATE SET rating=excluded.rating,body=excluded.body,status=\'pending\',created_at=now()',[b.productId,u.id,rating,body]);return NextResponse.json({ok:true})}
