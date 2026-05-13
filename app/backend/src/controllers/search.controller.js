/**
 * Vulnerabilities introduced here:
 *   Case 1 – NoSQL Injection       
 *   Case 2 – Reflected XSS         
 *   Case 3 – OS Command Injection   
 *   Case 4 – Path Traversal         
 */

import User from "../models/User.js";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

// CASE 1 — NoSQL Injection
// Passing req.query.username DIRECTLY into MongoDB find() means an
// attacker can send:  GET /api/search/users?username[$ne]=invalid
// This bypasses auth and returns ALL users in the database.
// Semgrep rule: javascript.express.security.audit.express-mongo-injection

export const searchUsers = async (req, res) => {
  try {
    // VULN: Unsanitized req.query fed directly into Mongoose query
    const users = await User.find({ fullName: req.query.username }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// CASE 2 — Reflected XSS (Cross-Site Scripting)

// If an attacker sends:
//   GET /api/search/xss?q=<script>alert(document.cookie)</script>
// The server echoes the raw unescaped input into an HTML response.

export const reflectedXss = (req, res) => {
  const query = req.query.q; // VULN: user input echoed with no escaping
  // VULN: res.send with raw HTML containing unsanitized user data
  res.send(`
    <html>
      <body>
        <h2>Search Results for: ${query}</h2>
        <p>No results found.</p>
      </body>
    </html>
  `);
};


// CASE 3 — OS Command Injection

// An attacker sends:  GET /api/search/ping?host=8.8.8.8;cat /etc/passwd
// The semicolon terminates the ping command and runs cat /etc/passwd.
//
// Semgrep rule: javascript.lang.security.audit.dangerous-exec-use

export const pingHost = (req, res) => {
  const host = req.query.host; // VULN: unsanitized input fed to shell

  // VULN: exec() with user-controlled string — command injection
  exec(`ping -c 3 ${host}`, (error, stdout, stderr) => {
    if (error) {
      // VULN: stack trace exposed to client (information disclosure)
      return res.status(500).json({ message: "Ping failed", error: error.message, stderr });
    }
    res.status(200).json({ output: stdout });
  });
};


// CASE 4 — Path Traversal

// An attacker sends:  GET /api/search/file?name=../../.env
// This reads arbitrary files on the server.
//
// Semgrep rule: javascript.lang.security.audit.path-traversal

export const readFile = (req, res) => {
  const filename = req.query.name; // VULN: no normalization or whitelist check
  const __dirname = path.resolve();

  // VULN: path.join does NOT prevent traversal if filename contains ../
  const filePath = path.join(__dirname, "uploads", filename);

  try {
    const content = fs.readFileSync(filePath, "utf8"); // VULN: sync I/O + traversal
    res.status(200).json({ content });
  } catch (err) {
    // VULN: reveals internal filesystem structure in error
    res.status(404).json({ message: "File not found", path: filePath });
  }
};
