import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './hooks/useAuth';

// 用户端页面
import Login from './pages/user/Login';
import Home from './pages/user/Home';
import Profile from './pages/user/Profile';
import RestaurantDetail from './pages/user/RestaurantDetail';
import Cart from './pages/user/Cart';
import OrderConfirm from './pages/user/OrderConfirm';
import PaymentSuccess from './pages/user/PaymentSuccess';
import OrderTracking from './pages/user/OrderTracking';
import MyOrders from './pages/user/MyOrders';
import Address from './pages/user/Address';
import Wallet from './pages/user/Wallet';
import Survey from './pages/user/Survey';

// 商家端组件导入
import MerchantLayout from './pages/merchant/MerchantLayout';
import MenuManagement from './pages/merchant/MenuManagement';
import ServiceMarketplace from './pages/merchant/ServiceMarketplace';
import SettlementDashboard from './pages/merchant/SettlementDashboard';
import RefundAudit from './pages/merchant/RefundAudit';
import MerchantOrders from './pages/merchant/MerchantOrders';
import MerchantShopInfo from './pages/merchant/MerchantShopInfo';
import MerchantOnboarding from './pages/merchant/MerchantOnboarding';
import SmartPricing from './pages/merchant/SmartPricing'; // 引入 AI 定价页面

// 管理端页面
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Services from './pages/admin/Services';
import Settlements from './pages/admin/Settlements';
import Commissions from './pages/admin/Commissions';
import Merchants from './pages/admin/Merchants';
import Orders from './pages/admin/Orders';
import Marketing from './pages/admin/Marketing';
import Users from './pages/admin/Users';
import UserCredit from './pages/admin/UserCredit';
import SystemMonitor from './pages/admin/SystemMonitor';
import StatsTestPage from './pages/admin/StatsTestPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 根路径重定向到登录 */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 登录页 */}
          <Route path="/login" element={<Login />} />

          {/* --- 用户端路由 --- */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey"
            element={
              <ProtectedRoute>
                <Survey />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/address"
            element={
              <ProtectedRoute>
                <Address />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant/:id"
            element={
              <ProtectedRoute>
                <RestaurantDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirm"
            element={
              <ProtectedRoute>
                <OrderConfirm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-tracking/:id"
            element={
              <ProtectedRoute>
                <OrderTracking />
              </ProtectedRoute>
            }
          />

          {/* --- 商家端入驻向导 (独立路由) --- */}
          <Route 
            path="/merchant-onboarding" 
            element={
              <ProtectedRoute>
                <MerchantOnboarding />
              </ProtectedRoute>
            } 
          />

          {/* --- 商家端路由 --- */}
          <Route 
            path="/merchant" 
            element={
              <ProtectedRoute>
                <MerchantLayout />
              </ProtectedRoute>
            }
          >
            {/* 默认子路由：重定向到菜单管理 */}
            <Route index element={<Navigate to="menu" replace />} />

            {/* 订单管理 */}
            <Route path="order-manage" element={<MerchantOrders />} />

            {/* 菜单管理 */}
            <Route path="menu" element={<MenuManagement />} />
            
            {/* AI 智能定价 - 新增页面 */}
            <Route path="ai-pricing" element={<SmartPricing />} />
            
            {/* 平台服务 */}
            <Route path="service" element={<ServiceMarketplace />} />
            
            {/* 结算分成 */}
            <Route path="settlement" element={<SettlementDashboard />} />
            
            {/* 订单管理 (退款审批) */}
            <Route path="orders" element={<RefundAudit />} />

            {/* 店铺信息 */}
            <Route path="shop-info" element={<MerchantShopInfo />} />
          </Route>

          {/* --- 管理端路由 --- */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="services" element={<Services />} />
            <Route path="settlements" element={<Settlements />} />
            <Route path="commissions" element={<Commissions />} />
            <Route path="merchants" element={<Merchants />} />
            <Route path="orders" element={<Orders />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="users" element={<Users />} />
            <Route path="user-credit" element={<UserCredit />} />
            <Route path="system-monitor" element={<SystemMonitor />} />
            <Route path="stats-test" element={<StatsTestPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;