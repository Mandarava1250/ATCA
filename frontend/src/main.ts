import { createApp } from 'vue';
import { createPinia } from 'pinia';
import i18n from './i18n';
import router from '@/router';
import App from './App.vue';
import './styles/global.css';
import { useUserStore } from '@/stores';
import { scheduleCheckinSync } from '@/utils/checkinSync';

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
app.use(router);

const userStore = useUserStore();
userStore.loadFromStorage();

if (userStore.tokens?.accessToken) {
  userStore.me().catch(() => {
    userStore.logout();
  });
}

const cleanupCheckinSync = scheduleCheckinSync();

app.mount('#app');

// 开发环境下HMR热重载时清理定时器和事件监听器，避免内存泄漏
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupCheckinSync();
  });
}
