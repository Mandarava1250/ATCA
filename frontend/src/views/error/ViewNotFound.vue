<template>
  <div class="page">
    <Navbar />
    <div class="container not-found">
      <div class="error-code">404</div>
      <h1 class="atca-title atca-title-lg">{{ $t('notFound.title') }}</h1>
      <p class="atca-text-muted">{{ $t('notFound.desc') }}</p>
      <div class="actions">
        <router-link to="/home" class="atca-btn atca-btn-primary">{{ $t('notFound.backHome') }}</router-link>
        <router-link to="/architecture" class="atca-btn atca-btn-secondary">{{ $t('notFound.browseArch') }}</router-link>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
</script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }
.not-found {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 0;
}
.error-code {
  font-family: var(--font-serif);
  font-size: 8rem;
  font-weight: 700;
  color: var(--color-primary);
  opacity: 0.2;
  line-height: 1;
  margin-bottom: 16px;
}
.not-found h1 {
  margin-bottom: 12px;
}
.not-found p {
  margin-bottom: 32px;
}
.actions {
  display: flex;
  gap: 16px;
}
</style>
