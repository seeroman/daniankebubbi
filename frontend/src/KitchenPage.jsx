import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://daniankebubbi.onrender.com';

if (!API_BASE_URL) {
  console.warn('⚠️ REACT_APP_API_BASE_URL is not defined. Check your .env file.');
}

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const [showCompletedAll, setShowCompletedAll] = useState(false);
  const [completedOrdersTodayList, setCompletedOrdersTodayList] = useState([]);
  const [completedOrdersAllList, setCompletedOrdersAllList] = useState([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const audioRef = useRef(null);
  const prevOrderIds = useRef([]);

  const initializePermissions = async () => {
    try {
      // Initialize audio
      audioRef.current = new Audio('/sound.wav');
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Request notification permissions
      if (Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      
      setPermissionsGranted(true);
    } catch (error) {
      console.warn('Permission initialization failed:', error);
      // Proceed anyway but with limited functionality
      setPermissionsGranted(true);
    }
  };

  const showNotification = (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  const fetchCompletedStats = async () => {
    try {
      const [todayRes, totalRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/orders/completed/today`),
        fetch(`${API_BASE_URL}/api/orders/completed/total`),
      ]);
      const todayData = await todayRes.json();
      const totalData = await totalRes.json();
      setCompletedToday(todayData.completed_orders_today);
      setCompletedTotal(totalData.completed_orders_total);
    } catch (error) {
      console.error('Failed to fetch completed order stats:', error);
    }
  };

  const fetchCompletedOrdersToday = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/completed/today/list`);
      const data = await response.json();
      setCompletedOrdersTodayList(data);
    } catch (error) {
      console.error('Failed to fetch today\'s completed orders:', error);
    }
  };

  const fetchCompletedOrdersAll = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/completed/all`);
      const data = await response.json();
      setCompletedOrdersAllList(data);
    } catch (error) {
      console.error('Failed to fetch all completed orders:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      const data = await response.json();

      // Detect new orders
      const newOrderIds = data.map((o) => o.id);
      const isNewOrder = newOrderIds.some(
        (id) => !prevOrderIds.current.includes(id),
      );

      if (prevOrderIds.current.length > 0 && isNewOrder) {
        const newOrderId = newOrderIds.find(id => !prevOrderIds.current.includes(id));
        
        try {
          if (!document.hidden && audioRef.current) {
            await audioRef.current.play();
            setNewOrderAlert(false);
          } else {
            showNotification('New Order!', `Order #${newOrderId} received`);
          }
        } catch (error) {
          console.warn('Audio play failed:', error);
          showNotification('New Order!', `Order #${newOrderId} received`);
          setNewOrderAlert(true);
        }
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
    if (permissionsGranted) {
      // Initial fetch
      fetchOrders();
      fetchCompletedStats();

      // Set up interval for auto-refresh
      const interval = setInterval(() => {
        fetchOrders();
        fetchCompletedStats();
      }, 5000);

      return () => {
        clearInterval(interval);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [permissionsGranted]);

  const handleMarkDone = async (orderId) => {
    try {
      await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
      });
      fetchOrders();
      fetchCompletedStats();
      fetchCompletedOrdersToday();
      fetchCompletedOrdersAll();
    } catch (error) {
      console.error('Failed to mark order as done:', error);
    }
  };

  const handleResetCounts = async () => {
    const password = prompt('Enter password to reset counts:');

    if (password !== '2025') {
      alert('❌ Incorrect password.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/reset-completed`, {
        method: 'POST',
      });

      const data = await res.json();
      alert(data.message || '✅ Reset successful.');
      fetchCompletedStats();
      setCompletedOrdersTodayList([]);
      setCompletedOrdersAllList([]);
      setShowCompletedToday(false);
      setShowCompletedAll(false);
    } catch (error) {
      console.error('Reset failed:', error);
      alert('❌ Failed to reset counts.');
    }
  };

  const toggleCompletedToday = async () => {
    if (!showCompletedToday) {
      await fetchCompletedOrdersToday();
    }
    setShowCompletedToday(!showCompletedToday);
    setShowCompletedAll(false);
  };

  const toggleCompletedAll = async () => {
    if (!showCompletedAll) {
      await fetchCompletedOrdersAll();
    }
    setShowCompletedAll(!showCompletedAll);
    setShowCompletedToday(false);
  };

  const renderOrderList = (orders, isPending = false) => {
    return (
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

            <ul className="mb-6 space-y-2">
              {order.items.map((item, index) => (
                <li
                  key={index}
                  className="bg-white p-3 rounded-lg shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-gray-800 text-base">
                        {item.name}
                      </div>

                      {item.note && (
                        <div className="mt-1 flex items-center">
                          <span className="text-yellow-600 mr-1 text-sm">
                            📝
                          </span>
                          <span className="bg-yellow-50 text-yellow-800 px-2 py-1 rounded text-sm border border-yellow-200">
                            {item.note}
                          </span>
                        </div>
                      )}

                      {/kebab|kana/i.test(item.name) && item.drink && (
                        <div className="mt-1 flex items-center">
                          <span className="text-blue-500 mr-1 text-sm">
                            🥤
                          </span>
                          <span className="text-gray-600 text-sm">
                            {item.drink}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {isPending && (
              <button
                onClick={() => handleMarkDone(order.id)}
                className="w-full bg-blue-600 text-white py-2 text-lg rounded-md hover:bg-blue-700"
              >
                ✅ Mark as Done
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!permissionsGranted) {
    return (
      <div className="p-4 text-center mt-40">
        <h1 className="text-3xl font-bold mb-6">👨‍🍳 Kitchen Notifications</h1>
        <button 
          onClick={initializePermissions}
          className="bg-blue-600 text-white py-3 px-6 text-lg rounded-md hover:bg-blue-700 mb-4"
        >
          🔔 Enable Notifications
        </button>
        <p className="text-gray-600 max-w-md mx-auto">
          Please enable audio and notification permissions to get alerts for new orders.
          This is required for the system to notify you when new orders arrive,
          especially when the browser is in the background.
        </p>
      </div>
    );
  }

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

      {/* New order alert (when sound couldn't play) */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg animate-pulse flex items-center">
          🔔 New Order! (Tab is muted)
          <button 
            onClick={() => setNewOrderAlert(false)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Completed Stats */}
      <div className="flex justify-end mb-4 gap-6 pr-4">
        <button 
          onClick={toggleCompletedToday}
          className={`rounded-lg shadow px-4 py-2 text-center cursor-pointer ${
            showCompletedToday ? 'bg-green-200' : 'bg-white'
          }`}
        >
          <div className="text-sm text-gray-500">Completed Today</div>
          <div className="text-xl font-bold text-green-600">
            {completedToday}
          </div>
        </button>
        <button 
          onClick={toggleCompletedAll}
          className={`rounded-lg shadow px-4 py-2 text-center cursor-pointer ${
            showCompletedAll ? 'bg-blue-200' : 'bg-white'
          }`}
        >
          <div className="text-sm text-gray-500">Total Completed</div>
          <div className="text-xl font-bold text-blue-600">
            {completedTotal}
          </div>
        </button>
      </div>
      <div className="flex justify-end pr-4 mb-6">
        <button
          onClick={handleResetCounts}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded shadow"
        >
          🔁 Reset Counts
        </button>
      </div>

      {showCompletedToday ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center text-green-600">Today's Completed Orders</h2>
          {completedOrdersTodayList.length === 0 ? (
            <p className="text-center text-gray-600">No completed orders today.</p>
          ) : (
            renderOrderList(completedOrdersTodayList)
          )}
        </>
      ) : showCompletedAll ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">All Completed Orders</h2>
          {completedOrdersAllList.length === 0 ? (
            <p className="text-center text-gray-600">No completed orders.</p>
          ) : (
            renderOrderList(completedOrdersAllList)
          )}
        </>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-600">No active orders.</p>
      ) : (
        renderOrderList(orders, true)
      )}
    </div>
  );
};

export default KitchenPage;
