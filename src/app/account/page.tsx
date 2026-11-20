import Link from 'next/link'
import {redirect} from 'next/navigation'
import {currentUser} from '@/lib/auth'
import {query} from '@/lib/db'
import {AccountActions} from '@/components/AccountActions'
export const metadata={title:'My account'}
export default async function Account(){const user=await currentUser();if(!user)redirect('/login');const {rows:orders}=await query<any>('SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100',[user.id]);for(const o of orders){const{rows}=await query<any>('SELECT * FROM order_items WHERE order_id=$1',[o.id]);o.items=rows}return <main className="container"><div className="page-head"><h1>Hi, {user.full_name.split(' ')[0]} 👋</h1><p className="muted">Manage your orders and account.</p></div><div style={{display:'flex',gap:10,alignItems:'center',marginBottom:25,flexWrap:'wrap'}}><span className="pill">{user.email}</span><Link className="btn btn-outline btn-small" href="/shop">Continue shopping</Link><form action="/api/auth/logout" method="post"><button className="btn btn-outline btn-small">Sign out</button></form></div><h2 style={{fontSize:25}}>Your orders</h2><AccountActions orders={orders}/></main>}
