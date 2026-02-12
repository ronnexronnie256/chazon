declare module 'flutterwave-node-v3' {
  interface FlutterwaveConfig {
    publicKey: string
    secretKey: string
    encryptKey?: string
  }

  interface PaymentRequest {
    tx_ref: string
    amount: string
    currency: string
    redirect_url: string
    customer: {
      email: string
      name: string
      phone_number?: string
    }
    customizations?: {
      title?: string
      description?: string
      logo?: string
    }
  }

  interface PaymentResponse {
    status: string
    message: string
    data?: {
      link: string
      [key: string]: any
    }
  }

  interface TransferRequest {
    account_bank: string
    account_number: string
    amount: number
    narration: string
    currency: string
    reference: string
    callback_url?: string
    debit_currency?: string
    beneficiary_name?: string
  }

  interface TransferResponse {
    status: string
    message: string
    data?: {
      id: number
      account_number: string
      bank_code: string
      full_name: string
      created_at: string
      currency: string
      debit_currency: string
      amount: number
      fee: number
      status: string
      reference: string
      meta: any
      narration: string
      complete_message: string
      requires_approval: number
      is_approved: number
      [key: string]: any
    }
  }

  class Flutterwave {
    // Constructor expects positional arguments: (publicKey, secretKey, baseUrlOrProductionFlag?)
    constructor(publicKey: string, secretKey: string, baseUrlOrProductionFlag?: string | boolean)
    
    Charge: any
    Transaction: {
      verify(payload: { id: string }): Promise<any>
    }
    Transfer: {
      initiate(payload: TransferRequest): Promise<TransferResponse>
      getStatus(payload: { id: string }): Promise<any>
    }
    Bank: any
    Beneficiary: any
    Bills: any
    Misc: any
    MobileMoney: any
    PaymentPlan: any
    Subscription: any
    VirtualAcct: any
    VirtualCard: any
  }

  export default Flutterwave
}

