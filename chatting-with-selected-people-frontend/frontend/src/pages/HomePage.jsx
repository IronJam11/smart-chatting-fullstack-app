import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth'; 
// Make sure to use your authentication hook or user hook to get the current user's email

function HomePage() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const isAuthenticated = useAuth(); // Check authentication status
  
  // Example: assuming your useAuth hook returns an object with user info
  const currentUserEmail = localStorage.getItem('email'); // Modify this according to your auth setupco
  const enrollmentNo = localStorage.getItem('enrollmentNo');
  useEffect(() => {
    if (!isAuthenticated) {
      return; // If not authenticated, do not fetch data
    }

    // Fetch user details from the API when the component mounts
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/all-users/', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}` // Pass the token in the request header
          }
        });
        setUsers(response.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [isAuthenticated, navigate]);
  const handleUserClick = (userEnrollmentNo) => {
    if (enrollmentNo) {
      navigate(`/${enrollmentNo}/${userEnrollmentNo}`);
    }
  };

  return isAuthenticated ? ( // Render only if authenticated
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <h1 className="text-4xl font-extrabold mb-8 text-blue-900">Choose to chat with one of the given users</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => handleUserClick(user.enrollmentNo)}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md transform transition duration-300 hover:bg-blue-700 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            {user.email}
          </button>
        ))}
      </div>
    </div>
  ) : null; // Do not render anything if not authenticated
}

export default HomePage;
