import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-6">👨‍💼 Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
        <button
          onClick={() => navigate('/admin/waiter')}
          className="bg-blue-500 text-white py-4 px-6 rounded-2xl shadow-md text-lg font-semibold hover:bg-blue-600 transition"
        >
          🧑‍🍽️ Waiter Management
        </button>

        <button
          onClick={() => navigate('/admin/menu')}
          className="bg-green-500 text-white py-4 px-6 rounded-2xl shadow-md text-lg font-semibold hover:bg-green-600 transition"
        >
          🍽️ Menu Management
        </button>

        <button
          onClick={() => navigate('/admin/orders')}
          className="bg-purple-500 text-white py-4 px-6 rounded-2xl shadow-md text-lg font-semibold hover:bg-purple-600 transition"
        >
          📜 Order History
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
