import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import CreateLabel from './CreateLabel';
import SavedAddresses from './SavedAddresses';
import SavedPackages from './SavedPackages';
import OrdersHistoryHorizontal from '../orders/OrdersHistoryHorizontal';
import AddBalance from './AddBalance';
import BulkOrders from './BulkOrders';
import DashboardView from './DashboardView';
import Integrations from './Integrations';
import BatchesList from './BatchesList';
import './Dashboard.css';

const Dashboard = () => {
  const { user, fetchUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('create-label');

  useEffect(() => {
    // Handle payment success
    const payment = searchParams.get('payment');
    const tab = searchParams.get('tab');
    if (payment === 'success' && user) {
      fetchUser(); // Refresh user balance
      setActiveTab('balance');
      // Remove query params
      window.history.replaceState({}, '', '/dashboard');
    }
    if (tab === 'balance') {
      setActiveTab('balance');
      window.history.replaceState({}, '', '/dashboard');
    }
    if (tab === 'orders-history' || tab === 'history' || tab === 'history-horizontal') {
      setActiveTab('orders-history');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams, user, fetchUser]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'create-label':
        return <CreateLabel />;
      case 'orders-history':
      case 'history-horizontal':
        return <OrdersHistoryHorizontal />;
      case 'bulk-orders':
        return <BulkOrders />;
      case 'batches-list':
        return <BatchesList />;
      case 'addresses':
        return <SavedAddresses />;
      case 'packages':
        return <SavedPackages />;
      case 'balance':
        return <AddBalance />;
      case 'integrations':
        return <Integrations />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;
