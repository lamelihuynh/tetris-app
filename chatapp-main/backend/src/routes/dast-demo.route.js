/**
 * Vulnerabilities introduced here (detectable by OWASP ZAP):
 *   Case 1 – Open Redirect              
 *   Case 2 – CORS Misconfiguration      
 *   Case 3 – Missing Security Headers   
 *   Case 4 – Verbose Error Disclosure   
 */

import express from "express";

const router = express.Router();


// CASE 1 — Open Redirect

// An attacker crafts a phishing URL:
//   GET /api/dast/redirect?url=https://evil.example.com
// The app blindly redirects the user to any external site.
//
// ZAP Alert: "URL Redirection to Untrusted Site ('Open Redirect')" 

router.get("/redirect", (req, res) => {
  const url = req.query.url; // VULN: no allowlist validation on redirect target
  res.redirect(url);          // VULN: arbitrary open redirect
});


// CASE 2 — CORS Misconfiguration (wildcard + credentials)

// Setting Access-Control-Allow-Origin: * with credentials:true
// allows any website to make credentialed cross-origin requests,
// leaking session cookies.
//
// ZAP Alert: "Cross-Origin Resource Sharing Misconfiguration"

router.get("/cors-open", (req, res) => {
  // VULN: wildcard origin — any website can read this response
  res.header("Access-Control-Allow-Origin", "*");
  // VULN: credentials allowed with wildcard (browsers refuse this,
  //       but misconfigured backends still expose the intent)
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.json({ secret: "internal-data", userId: "12345", role: "admin" });
});


// CASE 3 — Missing Security Headers (Clickjacking, MIME sniffing)

// This endpoint deliberately omits all protective HTTP headers:
//   - X-Frame-Options         → allows clickjacking
//   - X-Content-Type-Options  → allows MIME sniffing
//   - Content-Security-Policy → no XSS policy
//   - Strict-Transport-Security → no HTTPS enforcement
//
// ZAP Alerts:
//   "X-Frame-Options Header Not Set"
//   "X-Content-Type-Options Header Missing"
//   "Content Security Policy (CSP) Header Not Set"
//

router.get("/no-headers", (req, res) => {
  // VULN: no helmet, no security headers whatsoever
  res.send(`
    <html>
      <body>
        <h1>Profile Page (no security headers)</h1>
        <iframe src="https://bank.example.com/transfer?to=attacker&amount=1000"></iframe>
      </body>
    </html>
  `);
});


// CASE 4 — Verbose Error Disclosure / Information Leakage

// The full stack trace, internal file paths, and environment data
// are exposed to the client on errors.
//
// ZAP Alert: "Application Error Disclosure"

router.get("/verbose-error", (req, res) => {
  try {
    // VULN: force an error to demonstrate stack trace disclosure
    const obj = null;
    obj.nonExistentMethod(); // This throws
  } catch (error) {
    // VULN: full stack trace, file paths, and process info sent to client
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
      stack: error.stack,                         // VULN: stack trace exposed
      environment: process.env,                   // VULN: ALL env vars exposed
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),                         // VULN: server filesystem path
    });
  }
});

export default router;
