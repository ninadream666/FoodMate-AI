import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // 配置跨域代理，对接后端 Docker 微服务群
    proxy: {
      // 1. 认证与用户服务 -> 端口 8083
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
      // [重要修复]: 必须在宽泛的 /api/admin 之前拦截特定服务的请求
      
      // ⚠️ 营销微服务管理端 (8082) - 解决请求被错误转发到 8088 的问题
      // 修正：增加 rewrite 逻辑，将 /api/admin/coupons 映射到后端的 /coupons 根路径
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

      // ⚠️ 订单微服务管理端 (8084) - 后端自带 /api 前缀，无需 rewrite
      '/api/admin/orders': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      
      // ⚠️ 商家微服务管理端 (8081) - 后端自带 /api 前缀，无需 rewrite
      '/api/admin/merchants': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      
      // ⚠️ 用户微服务管理端 (8083) - 后端期望路径是 /admin/users，因此必须剥离 /api
      '/api/admin/users': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      // ======================================================================

      // 2. 商家基础服务 -> 端口 8081
      '/api/merchants': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/merchants/, '/merchants')
      },
      
      // 3. 平台增值与结算服务 (商家侧) -> 端口 8088
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
      
      // 4. 订单服务 -> 端口 8084
      '/api/orders': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/orders/, '/orders')
      },
      
      // 5. 营销与优惠券服务 (用户侧通用) -> 端口 8082
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
      
      // 6. 用户画像服务 -> 端口 8086
      '/api/profile': {
        target: 'http://localhost:8086',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/profile/, '/profile')
      },
      
      // 7. 推荐服务 -> 端口 8087
      '/api/v2': {
        target: 'http://localhost:8087',
        changeOrigin: true,
      },
      
      // 8. 平台管理服务 (Admin侧 fallback) -> 端口 8088
      // ⚠️ 兜底路由：上面的特定 Admin 路径没匹配到，才会走此 8088 网关
      '/api/admin': {
        target: 'http://localhost:8088',
        changeOrigin: true,
      },
      
      // 9. AI 定价服务 -> 端口 8089
      '/api/ai-pricing': {
        target: 'http://localhost:8089',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai-pricing/, '')
      },
      
      // 10. 营养视觉分类服务 -> 端口 8090
      '/api/nutrivision': {
        target: 'http://localhost:8090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nutrivision/, '')
      }
    }
  }
})