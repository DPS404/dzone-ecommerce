import {NextRequest,NextResponse} from 'next/server'
import {query} from '@/lib/db'
import {clearSession,setSession,passwordHash,passwordCheck} from '@/lib/auth'
import {cleanText,validEmail} from '@/lib/utils'
import {jsonError,safeRequest,limited,ip} from '@/lib/security'
export const runtime='nodejs'
export async function POST(req:NextRequest,{params}:{params:Promise<{action:string}>}){
 if(!safeRequest(req))return jsonError('Origin not allowed',403)
 const {action}=await params
 if(action==='logout'){await clearSession();return NextResponse.redirect(new URL('/',req.url),303)}
 if(!['login','register'].includes(action))return jsonError('Invalid action',404)
 try{
  if(await limited('auth:'+ip(req),15,15))return jsonError('Too many attempts. Try again later.',429)
  const data=await req.json();const email=cleanText(data.email,150).toLowerCase();const password=String(data.password||'')
  if(!validEmail(email)||password.length<10||password.length>128)return jsonError('Enter a valid email and password (minimum 10 characters).')
  if(action==='register'){
    const name=cleanText(data.name,100);const phone=cleanText(data.phone,20)
    if(name.length<2||phone.length<9)return jsonError('Please enter your name and phone number.')
    const hash=await passwordHash(password)
    const{rows}=await query<{id:string;role:string}>('INSERT INTO users(full_name,email,phone,password_hash,role) VALUES($1,$2,$3,$4,\'customer\') ON CONFLICT(email) DO NOTHING RETURNING id,role',[name,email,phone,hash])
    if(!rows.length)return jsonError('An account already exists for this email.',409)
    await setSession(rows[0]);return NextResponse.json({ok:true,role:'customer'})
  }
  const{rows}=await query<{id:string;role:string;password_hash:string;is_active:boolean}>('SELECT id,role,password_hash,is_active FROM users WHERE email=$1',[email])
  const user=rows[0];const okay=user?.is_active&&await passwordCheck(password,user.password_hash)
  if(!okay)return jsonError('Invalid email or password.',401)
  await setSession(user);return NextResponse.json({ok:true,role:user.role})
 }catch(e){console.error('Auth action failed',e);return jsonError('Unable to authenticate right now.',500)}
}
