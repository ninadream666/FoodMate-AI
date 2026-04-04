import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { merchantService } from '../../services/merchantService';

/**
 * 菜单管理页面
 */
export default function MenuManagement() {
  const { merchant } = useOutletContext();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 模态框状态
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // --- 全局定制化UI弹窗状态 ---
  const [dialog, setDialog] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm'
    message: '',
    onConfirm: null
  });

  // 分类筛选状态
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
      const response = await merchantService.getMenu(merchant.id);
      // 安全提取数组
      const data = Array.isArray(response) ? response : (response?.data || []);
      
      // 在前端强制按ID排序，保证状态切换时顺序绝对不变
      const sortedData = [...data].sort((a, b) => a.id - b.id);
      setMenuItems(sortedData);
      
      // 提取所有不重复的分类
      const cats = ['全部', ...new Set(sortedData.map(item => item.category).filter(Boolean))];
      setCategories(cats);
    } catch (error) {
      console.error("加载菜单失败", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 弹窗辅助函数 ---
  const showConfirm = (message, onConfirmCallback) => {
    setDialog({ isOpen: true, type: 'confirm', message, onConfirm: onConfirmCallback });
  };

  const showAlert = (message) => {
    setDialog({ 
      isOpen: true, 
      type: 'alert', 
      message, 
      onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })) 
    });
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
      showAlert(isEditMode ? "菜品修改成功！" : "新增菜品成功！");
    } catch (error) {
      showAlert("操作失败：" + error.message);
    }
  };

  // --- 交互逻辑 ---
  const handleDelete = (itemId) => {
    showConfirm("确定要删除这个菜品吗？", async () => {
      setDialog(prev => ({ ...prev, isOpen: false })); // 关闭确认框
      try {
        await merchantService.deleteMenuItem(merchant.id, itemId);
        fetchMenu();
        showAlert("菜品已成功删除。");
      } catch (error) {
        showAlert("删除失败：" + error.message);
      }
    });
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
      setMenuItems(prev => prev.map(p => p.id === item.id ? { ...p, isAvailable: !p.isAvailable } : p));
      
      await merchantService.updateMenuItem(merchant.id, item.id, payload);
      fetchMenu();
    } catch (error) {
      // 替换原生的 alert
      showAlert("状态更新失败，请重试。");
      fetchMenu();
    }
  };

  // 筛选逻辑
  const filteredItems = activeCategory === '全部' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  if (loading) return <div className="text-center py-10 text-text-tertiary">正在获取菜单数据...</div>;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 relative">
      
      {/* Page Heading & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary text-2xl font-extrabold tracking-tight">菜单管理</h1>
          <p className="text-text-secondary text-sm">管理您店铺的菜品、分类及库存状态</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold shadow-primary transition-all active:scale-95"
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
                ? 'bg-text-primary text-white border-text-primary'
                : 'bg-surface text-text-secondary border-border hover:border-primary hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => {
          // 处理空字符串或null字符串引起的图片显示问题
          const safeImgUrl = (item.imageUrl && item.imageUrl !== 'null') ? item.imageUrl : 'https://placehold.co/600x400?text=No+Image';
          
          return (
            <div key={item.id} className="group bg-surface rounded-xl overflow-hidden transition-all duration-300 border border-border-light flex flex-col hover:shadow-card">
              
              {/* Image Area */}
              <div className="relative aspect-video w-full overflow-hidden bg-background-section">
                <div className="absolute top-3 left-3 z-10">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm backdrop-blur-sm text-white ${
                    item.isAvailable ? 'bg-success/90' : 'bg-text-tertiary/90'
                  }`}>
                    {item.isAvailable ? '在售' : '售罄'}
                  </span>
                </div>
                
                {/* Image with sold out overlay */}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-white/40 pointer-events-none z-10"></div>
                )}
                
                <img 
                  src={safeImgUrl}
                  onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=No+Image'; }}
                  alt={item.name}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!item.isAvailable ? 'grayscale-[0.5]' : ''}`}
                />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h3 className="text-text-primary font-bold text-lg leading-tight line-clamp-1" title={item.name}>
                    {item.name}
                  </h3>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary-bg text-primary text-[10px] px-2 py-0.5 rounded font-bold">
                    {item.category || '默认'}
                  </span>
                </div>
                
                <p className="text-primary font-display font-bold text-lg mb-2">¥ {item.price}</p>
                <p className="text-text-secondary text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                  {item.description || "暂无描述"}
                </p>

                {/* Actions Footer */}
                <div className="pt-4 mt-auto border-t border-border-light flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleStatus(item)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        item.isAvailable ? 'bg-primary' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-medium text-text-secondary">{item.isAvailable ? '上架' : '下架'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary-soft transition-colors" 
                      title="编辑"
                    >
                      <span className="material-symbols-outlined text-xl">edit_square</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error-bg transition-colors" 
                      title="删除"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* --- Add/Edit Modal --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm transition-all">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-light flex justify-between items-center bg-background-section">
              <h3 className="text-lg font-bold text-text-primary">{isEditMode ? '编辑菜品' : '新增菜品'}</h3>
              <button onClick={() => setShowModal(false)} className="text-text-tertiary hover:text-text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-text-primary mb-1.5">菜品名称</label>
                  <input 
                    required
                    className="w-full rounded-xl border-border-light focus:border-primary focus:ring-primary bg-background-section focus:bg-surface text-text-primary text-sm py-2.5 px-3 transition-all outline-none"
                    placeholder="例如：招牌红烧肉"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1.5">价格 (¥)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    className="w-full rounded-xl border-border-light focus:border-primary focus:ring-primary bg-background-section focus:bg-surface text-text-primary text-sm py-2.5 px-3 transition-all outline-none"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-primary mb-1.5">分类</label>
                  <input 
                    required
                    className="w-full rounded-xl border-border-light focus:border-primary focus:ring-primary bg-background-section focus:bg-surface text-text-primary text-sm py-2.5 px-3 transition-all outline-none"
                    placeholder="例如：热菜"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-1.5">图片链接</label>
                <input 
                  className="w-full rounded-xl border-border-light focus:border-primary focus:ring-primary bg-background-section focus:bg-surface text-text-primary text-sm py-2.5 px-3 transition-all outline-none"
                  placeholder="https://example.com/food.jpg"
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-text-primary mb-1.5">描述</label>
                <textarea 
                  className="w-full rounded-xl border-border-light focus:border-primary focus:ring-primary bg-background-section focus:bg-surface h-24 resize-none text-text-primary text-sm py-2.5 px-3 transition-all outline-none"
                  placeholder="请输入菜品的详细描述..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Toggle in Modal (Edit Mode Only) */}
              {isEditMode && (
                 <div className="flex items-center justify-between p-4 bg-background-section rounded-xl border border-border-light">
                    <span className="text-sm font-bold text-text-primary">当前状态</span>
                    <div className="flex items-center gap-3">
                       <span className={`text-sm font-medium ${formData.isAvailable ? 'text-success' : 'text-text-secondary'}`}>
                         {formData.isAvailable ? '已上架' : '已下架'}
                       </span>
                       <button 
                         type="button"
                         onClick={() => setFormData(prev => ({...prev, isAvailable: !prev.isAvailable}))}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isAvailable ? 'bg-success' : 'bg-border'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                    </div>
                 </div>
              )}

              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border-light">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-background-section transition-colors text-sm"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 transition-colors shadow-primary text-sm"
                >
                  {isEditMode ? '保存修改' : '立即创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- 全局定制化Modal弹窗 --- */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-border-light">
            <div className="p-6 text-center">
              <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full mb-4 ${
                dialog.type === 'confirm' ? 'bg-primary-soft text-primary' : 'bg-info-bg text-info'
              }`}>
                <span className="material-symbols-outlined text-[28px]">
                  {dialog.type === 'confirm' ? 'help' : 'info'}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-text-primary mb-2">
                {dialog.type === 'confirm' ? '确认操作' : '提示'}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {dialog.message}
              </p>
            </div>
            
            <div className="px-6 py-4 bg-background-section border-t border-border-light flex justify-center gap-3">
              {dialog.type === 'confirm' && (
                <button
                  onClick={() => setDialog({ ...dialog, isOpen: false })}
                  className="flex-1 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-surface transition-colors border border-border-light shadow-sm text-sm"
                >
                  取消
                </button>
              )}
              <button
                onClick={dialog.onConfirm}
                className="flex-1 py-2.5 rounded-xl font-bold bg-primary text-white hover:opacity-90 transition-colors shadow-primary text-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}