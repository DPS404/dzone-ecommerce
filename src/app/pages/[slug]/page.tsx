import {notFound} from 'next/navigation'
import {query} from '@/lib/db'
import type {Metadata} from 'next'
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const{rows}=await query<any>('SELECT title,seo_title,seo_description FROM pages WHERE slug=$1 AND published=true',[slug]);return {title:rows[0]?.seo_title||rows[0]?.title||'Page',description:rows[0]?.seo_description||''}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const{rows}=await query<any>('SELECT * FROM pages WHERE slug=$1 AND published=true',[slug]);if(!rows.length)notFound();return <main className="container"><div className="page-head"><h1>{rows[0].title}</h1></div><article style={{maxWidth:850,whiteSpace:'pre-wrap',lineHeight:1.9,color:'#596476'}}>{rows[0].content}</article></main>}
