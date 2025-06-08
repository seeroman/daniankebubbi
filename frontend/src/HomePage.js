// src/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    const password = prompt("Enter admin password:");
    const correctPassword = "202425"; // 🔐 Replace with your desired password

    if (password === correctPassword) {
      navigate('/admin');
    } else if (password !== null) {
      alert("Incorrect password.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Danian Kebab</h1>
      <div className="space-x-4">
        <button
          onClick={() => navigate('/waiter')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Waiter
        </button>
        <button
          onClick={() => navigate('/kitchen')}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Kitchen
        </button>
        <button
          onClick={handleAdminClick}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Admin
        </button>
      </div>
    </div>
  );
}

export default HomePage;
