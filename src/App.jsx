import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Reservations from './pages/Reservations';
import Ledger from './pages/Ledger';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="reservations" element={<Reservations />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="staff" element={<div className="p-8 text-center text-muted">직원 관리 페이지 준비 중...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
