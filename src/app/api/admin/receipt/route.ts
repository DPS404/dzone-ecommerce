import {NextRequest,NextResponse} from 'next/server'
import {get} from '@vercel/blob'
import {isAdmin} from '@/lib/auth'
import {query} from '@/lib/db'
import {jsonError} from '@/lib/security'
export const runtime='nodejs'
export async function GET(req:NextRequest){const user=await isAdmin();if(!user)return jsonError('Unauthorized',403);const id=req.nextUrl.searchParams.get('id');const{rows}=await query<{receipt_url:string}>('SELECT receipt_url FROM orders WHERE id=$1',[id]);if(!rows[0]?.receipt_url)return jsonError('No receipt',404);if(!process.env.BLOB_PRIVATE_READ_WRITE_TOKEN)return jsonError('Private Blob not configured.',503);try{const result=await get(rows[0].receipt_url,{access:'private',token:process.env.BLOB_PRIVATE_READ_WRITE_TOKEN});if(result?.statusCode!==200)return jsonError('Receipt unavailable.',404);return new NextResponse(result.stream,{headers:{'Content-Type':result.blob.contentType,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store','Content-Disposition':'inline'}})}catch{return jsonError('Could not fetch receipt.',500)}}
