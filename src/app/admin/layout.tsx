import {redirect} from 'next/navigation'
import {isAdmin} from '@/lib/auth'
import AdminLayout from '@/components/AdminLayout'
export default async function Layout({children}:{children:React.ReactNode}){const user=await isAdmin();if(!user)redirect('/login');return <AdminLayout user={user}>{children}</AdminLayout>}
