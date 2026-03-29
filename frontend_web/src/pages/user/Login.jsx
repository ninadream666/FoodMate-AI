import React, { useState } from 'react';
import { authService } from '../../services/authService.js';
import adminAuthService from '../../services/admin/authService.js';
import { profileService } from '../../services/profileService.js';
import { useNavigate } from 'react-router-dom';

export default function Login({ initialRole = 'customer' }) {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState(initialRole); // 默认角色
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 注册时校验邮箱
    if (!isLogin) {
      // 管理员不支持在此注册
      if (role === 'admin') {
        alert('管理员账号不支持自助注册，请联系系统管理员。');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailToValidate = formData.email.trim();

      if (!emailRegex.test(emailToValidate)) {
        alert("请输入有效的邮箱地址 (例如: user@example.com)");
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // --- 登录逻辑 ---
        console.log(`正在以 [${role}] 身份登录:`, formData.username);

        if (role === 'admin') {
          // 管理员登录逻辑
          await adminAuthService.login(formData.username, formData.password);
          navigate('/admin/dashboard');
        } else {
          // 普通用户/商家登录逻辑
          await authService.login(formData.username, formData.password, role);
          
          // --- 根据角色进行不同的跳转 ---
          if (role === 'merchant') {
            navigate('/merchant/menu');
          } else if (role === 'customer') {
            try {
              const profile = await profileService.getMyProfile();
              if (!profile.preferences || Object.keys(profile.preferences).length === 0) {
                navigate('/survey');
              } else {
                navigate('/home');
              }
            } catch (profileError) {
              console.error("检查用户画像失败，降级跳转首页:", profileError);
              navigate('/home');
            }
          } else {
            navigate('/home');
          }
        }

      } else {
        // --- 注册逻辑 ---
        console.log('正在注册...', formData);
        // 传入role
        await authService.register(formData.username, formData.email, formData.password, role);
        alert('注册成功！请直接登录。');
        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);
      alert(error.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-background font-sans p-6 overflow-hidden">
      
      {/* 氛围光晕 */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] bg-success/5 blur-[100px] rounded-full pointer-events-none"></div>

      {/* 核心登录卡片：严格锁定高度，保证外框大小绝对不变 */}
      <div className="relative z-10 flex w-full max-w-[1000px] h-[640px] lg:h-[680px] bg-surface rounded-[32px] shadow-2xl border border-border-light overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* 左侧品牌区 */}
        <div className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-10 bg-primary-soft/30 relative border-r border-border-light/50">
            <div className="flex flex-col items-center justify-center text-center">
                <div className="relative flex items-center justify-center size-36 rounded-full bg-white shadow-[0_0_50px_rgba(242,120,75,0.15)] border-4 border-primary/10 mb-8 z-10 group hover:border-primary/30 transition-colors duration-500">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 to-transparent"></div>
                    <span className="text-[64px] font-black text-primary tracking-tighter relative z-10 select-none" style={{ textShadow: '0 4px 12px rgba(242,120,75,0.25)' }}>
                        FA
                    </span>
                </div>
                <h1 className="text-4xl font-black text-text-primary tracking-tight z-10 mb-3">FoodMate-AI</h1>
                <p className="text-text-secondary text-base font-medium z-10">发现美味，一键送达。</p>
                <p className="text-text-tertiary text-xs font-bold mt-10 tracking-[0.2em] uppercase z-10 opacity-60">
                  Welcome to Food Journey
                </p>
            </div>
        </div>

        {/* 右侧表单操作区 */}
        <div className="w-full lg:w-7/12 p-6 sm:p-8 lg:p-10 flex flex-col bg-surface h-full">
          <div className="w-full max-w-[400px] mx-auto flex flex-col h-full">
            
            {/* 顶部弹性留白：吸收多余空间 */}
            <div className="flex-1 min-h-[1rem]"></div>

            {/* 核心内容组：固定 gap，移除 transition-all 以实现“直接切换无弹动” */}
            <div className="flex flex-col gap-4 shrink-0 w-full">
              
              {/* 标题区 */}
              <div className="flex flex-col gap-1">
                <h2 className="text-[28px] sm:text-[32px] font-black text-text-primary tracking-tight">
                  {isLogin ? '欢迎回来' : '创建新账户'}
                </h2>
                <p className="text-text-secondary text-xs sm:text-sm font-medium">
                  {isLogin ? '登录以继续您的美食与服务管理之旅' : '加入 FoodMate，开启高效便捷的新体验'}
                </p>
              </div>

              {/* 登录/注册 切换 Toggle */}
              <div className="flex h-11 w-full p-1 bg-background-section rounded-xl border border-border-light shadow-inner shrink-0 mt-1">
                <button 
                  onClick={() => setIsLogin(true)} 
                  className={`flex-1 h-full flex items-center justify-center rounded-lg text-sm font-black transition-all duration-300 ${
                    isLogin ? 'bg-surface shadow-sm text-primary' : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  登录
                </button>
                <button 
                  onClick={() => setIsLogin(false)} 
                  className={`flex-1 h-full flex items-center justify-center rounded-lg text-sm font-black transition-all duration-300 ${
                    !isLogin ? 'bg-surface shadow-sm text-primary' : 'text-text-tertiary hover:text-text-primary'
                  }`}
                >
                  注册
                </button>
              </div>

              {/* 角色选择器 */}
              <div className="flex flex-col gap-2 shrink-0">
                {/* 字体变大至 text-xs */}
                <p className="text-xs font-black text-text-secondary uppercase tracking-wider ml-1">选择身份</p>
                <div className="grid grid-cols-4 gap-2">
                  <RoleOption label="顾客" value="customer" currentRole={role} setRole={setRole} icon={<UserIcon size="22" />} />
                  <RoleOption label="商家" value="merchant" currentRole={role} setRole={setRole} icon={<StoreIcon size="22" />} />
                  <RoleOption label="骑手" value="rider" currentRole={role} setRole={setRole} icon={<BikeIcon size="22" />} />
                  <RoleOption label="管理员" value="admin" currentRole={role} setRole={setRole} icon={<AdminIcon size="22" />} />
                </div>
              </div>

              {/* 输入表单：移除外层动态间距与过渡动画 */}
              <form className="flex flex-col gap-3.5 shrink-0" onSubmit={handleSubmit}>
                
                <div>
                  {/* 字体变大至 text-xs */}
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-wider mb-1.5 ml-1">用户名</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-primary transition-colors">
                      <UserIcon size="18" />
                    </div>
                    <input 
                      name="username" 
                      value={formData.username} 
                      onChange={handleChange} 
                      className="w-full h-12 pl-11 pr-4 bg-background-section border border-border-light rounded-xl text-text-primary text-sm font-bold focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-tertiary placeholder:font-medium" 
                      placeholder="请输入用户名" 
                      required 
                    />
                  </div>
                </div>

                {!isLogin && (
                  <div className="animate-in fade-in duration-200">
                    <label className="block text-xs font-black text-text-secondary uppercase tracking-wider mb-1.5 ml-1">邮箱地址</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-primary transition-colors">
                        <MailIcon size="18" />
                      </div>
                      <input 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        className="w-full h-12 pl-11 pr-4 bg-background-section border border-border-light rounded-xl text-text-primary text-sm font-bold focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-tertiary placeholder:font-medium" 
                        placeholder="example@email.com" 
                        required 
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-text-secondary uppercase tracking-wider mb-1.5 ml-1">密码</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text-tertiary group-focus-within:text-primary transition-colors">
                      <LockIcon size="18" />
                    </div>
                    <input 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      type={showPassword ? "text" : "password"} 
                      className="w-full h-12 pl-11 pr-10 bg-background-section border border-border-light rounded-xl text-text-primary text-sm font-bold focus:bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-text-tertiary placeholder:font-medium" 
                      placeholder="请输入密码" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute inset-y-0 right-3 flex items-center justify-center text-text-tertiary hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOffIcon size="18" /> : <EyeIcon size="18" />}
                    </button>
                  </div>
                </div>

                {/* 仅在登录模式下才渲染“忘记密码”相关的整个占位区块，完美解决注册时按钮间距过大的问题 */}
                {isLogin && (
                  <div className="flex justify-end items-center h-3 shrink-0">
                    <button type="button" className="text-[11px] font-bold text-text-secondary hover:text-primary transition-colors">
                      忘记密码？
                    </button>
                  </div>
                )}

                <button
                  disabled={loading}
                  className="mt-1 w-full h-12 shrink-0 rounded-xl bg-primary text-white text-sm font-black tracking-widest uppercase hover:opacity-90 shadow-primary transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      处理中...
                    </>
                  ) : (
                    isLogin ? '登 录' : '立 即 注 册'
                  )}
                </button>
              </form>
            </div>

            {/* 底部引导词 */}
            <div className="text-center text-[11px] font-medium text-text-secondary mt-4 mb-1 shrink-0">
              {isLogin ? '还没有账户？' : '已拥有账户？'}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                className="ml-1.5 font-black text-primary hover:underline transition-all"
              >
                {isLogin ? '去注册' : '直接登录'}
              </button>
            </div>

            {/* 底部弹性留白 */}
            <div className="flex-1 min-h-[1rem]"></div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 子组件：角色选择项 ---
function RoleOption({ label, value, currentRole, setRole, icon }) {
  const isSelected = currentRole === value;
  return (
    <button 
      type="button"
      onClick={() => setRole(value)} 
      className={`flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all duration-300 ${
        isSelected 
        ? 'bg-primary-soft text-primary border border-primary/30 shadow-sm scale-105' 
        : 'bg-background-section text-text-secondary border border-border-light hover:text-text-primary hover:bg-surface-hover'
      }`}
    >
      <div className={isSelected ? 'scale-110 transition-transform' : 'transition-transform'}>
        {icon}
      </div>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}

// --- Icons ---
const UserIcon = ({ size = "24" }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const StoreIcon = ({ size = "24" }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></svg>);
const BikeIcon = ({ size = "24" }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5" /><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="15" cy="5" r="1" /><path d="M12 17.5V14l-3-3 4-3 2 3h2" /></svg>);
const AdminIcon = ({ size = "24" }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>);
const MailIcon = ({ size = "24" }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>);
const LockIcon = ({ size = "24" }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>);
const EyeIcon = ({ size = "20" }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>);
const EyeOffIcon = ({ size = "20" }) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>);