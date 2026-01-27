import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { merchantService } from '../../services/merchantService';

/**
 * 菜单管理页面 (基于 Stitch HTML 样式重构)
 */
export default function MenuManagement() {
  const { merchant } = useOutletContext();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 模态框状态
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // 分类筛选状态 (前端筛选)
  const [activeCategory, setActiveCategory] = useState('全部');
  const [categories, setCategories] = useState(['全部']);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    category: '',
    isAvailable: true
  });

  useEffect(() => {
    if (merchant && merchant.id) {
      fetchMenu();
    }
  }, [merchant]);

  const fetchMenu = async () => {
    try {
      const data = await merchantService.getMenu(merchant.id);
      setMenuItems(data);
      
      // 提取所有不重复的分类
      const cats = ['全部', ...new Set(data.map(item => item.category).filter(Boolean))];
      setCategories(cats);
    } catch (error) {
      console.error("加载菜单失败", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 模态框逻辑 ---
  const openAddModal = () => {
    setIsEditMode(false);
    setFormData({ name: '', price: '', description: '', imageUrl: '', category: '', isAvailable: true });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setCurrentItem(item);
    setFormData({
      name: item.name,
      price: item.price,
      description: item.description,
      imageUrl: item.imageUrl || '',
      category: item.category || '',
      isAvailable: item.isAvailable
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description,
        imageUrl: formData.imageUrl,
        category: formData.category,
        isAvailable: formData.isAvailable
      };

      if (isEditMode) {
        await merchantService.updateMenuItem(merchant.id, currentItem.id, payload);
      } else {
        await merchantService.addMenuItem(merchant.id, payload);
      }

      setShowModal(false);
      fetchMenu(); // 刷新列表
    } catch (error) {
      alert("操作失败：" + error.message);
    }
  };

  // --- 交互逻辑 ---
  const handleDelete = async (itemId) => {
    if (confirm("确定要删除这个菜品吗？")) {
      try {
        await merchantService.deleteMenuItem(merchant.id, itemId);
        fetchMenu();
      } catch (error) {
        alert("删除失败");
      }
    }
  };

  const toggleStatus = async (item) => {
    try {
      const payload = {
        name: item.name,
        price: item.price,
        description: item.description,
        imageUrl: item.imageUrl,
        category: item.category,
        isAvailable: !item.isAvailable
      };
      // 乐观 UI 更新：先在本地改状态，看起来快一点
      setMenuItems(prev => prev.map(p => p.id === item.id ? { ...p, isAvailable: !p.isAvailable } : p));
      
      await merchantService.updateMenuItem(merchant.id, item.id, payload);
      // 如果失败再回滚或者重拉（这里为了简单直接重拉确保一致）
      fetchMenu();
    } catch (error) {
      alert("状态更新失败");
      fetchMenu();
    }
  };

  // 筛选逻辑
  const filteredItems = activeCategory === '全部' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  if (loading) return <div className="text-center py-10 text-gray-500">正在获取菜单数据...</div>;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Page Heading & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-white text-2xl font-extrabold tracking-tight">菜单管理</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">管理您店铺的菜品、分类及库存状态</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm shadow-orange-200 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          <span>新增菜品</span>
        </button>
      </div>

      {/* Filters / Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors border ${
              activeCategory === cat
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-orange-500 hover:text-orange-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="group bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 dark:border-slate-800 flex flex-col">
            
            {/* Image Area */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
              <div className="absolute top-3 left-3 z-10">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-sm text-white ${
                  item.isAvailable ? 'bg-emerald-500/90' : 'bg-slate-500/90'
                }`}>
                  {item.isAvailable ? '在售' : '售罄'}
                </span>
              </div>
              
              {/* Image with sold out overlay */}
              {!item.isAvailable && (
                <div className="absolute inset-0 bg-white/30 dark:bg-black/40 pointer-events-none z-0"></div>
              )}
              
              <div 
                className={`w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500 ${!item.isAvailable ? 'grayscale-[0.5]' : ''}`}
                style={{ backgroundImage: `url('${item.imageUrl || "https://placehold.co/600x400?text=No+Image"}')` }}
              />
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-tight line-clamp-1" title={item.name}>
                  {item.name}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-500 text-[10px] px-2 py-0.5 rounded font-bold">
                  {item.category || '默认'}
                </span>
              </div>
              
              <p className="text-orange-500 font-display font-bold text-lg mb-2">¥ {item.price}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                {item.description || "暂无描述"}
              </p>

              {/* Actions Footer */}
              <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Tailwind Toggle Switch */}
                  <button 
                    onClick={() => toggleStatus(item)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      item.isAvailable ? 'bg-orange-500' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-xs font-medium text-slate-500">{item.isAvailable ? '上架' : '下架'}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => openEditModal(item)}
                    className="p-2 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" 
                    title="编辑"
                  >
                    <span className="material-symbols-outlined text-xl">edit_square</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" 
                    title="删除"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Add/Edit Modal (Tailwind Style) --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">{isEditMode ? '编辑菜品' : '新增菜品'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">菜品名称</label>
                  <input 
                    required
                    className="w-full rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 bg-slate-50 focus:bg-white text-sm py-2.5 transition-all"
                    placeholder="例如：招牌红烧肉"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">价格 (¥)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 bg-slate-50 focus:bg-white text-sm py-2.5 transition-all"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">分类</label>
                  <input 
                    required
                    className="w-full rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 bg-slate-50 focus:bg-white text-sm py-2.5 transition-all"
                    placeholder="例如：热菜"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">图片链接</label>
                <input 
                  className="w-full rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 bg-slate-50 focus:bg-white text-sm py-2.5 transition-all"
                  placeholder="https://example.com/food.jpg"
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">描述</label>
                <textarea 
                  className="w-full rounded-xl border-slate-200 focus:border-orange-500 focus:ring-orange-500 bg-slate-50 focus:bg-white h-24 resize-none text-sm py-2.5 transition-all"
                  placeholder="请输入菜品的详细描述..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Toggle in Modal (Edit Mode Only) */}
              {isEditMode && (
                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">当前状态</span>
                    <div className="flex items-center gap-3">
                       <span className={`text-sm font-medium ${formData.isAvailable ? 'text-emerald-600' : 'text-slate-500'}`}>
                         {formData.isAvailable ? '已上架' : '已下架'}
                       </span>
                       <button 
                         type="button"
                         onClick={() => setFormData(prev => ({...prev, isAvailable: !prev.isAvailable}))}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                    </div>
                 </div>
              )}

              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors text-sm"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30 text-sm"
                >
                  {isEditMode ? '保存修改' : '立即创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}