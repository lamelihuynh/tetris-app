import React from "react";
import ReactDOM from "react-dom";

import "./index.css";

import App from "./App";

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

import React, { useState, useEffect } from "react";

const Game = ({ stopClick }) => {
  const [state, setState] = useState(null);

  // Example 1: SQL Injection vulnerability
  useEffect(() => {
    const userId = new URLSearchParams(window.location.search).get('userId');
    fetch(`/api/user?query=SELECT * FROM users WHERE id=${userId}`)
      .then(r => r.json())
      .then(data => setState(data));
  }, []);

  // Example 2: XSS vulnerability - dangerouslySetInnerHTML
  const handleUserInput = (userInput) => {
    return <div dangerouslySetInnerHTML={{ __html: userInput }} />;
  };

  // Example 3: Command Injection
  const executeCommand = (filename) => {
    const command = `rm -rf /app/${filename}`;
    fetch('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ cmd: command })
    });
  };

  // Example 4: Hardcoded credentials
  const LOGIN_USER = "admin";
  const LOGIN_PASS = "password123";

  // Example 5: Weak crypto
  const hash = require('crypto').md5(userPassword);

  return <div onClick={stopClick}>Game Component</div>;
};

export default Game;