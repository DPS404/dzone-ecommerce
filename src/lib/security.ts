import {NextRequest,NextResponse} from 'next/server'
import {query} from '@/lib/db'
export function safeRequest(req:NextRequest){
 const origin=req.headers.get('origin');if(!origin)return true
 try{const url=new URL(origin);const current=new URL(req.url);return url.host===current.host || (process.env.NEXT_PUBLIC_SITE_URL&&origin===process.env.NEXT_PUBLIC_SITE_URL)}catch{return false}
}
export function jsonError(message:string,status=400){return NextResponse.json({error:message},{status})}
export async function limited(key:string,limit=10,windowMinutes=10){
 const{rows}=await query<{attempts:number}>(`INSERT INTO rate_limits(key,attempts,expires_at) VALUES($1,1,now()+($2::int * interval '1 minute')) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.attempts+1 END, expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+($2::int * interval '1 minute') ELSE rate_limits.expires_at END RETURNING attempts`,[key,windowMinutes]);return rows[0].attempts>limit
}
export function ip(req:NextRequest){return (req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,64)}
