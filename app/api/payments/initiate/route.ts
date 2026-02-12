import { getUser } from "@/lib/supabase/auth"
import { prisma } from "@/lib/prisma"
import { initiatePayment } from "@/lib/flutterwave"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { client: true },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (task.clientId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!task.client.email) {
      return NextResponse.json({ error: "Client email is required for payment" }, { status: 400 })
    }

    // Create Transaction Record
    const transaction = await prisma.transaction.create({
      data: {
        taskId: task.id,
        amount: task.agreedPrice,
        platformFee: task.agreedPrice * 0.1, // 10% platform fee
        type: "CHARGE",
        status: "PENDING",
        metadata: {
          currency: task.currency, // Store currency in metadata for reference
        },
      },
    })

    const tx_ref = transaction.id

    // Get the base URL from the request
    const url = new URL(req.url)
    const baseUrl = `${url.protocol}//${url.host}`
    const redirectUrl = `${baseUrl}/api/payments/verify`

    const flwResponse = await initiatePayment({
      tx_ref,
      amount: task.agreedPrice.toString(),
      currency: task.currency,
      redirect_url: redirectUrl,
      customer: {
        email: task.client.email,
        name: task.client.name || "Client",
      },
      customizations: {
        title: "Chazon Service Payment",
        description: `Payment for task: ${task.category}`,
        logo: "https://chazon.com/logo.png",
      },
    })

    if (flwResponse.status === "success" && flwResponse.data?.link) {
      return NextResponse.json({ link: flwResponse.data.link })
    } else {
      return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 })
    }
  } catch (error) {
    console.error("Payment initiation error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
