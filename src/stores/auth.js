// src/stores/auth.js - 修复后的版本

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/supabase' 

export const useAuthStore = defineStore('auth', () => {
    // 初始状态设为 null，让 initSession 负责初始化
    const user = ref(null) 
    const isReady = ref(false) // 只有当 Supabase 客户端完成会话检查后才设为 true

    // --- 初始化和订阅会话变化 ---
    const initSession = async () => {
        // 1. 尝试立即获取 Supabase 会话状态
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            user.value = session.user
        }
        
        isReady.value = true; // 此时用户的初始登录状态已确定

        // 2. 设置监听器，处理后续登录/登出/Token刷新事件
        // 注意：onAuthStateChange 应该只负责未来的状态变化，不负责首次加载
        supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                user.value = session.user
            } else {
                user.value = null
            }
        })
    }

    // --- 认证方法 (省略，与之前保持一致) ---
    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        return data
    }

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
    }

    const signOut = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }
    
    // 检查是否已认证
    const isAuthenticated = () => !!user.value

    return { 
        user, 
        isReady,
        initSession,
        signUp, 
        signIn, 
        signOut,
        isAuthenticated 
    }
})

// **重要：这里必须没有 useAuthStore().initSession()**