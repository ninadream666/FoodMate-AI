import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// ================= ESM 模块兼容处理 =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// =================================================

const app = express();

const proxies = {
  // ========================================================================
  // 移动端路由分发
  // ========================================================================
  '/app-api/auth': {
    target: 'http://localhost:8083',
    changeOrigin: true,
    pathRewrite: { '^/app-api/auth': '/auth' }
  },
  '/app-api/users': {
    target: 'http://localhost:8083',
    changeOrigin: true,
    pathRewrite: { '^/app-api/users': '/users' }
  },
  '/app-api/merchants': {
    target: 'http://localhost:8081',
    changeOrigin: true,
    pathRewrite: { '^/app-api/merchants': '/merchants' }
  },
  '/app-api/orders': {
    target: 'http://localhost:8084',
    changeOrigin: true,
    pathRewrite: { '^/app-api/orders': '/orders' }
  },
  '/app-api/coupons': {
    target: 'http://localhost:8082',
    changeOrigin: true,
    pathRewrite: { '^/app-api/coupons': '/api/coupons' }
  },
  '/app-api/marketing': {
    target: 'http://localhost:8082',
    changeOrigin: true,
    pathRewrite: { '^/app-api/marketing': '/marketing' }
  },
  '/app-api/profile': {
    target: 'http://localhost:8086',
    changeOrigin: true,
    pathRewrite: { '^/app-api/profile': '/profile' }
  },
  '/app-api/recommendation': {
    target: 'http://localhost:8087',
    changeOrigin: true,
    pathRewrite: { '^/app-api/recommendation': '/api/v2' }
  },
  '/app-api/platform': {
    target: 'http://localhost:8088',
    changeOrigin: true,
    pathRewrite: { '^/app-api/platform': '/api/admin' }
  },
  '/app-api/merchantPlatform': {
    target: 'http://localhost:8088',
    changeOrigin: true,
    pathRewrite: { '^/app-api/merchantPlatform': '/api/merchant/platform-services' }
  },
  '/app-api/merchantSettlement': {
    target: 'http://localhost:8088',
    changeOrigin: true,
    pathRewrite: { '^/app-api/merchantSettlement': '/api/merchant/settlements' }
  },
  '/app-api/merchantCommission': {
    target: 'http://localhost:8088',
    changeOrigin: true,
    pathRewrite: { '^/app-api/merchantCommission': '/api/merchant/commissions' }
  },
  '/app-api/ai-pricing': {
    target: 'http://localhost:8089',
    changeOrigin: true,
    pathRewrite: { '^/app-api/ai-pricing': '' }
  },
  '/app-api/nutrivision': {
    target: 'http://localhost:8090',
    changeOrigin: true,
    pathRewrite: { '^/app-api/nutrivision': '' }
  },
  '/app-api/images': {
    target: 'http://localhost:8081',
    changeOrigin: true,
    pathRewrite: { '^/app-api/images': '/api/images' }
  },

  // ========================================================================
  // Web端路由分发
  // ========================================================================
  '/api/admin/coupons': {
    target: 'http://localhost:8082',
    changeOrigin: true,
    pathRewrite: { '^/api/admin/coupons': '/coupons' }
  },
  '/api/admin/marketing': {
    target: 'http://localhost:8082',
    changeOrigin: true,
    pathRewrite: { '^/api/admin/marketing': '/coupons' }
  },
  '/api/admin/orders': {
    target: 'http://localhost:8084',
    changeOrigin: true
  },
  '/api/admin/merchants': {
    target: 'http://localhost:8081',
    changeOrigin: true
  },
  '/api/admin/users': {
    target: 'http://localhost:8083',
    changeOrigin: true,
    pathRewrite: { '^/api': '' }
  },
  
  '/api/merchant/platform-services': {
    target: 'http://localhost:8088',
    changeOrigin: true
  },
  '/api/merchant/settlements': {
    target: 'http://localhost:8088',
    changeOrigin: true
  },
  '/api/merchant/commissions': {
    target: 'http://localhost:8088',
    changeOrigin: true
  },

  '/api/auth': {
    target: 'http://localhost:8083',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' }
  },
  '/api/users': {
    target: 'http://localhost:8083',
    changeOrigin: true,
    pathRewrite: { '^/api/users': '/users' }
  },
  '/api/merchants': {
    target: 'http://localhost:8081',
    changeOrigin: true,
    pathRewrite: { '^/api/merchants': '/merchants' }
  },
  '/api/orders': {
    target: 'http://localhost:8084',
    changeOrigin: true,
    pathRewrite: { '^/api/orders': '/orders' }
  },
  '/api/coupons': {
    target: 'http://localhost:8082',
    changeOrigin: true,
    pathRewrite: { '^/api/coupons': '/coupons' }
  },
  '/api/marketing': {
    target: 'http://localhost:8082',
    changeOrigin: true,
    pathRewrite: { '^/api/marketing': '/marketing' }
  },
  '/api/profile': {
    target: 'http://localhost:8086',
    changeOrigin: true,
    pathRewrite: { '^/api/profile': '/profile' }
  },
  
  '/api/admin': {
    target: 'http://localhost:8088',
    changeOrigin: true
  },
  '/api/v2': {
    target: 'http://localhost:8087',
    changeOrigin: true
  },
  '/api/ai-pricing': {
    target: 'http://localhost:8089',
    changeOrigin: true,
    pathRewrite: { '^/api/ai-pricing': '' }
  },
  '/api/nutrivision': {
    target: 'http://localhost:8090',
    changeOrigin: true,
    pathRewrite: { '^/api/nutrivision': '' }
  }
};

// 挂载所有代理中间件
Object.keys(proxies).forEach(route => {
  const proxy = createProxyMiddleware({
    target: proxies[route].target,
    changeOrigin: proxies[route].changeOrigin,
    pathRewrite: proxies[route].pathRewrite
  });

  app.use(route, (req, res, next) => {
    req.url = req.originalUrl;
    proxy(req, res, next);
  });
});

// 托管Web静态文件
app.use(express.static(path.join(__dirname, 'dist')));

app.get(/^\/(?!api|app-api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 监听端口
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FoodMate Server is running on port ${PORT}`);
});