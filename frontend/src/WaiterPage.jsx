import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'https://daniankebubbi.onrender.com';

if (!API_BASE_URL) {
  console.warn(
    '⚠️ REACT_APP_API_BASE_URL is not defined. Check your .env file.',
  );
}

const sampleFoodItems = [
  { id: 1, name: 'Pita Kebab', type: 'main' },
  { id: 2, name: 'Pita Kebab Aurajuusto', type: 'main' },
  { id: 3, name: 'Pita Kebab Jalopeno', type: 'main' },
  { id: 4, name: 'Pita Kebab Valkosipulikastike', type: 'main' },
  { id: 5, name: 'Rulla Kebab', type: 'main' },
  { id: 6, name: 'Rulla Kebab Aurajuusto', type: 'main' },
  { id: 7, name: 'Rulla Kebab Jalopeno', type: 'main' },
  { id: 8, name: 'Rulla Kebab Valkosipulikastike', type: 'main' },
  { id: 9, name: 'Kebab Ranskalaiset', type: 'main' },
  { id: 10, name: 'Kebab Ranskalaiset Aurajuusto', type: 'main' },
  { id: 11, name: 'Kebab Ranskalaiset Jalopeno', type: 'main' },
  { id: 12, name: 'Kebab Ranskalaiset Valkosipulikastike', type: 'main' },
  { id: 13, name: 'Iskender Kebab', type: 'main' },
  { id: 14, name: 'Iskender Kebab Aurajuusto', type: 'main' },
  { id: 15, name: 'Iskender Kebab Jalopeno', type: 'main' },
  { id: 16, name: 'Iskender Kebab Valkosipulikastike', type: 'main' },
  { id: 17, name: 'Pita Kana', type: 'main' },
  { id: 18, name: 'Pita Kana Aurajuusto', type: 'main' },
  { id: 19, name: 'Pita Kana Jalopeno', type: 'main' },
  { id: 20, name: 'Pita Kana Valkosipulikastike', type: 'main' },
  { id: 21, name: 'Rulla Kana', type: 'main' },
  { id: 22, name: 'Rulla Kana Aurajuusto', type: 'main' },
  { id: 23, name: 'Rulla Kana Jalopeno', type: 'main' },
  { id: 24, name: 'Rulla Kana Valkosipulikastike', type: 'main' },
  { id: 25, name: 'Kana Ranskalaiset', type: 'main' },
  { id: 26, name: 'Kana Ranskalaiset Aurajuusto', type: 'main' },
  { id: 27, name: 'Kana Ranskalaiset Jalopeno', type: 'main' },
  { id: 28, name: 'Kana Ranskalaiset Valkosipulikastike', type: 'main' },
  { id: 29, name: 'Iskender Kana', type: 'main' },
  { id: 30, name: 'Iskender Kana Aurajuusto', type: 'main' },
  { id: 31, name: 'Iskender Kana Jalopeno', type: 'main' },
  { id: 32, name: 'Iskender Kana Valkosipulikastike', type: 'main' },
  { id: 33, name: 'Cola', type: 'drink' },
  { id: 34, name: 'Cola sokeriton', type: 'drink' },
  { id: 35, name: 'Appelsiini', type: 'drink' },
  { id: 36, name: 'Appelsiini sokeriton', type: 'drink' },
  { id: 37, name: 'Sitrus', type: 'drink' },
  { id: 38, name: 'Sitrus sokeriton', type: 'drink' },
  { id: 39, name: 'Trip mehu', type: 'drink' },
  { id: 40, name: 'Ranskalaiset (Fries)', type: 'side' },
  { id: 41, name: 'Tsatsiki', type: 'dip' },
  { id: 42, name: 'Currymajoneesi', type: 'dip' },
  { id: 43, name: 'Tulinen jugurttimajoneesi/Hot Yogurt Mayo ', type: 'dip' },
];

const drinkOptions = [
  'Cola',
  'Cola sokeriton',
  'Appelsiini',
  'Appelsiini sokeriton',
  'Sitrus',
  'Sitrus sokeriton',
  'Trip mehu',
];

const waiterOptions = ['Roman', 'Rahad', 'Zaid', 'Hassan'];

const WaiterPage = () => {
  const [waiterName, setWaiterName] = useState(waiterOptions[0]);
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState({});
  const [selectedDrink, setSelectedDrink] = useState(drinkOptions[0]);
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [orderId, setOrderId] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [savedOrders, setSavedOrders] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', note: '', drink: '' });

  // Load saved orders from localStorage on component mount
  useEffect(() => {
    const loadedOrders = localStorage.getItem('savedOrders');
    if (loadedOrders) {
      setSavedOrders(JSON.parse(loadedOrders));
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedOrders', JSON.stringify(savedOrders));
  }, [savedOrders]);

  // ... (keep your existing useEffect for search suggestions)

  const handleAddItem = (item) => {
    const note = notes[item.id] || '';
    const drink = item.type === 'main' ? selectedDrink : null;

    setOrderItems((prev) => [
      ...prev,
      {
        id: Date.now(), // Unique ID for each item
        name: item.name,
        note,
        drink,
        originalItemId: item.id // Keep reference to original item
      },
    ]);
    setNotes((prev) => ({ ...prev, [item.id]: '' }));
    setSearchTerm('');
    setSuggestions([]);
  };

  const handleRemoveItem = (id) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      note: item.note || '',
      drink: item.drink || ''
    });
  };

  const handleSaveEdit = () => {
    setOrderItems(prev =>
      prev.map(item =>
        item.id === editingItem.id
          ? { ...item, ...editForm }
          : item
      )
    );
    setEditingItem(null);
  };

  const handleHoldOrder = () => {
    if (orderItems.length === 0) {
      setToast({ show: true, message: '❌ No items to save', type: 'error' });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
      return;
    }

    const newSavedOrder = {
      id: Date.now(),
      customer: customerName || 'No name',
      items: [...orderItems],
      paymentStatus,
      waiter: waiterName,
      timestamp: new Date().toLocaleTimeString(),
    };

    setSavedOrders(prev => [newSavedOrder, ...prev]);
    setOrderItems([]);
    setCustomerName('');
    setPaymentStatus('UNPAID');

    setToast({ show: true, message: '✅ Order saved for later', type: 'success' });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
  };

  // ... (keep your existing handleLoadSavedOrder, handleSendToKitchen, confirmSendToKitchen functions)

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 min-h-screen">
      {/* ... (keep your existing header, toast, waiter selection, customer name input) */}

      {/* Current Order Items with Edit Buttons */}
      {orderItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">🛒 Current Order</h2>
          <ul className="space-y-2 mb-4">
            {orderItems.map((item) => (
              <li key={item.id} className="p-2 border rounded bg-white shadow-sm text-sm relative">
                <div className="absolute top-1 right-1 flex space-x-1">
                  <button 
                    onClick={() => handleEditItem(item)}
                    className="text-blue-500 font-bold"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 font-bold"
                  >
                    ×
                  </button>
                </div>
                <div><strong>{item.name}</strong></div>
                {item.note && <div className="text-gray-600">📝 {item.note}</div>}
                {item.drink && <div className="text-gray-600">🥤 {item.drink}</div>}
              </li>
            ))}
          </ul>

          {/* ... (rest of your component remains the same) */}
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Edit Item</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Item Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Note</label>
              <input
                type="text"
                value={editForm.note}
                onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            {editingItem.drink !== null && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Drink</label>
                <select
                  value={editForm.drink}
                  onChange={(e) => setEditForm({...editForm, drink: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  {drinkOptions.map((drink, i) => (
                    <option key={i} value={drink}>
                      {drink}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-blue-500 text-white py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ... (rest of your component remains the same) */}
    </div>
  );
};

export default WaiterPage;
