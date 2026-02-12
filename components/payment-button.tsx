"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface PaymentButtonProps {
  taskId: string
  amount: number
  currency: string
  className?: string
}

export function PaymentButton({ taskId, amount, currency, className }: PaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taskId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate payment")
      }

      if (data.link) {
        window.location.href = data.link
      } else {
        throw new Error("No payment link returned")
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast.error(error instanceof Error ? error.message : "Payment failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={handlePayment} 
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        `Pay ${currency} ${amount.toLocaleString()}`
      )}
    </Button>
  )
}
