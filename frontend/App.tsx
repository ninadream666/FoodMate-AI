import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAFAF8',
    card: '#FFFFFF',
  },
};

// 健康上下文 Provider
import { HealthProvider } from './src/hooks/useHealthContext';
import AdaptiveOverlay from './src/components/AdaptiveOverlay';

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
import MerchantOrdersScreen from './src/screens/merchant/MerchantOrdersScreen';
import ServiceMarketplaceScreen from './src/screens/merchant/ServiceMarketplaceScreen';
import SettlementDashboardScreen from './src/screens/merchant/SettlementDashboardScreen';
import NutriVisionResultScreen from './src/screens/NutriVisionResultScreen';
// 商家端页面 (注意路径包含 /merchant)
import MerchantDashboardScreen from './src/screens/merchant/MerchantDashboardScreen';
import SmartPricingScreen from './src/screens/merchant/SmartPricingScreen';
import MenuManagementScreen from './src/screens/merchant/MenuManagementScreen';
// 调试工具
import LocationDebugScreen from './src/screens/LocationDebugScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import BrowseHistoryScreen from './src/screens/BrowseHistoryScreen';
import HealthDataScreen from './src/screens/HealthDataScreen';

// 网络状态全局监听（App 启动时初始化一次）
import { startNetworkMonitor } from './src/services/networkUtils';
startNetworkMonitor();

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <HealthProvider>
        <NavigationContainer theme={AppTheme}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ contentStyle: { backgroundColor: '#FAFAF8' } }}
          >

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
              options={{ headerShown: false }}
            />

            {/* 实景菜单营养透视结果页*/}
            <Stack.Screen
              name="NutriVisionResult"
              component={NutriVisionResultScreen}
              options={{ headerShown: false }} // 全屏显示
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
              options={{
                title: '餐厅详情',
                headerStyle: { backgroundColor: '#FFFFFF' },
                headerShadowVisible: true,
              }}
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
              name="MerchantOrders"
              component={MerchantOrdersScreen}
              options={{ title: '订单管理' }}
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

            {/* 隐私政策 */}
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ title: '隐私政策' }}
            />

            {/* 健康数据 */}
            <Stack.Screen
              name="HealthData"
              component={HealthDataScreen}
              options={{ title: '健康数据' }}
            />

            {/* 收藏 & 历史 */}
            <Stack.Screen
              name="Favorites"
              component={FavoritesScreen}
              options={{ title: '我的收藏' }}
            />
            <Stack.Screen
              name="BrowseHistory"
              component={BrowseHistoryScreen}
              options={{ title: '浏览历史' }}
            />

            {/* 调试工具 - 仅用于开发 */}
            <Stack.Screen
              name="LocationDebug"
              component={LocationDebugScreen}
              options={{ title: '定位调试' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <AdaptiveOverlay />
      </HealthProvider>
    </SafeAreaProvider>
  );
}

export default App;