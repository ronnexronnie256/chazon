export type InitiatePaymentPayload = {
  tx_ref: string;
  amount: string;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    phonenumber?: string;
    name: string;
  };
  customizations: {
    title: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
};

export const initiatePayment = async (payload: InitiatePaymentPayload) => {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET?.trim();

    if (!secretKey) {
      throw new Error('Flutterwave secret key is not configured');
    }

    // Flutterwave v3 Payments API
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: payload.tx_ref,
        amount: payload.amount,
        currency: payload.currency,
        redirect_url: payload.redirect_url,
        customer: {
          email: payload.customer.email,
          phonenumber: payload.customer.phonenumber,
          fullname: payload.customer.name,
        },
        customizations: payload.customizations,
        meta: payload.meta,
        payment_options: 'mobilemoneyuganda', // Force Mobile Money for Uganda
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Flutterwave API error: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error('Flutterwave payment initiation error:', error);
    throw error;
  }
};

export const verifyTransaction = async (transactionId: string) => {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET?.trim();

    if (!secretKey) {
      throw new Error('Flutterwave secret key is not configured');
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Flutterwave API error: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error('Flutterwave transaction verification error:', error);
    throw error;
  }
};

export const verifyWebhookSignature = (
  payload: any,
  signature: string
): boolean => {
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('FLUTTERWAVE_WEBHOOK_SECRET is not configured');
    return false;
  }

  return signature === webhookSecret;
};

export type InitiateTransferPayload = {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  callback_url?: string;
  debit_currency?: string;
  beneficiary_name?: string;
};

export const initiateTransfer = async (payload: InitiateTransferPayload) => {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET?.trim();

    if (!secretKey) {
      throw new Error('Flutterwave secret key is not configured');
    }

    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Flutterwave API error: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error('Flutterwave transfer initiation error:', error);
    throw error;
  }
};

export const getTransferStatus = async (transferId: string) => {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET?.trim();

    if (!secretKey) {
      throw new Error('Flutterwave secret key is not configured');
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transfers/${transferId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Flutterwave API error: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error('Flutterwave transfer status error:', error);
    throw error;
  }
};

export type RefundPayload = {
  id: string;
  amount?: number;
  comments?: string;
};

export const processRefund = async (payload: RefundPayload) => {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET?.trim();

    if (!secretKey) {
      throw new Error('Flutterwave secret key is not configured');
    }

    const url = `https://api.flutterwave.com/v3/transactions/${payload.id}/refund`;

    const requestBody: any = {};
    if (payload.amount) {
      requestBody.amount = payload.amount;
    }
    if (payload.comments) {
      requestBody.comment = payload.comments;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body:
        Object.keys(requestBody).length > 0
          ? JSON.stringify(requestBody)
          : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Flutterwave refund API error: ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error('Flutterwave refund error:', error);
    throw error;
  }
};
