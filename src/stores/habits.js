// src/stores/habits.js

import { ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/supabase' 
import { useAuthStore } from './auth' 

const getTodayDate = () => new Date().toISOString().slice(0, 10)

const calculateStats = (habitLogs) => {
    // [省略 stats 计算的辅助函数，因为它在刷新问题中不是核心]
    // 请确保您的文件中保留了此函数，以支持 StatsView
    if (habitLogs.length === 0) return { completion_rate: 0, current_streak: 0, best_streak: 0, total_days: 0, completed_days: 0 };
    
    const logMap = new Map();
    let totalLogs = 0;
    let completedLogs = 0;
    
    habitLogs.forEach(log => {
        totalLogs++;
        if (log.is_completed) completedLogs++;
        logMap.set(log.log_date, log.is_completed);
    });

    const uniqueDates = Array.from(logMap.keys()).sort();
    let bestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    let lastDate = null;
    const today = getTodayDate();

    for (const dateStr of uniqueDates) {
        const isCompleted = logMap.get(dateStr);
        const currentDate = new Date(dateStr);

        if (isCompleted) {
            if (lastDate !== null) {
                const daysDiff = (currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24);
                if (daysDiff === 1) {
                    tempStreak++;
                } else if (daysDiff > 1) {
                    tempStreak = 1;
                }
            } else {
                tempStreak = 1;
            }
            bestStreak = Math.max(bestStreak, tempStreak);
            if (dateStr <= today) currentStreak = tempStreak;
        } else {
            tempStreak = 0;
        }
        lastDate = currentDate;
    }
    
    if (uniqueDates.length > 0) {
        const latestDateStr = uniqueDates[uniqueDates.length - 1];
        const latestCompleted = logMap.get(latestDateStr);
        const diff = (new Date(today).getTime() - new Date(latestDateStr).getTime()) / (1000 * 3600 * 24);
        if (!latestCompleted || diff > 1.1) { 
             currentStreak = 0;
        }
    }
    
    return {
        completion_rate: totalLogs > 0 ? (completedLogs / totalLogs) * 100 : 0,
        current_streak: currentStreak,
        best_streak: bestStreak,
        total_days: totalLogs,
        completed_days: completedLogs
    };
};
// ----------------------------------------------------------------------


export const useHabitsStore = defineStore('habits', () => {
    
    const habits = ref([])
    const loading = ref(false)
    const stats = ref([]) 

    // 1. 获取习惯列表及当日记录 (刷新后重新拉取的核心函数)
    const fetchHabitsAndLogs = async () => {
        loading.value = true
        const today = getTodayDate()
        const authStore = useAuthStore()

        // 如果用户未登录，则不执行查询
        if (!authStore.user) {
            habits.value = [];
            loading.value = false;
            return;
        }

        // 解包 reactive Proxy，确保得到原始 user 对象
        const rawUser = toRaw(authStore.user) || authStore.user
        const userId = rawUser?.id
        console.log('[fetchHabitsAndLogs] rawUser id:', userId)

        if (!userId) {
            console.error('[fetchHabitsAndLogs] 未能获取到 userId，查询已中止。', rawUser)
            habits.value = []
            loading.value = false
            return
        }

        try {
            // 1) 先获取当前用户的 habits（简单字段）
            const { data: habitsData, error: habitsErr } = await supabase
                .from('habits')
                .select('id, name, frequency, created_at, user_id')
                .eq('user_id', userId)

            console.log('[fetchHabitsAndLogs] habits query ->', { data: habitsData, error: habitsErr })

            if (habitsErr) {
                console.error('获取 habits 失败:', habitsErr)
                habits.value = []
                loading.value = false
                return
            }

            if (!habitsData || habitsData.length === 0) {
                habits.value = []
                loading.value = false
                return
            }

            const habitIds = habitsData.map(h => h.id)

            // 2) 再按今日和 habit_id 列表获取 habit_logs（避免关联 select 出错）
            const { data: logsData, error: logsErr } = await supabase
                .from('habit_logs')
                .select('habit_id, is_completed, log_date')
                .in('habit_id', habitIds)
                .eq('log_date', today)

            if (logsErr) {
                // 只记录错误，但仍把 habits 返回（视为当天没有日志）
                console.warn('[fetchHabitsAndLogs] 获取 habit_logs 失败，继续返回 habits:', logsErr)
            } else {
                console.log('[fetchHabitsAndLogs] today logs ->', logsData)
            }

            // 合并：以 logsData 为准设置 is_completed_today
            const logsByHabit = (logsData || []).reduce((acc, l) => {
                acc[l.habit_id] = l
                return acc
            }, {})

            habits.value = habitsData.map(habit => {
                const todayLog = logsByHabit[habit.id]
                return {
                    ...habit,
                    is_completed_today: todayLog ? todayLog.is_completed : false
                }
            })
        } catch (err) {
            console.error('[fetchHabitsAndLogs] exception:', err)
            habits.value = []
        } finally {
            loading.value = false
        }
    }

    // [省略 addHabit, toggleHabitCompletion, deleteHabit 函数，请保持原样]
    const addHabit = async (name, frequency) => { 
        const authStore = useAuthStore()
        const userId = authStore.user?.id
        if (!userId) throw new Error("用户未登录，无法添加习惯。")
        const { data, error } = await supabase
            .from('habits')
            .insert([{ name: name, user_id: userId, frequency: frequency }])
            .select()
        if (error) throw error
        if (data && data.length > 0) {
            habits.value.unshift({ ...data[0], is_completed_today: false })
        }
    }
    
    const toggleHabitCompletion = async (habitId, isCompleted) => {
        const today = getTodayDate()
        const authStore = useAuthStore()
        // 使用 toRaw 解包以避免 Proxy 导致的 id 识别问题
        const rawUser = toRaw(authStore.user) || authStore.user
        const userId = rawUser?.id
        if (!userId) throw new Error('用户未登录，无法更新日志。')

        console.log('[toggleHabitCompletion] start', { habitId, isCompleted, userId, today })

        try {
            // 先查询当天是否已存在日志（避免 onConflict 问题）
            const { data: existing, error: selectErr } = await supabase
                .from('habit_logs')
                .select('id, is_completed')
                .eq('habit_id', habitId)
                .eq('log_date', today)
                .limit(1)

            if (selectErr) {
                console.warn('[toggleHabitCompletion] select error:', selectErr)
                throw selectErr
            }

            let dbError = null

            if (existing && existing.length > 0) {
                // 有记录 -> 更新
                const { error: updateErr } = await supabase
                    .from('habit_logs')
                    .update({ is_completed: isCompleted })
                    .eq('id', existing[0].id)
                dbError = updateErr
                if (!dbError) console.log('[toggleHabitCompletion] updated existing log id=', existing[0].id)
            } else {
                // 无记录 -> 插入
                const { error: insertErr } = await supabase
                    .from('habit_logs')
                    .insert([{ habit_id: habitId, log_date: today, is_completed: isCompleted }])
                dbError = insertErr
                if (!dbError) console.log('[toggleHabitCompletion] inserted new log for habit=', habitId)
            }

            if (dbError) {
                console.error('[toggleHabitCompletion] db error:', dbError)
                throw dbError
            }

            // 本地状态同步（使用不可变赋值以确保触发响应式更新）
            const index = habits.value.findIndex(h => h.id === habitId)
            if (index !== -1) {
                habits.value[index] = { ...habits.value[index], is_completed_today: isCompleted }
            }

            console.log('[toggleHabitCompletion] finished success', { habitId, isCompleted })

            // 关键：数据库更新成功后立即从服务端重新拉取当天的习惯与日志，确保前端与后端一致
            try {
                console.log('[toggleHabitCompletion] refreshing habits from server...')
                await fetchHabitsAndLogs()
                console.log('[toggleHabitCompletion] refresh completed')
            } catch (refreshErr) {
                console.warn('[toggleHabitCompletion] refresh error:', refreshErr)
            }

        } catch (err) {
            console.error('[toggleHabitCompletion] exception', err)
            // 向上抛出以便视图处理 alert
            throw err
        }
    }
    
    const deleteHabit = async (habitId) => {
        const { error } = await supabase.from('habits').delete().eq('id', habitId)
        if (error) throw error
        habits.value = habits.value.filter(h => h.id !== habitId)
    }
    // ------------------------------------------------------------------

    const fetchHabitStats = async () => {
        loading.value = true;
        const authStore = useAuthStore();
        if (!authStore.user) {
            loading.value = false;
            return;
        }

        // 解包 user 并获取 id
        const rawUser = toRaw(authStore.user) || authStore.user
        const userId = rawUser?.id
        console.log('[fetchHabitStats] rawUser id:', userId)

        if (!userId) {
            console.error('[fetchHabitStats] 未能获取到 userId，查询已中止。', rawUser)
            loading.value = false
            return
        }

        try {
            // 1) 先获取当前用户的 habits（不使用关联 select，避免偶发错误）
            const { data: habitsData, error: habitsErr } = await supabase
                .from('habits')
                .select('id, name, frequency, created_at')
                .eq('user_id', userId)

            if (habitsErr) {
                console.error('[fetchHabitStats] 获取 habits 失败:', habitsErr)
                stats.value = []
                loading.value = false
                return
            }

            if (!habitsData || habitsData.length === 0) {
                stats.value = []
                loading.value = false
                return
            }

            const habitIds = habitsData.map(h => h.id)

            // 2) 获取这些 habit 的所有日志（按 habit_id 列表），以便计算完整统计
            const { data: logsData, error: logsErr } = await supabase
                .from('habit_logs')
                .select('habit_id, is_completed, log_date')
                .in('habit_id', habitIds)

            if (logsErr) {
                console.warn('[fetchHabitStats] 获取 habit_logs 发生错误，仍将返回 habits，但统计可能为空或不完整:', logsErr)
            } else {
                console.log('[fetchHabitStats] habit_logs fetched count=', (logsData || []).length)
            }

            // 按 habit_id 分组日志
            const logsByHabit = (logsData || []).reduce((acc, l) => {
                if (!acc[l.habit_id]) acc[l.habit_id] = []
                acc[l.habit_id].push({ is_completed: l.is_completed, log_date: l.log_date })
                return acc
            }, {})

            // 合并并计算 stats
            stats.value = habitsData.map(habit => {
                const logs = Array.isArray(logsByHabit[habit.id]) ? logsByHabit[habit.id] : []
                const validLogs = logs.filter(log => log && log.log_date)
                return { ...habit, ...calculateStats(validLogs) }
            })
        } catch (err) {
            console.error('[fetchHabitStats] exception:', err)
            stats.value = []
        } finally {
            loading.value = false;
        }
    };


    return { 
        habits, 
        loading, 
        stats, 
        fetchHabitsAndLogs, 
        addHabit, 
        toggleHabitCompletion, 
        deleteHabit,
        fetchHabitStats 
    }
})