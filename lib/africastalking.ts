import africastalking from 'africastalking';

const apiKey = process.env.AFRICAS_TALKING_API_KEY;
const username = process.env.AFRICAS_TALKING_USERNAME;

console.log("[Africa's Talking] API Key present:", !!apiKey);
console.log("[Africa's Talking] Username present:", !!username);

if (!apiKey || !username) {
  console.warn(
    "[Africa's Talking] Credentials not configured. Set AFRICAS_TALKING_API_KEY and AFRICAS_TALKING_USERNAME in .env"
  );
}

const at =
  apiKey && username
    ? africastalking({
        apiKey,
        username,
      })
    : null;

console.log("[Africa's Talking] Initialized:", !!at);
console.log("[Africa's Talking] SMS service:", !!at?.SMS);

export const sms = at?.SMS || at?.sms;
export const airtime = at?.airtime;

export function formatPhoneNumber(phone: string): string {
  let formatted = phone.replace(/[^0-9+]/g, '');

  if (formatted.startsWith('0')) {
    formatted = '+256' + formatted.slice(1);
  } else if (formatted.startsWith('256')) {
    formatted = '+' + formatted;
  } else if (!formatted.startsWith('+')) {
    formatted = '+256' + formatted;
  }

  return formatted;
}

export function isValidUgandaPhone(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return /^(\+256|256|0)(77|78|76|75|70|39)[0-9]{7}$/.test(cleaned);
}

export default at;
