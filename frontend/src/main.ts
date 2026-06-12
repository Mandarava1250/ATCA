import { createApp } from 'vue';
import { createPinia } from 'pinia';
import i18n from './i18n';
import router from '@/router';
import App from './App.vue';
import './styles/global.css';
import { useUserStore } from '@/stores';

const app = createApp(App);
app.use(createPinia());
app.use(i18n);
app.use(router);

// 从localStorage恢复登录状态
const userStore = useUserStore();
userStore.loadFromStorage();

// 如果token存在，获取当前用户信息
if (userStore.tokens?.accessToken) {
  userStore.me().catch(() => {
    // 获取失败则清除token
    userStore.logout();
  });
}

app.mount('#app');
