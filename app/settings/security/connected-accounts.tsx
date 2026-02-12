 'use client'
 
 import { useEffect, useMemo, useState } from 'react'
 import { Button } from '@/components/ui/button'
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
 import { useUser, useSignIn } from '@clerk/nextjs'
 import toast from 'react-hot-toast'
 
 function isGoogleLinked(externalAccounts: any[] | undefined) {
   if (!externalAccounts || externalAccounts.length === 0) return false
   return externalAccounts.some((acc: any) => {
     const provider = acc?.provider || ''
     return provider === 'google' || provider === 'oauth_google' || provider?.includes('google')
   })
 }
 
 async function logSecurityEvent(type: string, severity: 'LOW' | 'MEDIUM' | 'HIGH', metadata?: Record<string, any>) {
   try {
     await fetch('/api/security-events/log', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ type, severity, metadata }),
     })
   } catch (e) {
     // non-blocking
   }
 }
 
 export function ConnectedAccounts() {
   const { user } = useUser()
   const { signIn } = useSignIn()
   const [updatingPassword, setUpdatingPassword] = useState(false)
   const [currentPassword, setCurrentPassword] = useState('')
   const [newPassword, setNewPassword] = useState('')
 
   const googleConnected = useMemo(() => isGoogleLinked(user?.externalAccounts as any[]), [user?.externalAccounts])
   const passwordSet = !!user?.passwordEnabled
 
   useEffect(() => {
     const flag = typeof window !== 'undefined' ? window.localStorage.getItem('linking-google') : null
     if (!flag) return
 
     if (googleConnected) {
       toast.success('Google account linked')
       logSecurityEvent('AUTH_PROVIDER_LINKED', 'MEDIUM', { provider: 'google' })
     } else {
       toast.error('This Google account is already linked to another Chazon account.')
     }
     try {
       window.localStorage.removeItem('linking-google')
     } catch {}
   }, [googleConnected])
 
   const handleConnectGoogle = async () => {
     try {
       if (typeof window !== 'undefined') {
         window.localStorage.setItem('linking-google', '1')
       }
       await signIn?.authenticateWithRedirect({
         strategy: 'oauth_google',
         redirectUrl: '/settings/security',
         redirectUrlComplete: '/settings/security',
       })
     } catch (e: any) {
       toast.error('Failed to start Google linking')
       try {
         window.localStorage.removeItem('linking-google')
       } catch {}
     }
   }
 
   const handleUpdatePassword = async () => {
     if (!user) return
     if (!newPassword || newPassword.length < 6) {
       toast.error('Password must be at least 6 characters')
       return
     }
     setUpdatingPassword(true)
     try {
       // @ts-ignore Clerk JS provides updatePassword on user resource
       await user.updatePassword({ newPassword, currentPassword: currentPassword || undefined })
       toast.success('Password updated')
       logSecurityEvent('PASSWORD_UPDATED', 'MEDIUM')
       setCurrentPassword('')
       setNewPassword('')
     } catch (e: any) {
       const message = e?.errors?.[0]?.message || 'Failed to update password'
       toast.error(message)
     } finally {
       setUpdatingPassword(false)
     }
   }
 
   return (
     <div className="grid gap-6">
       <Card>
         <CardHeader>
           <CardTitle>Connected Accounts</CardTitle>
           <CardDescription>Manage your login methods.</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
             <div>
               <p className="font-medium">Google</p>
               <p className="text-sm text-gray-500">{googleConnected ? 'Connected' : 'Not connected'}</p>
             </div>
             {!googleConnected && (
               <Button onClick={handleConnectGoogle} variant="outline">
                 Connect Google
               </Button>
             )}
           </div>
 
           <div className="border-t my-2" />
 
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div>
                 <p className="font-medium">Password</p>
                 <p className="text-sm text-gray-500">{passwordSet ? 'Set' : 'Not set'}</p>
               </div>
             </div>
 
             <div className="grid gap-3 md:grid-cols-2">
               <input
                 type="password"
                 placeholder="Current password"
                 value={currentPassword}
                 onChange={(e) => setCurrentPassword(e.target.value)}
                 className="w-full rounded-md border px-3 py-2"
               />
               <input
                 type="password"
                 placeholder="New password"
                 value={newPassword}
                 onChange={(e) => setNewPassword(e.target.value)}
                 className="w-full rounded-md border px-3 py-2"
               />
             </div>
 
             <div>
               <Button onClick={handleUpdatePassword} disabled={updatingPassword}>
                 {updatingPassword ? 'Updating...' : (passwordSet ? 'Change Password' : 'Set Password')}
               </Button>
             </div>
           </div>
         </CardContent>
       </Card>
     </div>
   )
 }
 
