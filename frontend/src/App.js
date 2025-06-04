import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import HomePage from './HomePage';
import WaiterPage from './WaiterPage';
import KitchenPage from './KitchenPage';

function NotFound() {
  return (
    <h2 className="text-center mt-10 text-red-600">404 - Page Not Found</h2>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Home page with buttons */}
        <Route path="/" element={<HomePage />} />

        {/* Main routes */}
        <Route path="/waiter" element={<WaiterPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
