import React, { useState, useEffect, useRef } from 'react';

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef(null);
  const prevOrderIds = useRef([]);

  // Load audio on mount
  useEffect(() => {
    audioRef.current = new Audio('/beep.wav');
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/orders');
      const data = await response.json();

      // Detect new orders
      const newOrderIds = data.map((o) => o.id);
      const isNewOrder = newOrderIds.some(
        (id) => !prevOrderIds.current.includes(id),
      );

      if (prevOrderIds.current.length > 0 && isNewOrder && audioRef.current) {
        audioRef.current.play().catch((e) => {
          console.warn('Audio play failed:', e);
        });
      }

      prevOrderIds.current = newOrderIds;
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(); // Initial load
    const interval = setInterval(fetchOrders, 5000); // Refresh every 5 sec
    return () => clearInterval(interval);
  }, []);

  const handleMarkDone = async (orderId) => {
    try {
      await fetch(`http://127.0.0.1:5000/api/orders/${orderId}`, {
        method: 'PATCH',
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark order as done:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center mt-40">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-70 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700 font-medium">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">👨‍🍳 Kitchen View</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">No active orders.</p>
      ) : (
        <div className="grid gap-7 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow-xl rounded-xl p-5 border border-gray-300"
            >
              <div className="flex justify-between text-sm font-bold mb-2 text-gray-800">
                <span>🧾 Order #{order.id}</span>
                <span>⏰ {order.time || '–'}</span>
              </div>

              <div className="mb-2 text-sm">
                💰 Payment:{' '}
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    order.paymentStatus === 'PAID'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {order.paymentStatus || 'UNKNOWN'}
                </span>
              </div>

              <div className="text-sm mb-1">
                👤 Waiter: <strong>{order.waiter}</strong>
              </div>
              {order.customer && (
                <div className="text-sm mb-4">
                  🧍 Customer: <strong>{order.customer}</strong>
                </div>
              )}

              <ul className="mb-6 space-y-5">
                {order.items.map((item, index) => (
                  <li key={index}>
                    <div className="text-xl font-semibold">
                      {index + 1}. {item.name}
                    </div>
                    {item.note && (
                      <div className="ml-5 mt-1 inline-block bg-yellow-300 text-yellow-900 text-base px-3 py-1 rounded text-sm font-medium">
                        📝 {item.note}
                      </div>
                    )}
                    <div className="ml-5 mt-1 text-base text-gray-700">
                      🥤 Drink:{' '}
                      <span className="font-semibold">{item.drink}</span>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleMarkDone(order.id)}
                className="w-full bg-blue-600 text-white py-2 text-lg rounded-md hover:bg-blue-700"
              >
                ✅ Mark as Done
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenPage;
