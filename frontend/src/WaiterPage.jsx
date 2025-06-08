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

// const drinkOptions = [
//   'Cola',
//   'Cola sokeriton',
//   'Appelsiini',
//   'Appelsiini sokeriton',
//   'Sitrus',
//   'Sitrus sokeriton',
//   'Trip mehu',
// ];

const waiterOptions = ['Roman', 'Rahad', 'Zaid', 'Hassan'];

const noteSuggestions = [
  // Spice levels
  { text: 'spicy', triggers: ['spi', 'hot'] },
  { text: 'mild spicy', triggers: ['mild', 'medium'] },
  { text: 'extra spicy', triggers: ['ext', 'very'] },

  // Common ingredients with both "no" and "extra" variations
  { text: 'no onion', triggers: ['no oni', 'onion', 'without onion'] },
  { text: 'extra onion', triggers: ['ext oni', 'more onion', 'add onion'] },
  { text: 'no tomato', triggers: ['no tom', 'tomato', 'without tomato'] },
  { text: 'extra tomato', triggers: ['ext tom', 'more tomato', 'add tomato'] },
  { text: 'no salad', triggers: ['no sal', 'salad', 'without salad'] },
  { text: 'extra salad', triggers: ['ext sal', 'more salad', 'add salad'] },
  { text: 'no garlic', triggers: ['no gar', 'garlic', 'without garlic'] },
  { text: 'extra garlic', triggers: ['ext gar', 'more garlic', 'add garlic'] },
  { text: 'no cheese', triggers: ['no che', 'cheese', 'without cheese'] },
  { text: 'extra cheese', triggers: ['ext che', 'more cheese', 'add cheese'] },
  { text: 'no cucumber', triggers: ['no cuc', 'cucumber', 'without cucumber'] },
  {
    text: 'extra cucumber',
    triggers: ['ext cuc', 'more cucumber', 'add cucumber'],
  },
  { text: 'no olives', triggers: ['no oli', 'olives', 'without olives'] },
  { text: 'extra olives', triggers: ['ext oli', 'more olives', 'add olives'] },
  { text: 'no pickle', triggers: ['no pic', 'pickle', 'without pickle'] },
  { text: 'extra pickle', triggers: ['ext pic', 'more pickle', 'add pickle'] },
  { text: 'no lettuce', triggers: ['no let', 'lettuce', 'without lettuce'] },
  {
    text: 'extra lettuce',
    triggers: ['ext let', 'more lettuce', 'add lettuce'],
  },

  // Sauces and condiments
  { text: 'no sauce', triggers: ['no sau', 'sauce', 'without sauce'] },
  { text: 'extra sauce', triggers: ['ext sau', 'more sauce', 'add sauce'] },
  { text: 'less sauce', triggers: ['les sau', 'little sauce'] },
  { text: 'no mayo', triggers: ['no may', 'mayo', 'without mayo'] },
  { text: 'extra mayo', triggers: ['ext may', 'more mayo', 'add mayo'] },
  { text: 'no ketchup', triggers: ['no ket', 'ketchup', 'without ketchup'] },
  {
    text: 'extra ketchup',
    triggers: ['ext ket', 'more ketchup', 'add ketchup'],
  },
  { text: 'no mustard', triggers: ['no mus', 'mustard', 'without mustard'] },
  {
    text: 'extra mustard',
    triggers: ['ext mus', 'more mustard', 'add mustard'],
  },
  { text: 'no chili', triggers: ['no chi', 'chili', 'without chili'] },
  { text: 'extra chili', triggers: ['ext chi', 'more chili', 'add chili'] },

  // Preparation styles

  { text: 'cut in half', triggers: ['cut', 'half', 'split'] },
  { text: 'Sauce Separately', triggers: ['sepa', 'separately', 'sauce'] },

  // Other common requests
  { text: 'no salt', triggers: ['no sal', 'salt', 'without salt'] },
  { text: 'less salt', triggers: ['les sal', 'little salt'] },
  { text: 'no pepper', triggers: ['no pep', 'pepper', 'without pepper'] },
  { text: 'extra pepper', triggers: ['ext pep', 'more pepper', 'add pepper'] },
  { text: 'no fries', triggers: ['no fri', 'fries', 'without fries'] },
  { text: 'extra fries', triggers: ['ext fri', 'more fries', 'add fries'] },
  { text: 'no bread', triggers: ['no bre', 'bread', 'without bread'] },
  { text: 'extra bread', triggers: ['ext bre', 'more bread', 'add bread'] },
  { text: 'no utensils', triggers: ['no uten', 'utensils'] },
  { text: 'extra napkins', triggers: ['ext nap', 'napkins'] },
];

const NoteInputWithSuggestions = ({ value, onChange, itemId }) => {
  const [activeSuggestions, setActiveSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleNoteChange = (e) => {
    const input = e.target.value;
    onChange(e);

    // Split by commas to handle multiple notes
    const parts = input.split(',');
    const lastPart = parts[parts.length - 1].trim().toLowerCase();

    if (lastPart.length > 1) {
      const matched = noteSuggestions.filter((suggestion) => {
        // Check if any trigger matches
        const hasTriggerMatch = suggestion.triggers.some((trigger) =>
          lastPart.includes(trigger.toLowerCase()),
        );

        // Also check if the suggestion text itself matches
        const hasTextMatch = suggestion.text.toLowerCase().includes(lastPart);

        return hasTriggerMatch || hasTextMatch;
      });

      setActiveSuggestions(matched);
      setShowSuggestions(matched.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    let newValue;
    if (value.includes(',')) {
      const parts = value.split(',');
      parts[parts.length - 1] = ` ${suggestion}`;
      newValue = parts.join(',');
    } else {
      newValue = suggestion;
    }
    onChange({ target: { value: newValue } });
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Add note..."
        className="mt-1 w-full px-2 py-1 border rounded text-sm"
        value={value}
        onChange={handleNoteChange}
        onFocus={() => value.length > 1 && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      {showSuggestions && activeSuggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          {activeSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSuggestionClick(suggestion.text)}
            >
              {suggestion.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WaiterPage = () => {
  const [waiterName, setWaiterName] = useState(waiterOptions[0]);
  const [customerName, setCustomerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState({});
  // const [selectedDrink, setSelectedDrink] = useState(drinkOptions[0]);
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

    const lastOrderId = localStorage.getItem('lastOrderId');
    if (lastOrderId) {
      setOrderId(parseInt(lastOrderId) + 1);
    }
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedOrders', JSON.stringify(savedOrders));
  }, [savedOrders]);

  // Save order ID to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('lastOrderId', orderId.toString());
  }, [orderId]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }

    const lowerSearch = searchTerm.toLowerCase();
    const filtered = sampleFoodItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerSearch) ||
        item.id.toString().includes(lowerSearch),
    );

    setSuggestions(filtered);
  }, [searchTerm]);

  const handleAddItem = (item) => {
    const note = notes[item.id] || '';
    // const drink = item.type === 'main' ? selectedDrink : null;

    setOrderItems((prev) => [
      ...prev,
      {
        id: Date.now(), // Unique ID for each item
        name: item.name,
        note,
        originalItemId: item.id, // Keep reference to original item
      },
    ]);
    setNotes((prev) => ({ ...prev, [item.id]: '' }));
    setSearchTerm('');
    setSuggestions([]);
  };

  const handleRemoveItem = (id) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      note: item.note || '',
      drink: item.drink || '',
    });
  };

  const handleSaveEdit = () => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.id === editingItem.id ? { ...item, ...editForm } : item,
      ),
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

    setSavedOrders((prev) => [newSavedOrder, ...prev]);
    setOrderItems([]);
    setCustomerName('');
    setPaymentStatus('UNPAID');

    setToast({
      show: true,
      message: '✅ Order saved for later',
      type: 'success',
    });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
  };

  const handleLoadSavedOrder = (order) => {
    setOrderItems(order.items);
    setCustomerName(order.customer);
    setPaymentStatus(order.paymentStatus);
    setWaiterName(order.waiter);

    setSavedOrders((prev) => prev.filter((o) => o.id !== order.id));
  };

  const handleDeleteSavedOrder = (orderId) => {
    setSavedOrders((prev) => prev.filter((o) => o.id !== orderId));
    setToast({ show: true, message: '🗑️ Order deleted', type: 'success' });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
  };

  const handleSendToKitchen = async () => {
    if (orderItems.length === 0) {
      setToast({
        show: true,
        message: '❌ No items in the order',
        type: 'error',
      });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
      return;
    }

    setIsConfirming(true);
  };

  const confirmSendToKitchen = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/orders`, {
        waiter: waiterName,
        customer: customerName,
        items: orderItems,
        status: 'NEW',
        paymentStatus: paymentStatus,
      });

      setToast({
        show: true,
        message: `✅ Order #${orderId} sent to kitchen!`,
        type: 'success',
      });
      setOrderItems([]);
      setCustomerName('');
      setPaymentStatus('UNPAID');
      setOrderId((prev) => prev + 1);
      setIsConfirming(false);

      setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
    } catch (error) {
      setToast({
        show: true,
        message: '❌ Failed to send order. Try again.',
        type: 'error',
      });
      setIsConfirming(false);
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 2500);
    }
  };

  const cancelSendToKitchen = () => {
    setIsConfirming(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">🧾 Waiter Page</h1>

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-4 left-4 px-4 py-2 rounded shadow-md text-white ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Waiter Selection */}
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

      {/* Customer Name */}
      <input
        type="text"
        placeholder="Customer Name (optional)"
        className="w-full mb-4 px-3 py-2 rounded border"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
      />

      {/* Item Search */}
      <input
        type="text"
        placeholder="🔍 Search item"
        className="w-full px-3 py-2 rounded border"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Search Suggestions */}
      {searchTerm.length > 0 && suggestions.length > 0 && (
        <div className="mt-4 space-y-2">
          {suggestions.map((item) => (
            <div key={item.id} className="bg-white border p-3 rounded shadow">
              <div className="font-semibold text-sm">
                [{item.id}] {item.name}
              </div>
              <NoteInputWithSuggestions
                value={notes[item.id] || ''}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                itemId={item.id}
              />

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

      {/* Current Order */}
      {orderItems.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">🛒 Current Order</h2>
          <ul className="space-y-2 mb-4">
            {orderItems.map((item) => (
              <li
                key={item.id}
                className="p-2 border rounded bg-white shadow-sm text-sm relative"
              >
                <div className="absolute top-1 right-1 flex space-x-3">
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
                <div>
                  <strong>{item.name}</strong>
                </div>
                {item.note && (
                  <div className="text-gray-600">📝 {item.note}</div>
                )}
                {item.drink && (
                  <div className="text-gray-600">🥤 {item.drink}</div>
                )}
              </li>
            ))}
          </ul>

          {/* Payment Status */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              💰 Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="PAID">PAID</option>
              <option value="UNPAID">UNPAID</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 mt-4">
            <button
              onClick={handleHoldOrder}
              className="flex-1 bg-yellow-500 text-white py-2 rounded font-medium"
            >
              💾 Hold Order
            </button>
            <button
              onClick={handleSendToKitchen}
              className="flex-1 bg-green-600 text-white py-2 rounded font-medium"
            >
              🚀 Send to Kitchen
            </button>
          </div>
        </div>
      )}

      {/* Saved Orders Section */}
      {savedOrders.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">📦 Saved Orders</h2>
          <div className="space-y-2">
            {savedOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 border rounded bg-white shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{order.customer}</div>
                    <div className="text-sm text-gray-600">
                      {order.timestamp}
                    </div>
                    <div className="text-sm">{order.items.length} items</div>
                    <div className="text-sm">Status: {order.paymentStatus}</div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleLoadSavedOrder(order)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteSavedOrder(order.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Edit Item</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Item Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Note</label>
              <NoteInputWithSuggestions
                value={editForm.note}
                onChange={(e) =>
                  setEditForm({ ...editForm, note: e.target.value })
                }
                itemId={editingItem.id}
              />
            </div>

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

      {/* Confirmation Modal */}
      {isConfirming && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Order</h3>
            <p className="mb-4">
              Are you sure you want to send this order to the kitchen?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={cancelSendToKitchen}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmSendToKitchen}
                className="flex-1 bg-green-600 text-white py-2 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterPage;
