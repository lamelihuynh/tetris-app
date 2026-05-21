// ============================================
// DATABASE API - Backend (Node.js)
// ============================================

const mysql = require('mysql');
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password123',  // ← DETECTED: hardcoded password
    database: 'tetris'
});

// SQL Injection - SonarQube S2077 DETECT
const getUserData = (userId) => {
    conn.query('SELECT * FROM users WHERE id = ' + userId, (err, res) => {
        return res;
    });
};

// SQL Injection - DETECTED
const searchUsers = (username) => {
    conn.query(`SELECT * FROM users WHERE username = '${username}'`, (err, res) => {
        return res;
    });
};

// eval() - DETECTED
const executeCode = (code) => {
    eval(code);
};

module.exports = { getUserData, searchUsers, executeCode };