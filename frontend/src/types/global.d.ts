import type { ComposerTranslation } from 'vue-i18n';

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: ComposerTranslation;
  }
}

declare global {
  var $t: ComposerTranslation;
}

export {};
