import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { prisma } from '@/lib/prisma';
import { initiatePayment } from '@/lib/flutterwave';

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { client: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!task.client.email) {
      return NextResponse.json(
        { error: 'Client email is required for payment' },
        { status: 400 }
      );
    }

    // Check if payment already exists for this task
    const existingPayment = await prisma.transaction.findFirst({
      where: {
        taskId: task.id,
        type: 'CHARGE',
        status: { in: ['PENDING', 'COMPLETED', 'HELD'] },
      },
    });

    if (existingPayment) {
      // Return existing payment link or initiate new one
      console.log('Existing payment found:', existingPayment.id);
    }

    // Create Transaction Record
    const transaction = await prisma.transaction.create({
      data: {
        taskId: task.id,
        amount: task.agreedPrice,
        platformFee: task.agreedPrice * 0.1, // 10% platform fee
        type: 'CHARGE',
        status: 'PENDING',
        metadata: {
          currency: task.currency,
          paymentType: 'mobile_money',
        },
      },
    });

    const tx_ref = transaction.id;

    // Get the base URL from the request
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const redirectUrl = `${baseUrl}/api/payments/verify?taskId=${taskId}`;

    // For Uganda, use Mobile Money
    const paymentOptions = 'mobile_money';

    const flwResponse = await initiatePayment({
      tx_ref,
      amount: task.agreedPrice.toString(),
      currency: task.currency || 'UGX',
      redirect_url: redirectUrl,
      customer: {
        email: task.client.email,
        name: task.client.name || 'Client',
        phonenumber: task.client.phone || undefined,
      },
      customizations: {
        title: 'Chazon Service Payment',
        description: `Payment for ${task.category} service`,
        logo: `${baseUrl}/logo.png`,
      },
      meta: {
        paymentOptions, // Tells Flutterwave to show Mobile Money option
        taskId: task.id,
        clientId: task.clientId,
      },
    });

    if (flwResponse.status === 'success' && flwResponse.data?.link) {
      return NextResponse.json({
        link: flwResponse.data.link,
        transactionId: transaction.id,
      });
    } else {
      // Delete the transaction if payment initiation failed
      await prisma.transaction.delete({ where: { id: transaction.id } });
      return NextResponse.json(
        { error: 'Failed to initiate payment' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
