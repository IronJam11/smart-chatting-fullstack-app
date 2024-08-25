// LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/login/', {
        email,
        password,
      });
      const token = response.data.jwt;
      const currEmail = response.data.email;
      const enrollmentNo = response.data.enrollmentNo;
    //   const email = response.data.email;
      console.log('token123',token);
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('email',currEmail) // Store the token
      localStorage.setItem('enrollmentNo',enrollmentNo)
      console.log(localStorage);
      console.log('Login Successful:', response.data);
      navigate('/homepage'); // Redirect to homepage
    } catch (error) {
      console.error('Error during login:', error);
      // Handle error (e.g., show error message)
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken'); // Clear the token
    navigate('/loginpage'); // Redirect to login page
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center container mx-auto">
          <h1 className="text-xl font-bold">CHATTIE</h1>
          <button className="px-4 py-2 bg-white text-blue-600 rounded-md hover:bg-gray-200" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Login Form */}
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 pt-8">
        <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-lg">
          <h1 className="text-2xl font-bold text-center text-gray-800">Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
