import React, { useState } from 'react'; 
import './Login.css'; // We'll create this CSS file next

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you'll call your login API later
    onLogin(username, password);
  };

  return (
    <div className="login-container">
      {/* Image at the top */}
      <div className="login-image">
        <img src="https://www.mycamu.co.in/camu_attachment/get/615fe6391cecafe3895769d1" alt="Login Banner" />
      </div>

      <div className="login-header">
        <h2>MODEL INSTITUTE OF ENGINEERING & TECHNOLOGY</h2>
        <h3>(AUTONOMOUS)</h3>
      </div>
      
      
      <div className="login-box">
        <h4>Login to ChatPi360</h4>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">User name</label>
            <input
              type="text"
              id="username"
              placeholder="Registered email id"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="forgot-password">
            <a href="/forgot-password">Forgot password?</a>
          </div>
          
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
