import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// 健康上下文 Provider
import { HealthProvider } from './src/hooks/useHealthContext';

// 导入页面
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import RestaurantDetailScreen from './src/screens/RestaurantDetailScreen';
import CartScreen from './src/screens/CartScreen';
import AddressListScreen from './src/screens/AddressListScreen';
import AddressEditScreen from './src/screens/AddressEditScreen';
import OrderListScreen from './src/screens/OrderListScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import WalletScreen from './src/screens/WalletScreen';
import SurveyScreen from './src/screens/SurveyScreen';
import PaymentSuccessScreen from './src/screens/PaymentSuccessScreen';
import OrderConfirmScreen from './src/screens/OrderConfirmScreen';
import MerchantOnboardingScreen from './src/screens/merchant/MerchantOnboardingScreen';
import MerchantShopInfoScreen from './src/screens/merchant/MerchantShopInfoScreen';
import RefundAuditScreen from './src/screens/merchant/RefundAuditScreen';
import ServiceMarketplaceScreen from './src/screens/merchant/ServiceMarketplaceScreen';
import SettlementDashboardScreen from './src/screens/merchant/SettlementDashboardScreen';
// 商家端页面 (注意路径包含 /merchant)
import MerchantDashboardScreen from './src/screens/merchant/MerchantDashboardScreen';
import SmartPricingScreen from './src/screens/merchant/SmartPricingScreen';
import MenuManagementScreen from './src/screens/merchant/MenuManagementScreen';
// 调试工具
import LocationDebugScreen from './src/screens/LocationDebugScreen';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <HealthProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">

            {/* 登录页 */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />

            {/* 顾客主页 */}
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: '美食广场', headerBackVisible: false }}
            />

            {/* 管理端 (PC端功能，App端保留入口) */}
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
              options={{ title: '系统管理', headerBackVisible: false }}
            />

            {/* 核心业务流程 */}
            <Stack.Screen
              name="RestaurantDetail"
              component={RestaurantDetailScreen}
              options={{ title: '餐厅详情' }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ title: '购物车' }}
            />
            <Stack.Screen
              name="OrderConfirm"
              component={OrderConfirmScreen}
              options={{ title: '确认订单' }}
            />
            <Stack.Screen
              name="PaymentSuccess"
              component={PaymentSuccessScreen}
              options={{ title: '支付成功', headerShown: false }}
            />

            {/* 地址与订单 */}
            <Stack.Screen
              name="AddressList"
              component={AddressListScreen}
              options={{ title: '我的地址' }}
            />
            <Stack.Screen
              name="AddressEdit"
              component={AddressEditScreen}
              options={{ title: '新增地址' }}
            />
            <Stack.Screen
              name="OrderList"
              component={OrderListScreen}
              options={{ title: '我的订单' }}
            />
            <Stack.Screen
              name="OrderTracking"
              component={OrderTrackingScreen}
              options={{ title: '订单详情' }}
            />

            {/* 个人中心 */}
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: '个人中心' }}
            />
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
              options={{ title: '我的钱包' }}
            />
            <Stack.Screen
              name="Survey"
              component={SurveyScreen}
              options={{ title: '美食偏好', headerShown: false }}
            />

            {/* 商家端 (集中管理，无重复) */}
            <Stack.Screen
              name="MerchantDashboard"
              component={MerchantDashboardScreen}
              options={{ title: '商家工作台' }}
            />
            <Stack.Screen
              name="SmartPricing"
              component={SmartPricingScreen}
              options={{ title: '智能定价' }}
            />
            <Stack.Screen
              name="MenuManagement"
              component={MenuManagementScreen}
              options={{ title: '菜单管理' }}
            />

            <Stack.Screen
              name="MerchantOnboarding"
              component={MerchantOnboardingScreen}
              options={{ title: '商家入驻' }}
            />
            <Stack.Screen
              name="MerchantShopInfo"
              component={MerchantShopInfoScreen}
              options={{ title: '店铺信息' }}
            />
            <Stack.Screen
              name="RefundAudit"
              component={RefundAuditScreen}
              options={{ title: '退款审批' }}
            />
            <Stack.Screen
              name="ServiceMarketplace"
              component={ServiceMarketplaceScreen}
              options={{ title: '服务市场' }}
            />
            <Stack.Screen
              name="SettlementDashboard"
              component={SettlementDashboardScreen}
              options={{ title: '财务结算' }}
            />

            {/* 调试工具 - 仅用于开发 */}
            <Stack.Screen
              name="LocationDebug"
              component={LocationDebugScreen}
              options={{ title: '定位调试' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </HealthProvider>
    </SafeAreaProvider>
  );
}

export default App;