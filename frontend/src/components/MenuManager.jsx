// MenuManagement.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState('');

  const fetchMenu = async () => {
    const res = await axios.get('/api/menu');
    setMenuItems(res.data);
  };

  const addMenuItem = async () => {
    if (!newItem.trim()) return;
    await axios.post('http://localhost:5000/api/menu', { name: newItem });
    setNewItem('');
    fetchMenu();
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">🍽️ Menu Management</h1>
      <input
        type="text"
        placeholder="New food item"
        className="w-full mb-2 px-3 py-2 rounded border"
        value={newItem}
        onChange={(e) => setNewItem(e.target.value)}
      />
      <button
        onClick={addMenuItem}
        className="bg-blue-500 text-white w-full py-2 rounded mb-4"
      >
        ➕ Add Item
      </button>

      <ul className="text-sm">
        {menuItems.map((item) => (
          <li key={item.id} className="mb-1">
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MenuManagement;
