<template>
  <div class="page">
    <Navbar />
    <div class="container page-content">
      <div class="profile-layout">
        <!-- 左侧信息栏 -->
        <aside class="profile-sidebar">
          <div class="profile-card">
            <div class="avatar-wrapper">
              <SafeImage :src="avatarFullUrl" class="profile-avatar" @click="triggerAvatarUpload" fallback="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
              <div class="avatar-overlay" @click="triggerAvatarUpload">
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                <span>更换头像</span>
              </div>
              <input ref="avatarInput" type="file" accept="image/*" style="display: none" @change="handleAvatarChange" />
            </div>
            <h2>{{ profile?.nickname || profile?.username }}</h2>
            <p class="profile-username">@{{ profile?.username }}</p>
            <p class="profile-role" :class="profile?.role">{{ roleLabel }}</p>
            <p class="profile-bio">{{ profile?.bio || '暂无简介，点击设置添加...' }}</p>

            <!-- 等级进度 -->
            <div class="level-section">
              <div class="level-header">
                <span class="level-badge">Lv.{{ profile?.level || 1 }}</span>
                <span class="level-points">{{ profile?.points || 0 }} / {{ nextLevelPoints }} 积分</span>
              </div>
              <div class="level-progress-bar">
                <div class="level-progress-fill" :style="{ width: levelProgressPercent + '%' }"></div>
              </div>
              <p class="level-next">还需 {{ pointsToNext }} 积分升级</p>
            </div>

            <div class="profile-stats">
              <div class="stat-box">
                <strong>{{ profile?.points || 0 }}</strong>
                <span>积分</span>
              </div>
              <div class="stat-box">
                <strong>{{ stats.totalFavorites }}</strong>
                <span>收藏</span>
              </div>
              <div class="stat-box">
                <strong>{{ stats.totalModels }}</strong>
                <span>模型</span>
              </div>
              <div class="stat-box">
                <strong>{{ stats.totalQuizzes }}</strong>
                <span>答题</span>
              </div>
            </div>

            <div class="profile-meta">
              <p v-if="profile?.location">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                {{ profile.location }}
              </p>
              <p>
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                加入于 {{ formatDate(profile?.created_at) }}
              </p>
              <p v-if="profile?.last_login">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                上次登录 {{ formatDate(profile?.last_login) }}
              </p>
            </div>
          </div>

          <!-- 成就卡片 -->
          <div class="achievements-card" v-if="achievements.length">
            <h3>
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              最近成就
            </h3>
            <div class="achievements-list">
              <div v-for="ach in achievements.slice(0, 3)" :key="ach.achievement_id" class="achievement-item" :title="ach.description">
                <span class="achievement-icon">
                  <SafeImage 
                    v-if="ach.icon && ach.icon.startsWith('/')" 
                    :src="ach.icon" 
                    :alt="ach.name" 
                    class="achievement-icon-img" 
                    fallback="🏆"
                    :show-error="false"
                  />
                  <template v-else>{{ ach.icon || '🏆' }}</template>
                </span>
                <div class="achievement-info">
                  <span class="achievement-name">{{ ach.name }}</span>
                  <span class="achievement-date">{{ formatDate(ach.unlocked_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- 右侧内容区 -->
        <main class="profile-main">
          <div class="profile-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="tab-btn"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <svg v-if="tab.icon" viewBox="0 0 24 24" width="16" height="16" v-html="tab.icon"></svg>
              {{ tab.label }}
              <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
            </button>
          </div>

          <!-- 收藏Tab -->
          <div v-if="activeTab === 'favorites'" class="tab-panel">
            <div v-if="favorites.length" class="favorites-grid">
              <router-link
                v-for="fav in favorites"
                :key="fav.favorite_id"
                :to="`/architecture/${fav.architecture_id}`"
                class="fav-card"
              >
                <div class="fav-image-wrapper">
                  <img :src="fav.main_image_url || '/images/default-arch.jpg'" :alt="fav.name" />
                  <div class="fav-overlay">
                    <span class="fav-type">{{ fav.type }}</span>
                    <span class="fav-dynasty">{{ fav.founding_dynasty }}</span>
                  </div>
                </div>
                <div class="fav-info">
                  <span class="fav-name">{{ fav.name }}</span>
                  <span class="fav-location" v-if="fav.location">{{ fav.location }}</span>
                </div>
              </router-link>
            </div>
            <div v-else class="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <p>暂无收藏的古建筑</p>
              <router-link to="/architecture" class="atca-btn atca-btn-primary">去探索古建筑</router-link>
            </div>
          </div>

          <!-- 模型Tab -->
          <div v-if="activeTab === 'models'" class="tab-panel">
            <div v-if="models.length" class="models-list">
              <div v-for="model in models" :key="model.model_id" class="model-card">
                <div class="model-thumb">
                  <svg viewBox="0 0 24 24" width="28" height="28"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                </div>
                <div class="model-info">
                  <h4>{{ model.model_name }}</h4>
                  <p>{{ model.component_count || 0 }} 构件 · 创建于 {{ formatDate(model.created_at) }}</p>
                  <div class="model-tags">
                    <span class="tag" v-if="model.category">{{ model.category }}</span>
                    <span class="tag" v-if="model.is_public">公开</span>
                    <span class="tag private" v-else>私密</span>
                  </div>
                </div>
                <div class="model-actions">
                  <button class="btn-icon" @click="editModel(model.model_id)" title="编辑">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  </button>
                  <button class="btn-icon danger" @click="deleteModel(model.model_id)" title="删除">
                    <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <p>暂无3D模型</p>
              <router-link to="/workshop" class="atca-btn atca-btn-primary">去3D工坊创建</router-link>
            </div>
          </div>

          <!-- 积分Tab -->
          <div v-if="activeTab === 'points'" class="tab-panel">
            <div class="points-summary" v-if="points.length">
              <div class="points-stat">
                <span class="points-total">{{ profile?.points || 0 }}</span>
                <span class="points-label">当前积分</span>
              </div>
              <div class="points-stat">
                <span class="points-earned">+{{ totalPointsEarned }}</span>
                <span class="points-label">累计获得</span>
              </div>
              <div class="points-stat">
                <span class="points-spent">-{{ totalPointsSpent }}</span>
                <span class="points-label">累计消耗</span>
              </div>
            </div>
            <div v-if="points.length" class="points-list">
              <div v-for="pt in points" :key="pt.transaction_id" class="points-item">
                <div class="points-icon" :class="{ gain: pt.points_change > 0, loss: pt.points_change < 0 }">
                  <svg v-if="pt.points_change > 0" viewBox="0 0 24 24" width="16" height="16"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                  <svg v-else viewBox="0 0 24 24" width="16" height="16"><path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" stroke="currentColor" fill="none" stroke-width="2"/></svg>
                </div>
                <div class="points-detail">
                  <span class="points-desc">{{ pt.description || pt.transaction_type }}</span>
                  <span class="points-time">{{ formatDate(pt.created_at) }}</span>
                </div>
                <span class="points-value" :class="{ gain: pt.points_change > 0, loss: pt.points_change < 0 }">
                  {{ pt.points_change > 0 ? '+' : '' }}{{ pt.points_change }}
                </span>
              </div>
            </div>
            <div v-else class="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
              <p>暂无积分记录</p>
              <p class="empty-hint">参与知识竞赛可以获得积分哦</p>
            </div>
          </div>

          <!-- 笔记Tab -->
          <div v-if="activeTab === 'notes'" class="tab-panel">
            <div class="notes-manage-header">
              <h3>我的笔记</h3>
              <button class="atca-btn atca-btn-primary atca-btn-sm" @click="openNoteEditor(null)">
                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/></svg>
                新建笔记
              </button>
            </div>
            <div v-if="userNotes.length > 0" class="notes-manage-list">
              <div v-for="note in userNotes" :key="note.id" class="note-manage-card">
                <div class="note-manage-header">
                  <h4>{{ note.title }}</h4>
                  <div class="note-manage-actions">
                    <span v-if="note.isPublic" class="note-badge public">公开</span>
                    <span v-else class="note-badge private">私密</span>
                    <button class="btn-text" @click="openNoteEditor(note)">编辑</button>
                    <button class="btn-text danger" @click="deleteUserNote(note.id)">删除</button>
                  </div>
                </div>
                <p class="note-manage-content">{{ note.content }}</p>
                <div v-if="note.tags.length" class="note-manage-tags">
                  <span v-for="tag in note.tags" :key="tag" class="note-tag">{{ tag }}</span>
                </div>
                <div class="note-manage-meta">
                  <span v-if="note.relatedBuildingName" class="note-manage-link">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
                    {{ note.relatedBuildingName }}
                  </span>
                  <span>{{ new Date(note.updatedAt).toLocaleDateString('zh-CN') }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <svg viewBox="0 0 24 24" width="48" height="48"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 2v6h6" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/></svg>
              <p>暂无笔记</p>
              <p class="empty-hint">点击"新建笔记"开始记录</p>
            </div>
          </div>

          <!-- 设置Tab -->
          <div v-if="activeTab === 'settings'" class="tab-panel">
            <div class="settings-sections">
              <!-- 基本资料 -->
              <div class="settings-section">
                <h3>基本资料</h3>
                <div class="settings-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label>昵称</label>
                      <input v-model="settingsForm.nickname" class="atca-input" placeholder="请输入昵称" />
                    </div>
                    <div class="form-group">
                      <label>所在地 <button v-if="!geoLoading" class="btn-text" @click.prevent="getGeoLocation">📍自动获取</button><span v-else-if="geoLoading" class="hint">定位中...</span></label>
                      <div class="location-selector">
                        <select v-model="settingsForm.province" class="atca-input">
                          <option value="">请选择省份</option>
                          <option v-for="province in provinceData" :key="province.name" :value="province.name">{{ province.name }}</option>
                        </select>
                        <select v-model="settingsForm.city" class="atca-input" :disabled="!settingsForm.province">
                          <option value="">请选择城市</option>
                          <option v-for="city in currentCities" :key="city" :value="city">{{ city }}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>个人简介</label>
                    <textarea v-model="settingsForm.bio" class="atca-input" rows="3" placeholder="写一段简介介绍自己..."></textarea>
                  </div>
                  <div class="form-group">
                    <label>个人主页可见性</label>
                    <div class="visibility-options">
                      <label class="visibility-option" :class="{ active: settingsForm.visibility === 'public' }">
                        <div class="option-content">
                          <div class="option-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22">
                              <path d="M12 4.5C7.25 4.5 3.25 7.5 1.75 12c1.5 4.5 5.5 7.5 10.25 7.5s8.75-3 10.25-7.5c-1.5-4.5-5.5-7.5-10.25-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </div>
                          <div class="option-text">
                            <div class="option-title">公开</div>
                            <div class="option-desc">所有人可见您的主页</div>
                          </div>
                        </div>
                        <input type="radio" v-model="settingsForm.visibility" value="public" />
                        <div class="option-check"></div>
                      </label>
                      
                      <label class="visibility-option" :class="{ active: settingsForm.visibility === 'friends' }">
                        <div class="option-content">
                          <div class="option-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22">
                              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </div>
                          <div class="option-text">
                            <div class="option-title">仅好友可见</div>
                            <div class="option-desc">只有您的好友能看到主页</div>
                          </div>
                        </div>
                        <input type="radio" v-model="settingsForm.visibility" value="friends" />
                        <div class="option-check"></div>
                      </label>
                      
                      <label class="visibility-option" :class="{ active: settingsForm.visibility === 'private' }">
                        <div class="option-content">
                          <div class="option-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </div>
                          <div class="option-text">
                            <div class="option-title">私密</div>
                            <div class="option-desc">只有您自己能看到主页</div>
                          </div>
                        </div>
                        <input type="radio" v-model="settingsForm.visibility" value="private" />
                        <div class="option-check"></div>
                      </label>
                    </div>
                  </div>
                  <button class="atca-btn atca-btn-primary" @click="saveSettings" :disabled="saving">
                    <span v-if="saving">保存中...</span>
                    <span v-else>保存资料</span>
                  </button>
                </div>
              </div>

              <!-- 动画设置 -->
              <div class="settings-section">
                <h3>动画设置</h3>
                <div class="settings-form">
                  <div class="form-group">
                    <label>转场动画</label>
                    <div class="toggle-option">
                      <div class="toggle-info">
                        <span class="toggle-label">跳过转场动画</span>
                        <span class="toggle-hint">直接跳转，无页面切换动画</span>
                      </div>
                      <div class="toggle-switch" :class="{ active: animationSettings.skipTransition }" @click="animationSettings.skipTransition = !animationSettings.skipTransition">
                        <div class="toggle-knob"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 修改密码 -->
              <div class="settings-section">
                <h3>安全设置</h3>
                <div class="settings-form">
                  <div class="form-group">
                    <label>当前密码</label>
                    <input v-model="passwordForm.oldPassword" type="password" class="atca-input" placeholder="输入当前密码" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>新密码</label>
                      <input v-model="passwordForm.newPassword" type="password" class="atca-input" placeholder="至少6位" />
                    </div>
                    <div class="form-group">
                      <label>确认新密码</label>
                      <input v-model="passwordForm.confirmPassword" type="password" class="atca-input" placeholder="再次输入" />
                    </div>
                  </div>
                  <button class="atca-btn atca-btn-secondary" @click="changePassword" :disabled="changingPassword">
                    <span v-if="changingPassword">修改中...</span>
                    <span v-else>修改密码</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    <!-- 笔记编辑器弹窗 -->
    <NoteEditor
      v-if="showNoteEditor"
      :note="editingNote"
      @close="showNoteEditor = false"
      @saved="onNoteSaved"
    />

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import SafeImage from '@/components/common/SafeImage.vue';
import { profileApi, authApi, activityApi, model3dApi, API_HOST } from '@/services/api';
import { formatDate } from '@shared/utils';
import { noteManager } from '@/utils/noteManager';
import type { Note } from '@/utils/noteManager';
import NoteEditor from '@/components/notes/NoteEditor.vue';
import { useI18n } from 'vue-i18n';
import { useAnimationSettingsStore } from '@/stores/animationSettings';
import { useUserStore } from '@/stores';
import { API_BASE } from '@/services/api';
import { compressImage, isValidImageType, formatFileSize } from '@/utils/imageCompressor';

const router = useRouter();
const { t } = useI18n();
const animationSettings = useAnimationSettingsStore();
const userStore = useUserStore();
const profile = ref<any>(null);
const userNotes = ref<Note[]>(noteManager.getAll());
const showNoteEditor = ref(false);
const editingNote = ref<Note | null>(null);
const favorites = ref<any[]>([]);
const models = ref<any[]>([]);
const points = ref<any[]>([]);
const achievements = ref<any[]>([]);
const activeTab = ref('favorites');
const saving = ref(false);
const changingPassword = ref(false);
const avatarInput = ref<HTMLInputElement | null>(null);

const stats = ref({
  totalFavorites: 0,
  totalModels: 0,
  totalQuizzes: 0,
});

// 等级计算
const nextLevelPoints = computed(() => {
  const level = profile.value?.level || 1;
  return level * 100;
});

const levelProgressPercent = computed(() => {
  const current = profile.value?.points || 0;
  const needed = nextLevelPoints.value;
  return Math.min((current / needed) * 100, 100);
});

const pointsToNext = computed(() => {
  return Math.max(nextLevelPoints.value - (profile.value?.points || 0), 0);
});

const totalPointsEarned = computed(() => {
  return points.value.filter(p => p.points_change > 0).reduce((sum, p) => sum + p.points_change, 0);
});

const totalPointsSpent = computed(() => {
  return Math.abs(points.value.filter(p => p.points_change < 0).reduce((sum, p) => sum + p.points_change, 0));
});

const avatarFullUrl = computed(() => {
  const avatar = profile.value?.avatar;
  if (!avatar) return '/images/default-avatar.svg';

  // 如果是绝对URL或base64，直接返回
  if (avatar.startsWith('http') || avatar.startsWith('data:')) return avatar;

  // 如果是/uploads/开头
  if (avatar.startsWith('/uploads/')) {
    // 在开发环境或后端直连模式下，使用API_BASE路径
    // 在生产环境通过Nginx代理时，使用相对路径
    const isProduction = import.meta.env.PROD;
    if (isProduction) {
      // 生产环境：假设Nginx正确代理了/uploads路径
      return avatar;
    } else {
      // 开发环境：拼接API基础路径
      const apiBase = API_BASE || '/api/v1';
      // 去掉/api/v1部分，只保留完整路径
      const baseUrl = apiBase.replace(/\/api\/v1$/, '');
      return `${baseUrl}${avatar}`;
    }
  }

  // 其他情况返回默认头像
  return '/images/default-avatar.svg';
});

const roleLabel = computed(() => {
  const roles: Record<string, string> = { admin: '管理员', moderator: '版主', user: '用户' };
  return roles[profile.value?.role] || '用户';
});

const tabs = computed(() => [
  { key: 'favorites', label: t('profile.tabs.favorites'), icon: '<path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>', badge: stats.value.totalFavorites },
  { key: 'models', label: t('profile.tabs.models'), icon: '<path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/>', badge: stats.value.totalModels },
  { key: 'notes', label: t('profile.tabs.notes'), icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M14 2v6h6" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/>', badge: userNotes.value.length },
  { key: 'points', label: t('profile.tabs.points'), icon: '<path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>', badge: undefined },
  { key: 'settings', label: t('profile.tabs.settings'), icon: '<path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" stroke="currentColor" fill="none" stroke-width="1.5"/>', badge: undefined },
]);

const settingsForm = ref({
  nickname: '',
  bio: '',
  province: '',
  city: '',
  visibility: 'public',
});
const geoLoading = ref(false);
const showCitySelect = ref(false);

// 中国省份数据
const provinceData = [
  { name: '北京市', cities: ['北京市'] },
  { name: '天津市', cities: ['天津市'] },
  { name: '上海市', cities: ['上海市'] },
  { name: '重庆市', cities: ['重庆市'] },
  { name: '河北省', cities: ['石家庄市', '唐山市', '秦皇岛市', '邯郸市', '邢台市', '保定市', '张家口市', '承德市', '沧州市', '廊坊市', '衡水市'] },
  { name: '山西省', cities: ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'] },
  { name: '辽宁省', cities: ['沈阳市', '大连市', '鞍山市', '抚顺市', '本溪市', '丹东市', '锦州市', '营口市', '阜新市', '辽阳市', '盘锦市', '铁岭市', '朝阳市', '葫芦岛市'] },
  { name: '吉林省', cities: ['长春市', '吉林市', '四平市', '辽源市', '通化市', '白山市', '松原市', '白城市', '延边朝鲜族自治州'] },
  { name: '黑龙江省', cities: ['哈尔滨市', '齐齐哈尔市', '鸡西市', '鹤岗市', '双鸭山市', '大庆市', '伊春市', '佳木斯市', '七台河市', '牡丹江市', '黑河市', '绥化市', '大兴安岭地区'] },
  { name: '江苏省', cities: ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'] },
  { name: '浙江省', cities: ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'] },
  { name: '安徽省', cities: ['合肥市', '芜湖市', '蚌埠市', '淮南市', '马鞍山市', '淮北市', '铜陵市', '安庆市', '黄山市', '滁州市', '阜阳市', '宿州市', '六安市', '亳州市', '池州市', '宣城市'] },
  { name: '福建省', cities: ['福州市', '厦门市', '莆田市', '三明市', '泉州市', '漳州市', '南平市', '龙岩市', '宁德市'] },
  { name: '江西省', cities: ['南昌市', '景德镇市', '萍乡市', '九江市', '新余市', '鹰潭市', '赣州市', '吉安市', '宜春市', '抚州市', '上饶市'] },
  { name: '山东省', cities: ['济南市', '青岛市', '淄博市', '枣庄市', '东营市', '烟台市', '潍坊市', '济宁市', '泰安市', '威海市', '日照市', '临沂市', '德州市', '聊城市', '滨州市', '菏泽市'] },
  { name: '河南省', cities: ['郑州市', '开封市', '洛阳市', '平顶山市', '安阳市', '鹤壁市', '新乡市', '焦作市', '濮阳市', '许昌市', '漯河市', '三门峡市', '南阳市', '商丘市', '信阳市', '周口市', '驻马店市', '济源市'] },
  { name: '湖北省', cities: ['武汉市', '黄石市', '十堰市', '宜昌市', '襄阳市', '鄂州市', '荆门市', '孝感市', '荆州市', '黄冈市', '咸宁市', '随州市', '恩施土家族苗族自治州', '仙桃市', '潜江市', '天门市', '神农架林区'] },
  { name: '湖南省', cities: ['长沙市', '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市', '常德市', '张家界市', '益阳市', '郴州市', '永州市', '怀化市', '娄底市', '湘西土家族苗族自治州'] },
  { name: '广东省', cities: ['广州市', '韶关市', '深圳市', '珠海市', '汕头市', '佛山市', '江门市', '湛江市', '茂名市', '肇庆市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'] },
  { name: '海南省', cities: ['海口市', '三亚市', '三沙市', '儋州市'] },
  { name: '四川省', cities: ['成都市', '自贡市', '攀枝花市', '泸州市', '德阳市', '绵阳市', '广元市', '遂宁市', '内江市', '乐山市', '南充市', '眉山市', '宜宾市', '广安市', '达州市', '雅安市', '巴中市', '资阳市', '阿坝藏族羌族自治州', '甘孜藏族自治州', '凉山彝族自治州'] },
  { name: '贵州省', cities: ['贵阳市', '六盘水市', '遵义市', '安顺市', '毕节市', '铜仁市', '黔西南布依族苗族自治州', '黔东南苗族侗族自治州', '黔南布依族苗族自治州'] },
  { name: '云南省', cities: ['昆明市', '曲靖市', '玉溪市', '保山市', '昭通市', '丽江市', '普洱市', '临沧市', '楚雄彝族自治州', '红河哈尼族彝族自治州', '文山壮族苗族自治州', '西双版纳傣族自治州', '大理白族自治州', '德宏傣族景颇族自治州', '怒江傈僳族自治州', '迪庆藏族自治州'] },
  { name: '陕西省', cities: ['西安市', '铜川市', '宝鸡市', '咸阳市', '渭南市', '延安市', '汉中市', '榆林市', '安康市', '商洛市'] },
  { name: '甘肃省', cities: ['兰州市', '嘉峪关市', '金昌市', '白银市', '天水市', '武威市', '张掖市', '平凉市', '酒泉市', '庆阳市', '定西市', '陇南市', '临夏回族自治州', '甘南藏族自治州'] },
  { name: '青海省', cities: ['西宁市', '海东市', '海北藏族自治州', '黄南藏族自治州', '海南藏族自治州', '果洛藏族自治州', '玉树藏族自治州', '海西蒙古族藏族自治州'] },
  { name: '台湾省', cities: ['台北市', '新北市', '桃园市', '台中市', '台南市', '高雄市'] },
  { name: '内蒙古自治区', cities: ['呼和浩特市', '包头市', '乌海市', '赤峰市', '通辽市', '鄂尔多斯市', '呼伦贝尔市', '巴彦淖尔市', '乌兰察布市', '兴安盟', '锡林郭勒盟', '阿拉善盟'] },
  { name: '广西壮族自治区', cities: ['南宁市', '柳州市', '桂林市', '梧州市', '北海市', '防城港市', '钦州市', '贵港市', '玉林市', '百色市', '贺州市', '河池市', '来宾市', '崇左市'] },
  { name: '西藏自治区', cities: ['拉萨市', '日喀则市', '昌都市', '林芝市', '山南市', '那曲市', '阿里地区'] },
  { name: '宁夏回族自治区', cities: ['银川市', '石嘴山市', '吴忠市', '固原市', '中卫市'] },
  { name: '新疆维吾尔自治区', cities: ['乌鲁木齐市', '克拉玛依市', '吐鲁番市', '哈密市', '昌吉回族自治州', '博尔塔拉蒙古自治州', '巴音郭楞蒙古自治州', '阿克苏地区', '克孜勒苏柯尔克孜自治州', '喀什地区', '和田地区', '伊犁哈萨克自治州', '塔城地区', '阿勒泰地区'] },
  { name: '香港特别行政区', cities: ['香港'] },
  { name: '澳门特别行政区', cities: ['澳门'] },
];

// 获取当前省份对应的城市列表
const currentCities = computed(() => {
  const province = provinceData.find(p => p.name === settingsForm.value.province);
  return province ? province.cities : [];
});

// 当省份变化时，清空城市选择
watch(() => settingsForm.value.province, () => {
  settingsForm.value.city = '';
});

async function getGeoLocation() {
  if (!navigator.geolocation) { alert('您的浏览器不支持地理定位'); return; }
  geoLoading.value = true;
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
        const data = await res.json();
        
        // 尝试匹配省份和城市
        const address = data.address;
        if (address) {
          const state = address.state || address.province || '';
          const city = address.city || address.town || address.county || '';
          
          // 查找匹配的省份
          const matchedProvince = provinceData.find(p => 
            state.includes(p.name) || p.name.includes(state)
          );
          
          if (matchedProvince) {
            settingsForm.value.province = matchedProvince.name;
            
            // 查找匹配的城市
            const matchedCity = matchedProvince.cities.find(c => 
              city.includes(c) || c.includes(city)
            );
            
            if (matchedCity) {
              settingsForm.value.city = matchedCity;
            }
          }
        }
        
        if (!settingsForm.value.province) {
          alert('无法自动识别位置，请手动选择省份和城市');
        }
      } catch {
        alert('无法获取位置信息，请手动选择省份和城市');
      }
      geoLoading.value = false;
    },
    () => { alert('无法获取位置信息，请手动选择省份和城市'); geoLoading.value = false; },
    { timeout: 10000 }
  );
}

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

async function loadProfile() {
  try {
    const res = await profileApi.getProfile();
    if (res.success) {
      profile.value = res.data;
      
      // 解析location为province和city
      let province = '';
      let city = '';
      if (res.data.location) {
        const locationParts = res.data.location.split(' ');
        if (locationParts.length >= 2) {
          // 尝试匹配省份
          const matchedProvince = provinceData.find(p => 
            locationParts[0].includes(p.name) || p.name.includes(locationParts[0])
          );
          if (matchedProvince) {
            province = matchedProvince.name;
            // 尝试匹配城市
            const matchedCity = matchedProvince.cities.find(c => 
              locationParts.slice(1).some(part => part.includes(c) || c.includes(part))
            );
            if (matchedCity) {
              city = matchedCity;
            }
          }
        }
      }
      
      settingsForm.value = {
        nickname: res.data.nickname || '',
        bio: res.data.bio || '',
        province: province,
        city: city,
        visibility: res.data.visibility || 'public',
      };
    }
  } catch (e) {
    console.error('[Profile] 加载用户信息失败:', e);
  }
}

function openNoteEditor(note: Note | null) {
  editingNote.value = note;
  showNoteEditor.value = true;
}
function onNoteSaved() {
  showNoteEditor.value = false;
  userNotes.value = noteManager.getAll();
}
function deleteUserNote(id: string) {
  if (!confirm('确定删除这条笔记？')) return;
  noteManager.delete(id);
  userNotes.value = noteManager.getAll();
}

async function loadFavorites() {
  try {
    const res = await profileApi.getFavorites();
    if (res.success) {
      favorites.value = res.data;
      stats.value.totalFavorites = res.data.length;
    }
  } catch (e) {
    console.error('[Profile] 加载收藏失败:', e);
  }
}

async function loadModels() {
  try {
    const res = await profileApi.getModels();
    if (res.success) {
      models.value = res.data;
      stats.value.totalModels = res.data.length;
    }
  } catch (e) {
    console.error('[Profile] 加载模型失败:', e);
  }
}

async function loadPoints() {
  try {
    const res = await profileApi.getPoints();
    if (res.success) {
      points.value = res.data;
    }
  } catch (e) {
    console.error('[Profile] 加载积分失败:', e);
  }
}

async function loadAchievements() {
  try {
    const res = await activityApi.getUserAchievements();
    if (res.success) {
      achievements.value = res.data;
    }
  } catch (e) {
    console.error('[Profile] 加载成就失败:', e);
  }
}

async function saveSettings() {
  // 验证省份和城市
  if (!settingsForm.value.province) {
    alert('请选择省份');
    return;
  }
  if (!settingsForm.value.city) {
    alert('请选择城市');
    return;
  }
  
  saving.value = true;
  try {
    const location = `${settingsForm.value.province} ${settingsForm.value.city}`;
    await authApi.updateProfile({
      nickname: settingsForm.value.nickname,
      bio: settingsForm.value.bio,
      location: location,
    });
    await profileApi.updateSettings({
      visibility: settingsForm.value.visibility,
      bio: settingsForm.value.bio,
      location: location,
    });
    alert('设置已保存');
    loadProfile();
  } catch (e: any) {
    alert('保存失败: ' + (e.message || '未知错误'));
  } finally {
    saving.value = false;
  }
}

async function changePassword() {
  if (!passwordForm.value.oldPassword || !passwordForm.value.newPassword) {
    alert('请填写所有密码字段');
    return;
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('两次输入的新密码不一致');
    return;
  }
  if (passwordForm.value.newPassword.length < 6) {
    alert('新密码至少6位');
    return;
  }
  changingPassword.value = true;
  try {
    await authApi.changePassword({
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    });
    alert('密码修改成功');
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  } catch (e: any) {
    alert('密码修改失败: ' + (e.response?.data?.error?.message || e.message || '请检查当前密码是否正确'));
  } finally {
    changingPassword.value = false;
  }
}

function triggerAvatarUpload() {
  avatarInput.value?.click();
}

async function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // 文件类型验证
  if (!isValidImageType(file)) {
    alert('只支持 JPG、PNG、GIF 或 WebP 格式的图片');
    return;
  }

  // 显示上传中状态
  const originalAvatar = profile.value?.avatar;
  const isLargeFile = file.size > 2 * 1024 * 1024;

  try {
    // 客户端压缩图片
    console.log(`[Profile] 原始图片大小: ${formatFileSize(file.size)}`);
    
    const compressedFile = await compressImage(file, {
      maxSize: 2 * 1024 * 1024, // 2MB
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.7
    });

    console.log(`[Profile] 压缩后图片大小: ${formatFileSize(compressedFile.size)}`);

    // 如果是大文件压缩，提示用户压缩情况
    if (isLargeFile && compressedFile.size < file.size) {
      console.log(`[Profile] 图片已从 ${formatFileSize(file.size)} 压缩至 ${formatFileSize(compressedFile.size)}`);
    }

    // 本地预览压缩后的图片
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (profile.value) profile.value.avatar = ev.target?.result as string;
    };
    reader.readAsDataURL(compressedFile);

    // 上传压缩后的图片
    const formData = new FormData();
    formData.append('avatar', compressedFile);
    const res = await authApi.uploadAvatar(formData);

    if (res.success && profile.value) {
      const newAvatarUrl = res.data?.avatarUrl || (res as any).avatarUrl;
      profile.value.avatar = newAvatarUrl || profile.value.avatar;

      // 同步更新 userStore 中的 avatar，确保 Navbar 实时更新
      if (userStore.user) {
        userStore.user.avatar = newAvatarUrl || userStore.user.avatar;
        localStorage.setItem('atca_user', JSON.stringify(userStore.user));
      }

      alert('头像上传成功！');
      console.log('[Profile] 头像上传成功', { avatarUrl: newAvatarUrl });
    } else {
      // 上传失败，恢复原头像
      const errorMsg = (res as any)?.error?.message || '服务器错误，请重试';
      alert('头像上传失败：' + errorMsg);
      if (profile.value) profile.value.avatar = originalAvatar;
    }
  } catch (e: any) {
    console.error('[Profile] 头像上传失败:', e);
    // 恢复原头像
    if (profile.value) profile.value.avatar = originalAvatar;

    // 提供更友好的错误提示
    if (e.message?.includes('压缩')) {
      alert('图片压缩失败，请尝试选择其他图片');
    } else if (e.response?.status === 401) {
      alert('登录已过期，请重新登录后再试');
    } else if (e.response?.status === 413) {
      alert('图片太大，请选择更小的图片（不超过2MB）');
    } else if (e.response?.data?.error?.message) {
      alert('上传失败：' + e.response.data.error.message);
    } else {
      alert('头像上传失败，请检查网络连接后重试');
    }
  }

  // 清空input，允许重新选择同一文件
  if (avatarInput.value) avatarInput.value.value = '';
}

function editModel(id: number) {
  router.push(`/workshop?model=${id}`);
}

async function deleteModel(id: number) {
  if (!confirm('确定删除此模型吗？此操作不可恢复。')) return;
  try {
    await model3dApi.deleteModel(id);
    models.value = models.value.filter(m => m.model_id !== id);
    stats.value.totalModels = models.value.length;
    alert('模型已删除');
  } catch (e: any) {
    alert('删除失败: ' + (e.message || '未知错误'));
  }
}

onMounted(async () => {
  await loadProfile();
  await Promise.all([loadFavorites(), loadModels(), loadPoints(), loadAchievements()]);
});
</script>

<style scoped>
.page { min-height: 100vh; display: flex; flex-direction: column; }
.page-content { flex: 1; padding-top: 100px; padding-bottom: 48px; }

.profile-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  align-items: stretch;
}

/* 左侧边栏 */
.profile-sidebar {
  position: sticky;
  top: 88px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-self: start;
  height: fit-content;
  min-height: 600px;
}

.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 28px 24px;
  text-align: center;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
  cursor: pointer;
}
.profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border);
  transition: all var(--t);
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.6875rem;
  opacity: 0;
  transition: opacity var(--t);
}
.avatar-overlay svg { margin-bottom: 4px; }
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.avatar-wrapper:hover .profile-avatar { filter: brightness(0.8); }

.profile-card h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 4px;
}
.profile-username {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.profile-role {
  display: inline-block;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 0.6875rem;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.profile-role.admin { background: rgba(201, 169, 110, 0.12); color: var(--gold); border: 1px solid rgba(201, 169, 110, 0.25); }
.profile-role.moderator { background: rgba(201, 169, 110, 0.08); color: var(--gold-dim); border: 1px solid rgba(201, 169, 110, 0.15); }
.profile-role.user { background: rgba(154, 144, 132, 0.1); color: var(--text-muted); border: 1px solid var(--border); }
.profile-bio {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 24px;
  line-height: 1.5;
  min-height: 1.5em;
}

/* 等级进度 */
.level-section {
  background: var(--bg-hover);
  border-radius: var(--r-md);
  padding: 16px;
  margin-bottom: 20px;
}
.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.level-badge {
  font-family: 'Noto Serif SC','STSong',serif;
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--gold);
}
.level-points {
  font-size: 0.6875rem;
  color: var(--text-muted);
}
.level-progress-bar {
  height: 6px;
  background: var(--border);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 6px;
}
.level-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--gold-dim), var(--gold));
  border-radius: var(--radius-full);
  transition: width 0.5s ease;
}
.level-next {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 统计 */
.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin: 20px 0;
  padding: 4px 0;
}
.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 4px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
  border: 1px solid var(--border);
}
.stat-box strong {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 1.125rem;
  color: var(--gold);
  font-weight: 700;
}
.stat-box span {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.profile-meta {
  text-align: left;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.profile-meta p {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
}
.profile-meta svg {
  flex-shrink: 0;
  color: var(--text-muted);
}

/* 成就卡片 */
.achievements-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
}
.achievements-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--gold);
}
.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.achievement-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
}
.achievement-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}
.achievement-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.achievement-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.achievement-name {
  font-size: 0.8125rem;
  font-weight: 500;
}
.achievement-date {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* 右侧主内容 */
.profile-main {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 600px;
}
.tab-panel {
  flex: 1;
  padding: 24px;
  min-height: 500px;
}

/* 标签页 */
.profile-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  background: var(--bg-hover);
}
.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  transition: all var(--t);
  position: relative;
}
.tab-btn:hover { color: var(--gold); background: rgba(var(--gold-rgb), 0.06); }
.tab-btn.active {
  color: var(--gold);
  border-bottom-color: var(--gold);
  background: var(--bg-card);
}
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--gold);
  color: #1A1714;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: var(--radius-full);
}

/* .tab-panel moved to profile-main section */

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: var(--text-muted);
  text-align: center;
}
.empty-state svg {
  margin-bottom: 16px;
  opacity: 0.4;
}
.empty-state p {
  font-size: 0.9375rem;
  margin-bottom: 8px;
}
.empty-hint {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* 收藏网格 */
.favorites-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.fav-card {
  border-radius: var(--r-md);
  overflow: hidden;
  text-decoration: none;
  border: 1px solid var(--border);
  transition: all var(--t);
}
.fav-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  border-color: var(--gold);
}
.fav-image-wrapper {
  position: relative;
  aspect-ratio: 16/10;
  overflow: hidden;
}
.fav-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}
.fav-card:hover .fav-image-wrapper img { transform: scale(1.05); }
.fav-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 10px;
}
.fav-type, .fav-dynasty {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: var(--r-sm);
  background: rgba(255,255,255,0.9);
  color: var(--text);
}
.fav-info {
  padding: 12px;
}
.fav-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 4px;
}
.fav-location {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* 模型列表 */
.models-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.model-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  transition: all var(--t);
}
.model-card:hover {
  border-color: var(--border-light);
  background: var(--bg-light);
}
.model-thumb {
  width: 56px;
  height: 56px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}
.model-info {
  flex: 1;
}
.model-info h4 {
  font-size: 0.9375rem;
  font-weight: 500;
  margin-bottom: 4px;
}
.model-info p {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.model-tags {
  display: flex;
  gap: 6px;
}
.model-tags .tag {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: var(--r-sm);
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}
.model-tags .tag.private {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}
.model-actions {
  display: flex;
  gap: 8px;
}
.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-md);
  background: var(--bg-hover);
  color: var(--text-muted);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all var(--t);
}
.btn-icon:hover {
  background: var(--gold);
  color: #1A1714;
  border-color: var(--gold);
}
.btn-icon.danger:hover {
  background: #C75C3A;
  border-color: #C75C3A;
  color: white;
}

/* 积分 */
.points-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 20px;
  background: var(--bg-hover);
  border-radius: var(--r-md);
}
.points-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}
.points-total {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--gold);
}
.points-earned {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-jade);
}
.points-spent {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-red);
}
.points-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
}
.points-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.points-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: var(--r-md);
  background: var(--bg-hover);
  transition: all var(--t);
}
.points-item:hover {
  background: var(--bg-light);
}
.points-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.points-icon.gain { background: rgba(34, 197, 94, 0.1); color: var(--c-jade); }
.points-icon.loss { background: rgba(239, 68, 68, 0.1); color: var(--c-red); }
.points-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.points-desc {
  font-size: 0.875rem;
  color: var(--text);
}
.points-time {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.points-value {
  font-family: 'Noto Serif SC','STSong',serif;
  font-size: 1.125rem;
  font-weight: 700;
}
.points-value.gain { color: var(--c-jade); }
.points-value.loss { color: var(--c-red); }

/* 设置 */
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.settings-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}
.settings-form {
  max-width: 600px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-muted);
}
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--r-md);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all var(--t);
}
.radio-option:hover {
  border-color: var(--gold);
  background: rgba(var(--gold-rgb), 0.02);
}
.radio-option input[type="radio"] {
  accent-color: var(--c-red);
}
.radio-option span {
  font-size: 0.875rem;
  color: var(--text);
}

/* 省市级联选择器 */
.location-selector {
  display: flex;
  gap: 12px;
}

.location-selector select {
  flex: 1;
  cursor: pointer;
}

.location-selector select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 个人主页可见性选项 */
.visibility-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.visibility-option {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: 2px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-hover);
  cursor: pointer;
  transition: all var(--t);
}

.visibility-option:hover {
  border-color: rgba(var(--gold-rgb), 0.5);
  background: rgba(var(--gold-rgb), 0.03);
}

.visibility-option.active {
  border-color: var(--gold);
  background: rgba(var(--gold-rgb), 0.06);
  box-shadow: 0 0 0 3px rgba(var(--gold-rgb), 0.1);
}

.visibility-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: rgba(var(--gold-rgb), 0.1);
  color: var(--gold);
  transition: all var(--t);
}

.visibility-option.active .option-icon {
  background: var(--gold);
  color: var(--bg);
}

.option-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  font-family: var(--font-serif);
}

.option-desc {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.option-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--t);
  flex-shrink: 0;
}

.visibility-option.active .option-check {
  border-color: var(--gold);
  background: var(--gold);
}

.visibility-option.active .option-check::after {
  content: '';
  width: 10px;
  height: 10px;
  background: var(--bg);
  border-radius: 50%;
}

/* 动画设置toggle开关 */
.toggle-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--bg-hover);
}
.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.toggle-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
}
.toggle-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.toggle-switch {
  width: 48px;
  height: 28px;
  background: var(--border);
  border-radius: 14px;
  position: relative;
  cursor: pointer;
  transition: all var(--t-fast);
}
.toggle-switch.active {
  background: var(--gold);
}
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  background: white;
  border-radius: 50%;
  transition: all var(--t-fast);
}
.toggle-switch.active .toggle-knob {
  left: 23px;
}

/* ===== 笔记管理 ===== */
.notes-manage-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.notes-manage-header h3 { font-size: 1rem; font-weight: 600; color: var(--text); }
.notes-manage-list { display: flex; flex-direction: column; gap: 14px; }
.note-manage-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-md); padding: 18px; transition: all var(--t); }
.note-manage-card:hover { border-color: rgba(201, 169, 110, 0.15); }
.note-manage-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 12px; }
.note-manage-header h4 { font-family: var(--font-serif); font-size: 0.9375rem; font-weight: 600; color: var(--text); margin: 0; }
.note-manage-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.note-manage-content { font-size: 0.8125rem; color: var(--text); line-height: 1.7; margin-bottom: 8px; white-space: pre-wrap; }
.note-manage-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.note-manage-meta { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: var(--text-dim); }
.note-manage-link { display: flex; align-items: center; gap: 4px; color: var(--gold-dim); }

/* ===== 响应式适配 ===== */

/* 大屏桌面 (最小1400px) */
@media screen and (min-width: 1400px) {
  .profile-layout {
    grid-template-columns: 340px 1fr;
    gap: 32px;
  }
  .profile-card {
    padding: 32px 28px;
  }
  .profile-avatar {
    width: 110px;
    height: 110px;
    border-width: 3px;
  }
  .profile-card h2 {
    font-size: 1.375rem;
  }
}

/* 桌面端 (992px - 1399px) */
@media screen and (max-width: 1399px) {
  .profile-layout {
    grid-template-columns: 300px 1fr;
    gap: 24px;
  }
  .profile-card {
    padding: 26px 22px;
  }
  .profile-avatar {
    width: 95px;
    height: 95px;
  }
}

/* 平板端 (600px - 991px) */
@media screen and (max-width: 991px) {
  .profile-layout {
    grid-template-columns: 260px 1fr;
    gap: 20px;
  }
  .page-content {
    padding-top: 80px;
    padding-bottom: 40px;
    padding-left: 16px;
    padding-right: 16px;
  }
  .profile-card {
    padding: 22px 18px;
  }
  .profile-avatar {
    width: 85px;
    height: 85px;
    border-width: 2px;
  }
  .profile-card h2 {
    font-size: 1.125rem;
  }
  .profile-username {
    font-size: 0.8125rem;
  }
  .profile-stats {
    gap: 8px;
    margin: 16px 0;
  }
  .stat-box {
    padding: 10px 4px;
  }
  .stat-box strong {
    font-size: 1rem;
  }
  .stat-box span {
    font-size: 0.625rem;
  }
  .favorites-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .models-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .quiz-history-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 移动端 (最大599px) */
@media screen and (max-width: 599px) {
  .profile-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .page-content {
    padding-top: 70px;
    padding-bottom: 32px;
    padding-left: 12px;
    padding-right: 12px;
  }
  .profile-sidebar {
    position: relative;
    min-height: auto;
  }
  .profile-card {
    padding: 20px 16px;
    text-align: center;
  }
  .avatar-wrapper {
    margin-bottom: 14px;
  }
  .profile-avatar {
    width: 80px;
    height: 80px;
    border-width: 2px;
  }
  .profile-card h2 {
    font-size: 1.125rem;
    margin-bottom: 4px;
  }
  .profile-username {
    font-size: 0.75rem;
    margin-bottom: 8px;
  }
  .profile-role {
    padding: 2px 8px;
    font-size: 0.625rem;
    margin-bottom: 10px;
  }
  .profile-bio {
    font-size: 0.75rem;
    margin-bottom: 14px;
  }
  .level-section {
    padding: 10px;
    margin-bottom: 14px;
  }
  .level-badge {
    font-size: 0.75rem;
  }
  .level-points {
    font-size: 0.625rem;
  }
  .level-next {
    font-size: 0.625rem;
  }
  .profile-stats {
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin: 14px 0;
    padding: 4px 0;
  }
  .stat-box {
    padding: 10px 4px;
    min-height: 56px;
  }
  .stat-box strong {
    font-size: 0.9375rem;
  }
  .stat-box span {
    font-size: 0.625rem;
  }
  .profile-meta {
    font-size: 0.7rem;
    padding-top: 10px;
  }
  .profile-main {
    min-height: 400px;
  }
  .tab-panel {
    padding: 16px;
    min-height: 400px;
  }
  .profile-tabs {
    padding: 4px 8px;
    gap: 4px;
  }
  .profile-tabs button {
    padding: 8px 12px;
    font-size: 0.75rem;
  }
  .favorites-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .fav-card {
    border-radius: var(--r-md);
  }
  .fav-image-wrapper {
    aspect-ratio: 4/3;
  }
  .fav-info {
    padding: 10px;
  }
  .fav-name {
    font-size: 0.8125rem;
  }
  .fav-location {
    font-size: 0.7rem;
  }
  .models-list {
    gap: 10px;
  }
  .model-card {
    padding: 12px;
    gap: 12px;
  }
  .model-thumb {
    width: 48px;
    height: 48px;
  }
  .model-info h4 {
    font-size: 0.875rem;
  }
  .model-info p {
    font-size: 0.7rem;
  }
  .quiz-history-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .quiz-card {
    padding: 14px;
  }
  .quiz-card h4 {
    font-size: 0.875rem;
  }
  .quiz-meta {
    font-size: 0.7rem;
  }
  .achievements-card {
    padding: 16px;
  }
  .achievements-card h3 {
    font-size: 0.8125rem;
    margin-bottom: 12px;
  }
  .achievement-item {
    padding: 10px;
    gap: 10px;
    min-height: 48px;
  }
  .achievement-icon-wrapper {
    width: 36px;
    height: 36px;
  }
  .achievement-icon-emoji {
    font-size: 1.25rem;
  }
  .achievement-name {
    font-size: 0.75rem;
  }
  .achievement-date {
    font-size: 0.625rem;
  }
  /* 表单适配 */
  .form-row {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .form-group {
    margin-bottom: 14px;
  }
  .form-group label {
    font-size: 0.75rem;
  }
  .radio-group {
    gap: 8px;
  }
  .radio-option {
    padding: 10px 12px;
    gap: 8px;
  }
  .location-selector {
    flex-direction: column;
    gap: 10px;
  }
  .visibility-option {
    padding: 14px 16px;
  }
  .option-content {
    gap: 12px;
  }
  .option-icon {
    width: 40px;
    height: 40px;
  }
  .option-title {
    font-size: 0.875rem;
  }
  .option-desc {
    font-size: 0.7rem;
  }
  .toggle-option {
    padding: 12px 14px;
  }
  .toggle-label {
    font-size: 0.8125rem;
  }
  .toggle-hint {
    font-size: 0.7rem;
  }
}

/* 超小屏 (最大360px) */
@media screen and (max-width: 360px) {
  .profile-avatar {
    width: 70px;
    height: 70px;
  }
  .profile-card h2 {
    font-size: 1rem;
  }
  .profile-stats {
    gap: 4px;
  }
  .stat-box {
    padding: 8px 2px;
    min-height: 48px;
  }
  .stat-box strong {
    font-size: 0.875rem;
  }
  .profile-tabs button {
    padding: 6px 8px;
    font-size: 0.7rem;
  }
}

</style>
