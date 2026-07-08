import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import Leads from './pages/Leads';
import LeadForm from './pages/LeadForm';
import ServiceOrders from './pages/ServiceOrders';
import ServiceOrderForm from './pages/ServiceOrderForm';
import ServiceOrderDetail from './pages/ServiceOrderDetail';
import ServiceTypes from './pages/ServiceTypes';
import ServiceTypeForm from './pages/ServiceTypeForm';
import Parts from './pages/Parts';
import PartForm from './pages/PartForm';
import Users from './pages/Users';
import PartsStore from './pages/PartsStore';
import StockMovements from './pages/StockMovements';
import MechanicsDashboard from './pages/MechanicsDashboard';
import ClientOrderView from './pages/ClientOrderView';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Carregando...</p>
      </div>
    );
  }

  // Role-based default redirect
  const getDefaultRoute = () => {
    if (user?.role === 'technician') return '/mechanics';
    return '/dashboard';
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/public/os/:shareToken" element={<ClientOrderView />} />
      
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to={getDefaultRoute()} replace />} />
        
        {/* General routes (all roles) */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="mechanics" element={<MechanicsDashboard />} />
        <Route path="service-orders" element={<ServiceOrders />} />
        <Route path="service-orders/new" element={<ServiceOrderForm />} />
        <Route path="service-orders/:id/edit" element={<ServiceOrderForm />} />
        <Route path="service-orders/:id" element={<ServiceOrderDetail />} />
        <Route path="service-types" element={<ServiceTypes />} />
        <Route path="service-types/new" element={<ServiceTypeForm />} />
        <Route path="service-types/:id/edit" element={<ServiceTypeForm />} />
        <Route path="parts-store" element={<PartsStore />} />
        
        {/* Manager+ routes */}
        <Route path="clients" element={<ProtectedRoute requiredRole="manager"><Clients /></ProtectedRoute>} />
        <Route path="clients/new" element={<ProtectedRoute requiredRole="manager"><ClientForm /></ProtectedRoute>} />
        <Route path="clients/:id/edit" element={<ProtectedRoute requiredRole="manager"><ClientForm /></ProtectedRoute>} />
        <Route path="leads" element={<ProtectedRoute requiredRole="manager"><Leads /></ProtectedRoute>} />
        <Route path="leads/new" element={<ProtectedRoute requiredRole="manager"><LeadForm /></ProtectedRoute>} />
        <Route path="leads/:id/edit" element={<ProtectedRoute requiredRole="manager"><LeadForm /></ProtectedRoute>} />
        <Route path="parts" element={<ProtectedRoute requiredRole="manager"><Parts /></ProtectedRoute>} />
        <Route path="parts/new" element={<ProtectedRoute requiredRole="manager"><PartForm /></ProtectedRoute>} />
        <Route path="parts/:id/edit" element={<ProtectedRoute requiredRole="manager"><PartForm /></ProtectedRoute>} />
        
        {/* Admin+ routes */}
        <Route path="users" element={<ProtectedRoute requiredRole="manager"><Users /></ProtectedRoute>} />
        <Route path="stock-movements" element={<ProtectedRoute requiredRole="manager"><StockMovements /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}
