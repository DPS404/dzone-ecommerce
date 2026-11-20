import {NextRequest,NextResponse} from 'next/server'
import {query} from '@/lib/db'
import {cleanText,validEmail} from '@/lib/utils'
import {jsonError,limited,ip,safeRequest} from '@/lib/security'
export const runtime='nodejs'
export async function POST(req:NextRequest){if(!safeRequest(req))return jsonError('Origin denied',403);if(await limited('track:'+ip(req),25,15))return jsonError('Try again later.',429);const body=await req.json();const no=cleanText(body.orderNumber,80),email=cleanText(body.email,150).toLowerCase();if(!validEmail(email))return jsonError('Invalid email');const{rows}=await query<any>('SELECT order_number,status,payment_status,courier,tracking_number,created_at FROM orders WHERE order_number=$1 AND lower(email)=$2',[no,email]);if(!rows.length)return jsonError('No matching order was found.',404);return NextResponse.json({order:rows[0]})}
