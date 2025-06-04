import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import WaiterPage from './WaiterPage';
import KitchenPage from './KitchenPage';

import AdminPage from './components/AdminPage';
import WaiterManager from './components/WaiterManager';
import MenuManager from './components/MenuManager';
import OrderHistory from './components/OrderHistory';

function NotFound() {
  return (
    <h2 className="text-center mt-10 text-red-600">404 - Page Not Found</h2>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Home redirects to Waiter page */}
        <Route path="/" element={<Navigate replace to="/kitchen" />} />

        {/* Main routes */}
        <Route path="/waiter" element={<WaiterPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/waiter" element={<WaiterManager />} />
        <Route path="/admin/menu" element={<MenuManager />} />
        <Route path="/admin/orders" element={<OrderHistory />} />

        {/* Fallback route for unmatched URLs */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
