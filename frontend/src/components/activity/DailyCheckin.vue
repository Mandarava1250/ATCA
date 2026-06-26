<template>
  <div class="daily-checkin">
    <transition name="toast">
      <div v-if="toast.show" class="toast" :class="toast.type">
        <svg v-if="toast.type === 'success'" viewBox="0 0 24 24" width="16" height="16">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
        </svg>
        <svg v-else-if="toast.type === 'error'" viewBox="0 0 24 24" width="16" height="16">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
        </svg>
        <span>{{ toast.message }}</span>
      </div>
    </transition>
    <div class="checkin-card" :class="{ checked: checkedToday }">
      <div class="checkin-icon" :class="{ checked: checkedToday }">
        <svg v-if="!checkedToday" viewBox="0 0 24 24" width="40" height="40"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" fill="none" stroke-width="2"/></svg>
        <svg v-else viewBox="0 0 24 24" width="40" height="40"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/></svg>
      </div>
      <div class="checkin-info">
        <h3>{{ checkedToday ? t('checkin.checked') : t('checkin.title') }}</h3>
        <p>{{ checkedToday ? t('checkin.checkedDesc') : t('checkin.desc') }}</p>
      </div>
      <div class="checkin-streak" v-if="stats.max_streak > 0">
        <span class="streak-icon">🔥</span>
        <span class="streak-text">{{ stats.max_streak }} {{ t('checkin.streak') }}</span>
      </div>
    </div>

    <div class="checkin-stats-grid">
      <div class="stat-item">
        <div class="stat-value">{{ stats.total_checkins }}</div>
        <div class="stat-label">{{ t('checkin.total') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.weekly_checkins }}</div>
        <div class="stat-label">{{ t('checkin.weekly') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.monthly_checkins }}</div>
        <div class="stat-label">{{ t('checkin.monthly') }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">{{ stats.total_points }}</div>
        <div class="stat-label">{{ t('checkin.points') }}</div>
      </div>
    </div>

    <button 
      class="checkin-btn" 
      :class="{ disabled: checkedToday || loading }"
      :disabled="checkedToday || loading"
      @click="handleCheckin"
    >
      <span v-if="loading" class="btn-spinner"></span>
      <span>{{ checkedToday ? t('checkin.checked') : t('checkin.btn') }}</span>
    </button>

    <div class="checkin-calendar" v-if="calendarData.length > 0">
      <div class="calendar-header">
        <button class="calendar-nav" @click="prevMonth">&lt;</button>
        <span>{{ currentYear }}年{{ currentMonth }}月</span>
        <button class="calendar-nav" @click="nextMonth">&gt;</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekdays">
          <span v-for="day in weekdays" :key="day">{{ day }}</span>
        </div>
        <div class="calendar-days">
          <div 
            v-for="(day, index) in calendarDays" 
            :key="index"
            class="calendar-day"
            :class="{ 
              other: !day.currentMonth,
              checked: day.checked,
              today: day.isToday,
              streak: day.streakCount >= 3
            }"
          >
            <span>{{ day.date }}</span>
            <span v-if="day.streakCount >= 3" class="streak-badge">{{ day.streakCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="checkin-rewards">
      <h4>{{ t('checkin.rewards') }}</h4>
      <div class="rewards-list">
        <div class="reward-item">
          <span class="reward-icon">⭐</span>
          <span class="reward-text">{{ t('checkin.reward1') }}</span>
          <span class="reward-points">10</span>
        </div>
        <div class="reward-item">
          <span class="reward-icon">🔥</span>
          <span class="reward-text">{{ t('checkin.reward3') }}</span>
          <span class="reward-points">20</span>
        </div>
        <div class="reward-item">
          <span class="reward-icon">💎</span>
          <span class="reward-text">{{ t('checkin.reward5') }}</span>
          <span class="reward-points">30</span>
        </div>
        <div class="reward-item">
          <span class="reward-icon">👑</span>
          <span class="reward-text">{{ t('checkin.reward7') }}</span>
          <span class="reward-points">50</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { activityApi } from '@/services/api';
import { useToast } from '@/composables/useToast';

const { t } = useI18n();
const { toast, success, error } = useToast();

const checkedToday = ref(false);
const loading = ref(false);
const stats = ref({
  total_checkins: 0,
  max_streak: 0,
  total_points: 0,
  last_checkin_date: null as string | null,
  weekly_checkins: 0,
  monthly_checkins: 0,
});

const currentYear = ref(new Date().getFullYear());
const currentMonth = ref(new Date().getMonth() + 1);
const calendarData = ref<any[]>([]);

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

const calendarDays = computed(() => {
  const days: any[] = [];
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value, 0);
  const today = new Date();
  
  const startPadding = firstDay.getDay();
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value - 1, 0).getDate();
  
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push({
      date: prevMonthLastDay - i,
      currentMonth: false,
      checked: false,
      isToday: false,
      streakCount: 0,
    });
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const calendarItem = calendarData.value.find(c => c.checkin_date === dateStr);
    
    days.push({
      date: i,
      currentMonth: true,
      checked: !!calendarItem,
      isToday: today.getFullYear() === currentYear.value && 
              today.getMonth() + 1 === currentMonth.value && 
              today.getDate() === i,
      streakCount: calendarItem?.streak_count || 0,
    });
  }
  
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      date: i,
      currentMonth: false,
      checked: false,
      isToday: false,
      streakCount: 0,
    });
  }
  
  return days;
});

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
  loadCalendar();
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
  loadCalendar();
}

async function loadTodayStatus() {
  try {
    const res = await activityApi.checkTodayCheckin();
    if (res.success) {
      checkedToday.value = res.data.checked_today;
    }
  } catch (e) {
    console.warn('[Checkin] 获取今日状态失败:', e);
  }
}

async function loadStats() {
  try {
    const res = await activityApi.getCheckinStats();
    if (res.success) {
      stats.value = res.data;
    }
  } catch (e) {
    console.warn('[Checkin] 获取统计失败:', e);
  }
}

async function loadCalendar() {
  try {
    const res = await activityApi.getCheckinCalendar({ year: currentYear.value, month: currentMonth.value });
    if (res.success) {
      calendarData.value = res.data;
    }
  } catch (e) {
    console.warn('[Checkin] 获取日历失败:', e);
  }
}

async function handleCheckin() {
  if (checkedToday.value || loading.value) return;
  
  loading.value = true;
  
  try {
    const deviceInfo = getDeviceInfo();
    const res = await activityApi.checkin({
      device_type: deviceInfo.type,
      device_info: deviceInfo.info,
    });
    
    if (res.success) {
      checkedToday.value = true;
      await loadStats();
      await loadCalendar();
      
      if (res.points_earned) {
        success(`${t('checkin.success')} +${res.points_earned} ${t('checkin.points')}`);
      }
    } else if (res.already_checked) {
      checkedToday.value = true;
      error(res.message);
    } else {
      error(res.message);
    }
  } catch (e: any) {
    console.error('[Checkin] 打卡失败:', e);
    error(t('checkin.error'));
  } finally {
    loading.value = false;
  }
}

function getDeviceInfo() {
  const userAgent = navigator.userAgent.toLowerCase();
  let type = 'desktop';
  
  if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
    type = 'mobile';
  } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
    type = 'tablet';
  }
  
  return {
    type,
    info: `${navigator.platform} - ${navigator.userAgent.substring(0, 100)}`,
  };
}

onMounted(async () => {
  await loadTodayStatus();
  await loadStats();
  await loadCalendar();
});
</script>

<style scoped>
.daily-checkin {
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.06) 0%, rgba(255,255,255,0.02) 100%);
  border: 1px solid rgba(201, 169, 110, 0.1);
  border-radius: 16px;
  padding: 24px;
  color: #E8E2D9;
}

.checkin-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(201, 169, 110, 0.08);
  border-radius: 12px;
  border: 1px solid rgba(201, 169, 110, 0.15);
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.checkin-card.checked {
  background: rgba(91, 123, 76, 0.1);
  border-color: rgba(91, 123, 76, 0.3);
}

.checkin-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(201, 169, 110, 0.15);
  color: #C9A96E;
  transition: all 0.3s ease;
}

.checkin-icon.checked {
  background: rgba(91, 123, 76, 0.2);
  color: #7CB342;
}

.checkin-info {
  flex: 1;
}

.checkin-info h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 4px;
  color: #C9A96E;
}

.checkin-info.checked h3 {
  color: #7CB342;
}

.checkin-info p {
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.5);
  margin: 0;
}

.checkin-streak {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 165, 0, 0.1);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #FFA500;
}

.checkin-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.05);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #C9A96E;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  margin-top: 4px;
}

.checkin-btn {
  width: 100%;
  padding: 14px 24px;
  font-size: 1rem;
  font-weight: 700;
  color: #1A1714;
  background: linear-gradient(135deg, #C9A96E, #D4A843);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.checkin-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(201, 169, 110, 0.3);
}

.checkin-btn.disabled {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.4);
  cursor: not-allowed;
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.checkin-calendar {
  margin-top: 24px;
  padding: 20px;
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.05);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 0.9375rem;
  font-weight: 600;
}

.calendar-nav {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.05);
  border: none;
  border-radius: 8px;
  color: #C9A96E;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.calendar-nav:hover {
  background: rgba(201, 169, 110, 0.2);
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.calendar-weekdays span {
  text-align: center;
  font-size: 0.75rem;
  color: rgba(255,255,255,0.4);
  padding: 8px;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.calendar-day.other {
  color: rgba(255,255,255,0.2);
}

.calendar-day:not(.other):hover {
  background: rgba(201, 169, 110, 0.15);
}

.calendar-day.checked {
  background: rgba(91, 123, 76, 0.3);
  color: #7CB342;
}

.calendar-day.today {
  border: 2px solid #C9A96E;
}

.calendar-day.streak {
  background: rgba(255, 165, 0, 0.2);
  color: #FFA500;
}

.streak-badge {
  font-size: 0.5rem;
  font-weight: 700;
  position: absolute;
  bottom: 2px;
}

.checkin-rewards {
  margin-top: 24px;
}

.checkin-rewards h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #C9A96E;
  margin: 0 0 12px;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255,255,255,0.03);
  border-radius: 8px;
}

.reward-icon {
  font-size: 1.125rem;
}

.reward-text {
  flex: 1;
  font-size: 0.8125rem;
  color: rgba(255,255,255,0.7);
}

.reward-points {
  font-size: 0.875rem;
  font-weight: 700;
  color: #C9A96E;
}

@media (max-width: 768px) {
  .checkin-card {
    flex-direction: column;
    text-align: center;
  }
  
  .checkin-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .checkin-btn {
    padding: 12px 20px;
    font-size: 0.9375rem;
  }
}

@media (max-width: 480px) {
  .daily-checkin {
    padding: 16px;
  }
  
  .checkin-icon {
    width: 50px;
    height: 50px;
  }
  
  .checkin-icon svg {
    width: 32px;
    height: 32px;
  }
  
  .checkin-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
  
  .calendar-day {
    font-size: 0.75rem;
  }
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.toast.success {
  background: rgba(91, 123, 76, 0.95);
  color: #fff;
}

.toast.error {
  background: rgba(194, 65, 12, 0.95);
  color: #fff;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
