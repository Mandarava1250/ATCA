<template>
  <div class="activity-page">
    <Navbar />
    <div class="container page-content">
      <div v-if="loading" class="activity-loading">
        <div class="atca-spinner"></div>
        <p>加载中...</p>
      </div>
      <div v-else-if="error" class="activity-error">
        <p>{{ error }}</p>
        <router-link to="/home" class="atca-btn atca-btn-primary">返回首页</router-link>
      </div>
      <div v-else-if="activity" class="activity-detail">
        <!-- Banner -->
        <div class="activity-banner" :style="bannerStyle">
          <div class="activity-banner-overlay"></div>
          <div class="activity-banner-content">
            <span class="activity-type-badge" :class="activity.activity_type">{{ activityTypeLabel }}</span>
            <h1 class="activity-title">{{ activity.title }}</h1>
            <p class="activity-date">
              <span v-if="activity.start_date">{{ formatDate(activity.start_date) }}</span>
              <span v-if="activity.end_date"> ~ {{ formatDate(activity.end_date) }}</span>
            </p>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="activity-info-grid">
          <div class="info-card">
            <span class="info-icon">&#127942;</span>
            <div class="info-body">
              <span class="info-label">奖励积分</span>
              <span class="info-value">{{ activity.reward_points || 0 }}</span>
            </div>
          </div>
          <div class="info-card">
            <span class="info-icon">&#128101;</span>
            <div class="info-body">
              <span class="info-label">参与人数</span>
              <span class="info-value">{{ activity.current_participants || 0 }} / {{ activity.max_participants || '不限' }}</span>
            </div>
          </div>
          <div class="info-card">
            <span class="info-icon">&#9201;</span>
            <div class="info-body">
              <span class="info-label">活动状态</span>
              <span class="info-value" :class="statusClass">{{ statusText }}</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="activity-desc-card">
          <h3>活动详情</h3>
          <TextClamp :text="activity.description" :max-lines="5" expand-text="展开详情" collapse-text="收起详情" />
        </div>

        <!-- Actions -->
        <div class="activity-actions">
          <button
            v-if="canJoin"
            class="atca-btn atca-btn-primary"
            @click="joinActivity"
            :disabled="joining"
          >
            {{ joining ? '加入中...' : '参与活动' }}
          </button>
          <button
            v-else-if="isFull"
            class="atca-btn atca-btn-secondary"
            disabled
          >
            人数已满
          </button>
          <span v-else-if="isEnded" class="activity-ended">活动已结束</span>
          <router-link to="/home" class="atca-btn atca-btn-secondary">返回首页</router-link>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import TextClamp from '@/components/common/TextClamp.vue';
import { activityApi } from '@/services/api';
import { useUserStore } from '@/stores';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const activity = ref<any>(null);
const loading = ref(true);
const error = ref('');
const joining = ref(false);

const activityTypeLabel = computed(() => {
  const map: Record<string, string> = { quiz: '知识竞赛', community: '社区活动', workshop: '工坊活动' };
  return map[activity.value?.activity_type] || '活动';
});

const statusClass = computed(() => {
  if (isEnded.value) return 'status-ended';
  if (isFull.value) return 'status-full';
  return 'status-active';
});

const statusText = computed(() => {
  if (isEnded.value) return '已结束';
  if (isFull.value) return '已满员';
  return '进行中';
});

const isEnded = computed(() => {
  if (!activity.value?.end_date) return false;
  return new Date(activity.value.end_date) < new Date();
});

const isFull = computed(() => {
  if (!activity.value?.max_participants) return false;
  return (activity.value.current_participants || 0) >= activity.value.max_participants;
});

const canJoin = computed(() => {
  return userStore.isLoggedIn && !isEnded.value && !isFull.value;
});

const bannerStyle = computed(() => {
  const url = activity.value?.banner_url;
  return url ? { backgroundImage: `url(${url})` } : {};
});

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

async function joinActivity() {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: route.fullPath } });
    return;
  }
  joining.value = true;
  try {
    const id = route.params.id as string;
    const res = await activityApi.joinActivity(Number(id));
    if (res.success) {
      activity.value.current_participants = (activity.value.current_participants || 0) + 1;
      alert('参与成功！');
    }
  } catch (e: any) {
    alert(e?.response?.data?.error?.message || '参与失败');
  } finally {
    joining.value = false;
  }
}

onMounted(async () => {
  const id = route.params.id as string;
  try {
    const res = await activityApi.getActivityDetail(id);
    if (res.data?.data) {
      activity.value = res.data.data;
    } else if (res.data) {
      activity.value = res.data;
    } else {
      error.value = '活动不存在';
    }
  } catch (e: any) {
    error.value = e?.response?.data?.error?.message || '加载失败';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.activity-page { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }
.page-content { flex: 1; padding-top: 100px; padding-bottom: 48px; }

.activity-loading, .activity-error { text-align: center; padding: 80px 24px; color: var(--text-muted); }

.activity-banner {
  position: relative;
  height: 280px;
  border-radius: var(--r-lg);
  background: linear-gradient(135deg, var(--bg-card), var(--bg-light));
  background-size: cover;
  background-position: center;
  overflow: hidden;
  margin-bottom: 24px;
  display: flex;
  align-items: flex-end;
}
.activity-banner-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 30%, rgba(26,23,20,0.9) 100%);
}
.activity-banner-content {
  position: relative; z-index: 1;
  padding: 24px;
}
.activity-type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: var(--r-sm);
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 12px;
}
.activity-type-badge.quiz { background: rgba(201,169,110,0.15); color: var(--gold); }
.activity-type-badge.community { background: rgba(123,194,181,0.15); color: var(--color-cyan); }
.activity-type-badge.workshop { background: rgba(123,158,194,0.15); color: var(--color-blue); }
.activity-title {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}
.activity-date { font-size: 0.875rem; color: var(--text-muted); }

.activity-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
}
.info-icon { font-size: 1.5rem; }
.info-body { display: flex; flex-direction: column; }
.info-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
.info-value { font-size: 1.125rem; font-weight: 600; color: var(--text); }
.status-active { color: #7CB342; }
.status-full { color: #C75C3A; }
.status-ended { color: var(--text-muted); }

.activity-desc-card {
  padding: 24px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  margin-bottom: 24px;
}
.activity-desc-card h3 {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--gold);
  margin-bottom: 12px;
}
.activity-desc-card p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.8; }

.activity-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.activity-ended {
  font-size: 0.875rem;
  color: var(--text-muted);
  padding: 10px 20px;
}

</style>
