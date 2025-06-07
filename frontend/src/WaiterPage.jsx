import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://daniankebubbi.onrender.com';

// ... (keep your existing sampleFoodItems and drinkOptions arrays)

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
  const [drafts, setDrafts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  // ... (keep your existing useEffect for suggestions)

  const handleAddItem = (item) => {
    const note = notes[item.id] || '';
    const drink = item.type === 'main' ? selectedDrink : null;

    if (editingIndex !== null) {
      // Edit existing item
      const updatedItems = [...orderItems];
      updatedItems[editingIndex] = {
        name: item.name,
        note,
        drink,
      };
      setOrderItems(updatedItems);
      setEditingIndex(null);
    } else {
      // Add new item
      setOrderItems((prev) => [
        ...prev,
        {
          name: item.name,
          note,
          drink,
        },
      ]);
    }

    setNotes((prev) => ({ ...prev, [item.id]: '' }));
    setSearchTerm('');
    setSuggestions([]);
  };

  const handleEditItem = (index) => {
    const item = orderItems[index];
    setSearchTerm(item.name);
    setNotes({ [item.id || index]: item.note });
    if (item.drink) setSelectedDrink(item.drink);
    setEditingIndex(index);
  };

  const handleRemoveItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSaveDraft = () => {
    if (orderItems.length === 0) {
      setToast({
        show: true,
        message: '❌ No items to save as draft',
        type: 'error',
      });
      return;
    }

    const newDraft = {
      id: Date.now(),
      waiter: waiterName,
      customer: customerName,
      items: [...orderItems],
      paymentStatus,
      createdAt: new Date().toLocaleTimeString(),
    };

    setDrafts([...drafts, newDraft]);
    setToast({
      show: true,
      message: '✅ Draft saved successfully',
      type: 'success',
    });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 2000);
  };

  const handleLoadDraft = (draft) => {
    if (orderItems.length > 0 && !window.confirm('This will replace current order. Continue?')) {
      return;
    }
    setOrderItems(draft.items);
    setCustomerName(draft.customer);
    setPaymentStatus(draft.paymentStatus);
    setWaiterName(draft.waiter);
  };

  const handleClearOrder = () => {
    if (orderItems.length === 0) return;
    
    if (window.confirm('Are you sure you want to clear the current order?')) {
      setOrderItems([]);
      setCustomerName('');
      setToast({
        show: true,
        message: '🔄 Order cleared',
        type: 'info',
      });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 2000);
    }
  };

  const handleSendToKitchen = async () => {
    if (orderItems.length === 0) {
      setToast({
        show: true,
        message: '❌ No items in the order',
        type: 'error',
      });
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

      setToast({
        show: true,
        message: `✅ Order #${orderId} sent to kitchen!`,
        type: 'success',
      });

      setOrderItems([]);
      setCustomerName('');
      setPaymentStatus('UNPAID');
      setOrderId((prev) => prev + 1);

      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    } catch (error) {
      setToast({
        show: true,
        message: '❌ Failed to send order. Try again.',
        type: 'error',
      });
      setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">🧾 Waiter Page</h1>

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-md text-white ${
            toast.type === 'success'
              ? 'bg-green-500'
              : toast.type === 'error'
              ? 'bg-red-500'
              : 'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Order Info Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
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
      </div>

      {/* Search & Add Items */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
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
              <div key={item.id} className="bg-gray-50 border p-3 rounded">
                <div className="font-semibold text-sm">
                  [{item.id}] {item.name}
                </div>
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
                  {editingIndex !== null ? '💾 Update' : '➕ Add'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Preview */}
      {orderItems.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">🛒 Current Order</h2>
            <div className="flex gap-2">
              <button
                onClick={handleSaveDraft}
                className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
              >
                Save Draft
              </button>
              <button
                onClick={handleClearOrder}
                className="bg-gray-500 text-white px-2 py-1 rounded text-xs"
              >
                Clear
              </button>
            </div>
          </div>
          
          <ul className="space-y-2">
            {orderItems.map((item, index) => (
              <li
                key={index}
                className="p-2 border rounded bg-gray-50 flex justify-between"
              >
                <div className="text-sm">
                  <div>
                    <strong>{item.name}</strong>
                  </div>
                  {item.note && (
                    <div className="text-gray-600">📝 {item.note}</div>
                  )}
                  {item.drink && (
                    <div className="text-gray-600">🥤 {item.drink}</div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditItem(index)}
                    className="text-blue-500 text-xs"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-red-500 text-xs"
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>

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

          <button
            onClick={handleSendToKitchen}
            className="mt-4 w-full bg-green-600 text-white py-2 rounded font-medium"
          >
            🚀 Send to Kitchen
          </button>
        </div>
      )}

      {/* Draft Orders */}
      {drafts.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">📦 Saved Drafts</h2>
          <div className="space-y-2">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-2 border rounded bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <div className="text-sm">
                    <strong>{draft.items.length} items</strong>
                  </div>
                  <div className="text-xs text-gray-500">
                    {draft.customer || 'No customer'} • {draft.createdAt}
                  </div>
                </div>
                <button
                  onClick={() => handleLoadDraft(draft)}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterPage;
