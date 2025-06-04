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
  { id: 2, name: 'Pita Chicken Kebab', type: 'main' },
  { id: 3, name: 'Chicken Pita', type: 'main' },
  { id: 4, name: 'Beef Shawarma', type: 'main' },
  { id: 5, name: 'Cola', type: 'drink' },
  { id: 6, name: 'Ranskalaiset (Fries)', type: 'side' },
  { id: 7, name: 'Dip Curry', type: 'dip' },
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

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }

    const filtered = sampleFoodItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setSuggestions(filtered);
  }, [searchTerm]);

  const handleAddItem = (item) => {
    const note = notes[item.id] || '';
    const drink = item.type === 'main' ? selectedDrink : null;

    setOrderItems((prev) => [
      ...prev,
      {
        name: item.name,
        note,
        drink,
      },
    ]);
    setNotes((prev) => ({ ...prev, [item.id]: '' }));
    setSearchTerm('');
    setSuggestions([]);
  };

  const handleSendToKitchen = async () => {
    if (orderItems.length === 0) {
      alert('No items in the order.');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders`, {
        waiter: waiterName,
        customer: customerName,
        items: orderItems,
        status: 'NEW',
        paymentStatus: paymentStatus,
      });
      console.log('data is passing', response);

      alert(`Order #${orderId} sent to kitchen!`);
      setOrderItems([]);
      setCustomerName('');
      setPaymentStatus('UNPAID');
      setOrderId((prev) => prev + 1);
    } catch (error) {
      console.error('Failed to send order:', error);
      alert('Failed to send order. Try again.');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">🧾 Waiter Page</h1>

      <div className="mb-2 text-sm font-medium">👤 Select Waiter</div>
      <select
        value={waiterName}
        onChange={(e) => setWaiterName(e.target.value)}
        className="w-full mb-2 px-3 py-2 rounded border"
      >
        {waiterOptions.map((name, i) => (
          <option key={i} value={name}>
            {name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Customer Name (optional)"
        className="w-full mb-4 px-3 py-2 rounded border"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />

      <input
        type="text"
        placeholder="🔍 Search item"
        className="w-full px-3 py-2 rounded border"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {searchTerm.length > 0 && suggestions.length > 0 && (
        <div className="mt-4 space-y-2">
          {suggestions.map((item) => (
            <div key={item.id} className="bg-white border p-3 rounded shadow">
              <div className="font-semibold text-sm">{item.name}</div>
              <input
                type="text"
                placeholder="Add note..."
                className="mt-1 w-full px-2 py-1 border rounded text-sm"
                value={notes[item.id] || ''}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
              />
              {item.type === 'main' && (
                <select
                  value={selectedDrink}
                  onChange={(e) => setSelectedDrink(e.target.value)}
                  className="mt-2 w-full px-2 py-1 border rounded text-sm"
                >
                  {drinkOptions.map((drink, i) => (
                    <option key={i} value={drink}>
                      {drink}
                    </option>
                  ))}
                </select>
              )}
              <button
                onClick={() => handleAddItem(item)}
                className="mt-2 bg-blue-500 text-white w-full py-1 rounded text-sm"
              >
                ➕ Add
              </button>
            </div>
          ))}
        </div>
      )}

      {orderItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">
            🧾 Order #{orderId} Summary
          </h2>
          <ul className="mb-4 text-sm list-decimal list-inside">
            {orderItems.map((item, i) => (
              <li key={i} className="mb-1">
                {item.name} — note: {item.note || '(none)'}
                {item.drink ? `, drink: ${item.drink}` : ''}
              </li>
            ))}
          </ul>

          <div className="mb-4">
            <div className="font-medium mb-1">💰 Payment Status:</div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  value="UNPAID"
                  checked={paymentStatus === 'UNPAID'}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="accent-red-500"
                />
                Unpaid
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  value="PAID"
                  checked={paymentStatus === 'PAID'}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="accent-green-600"
                />
                Paid
              </label>
            </div>
          </div>

          <button
            onClick={handleSendToKitchen}
            className="bg-green-600 text-white w-full py-2 rounded text-base mt-2"
          >
            ✅ Send to Kitchen
          </button>
        </div>
      )}
    </div>
  );
};

export default WaiterPage;
