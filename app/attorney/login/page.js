import { redirect } from 'next/navigation'

// Attorney login redirects to the main login page
export default function AttorneyLoginRedirect() {
  redirect('/login')
}
