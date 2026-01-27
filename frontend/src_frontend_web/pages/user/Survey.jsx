import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';

export default function Survey() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 问卷状态
  const [flavor, setFlavor] = useState(''); // 单选
  const [cuisines, setCuisines] = useState([]); // 多选
  const [allergies, setAllergies] = useState([]); // 多选
  
  // “其他”忌口状态
  const [otherAllergy, setOtherAllergy] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // 选项数据
  const FLAVOR_OPTIONS = [
    { label: '无辣不欢', emoji: '🌶️', id: 'spicy' },
    { label: '清淡养生', emoji: '🥗', id: 'light' },
    { label: '酸甜可口', emoji: '🍅', id: 'sour_sweet' },
    { label: '咸香浓郁', emoji: '🥩', id: 'salty' },
  ];

  const CUISINE_OPTIONS = [
    { label: '川湘菜', emoji: '🌶️', id: 'sichuan' },
    { label: '粤菜点心', emoji: '🥟', id: 'cantonese' },
    { label: '日韩料理', emoji: '🍣', id: 'japanese_korean' },
    { label: '西式快餐', emoji: '🍔', id: 'western' },
    { label: '轻食沙拉', emoji: '🥗', id: 'salad' },
    { label: '地方小吃', emoji: '🍜', id: 'snacks' },
  ];

  const ALLERGY_OPTIONS = ['不吃香菜', '不吃葱蒜', '海鲜过敏', '花生过敏', '无'];

  // 处理多选切换
  const toggleSelection = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    // 合并“其他”忌口
    let finalAllergies = [...allergies];
    if (showOtherInput && otherAllergy.trim()) {
      finalAllergies.push(otherAllergy.trim());
    }

    // 构建后端 UserProfile 对象结构
    const profileData = {
      preferences: {
        taste: flavor
      },
      tags: cuisines,
      allergies: finalAllergies,
      // 初始化其他字段
      favoriteMerchantIds: [],
      browseHistory: []
    };

    try {
      await profileService.updateProfile(profileData);
      // 提交成功，跳转首页
      navigate('/home');
    } catch (error) {
      console.error(error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#fff5ec] dark:bg-[#221710] text-[#333] dark:text-gray-200 font-sans overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-10 sm:py-16 px-4">
          <div className="layout-content-container flex flex-col w-full max-w-2xl flex-1 gap-8">
            
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-full max-w-md">
                <h1 className="text-[#1c130d] dark:text-white tracking-tight text-3xl sm:text-4xl font-bold leading-tight">定制您的专属美味</h1>
                <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal pt-2">为了给您推荐更合口味的美食，请花 10 秒钟告诉我们您的喜好</p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-md pt-4">
                <div className="flex gap-6 justify-end"><p className="text-[#1c130d] dark:text-gray-300 text-sm font-normal">Step 1/1</p></div>
                <div className="rounded-full bg-orange-200"><div className="h-2 rounded-full bg-orange-500 w-full"></div></div>
              </div>
            </div>

            {/* Questions */}
            <div className="flex flex-col gap-10">
              
              {/* Q1: Flavor */}
              <div className="flex flex-col gap-4">
                <h2 className="text-[#1c130d] dark:text-white text-xl font-bold leading-tight text-left">您平时喜欢的口味倾向？(单选)</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {FLAVOR_OPTIONS.map((opt) => (
                    <div 
                      key={opt.id}
                      onClick={() => setFlavor(opt.id)}
                      className={`relative cursor-pointer group flex flex-col gap-3 rounded-xl justify-center items-center p-4 aspect-square border-2 transition-all duration-200 ${
                        flavor === opt.id 
                          ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/20' 
                          : 'bg-white border-transparent hover:border-orange-300'
                      }`}
                    >
                      <div className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full ${flavor === opt.id ? 'bg-white' : 'border border-gray-300'}`}>
                        {flavor === opt.id && <span className="material-symbols-outlined text-orange-500 text-sm">check</span>}
                      </div>
                      <span className="text-4xl">{opt.emoji}</span>
                      <p className={`text-base font-bold text-center ${flavor === opt.id ? 'text-white' : 'text-[#1c130d]'}`}>{opt.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Q2: Cuisine */}
              <div className="flex flex-col gap-4">
                <h2 className="text-[#1c130d] dark:text-white text-xl font-bold leading-tight text-left">您偏好的菜系？(多选)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CUISINE_OPTIONS.map((opt) => (
                    <div 
                      key={opt.id}
                      onClick={() => toggleSelection(cuisines, setCuisines, opt.id)}
                      className={`cursor-pointer flex items-center gap-3 rounded-lg p-3 border transition-colors duration-200 ${
                        cuisines.includes(opt.id)
                          ? 'bg-orange-100 border-orange-500'
                          : 'bg-white border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <p className="font-medium text-[#1c130d]">{opt.label}</p>
                      {cuisines.includes(opt.id) && <span className="material-symbols-outlined text-orange-500 ml-auto">check</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Q3: Allergies */}
              <div className="flex flex-col gap-4">
                <h2 className="text-[#1c130d] dark:text-white text-xl font-bold leading-tight text-left">有什么忌口吗？</h2>
                <div className="flex flex-wrap gap-3">
                  {ALLERGY_OPTIONS.map((opt) => (
                    <div 
                      key={opt}
                      onClick={() => {
                        if(opt === '无') {
                          setAllergies(['无']); 
                          setShowOtherInput(false);
                        } else {
                          const newList = allergies.filter(i => i !== '无'); // 如果选了别的，去掉"无"
                          if (allergies.includes(opt)) {
                            setAllergies(newList.filter(i => i !== opt));
                          } else {
                            setAllergies([...newList, opt]);
                          }
                        }
                      }}
                      className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium border transition-colors duration-200 ${
                        allergies.includes(opt)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                  
                  {/* 其他 - 触发输入框 */}
                  <div 
                    onClick={() => setShowOtherInput(!showOtherInput)}
                    className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium border transition-colors duration-200 ${
                      showOtherInput
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    其他
                  </div>
                </div>

                {/* 动态输入框 */}
                {showOtherInput && (
                  <input 
                    type="text" 
                    placeholder="请输入其他忌口，如：芒果、牛奶..." 
                    className="w-full mt-2 p-3 rounded-lg border border-orange-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={otherAllergy}
                    onChange={(e) => setOtherAllergy(e.target.value)}
                  />
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="flex flex-col items-center gap-4 pt-6 pb-10">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center justify-center w-full max-w-sm rounded-full bg-orange-500 h-12 px-6 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-colors duration-200 disabled:opacity-70"
              >
                {loading ? '保存中...' : '开启美食之旅'}
              </button>
              <button onClick={() => navigate('/home')} className="text-sm text-gray-500 hover:text-orange-500 transition-colors">
                跳过 (稍后设置)
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}