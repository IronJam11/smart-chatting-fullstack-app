import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import axios from 'axios';

function Navbar() {
  const history = useHistory();

  const handleLogout = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/logout/', {}, {
        withCredentials: true
      });
      // Redirect to the login page after logout
      history.push('/login');
    } catch (err) {
      console.error('Error during logout:', err.message);
    }
  };

  return (
    <nav className="bg-gray-800 p-4 flex justify-between items-center">
      <div className="text-white text-2xl font-bold">
        <Link to="/" className="hover:text-gray-300">
          MyApp
        </Link>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
