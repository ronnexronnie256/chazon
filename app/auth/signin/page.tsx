'use client'
 
import { SignIn } from '@clerk/nextjs'
 
export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <SignIn 
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
          },
        }}
        oauthFlow="redirect"
        routing="path"
        path="/auth/signin"
      />
    </div>
  )
}
