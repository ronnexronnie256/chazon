declare module 'africastalking' {
  interface AfricaTalkingOptions {
    apiKey: string;
    username: string;
  }

  interface SMSService {
    send(options: { to: string[]; message: string; from?: string }): Promise<{
      SMSMessageData: {
        Recipients: Array<{
          status: string;
          number: string;
          cost?: string;
          messageId?: string;
        }>;
        Message: string;
      };
    }>;
  }

  interface AfricaTalkingInstance {
    SMS: SMSService;
    sms: SMSService;
    airtime: any;
    application(options?: AfricaTalkingOptions): any;
    payments(options?: AfricaTalkingOptions): any;
    voice(options?: AfricaTalkingOptions): any;
  }

  function africastalking(options: AfricaTalkingOptions): AfricaTalkingInstance;

  export default africastalking;
}
