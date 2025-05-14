export const isAuthenticated = () => {
    return localStorage.getItem('authToken') !== null;
  };
  
  export const getUserData = () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  };
  
  export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };