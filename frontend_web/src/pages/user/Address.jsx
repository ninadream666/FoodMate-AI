import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addressService } from '../../services/addressService';
import { authService } from '../../services/authService';

export default function Address() {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // 新增地址表单数据
  const [newAddress, setNewAddress] = useState({
    contactName: '',
    phone: '',
    city: '',
    street: '',
    detail: '',
    label: '家'
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const data = await addressService.getMyAddresses();
      // 排序：默认地址排第一，剩下的按 ID 倒序
      const sorted = data.sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return b.id - a.id;
      });
      setAddresses(sorted);
    } catch (error) {
      console.error("加载地址失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      // 只发送后端支持的字段：暂时先这样，之后要改再说
      // 因为后端AddressDto只有city, street, detail(和可选的isDefault)
      // 如果发送contactName会导致后端报错 400 Bad Request
      const payload = {
        city: newAddress.city,
        street: newAddress.street,
        detail: newAddress.detail
      };

      await addressService.addAddress(payload);
      alert('添加成功！');
      setShowAddModal(false);
      setNewAddress({ contactName: '', phone: '', city: '', street: '', detail: '', label: '家' }); 
      fetchAddresses(); 
    } catch (error) {
      console.error(error);
      alert("添加失败：" + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('确认删除该地址吗？')) {
      try {
        await addressService.deleteAddress(id);
        fetchAddresses(); // 刷新列表
      } catch (error) {
        alert('删除失败');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      fetchAddresses(); // 刷新列表
    } catch (error) {
      alert('设置失败');
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#f8f7f5] overflow-x-hidden font-sans text-[#1c130d]">
      <div className="layout-container flex h-full grow flex-col">
        
        {/* --- Header --- */}
        <header className="flex items-center justify-between border-b border-solid border-[#f4ece7] px-6 lg:px-10 py-4 bg-white shadow-sm">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/home')}>
            <div className="size-6 text-orange-500">
              <svg fill="currentColor" viewBox="0 0 48 48"><path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"></path></svg>
            </div>
            <h2 className="text-lg font-bold">美食外卖平台</h2>
          </div>
          <div className="flex flex-1 justify-end gap-4 items-center">
            <button onClick={() => navigate('/home')} className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors mr-2">
              <span className="material-symbols-outlined text-lg">home</span>
              首页
            </button>
            <span className="text-sm font-medium hidden sm:inline">{user.username}</span>
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border border-gray-200" style={{ backgroundImage: 'url("/default-avatar.png")' }}></div>
            <button onClick={handleLogout} className="text-sm font-bold text-orange-500 px-4 py-2 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">退出</button>
          </div>
        </header>

        <div className="flex flex-1">
          {/* --- Sidebar --- */}
          <aside className="w-64 flex-shrink-0 p-6 hidden md:block bg-white border-r border-[#f4ece7]">
            <div className="flex flex-col gap-2">
              <SidebarItem icon="person" label="个人资料" onClick={() => navigate('/profile')} />
              <SidebarItem icon="receipt_long" label="我的订单" onClick={() => navigate('/orders')} />
              <SidebarItem icon="home_pin" label="地址管理" active />
              <SidebarItem icon="account_balance_wallet" label="钱包与优惠券" onClick={() => navigate('/wallet')} />
            </div>
          </aside>

          {/* --- Main Content --- */}
          <main className="flex-1 p-6 lg:p-8">
            <div className="flex flex-col gap-6 max-w-6xl mx-auto">
              
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">地址管理</h3>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/30"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  <span className="font-bold text-sm">新增地址</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                  <p className="text-gray-500 col-span-full text-center py-10">加载中...</p>
                ) : addresses.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">location_off</span>
                    <p className="text-gray-500">暂无地址，请点击右上角添加</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className={`flex flex-col gap-4 p-5 rounded-xl bg-white shadow-sm border-2 transition-colors group relative ${addr.isDefault ? 'border-orange-500' : 'border-transparent hover:border-orange-200'}`}>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* 暂用当前登录用户的信息，因为地址表里没存联系人 */}
                          <p className="text-base font-bold">{user.nickname || user.username}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDelete(addr.id)} className="p-1 rounded hover:bg-red-50 text-red-500">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-500">
                          地址
                        </span>
                        {addr.isDefault && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-50 text-green-600">
                            默认
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 h-10 line-clamp-2">
                        {addr.city} {addr.street} {addr.detail}
                      </p>

                      <div className="border-t border-gray-100 pt-4 mt-auto">
                        {!addr.isDefault ? (
                          <button 
                            onClick={() => handleSetDefault(addr.id)}
                            className="w-full py-1 text-sm font-medium text-gray-400 hover:text-orange-500 transition-colors"
                          >
                            设为默认
                          </button>
                        ) : (
                          <button disabled className="w-full py-1 text-sm font-medium text-orange-500 opacity-50 cursor-default">
                            默认地址
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* --- 新增地址弹窗 --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">新增收货地址</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleAddAddress} className="p-6 flex flex-col gap-4">
              
              {/* 这两个字段目前仅仅是 UI 展示，后端不保存，所以加个提示 */}
              <div className="opacity-50 pointer-events-none">
                <label className="block text-sm font-medium text-gray-700 mb-1">联系人 (暂使用账号信息)</label>
                <input disabled className="w-full rounded-lg border-gray-200 bg-gray-100" value={user.nickname || user.username} />
              </div>
              
              <div className="opacity-50 pointer-events-none">
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号 (暂使用账号信息)</label>
                <input disabled className="w-full rounded-lg border-gray-200 bg-gray-100" value={user.phone} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">城市 <span className="text-red-500">*</span></label>
                <input 
                  required
                  className="w-full rounded-lg border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="例如：北京市"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">街道/小区 <span className="text-red-500">*</span></label>
                <input 
                  required
                  className="w-full rounded-lg border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="例如：中关村大街1号"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">门牌号/详细信息</label>
                <input 
                  // 1. 移除了 required 属性
                  className="w-full rounded-lg border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  placeholder="例如：A座 101室 (选填)"
                  value={newAddress.detail}
                  onChange={(e) => setNewAddress({...newAddress, detail: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="mt-4 w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors"
              >
                保存地址
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-orange-50 text-orange-500' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
      <span className={`material-symbols-outlined ${active ? 'fill' : ''}`}>{icon}</span>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}