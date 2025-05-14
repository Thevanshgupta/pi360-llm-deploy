import React, { useState } from 'react';
import Chatbot from './Chatbot';
import Login from './Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem('authToken');
    return !!token; // Convert to boolean
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (username, password) => {
    setError(null);
    setIsLoading(true);

    if (!username || !password) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        'https://pi360.net/site/api/api_login_user.php?institute_id=mietjammu',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username_1: username,
            password_1: password,
          }),
        }
      );

      const data = await response.json();
      console.log('API Response:', data);

      if (response.status === 200 && data.message === "Login successful") {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify({
          accountType: data.accountType,
          firstLogin: data.first_login
        }));
        setIsLoggedIn(true);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please try again.');
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App container">
      {!isLoggedIn ? (
        <div className="auth-container">
          <Login onLogin={handleLogin} />
          {error && <div className="alert alert-danger">{error}</div>}
        </div>
      ) : (
        <>
          <header className="App-header">
            <h1>Chat-Pi360 | Beta</h1>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </header>
          <p className="disclaimer">
            Chat Pi360 is a LLM prototype trained on limited student data.
          </p>
          <Chatbot />
        </>
      )}
    </div>
  );
}

export default App;