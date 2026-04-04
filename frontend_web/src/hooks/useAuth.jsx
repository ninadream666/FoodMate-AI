import { useState, useEffect, createContext, useContext } from 'react';
import authService from '../services/admin/authService';

// 创建认证上下文
const AuthContext = createContext(null);

// 认证状态管理Hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// 认证Provider组件
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 初始化认证状态
    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        const token = authService.getToken();

        if (currentUser && token && currentUser.role === 'admin') {
            setUser(currentUser);
            setIsAuthenticated(true);
        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    // 登录
    const login = async (username, password) => {
        try {
            setLoading(true);
            const response = await authService.login(username, password);

            if (response && response.token) {
                const userData = {
                    id: response.id,
                    username: response.username,
                    role: response.role || 'admin'
                };

                setUser(userData);
                setIsAuthenticated(true);

                return { success: true, user: userData };
            } else {
                throw new Error('登录响应数据无效');
            }
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                message: error.message || '登录失败，请重试'
            };
        } finally {
            setLoading(false);
        }
    };

    // 登出
    const logout = async () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/login';
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 受保护的路由组件
export const ProtectedRoute = ({ children, requiredRole }) => {
    const [isChecking, setIsChecking] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            try {
                // 根据需要的角色决定检查哪种Token
                let token, userStr;
                
                if (requiredRole === 'admin') {
                    token = localStorage.getItem('adminToken');
                    userStr = localStorage.getItem('adminUser');
                } else {
                    // 普通用户和商家使用通用的token
                    token = localStorage.getItem('token');
                    userStr = localStorage.getItem('user');
                }

                if (!token) {
                    setHasAccess(false);
                    setIsChecking(false);
                    return;
                }

                // 如果没有指定特定角色，只要有token就算通过（适用于普通用户）
                if (!requiredRole) {
                    setHasAccess(true);
                    setIsChecking(false);
                    return;
                }

                // 如果指定了角色，需要验证角色
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user.role === requiredRole) {
                        setHasAccess(true);
                    } else {
                        console.warn(`角色不匹配: 需要 ${requiredRole}, 当前是 ${user.role}`);
                        setHasAccess(false);
                    }
                } else {
                    // 有token但没user信息，暂时认为不通过，或者需要重新获取用户信息
                    setHasAccess(false);
                }

            } catch (error) {
                console.error('认证检查失败:', error);
                setHasAccess(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, [requiredRole]);

    if (isChecking) {
        return <div className="p-4 text-center">加载中...</div>;
    }

    if (hasAccess) {
        return children;
    }

    // 统一跳转到登录页
    return <Navigate to="/login" replace />;
};