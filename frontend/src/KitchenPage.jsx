import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://daniankebubbi.onrender.com';

if (!API_BASE_URL) {
  console.warn('⚠️ REACT_APP_API_BASE_URL is not defined. Check your .env file.');
}

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [avgTimeToday, setAvgTimeToday] = useState(0);
  const [avgTimeTotal, setAvgTimeTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCompletedToday, setShowCompletedToday] = useState(false);
  const [showCompletedAll, setShowCompletedAll] = useState(false);
  const [completedOrdersTodayList, setCompletedOrdersTodayList] = useState([]);
  const [completedOrdersAllList, setCompletedOrdersAllList] = useState([]);
  const [backupStatus, setBackupStatus] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(
    localStorage.getItem('kitchenPermissionsGranted') === 'true'
  );
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [markingDone, setMarkingDone] = useState({});
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
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          localStorage.setItem('kitchenPermissionsGranted', 'true');
        }
      } else {
        localStorage.setItem('kitchenPermissionsGranted', 'true');
      }
      
      setPermissionsGranted(true);
    } catch (error) {
      console.warn('Permission initialization failed:', error);
      setPermissionsGranted(true);
    }
  };

  const showNotification = (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };
 const handleBackupToGoogleDrive = async () => {
    setBackupStatus({ loading: true, message: 'Starting backup...' });
    try {
      const response = await fetch(`${API_BASE_URL}/api/backup`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (response.ok) {
        setBackupStatus({ 
          loading: false, 
          message: 'Backup successful!',
          link: result.view_link 
        });
      } else {
        setBackupStatus({ 
          loading: false, 
          message: result.message || 'Backup failed',
          error: true 
        });
      }
    } catch (error) {
      setBackupStatus({ 
        loading: false, 
        message: 'Failed to connect to server',
        error: true 
      });
      console.error('Backup failed:', error);
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
      setAvgTimeToday(todayData.avg_completion_time_minutes);
      setAvgTimeTotal(totalData.avg_completion_time_minutes);
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
    setMarkingDone(prev => ({ ...prev, [orderId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PATCH',
      });
      const result = await response.json();
      
      if (response.ok) {
        fetchOrders();
        fetchCompletedStats();
        fetchCompletedOrdersToday();
        fetchCompletedOrdersAll();
        
        // Show completion alert
       // alert(`Order #${orderId} completed in ${result.time_taken_minutes} minutes`);
      }
    } catch (error) {
      console.error('Failed to mark order as done:', error);
      alert('Failed to complete order. Please try again.');
    } finally {
      setMarkingDone(prev => ({ ...prev, [orderId]: false }));
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
            className="bg-white shadow-xl rounded-xl p-5 border border-gray-300 relative"
          >
            <div className="flex justify-between text-sm font-bold mb-2 text-gray-800">
              <span>🧾 Order #{order.custom_order_id || order.id}</span>
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

            {!isPending && order.completion_time && (
              <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                <div className="flex items-center">
                  <span className="mr-1">✅</span>
                  <span>Completed at: {order.completion_time}</span>
                </div>
                {order.time_taken_minutes && (
                  <div className="flex items-center">
                    <span className="mr-1">⏱️</span>
                    <span>Time taken: {order.time_taken_minutes} mins</span>
                  </div>
                )}
              </div>
            )}

            {isPending && (
              <button
                onClick={() => handleMarkDone(order.id)}
                disabled={markingDone[order.id]}
                className={`w-full py-2 text-lg rounded-md ${
                  markingDone[order.id] 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {markingDone[order.id] ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  '✅ Mark as Done'
                )}
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
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Please enable audio and notification permissions to get alerts for new orders.
          This is required for the system to notify you when new orders arrive,
          especially when the browser is in the background.
        </p>
        <button 
          onClick={() => setPermissionsGranted(true)}
          className="text-sm text-gray-500 underline"
        >
          Continue without notifications
        </button>
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

      {/* New order alert */}
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

      {/* Stats Dashboard */}
      <div className="flex justify-end mb-4 gap-6 pr-4">
        <button 
          onClick={toggleCompletedToday}
          className={`rounded-lg shadow px-4 py-2 text-center cursor-pointer min-w-[120px] ${
            showCompletedToday ? 'bg-green-200' : 'bg-white'
          }`}
        >
          <div className="text-sm text-gray-500">Completed Today</div>
          <div className="text-xl font-bold text-green-600">
            {completedToday}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: {avgTimeToday} mins
          </div>
        </button>
        <button 
          onClick={toggleCompletedAll}
          className={`rounded-lg shadow px-4 py-2 text-center cursor-pointer min-w-[120px] ${
            showCompletedAll ? 'bg-blue-200' : 'bg-white'
          }`}
        >
          <div className="text-sm text-gray-500">Total Completed</div>
          <div className="text-xl font-bold text-blue-600">
            {completedTotal}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg: {avgTimeTotal} mins
          </div>
        </button>
      </div>
      
 <div className="flex justify-end pr-4 mb-6 gap-2">
        <button
          onClick={handleBackupToGoogleDrive}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded shadow flex items-center"
          disabled={backupStatus?.loading}
        >
          {backupStatus?.loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Backing Up...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Backup to Google Drive
            </>
          )}
        </button>
        
        <button
          onClick={handleResetCounts}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded shadow"
        >
          🔁 Reset Counts
        </button>
      </div>
      

      {/* Backup status message */}
      {backupStatus && (
        <div className={`fixed bottom-4 right-4 p-3 rounded shadow-lg text-sm ${
          backupStatus.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {backupStatus.message}
          {backupStatus.link && (
            <a 
              href={backupStatus.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:underline"
            >
              View in Drive
            </a>
          )}
          <button 
            onClick={() => setBackupStatus(null)} 
            className="ml-2 text-gray-500 hover:text-gray-700"
          >
      ×
          </button>
        </div>
      )}

      {/* Main Content */}
      {showCompletedToday ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center text-green-600">
            Today's Completed Orders ({completedToday})
          </h2>
          {completedOrdersTodayList.length === 0 ? (
            <p className="text-center text-gray-600">No completed orders today.</p>
          ) : (
            renderOrderList(completedOrdersTodayList)
          )}
        </>
      ) : showCompletedAll ? (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
            All Completed Orders ({completedTotal})
          </h2>
          {completedOrdersAllList.length === 0 ? (
            <p className="text-center text-gray-600">No completed orders.</p>
          ) : (
            renderOrderList(completedOrdersAllList)
          )}
        </>
      ) : orders.length === 0 ? (
        <p className="text-center text-gray-600">No active orders.</p>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 text-center text-orange-600">
            Active Orders ({orders.length})
          </h2>
          {renderOrderList(orders, true)}
        </>
      )}
    </div>
  );
};

export default KitchenPage;
