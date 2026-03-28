import React, { useState } from 'react';
import { authService } from '../../services/authService';
import adminAuthService from '../../services/admin/authService';
import { profileService } from '../../services/profileService';
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
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden font-sans">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="layout-content-container flex w-full max-w-6xl flex-1 overflow-hidden rounded-lg bg-[#fcfaf8] dark:bg-[#2a1e17] shadow-lg">

            {/* 左侧图片 */}
            <div className="hidden lg:flex lg:w-1/2 flex-col gap-6 p-10 bg-[#f4ece7] dark:bg-[#32241b]">
              <div className="flex flex-col gap-2 text-left">
                <h1 className="text-[#1c130d] dark:text-white text-4xl font-black leading-tight">
                  发现美味，一键送达
                </h1>
                <h2 className="text-[#1c130d] dark:text-gray-300 text-base font-normal">
                  加入我们，开启您的美食探索之旅。
                </h2>
              </div>
              <div
                className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-lg"
                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0SqHYZlIXyFFcCFeErv7z3OCT3dWL1Eb2_7H2rw85kJN-QpFQB9NJg1JxLfHuCIcc9LySyuY9gHTuNFRiQSUFM8n2tPxCcoUCuHVr8uHm0PM8ZtGLP7QMU3v8nwmLVsQjHJV_Xmx8pj2VI06I7Y2sT_i4dCsutqf6twJq3q-ck158JrAnEH2_JJ_3UW8OxWRCet5OikJ1MztLTr8IWYEs2qvK6uAcJ326SNeNfYtyh-5Hrc5P2mZIGeIKpWDoz2AF5UcrzZHEWx8u")' }}
              ></div>
            </div>

            {/* 右侧表单 */}
            <div className="w-full lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
              <div className="flex flex-col gap-6 max-w-md mx-auto w-full">
                <h1 className="text-[#1c130d] dark:text-white text-[32px] font-bold leading-tight text-left">
                  {isLogin ? '欢迎回来' : '创建新账户'}
                </h1>

                {/* 切换 Tab */}
                <div className="flex h-10 w-full items-center justify-center rounded-full bg-[#f4ece7] dark:bg-[#32241b] p-1">
                  <button onClick={() => setIsLogin(true)} className={`flex h-full grow items-center justify-center rounded-full px-2 text-sm font-medium transition-all ${isLogin ? 'bg-[#fcfaf8] dark:bg-[#2a1e17] shadow text-[#1c130d] dark:text-white' : 'text-[#9c6c49] dark:text-gray-400'}`}>登录</button>
                  <button onClick={() => setIsLogin(false)} className={`flex h-full grow items-center justify-center rounded-full px-2 text-sm font-medium transition-all ${!isLogin ? 'bg-[#fcfaf8] dark:bg-[#2a1e17] shadow text-[#1c130d] dark:text-white' : 'text-[#9c6c49] dark:text-gray-400'}`}>注册</button>
                </div>

                {/* 角色选择：登录注册都显示 */}
                <div className="flex flex-col">
                  <p className="text-[#1c130d] dark:text-gray-200 text-base font-medium pb-2">请选择您的身份</p>
                  <div className="grid grid-cols-4 gap-2">
                    <RoleOption label="顾客" value="customer" currentRole={role} setRole={setRole} icon={<UserIcon />} />
                    <RoleOption label="商家" value="merchant" currentRole={role} setRole={setRole} icon={<StoreIcon />} />
                    <RoleOption label="骑手" value="rider" currentRole={role} setRole={setRole} icon={<BikeIcon />} />
                    <RoleOption label="管理员" value="admin" currentRole={role} setRole={setRole} icon={<AdminIcon />} />
                  </div>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <label className="flex flex-col min-w-40 flex-1">
                    <p className="text-[#1c130d] dark:text-gray-200 text-base font-medium pb-2">用户名</p>
                    <input name="username" value={formData.username} onChange={handleChange} className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded text-[#1c130d] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#e8d9ce] dark:border-[#4a3f36] bg-[#fcfaf8] dark:bg-[#2a1e17] focus:border-primary/80 h-14 placeholder:text-[#9c6c49] dark:placeholder:text-gray-500 p-[15px] text-base font-normal" placeholder="请输入用户名" required />
                  </label>

                  {!isLogin && (
                    <label className="flex flex-col min-w-40 flex-1">
                      <p className="text-[#1c130d] dark:text-gray-200 text-base font-medium pb-2">邮箱地址</p>
                      <input name="email" type="email" value={formData.email} onChange={handleChange} className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded text-[#1c130d] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#e8d9ce] dark:border-[#4a3f36] bg-[#fcfaf8] dark:bg-[#2a1e17] focus:border-primary/80 h-14 placeholder:text-[#9c6c49] dark:placeholder:text-gray-500 p-[15px] text-base font-normal" placeholder="example@email.com" required />
                    </label>
                  )}

                  <label className="flex flex-col min-w-40 flex-1">
                    <p className="text-[#1c130d] dark:text-gray-200 text-base font-medium pb-2">密码</p>
                    <div className="flex w-full flex-1 items-stretch rounded">
                      <input name="password" value={formData.password} onChange={handleChange} type={showPassword ? "text" : "password"} className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded text-[#1c130d] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#e8d9ce] dark:border-[#4a3f36] bg-[#fcfaf8] dark:bg-[#2a1e17] focus:border-primary/80 h-14 placeholder:text-[#9c6c49] dark:placeholder:text-gray-500 p-[15px] rounded-r-none border-r-0 pr-2 text-base font-normal" placeholder="请输入密码" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#9c6c49] dark:text-gray-400 flex border border-[#e8d9ce] dark:border-[#4a3f36] bg-[#fcfaf8] dark:bg-[#2a1e17] items-center justify-center pr-[15px] pl-3 rounded-r border-l-0 hover:text-primary transition-colors">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </label>

                  <button
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-5 mt-4 bg-primary text-white text-base font-bold tracking-[0.015em] hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
                  </button>
                </form>

                <div className="text-center">
                  <a className="text-sm font-medium text-[#9c6c49] dark:text-gray-400 hover:text-primary" href="#">忘记密码?</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleOption({ label, value, currentRole, setRole, icon }) {
  const isSelected = currentRole === value;
  return (
    <div onClick={() => setRole(value)} className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border p-2 text-center transition-all h-20 ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-[#e8d9ce] dark:border-[#4a3f36] text-[#9c6c49] dark:text-gray-400 hover:bg-gray-50'}`}>
      {icon}
      <span className="text-xs sm:text-sm font-bold truncate w-full">{label}</span>
    </div>
  );
}

const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const StoreIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" /><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" /><path d="M2 7h20" /><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" /></svg>);
const BikeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18.5" cy="17.5" r="3.5" /><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="15" cy="5" r="1" /><path d="M12 17.5V14l-3-3 4-3 2 3h2" /></svg>);
const AdminIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>); // 简单的盾牌图标
const EyeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>);
const EyeOffIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>);