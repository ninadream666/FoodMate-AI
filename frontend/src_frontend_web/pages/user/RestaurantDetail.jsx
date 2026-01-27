import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';
import { merchantService } from '../../services/merchantService';

// 默认菜品图片
const defaultDishImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAsKKNZeioee-JViVf_SBcbT3rBBvZu4DRFaNV6zHlXtXEjC2CNTIsAmJI7F9lgIkkqvLI7GQ6aPH6dVIVSJYKiHlfzeJz8XvF7xFAKjKqhEaRfTu-NLionE8GH6f18T0nyhqQZK-DJTCPCdctLKhSoQdXHd52-CSkDC81U5LPnZtqdpW9a81FBB9suOIFC2VSfFJpnsmbj7pDYXC2LSYX9H8h_XhM49_8PrKxP1JwsEgNlm_YYWEv_4lAJqN8e8_e-8meysrlbEIft',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuArCT0tj8J-e9yyH422cU_NzNiA-NddrGRXaqEsw_wDvT0Mfni_KyoPn4p67_giN4rSkQZtFbs7Ux4aXNhyex6eHWl7unFR6hnY5UYTRL6o6FFWvBW7RkN1sv8RV1lbha5nw4TSyXCL-Pq_-T8AU-3FeEXG4pE28kcIbaFgax8AgNH6IvNz5qXRAWZCsxsRhTBgAb9j_K-geaS9JOC_fJ_SE_CQjuC853-wPcMyXNIxccqxOLQ12OnzRLOtnJCaWHd5N_zxUN8Mv6Jc',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB-0VSqIQV4-9Ko_x1tvhkgdfoCsNbgkiTrmM3x6q4T3cMyhSoQfYMCbbP6KWpzHHT9ZqYUZDUSoIlSS56E6-H9oGmYOl61x_krUAj6jsOTyJZdqZewABlPwfVlvnpY3jy64qFOzx0Loq1QL-WCVmd4f9BTmPdvwADLID9Tels6BkbJolRdgyL2hEfjhYM23Zb_WJLilGWsJD63B9HTErJWQDBG0MLsjL6HcLtKZXSbzVG_lJYSEp4Kcla4gHbteLtmGq8wK3Ma6elT',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCJwBfnU_n249oVyx5A6CotTn61BrGduL4_2x8s7XfJWIfWOWrrJhhHIQGuWZq6ayDyWJ1j3Fuo9-l2qwYQ8D5Kmydf8VQb1Icw7iKgyqGsWbEMXP3P8ftdc74u-f5SOvFKbvS-NATOn49b9odlYVxKRyHBOpoTdviAo23Ou82yswo9pt4DPpEknPPIj9JvXy5UYYTt7ZBeYw3k8bjPe_SXi9h2XgOTb1KseauQG8HnF8P6BFU3lXKMSYUnGgAKR9B4kokH6kxzk6Gh',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBSroOIQhpG_n6b9902h2XlvX5H1f8JTb70cIRSXUwhI-N39_-fBYcRbicgfNfXqTOFyw1qaWbbEaCI1zfX4WgE24ggcVuq91SF7qdRFgBOcm6w3autwhHkpTgrSAYvtHAH3nPCD48p74iUUCXc3axrl0UORCPBkEaMj0unQvSQdvMuV0MgMdsNIoa6l8GKgsALKNEWUApENCp6f_VhaOacIXpBXAEGAuIWT1kQ_3QPs_OalIuNSX8-s9jsMpUCk8PhVzjbtX3p6LXi',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC-BKra1jio1aUw9R5dmyc0V4Ny1apgnVujdbt_nNSmbdJaZUBWxKzFp_OGnGw90MLbZw2wxx0skAeq7Z-6VbabGyvWdWzb_yHNsgwmkwob0afIR3sQO3zejmltoSrAFfcNrq5VFLeiyu_RP3tRlmdmaKA77kLxCKaqFvNasw3zj7vhnhzZ5R5rNDdHfzZTpUskVw3h0MeEbOS-yUobNMUcOYirtscya3Nf918Vg8yPwBMiXkr7dlqMh2gXLKtEslaKf7D4RTRYhQoU',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCurCx0DUjV08Nr1lEAr0IeJOGUQmMOVCVcX8UeOmXhlLW1aHvq8xKjjDHy7n9Q8YgRr24bgqp_fw5qfPaPT__lK3VrxLa_2Sm_AwQgRonCYVhD6JeNJREDgaqBAFraybKP0c91SJxBwLUQ2WUOKHesFDkN-ffqYQmv5vy5RwTulQ4s3Zg1kaFI_ZQhiveiuwYVC-NEM1V2sbaQtNqTou9JBeMF8AIJfVr0IQlQ_wQyvSPOjVRHycYJPPxC2gkB9wSwl_rnGz3Voh2l',
];

// 默认餐厅封面图
const defaultRestaurantBanner = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi1x7oY0FXNEp2rA4ZKSIekCchyOzmlBuQ2U3zBsIxf7H_22Z2TN5PXlU_MvXDq6YDwd-bvFkm3xZwTBJphMP2u5kiiY-GMNV0fVXVdwOeGpzyjT7vAb8tManSlg_X8CoSSJz3U7asD4-TLK_v5WV3-uK_CASFvKLLlfGsXErbcE5MR2QkRtiWWtS3XTy1NzNmVraVD6hG-YKo9DGVc3W1bJQV2Eq7ulYuCgMlKXJbFB7kKsV86mL7D5xTC0A0RxSKukeixjO3lYAf';

// 将后端菜单数据按分类组织
const organizeMenuByCategory = (menuItems) => {
    const categories = {
        mainCourses: [],
        appetizers: [],
        drinks: [],
        desserts: [],
        other: [],
    };

    // 中文分类映射
    const categoryMap = {
        '主食': 'mainCourses',
        '主菜': 'mainCourses',
        '面食': 'mainCourses',
        '饭类': 'mainCourses',
        '小吃': 'appetizers',
        '前菜': 'appetizers',
        '开胃菜': 'appetizers',
        '饮品': 'drinks',
        '饮料': 'drinks',
        '奶茶': 'drinks',
        '甜点': 'desserts',
        '甜品': 'desserts',
        '蛋糕': 'desserts',
    };

    menuItems.forEach((item, index) => {
        const categoryKey = categoryMap[item.category] || 'other';
        categories[categoryKey].push({
            id: item.id,
            merchantId: item.merchantId, // 保留商家ID，用于创建订单
            name: item.name,
            price: item.price,
            description: item.description || '',
            category: item.category,
            imageUrl: item.imageUrl || defaultDishImages[index % defaultDishImages.length],
            available: item.available !== false,
        });
    });

    return categories;
};

// 根据菜系类型生成模拟菜品数据
const CUISINE_MENUS = {
    '火锅': {
        mainCourses: [
            { id: 1, name: '麻辣锅底', description: '经典川味麻辣锅底，鲜香麻辣', price: 68.00 },
            { id: 2, name: '番茄锅底', description: '新鲜番茄熬制，酸甜开胃', price: 58.00 },
            { id: 3, name: '菌汤锅底', description: '多种菌菇熬制，营养丰富', price: 78.00 },
        ],
        appetizers: [
            { id: 4, name: '精品肥牛卷', description: '优质牛肉，入锅即熟', price: 48.00 },
            { id: 5, name: '鲜切羊肉', description: '新鲜羊肉，肉质鲜嫩', price: 52.00 },
            { id: 6, name: '虾滑', description: '手工制作，Q弹爽口', price: 38.00 },
        ],
        drinks: [
            { id: 7, name: '酸梅汤', description: '解腻开胃', price: 8.00 },
            { id: 8, name: '王老吉', description: '清热降火', price: 6.00 },
        ],
        desserts: [
            { id: 9, name: '冰粉', description: '清凉解暑，配红糖和花生', price: 12.00 },
        ],
        other: [],
    },
    '川菜': {
        mainCourses: [
            { id: 1, name: '麻婆豆腐', description: '经典川味，麻辣鲜香', price: 28.00 },
            { id: 2, name: '水煮鱼', description: '鲜鱼片配麻辣汤底', price: 68.00 },
            { id: 3, name: '回锅肉', description: '五花肉配蒜苗，咸鲜微辣', price: 38.00 },
        ],
        appetizers: [
            { id: 4, name: '口水鸡', description: '麻辣鲜香，开胃凉菜', price: 32.00 },
            { id: 5, name: '夫妻肺片', description: '经典川味凉菜', price: 35.00 },
        ],
        drinks: [
            { id: 6, name: '冰镇酸梅汤', description: '解辣解腻', price: 8.00 },
        ],
        desserts: [
            { id: 7, name: '红糖糍粑', description: '软糯香甜', price: 18.00 },
        ],
        other: [],
    },
    '粤菜': {
        mainCourses: [
            { id: 1, name: '白切鸡', description: '皮爽肉滑，原汁原味', price: 58.00 },
            { id: 2, name: '清蒸鲈鱼', description: '鲜活鲈鱼，清蒸鲜嫩', price: 88.00 },
            { id: 3, name: '烧鹅', description: '皮脆肉嫩，肥而不腻', price: 68.00 },
        ],
        appetizers: [
            { id: 4, name: '虾饺皇', description: '晶莹剔透，鲜虾饱满', price: 32.00 },
            { id: 5, name: '叉烧包', description: '松软香甜，叉烧鲜美', price: 22.00 },
        ],
        drinks: [
            { id: 6, name: '柠檬茶', description: '港式冻柠茶', price: 12.00 },
        ],
        desserts: [
            { id: 7, name: '杨枝甘露', description: '芒果椰汁西米露', price: 28.00 },
        ],
        other: [],
    },
    '日料': {
        mainCourses: [
            { id: 1, name: '三文鱼刺身', description: '新鲜三文鱼，入口即化', price: 78.00 },
            { id: 2, name: '鳗鱼饭', description: '蒲烧鳗鱼配米饭', price: 68.00 },
            { id: 3, name: '寿司拼盘', description: '多种口味寿司组合', price: 88.00 },
        ],
        appetizers: [
            { id: 4, name: '味噌汤', description: '经典日式味噌汤', price: 12.00 },
            { id: 5, name: '炸鸡块', description: '日式炸鸡，外酥里嫩', price: 28.00 },
        ],
        drinks: [
            { id: 6, name: '抹茶', description: '日式抹茶', price: 18.00 },
        ],
        desserts: [
            { id: 7, name: '抹茶冰淇淋', description: '浓郁抹茶味', price: 22.00 },
        ],
        other: [],
    },
    'default': {
        mainCourses: [
            { id: 1, name: '招牌特色菜', description: '本店招牌，强烈推荐', price: 48.00 },
            { id: 2, name: '红烧肉', description: '肥瘦相间，入口即化', price: 38.00 },
            { id: 3, name: '糖醋里脊', description: '外酥里嫩，酸甜可口', price: 35.00 },
        ],
        appetizers: [
            { id: 4, name: '凉拌黄瓜', description: '爽脆开胃', price: 12.00 },
            { id: 5, name: '花生米', description: '油炸花生，香脆可口', price: 8.00 },
        ],
        drinks: [
            { id: 6, name: '可乐', description: '冰镇可口可乐', price: 5.00 },
            { id: 7, name: '柠檬水', description: '新鲜柠檬', price: 8.00 },
        ],
        desserts: [
            { id: 8, name: '水果拼盘', description: '时令鲜果', price: 28.00 },
        ],
        other: [],
    },
};

// 模拟菜品数据（当 API 不可用时使用，根据菜系类型生成）
const generateMockMenuData = (restaurantName, cuisineType) => {
    // 根据菜系类型或餐厅名称匹配菜单
    let menu = CUISINE_MENUS['default'];

    const cuisineLower = (cuisineType || restaurantName || '').toLowerCase();

    if (cuisineLower.includes('火锅') || cuisineLower.includes('hotpot')) {
        menu = CUISINE_MENUS['火锅'];
    } else if (cuisineLower.includes('川') || cuisineLower.includes('麻辣') || cuisineLower.includes('sichuan')) {
        menu = CUISINE_MENUS['川菜'];
    } else if (cuisineLower.includes('粤') || cuisineLower.includes('港') || cuisineLower.includes('茶餐厅') || cuisineLower.includes('cantonese')) {
        menu = CUISINE_MENUS['粤菜'];
    } else if (cuisineLower.includes('日') || cuisineLower.includes('寿司') || cuisineLower.includes('刺身') || cuisineLower.includes('japanese')) {
        menu = CUISINE_MENUS['日料'];
    }

    console.log('根据菜系生成模拟菜单:', cuisineType || restaurantName, '→', menu === CUISINE_MENUS['default'] ? '默认菜单' : '特色菜单');
    return menu;
};

// 菜品卡片组件
const DishCard = ({ dish, index, onAddToCart }) => {
    return (
        <div className="flex gap-4 rounded-xl p-4 bg-white dark:bg-[#2a2218] border border-transparent hover:border-[#f3ede7] dark:hover:border-[#3a3024] transition-all">
            <div className="flex-1 flex flex-col">
                <h3 className="font-bold text-base text-[#1b140d] dark:text-white">{dish.name}</h3>
                <p className="text-sm text-[#9a734c] dark:text-gray-400 mt-1 flex-grow">{dish.description}</p>
                <p className="font-bold text-base text-[#1b140d] dark:text-gray-200 mt-2">¥{dish.price.toFixed(2)}</p>
            </div>
            <div className="relative w-32 h-32 flex-shrink-0">
                <div
                    className="w-full h-full bg-cover bg-center rounded-lg"
                    style={{ backgroundImage: `url('${defaultDishImages[index % defaultDishImages.length]}')` }}
                />
                <button
                    onClick={() => onAddToCart(dish)}
                    className="absolute -bottom-2 -right-2 flex min-w-[36px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-9 w-9 bg-primary text-white text-lg font-bold leading-normal tracking-[0.015em] shadow-lg hover:opacity-90"
                >
                    <span className="material-symbols-outlined !text-2xl">add</span>
                </button>
            </div>
        </div>
    );
};

// 菜品分类区域组件
const MenuSection = ({ id, title, dishes, onAddToCart }) => {
    return (
        <section className="mb-10" id={id}>
            <h2 className="text-[#1b140d] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
                {title}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dishes.map((dish, index) => (
                    <DishCard key={dish.id} dish={dish} index={index} onAddToCart={onAddToCart} />
                ))}
            </div>
        </section>
    );
};

// 分类导航组件
const CategoryNav = ({ activeCategory, onCategoryClick }) => {
    const categories = [
        { id: 'main-courses', label: '主食 (Main Courses)' },
        { id: 'appetizers', label: '小吃 (Appetizers)' },
        { id: 'drinks', label: '饮品 (Drinks)' },
        { id: 'desserts', label: '甜点 (Desserts)' },
    ];

    return (
        <aside className="w-56 sticky top-24 self-start hidden md:block">
            <nav className="flex flex-col gap-2">
                {categories.map((category) => (
                    <a
                        key={category.id}
                        href={`#${category.id}`}
                        onClick={(e) => {
                            e.preventDefault();
                            onCategoryClick(category.id);
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeCategory === category.id
                            ? 'bg-primary/20 text-primary font-semibold'
                            : 'text-[#1b140d] dark:text-gray-300 hover:bg-primary/20 hover:text-primary dark:hover:bg-primary/20'
                            }`}
                    >
                        {category.label}
                    </a>
                ))}
            </nav>
        </aside>
    );
};

export default function RestaurantDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // 从路由状态获取餐厅数据，或使用默认数据
    const restaurantFromState = location.state?.restaurant;
    // 从购物车页面返回时，恢复购物车数据
    const cartFromState = location.state?.cartItems || [];

    const [restaurant, setRestaurant] = useState(restaurantFromState || null);
    const [menuData, setMenuData] = useState(null);
    const [activeCategory, setActiveCategory] = useState('main-courses');
    const [cartItems, setCartItems] = useState(cartFromState);
    const [loading, setLoading] = useState(!restaurantFromState);

    // 计算购物车商品总数
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // 加载餐厅数据
    useEffect(() => {
        const loadRestaurantData = async () => {
            try {
                // 使用路由参数中的 ID（可以是数字ID或外部ID如 B0LDM1F2K5）
                // 后端会自动处理两种类型的 ID
                const merchantId = id;

                // 如果没有从路由状态获取到餐厅数据，从 API 加载
                if (!restaurantFromState) {
                    try {
                        const merchantData = await merchantService.getMerchantById(merchantId);
                        setRestaurant(merchantData);
                    } catch (error) {
                        console.warn('获取餐厅信息失败，使用默认数据:', error.message);
                        setRestaurant({
                            id: id,
                            name: 'Gourmet Burger Kitchen',
                            cuisine: 'Burgers, American, Fast Food',
                            rating: 4.5,
                            reviewCount: '500+',
                            address: '123 Flavor Town Ave',
                            openUntil: '10:00 PM',
                            image: defaultRestaurantBanner,
                        });
                    }
                }

                // 从 API 加载菜单数据
                try {
                    console.log('正在加载菜单，merchantId:', merchantId);
                    const menuItems = await merchantService.getPublicMenu(merchantId);
                    console.log('API 返回的菜单数据:', menuItems);

                    if (menuItems && menuItems.length > 0) {
                        console.log('使用 API 返回的真实菜单，共', menuItems.length, '个菜品');
                        const organizedMenu = organizeMenuByCategory(menuItems);
                        setMenuData(organizedMenu);
                    } else {
                        // 没有菜单数据时，根据菜系类型使用模拟数据
                        console.warn('API 返回菜单为空，使用模拟数据');
                        const cuisineType = restaurant?.cuisine || restaurant?.cuisineType || restaurantFromState?.cuisine || restaurantFromState?.tags?.[0];
                        const menu = generateMockMenuData(restaurant?.name || 'Restaurant', cuisineType);
                        setMenuData(menu);
                    }
                } catch (error) {
                    console.warn('获取菜单失败，使用模拟数据:', error.message);
                    const cuisineType = restaurant?.cuisine || restaurant?.cuisineType || restaurantFromState?.cuisine || restaurantFromState?.tags?.[0];
                    const menu = generateMockMenuData(restaurant?.name || 'Restaurant', cuisineType);
                    setMenuData(menu);
                }
            } catch (error) {
                console.error('加载餐厅数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        loadRestaurantData();
    }, [id, restaurantFromState, restaurant?.name]);

    // 处理分类点击
    const handleCategoryClick = (categoryId) => {
        setActiveCategory(categoryId);
        const element = document.getElementById(categoryId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // 添加到购物车
    const handleAddToCart = (dish) => {
        setCartItems((prev) => {
            const existingItem = prev.find((item) => item.id === dish.id);
            if (existingItem) {
                // 如果商品已存在，增加数量
                return prev.map((item) =>
                    item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                // 如果商品不存在，添加新商品
                return [...prev, { ...dish, quantity: 1, image: defaultDishImages[dish.id % defaultDishImages.length] }];
            }
        });
        console.log('添加到购物车:', dish);
    };

    // 跳转到购物车页面
    const handleGoToCart = () => {
        navigate('/cart', {
            state: {
                cartItems,
                restaurant: restaurant || { id, name: 'Gourmet Burger Kitchen' }
            }
        });
    };

    // 退出登录
    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    // 获取餐厅信息
    const restaurantName = restaurant?.name || restaurant?.restaurant_name || 'Gourmet Burger Kitchen';
    const restaurantCuisine = restaurant?.cuisine || 'Burgers, American, Fast Food';
    const restaurantRating = restaurant?.rating || restaurant?.features?.rating || 4.5;
    const restaurantReviewCount = restaurant?.reviewCount || restaurant?.review_count || '500+';
    const restaurantAddress = restaurant?.address || '123 Flavor Town Ave';
    const restaurantOpenUntil = restaurant?.openUntil || '10:00 PM';
    const restaurantImage = restaurant?.image || restaurant?.image_url || defaultRestaurantBanner;

    return (
        <div className="bg-background-light dark:bg-background-dark font-display">
            <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
                <div className="layout-container flex h-full grow flex-col">
                    {/* TopNavBar */}
                    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f3ede7] dark:border-b-[#2a2218] px-10 py-3 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
                        <div className="flex items-center gap-8">
                            <div
                                className="flex items-center gap-4 text-[#1b140d] dark:text-white cursor-pointer"
                                onClick={() => navigate('/home')}
                            >
                                <div className="size-6 text-primary">
                                    <span className="material-symbols-outlined !text-4xl">fastfood</span>
                                </div>
                                <h2 className="text-[#1b140d] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
                                    Food Delivery
                                </h2>
                            </div>
                        </div>
                        <div className="flex flex-1 justify-end gap-8">
                            <div className="flex items-center gap-9">
                                <a
                                    className="text-[#1b140d] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary cursor-pointer"
                                    onClick={() => navigate('/home')}
                                >
                                    Home
                                </a>
                                <a className="text-[#1b140d] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary cursor-pointer">
                                    Restaurants
                                </a>
                                <a className="text-[#1b140d] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary cursor-pointer">
                                    Deals
                                </a>
                                <a className="text-[#1b140d] dark:text-gray-300 text-sm font-medium leading-normal hover:text-primary dark:hover:text-primary cursor-pointer">
                                    My Orders
                                </a>
                            </div>
                            <div className="flex gap-4 items-center">
                                <button
                                    onClick={handleGoToCart}
                                    className="relative flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f3ede7] dark:bg-[#2a2218] text-[#1b140d] dark:text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-primary/20"
                                >
                                    <span className="material-symbols-outlined">shopping_cart</span>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                                <div
                                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 cursor-pointer"
                                    style={{
                                        backgroundImage:
                                            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBKGELqdfs5yuetg_flyAXgdEBpQelUVT3G-w_sxZ7ijvXjzxdCBlmC1R1m4wmteYXFl6edVfo6DUwINK3vGfSdZa4jQjsu7ajF71arU3HiC_avC9rPqg_HwXfirnFntRUdaw3hR2w34zzbg6SlOhiVxXM5uOfUB3PjqnkH57OTSOhQZ81rIq56wsPV5l6xIq5MVDQHtji2wKKfQaLL1T_n4SVcEq0RiC6nd5DjdrWRfybzP7KHW-wXLH7ZsvjgkeAQ1EtO1bUTcyra")',
                                    }}
                                    onClick={() => navigate('/profile')}
                                />
                            </div>
                        </div>
                    </header>

                    <main className="px-10 flex flex-1 justify-center py-5">
                        <div className="layout-content-container flex flex-col w-full max-w-[1280px] flex-1">
                            {/* 返回按钮 */}
                            <button
                                onClick={() => navigate('/home')}
                                className="flex items-center gap-2 text-[#9a734c] dark:text-gray-400 hover:text-primary mb-4 self-start"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                <span>返回首页</span>
                            </button>

                            {/* HeaderImage */}
                            <div className="@container">
                                <div
                                    className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-xl min-h-[320px]"
                                    style={{ backgroundImage: `url("${restaurantImage}")` }}
                                />
                            </div>

                            {/* PageHeading */}
                            <div className="flex flex-wrap justify-between gap-3 p-4 mt-4">
                                <div className="flex min-w-72 flex-col gap-2">
                                    <p className="text-[#1b140d] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                        {restaurantName}
                                    </p>
                                    <p className="text-[#9a734c] dark:text-gray-400 text-base font-normal leading-normal">
                                        {restaurantCuisine}
                                    </p>
                                </div>
                            </div>

                            {/* MetaText */}
                            <div className="flex items-center gap-4 text-[#9a734c] dark:text-gray-400 text-sm font-normal leading-normal pb-3 pt-1 px-4 border-b border-b-[#f3ede7] dark:border-b-[#2a2218]">
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-base text-primary">star</span>
                                    <span>{restaurantRating} ({restaurantReviewCount} ratings)</span>
                                </div>
                                <span className="text-[#e0d9d1] dark:text-[#44382c]"> • </span>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-base">location_on</span>
                                    <span>{restaurantAddress}</span>
                                </div>
                                <span className="text-[#e0d9d1] dark:text-[#44382c]"> • </span>
                                <div className="flex items-center gap-1">
                                    <span className="material-symbols-outlined !text-base">schedule</span>
                                    <span>Open until {restaurantOpenUntil}</span>
                                </div>
                            </div>

                            <div className="flex flex-grow gap-8 mt-8">
                                {/* Sticky Category Navigation */}
                                <CategoryNav activeCategory={activeCategory} onCategoryClick={handleCategoryClick} />

                                {/* Menu Section */}
                                <div className="flex-1">
                                    {menuData && (
                                        <>
                                            <MenuSection
                                                id="main-courses"
                                                title="主食 (Main Courses)"
                                                dishes={menuData.mainCourses}
                                                onAddToCart={handleAddToCart}
                                            />
                                            <MenuSection
                                                id="appetizers"
                                                title="小吃 (Appetizers)"
                                                dishes={menuData.appetizers}
                                                onAddToCart={handleAddToCart}
                                            />
                                            <MenuSection
                                                id="drinks"
                                                title="饮品 (Drinks)"
                                                dishes={menuData.drinks}
                                                onAddToCart={handleAddToCart}
                                            />
                                            <MenuSection
                                                id="desserts"
                                                title="甜点 (Desserts)"
                                                dishes={menuData.desserts}
                                                onAddToCart={handleAddToCart}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
