import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { recommendationService } from '../../services/recommendationService';
import { merchantService } from '../../services/merchantService';
import { useNavigate } from 'react-router-dom';

// 默认餐厅图片
const defaultImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGKHZQTlEYMaCX_XakByf8YPtBpJu1JbiVmEUPUCftM6tNzRyVbyE8f3B93zfHC9IU6yuQTSyRLBwyjZOCyKcwArw8BWvTd4ICz9hLoegZzezmIpMj--IQrqYL1y-5FBJynhYgrMIvAfx3LqT7MIWUdjd7Nu_4HG_yixaPWLbcv1JbV57XSLtFufazLCDmtIKU75l2djE7H-Nq9jmcWSE8nmdeV86n26tJOAArQksQID-q6YqfTF9XDOT1m_wGyrA7EwCx7fuiaXiY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB5D4cVHmUDvJBFBae0uRhUP2dGh034P4yT1eXX7DXI4o99VrjQvf4MyLRT7aKUrxV54tTmh4MHx4I-X2mx6IEMJCfj1_NM79LlXeoR1Ee02k9qtFgtXO1cm08DggVsalQnB2CZqt-J4XXrJMmQ6pxAU5vP5aC6ex7wgrNJ8HvZ3KJUmpRzlteclmYitmPZbzJlaA4fMdJcy_dwxhnxl78edH5ei5fvuo9Z-pX4CemlX9S32hkNNtUv4BCGkEPSL35LhioStzX-N-wY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCRbRdtVr5x0wXS2eSK0WUNXjC-oxYSdvonWoNS-5Wj0qxtMrWgGUrHVLAigY4VfoOEj86XuQevuNcn6UVpNGy8n2p9uwiZr-1MDiI3xmweY99OYdsgUJFW4tInlg6E3xKTLOd4TUg0NGHnXSgUaF53YIhvEh-Gb_RVHKFa1fpH_2zjYdMS6ZMSyJc4sfJ0et0OMUuC1WpzaJtHkk8Y96pTTJsdxQoIoVbuPJ_FkYGR1vlN4qp1zXjSC-2PWHG91LimkY47Gf8UwrIw',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqoBwUDIMJI4MjMmEPoT32xorRn76EbwOfJ591HP2fD8yN74RtdA8ZgEEnze2ifyxVabL3gTgISOagsmbFhPVBdVJB2rQO4UiztObdT2TAcbpkFwOyRV8AWqhD9WSBMoz4rouZWcj5-YksfZB9JEIlG0MzmhEbUpc3AabzkiHm1ZK7n0dpJMkRZqOLDs36fDz1Waf6hTgSCKdFmNJ5X-AN3S4QFjV-JwEgmLIN70c1iPgVU8jdWKbUL7Rqy32VuI3uYGizoabtsHI3',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBiw78LAGiTnup7TK-Y8V2_4gASrW4YAUjBm3TEBn4kR0j6KJC4FCWqyeXhoPUzSGiCjHO3S7m9gObxUgtpaj38FoOA1wa1EE-kR9Yk_1jSDCJdhaz1D2PrTtVhCsuNBPuhOvdXNnp7ChqwVx24mvSAldhEyjKU-yBuUP3j4Q75qPWT7R2IpSnMbTeQYy-InsCLOJjTHs8u5TeIUA12j4WovLDmYwWmUTlpVgvijhEfh93GKk9bkxd2URKn1MzpPLml1ZpH9GVDTD8c',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCvvJkDWw6ZFK7XG3-zZssabFdcPx7ucS7Fi1Mx62g4lr9pHPMaup2Wywl5v9GcmqZ0O-vBRo-6FLacM0wnyQ2DPe-F20aLB72bl82YdEmZ-8d1AwoPfnpXH_MNTccZBxqa469XEbHIyKC7aUUjZAX85nfup-OMWnGOlbwUCHVkgvd9OWmaZLTR4nnpCehybjaFhAmtwpwIP8ZLxYa5THqNJDWBvTWap3LlFtGeXTTrb2kYy0a8_TDXjyvNNOFl5jR1CIPGeFJ3OHAi',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDeaH0u8V9_iRAZoQLNi6sU6Kgwp2IoRVZd14_YJlXSVLga4n4ChS5esGNop6m6rjmeDmeXh6cyKKv1o-h9oZo7BpZUcQmenzaBA8WZ90Xqq3KofKPN7_AIrI35U1PlnztsnQwwHlHvImRjfHaK_e34tOQaoHJwKPhZbieNlj-6Mft7ZGAkAvtX9UaDEZKMlDEF_Te52-XRwBW1LlbCSJo3_rh89ZTeeiSy0Ue8_xu48SRXArTnmBuB4YULuovO2fKcsY4zImj5fseY',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB5pWFJjVMA54KncLYN0DK2Av3grgpp5hqMaoU1PzLW5UfVTpZ-3-0RCuJvgNvP_NmXzZ9zAzhMVAxrdya5Ei3nwxIPJH7qL6SX4UNr5hmmTk5u1--GcU9FuJBgbfJ1vxquyzMpRdPw3LaVPfaSSmTtdrGJPkRu5a6zuMvWWpq7NYpeeFI8jMRUaQlSKOF4LVkwXtJxJFkn_2H4sEvYyffGZbQuBuGyq3Y-hcBpmBRLGWb6dL40VR_IAb5gEp4alYkj0DF8B5cvnjAu',
];

// Logo SVG组件
const LogoIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.38 3.32a1 1 0 0 0-1.1.28L13.5 9H11a1 1 0 0 0-1 1v2.5L4.72 17.78a1 1 0 0 0 .28 1.1l5.58 5.58a1 1 0 0 0 1.42 0l8.7-8.7a1 1 0 0 0 0-1.42L15 8.5V6a1 1 0 0 0 1-1h2.5l5.28-4.78a1 1 0 0 0-.4-1.9zm-8.8 11.28L6.42 19.5l-2.1-2.1L8.5 13.24l.58.58c.38.38 1.04.38 1.42 0l2.4-2.4c.38-.38.38-1.04 0-1.42L10.32 7.42 12.5 5.24l4.88 4.88-3.58 3.58a2.5 2.5 0 0 1-3.54 0zM22 2a1 1 0 0 0-1 1v2h-2a1 1 0 1 0 0 2h2v2a1 1 0 1 0 2 0v-2h2a1 1 0 1 0 0-2h-2V3a1 1 0 0 0-1-1z" />
  </svg>
);

// 格式化距离显示
const formatDistance = (distance) => {
  if (!distance) return '未知距离';
  // 如果是米，转换为公里
  if (distance > 1000) {
    return `${(distance / 1000).toFixed(1)}公里`;
  }
  return `${Math.round(distance)}米`;
};

// 获取评分颜色
const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
  return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
};

// 根据餐厅数据生成推荐理由
const generateReason = (restaurant, rank) => {
  const reasons = [];

  // 根据排名
  if (rank === 1) {
    reasons.push('今日首选推荐');
  } else if (rank <= 3) {
    reasons.push('热门推荐');
  }

  // 根据评分
  if (restaurant.score >= 90) {
    reasons.push('评分极高');
  } else if (restaurant.score >= 80) {
    reasons.push('好评如潮');
  }

  // 根据距离
  if (restaurant.distance === 0 || restaurant.distance < 500) {
    reasons.push('距离超近');
  } else if (restaurant.distance < 1000) {
    reasons.push('就在附近');
  }

  // 根据配送时间
  if (restaurant.delivery_time && restaurant.delivery_time <= 20) {
    reasons.push('快速送达');
  }

  // 根据价格
  if (restaurant.price_per_person && restaurant.price_per_person <= 30) {
    reasons.push('经济实惠');
  }

  // 根据菜系
  if (restaurant.cuisine) {
    reasons.push(`${restaurant.cuisine}风味`);
  }

  return reasons.slice(0, 2).join('，') || '为您精选';
};

// 餐厅卡片组件
const RestaurantCard = ({ restaurant, index, onClick }) => {
  // 提取数据，兼容多种字段格式
  const name = restaurant.name || restaurant.restaurant_name || '未知餐厅';
  const image = restaurant.image || restaurant.image_url;
  const score = restaurant.score; // AI智能评分 0-100
  const rating = restaurant.features?.rating || restaurant.rating || 0; // 用户评分 1-5
  const distance = restaurant.features?.distance || restaurant.distance;
  const deliveryTime = restaurant.delivery_time || restaurant.time;
  const reviewCount = restaurant.review_count || restaurant.reviews || '0';
  const pricePerPerson = restaurant.price_per_person;
  const cuisine = restaurant.cuisine;
  const rank = restaurant.rank;

  // AI推荐理由：优先使用后端返回的，否则生成一个
  const reason = restaurant.recommendation_reason || restaurant.reason || generateReason(restaurant, rank);
  const confidence = restaurant.confidence_score;

  return (
    <div
      className="flex flex-col gap-3 pb-3 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => onClick(restaurant)}
    >
      {/* 图片区域 */}
      <div className="relative">
        <div
          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl"
          style={{ backgroundImage: `url("${image || defaultImages[index % defaultImages.length]}")` }}
        />
        {/* AI评分角标 */}
        {score !== undefined && (
          <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg font-bold text-sm ${getScoreColor(score)}`}>
            {Math.round(score)}分
          </div>
        )}
        {/* 排名角标 */}
        {rank && rank <= 3 && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-lg font-bold text-sm bg-primary text-white">
            TOP {rank}
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div>
        <div className="flex items-center gap-2">
          <p className="text-slate-900 dark:text-white text-base font-bold leading-normal">
            {name}
          </p>
          {cuisine && (
            <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
              {cuisine}
            </span>
          )}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal">
          {rating > 0 && `${rating.toFixed(1)} ★`}
          {deliveryTime && ` · ${deliveryTime}分钟`}
          {distance !== undefined && distance > 0 && ` · ${formatDistance(distance)}`}
          {pricePerPerson && ` · ¥${pricePerPerson}/人`}
        </p>

        {/* AI推荐理由 */}
        <p className="text-primary/80 dark:text-primary text-sm font-medium leading-normal mt-1 line-clamp-2">
          💡 {reason}
        </p>

        {/* 置信度指示器 */}
        {confidence !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-slate-400">推荐置信度:</span>
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(confidence * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{Math.round(confidence * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 筛选按钮组件
const FilterButton = ({ icon, label, isActive = false }) => (
  <button
    className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 ${isActive
      ? 'bg-primary/10 dark:bg-primary/20 text-primary'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
      }`}
  >
    <span className="material-symbols-outlined text-base">{icon}</span>
    <p className="text-sm font-medium leading-normal">{label}</p>
    <span className="material-symbols-outlined text-base">expand_more</span>
  </button>
);

export default function Home() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workflowExplanation, setWorkflowExplanation] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // 尝试读取用户信息，如果没有则为空对象
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // 获取当前位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('定位成功:', position.coords.latitude, position.coords.longitude);
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationError(null);
        },
        (err) => {
          // 详细的错误信息
          let errorMsg = '无法获取位置';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMsg = '用户拒绝了位置权限';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMsg = '位置信息不可用';
              break;
            case err.TIMEOUT:
              errorMsg = '获取位置超时';
              break;
            default:
              errorMsg = '未知错误';
          }
          console.error('获取位置失败:', errorMsg, err);
          setLocationError(errorMsg + '，使用默认位置');
          // 使用默认位置（北京）
          setLocation({
            latitude: 39.9042,
            longitude: 116.4074,
          });
        },
        {
          enableHighAccuracy: false,  // 改为false，提高成功率
          timeout: 15000,  // 增加超时时间
          maximumAge: 300000, // 5分钟缓存
        }
      );
    } else {
      setLocationError('浏览器不支持定位');
      // 使用默认位置
      setLocation({
        latitude: 39.9042,
        longitude: 116.4074,
      });
    }
  }, []);

  // 加载主页推荐（位置获取后触发）
  useEffect(() => {
    if (!location) return; // 等待位置获取完成

    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        let restaurantList = [];

        // 优先尝试智能推荐服务（会自动将真实餐厅导入数据库）
        try {
          console.log('尝试调用智能推荐服务...');
          const data = await recommendationService.getV2Recommendations({
            userId: user.id || user.userId,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address || '北京市朝阳区建国门外大街',
            query: '为我推荐附近的美食',
            maxResults: 10,
          });

          const recommendations = data.recommendations || data.restaurants || (Array.isArray(data) ? data : []);
          if (recommendations.length > 0) {
            console.log('智能推荐服务返回数据:', recommendations);
            restaurantList = recommendations.map((r, index) => ({
              id: r.id || r.external_id || r.externalId,
              externalId: r.id || r.external_id || r.externalId,
              name: r.name || r.restaurant_name || '未知餐厅',
              image: r.image || r.image_url || r.imageUrl || defaultImages[index % defaultImages.length],
              rating: r.rating || 4.5,
              score: r.final_score || r.match_score || r.score,
              deliveryTime: r.delivery_time ? `${r.delivery_time}分钟` : (r.deliveryTime || '30-45分钟'),
              deliveryFee: r.delivery_fee || r.deliveryFee || 5,
              tags: r.tags?.length > 0 ? r.tags : (r.cuisine_type ? [r.cuisine_type] : (r.cuisine ? [r.cuisine] : ['美食'])),
              cuisine: r.cuisine_type || r.cuisine,
              description: r.description || r.recommendation_reason || r.reason || '',
              address: r.address || r.location?.address || '',
              distance: r.distance || r.features?.distance,
              reason: r.recommendation_reason || r.reason || r.match_reasons?.[0],
              rank: r.rank || (index + 1),
              avgPrice: r.avg_price || r.avgPrice,
              tel: r.tel || r.phone,
              isHotFood: r.is_hot_food,
              spiceLevel: r.spice_level,
            }));
          }
        } catch (recErr) {
          console.warn('智能推荐服务调用失败:', recErr.message);
        }

        // 如果智能推荐没有数据，从商家服务获取基本数据作为备选
        if (restaurantList.length === 0) {
          console.log('智能推荐无数据，从商家服务获取备选数据...');
          const knownMerchantIds = [1, 2, 3];

          const merchantPromises = knownMerchantIds.map(async (id) => {
            try {
              const merchant = await merchantService.getMerchantById(id);
              return {
                id: merchant.id,
                merchantId: merchant.id,
                name: merchant.name || merchant.businessName || '未知餐厅',
                image: merchant.imageUrl || merchant.logo || defaultImages[id % defaultImages.length],
                rating: merchant.rating || 4.5,
                deliveryTime: merchant.deliveryTime || '30-45分钟',
                deliveryFee: merchant.deliveryFee || 5,
                tags: merchant.tags || (merchant.cuisineType ? [merchant.cuisineType] : ['美食']),
                description: merchant.description || '',
                address: merchant.address || '',
              };
            } catch (err) {
              console.warn(`获取商家 ${id} 失败:`, err.message);
              return null;
            }
          });

          const merchants = await Promise.all(merchantPromises);
          restaurantList = merchants.filter(m => m !== null);
          console.log('从商家服务获取的备选数据:', restaurantList);
        }

        setRestaurants(restaurantList);
      } catch (err) {
        console.error('加载推荐失败:', err);
        setError('加载推荐失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [location, user.id, user.userId]);

  // 加载工作流说明
  useEffect(() => {
    const loadWorkflowExplanation = async () => {
      try {
        const data = await recommendationService.getWorkflowExplanation();
        setWorkflowExplanation(data);
      } catch (err) {
        console.error('加载工作流说明失败:', err);
      }
    };

    loadWorkflowExplanation();
  }, []);

  // 智能搜索
  const handleSmartSearch = async () => {
    if (!searchValue.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const data = await recommendationService.getV2Recommendations({
        userId: user.id || user.userId,
        query: searchValue,
        latitude: location?.latitude,
        longitude: location?.longitude,
        address: location?.address || '北京市朝阳区建国门外大街',
        maxResults: 10,
      });

      // 处理返回数据，字段映射与首页加载一致
      const recommendations = data.recommendations || data.restaurants || (Array.isArray(data) ? data : []);
      if (recommendations.length > 0) {
        const restaurantList = recommendations.map((r, index) => ({
          id: r.id || r.external_id || r.externalId,
          externalId: r.id || r.external_id || r.externalId,
          name: r.name || r.restaurant_name || '未知餐厅',
          image: r.image || r.image_url || r.imageUrl || defaultImages[index % defaultImages.length],
          rating: r.rating || 4.5,
          score: r.final_score || r.match_score || r.score,
          deliveryTime: r.delivery_time ? `${r.delivery_time}分钟` : (r.deliveryTime || '30-45分钟'),
          deliveryFee: r.delivery_fee || r.deliveryFee || 5,
          tags: r.tags?.length > 0 ? r.tags : (r.cuisine_type ? [r.cuisine_type] : (r.cuisine ? [r.cuisine] : ['美食'])),
          cuisine: r.cuisine_type || r.cuisine,
          description: r.description || r.recommendation_reason || r.reason || '',
          address: r.address || r.location?.address || '',
          distance: r.distance || r.features?.distance,
          reason: r.recommendation_reason || r.reason || r.match_reasons?.[0],
          rank: r.rank || (index + 1),
          avgPrice: r.avg_price || r.avgPrice,
          tel: r.tel || r.phone,
        }));
        setRestaurants(restaurantList);
      } else {
        setError('未找到相关餐厅');
      }
    } catch (err) {
      console.error('智能搜索失败:', err);
      setError('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 按回车键触发搜索
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSmartSearch();
    }
  };

  // 点击餐厅卡片跳转到详情页
  const handleRestaurantClick = (restaurant) => {
    // 使用餐厅的ID（可以是数字ID或外部ID）
    // 后端会自动处理两种类型的ID
    const restaurantId = restaurant.id || restaurant.restaurant_id || restaurant.externalId || Date.now();
    navigate(`/restaurant/${restaurantId}`, { state: { restaurant } });
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark">
      <div className="relative flex min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <div className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-full max-w-6xl flex-1">
              {/* Header */}
              <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center gap-4 text-slate-900 dark:text-white">
                  <div className="size-6 text-primary">
                    <LogoIcon />
                  </div>
                  <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    智能外卖
                  </h2>
                </div>
                <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
                  <div className="flex items-center gap-9">
                    <a className="text-primary text-sm font-bold leading-normal cursor-pointer">
                      主页
                    </a>
                    <a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal cursor-pointer">
                      订单
                    </a>
                    <a
                      className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium leading-normal cursor-pointer"
                      onClick={() => navigate('/profile')}
                    >
                      个人中心
                    </a>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em]"
                  >
                    <span className="truncate">退出登录</span>
                  </button>
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                    style={{
                      backgroundImage:
                        'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA7xbrTPK3aCd4PDIKq2AT7bRc0KpD0xZa_UqqWMz3b7SPKPEGpZJcaHcO2aFmc_78Izaw1NM4YMTBbAuqF5gx5LHgXz-XoyKmk5NPMGEqFY1OrQsBKeUDhheBGlboloUwwozFAw4l1yXsGy3Bc0Wns-f-EoeKcroELnQbCVn7-RBUCpqBUFGl7cszblnAfa0pAlz6SMtMcv9J5tRrxQ5GUpcfgmHiEOVh85cMamkMDX4KlsQuukOOv_NhVEFKccxq2ITUq6u1ctj5p")',
                    }}
                  />
                </div>
                <button
                  className="md:hidden text-slate-800 dark:text-slate-200"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="material-symbols-outlined">menu</span>
                </button>
              </header>

              {/* Mobile Menu */}
              {mobileMenuOpen && (
                <div className="md:hidden flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <a className="text-primary text-sm font-bold leading-normal cursor-pointer">
                    主页
                  </a>
                  <a className="text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium leading-normal cursor-pointer">
                    订单
                  </a>
                  <a
                    className="text-slate-500 dark:text-slate-400 hover:text-primary text-sm font-medium leading-normal cursor-pointer"
                    onClick={() => navigate('/profile')}
                  >
                    个人中心
                  </a>
                  <button
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal"
                  >
                    退出登录
                  </button>
                </div>
              )}

              {/* Main Content */}
              <main className="flex-1">
                {/* Welcome Section */}
                <div className="flex flex-col gap-4 p-4 mt-8 mb-4">
                  <p className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                    今天想吃点什么, {user.username || '小明'}?
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-normal">
                    搜索餐厅、菜系或菜品，开启您的美食之旅！
                  </p>
                </div>

                {/* Search Bar */}
                <div className="px-4 py-3">
                  <label className="flex flex-col min-w-40 h-14 w-full">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm">
                      <div className="text-slate-500 dark:text-slate-400 flex border-none bg-white dark:bg-slate-800 items-center justify-center pl-4 rounded-l-xl border-r-0">
                        <span className="material-symbols-outlined">search</span>
                      </div>
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-slate-900 dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-white dark:bg-slate-800 h-full placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 text-base font-normal leading-normal"
                        placeholder="搜索餐厅、菜系或菜品..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                      />
                      <button
                        onClick={handleSmartSearch}
                        className="bg-primary text-white px-6 rounded-r-xl hover:bg-primary/90 transition-colors font-medium"
                      >
                        智能搜索
                      </button>
                    </div>
                  </label>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-3 p-4 overflow-x-auto">
                  <FilterButton icon="swap_vert" label="排序" isActive />
                  <FilterButton icon="restaurant_menu" label="菜系" />
                  <FilterButton icon="payments" label="价格范围" />
                  <FilterButton icon="sell" label="优惠活动" />
                </div>

                {/* Workflow Explanation */}
                {workflowExplanation && (
                  <div className="mx-4 mb-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-primary">smart_toy</span>
                      <p className="text-slate-900 dark:text-white font-medium">智能推荐系统</p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      {workflowExplanation.description || workflowExplanation.message || '多智能体协同为您提供个性化推荐'}
                    </p>
                  </div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="mx-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
                  </div>
                )}

                {/* Restaurant Grid */}
                {!loading && !error && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
                    {restaurants.length > 0 ? (
                      restaurants.map((restaurant, index) => (
                        <RestaurantCard
                          key={restaurant.id || index}
                          restaurant={restaurant}
                          index={index}
                          onClick={handleRestaurantClick}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600">restaurant</span>
                        <p className="text-slate-500 dark:text-slate-400 mt-4">暂无推荐，试试搜索吧！</p>
                      </div>
                    )}
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}