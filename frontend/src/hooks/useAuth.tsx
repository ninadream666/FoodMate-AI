import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

interface User {
    id: string;
    phone: string;
    nickname: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (phone: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
    logout: () => Promise<void>;
}

interface AuthProviderProps {
    children: ReactNode;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | null>(null);

// 认证状态管理 Hook
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// 认证 Provider 组件
export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 初始化认证状态
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userStr = await AsyncStorage.getItem('user');

                if (token && userStr) {
                    const userData = JSON.parse(userStr);
                    setUser(userData);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('初始化认证状态失败:', error);
                // 清除可能损坏的数据
                await AsyncStorage.multiRemove(['token', 'user']);
                setUser(null);
                setIsAuthenticated(false);
            }
        };

        initializeAuth();
    }, []);

    // 登录
    const login = async (phone: string, password: string) => {
        try {
            setLoading(true);
            const response = await authService.login({ phone, password });

            if (response && response.token) {
                const userData: User = {
                    id: response.id,
                    phone: response.phone,
                    nickname: response.nickname,
                    role: response.role || 'CUSTOMER'
                };

                setUser(userData);
                setIsAuthenticated(true);

                return { success: true, user: userData };
            } else {
                throw new Error('登录响应数据无效');
            }
        } catch (error: unknown) {
            console.error('Login failed:', error);
            return {
                success: false,
                message: (error as Error).message || '登录失败，请重试'
            };
        } finally {
            setLoading(false);
        }
    };

    // 登出
    const logout = async () => {
        try {
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('登出失败:', error);
            // 即使登出失败，也清除本地状态
            setUser(null);
            setIsAuthenticated(false);
        }
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