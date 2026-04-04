import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // 配置跨域代理，对接后端Docker微服务群
    proxy: {
      // 认证与用户服务
      '/api/auth': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, '/auth')
      },
      '/api/users': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/users/, '/users')
      },
      
      // ================= 精细化 Admin 路由分发 =================
      '/api/admin/coupons': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/admin\/coupons/, '/coupons')
      },
      '/api/admin/marketing': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/admin\/marketing/, '/coupons')
      },

      // 订单微服务管理端
      '/api/admin/orders': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      
      // 商家微服务管理端
      '/api/admin/merchants': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      
      // 用户微服务管理端
      '/api/admin/users': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // ======================================================================

      // 商家基础服务
      '/api/merchants': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/merchants/, '/merchants')
      },
      
      // 平台增值与结算服务
      '/api/merchant/platform-services': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/api/merchant/settlements': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      '/api/merchant/commissions': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      
      // 订单服务
      '/api/orders': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/orders/, '/orders')
      },
      
      // 营销与优惠券服务
      '/api/coupons': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coupons/, '/coupons')
      },
      '/api/marketing': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/marketing/, '/marketing')
      },
      
      // 用户画像服务
      '/api/profile': {
        target: 'http://localhost:8086',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/profile/, '/profile')
      },
      
      // 推荐服务
      '/api/v2': {
        target: 'http://localhost:8087',
        changeOrigin: true,
      },
      
      // 平台管理服务
      '/api/admin': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      
      // AI定价服务
      '/api/ai-pricing': {
        target: 'http://localhost:8089',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai-pricing/, '')
      },
      
      // 营养视觉分类服务
      '/api/nutrivision': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nutrivision/, '')
      }
    }
  }
})