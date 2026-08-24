/**
 * Real-time Email Validation & Spam/Disposable Analysis Module
 */

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "sharklasers.com",
  "dispostable.com",
  "getnada.com",
  "throwawaymail.com",
  "fakemailgenerator.com",
  "maildrop.cc",
  "crazymailing.com",
  "boun.cr",
  "byom.de",
  "burnermail.io",
  "10minute-email.com",
  "tempmailo.com",
  "mohmal.com",
  "mytemp.email",
  "tempmailaddress.com",
  "dayrep.com",
  "teleworm.us",
  "armyspy.com",
  "rhyta.com",
  "trashmail.net",
  "inboxalias.com",
  "generator.email",
]);

const DOMAIN_TYPOS: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmal.com": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotamail.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.co": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahou.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "iclou.com": "icloud.com",
  "icloud.co": "icloud.com",
};

export interface EmailAnalysis {
  isValid: boolean;
  isDisposable: boolean;
  suggestion?: string;
  reason?: string;
  status: "idle" | "valid" | "invalid" | "disposable" | "typo";
  message?: string;
}

export function analyzeEmail(email: string): EmailAnalysis {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      isValid: false,
      isDisposable: false,
      status: "idle",
    };
  }

  // 1. Basic RFC Syntax Regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      isDisposable: false,
      status: "invalid",
      reason: "Invalid format",
      message: "Please enter a valid email address (e.g. name@example.com)",
    };
  }

  const parts = cleanEmail.split("@");
  if (parts.length !== 2) {
    return {
      isValid: false,
      isDisposable: false,
      status: "invalid",
      reason: "Invalid format",
      message: "Email must contain a single '@' symbol",
    };
  }

  const [username, domain] = parts;

  if (!username || username.length < 1) {
    return {
      isValid: false,
      isDisposable: false,
      status: "invalid",
      reason: "Missing username",
      message: "Email username is missing",
    };
  }

  if (!domain || !domain.includes(".")) {
    return {
      isValid: false,
      isDisposable: false,
      status: "invalid",
      reason: "Invalid domain",
      message: "Email domain is incomplete",
    };
  }

  // 2. Check for disposable / temp spam emails
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      isDisposable: true,
      status: "disposable",
      reason: "Disposable email forbidden",
      message: "Temporary or disposable emails are not allowed for account security",
    };
  }

  // 3. Check for domain typos
  if (DOMAIN_TYPOS[domain]) {
    const suggestedDomain = DOMAIN_TYPOS[domain];
    const suggestion = `${username}@${suggestedDomain}`;
    return {
      isValid: true,
      isDisposable: false,
      suggestion,
      status: "typo",
      reason: "Possible typo detected",
      message: `Did you mean ${suggestion}?`,
    };
  }

  // 4. Clean & Valid Email
  return {
    isValid: true,
    isDisposable: false,
    status: "valid",
    message: "Valid email address",
  };
}
