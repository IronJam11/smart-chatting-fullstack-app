// hooks/useAuth.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    console.log("Checking authentication status...");
    console.log("Token found:", token);

    if (token) {
      console.log("User is authenticated");
      setIsAuthenticated(true);
    } else {
      console.log("User is not authenticated");
      setIsAuthenticated(false);
      navigate('/loginpage'); // Redirect to login if not authenticated
    }
  }, [navigate]); // Added navigate as a dependency

  return isAuthenticated;
}
