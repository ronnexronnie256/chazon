import Flutterwave from 'flutterwave-node-v3';

// Lazy initialization to avoid errors during build
const getFlutterwave = () => {
  if (!process.env.FLUTTERWAVE_SECRET) {
    throw new Error('Flutterwave secret key is not configured. Please set FLUTTERWAVE_SECRET in your environment variables.');
  }
  
  // Extract public key from secret key format (FLWSECK_TEST-xxx -> FLWPUBK_TEST-xxx)
  // If FLUTTERWAVE_PUBLIC_KEY is explicitly set, use it; otherwise derive from secret
  const secretKey = process.env.FLUTTERWAVE_SECRET.trim();
  const publicKeyEnv = process.env.FLUTTERWAVE_PUBLIC_KEY?.trim();
  
  let publicKey: string;
  if (publicKeyEnv) {
    publicKey = publicKeyEnv;
  } else {
    // Derive public key from secret key
    if (secretKey.startsWith('FLWSECK_TEST-')) {
      publicKey = secretKey.replace('FLWSECK_TEST-', 'FLWPUBK_TEST-');
    } else if (secretKey.startsWith('FLWSECK-')) {
      publicKey = secretKey.replace('FLWSECK-', 'FLWPUBK-');
    } else {
      throw new Error('Invalid Flutterwave secret key format. Must start with FLWSECK_TEST- or FLWSECK-');
    }
  }
  
  // The Flutterwave SDK constructor expects positional arguments: (publicKey, secretKey)
  // Reference: https://developer.flutterwave.com/docs/integration-guides/authentication
  return new Flutterwave(publicKey, secretKey);
};

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
    
    // Use Flutterwave v3 Payments API directly
    // Reference: https://developer.flutterwave.com/v3.0/reference/introduction-1
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
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
          name: payload.customer.name,
        },
        customizations: payload.customizations,
        meta: payload.meta,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Flutterwave API error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('Flutterwave payment initiation error:', error);
    throw error;
  }
};

export const verifyTransaction = async (transactionId: string) => {
  try {
    const flw = getFlutterwave();
    const response = await flw.Transaction.verify({ id: transactionId });
    return response;
  } catch (error) {
    console.error('Flutterwave transaction verification error:', error);
    throw error;
  }
};

/**
 * Verify Flutterwave webhook signature
 * @param payload - The webhook payload
 * @param signature - The signature from the 'verif-hash' header
 * @returns boolean indicating if the signature is valid
 */
export const verifyWebhookSignature = (payload: any, signature: string): boolean => {
  const webhookSecret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error('FLUTTERWAVE_WEBHOOK_SECRET is not configured');
    return false;
  }
  
  // Flutterwave uses a simple string comparison for webhook verification
  // The signature should match the webhook secret
  return signature === webhookSecret;
};

/**
 * Process Flutterwave webhook event
 * @param event - The webhook event data
 * @returns Processed event data
 */
export const processWebhookEvent = async (event: any) => {
  try {
    // Verify the transaction with Flutterwave
    if (event.data?.id) {
      const verification = await verifyTransaction(event.data.id);
      return verification;
    }
    return event;
  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
};

export type InitiateTransferPayload = {
  account_bank: string; // Bank code (e.g., "MPS" for Mobile Money)
  account_number: string; // Phone number for Mobile Money
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  callback_url?: string;
  debit_currency?: string;
  beneficiary_name?: string;
};

/**
 * Initiate a transfer/payout to Mobile Money or Bank Account
 * @param payload - Transfer payload
 * @returns Transfer response
 */
export const initiateTransfer = async (payload: InitiateTransferPayload) => {
  try {
    const flw = getFlutterwave();
    const response = await flw.Transfer.initiate(payload);
    return response;
  } catch (error) {
    console.error('Flutterwave transfer initiation error:', error);
    throw error;
  }
};

/**
 * Get transfer status
 * @param transferId - Flutterwave transfer ID
 * @returns Transfer status response
 */
export const getTransferStatus = async (transferId: string) => {
  try {
    const flw = getFlutterwave();
    const response = await flw.Transfer.getStatus({ id: transferId });
    return response;
  } catch (error) {
    console.error('Flutterwave transfer status error:', error);
    throw error;
  }
};

export type RefundPayload = {
  id: string; // Flutterwave transaction ID
  amount?: number; // Optional: partial refund amount. If not provided, full refund
  comments?: string; // Optional: reason for refund
};

/**
 * Process a refund for a Flutterwave transaction
 * @param payload - Refund payload with transaction ID and optional amount
 * @returns Refund response
 */
export const processRefund = async (payload: RefundPayload) => {
  try {
    const secretKey = process.env.FLUTTERWAVE_SECRET?.trim();
    
    if (!secretKey) {
      throw new Error('Flutterwave secret key is not configured');
    }

    // Flutterwave Refund API endpoint
    // Reference: https://developer.flutterwave.com/reference/refund-a-transaction
    const url = `https://api.flutterwave.com/v3/transactions/${payload.id}/refund`;
    
    const requestBody: any = {};
    if (payload.amount) {
      requestBody.amount = payload.amount;
    }
    if (payload.comments) {
      requestBody.comments = payload.comments;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: Object.keys(requestBody).length > 0 ? JSON.stringify(requestBody) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Flutterwave refund API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Flutterwave refund error:', error);
    throw error;
  }
};
