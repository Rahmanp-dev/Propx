import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function TenantPortalPage() {
  const session = await auth()
  
  if (session) {
    redirect('/tenant-portal/dashboard')
  } else {
    redirect('/tenant-portal/login')
  }
}
