import type {Metadata} from 'next'
import '@/app/globals.css'
import {CartProvider} from '@/components/CartProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import {settings} from '@/lib/store'
import {currentUser} from '@/lib/auth'
export const dynamic='force-dynamic'
export const metadata:Metadata={title:{default:'DZone — Shop Smarter',template:'%s | DZone'},description:'DZone: a modern Sri Lankan online store for everyday essentials.',robots:{index:true,follow:true}}
export default async function RootLayout({children}:{children:React.ReactNode}){
 let store:Record<string,string>={store_name:'DZone',tagline:'Better finds. Every day.',announcement:'Welcome to DZone',contact_email:'hello@example.com',contact_phone:''};let user:Awaited<ReturnType<typeof currentUser>>=null
 try{[store,user]=await Promise.all([settings(),currentUser()])}catch{/* Build and first-time setup can render before DB init */}
 return <html lang="en"><body><CartProvider><Header name={store.store_name} announcement={store.announcement} userName={user?.full_name} isStaff={user?.role==='admin'||user?.role==='staff'}/>{children}<Footer name={store.store_name} tagline={store.tagline} email={store.contact_email} phone={store.contact_phone}/></CartProvider></body></html>
}
