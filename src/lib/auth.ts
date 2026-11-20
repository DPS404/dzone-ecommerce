import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db'

const COOKIE = 'dzone_session'
function secret() {
  const s = process.env.AUTH_SECRET
  if (!s || s.length < 32) throw new Error('AUTH_SECRET must contain at least 32 characters')
  return new TextEncoder().encode(s)
}
export async function passwordHash(input: string) { return bcrypt.hash(input, 12) }
export async function passwordCheck(input: string, hashed: string) { return bcrypt.compare(input, hashed) }
export async function signSession(user: { id: string; role: string }) {
  return new SignJWT({ role: user.role }).setProtectedHeader({ alg: 'HS256' }).setSubject(user.id).setIssuedAt().setExpirationTime('7d').sign(secret())
}
export async function setSession(user: { id: string; role: string }) {
  const token = await signSession(user)
  ;(await cookies()).set(COOKIE, token, { httpOnly:true, secure:process.env.NODE_ENV === 'production', sameSite:'lax', path:'/', maxAge:60*60*24*7 })
}
export async function clearSession() { (await cookies()).delete(COOKIE) }
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.sub) return null
    const { rows } = await query<{id:string;full_name:string;email:string;phone:string;role:string;is_active:boolean}>(
      'SELECT id,full_name,email,phone,role,is_active FROM users WHERE id=$1', [payload.sub])
    const user = rows[0]
    return user?.is_active ? user : null
  } catch { return null }
}
export async function isAdmin() { const u = await currentUser(); return u && ['admin','staff'].includes(u.role) ? u : null }
