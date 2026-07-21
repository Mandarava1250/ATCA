<template>
  <div class="page">
    <PageBackground :ember-count="20" :show-floating-text="false" />
    <Navbar />
    <div v-if="loading" class="container page-content">
      <div class="atca-skeleton detail-skeleton"></div>
    </div>
    <div v-else-if="architecture" class="container page-content">
      <!-- Detail Header -->
      <div class="detail-header">
        <div class="detail-image">
          <img :src="architecture.main_image_url || '/images/default-arch.jpg'" :alt="architecture.name" />
        </div>
        <div class="detail-info">
          <div class="detail-badges">
            <span class="tag tag-pri">{{ architecture.type }}</span>
            <span class="tag">{{ architecture.founding_dynasty }}</span>
            <span class="tag" v-if="architecture.location">{{ architecture.location }}</span>
            <span class="tag tag-gold" v-if="architecture.world_heritage_status">{{ architecture.world_heritage_status }}</span>
          </div>
          <h1 class=" -xl">{{ architecture.chinese_name || architecture.name }}</h1>
          <p v-if="architecture.chinese_name" class="detail-chinese">{{ architecture.chinese_name }}</p>
          <TextClamp :text="architecture.full_description || architecture.brief_description" :max-lines="5" expand-text="展开详情" collapse-text="收起详情" class="detail-desc" />
          
          <!-- Extra metadata -->
          <div class="detail-meta-grid" v-if="hasExtraMetadata">
            <div class="meta-item" v-if="architecture.construction_start_year">
              <span class="meta-label">{{ $t('architecture.detail.startYear') }}</span>
              <span class="meta-value">{{ architecture.construction_start_year }}</span>
            </div>
            <div class="meta-item" v-if="architecture.construction_end_year">
              <span class="meta-label">{{ $t('architecture.detail.endYear') }}</span>
              <span class="meta-value">{{ architecture.construction_end_year }}</span>
            </div>
            <div class="meta-item" v-if="architecture.architect">
              <span class="meta-label">{{ $t('architecture.detail.expert') }}</span>
              <span class="meta-value">{{ architecture.architect }}</span>
            </div>
            <div class="meta-item" v-if="architecture.style">
              <span class="meta-label">{{ $t('architecture.detail.styleMappings') }}</span>
              <span class="meta-value">{{ architecture.style }}</span>
            </div>
          </div>

          <div class="detail-actions">
            <button
              v-if="userStore.isLoggedIn"
              class="btn-favorite"
              :class="{ favorited: architecture.isFavorited, animating: favAnimating }"
              @click="toggleFavorite"
            >
              <span class="fav-icon-wrap">
                <svg v-if="architecture.isFavorited" class="fav-heart filled" viewBox="0 0 24 24" width="18" height="18">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" fill="currentColor"/>
                </svg>
                <svg v-else class="fav-heart" viewBox="0 0 24 24" width="18" height="18">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                </svg>
                <span v-if="architecture.isFavorited" class="fav-sparkle s1">✦</span>
                <span v-if="architecture.isFavorited" class="fav-sparkle s2">✦</span>
              </span>
              <span class="fav-text">{{ architecture.isFavorited ? '已收藏' : '收藏' }}</span>
              <span v-if="architecture.isFavorited" class="fav-glow"></span>
            </button>
            <button v-else class="btn-favorite" @click="router.push({ path: '/login', query: { redirect: route.fullPath } })">
              <span class="fav-icon-wrap">
                <svg class="fav-heart" viewBox="0 0 24 24" width="18" height="18">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>
                </svg>
              </span>
              <span class="fav-text">登录后收藏</span>
            </button>
            <button class="btn btn-note" @click="openNoteEditor">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              写笔记
            </button>
            <router-link to="/architecture" class="btn btn-sec">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              {{ $t('architecture.detail.back') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="detail-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-btn"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="detail-body">
        <!-- 历史发展 -->
        <div v-if="activeTab === 'history'" class="tab-content">
          <div v-if="!architecture.historicalDevelopments?.length" class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <p>{{ $t('architecture.detail.noData') }}</p>
          </div>
          <div v-else class="timeline">
            <div v-for="(item, idx) in architecture.historicalDevelopments" :key="item.development_id" class="timeline-item" :style="{ animationDelay: `${(idx as number) * 100}ms` }">
              <div class="timeline-marker">
                <span class="timeline-num">{{ (idx as number) + 1 }}</span>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <h3>{{ item.development_title }}</h3>
                  <span class="timeline-period" v-if="item.dynasty_period">{{ item.dynasty_period }}</span>
                </div>
                <p class="timeline-desc">{{ item.development_content }}</p>
                <div v-if="item.architectural_changes" class="timeline-detail-box">
                  <strong>{{ $t('architecture.detail.changes') }}：</strong>{{ item.architectural_changes }}
                </div>
                <div v-if="item.historical_context" class="timeline-detail-box timeline-context">
                  <strong>{{ $t('architecture.detail.historicalContext') }}：</strong>{{ item.historical_context }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 技术结构 -->
        <div v-if="activeTab === 'structure'" class="tab-content">
          <div v-if="!architecture.technicalStructures?.length" class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <p>{{ $t('architecture.detail.noData') }}</p>
          </div>
          <div class="structure-grid">
            <div v-for="(item, idx) in architecture.technicalStructures" :key="idx" class="structure-card" :style="{ animationDelay: `${(idx as number) * 100}ms` }">
              <div class="structure-header">
                <h3>{{ item.technique_name || '未命名技术' }}</h3>
                <span class="tag tag-pri" v-if="item.category">{{ item.category }}</span>
              </div>
              <p class="structure-desc">{{ item.description || '暂无描述' }}</p>
            </div>
          </div>
        </div>

        <!-- 建筑特色 -->
        <div v-if="activeTab === 'features'" class="tab-content">
          <div v-if="!architecture.architecturalFeatures?.length" class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <p>{{ $t('architecture.detail.noData') }}</p>
          </div>
          <div v-else class="features-list">
            <div v-for="(item, idx) in architecture.architecturalFeatures" :key="item.feature_id" class="feature-detail-card" :style="{ animationDelay: `${(idx as number) * 100}ms` }">
              <h3 class="feature-title">{{ item.feature_name }}</h3>
              
              <div v-if="item.design_philosophy" class="feature-section">
                <div class="feature-section-label">{{ $t('architecture.detail.designPhilosophy') }}</div>
                <p>{{ item.design_philosophy }}</p>
              </div>
              
              <div v-if="item.spatial_organization" class="feature-section">
                <div class="feature-section-label">{{ $t('architecture.detail.spatialOrg') }}</div>
                <p>{{ item.spatial_organization }}</p>
              </div>
              
              <div v-if="item.aesthetic_characteristics" class="feature-section">
                <div class="feature-section-label">{{ $t('architecture.detail.aesthetic') }}</div>
                <p>{{ item.aesthetic_characteristics }}</p>
              </div>

              <div v-if="item.functional_aspects" class="feature-section">
                <div class="feature-section-label">{{ $t('architecture.detail.functional') }}</div>
                <p>{{ item.functional_aspects }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 文化意义 -->
        <div v-if="activeTab === 'culture'" class="tab-content">
          <div v-if="!architecture.culturalSignificances?.length" class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <p>{{ $t('architecture.detail.noData') }}</p>
          </div>
          <div v-else class="culture-list">
            <div v-for="(item, idx) in architecture.culturalSignificances" :key="item.significance_id" class="culture-card" :style="{ animationDelay: `${(idx as number) * 100}ms` }">
              <h3>{{ item.significance_aspect }}</h3>
              
              <div v-if="item.philosophical_basis" class="culture-section culture-philosophy">
                <div class="culture-section-label">{{ $t('architecture.detail.philosophical') }}</div>
                <p>{{ item.philosophical_basis }}</p>
              </div>
              
              <div v-if="item.cultural_interpretation" class="culture-section">
                <div class="culture-section-label">{{ $t('architecture.detail.interpretation') }}</div>
                <p>{{ item.cultural_interpretation }}</p>
              </div>

              <div v-if="item.social_influence" class="culture-section">
                <div class="culture-section-label">{{ $t('architecture.detail.socialInfluence') }}</div>
                <p>{{ item.social_influence }}</p>
              </div>

              <div v-if="item.contemporary_value" class="culture-section culture-value">
                <div class="culture-section-label">{{ $t('architecture.detail.contemporaryValue') }}</div>
                <p>{{ item.contemporary_value }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 匠人观点 -->
        <div v-if="activeTab === 'quotes'" class="tab-content">
          <div v-if="!architecture.expertQuotes?.length" class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            <p>{{ $t('architecture.detail.noData') }}</p>
          </div>
          <div v-else class="quotes-list">
            <blockquote v-for="(item, idx) in architecture.expertQuotes" :key="item.quote_id" class="quote-block" :style="{ animationDelay: `${(idx as number) * 100}ms` }">
              <div class="quote-icon">
                <svg viewBox="0 0 24 24" width="24" height="24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" fill="currentColor" opacity="0.2"/></svg>
              </div>
              <p class="quote-content">"{{ item.quote_content }}"</p>
              <footer class="quote-footer">
                <div class="quote-author">
                  <span class="quote-name">{{ item.expert_name }}</span>
                  <span class="quote-title" v-if="item.expert_title">{{ item.expert_title }}</span>
                </div>
                <span class="quote-source" v-if="item.source">{{ $t('architecture.detail.source') }}: {{ item.source }}</span>
              </footer>
            </blockquote>
          </div>
        </div>

        <!-- 笔记 -->
        <div v-if="activeTab === 'notes'" class="tab-content">
          <div class="notes-list">
            <div v-for="note in notes" :key="note.id" class="note-card">
              <div class="note-card-header">
                <h3 class="note-title">{{ note.title }}</h3>
                <div class="note-actions">
                  <span v-if="note.isPublic" class="note-badge public">公开</span>
                  <span v-else class="note-badge private">私密</span>
                  <button class="btn-text" @click="openEditNote(note)">编辑</button>
                  <button class="btn-text danger" @click="deleteNote(note.id)">删除</button>
                </div>
              </div>
              <p class="note-content">{{ note.content }}</p>
              <div v-if="note.tags.length" class="note-tags">
                <span v-for="tag in note.tags" :key="tag" class="note-tag">{{ tag }}</span>
              </div>
              <span class="note-date">{{ new Date(note.updatedAt).toLocaleDateString('zh-CN') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 社交功能：分享 + 评论 -->
    <div class="page-content" v-if="architecture">
      <div class="container" style="display:flex;justify-content:flex-end;gap:12px;margin-bottom:16px;">
        <ShareButton targetType="architecture" :targetId="architecture.architecture_id" :targetTitle="architecture.name" />
      </div>
      <div class="container">
        <CommentSection targetType="architecture" :targetId="architecture.architecture_id" />
      </div>
    </div>

    <!-- 笔记编辑器弹窗 -->
    <NoteEditor
      v-if="showNoteEditor"
      :note="editingNote"
      :building-id="architecture?.architecture_id"
      :building-name="architecture?.name"
      @close="showNoteEditor = false"
      @saved="onNoteSaved"
    />

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import PageBackground from '@/components/common/PageBackground.vue';
import CommentSection from '@/components/social/CommentSection.vue';
import ShareButton from '@/components/social/ShareButton.vue';
import NoteEditor from '@/components/notes/NoteEditor.vue';
import TextClamp from '@/components/common/TextClamp.vue';
import { architectureApi } from '@/services/api';
import { useUserStore } from '@/stores';
import { noteManager, type Note } from '@/utils/noteManager';
import { useMemoryTrack } from '@/composables/useMemoryTrack';

const memTrack = useMemoryTrack('ViewArchitectureDetail');
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { t } = useI18n();

const architecture = ref<any>(null);
const loading = ref(true);
const activeTab = ref('history');
const favAnimating = ref(false);
const notes = ref<Note[]>([]);
const showNoteEditor = ref(false);
const editingNote = ref<Note | null>(null);

const tabs = computed(() => {
  const base = [
    { key: 'history', label: t('architecture.detail.tabs.history') },
    { key: 'structure', label: t('architecture.detail.tabs.structure') },
    { key: 'features', label: t('architecture.detail.tabs.features') },
    { key: 'culture', label: t('architecture.detail.tabs.culture') },
    { key: 'quotes', label: t('architecture.detail.tabs.quotes') },
  ];
  if (notes.value.length > 0) {
    base.push({ key: 'notes', label: `笔记 (${notes.value.length})` });
  }
  return base;
});

const hasExtraMetadata = computed(() => {
  const a = architecture.value;
  if (!a) return false;
  return a.construction_start_year || a.construction_end_year || a.architect || a.style;
});

async function loadDetail() {
  loading.value = true;
  try {
    const res = await architectureApi.detail(Number(route.params.id));
    if (res.success) {
      architecture.value = res.data;
      // 加载该建筑的笔记
      notes.value = noteManager.getByBuildingId(res.data.architecture_id);
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openNoteEditor() {
  editingNote.value = null;
  showNoteEditor.value = true;
}
function openEditNote(note: Note) {
  editingNote.value = note;
  showNoteEditor.value = true;
}
function onNoteSaved() {
  showNoteEditor.value = false;
  if (architecture.value) {
    notes.value = noteManager.getByBuildingId(architecture.value.architecture_id);
  }
}
function deleteNote(id: string) {
  if (!confirm('确定删除这条笔记？')) return;
  noteManager.delete(id);
  if (architecture.value) {
    notes.value = noteManager.getByBuildingId(architecture.value.architecture_id);
  }
}

async function toggleFavorite() {
  if (!architecture.value || favAnimating.value) return;
  favAnimating.value = true;
  const id = architecture.value.architecture_id;
  try {
    if (architecture.value.isFavorited) {
      await architectureApi.unfavorite(id);
      architecture.value.isFavorited = false;
    } else {
      await architectureApi.favorite(id);
      architecture.value.isFavorited = true;
    }
    setTimeout(() => { favAnimating.value = false; }, 600);
  } catch (e) {
    console.error(e);
    favAnimating.value = false;
  }
}

onMounted(loadDetail);
</script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }
.page-content { flex: 1; padding-top: 100px; padding-bottom: 48px; }
.detail-skeleton { height: 400px; border-radius: var(--r-lg); }

/* Detail Header */
.detail-header {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}
.detail-image {
  border-radius: var(--r-lg);
  overflow: hidden;
  aspect-ratio: 4/3;
}
.detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.detail-chinese {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 1.25rem;
  color: var(--c-red);
}
.detail-desc {
  color: var(--text-muted);
  line-height: 1.8;
}

/* Metadata Grid */
.detail-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  background: var(--bg-light);
  border-radius: var(--r-md);
  border: 1px solid var(--border);
}
.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.meta-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
}
.meta-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--text);
  font-family: 'Noto Serif SC','STSong',serif;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

/* ===== 优化收藏按钮 ===== */
.btn-favorite {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(201, 169, 110, 0.04) 100%);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  letter-spacing: 0.04em;
}
.btn-favorite:hover {
  border-color: rgba(201, 169, 110, 0.4);
  color: var(--gold);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
}
.btn-favorite.favorited {
  border-color: rgba(201, 169, 110, 0.5);
  background: linear-gradient(135deg, rgba(201, 169, 110, 0.12) 0%, rgba(201, 169, 110, 0.04) 100%);
  color: var(--gold);
}
.btn-favorite.favorited:hover {
  border-color: var(--gold);
  box-shadow: 0 6px 24px rgba(201, 169, 110, 0.2);
}

/* 心形动画 */
.fav-icon-wrap {
  position: relative;
  display: inline-flex;
  width: 18px;
  height: 18px;
}
.fav-heart {
  transition: all 0.3s ease;
  color: currentColor;
}
.fav-heart.filled {
  color: #C9A96E;
  filter: drop-shadow(0 0 6px rgba(201, 169, 110, 0.5));
}
.btn-favorite.animating .fav-heart.filled {
  animation: heartBeat 0.5s ease;
}
@keyframes heartBeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.3); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

/* 星星闪光 */
.fav-sparkle {
  position: absolute;
  font-size: 8px;
  color: var(--gold);
  opacity: 0;
  pointer-events: none;
}
.fav-sparkle.s1 { top: -4px; right: -6px; }
.fav-sparkle.s2 { bottom: -4px; left: -4px; font-size: 6px; }
.btn-favorite.animating .fav-sparkle {
  animation: sparkle 0.6s ease forwards;
}
.btn-favorite.animating .fav-sparkle.s2 {
  animation-delay: 0.1s;
}
@keyframes sparkle {
  0% { opacity: 0; transform: scale(0) rotate(0deg); }
  40% { opacity: 1; transform: scale(1.2) rotate(45deg); }
  100% { opacity: 0; transform: scale(0.5) rotate(90deg); }
}

/* 收藏光晕 */
.fav-glow {
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: radial-gradient(circle at center, rgba(201, 169, 110, 0.15) 0%, transparent 70%);
  opacity: 0;
  pointer-events: none;
}
.btn-favorite.animating .fav-glow {
  animation: glowPulse 0.6s ease forwards;
}
@keyframes glowPulse {
  0% { opacity: 0; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0; transform: scale(1.1); }
}

/* Tabs */
.detail-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 32px;
  overflow-x: auto;
}
.tab-btn {
  padding: 12px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all var(--t);
}
.tab-btn:hover { color: var(--c-red); }
.tab-btn.active {
  color: var(--c-red);
  border-bottom-color: var(--c-red);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: var(--text-muted);
}
.empty-state svg { margin-bottom: 16px; }
.empty-state p { font-size: 0.9375rem; }

/* ===== Timeline ===== */
.timeline { position: relative; }
.timeline-item {
  display: flex;
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid var(--border);
  animation: slideUp 0.5s ease backwards;
}
.timeline-item:last-child { border-bottom: none; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.timeline-marker {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--c-red);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.timeline-num {
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
}

.timeline-content { flex: 1; }
.timeline-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.timeline-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}
.timeline-period {
  padding: 2px 10px;
  background: rgba(var(--gold-rgb), 0.08);
  color: var(--c-red);
  border-radius: var(--r-sm);
  font-size: 0.75rem;
  font-family: 'Noto Serif SC','STSong',serif;
  letter-spacing: 0.05em;
}
.timeline-desc {
  color: var(--text-muted);
  line-height: 1.8;
  margin-bottom: 12px;
}
.timeline-detail-box {
  padding: 12px 16px;
  background: var(--bg-light);
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 8px;
}
.timeline-detail-box strong {
  color: var(--c-red);
  font-weight: 600;
}
.timeline-context {
  background: rgba(var(--gold-rgb), 0.04);
  border-left: 3px solid var(--c-red);
}

/* ===== Structure Grid ===== */
.structure-grid {
  display: grid;
  gap: 16px;
}
.structure-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 28px;
  animation: slideUp 0.5s ease backwards;
}
.structure-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.structure-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
}
.structure-desc {
  color: var(--text-muted);
  line-height: 1.8;
  margin-bottom: 16px;
}
.structure-principles {
  padding: 16px;
  background: var(--bg-light);
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
}
.principles-label {
  font-size: 0.75rem;
  color: var(--c-red);
  font-weight: 600;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.structure-principles p {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.7;
}

/* ===== Features List ===== */
.features-list {
  display: grid;
  gap: 16px;
}
.feature-detail-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 28px;
  animation: slideUp 0.5s ease backwards;
}
.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.feature-section {
  margin-bottom: 16px;
}
.feature-section:last-child { margin-bottom: 0; }
.feature-section p {
  color: var(--text-muted);
  line-height: 1.8;
}
.feature-section-label {
  font-size: 0.75rem;
  color: var(--c-red);
  font-weight: 600;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  text-transform: uppercase;
}

/* ===== Culture List ===== */
.culture-list {
  display: grid;
  gap: 16px;
}
.culture-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 28px;
  animation: slideUp 0.5s ease backwards;
}
.culture-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.culture-section {
  margin-bottom: 16px;
}
.culture-section:last-child { margin-bottom: 0; }
.culture-section p {
  color: var(--text-muted);
  line-height: 1.8;
}
.culture-section-label {
  font-size: 0.75rem;
  color: var(--c-red);
  font-weight: 600;
  letter-spacing: 0.08em;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.culture-philosophy {
  padding: 16px;
  background: var(--bg-light);
  border-radius: var(--r-sm);
}
.culture-value {
  padding: 16px;
  background: rgba(var(--gold-rgb), 0.04);
  border-left: 3px solid var(--c-red);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
}

/* ===== Quotes ===== */
.quotes-list {
  display: grid;
  gap: 16px;
}
.quote-block {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 32px;
  animation: slideUp 0.5s ease backwards;
}
.quote-icon {
  color: var(--c-red);
  margin-bottom: 12px;
}
.quote-content {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--text);
  margin-bottom: 20px;
  padding-left: 20px;
  border-left: 3px solid var(--border-light);
}
.quote-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.quote-author {
  display: flex;
  align-items: center;
  gap: 8px;
}
.quote-name {
  font-weight: 600;
  color: var(--text);
}
.quote-title {
  font-size: 0.8125rem;
  color: var(--text-muted);
}
.quote-source {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-style: italic;
}

/* ===== 古建筑详情增强 ===== */
.architecture-detail {
  background: var(--color-background);
}
.architecture-hero {
  position: relative;
  border-bottom: 1px solid var(--border);
}
.architecture-hero::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-secondary), var(--c-red), var(--color-secondary), transparent);
}
.architecture-title {
  font-size: 2.25rem !important;
  letter-spacing: 0.12em;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.08);
}
.atca-section-title {
  font-family: 'Noto Serif SC','STSong',serif !important;
  font-weight: 700;
  letter-spacing: 0.08em;
  position: relative;
  display: inline-block;
}
.atca-section-title::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 0;
  width: 30px;
  height: 2px;
  background: var(--c-red);
}
.atca-tech .feature-item {
  border-left: 3px solid var(--border);
  transition: all var(--t);
  padding-left: 12px;
}
.atca-tech .feature-item:hover {
  border-left-color: var(--c-red);
  background: rgba(var(--gold-rgb), 0.02);
}
.atca-tech .feature-item h4 {
  font-family: 'Noto Serif SC','STSong',serif;
  color: var(--c-red);
}
.gallery-images img {
  transition: all var(--t);
  border: 1px solid var(--border);
}
.gallery-images img:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(44,30,10,0.12);
  border-color: var(--border-light);
}
.architecture-meta {
  font-family: 'Noto Serif SC','STSong',serif;
}
.architecture-meta .meta-item {
  border-left: 3px solid var(--border);
  transition: all var(--t);
}
.architecture-meta .meta-item:hover {
  border-left-color: var(--color-secondary);
}
.info-section {
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
}
.comment-section {
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
}

/* ===== 写笔记按钮 ===== */
.btn-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--bg-card) 0%, rgba(123, 158, 194, 0.06) 100%);
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--font-serif);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  letter-spacing: 0.04em;
}
.btn-note:hover {
  border-color: rgba(123, 158, 194, 0.5);
  color: #7B9EC2;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
}

/* ===== 笔记列表 ===== */
.notes-list { display: flex; flex-direction: column; gap: 16px; }
.note-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 20px; transition: all var(--t); }
.note-card:hover { border-color: rgba(201, 169, 110, 0.15); }
.note-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; gap: 12px; }
.note-title { font-family: var(--font-serif); font-size: 1rem; font-weight: 600; color: var(--text); margin: 0; }
.note-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.note-badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: var(--r-full); font-weight: 500; }
.note-badge.public { background: rgba(90, 123, 108, 0.15); color: #7BC2B5; }
.note-badge.private { background: rgba(107, 114, 128, 0.1); color: var(--text-muted); }
.note-content { font-size: 0.875rem; color: var(--text); line-height: 1.7; margin-bottom: 10px; white-space: pre-wrap; }
.note-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.note-tag { font-size: 0.6875rem; padding: 2px 8px; border-radius: var(--r-full); background: rgba(201, 169, 110, 0.1); color: var(--gold-dim); }
.note-date { font-size: 0.75rem; color: var(--text-dim); }

/* ===== 响应式适配 ===== */

/* 平板端 */
@media screen and (max-width: 1024px) {
  .detail-header {
    flex-direction: column;
    gap: 24px;
  }
  .detail-image {
    width: 100%;
    height: 300px;
  }
  .detail-info {
    width: 100%;
  }
  .detail-badges {
    flex-wrap: wrap;
  }
  .detail-meta-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .detail-actions {
    flex-wrap: wrap;
    gap: 10px;
  }
  .detail-tabs {
    flex-wrap: wrap;
  }
  .tab-btn {
    padding: 8px 16px;
    font-size: 0.8125rem;
  }
  .timeline-item {
    gap: 16px;
  }
  .structure-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 移动端 */
@media screen and (max-width: 767px) {
  .page-content {
    padding-top: 70px !important;
  }
  .detail-header {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  .detail-image {
    width: 100%;
    height: 220px;
    border-radius: var(--r-md);
  }
  .detail-info {
    width: 100%;
  }
  .detail-badges {
    flex-wrap: wrap;
    gap: 6px;
  }
  .detail-badges .tag {
    font-size: 0.6875rem;
    padding: 2px 8px;
  }
  .detail-title-xl {
    font-size: 1.375rem;
    line-height: 1.4;
  }
  .detail-chinese {
    font-size: 0.875rem;
  }
  .detail-desc {
    font-size: 0.8125rem;
  }
  .detail-meta-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .meta-item {
    padding: 10px;
  }
  .meta-label {
    font-size: 0.6875rem;
  }
  .meta-value {
    font-size: 0.8125rem;
  }
  .detail-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  .btn-favorite {
    padding: 8px 14px;
    font-size: 0.75rem;
  }
  .btn-note {
    padding: 8px 14px;
    font-size: 0.75rem;
  }
  .btn-sec {
    padding: 8px 14px;
    font-size: 0.75rem;
  }
  .detail-tabs {
    flex-wrap: wrap;
    gap: 4px;
    padding: 12px 0;
  }
  .tab-btn {
    padding: 6px 12px;
    font-size: 0.75rem;
    border-radius: var(--r-sm);
  }
  .detail-body {
    padding: 16px;
  }
  .timeline {
    gap: 16px;
  }
  .timeline-item {
    flex-direction: column;
    gap: 12px;
  }
  .timeline-marker {
    width: 28px;
    height: 28px;
  }
  .timeline-num {
    font-size: 0.75rem;
  }
  .timeline-header h3 {
    font-size: 0.9375rem;
  }
  .timeline-period {
    font-size: 0.6875rem;
  }
  .timeline-desc {
    font-size: 0.8125rem;
  }
  .timeline-detail-box {
    font-size: 0.75rem;
    padding: 10px;
  }
  .structure-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .structure-card {
    padding: 14px;
  }
  .structure-header h3 {
    font-size: 0.9375rem;
  }
  .structure-desc {
    font-size: 0.8125rem;
  }
  .feature-detail-card {
    padding: 14px;
  }
  .feature-title {
    font-size: 0.9375rem;
  }
  .feature-section-label {
    font-size: 0.6875rem;
  }
  .feature-section p {
    font-size: 0.8125rem;
  }
  .culture-card {
    padding: 14px;
  }
  .culture-card h3 {
    font-size: 0.9375rem;
  }
  .culture-section-label {
    font-size: 0.6875rem;
  }
  .culture-section p {
    font-size: 0.8125rem;
  }
  .quote-block {
    padding: 14px;
  }
  .quote-content {
    font-size: 0.8125rem;
  }
  .quote-name {
    font-size: 0.8125rem;
  }
  .quote-title {
    font-size: 0.6875rem;
  }
  .note-card {
    padding: 14px;
  }
  .note-title {
    font-size: 0.9375rem;
  }
  .note-content {
    font-size: 0.8125rem;
  }
  .empty-state {
    padding: 32px 16px;
  }
}

/* 小屏移动端 */
@media screen and (max-width: 359px) {
  .detail-header {
    padding: 12px;
  }
  .detail-image {
    height: 180px;
  }
  .detail-title-xl {
    font-size: 1.25rem;
  }
  .detail-tabs {
    gap: 2px;
  }
  .tab-btn {
    padding: 5px 10px;
    font-size: 0.6875rem;
  }
  .detail-body {
    padding: 12px;
  }
}
</style>
