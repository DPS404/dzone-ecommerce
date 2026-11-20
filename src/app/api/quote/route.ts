import {NextRequest,NextResponse} from 'next/server'
import {calculate} from '@/lib/checkout'
import {settings} from '@/lib/store'
import {jsonError,safeRequest} from '@/lib/security'
export const runtime='nodejs'
export async function POST(req:NextRequest){if(!safeRequest(req))return jsonError('Origin denied',403);try{const b=await req.json();const [quote,s]=await Promise.all([calculate(b.items,b.district,b.coupon),settings()]);return NextResponse.json({ok:true,...quote,bankDetails:s.bank_details,enabled:{cod:s.cod_enabled==='true',bank:s.bank_enabled==='true'}})}catch(e:any){return jsonError(e.message||'Unable to calculate quote.')}}
