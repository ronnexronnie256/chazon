export type FilterResult = {
  isAllowed: boolean;
  violations: Violation[];
  sanitizedContent?: string;
};

export type Violation = {
  type: ViolationType;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  pattern?: string;
};

export type ViolationType =
  | 'PHONE_NUMBER'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'SOCIAL_MEDIA'
  | 'EXTERNAL_LINK'
  | 'CONTACT_SHARING_PHRASE';

const phonePatterns = [
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  /\b\+?\d{10,15}\b/,
  /\b\d{3}\s?\d{3}\s?\d{4}\b/,
  /\b0\d{9}\b/,
  /\b\+256\d{9}\b/,
  /\b256\d{9}\b/,
  /\b\d{4}[-.\s]?\d{3}[-.\s]?\d{3}\b/,
  /call\s+me\s+at\s+[\d\s\+\-\(\)]+/i,
  /phone\s*:?\s*[\d\s\+\-\(\)]+/i,
  /contact\s+me\s+at\s+[\d\s\+\-\(\)]+/i,
  /reach\s+me\s+at\s+[\d\s\+\-\(\)]+/i,
];

const emailPatterns = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  /email\s*:?\s*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/i,
  /contact\s+me\s+at\s+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/i,
  /reach\s+me\s+at\s+[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/i,
];

const whatsappPatterns = [
  /wa\.me\/[\d\w]+/i,
  /whatsapp\.com\/send\?phone=[\d\w]+/i,
  /whatsapp\s*:?\s*[\d\s\+\-\(\)]+/i,
  /whatsapp\s+me\s+at\s+[\d\s\+\-\(\)]+/i,
  /text\s+me\s+on\s+whatsapp/i,
  /message\s+me\s+on\s+whatsapp/i,
  /add\s+me\s+on\s+whatsapp/i,
  /whatsapp\s+number/i,
];

const socialMediaPatterns = [
  /@[\w]{2,}/gi,
  /instagram\.com\/[\w]+/i,
  /facebook\.com\/[\w]+/i,
  /twitter\.com\/[\w]+/i,
  /x\.com\/[\w]+/i,
  /linkedin\.com\/in\/[\w]+/i,
  /tiktok\.com\/@[\w]+/i,
  /snapchat\.com\/add\/[\w]+/i,
  /telegram\.me\/[\w]+/i,
  /t\.me\/[\w]+/i,
];

const externalLinkPatterns = [
  /https?:\/\/(?!.*supabase\.co)(?!.*chazon\.com)(?!.*storage\.supabase\.co)[^\s]+/i,
  /www\.[^\s]+\.[^\s]{2,}/i,
];

const contactSharingPhrases = [
  /my\s+number\s+is/i,
  /call\s+me/i,
  /text\s+me/i,
  /dm\s+me/i,
  /direct\s+message/i,
  /private\s+message/i,
  /hit\s+me\s+up/i,
  /reach\s+out/i,
  /let's\s+continue\s+on\s+/i,
  /move\s+to\s+(whatsapp|telegram|signal)/i,
  /let's\s+chat\s+(on|via)\s+(whatsapp|telegram|signal)/i,
];

export function filterMessage(
  content: string,
  options: { blockOnViolation?: boolean } = { blockOnViolation: true }
): FilterResult {
  const violations: Violation[] = [];
  const originalContent = content;

  if (phonePatterns.some(pattern => pattern.test(originalContent))) {
    violations.push({
      type: 'PHONE_NUMBER',
      description: 'Phone number detected',
      severity: 'HIGH',
    });
  }

  if (emailPatterns.some(pattern => pattern.test(originalContent))) {
    violations.push({
      type: 'EMAIL',
      description: 'Email address detected',
      severity: 'HIGH',
    });
  }

  if (
    whatsappPatterns.some(pattern =>
      pattern.test(originalContent.toLowerCase())
    )
  ) {
    violations.push({
      type: 'WHATSAPP',
      description: 'WhatsApp reference detected',
      severity: 'HIGH',
    });
  }

  if (socialMediaPatterns.some(pattern => pattern.test(originalContent))) {
    violations.push({
      type: 'SOCIAL_MEDIA',
      description: 'Social media reference detected',
      severity: 'MEDIUM',
    });
  }

  if (externalLinkPatterns.some(pattern => pattern.test(originalContent))) {
    violations.push({
      type: 'EXTERNAL_LINK',
      description: 'External link detected',
      severity: 'MEDIUM',
    });
  }

  if (contactSharingPhrases.some(pattern => pattern.test(originalContent))) {
    violations.push({
      type: 'CONTACT_SHARING_PHRASE',
      description: 'Potential off-platform communication attempt',
      severity: 'LOW',
    });
  }

  if (violations.length > 0 && options.blockOnViolation) {
    return {
      isAllowed: false,
      violations,
    };
  }

  return {
    isAllowed: true,
    violations,
  };
}

export function getViolationMessage(violation: Violation): string {
  switch (violation.type) {
    case 'PHONE_NUMBER':
      return 'Sharing phone numbers is not allowed. All communication must go through the Chazon platform to protect both parties.';
    case 'EMAIL':
      return 'Sharing email addresses is not allowed. Please use the in-app chat for all communication.';
    case 'WHATSAPP':
      return 'Sharing WhatsApp contact information is not allowed. Please use the in-app chat for all communication.';
    case 'SOCIAL_MEDIA':
      return 'Sharing social media references is not allowed. All communication should stay on Chazon.';
    case 'EXTERNAL_LINK':
      return 'External links are not allowed in messages. Please keep all communication on Chazon.';
    case 'CONTACT_SHARING_PHRASE':
      return 'Please avoid phrases that suggest moving communication off-platform. For your safety, all communication should stay on Chazon.';
    default:
      return 'This message contains content that violates our communication guidelines.';
  }
}

export function getHighestSeverity(
  violations: Violation[]
): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (violations.some(v => v.severity === 'HIGH')) return 'HIGH';
  if (violations.some(v => v.severity === 'MEDIUM')) return 'MEDIUM';
  return 'LOW';
}
