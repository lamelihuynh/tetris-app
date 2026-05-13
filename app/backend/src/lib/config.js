/**
 * Secrets embedded here (detectable by Gitleaks / TruffleHog):
 *   Case 1 – AWS Access Key & Secret hardcoded in source
 *   Case 2 – Database password hardcoded in connection string
 *   Case 3 – RSA Private Key PEM block in source code
 *   Case 4 – JWT secret with low entropy hardcoded
 *   Case 5 – Third-party API key hardcoded (Stripe-like pattern)
 */


// CASE 1 — AWS Access Key & Secret

// Gitleaks rule: aws-access-token  (AKIA...)
// TruffleHog detector: AWSDetector
// OWASP: A02 – Cryptographic Failures / Secrets Exposure

export const AWS_CONFIG = {
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",                          // VULN: hardcoded AWS key ID
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", // VULN: hardcoded AWS secret
  region: "ap-southeast-1",
  accountId: "997961584240",
};


// CASE 2 — Database Password Hardcoded in Connection String

// Gitleaks rule: mongodb-connection-string
// OWASP: A02 – Cryptographic Failures

export const DB_CONFIG = {
  // VULN: credentials embedded directly in source code — visible in git history
  uri: "mongodb+srv://admin:SuperSecret_DB_Pass_2024!@cluster0.mongodb.net/chatapp_db",
  backup_uri: "postgresql://chatapp_user:BackupPassword123@db.internal:5432/chatapp",
  redis_url: "redis://:RedisAuth@redis.internal:6379/0",
};


// CASE 3 — RSA Private Key PEM Block

// Gitleaks rule: private-key
// TruffleHog detector: PrivateKeyDetector
// OWASP: A02 – Cryptographic Failures

export const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA2a2rwplBQLF29amygykEMmYz0+Kcj3bKBp29GMdvWNbq5MGz
zMYT/RKXGy00PqnRMEP6xTlZtGhG1EqVIPxZ5tyHSa7YgFJRPBSMuuXFGVP99rri
k2vJchHEXTiqtA0f0VHmqz9VkjHuJhU4OGqBCGcqRkBkr4dUsBa7z1YByMaJYAZW
lIQqCHH2KbXKgBMMCAPbqkIHmHPwn9adYQJSTGzAXgOGJbLzjVrqFNMEZvNSVBxU
8TJiRIiVBKfJCnc8KFpUdIbcxXnkEe3xrPB4rG3WsXtXfnmhR2bRWx7v3IHSLQxb
ZLDTlhFfz8C8JDwfKb5ypHhj7R6lGxvquwIDAQABAoIBAHRwY+KHLPM7hIL7VUDF
EXAMPLEPrivateKeyContentHereForDemoOnlyNotRealDoNotUseInProduction123
LSz6Aq3DZm2h3p7Cb+ySdVdJqRJXOHE+nZp5OU0H6VnhZF36m48pQ2JuRb5pHDl
-----END RSA PRIVATE KEY-----`;


// CASE 4 — Weak / Hardcoded JWT Secret

// Gitleaks rule: generic-api-key / jwt
// OWASP: A02 – Cryptographic Failures

export const JWT_CONFIG = {
  // VULN: low-entropy, hardcoded secret used to sign auth tokens
  secret: "myjwtsecret",               // VULN: same as in .env — easily guessable
  fallback_secret: "secret123",         // VULN: trivially brute-forceable
  expiresIn: "7d",
};


// CASE 5 — Third-party API Keys Hardcoded

// Gitleaks rule: stripe-api-token, sendgrid-api-token, etc.
// OWASP: A02 – Cryptographic Failures

export const THIRD_PARTY_KEYS = {
  stripe_secret: "sk_live_51ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuv", // VULN: Stripe live key
  sendgrid_key: "SG.EXAMPLEKeyHere.aB3dEfGhIjKlMnOpQrStUvWxYz0123456789ABCDE", // VULN: SendGrid key
  slack_webhook: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX", // VULN: Slack webhook
  google_api_key: "AIzaSyDTwtEsmU1AIyWb2D9Og_vojcJxJ3DqsPA",                    // VULN: Same as .env Gemini key
};
