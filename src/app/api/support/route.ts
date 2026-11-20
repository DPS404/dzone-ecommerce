import {NextRequest,NextResponse} from 'next/server'
import {query} from '@/lib/db'
import {currentUser} from '@/lib/auth'
import {cleanText,validEmail} from '@/lib/utils'
import {jsonError,limited,ip,safeRequest} from '@/lib/security'
export const runtime='nodejs'
export async function POST(req:NextRequest){if(!safeRequest(req))return jsonError('Origin denied',403);if(await limited('support:'+ip(req),6,60))return jsonError('Too many messages. Please try later.',429);const b=await req.json();const name=cleanText(b.name,100),email=cleanText(b.email,150).toLowerCase(),subject=cleanText(b.subject,150),message=cleanText(b.message,3000);if(name.length<2||!validEmail(email)||subject.length<3||message.length<10)return jsonError('Please provide valid contact details and message.');const u=await currentUser();await query('INSERT INTO tickets(user_id,name,email,subject,message) VALUES($1,$2,$3,$4,$5)',[u?.id||null,name,email,subject,message]);return NextResponse.json({ok:true})}
