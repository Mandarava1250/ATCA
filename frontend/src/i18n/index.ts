import { createI18n } from 'vue-i18n';
import zh from './zh';
import en from './en';

// 从 localStorage 读取语言设置，默认中文
const savedLocale = localStorage.getItem('atca_locale') || 'zh';

const messages = {
  zh,
  en,
};

const i18n = createI18n({
  legacy: false, // Composition API mode
  locale: savedLocale,
  fallbackLocale: 'zh',
  messages,
  globalInjection: true,
});

export default i18n;
