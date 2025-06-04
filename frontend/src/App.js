import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WaiterPage from './WaiterPage';
import KitchenPage from './KitchenPage';
import AdminPage from './components/AdminPage';
import WaiterManager from './components/WaiterManager';
import MenuManager from './components/MenuManager';
import OrderHistory from './components/OrderHistory';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/waiter" element={<WaiterPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        {/* 
  <Route path="/admin" element={<AdminPage />} />
  <Route path="/admin/waiter" element={<WaiterManager />} />
  <Route path="/admin/menu" element={<MenuManager />} />
  <Route path="/admin/orders" element={<OrderHistory />} />
*/}
        <Route
          path="*"
          element={<div className="text-center p-4">404 Not Found</div>}
        />
      </Routes>
    </Router>
  );
}

export default App;
