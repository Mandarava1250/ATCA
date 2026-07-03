import { ref, computed, onMounted, onUnmounted } from 'vue';

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

export function useBreakpoints() {
  const windowWidth = ref(window.innerWidth);

  function updateWidth() {
    windowWidth.value = window.innerWidth;
  }

  onMounted(() => {
    window.addEventListener('resize', updateWidth, { passive: true });
    window.addEventListener('orientationchange', updateWidth, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateWidth);
    window.removeEventListener('orientationchange', updateWidth);
  });

  const isMobile = computed(() => windowWidth.value <= BREAKPOINTS.mobile);
  const isTablet = computed(() => windowWidth.value > BREAKPOINTS.mobile && windowWidth.value <= BREAKPOINTS.tablet);
  const isDesktop = computed(() => windowWidth.value > BREAKPOINTS.tablet);

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: computed(() => {
      if (windowWidth.value <= BREAKPOINTS.mobile) return 'mobile';
      if (windowWidth.value <= BREAKPOINTS.tablet) return 'tablet';
      return 'desktop';
    }),
  };
}
