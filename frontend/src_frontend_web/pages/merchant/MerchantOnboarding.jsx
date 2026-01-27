import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { merchantService } from '../../services/merchantService';

/**
 * 商家入驻全屏引导页
 * Step 1: 创建店铺
 * Step 2: 添加首个菜品 (支持连续添加)
 */
export default function MerchantOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Info, 2: Dish, 3: Success
  const [loading, setLoading] = useState(false);
  const [merchantId, setMerchantId] = useState(null);

  // Step 1 Form Data
  const [shopForm, setShopForm] = useState({
    name: '',
    address: ''
  });

  // Step 2 Form Data
  const [dishForm, setDishForm] = useState({
    name: '',
    price: '',
    category: '',
    imageUrl: '',
    description: ''
  });

  // Step 1: Create Shop
  const handleCreateShop = async (e) => {
    e.preventDefault();
    if (!shopForm.name || !shopForm.address) return;

    setLoading(true);
    try {
      const data = await merchantService.createMerchant(shopForm);
      setMerchantId(data.id);
      setStep(2); // Go to next step
    } catch (error) {
      alert("创建店铺失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Add Dish
  const handleAddDish = async (action) => {
    // action: 'finish' | 'next'
    if (!dishForm.name || !dishForm.price || !dishForm.category) {
      alert("请填写完整的菜品信息");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: dishForm.name,
        price: parseFloat(dishForm.price),
        category: dishForm.category,
        imageUrl: dishForm.imageUrl,
        description: dishForm.description
      };

      await merchantService.addMenuItem(merchantId, payload);

      if (action === 'next') {
        // 清空表单，继续添加
        alert("菜品添加成功！请继续添加下一道。");
        setDishForm({
          name: '',
          price: '',
          category: '',
          imageUrl: '',
          description: ''
        });
      } else {
        // 完成
        setStep(3);
      }
    } catch (error) {
      alert("添加菜品失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render Step 1: Shop Info
  const renderStep1 = () => (
    <div className="w-full max-w-[560px] bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-orange-100 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
      <div className="px-8 pt-8 pb-2">
        <div className="flex justify-between items-end mb-3">
          <span className="text-orange-500 font-bold text-sm tracking-wide uppercase">步骤 1/2</span>
          <span className="text-gray-400 text-xs font-medium">50% 完成</span>
        </div>
        <div className="h-2 w-full bg-orange-50 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full transition-all duration-500 ease-out" style={{ width: '50%' }}></div>
        </div>
      </div>

      <div className="px-8 pt-6 pb-2 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">创建您的餐厅</h1>
        <p className="text-gray-500 text-base">请填写店铺基本信息，开启您的线上生意。</p>
      </div>

      <form onSubmit={handleCreateShop} className="p-8 flex flex-col gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-gray-200 mb-2">
            餐厅名称 <span className="text-orange-500">*</span>
          </label>
          <input 
            className="w-full rounded-xl border border-gray-200 bg-[#fcfaf8] h-12 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" 
            placeholder="例如：张记牛肉面" 
            required 
            value={shopForm.name}
            onChange={e => setShopForm({...shopForm, name: e.target.value})}
          />
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-gray-200 mb-2">
            地址 <span className="text-orange-500">*</span>
          </label>
          <input 
            className="w-full rounded-xl border border-gray-200 bg-[#fcfaf8] h-12 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" 
            placeholder="请输入详细经营地址" 
            required 
            value={shopForm.address}
            onChange={e => setShopForm({...shopForm, address: e.target.value})}
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-orange-500/20 transform active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? '处理中...' : '下一步：添加首个菜品'}
          {!loading && <span className="material-symbols-outlined font-bold">arrow_forward</span>}
        </button>
      </form>
    </div>
  );

  // Render Step 2: Add Dish
  const renderStep2 = () => (
    <div className="w-full max-w-[640px] bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-orange-100 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-8 duration-300">
      <div className="px-8 pt-8 pb-4">
        <div className="flex gap-6 justify-between mb-3">
          <p className="text-slate-900 dark:text-white text-sm font-bold tracking-wide uppercase">步骤 2/2</p>
          <span className="text-orange-500 text-sm font-medium">即将完成</span>
        </div>
        <div className="rounded-full bg-orange-50 dark:bg-slate-700 h-2 overflow-hidden">
          <div className="h-full rounded-full bg-orange-500" style={{ width: '90%' }}></div>
        </div>
      </div>

      <div className="px-8 pb-8 flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight pb-2">添加您的招牌菜</h2>
          <p className="text-gray-500 text-base font-normal">至少添加一道菜品以完成入驻。</p>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">菜品名称 <span className="text-orange-500">*</span></label>
            <input 
              className="w-full rounded-xl border border-gray-200 bg-[#fcfaf8] h-12 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" 
              placeholder="例如：招牌红烧肉" 
              value={dishForm.name}
              onChange={e => setDishForm({...dishForm, name: e.target.value})}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">价格 <span className="text-orange-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">¥</span>
                <input 
                  type="number"
                  className="w-full rounded-xl border border-gray-200 bg-[#fcfaf8] h-12 pl-8 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" 
                  placeholder="0.00" 
                  value={dishForm.price}
                  onChange={e => setDishForm({...dishForm, price: e.target.value})}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">分类 <span className="text-orange-500">*</span></label>
              <div className="relative">
                <select 
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-[#fcfaf8] h-12 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all cursor-pointer"
                  value={dishForm.category}
                  onChange={e => setDishForm({...dishForm, category: e.target.value})}
                >
                  <option value="" disabled>选择分类</option>
                  <option value="主食">主食</option>
                  <option value="小吃">小吃</option>
                  <option value="饮料">饮料</option>
                  <option value="甜点">甜点</option>
                  <option value="套餐">套餐</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">图片链接</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <span className="material-symbols-outlined text-[20px]">link</span>
              </span>
              <input 
                className="w-full rounded-xl border border-gray-200 bg-[#fcfaf8] h-12 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" 
                placeholder="https://example.com/image.jpg" 
                value={dishForm.imageUrl}
                onChange={e => setDishForm({...dishForm, imageUrl: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">描述</label>
            <textarea 
              className="w-full rounded-xl border border-gray-200 bg-[#fcfaf8] min-h-[100px] p-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none" 
              placeholder="简单描述一下这道菜的特色..."
              value={dishForm.description}
              onChange={e => setDishForm({...dishForm, description: e.target.value})}
            />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            onClick={() => handleAddDish('next')}
            disabled={loading}
            className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold text-lg h-14 rounded-xl transition-all"
          >
            {loading ? '处理中...' : '保存并加下一道'}
          </button>
          <button 
            onClick={() => handleAddDish('finish')}
            disabled={loading}
            className="flex-[2] bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg h-14 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            <span>{loading ? '处理中...' : '完成设置'}</span>
            {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
          </button>
        </div>
      </div>
    </div>
  );

  // Render Step 3: Success
  const renderStep3 = () => (
    <div className="w-full max-w-[640px] bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl border border-orange-100 dark:border-slate-800 overflow-hidden relative animate-in fade-in zoom-in duration-500">
      <div className="relative z-10 px-8 py-16 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-8 animate-bounce">
          <span className="material-symbols-outlined text-green-600 text-[64px] font-bold">check_circle</span>
        </div>
        <h2 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight mb-4">恭喜！您的店铺已开业！</h2>
        <p className="text-gray-500 text-lg max-w-sm mx-auto mb-10">
          您的店铺和首批菜品已创建成功，现在可以前往管理后台完善更多信息。
        </p>
        <button 
          onClick={() => navigate('/merchant/menu')}
          className="w-full max-w-xs bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg h-14 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">storefront</span>
          <span>前往工作台</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fff5ec] dark:bg-[#121212] flex items-center justify-center p-4">
      {/* Navbar Placeholder */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">restaurant</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">FoodMerchant</span>
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  );
}