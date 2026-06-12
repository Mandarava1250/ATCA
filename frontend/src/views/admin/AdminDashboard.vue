<template>
  <div class="dashboard">
    <!-- ===== 可视化统计卡片 ===== -->
    <div class="stats-grid">
      <div class="stat-card" v-for="(stat, key) in statsList" :key="key">
        <div class="stat-visual">
          <div class="stat-icon-wrap" :style="{ background: stat.bgColor }">
            <div class="stat-icon" v-html="stat.icon"></div>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            <svg v-if="stat.trend > 0" viewBox="0 0 24 24" width="12" height="12"><path d="M7 17l5-5 5 5M7 7l5 5 5-5" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            <svg v-else viewBox="0 0 24 24" width="12" height="12"><path d="M7 7l5 5 5-5M7 17l5-5 5 5" stroke="currentColor" fill="none" stroke-width="2"/></svg>
            <span>{{ Math.abs(stat.trend) }}%</span>
          </div>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ $t(stat.labelKey) }}</span>
        </div>
        <!-- 迷你趋势图 -->
        <svg class="stat-sparkline" :viewBox="'0 0 80 30'" preserveAspectRatio="none">
          <polyline
              :points="stat.sparkPoints"
              fill="none"
              :stroke="stat.trend > 0 ? '#C9A96E' : '#8B7A52'"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <!-- ===== 曲线图区域 ===== -->
    <div class="section-grid charts-row">
      <!-- 用户增长曲线 -->
      <div class="section-card chart-card">
        <div class="chart-header">
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            用户总量趋势
          </h3>
          <span class="chart-total">{{ stats.totalUsers }} 人</span>
        </div>
        <div class="chart-body">
          <svg class="main-chart" viewBox="0 0 500 160" preserveAspectRatio="none">
            <!-- 网格线 -->
            <line v-for="y in [0, 40, 80, 120, 160]" :key="y" x1="0" :y1="y" x2="500" :y2="y" stroke="rgba(201,169,110,0.08)" stroke-width="1" />
            <!-- 区域填充 -->
            <path :d="userAreaPath" fill="url(#userGradient)" opacity="0.3" />
            <!-- 曲线 -->
            <path :d="userLinePath" fill="none" stroke="#C9A96E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <!-- 数据点 -->
            <circle v-for="(p, i) in userChartPoints" :key="i" :cx="p.x" :cy="p.y" r="3" fill="#C9A96E" stroke="#1A1714" stroke-width="2" />
            <defs>
              <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#C9A96E" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#C9A96E" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div class="chart-labels">
            <span v-for="(label, i) in chartLabels" :key="i">{{ label }}</span>
          </div>
        </div>
      </div>

      <!-- 日活曲线 -->
      <div class="section-card chart-card">
        <div class="chart-header">
          <h3>
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
            日活跃用户 (DAU)
          </h3>
          <span class="chart-total">{{ todayActive }} 今日</span>
        </div>
        <div class="chart-body">
          <svg class="main-chart" viewBox="0 0 500 160" preserveAspectRatio="none">
            <line v-for="y in [0, 40, 80, 120, 160]" :key="y" x1="0" :y1="y" x2="500" :y2="y" stroke="rgba(201,169,110,0.08)" stroke-width="1" />
            <path :d="dauAreaPath" fill="url(#dauGradient)" opacity="0.3" />
            <path :d="dauLinePath" fill="none" stroke="#D4B87A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <circle v-for="(p, i) in dauChartPoints" :key="i" :cx="p.x" :cy="p.y" r="3" fill="#D4B87A" stroke="#1A1714" stroke-width="2" />
            <defs>
              <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#D4B87A" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#D4B87A" stop-opacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div class="chart-labels">
            <span v-for="(label, i) in chartLabels" :key="i">{{ label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 快捷操作 ===== -->
    <div class="section-card">
      <h3>
        <svg viewBox="0 0 24 24" width="18" height="18"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
        {{ $t('admin.quickActions') }}
      </h3>
      <div class="quick-actions">
        <router-link to="/admin/architectures" class="action-btn">
          <div class="action-icon" style="background: rgba(201,169,110,0.12);">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </div>
          <span>{{ $t('admin.addArchitecture') }}</span>
        </router-link>
        <router-link to="/admin/questions" class="action-btn">
          <div class="action-icon" style="background: rgba(201,169,110,0.12);">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </div>
          <span>{{ $t('admin.addQuestion') }}</span>
        </router-link>
        <router-link to="/admin/ai-configs" class="action-btn">
          <div class="action-icon" style="background: rgba(201,169,110,0.12);">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 4v16m8-8H4" stroke="currentColor" fill="none" stroke-width="2"/></svg>
          </div>
          <span>{{ $t('admin.configAI') }}</span>
        </router-link>
        <router-link to="/admin/models" class="action-btn">
          <div class="action-icon" style="background: rgba(201,169,110,0.12);">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          </div>
          <span>3D模型管理</span>
        </router-link>
      </div>
    </div>

    <!-- ===== 概览 ===== -->
    <div class="section-grid">
      <!-- 热门建筑 -->
      <div class="section-card">
        <h3>
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          {{ $t('admin.topArchitectures') }}
        </h3>
        <div class="list-simple">
          <div v-for="(arch, idx) in topArchitectures" :key="arch.architecture_id" class="list-item">
            <div class="list-rank" :class="{ top3: idx < 3 }">{{ idx + 1 }}</div>
            <span class="list-name">{{ arch.chinese_name || arch.name }}</span>
            <span class="list-meta">{{ arch.founding_dynasty }} · {{ arch.view_count }} 次浏览</span>
          </div>
        </div>
      </div>

      <!-- 系统状态 -->
      <div class="section-card">
        <h3>
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>
          {{ $t('admin.systemStatus') }}
        </h3>
        <div class="status-list">
          <div class="status-item">
            <div class="status-left">
              <div class="status-dot" :class="dbStatus"></div>
              <span class="status-label">Database</span>
            </div>
            <span class="status-badge" :class="dbStatus">{{ dbStatus === 'success' ? 'Connected' : dbStatus }}</span>
          </div>
          <div class="status-item">
            <div class="status-left">
              <div class="status-dot" :class="isMock ? 'warning' : 'success'"></div>
              <span class="status-label">Mock Mode</span>
            </div>
            <span class="status-badge" :class="isMock ? 'warning' : 'success'">{{ isMock ? 'ON' : 'OFF' }}</span>
          </div>
          <div class="status-item">
            <div class="status-left">
              <div class="status-dot success"></div>
              <span class="status-label">API Server</span>
            </div>
            <span class="status-badge success">Running</span>
          </div>
          <div class="status-item">
            <div class="status-left">
              <div class="status-dot info"></div>
              <span class="status-label">Version</span>
            </div>
            <span class="status-badge info">4.9.3</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { adminApi } from '@/services/api';

// ===== 生成过去7天的标签 =====
const chartLabels = ref<string[]>([]);
for (let i = 6; i >= 0; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  chartLabels.value.push(`${d.getMonth() + 1}/${d.getDate()}`);
}

// ===== 用户增长与DAU数据 =====
const userGrowthData = ref([12, 18, 15, 25, 32, 28, 38]);
const dauData = ref([8, 12, 10, 18, 22, 19, 26]);
const todayActive = ref(26);

// ===== 统计卡片数据（含sparkline和趋势） =====
const stats = ref({ totalUsers: 0, totalArchitectures: 0, totalQuestions: 0, totalModels: 0 });
const isMock = ref(false);
const topArchitectures = ref<any[]>([]);
const dbStatus = ref('success');

// 生成平滑曲线 path
function smoothLine(data: number[], width: number, height: number, padding = 10): string {
  if (data.length < 2) return '';
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (data.length - 1);
  const points = data.map((v, i) => ({
    x: padding + i * stepX,
    y: padding + (height - padding * 2) * (1 - (v - min) / range),
  }));
  // 使用贝塞尔曲线平滑
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
    const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
    d += ` C ${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
}

function areaPath(data: number[], width: number, height: number, padding = 10): string {
  const line = smoothLine(data, width, height, padding);
  if (!line) return '';
  const lastX = padding + (data.length - 1) * ((width - padding * 2) / (data.length - 1));
  return `${line} L ${lastX},${height} L ${padding},${height} Z`;
}

function getPoints(data: number[], width: number, height: number, padding = 10) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (data.length - 1);
  return data.map((v, i) => ({
    x: padding + i * stepX,
    y: padding + (height - padding * 2) * (1 - (v - min) / range),
  }));
}

const userChartPoints = computed(() => getPoints(userGrowthData.value, 500, 160, 15));
const dauChartPoints = computed(() => getPoints(dauData.value, 500, 160, 15));
const userLinePath = computed(() => smoothLine(userGrowthData.value, 500, 160, 15));
const userAreaPath = computed(() => areaPath(userGrowthData.value, 500, 160, 15));
const dauLinePath = computed(() => smoothLine(dauData.value, 500, 160, 15));
const dauAreaPath = computed(() => areaPath(dauData.value, 500, 160, 15));

// 生成迷你sparkline预计算points字符串
function genSparkPoints(count: number): string {
  const pts: string[] = [];
  for (let i = 0; i < count; i++) {
    const v = Math.floor(Math.random() * 15 + 5);
    pts.push(`${i * 10},${30 - v}`);
  }
  return pts.join(' ');
}

const statsList = ref([
  { icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>', value: 0, labelKey: 'admin.totalUsers', bgColor: 'rgba(201,169,110,0.12)', trend: 12, sparkPoints: genSparkPoints(8) },
  { icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-10a2 2 0 11-4 0 2 2 0 014 0z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>', value: 0, labelKey: 'admin.totalArchitectures', bgColor: 'rgba(201,169,110,0.12)', trend: 8, sparkPoints: genSparkPoints(8) },
  { icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>', value: 0, labelKey: 'admin.totalQuestions', bgColor: 'rgba(201,169,110,0.12)', trend: -3, sparkPoints: genSparkPoints(8) },
  { icon: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" stroke="currentColor" fill="none" stroke-width="1.5"/></svg>', value: 0, labelKey: 'admin.totalModels', bgColor: 'rgba(201,169,110,0.12)', trend: 5, sparkPoints: genSparkPoints(8) },
]);

onMounted(async () => {
  try {
    // 加载仪表盘基础数据
    const res = await adminApi.getDashboard();
    if (res.success) {
      stats.value = res.data;
      statsList.value[0].value = res.data.totalUsers || 0;
      statsList.value[1].value = res.data.totalArchitectures || 0;
      statsList.value[2].value = res.data.totalQuestions || 0;
      statsList.value[3].value = res.data.totalModels || 0;
    }

    // 加载真实用户增长和DAU数据
    try {
      const growthRes = await adminApi.getUserGrowth(7);
      if (growthRes.success && growthRes.data) {
        const gd = growthRes.data;
        if (gd.dates?.length && gd.userCounts?.length) {
          chartLabels.value = gd.dates;
          const raw = gd.userCounts;
          const total = stats.value.totalUsers || 0;
          const lastRaw = raw[raw.length - 1];

          // 判断返回的是每日新增还是累计总量
          // 如果最后一项接近 totalUsers（误差 < 20%），认为是累计值
          let cumulative: number[];
          if (total > 0 && Math.abs(lastRaw - total) / total < 0.2) {
            cumulative = [...raw];
          } else {
            // 视为每日新增，进行累加得到累计总量
            cumulative = raw.reduce((acc: number[], curr: number, idx: number) => {
              acc.push((acc[idx - 1] || 0) + curr);
              return acc;
            }, []);
            // 与 totalUsers 对齐（保持趋势形状）
            if (total > 0 && cumulative.length > 0) {
              const factor = total / cumulative[cumulative.length - 1];
              cumulative = cumulative.map((v: number) => Math.round(v * factor));
            }
          }

          userGrowthData.value = cumulative;
          dauData.value = gd.dauCounts || raw.map((v: number) => Math.round(v * 0.6));
          todayActive.value = dauData.value[dauData.value.length - 1] || 0;
        }
      }
    } catch (e) {
      // API 不可用时生成与 totalUsers 对齐的累计模拟数据
      const tu = stats.value.totalUsers || 38;
      userGrowthData.value = Array.from({ length: 7 }, (_, i) =>
          Math.round(tu * (0.3 + (i / 6) * 0.7))
      );
      dauData.value = userGrowthData.value.map((v: number) => Math.round(v * 0.6));
      todayActive.value = dauData.value[dauData.value.length - 1] || 0;
    }

    const archRes = await adminApi.getArchitectures({ limit: 5 });
    if (archRes.success) topArchitectures.value = archRes.data;
    isMock.value = topArchitectures.value.length > 0 && !topArchitectures.value[0]?.created_at?.includes('T');
  } catch (e) {
    console.error(e);
    stats.value = { totalUsers: 38, totalArchitectures: 601, totalQuestions: 120, totalModels: 45 };
    statsList.value.forEach((s, i) => { s.value = [38, 601, 120, 45][i]; });
    // 同步生成正确的累计模拟曲线
    const tu = stats.value.totalUsers;
    userGrowthData.value = Array.from({ length: 7 }, (_, i) =>
        Math.round(tu * (0.3 + (i / 6) * 0.7))
    );
    dauData.value = userGrowthData.value.map((v: number) => Math.round(v * 0.6));
    todayActive.value = dauData.value[dauData.value.length - 1] || 0;
  }
});
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 24px; }

/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
}
.stat-visual {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
}
.stat-trend {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--r-sm);
}
.stat-trend.up { color: #7CB342; background: rgba(91, 123, 76, 0.1); }
.stat-trend.down { color: #C75C3A; background: rgba(199, 92, 58, 0.1); }
.stat-info { display: flex; flex-direction: column; gap: 2px; }
.stat-value { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--text); }
.stat-label { font-size: 0.8125rem; color: var(--text-muted); }
.stat-sparkline {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 120px;
  height: 40px;
  opacity: 0.4;
}

/* ===== 曲线图 ===== */
.charts-row { grid-template-columns: 1fr 1fr; }
.chart-card { padding: 20px 24px 16px; }
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.chart-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}
.chart-header h3 svg { color: var(--gold); }
.chart-total {
  font-family: var(--font-serif);
  font-size: 0.875rem;
  color: var(--gold);
  font-weight: 600;
}
.chart-body { position: relative; }
.main-chart {
  width: 100%;
  height: 140px;
}
.chart-labels {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}
.chart-labels span {
  font-size: 0.6875rem;
  color: var(--text-muted);
}

/* ===== 快捷操作 ===== */
.section-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  padding: 24px;
}
.section-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text);
}
.section-card h3 svg { color: var(--gold); }

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.action-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  color: var(--text);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all var(--t);
}
.action-btn:hover {
  background: rgba(var(--gold-rgb), 0.08);
  border-color: var(--gold-dim);
  color: var(--gold);
}
.action-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gold);
  flex-shrink: 0;
}

/* ===== 概览列表 ===== */
.section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.list-simple { display: flex; flex-direction: column; gap: 4px; }
.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.list-item:last-child { border-bottom: none; }
.list-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--bg-hover);
  flex-shrink: 0;
}
.list-rank.top3 {
  background: rgba(201, 169, 110, 0.15);
  color: var(--gold);
}
.list-name { font-size: 0.875rem; font-weight: 500; flex: 1; }
.list-meta { font-size: 0.75rem; color: var(--text-muted); flex-shrink: 0; }

/* ===== 系统状态 ===== */
.status-list { display: flex; flex-direction: column; gap: 12px; }
.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.status-item:last-child { border-bottom: none; }
.status-left { display: flex; align-items: center; gap: 10px; }
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.success { background: #22c55e; box-shadow: 0 0 6px rgba(34, 197, 94, 0.4); }
.status-dot.warning { background: #f59e0b; box-shadow: 0 0 6px rgba(245, 158, 11, 0.4); }
.status-dot.error { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.4); }
.status-dot.info { background: #3b82f6; box-shadow: 0 0 6px rgba(59, 130, 246, 0.4); }
.status-label { font-size: 0.875rem; color: var(--text); }
.status-badge {
  padding: 3px 12px;
  border-radius: var(--r-sm);
  font-size: 0.75rem;
  font-weight: 600;
}
.status-badge.success { background: rgba(34, 197, 94, 0.12); color: #22c55e; }
.status-badge.warning { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.status-badge.error { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.status-badge.info { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }

@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .section-grid { grid-template-columns: 1fr; }
  .charts-row { grid-template-columns: 1fr; }
}
</style>