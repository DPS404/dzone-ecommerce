import type {MetadataRoute} from 'next'
export default function robots():MetadataRoute.Robots{const site=process.env.NEXT_PUBLIC_SITE_URL||'https://example.com';return {rules:[{userAgent:'*',allow:'/',disallow:['/admin','/account','/checkout','/cart','/api/','/login','/register','/order-success/']}],sitemap:site.replace(/\/$/,'')+'/sitemap.xml'}}
