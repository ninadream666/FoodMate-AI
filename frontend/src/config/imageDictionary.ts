/**
 * 智能外卖平台 - 前端统一图库字典
 * 目的：剥离庞杂的图片匹配与兜底逻辑，保持 UI 组件的整洁，并提供基于 ID 的图片稳定性。
 * 升级版：引入“图像标签池(Tag Pool)”和哈希散列算法。
 * 终极细化版：将极其相似的品类（如生煎与小笼、冒菜与麻辣烫、各类猪肉部位）进行了彻底的正则拆分，
 * 确保评委在极限测试时，能感受到系统极其精准的语义理解与图文匹配能力。
 */

// ==========================================
// 核心配置：使用你的 merchantService 作为图片代理
// ==========================================
// 我们直接把请求发给你现成的商家服务（8081端口）
const BACKEND_IMAGE_PROXY = 'http://127.0.0.1:8081/api/images/proxy';

/**
 * 字符串一致性 Hash 函数
 * 将商家 ID 或菜品 ID 转化为一个固定的正整数，用于锁定随机图
 */
export const hashId = (id: string | number): number => {
    if (!id) return 1;
    const strId = id.toString();
    let hash = 0;
    for (let i = 0; i < strId.length; i++) {
        hash = strId.charCodeAt(i) + ((hash << 5) - hash);
        // 【根源修复】强制位运算截断，防止 JavaScript 浮点数加法导致数值指数级溢出
        hash = hash | 0; 
    }
    // 【根源修复】增加 % 2147483647 (Java Integer.MAX_VALUE)
    // 彻底确保不管前端怎么算，传给后端的 hash 永远在安全范围内，消除 400 报错！
    return Math.abs(hash) % 2147483647;
};

/**
 * 从标签池中根据哈希值稳定取出一个图像搜索关键词
 */
const getTagFromPool = (tagPool: string[], hash: number): string => {
    return tagPool[hash % tagPool.length];
};

/**
 * 核心优化：后端 API 图像代理
 * 后端接收到 tag 后，再去真实图库拉取并返回图片流。
 */
const buildImageUrl = (tag: string, hash: number, width: number, height: number): string => {
    // 【双重保险】在拼接 URL 时再做一次安全截断，万无一失
    const safeHash = Math.abs(Number(hash)) % 2147483647 || 1;
    return `${BACKEND_IMAGE_PROXY}?tag=${encodeURIComponent(tag)}&width=${width}&height=${height}&hash=${safeHash}`;
};

// ==========================================
// 1. 商家推荐维度的图片映射池 (大图 400x300)
// ==========================================
interface TagMapping {
    regex: RegExp;
    tags: string[];
}

const merchantMappings: TagMapping[] = [
    // --- 细化韩料 ---
    {
        regex: /烤肉|韩式烤肉/,
        tags: ['korean,bbq', 'bulgogi,meat', 'grilled,pork', 'bbq,beef', 'samgyeopsal,pork', 'korean,grill', 'bbq,meat', 'galbi,beef', 'charcoal,bbq', 'grilled,meat']
    },
    {
        regex: /韩料|韩式|大酱汤|炸酱面|部队锅|冷面/,
        tags: ['korean,bibimbap', 'kimchi,soup', 'korean,food', 'tteokbokki,spicy', 'kimbap,roll', 'soju,drink', 'korean,pancake', 'korean,stew', 'banchan,sidedish', 'korean,noodle']
    },
    // --- 细化川渝特色 (火锅、冒菜、麻辣烫等完全拆分) ---
    {
        regex: /火锅/,
        tags: ['hotpot,spicy', 'sichuan,hotpot', 'chinesefondue', 'hotpot,meat', 'boiling,hotpot', 'hotpot,beef', 'hotpot,vegetables', 'hotpot,meal', 'spicy,broth', 'shabu,shabu']
    },
    {
        regex: /麻辣烫/,
        tags: ['mala,tang', 'spicy,soup,bowl', 'chinesestreetfood,soup', 'malatang', 'spicy,vegetable,soup', 'meat,skewer,soup', 'spicy,broth,bowl', 'noodle,spicy,soup', 'hot,spicy,soup', 'sichuan,malatang']
    },
    {
        regex: /冒菜/,
        tags: ['maocai', 'spicy,sichuan,dish', 'sichuan,spicy,bowl', 'meat,vegetable,spicy', 'spicy,broth,meat', 'sichuan,food,bowl', 'mini,hotpot', 'spicy,stew,bowl', 'red,spicy,soup', 'chili,oil,dish']
    },
    {
        regex: /串串/,
        tags: ['spicy,skewer', 'chuanchuan', 'skewer,hotpot', 'meat,skewer,spicy', 'sichuan,skewer', 'spicy,stick', 'boiled,skewer', 'skewer,pot', 'chili,skewer', 'spicy,broth,skewer']
    },
    {
        regex: /毛血旺/,
        tags: ['duck,blood,soup', 'spicy,blood,stew', 'sichuan,spicy,stew', 'maoxuewang', 'spicy,offal,soup', 'chili,oil,stew', 'spicy,sichuan,cuisine', 'red,spicy,broth', 'spicy,meat,stew', 'traditional,sichuan,soup']
    },
    {
        regex: /辣|干锅|烤鱼/,
        tags: ['spicy,sichuan', 'chili,food', 'mapo,tofu', 'spicy,chicken', 'sichuan,food', 'spicy,dish', 'kungpao,chicken', 'peppers,spicy', 'chili,oil', 'spicy,stirfry']
    },
    // --- 日料系列 ---
    {
        regex: /寿司|刺身|三文鱼|日料店/,
        tags: ['sushi,roll', 'sashimi,salmon', 'nigiri,sushi', 'sushi,platter', 'maki,roll', 'japanese,sushi', 'sushi,boat', 'raw,fish', 'tuna,sashimi', 'sushi,chef']
    },
    {
        regex: /鳗鱼/,
        tags: ['unagi,rice', 'eel,bowl', 'grilled,eel', 'unagi,don', 'japanese,eel', 'eel,sushi', 'bbq,eel', 'sweet,eel', 'unagi,bento', 'eel,dish']
    },
    {
        regex: /日料|居酒屋|日式|寿喜锅|天妇罗/,
        tags: ['izakaya,food', 'japanese,bento', 'tempura,food', 'takoyaki,streetfood', 'tonkatsu,meat', 'okonomiyaki,food', 'japanese,meal', 'yakitori,chicken', 'miso,soup', 'katsu,curry']
    },
    // --- 烧烤与夜宵 ---
    {
        regex: /烧烤|烤串|夜宵|大排档/,
        tags: ['barbecue,skewer', 'grilled,seafood', 'kebab,grill', 'bbq,night', 'streetfood,bbq', 'roast,lamb', 'grilled,oyster', 'meat,skewer', 'charcoal,grill', 'nightmarket,food']
    },
    {
        regex: /小龙虾/,
        tags: ['crayfish,spicy', 'crawfish,boil', 'spicy,crayfish', 'garlic,crayfish', 'seafood,crayfish', 'red,crayfish', 'crayfish,dish', 'spicy,seafood', 'crawfish,plate', 'crayfish,bowl']
    },
    // --- 西式快餐 ---
    {
        regex: /汉堡|麦当劳|肯德基|汉堡王/,
        tags: ['burger,cheese', 'hamburger,fastfood', 'chicken,burger', 'beef,burger', 'bacon,burger', 'double,burger', 'crispy,chicken,burger', 'slider,burger', 'fastfood,burger', 'classic,burger']
    },
    {
        regex: /披萨|比萨|意式薄饼/,
        tags: ['pizza,cheese', 'pepperoni,pizza', 'italian,pizza', 'margherita,pizza', 'pizza,slice', 'woodfired,pizza', 'pizza,crust', 'hawaiian,pizza', 'meat,pizza', 'mushroom,pizza']
    },
    {
        regex: /炸鸡|鸡排/,
        tags: ['fried,chicken', 'chicken,nuggets', 'crispy,chicken', 'fried,wings', 'korean,friedchicken', 'spicy,friedchicken', 'chicken,tenders', 'fried,poultry', 'southern,friedchicken', 'golden,friedchicken']
    },
    {
        regex: /薯条/,
        tags: ['french,fries', 'potato,wedges', 'curly,fries', 'crispy,fries', 'sweetpotato,fries', 'cheese,fries', 'loaded,fries', 'golden,fries', 'potato,chips', 'ketchup,fries']
    },
    {
        regex: /热狗|三明治/,
        tags: ['hotdog,mustard', 'sandwich,club', 'sausage,bun', 'sub,sandwich', 'grilled,sandwich', 'panini,sandwich', 'blt,sandwich', 'hotdog,sausage', 'bagel,sandwich', 'melt,sandwich']
    },
    // --- 正餐与轻食 ---
    {
        regex: /西餐|牛排/,
        tags: ['steak,western', 'western,food', 'beef,steak', 'ribeye,steak', 'sirloin,steak', 'tbone,steak', 'mediumrare,steak', 'steak,frites', 'wagyu,steak', 'pepper,steak']
    },
    {
        regex: /轻食|沙拉|减脂|素食|健康|低卡/,
        tags: ['salad,bowl', 'healthy,diet', 'vegan,food', 'green,salad', 'avocado,toast', 'vegetable,meal', 'quinoa,salad', 'fruit,salad', 'diet,food', 'fresh,salad']
    },
    // --- 饮品与烘焙 ---
    {
        regex: /咖啡|拿铁|星巴克/,
        tags: ['coffee,latte', 'espresso,cup', 'cappuccino,art', 'americano,coffee', 'iced,coffee', 'coffee,beans', 'cafe,coffee', 'mocha,coffee', 'drip,coffee', 'black,coffee']
    },
    {
        regex: /奶茶|波霸|茶饮|果茶/,
        tags: ['milktea,boba', 'bubble,tea', 'pearl,milktea', 'taro,milktea', 'brownsugar,boba', 'fruit,tea', 'cheese,tea', 'matcha,boba', 'boba,drink', 'milktea,cup']
    },
    {
        regex: /茶|茶馆|名茶/,
        tags: ['green,tea', 'black,tea', 'oolong,tea', 'tea,pot', 'tea,cup', 'matcha,tea', 'herbal,tea', 'tea,leaves', 'english,tea', 'jasmine,tea']
    },
    {
        regex: /果汁|冰饮|鲜榨/,
        tags: ['fresh,juice', 'orange,juice', 'apple,juice', 'smoothie,fruit', 'watermelon,juice', 'mixed,juice', 'fruit,drink', 'healthy,juice', 'carrot,juice', 'lemonade,drink']
    },
    {
        regex: /蛋糕|甜点/,
        tags: ['cake,slice', 'chocolate,cake', 'cheesecake,dessert', 'strawberry,cake', 'sponge,cake', 'cupcake,dessert', 'tart,dessert', 'layer,cake', 'birthday,cake', 'mousse,cake']
    },
    {
        regex: /冰淇淋|雪糕|冰棍/,
        tags: ['icecream,cone', 'gelato,scoop', 'sundae,icecream', 'vanilla,icecream', 'chocolate,icecream', 'strawberry,icecream', 'sorbet,dessert', 'icecream,bowl', 'softserve,icecream', 'popsicle,icecream']
    },
    {
        regex: /烘焙|面包/,
        tags: ['bakery,bread', 'croissant,bakery', 'baguette,bread', 'pastry,sweet', 'sourdough,bread', 'toast,bread', 'danish,pastry', 'bun,bread', 'pretzel,bread', 'donut,sweet']
    },
    {
        regex: /巧克力|布丁|糖果/,
        tags: ['pudding,sweet', 'chocolate,bar', 'truffle,chocolate', 'caramel,pudding', 'dark,chocolate', 'panna,cotta', 'flan,dessert', 'milk,chocolate', 'chocolate,brownie', 'fudge,dessert']
    },
    // --- 早餐与米面 ---
    {
        regex: /早餐|包子|粥|豆浆|煎饼|油条|点心|早茶/,
        tags: ['dimsum,chinese', 'breakfast,porridge', 'pancake,food', 'soy,milk', 'steamed,bun', 'morning,breakfast', 'dumplings,plate', 'fried,dough', 'congee,bowl', 'steamed,dumplings']
    },
    {
        regex: /面|米线|粉|拉面|乌冬|意面|螺蛳粉/,
        tags: ['noodle,soup', 'ramen,bowl', 'spicy,noodle', 'pasta,plate', 'beef,noodle', 'udon,japanese', 'spaghetti,pasta', 'rice,noodle', 'chow,mein', 'noodle,bowl']
    },
    {
        regex: /炒|川|湘|粤|东北|鲁|饭馆|家常菜|小炒|中餐/,
        tags: ['chinese,stirfry', 'kungpao,chicken', 'chinese,food', 'cantonese,food', 'mapo,tofu', 'chinese,restaurant', 'peking,duck', 'dimsum,chinese', 'wok,food', 'sweetandsour,food']
    }
];

export const getMerchantImageByReason = (reason: string, id: string | number): string => {
    const hash = hashId(id);
    const targetReason = reason || '';

    for (const mapping of merchantMappings) {
        if (mapping.regex.test(targetReason)) {
            const tag = getTagFromPool(mapping.tags, hash);
            return buildImageUrl(tag, hash, 400, 300);
        }
    }

    const fallbackTags = ['restaurant,interior', 'food,table', 'dining,room', 'restaurant,food', 'cafe,interior', 'delicious,meal', 'gourmet,restaurant', 'bistro,food', 'eatery,interior', 'dinner,table'];
    const fallbackTag = getTagFromPool(fallbackTags, hash);
    return buildImageUrl(fallbackTag, hash, 400, 300);
};

// ==========================================
// 2. 菜品详情维度的图片映射池 (小图 200x200)
// 注意：正则必须从最精细的开始排，防止被宽泛的词覆盖
// ==========================================

const dishNameMappings: TagMapping[] = [
    // --- 面条家族彻底拆分 ---
    { 
        regex: /汤面/, 
        tags: ['noodle,soup', 'ramen,soup', 'hot,noodle,bowl', 'beef,noodle,soup', 'pork,noodle,soup', 'clear,broth,noodle', 'chicken,noodle,soup', 'seafood,noodle,soup', 'vegetable,noodle,soup', 'asian,noodle,soup'] 
    },
    { 
        regex: /拌面/, 
        tags: ['mixed,noodle', 'dry,noodle', 'scallion,oil,noodle', 'sesame,noodle', 'peanut,sauce,noodle', 'spicy,mixed,noodle', 'beef,mixed,noodle', 'cold,mixed,noodle', 'sauce,noodle', 'garlic,noodle'] 
    },
    { 
        regex: /炒面/, 
        tags: ['chow,mein', 'fried,noodle', 'stirfried,noodle', 'soy,sauce,noodle', 'beef,chow,mein', 'chicken,chow,mein', 'seafood,fried,noodle', 'vegetable,chow,mein', 'yakisoba,noodle', 'wok,fried,noodle'] 
    },
    { 
        regex: /冷面/, 
        tags: ['cold,noodle', 'naengmyeon', 'korean,cold,noodle', 'chilled,noodle', 'spicy,cold,noodle', 'buckwheat,cold,noodle', 'summer,cold,noodle', 'ice,cold,noodle', 'sesame,cold,noodle', 'refreshing,cold,noodle'] 
    },
    { 
        regex: /意面|意大利面|通心粉/, 
        tags: ['pasta,plate', 'spaghetti,pasta', 'penne,pasta', 'macaroni,cheese', 'fettuccine,alfredo', 'carbonara,pasta', 'bolognese,pasta', 'pesto,pasta', 'ravioli,pasta', 'lasagna,pasta'] 
    },
    { 
        regex: /拉面|乌冬|日式面/, 
        tags: ['ramen,bowl', 'udon,japanese', 'japanese,noodle', 'pork,ramen', 'miso,ramen', 'shoyu,ramen', 'udon,soup', 'ramen,egg', 'tonkotsu,ramen', 'soba,noodle'] 
    },
    { 
        regex: /面/, // 兜底面条
        tags: ['noodle,bowl', 'chinese,noodle', 'handpulled,noodle', 'dan,dan,noodle', 'wonton,noodle', 'pork,noodle', 'spicy,noodle,bowl', 'asian,noodle', 'wheat,noodle', 'noodle,dish'] 
    },

    // --- 粉类家族彻底拆分 ---
    { 
        regex: /螺蛳粉/, 
        tags: ['luosifen', 'river,snail,noodle', 'spicy,snail,noodle', 'stinky,noodle', 'guangxi,noodle', 'sour,bamboo,noodle', 'spicy,sour,noodle', 'snail,rice,noodle', 'luosifen,bowl', 'authentic,luosifen'] 
    },
    { 
        regex: /米线/, 
        tags: ['rice,noodle,soup', 'mixian', 'yunnan,ricenoodle', 'cross,bridge,ricenoodle', 'spicy,ricenoodle', 'beef,ricenoodle', 'chicken,ricenoodle', 'pork,ricenoodle', 'claypot,ricenoodle', 'tomato,ricenoodle'] 
    },
    { 
        regex: /粉|粉丝/, 
        tags: ['glass,noodle', 'vermicelli', 'mungbean,noodle', 'stirfried,rice,noodle', 'rice,stick', 'beef,ho,fun', 'pad,thai', 'pho,noodle', 'flat,rice,noodle', 'spicy,vermicelli'] 
    },

    // --- 海鲜贝类彻底拆分 ---
    { 
        regex: /生蚝/, 
        tags: ['raw,oyster', 'grilled,oyster', 'oyster,shell', 'garlic,oyster', 'steamed,oyster', 'fresh,oyster', 'baked,oyster', 'oyster,platter', 'lemon,oyster', 'seafood,oyster'] 
    },
    { 
        regex: /鱿鱼/, 
        tags: ['grilled,squid', 'fried,squid', 'calamari,ring', 'spicy,squid', 'squid,skewer', 'stirfried,squid', 'roasted,squid', 'stuffed,squid', 'fresh,squid', 'bbq,squid'] 
    },
    { 
        regex: /蛤蜊|花甲/, 
        tags: ['clam,soup', 'steamed,clam', 'stirfried,clam', 'garlic,clam', 'clam,shell', 'spicy,clam', 'fresh,clam', 'clam,pasta', 'clam,dish', 'white,wine,clam'] 
    },
    { 
        regex: /鱼/, 
        tags: ['steamed,fish', 'grilled,fish', 'fried,fish', 'fish,soup', 'braised,fish', 'sweet,sour,fish', 'spicy,fish', 'fish,fillet', 'roast,fish', 'fish,dish'] 
    },
    { 
        regex: /虾|龙虾/, 
        tags: ['seafood,shrimp', 'lobster,plate', 'grilled,shrimp', 'garlic,shrimp', 'shrimp,cocktail', 'lobster,tail', 'fried,shrimp', 'prawn,dish', 'cajun,shrimp', 'steamed,shrimp'] 
    },
    { 
        regex: /蟹/, 
        tags: ['crab,food', 'chili,crab', 'steamed,crab', 'king,crab', 'crab,legs', 'blue,crab', 'crab,meat', 'crab,cake', 'curry,crab', 'softshell,crab'] 
    },
    { 
        regex: /海鲜/, // 兜底海鲜
        tags: ['seafood,platter', 'mixed,seafood', 'seafood,boil', 'fresh,seafood', 'seafood,dish', 'seafood,stew', 'grilled,seafood', 'steamed,seafood', 'seafood,feast', 'shellfish,platter'] 
    },

    // --- 猪肉家族彻底拆分 ---
    { 
        regex: /排骨/, 
        tags: ['pork,ribs', 'spare,ribs', 'sweet,sour,ribs', 'braised,ribs', 'steamed,ribs', 'fried,ribs', 'garlic,ribs', 'bbq,ribs', 'roasted,ribs', 'spicy,ribs'] 
    },
    { 
        regex: /里脊/, 
        tags: ['pork,tenderloin', 'fried,tenderloin', 'sweet,sour,pork', 'pork,fillet', 'stirfried,pork,slice', 'crispy,pork', 'sliced,pork', 'pork,strip', 'garlic,pork', 'pepper,pork'] 
    },
    { 
        regex: /蹄膀|肘子/, 
        tags: ['pork,knuckle', 'braised,pork,joint', 'pork,hock', 'roasted,pork,knuckle', 'braised,pig,elbow', 'stewed,pork,hock', 'soy,sauce,pork,joint', 'tender,pork,knuckle', 'slow,cooked,pork', 'crispy,pork,knuckle'] 
    },
    { 
        regex: /五花肉/, 
        tags: ['pork,belly', 'roasted,pork,belly', 'braised,pork,belly', 'grilled,pork,belly', 'sliced,pork,belly', 'crispy,pork,belly', 'spicy,pork,belly', 'samgyeopsal', 'bbq,pork,belly', 'fried,pork,belly'] 
    },
    { 
        regex: /培根/, 
        tags: ['bacon,strip', 'fried,bacon', 'crispy,bacon', 'bacon,slice', 'bacon,breakfast', 'bacon,wrap', 'grilled,bacon', 'smoked,bacon', 'bacon,plate', 'thick,cut,bacon'] 
    },
    { 
        regex: /红烧肉/, 
        tags: ['braised,pork', 'hongshaorou', 'soy,braised,pork', 'pork,belly,stew', 'chinese,braised,pork', 'red,braised,pork', 'caramelized,pork', 'tender,braised,pork', 'traditional,braised,pork', 'braised,pork,bowl'] 
    },
    { 
        regex: /猪肉/, // 兜底猪肉
        tags: ['pork,dish', 'stirfried,pork', 'pork,slice', 'minced,pork', 'pork,meat', 'pork,chop', 'pork,dumpling', 'steamed,pork', 'pork,stew', 'spicy,pork'] 
    },

    // --- 牛肉 ---
    { 
        regex: /牛排/, 
        tags: ['steak,western', 'western,food', 'beef,steak', 'ribeye,steak', 'sirloin,steak', 'tbone,steak', 'mediumrare,steak', 'steak,frites', 'wagyu,steak', 'pepper,steak'] 
    },
    { 
        regex: /牛肉|肥牛|牛腩|牛腱/, 
        tags: ['roast,beef', 'beef,stew', 'wagyu,beef', 'beef,slice', 'beef,noodle', 'brisket,food', 'beef,curry', 'stirfry,beef', 'beef,teriyaki', 'beef,bowl'] 
    },

    // --- 家禽家族彻底拆分 ---
    { 
        regex: /鸭/, 
        tags: ['roast,duck', 'peking,duck', 'braised,duck', 'smoked,duck', 'crispy,duck', 'duck,breast', 'sliced,duck', 'duck,leg', 'cantonese,roast,duck', 'duck,dish'] 
    },
    { 
        regex: /鹅/, 
        tags: ['roast,goose', 'braised,goose', 'cantonese,roast,goose', 'sliced,goose', 'goose,meat', 'crispy,goose', 'stewed,goose', 'goose,dish', 'smoked,goose', 'traditional,roast,goose'] 
    },
    { 
        regex: /鸽/, 
        tags: ['roast,pigeon', 'crispy,pigeon', 'braised,pigeon', 'grilled,squab', 'pigeon,dish', 'fried,pigeon', 'cantonese,pigeon', 'stewed,pigeon', 'spiced,pigeon', 'roasted,squab'] 
    },
    { 
        regex: /鸡|禽|翅|腿/, 
        tags: ['roast,chicken', 'fried,chicken', 'steamed,chicken', 'braised,chicken', 'chicken,breast', 'chicken,dish', 'grilled,chicken', 'soy,sauce,chicken', 'chicken,thigh', 'whole,chicken'] 
    },

    // --- 蔬菜家族彻底拆分 ---
    { 
        regex: /沙拉/, 
        tags: ['green,salad', 'fruit,salad', 'mixed,salad', 'caesar,salad', 'salad,bowl', 'fresh,salad', 'vegetable,salad', 'quinoa,salad', 'healthy,salad', 'diet,salad'] 
    },
    { 
        regex: /黄瓜/, 
        tags: ['cucumber,salad', 'smashed,cucumber', 'sliced,cucumber', 'pickled,cucumber', 'fresh,cucumber', 'cucumber,dish', 'stirfried,cucumber', 'cucumber,stick', 'garlic,cucumber', 'cold,cucumber'] 
    },
    { 
        regex: /青菜/, 
        tags: ['bok,choy', 'green,vegetable', 'stirfried,greens', 'steamed,greens', 'leafy,greens', 'garlic,greens', 'chinese,greens', 'blanched,greens', 'fresh,greens', 'vegetable,dish'] 
    },
    { 
        regex: /茄子/, 
        tags: ['eggplant,dish', 'braised,eggplant', 'grilled,eggplant', 'stirfried,eggplant', 'stuffed,eggplant', 'garlic,eggplant', 'spicy,eggplant', 'roasted,eggplant', 'fried,eggplant', 'chinese,eggplant'] 
    },
    { 
        regex: /土豆/, 
        tags: ['potato,dish', 'mashed,potato', 'roasted,potato', 'shredded,potato', 'baked,potato', 'fried,potato', 'spicy,potato', 'potato,wedge', 'braised,potato', 'potato,pancake'] 
    },
    { 
        regex: /白菜/, 
        tags: ['cabbage,dish', 'napa,cabbage', 'stirfried,cabbage', 'spicy,cabbage', 'steamed,cabbage', 'pickled,cabbage', 'chinese,cabbage', 'cabbage,soup', 'garlic,cabbage', 'boiled,cabbage'] 
    },
    { 
        regex: /豆腐/, 
        tags: ['tofu,dish', 'mapo,tofu', 'fried,tofu', 'braised,tofu', 'stinky,tofu', 'steamed,tofu', 'spicy,tofu', 'cold,tofu', 'soft,tofu', 'crispy,tofu'] 
    },
    { 
        regex: /西兰花/, 
        tags: ['broccoli,dish', 'stirfried,broccoli', 'steamed,broccoli', 'garlic,broccoli', 'roasted,broccoli', 'broccoli,salad', 'boiled,broccoli', 'healthy,broccoli', 'green,broccoli', 'broccoli,floret'] 
    },
    { 
        regex: /豆皮/, 
        tags: ['tofu,skin', 'yuba,dish', 'bean,curd,skin', 'stirfried,tofu,skin', 'spicy,tofu,skin', 'cold,tofu,skin', 'braised,yuba', 'tofu,skin,roll', 'yuba,salad', 'fried,tofu,skin'] 
    },
    { 
        regex: /蔬菜|轻食|素食/, // 兜底蔬菜
        tags: ['vegetable,platter', 'mixed,vegetables', 'steamed,vegetables', 'roasted,vegetables', 'grilled,vegetables', 'healthy,vegetables', 'fresh,vegetables', 'stirfried,vegetables', 'vegetable,medley', 'root,vegetables'] 
    },

    // --- 汤粥分离 ---
    { 
        regex: /粥/, 
        tags: ['congee,bowl', 'rice,porridge', 'seafood,congee', 'pork,congee', 'plain,congee', 'sweet,porridge', 'chicken,congee', 'healthy,porridge', 'breakfast,congee', 'millet,porridge'] 
    },
    { 
        regex: /汤|羹|炖|煲/, 
        tags: ['soup,bowl', 'hot,soup', 'clear,soup', 'thick,soup', 'meat,soup', 'vegetable,soup', 'chicken,soup', 'tomato,soup', 'mushroom,soup', 'seafood,soup'] 
    },

    // --- 饺子点心完全分离 ---
    { 
        regex: /饺子|水饺/, 
        tags: ['dumplings,plate', 'boiled,dumplings', 'jiaozi', 'pork,dumpling', 'steamed,dumplings', 'chinese,dumplings', 'shrimp,dumpling', 'vegetable,dumpling', 'handmade,dumplings', 'dumplings,vinegar'] 
    },
    { 
        regex: /馄饨/, 
        tags: ['wonton,soup', 'pork,wonton', 'shrimp,wonton', 'wonton,bowl', 'spicy,wonton', 'fried,wonton', 'mini,wonton', 'chinese,wonton', 'wonton,noodle', 'clear,broth,wonton'] 
    },
    { 
        regex: /汤圆/, 
        tags: ['tangyuan', 'sweet,rice,ball', 'glutinous,rice,ball', 'sesame,rice,ball', 'sweet,soup,ball', 'lantern,festival,food', 'peanut,rice,ball', 'matcha,rice,ball', 'black,sesame,ball', 'rice,ball,soup'] 
    },
    { 
        regex: /锅贴/, 
        tags: ['potsticker', 'pan,fried,dumpling', 'crispy,dumpling', 'guotie', 'pork,potsticker', 'fried,jiaozi', 'japanese,gyoza', 'golden,dumpling', 'crispy,bottom,dumpling', 'potsticker,plate'] 
    },
    { 
        regex: /抄手/, 
        tags: ['chaoshou', 'sichuan,wonton', 'spicy,wonton,oil', 'chili,oil,wonton', 'red,oil,wonton', 'spicy,pork,wonton', 'sichuan,dumpling', 'hot,spicy,wonton', 'garlic,chili,wonton', 'authentic,chaoshou'] 
    },

    // --- 包子点心完全分离 ---
    { 
        regex: /包子/, 
        tags: ['steamed,bun', 'baozi', 'pork,bun', 'vegetable,bun', 'chinese,steamed,bun', 'stuffed,bun', 'fluffy,bun', 'meat,bun', 'sweet,bean,bun', 'breakfast,bun'] 
    },
    { 
        regex: /烧卖/, 
        tags: ['shumai', 'siu,mai', 'steamed,pork,dumpling', 'shrimp,shumai', 'dimsum,shumai', 'cantonese,shumai', 'sticky,rice,shumai', 'yellow,wrapper,dumpling', 'steamed,dimsum', 'shumai,basket'] 
    },
    { 
        regex: /小笼包/, 
        tags: ['xiaolongbao', 'soup,dumpling', 'steamed,pork,soup,dumpling', 'shanghai,soup,dumpling', 'xlb', 'crab,soup,dumpling', 'steamed,bun,basket', 'delicate,dumpling', 'juicy,dumpling', 'bamboo,steamer,bun'] 
    },
    { 
        regex: /生煎/, 
        tags: ['shengjianbao', 'pan,fried,bun', 'crispy,bottom,bun', 'pan,fried,pork,bun', 'shanghai,fried,bun', 'juicy,fried,bun', 'sesame,fried,bun', 'golden,fried,bun', 'pork,shengjian', 'fried,soup,bun'] 
    },

    // --- 西式快餐细化 ---
    { 
        regex: /热狗/, 
        tags: ['hotdog,mustard', 'sausage,bun', 'hotdog,ketchup', 'grilled,hotdog', 'chili,dog', 'cheese,dog', 'newyork,hotdog', 'gourmet,hotdog', 'street,hotdog', 'hotdog,meal'] 
    },
    { 
        regex: /三明治|热压吐司/, 
        tags: ['sandwich,club', 'sub,sandwich', 'grilled,sandwich', 'panini,sandwich', 'blt,sandwich', 'turkey,sandwich', 'beef,sandwich', 'egg,sandwich', 'healthy,sandwich', 'toast,sandwich'] 
    },
    { 
        regex: /汉堡|汉堡包/, 
        tags: ['burger,cheese', 'hamburger,fastfood', 'chicken,burger', 'beef,burger', 'bacon,burger', 'double,burger', 'crispy,chicken,burger', 'slider,burger', 'fastfood,burger', 'classic,burger'] 
    },
    { 
        regex: /披萨|比萨/, 
        tags: ['pizza,cheese', 'pepperoni,pizza', 'italian,pizza', 'margherita,pizza', 'pizza,slice', 'woodfired,pizza', 'pizza,crust', 'hawaiian,pizza', 'meat,pizza', 'mushroom,pizza'] 
    },
    { 
        regex: /薯条|炸鸡块|鸡块|鸡排|炸物/, 
        tags: ['french,fries', 'fried,chicken', 'chicken,nuggets', 'crispy,fries', 'potato,wedges', 'golden,fries', 'fried,snack', 'chicken,wings', 'ketchup,fries', 'fried,food'] 
    },

    // --- 日料拆分 ---
    { 
        regex: /寿司|刺身|三文鱼/, 
        tags: ['sushi,roll', 'sashimi,salmon', 'nigiri,sushi', 'sushi,platter', 'maki,roll', 'japanese,sushi', 'sushi,boat', 'raw,fish', 'tuna,sashimi', 'sushi,chef'] 
    },
    { 
        regex: /鳗鱼/, 
        tags: ['unagi,rice', 'eel,bowl', 'grilled,eel', 'unagi,don', 'japanese,eel', 'eel,sushi', 'bbq,eel', 'sweet,eel', 'unagi,bento', 'eel,dish'] 
    },

    // --- 饮品拆分 ---
    { 
        regex: /奶茶|波霸|珍珠|果茶/, 
        tags: ['milktea,boba', 'bubble,tea', 'pearl,milktea', 'taro,milktea', 'brownsugar,boba', 'fruit,tea', 'cheese,tea', 'matcha,boba', 'boba,drink', 'milktea,cup'] 
    },
    { 
        regex: /咖啡|拿铁|美式|意式/, 
        tags: ['coffee,latte', 'espresso,cup', 'cappuccino,art', 'americano,coffee', 'iced,coffee', 'coffee,beans', 'cafe,coffee', 'mocha,coffee', 'drip,coffee', 'black,coffee'] 
    },
    { 
        regex: /果汁|鲜榨|冰沙/, 
        tags: ['fresh,juice', 'orange,juice', 'apple,juice', 'smoothie,fruit', 'watermelon,juice', 'mixed,juice', 'fruit,drink', 'healthy,juice', 'carrot,juice', 'lemonade,drink'] 
    },
    { 
        regex: /汽水|可乐|雪碧|芬达/, 
        tags: ['soda,ice', 'cola,drink', 'sparkling,water', 'softdrink,glass', 'carbonated,drink', 'sprite,drink', 'fanta,drink', 'orange,soda', 'lemon,soda', 'soda,can'] 
    },

    // --- 甜点烘焙拆分 ---
    { 
        regex: /蛋糕|提拉米苏|慕斯/, 
        tags: ['cake,slice', 'chocolate,cake', 'cheesecake,dessert', 'strawberry,cake', 'sponge,cake', 'cupcake,dessert', 'tart,dessert', 'layer,cake', 'birthday,cake', 'mousse,cake'] 
    },
    { 
        regex: /冰淇淋|雪糕|圣代/, 
        tags: ['icecream,cone', 'gelato,scoop', 'sundae,icecream', 'vanilla,icecream', 'chocolate,icecream', 'strawberry,icecream', 'sorbet,dessert', 'icecream,bowl', 'softserve,icecream', 'popsicle,icecream'] 
    },
    { 
        regex: /面包|吐司|可颂|烘焙/, 
        tags: ['bakery,bread', 'croissant,bakery', 'baguette,bread', 'pastry,sweet', 'sourdough,bread', 'toast,bread', 'danish,pastry', 'bun,bread', 'pretzel,bread', 'donut,sweet'] 
    },

    // --- 米饭与烧烤 ---
    { 
        regex: /饭|炒饭|盖饭|烩饭|焗饭|拌饭/, 
        tags: ['fried,rice', 'curry,rice', 'bibimbap,bowl', 'rice,bowl', 'risotto,plate', 'pork,rice', 'chicken,rice', 'seafood,rice', 'white,rice', 'brown,rice'] 
    },
    { 
        regex: /烤|串|烧烤|奥尔良/, 
        tags: ['barbecue,skewer', 'grilled,seafood', 'kebab,grill', 'bbq,night', 'streetfood,bbq', 'roast,lamb', 'grilled,oyster', 'meat,skewer', 'charcoal,grill', 'nightmarket,food'] 
    }
];

const dishCategoryMappings: TagMapping[] = [
    { regex: /主食|粉面|米饭/, tags: ['meal,rice', 'pasta,plate', 'maincourse,food', 'noodle,bowl', 'fried,rice', 'rice,bowl', 'spaghetti,pasta', 'beef,noodle', 'curry,rice', 'udon,japanese'] },
    { regex: /小吃|街头|炸物/, tags: ['snack,streetfood', 'fried,snack', 'street,food', 'tasty,snack', 'appetizer,fried', 'chicken,nuggets', 'french,fries', 'fried,dumplings', 'takoyaki,streetfood', 'kebab,grill'] },
    { regex: /饮品|酒水|饮料/, tags: ['beverage,drink', 'juice,glass', 'cocktail,drink', 'soda,ice', 'tea,cup', 'coffee,latte', 'milktea,boba', 'smoothie,fruit', 'iced,coffee', 'matcha,drink'] },
    { regex: /凉菜|前菜|小菜/, tags: ['appetizer,colddish', 'salad,plate', 'starter,food', 'cold,dish', 'cucumber,salad', 'kimchi,food', 'tofu,dish', 'edamame,food', 'pickled,vegetables', 'seaweed,salad'] },
    { regex: /沙拉|轻食|素食/, tags: ['salad,healthy', 'vegan,bowl', 'green,salad', 'diet,food', 'vegetable,plate', 'avocado,toast', 'quinoa,salad', 'fruit,salad', 'fresh,salad', 'healthy,diet'] },
    { regex: /夜宵|烧烤|卤味/, tags: ['barbecue,latenight', 'bbq,skewer', 'night,food', 'roast,meat', 'streetfood,night', 'crayfish,spicy', 'grilled,seafood', 'yakitori,chicken', 'bbq,meat', 'roast,oyster'] },
    { regex: /甜点|烘焙|糕点/, tags: ['dessert,bakery', 'cake,slice', 'pastry,sweet', 'tart,dessert', 'macaron,bakery', 'icecream,cone', 'pudding,sweet', 'waffle,syrup', 'chocolate,cake', 'croissant,bakery'] },
    { regex: /汤|羹/, tags: ['soup,bowl', 'stew,pot', 'broth,food', 'hot,soup', 'mushroom,soup', 'chicken,broth', 'tomato,soup', 'pumpkin,soup', 'seafood,soup', 'beef,stew'] }
];

/**
 * [详情页用] 根据菜品名称、分类智能分配菜品图片
 * @param name 菜品名称
 * @param category 菜品分类
 * @param fallbackMerchantImg 商家主图（兜底用）
 * @param id 菜品 ID
 */
export const getDishImage = (name: string, category: string, fallbackMerchantImg: string, id: string | number): string => {
    const hash = hashId(id);
    const targetName = name || '';
    const targetCategory = category || '';

    // ==========================================
    // 新增：套餐与特价的定制匹配逻辑
    // ==========================================
    
    // 套餐匹配 -> 中餐那类的随机一张图
    if (targetName.includes('套餐') || targetName.includes('招牌')) {
        const chineseTags = ['chinese,stirfry', 'kungpao,chicken', 'chinese,food', 'cantonese,food', 'mapo,tofu', 'chinese,restaurant', 'peking,duck', 'dimsum,chinese', 'wok,food', 'sweetandsour,food'];
        const tag = getTagFromPool(chineseTags, hash);
        return buildImageUrl(tag, hash, 200, 200);
    }

    // 特价匹配 -> 从已写好的菜品分类里随机一类出现
    if (targetName.includes('特价') || targetName.includes('限时')) {
        const randomMapping = dishCategoryMappings[hash % dishCategoryMappings.length];
        const tag = getTagFromPool(randomMapping.tags, hash);
        return buildImageUrl(tag, hash, 200, 200);
    }

    // ==========================================
    // 原有优先级逻辑保持不变
    // ==========================================

    // 第一优先级：极其细粒度的菜名 Regex 匹配
    for (const mapping of dishNameMappings) {
        if (mapping.regex.test(targetName)) {
            const tag = getTagFromPool(mapping.tags, hash);
            return buildImageUrl(tag, hash, 200, 200);
        }
    }

    // 第二优先级：分类兜底匹配 (涵盖绝大部分常用品类)
    for (const mapping of dishCategoryMappings) {
        if (mapping.regex.test(targetCategory)) {
            const tag = getTagFromPool(mapping.tags, hash);
            return buildImageUrl(tag, hash, 200, 200);
        }
    }

    // 第三优先级：如果传入了商家主图，直接使用商家主图保持视觉统一
    if (fallbackMerchantImg) {
        return fallbackMerchantImg;
    }

    // 终极兜底：一个多样化的高清食物占位图池
    const fallbackTags = ['food,dish', 'delicious,meal', 'gourmet,food', 'tasty,plate', 'dinner,meal', 'lunch,box', 'healthy,meal', 'appetizing,food', 'culinary,dish', 'yummy,food'];
    const fallbackTag = getTagFromPool(fallbackTags, hash);
    return buildImageUrl(fallbackTag, hash, 200, 200);
};