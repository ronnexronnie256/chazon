import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectedAccounts } from './connected-accounts'

export default async function SecuritySettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Security Settings</h1>
            <p className="text-muted-foreground">
                Account credential management is handled by Clerk. Use the sign-in page to manage your account.
            </p>
        </div>
        
        <div className="border-t" />

        <ConnectedAccounts />
      </div>
    </div>
  )
}
