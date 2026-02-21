"use client"

import { SignUp } from '@clerk/nextjs'

export default function SignUpCatchAllPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
          },
        }}
        routing="path"
        path="/auth/signup"
        afterSignUpUrl="/services"
        signInUrl="/auth/signin"
      />
    </div>
  )
}
