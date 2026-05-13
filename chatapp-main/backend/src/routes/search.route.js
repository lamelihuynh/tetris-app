/**
 * Routes wiring for intentionally vulnerable SAST endpoints.
 * See search.controller.js for vulnerability details.
 */

import express from "express";
import {
  searchUsers,
  reflectedXss,
  pingHost,
  readFile,
} from "../controllers/search.controller.js";

const router = express.Router();

// Case 1 — NoSQL Injection: GET /api/search/users?username[$ne]=x
router.get("/users", searchUsers);

// Case 2 — Reflected XSS: GET /api/search/xss?q=<script>alert(1)</script>
router.get("/xss", reflectedXss);

// Case 3 — Command Injection: GET /api/search/ping?host=127.0.0.1;id
router.get("/ping", pingHost);

// Case 4 — Path Traversal: GET /api/search/file?name=../../.env
router.get("/file", readFile);

export default router;
