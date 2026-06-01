import { redirect } from 'next/navigation'
import { getTenantSession } from '@/lib/tenant-auth'

export default async function TenantPortalPage() {
  const session = await getTenantSession()
  
  if (session) {
    redirect('/tenant-portal/dashboard')
  } else {
    redirect('/tenant-portal/login')
  }
}
