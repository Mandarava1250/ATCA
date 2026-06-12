<template>
  <div class="map-fullscreen" ref="pageRef">
    <!-- 返回按钮 -->
    <button v-if="currentLevel > 1" class="map-btn back-btn" @click="goBack">
      {{ backBtnText }}
    </button>
    <button v-else class="map-btn home-btn" @click="router.push('/architecture')">
      返回列表
    </button>

    <!-- 指南 -->
    <div class="guide-container">
      <button class="guide-toggle-btn" @click="toggleGuide">
        {{ showGuide ? '关闭指南' : '查看指南' }}
      </button>
      <div v-if="showGuide" class="guide-content">
        <p>点击[建筑种类筛选]查看不同种类建筑所在点位</p>
        <p>点击省份或城市查看地方建筑详情</p>
        <p>南海诸岛是我国不可分割的领土！点击[海南省]查看南海诸岛详情</p>
        <p>地图来源：阿里云 DataV 平台 审图号：GS(2021)6375号</p>
        <p>鼠标滚轮可缩放地图，按住左键可拖动</p>
      </div>
    </div>

    <!-- 标题 -->
    <div class="title-box">
      <h1>{{ mapTitle }}</h1>
    </div>

    <!-- 提示信息 -->
    <div class="toast" :class="{ show: toastVisible }" :style="toastStyle">{{ toastMsg }}</div>

    <!-- 建筑列表面板 -->
    <div v-show="currentLevel > 1" class="building-list-panel">
      <div class="list-header">{{ listTitle }}</div>
      <div class="list-content">
        <div v-if="filteredBuildings.length === 0" style="text-align:center; color:#8c8275; margin-top:20px;">当前暂无收录</div>
        <div v-for="item in filteredBuildings" :key="item.name" class="building-item" :style="item.name === locatedBuildingName ? { borderColor: '#d2b07c', boxShadow: '0 0 10px rgba(210,176,124,0.3)' } : {}" @click="navigateToDetail(item)">
          <div class="building-name">{{ item.name }}</div>
          <div class="locate-btn" @click.stop="locateBuildingOnMap(item)">定位</div>
        </div>
      </div>
    </div>

    <!-- 省份概志面板（精简版：无营建大家） -->
    <div v-show="showProvinceInfo" class="province-info-panel">
      <div class="list-header">{{ currentProvince }}概志</div>
      <div class="list-content">
        <section class="info-section">
          <h3>◈ 历史沿革</h3>
          <p>{{ provinceHistory }}</p>
        </section>
        <section class="info-section">
          <h3>◈ 建筑华章</h3>
          <p>{{ provinceArchHistory }}</p>
        </section>
      </div>
    </div>

    <!-- 统计按钮 -->
    <button v-show="currentLevel === 1" class="stats-btn" @click="openStatsPage">省份建筑统计</button>

    <!-- ECharts 地图容器 -->
    <div ref="chartRef" class="china-map-container"></div>

    <!-- 分类状态标签 -->
    <div class="category-status-tag">
      <span class="status-dot" :style="{ background: currentCategoryColor }"></span>
      <span class="status-text">{{ currentCategoryDisplay }}</span>
    </div>

    <!-- 分类面板 -->
    <div class="category-panel">
      <div v-show="categoryMenuOpen" class="category-list">
        <div v-for="cat in categoryList" :key="cat.name" :class="['cat-item', { active: currentCategory === cat.name }]" @click="manualFilter(cat.name)">
          <span class="cat-dot" :style="{ background: cat.color }"></span>{{ cat.name }}
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="dynamic-toggle-btn" @click="toggleDynamicMode">
          {{ isDynamicMode ? '模式：自动播放' : '模式：静态展示' }}
        </button>
        <div class="category-btn" @click="toggleCategoryMenu">建筑种类筛选</div>
      </div>
    </div>

    <!-- 统计页面 -->
    <div v-show="statsPageOpen" class="stats-page">
      <div class="stats-header">
        <h2>各省份古建筑收录数量统计</h2>
        <button class="stats-back-btn" @click="closeStatsPage">返回地图</button>
      </div>
      <div class="stats-main-content">
        <div ref="statsChartRef" class="stats-chart-container"></div>
        <div class="stats-info-card">
          <h3>数据解读</h3>
          <div class="stats-scroll-text">
            <p>华夏古建筑的空间分布呈现出鲜明的地域集群特征，其分布格局与中国古代政治经济重心变迁、地理气候环境、千年文化传承脉络深度耦合，完整复刻了中华千年文明的时空演进轨迹。</p>
            <p>核心分布呈现 "三极引领、梯队递进" 态势。浙江以 61 处的数量领跑全国，成为古建数字化收录的核心阵地；江苏（53 处）与山西（52 处）紧随其后，形成江南华东、中原华北南北双核心支撑格局。</p>
            <p>浙江、江苏自古便是千年江南富庶腹地，自魏晋衣冠南渡起，就长期作为全国经济、文化、财税中心，两宋之后更是稳居华夏经济龙头。繁华的市井商贾、世家大族林立、崇文重匠的地域风气，催生了大量精美的民居大宅、宗族祠堂、书院会馆、官邸园林，温润湿润的江南气候也极大延缓了木构建筑腐朽损毁，让大量明清古建完好留存至今。苏州、杭州、宁波、金华等城市，更是中式江南古建形制的集大成之地。</p>
            <p>山西被誉为 "地上文物看山西"，作为北魏、大唐龙兴之地，长期处于中原王朝边防核心地带，战乱破坏远少于中原腹地，高原干燥少雨的气候完美保存木构古建。境内太原、大同、晋中等地，留存了许多木构古建筑，从辽金古寺到晋商大院，构筑了华夏北方古建不可替代的历史宝库。</p>
            <p>区域分化凸显 "东密西疏、南北分层" 的宏观分布格局。四川（40 处）、福建（38 处）、河北（37 处）构成全国第二梯队，古建分布顺势向西南巴蜀盆地、东南闽粤丘陵、北方京畿关隘地带延伸。</p>
            <p>河北紧邻古都北京，作为元、明、清三朝京畿腹地，保定、承德、正定等城市长期承担皇家行宫、王府衙署、驿道关隘营建职能，官式古建规格极高、留存体量庞大；</p>
            <p>四川成都平原自古沃野千里，巴蜀政权千年安稳发展，少受中原战乱波及，成都、阆中等地保留了大量巴蜀特色宅院、官署古建；福建依山傍海，宗族文化根深蒂固，土楼、古厝、书院遍布全省，形成独树一帜的东南沿海古建体系。</p>
            <p>而西北、东北、边疆省份古建数量显著偏低，一方面源于古代长期人口稀疏、营建活动有限，木材资源分布不均；另一方面历代边疆战乱更迭频繁、战火损毁严重，加上高寒干旱、风沙侵蚀的自然环境，极大影响了古建筑长期保存，完美契合古代中国 "由北向南、由东向西" 的人口迁徙、经济重心南移的历史轨迹，深刻印证古建筑作为文明载体，与人类活动、自然地理环境千年共生、相伴演进的底层逻辑。</p>
            <p>数据背后是千年营造智慧的时空凝练。各省数量差异的背后，是中华匠人因地制宜、顺势天人的营造哲学：北方山西、河北、北京古建筑，侧重墙体厚重、结构稳固，适配北方寒冷干燥气候，兼顾边塞防御御寒需求；江南江浙古建轻盈精巧、飞檐通透，适配南方多雨潮湿环境，兼顾通风防潮、排水防晒；巴蜀、闽地古建依山就势、错落布局，完美适配山地丘陵地形。而本次统计纳入的宗教类古建筑，更是跨越南北地域，见证佛教、道教文化与中式营造深度融合，印证了千年信仰文化，深刻塑造了中国古建筑的形制美学与空间格局。这份全国古建分布统计图谱，不只是各省古建筑数量的客观盘点，更是华夏千年天人合一营造理念、代代相传工匠精神的数字化定格，为中华古建文化解码、永续传承与数字化保护，筑牢了扎实的数据根基与历史脉络支撑。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { architectureApi } from '@/services/api';

const router = useRouter();

// ============================================
// 数据定义
// ============================================

// ECharts 实例
let chart: any = null;
let statsChart: any = null;

// 地图层级 1=全国 2=省 3=市
const currentLevel = ref(1);
const currentProvince = ref('');
const currentCity = ref('');
const provinceGeoJson = ref<any>(null);
const locatedBuildingName = ref<string | null>(null);
const backBtnText = computed(() => {
  if (currentLevel.value === 3) return `返回${currentProvince.value}`;
  return '返回主地图';
});

// 建筑分类（从数据库加载）
const CATEGORY_RULES = ref<Array<{ name: string; color: string; keywords: string[] }>>([]);
const categoryColors = ['#a6514d', '#c29b5a', '#7a8a71', '#5e7d8a', '#8c8275', '#6b8e9f', '#9b8579', '#7a9b7a'];

const categoryList = computed(() => [
  { name: '全部', color: '#d2b07c' },
  ...CATEGORY_RULES.value
]);
const currentCategory = ref('全部');
const categoryMenuOpen = ref(false);
const isDynamicMode = ref(false);
let autoCycleTimer: ReturnType<typeof setInterval> | null = null;
let cycleIndex = 0;

// 提示
const toastVisible = ref(false);
const toastMsg = ref('');
const toastStyle = ref({});
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// 指南
const showGuide = ref(false);

// 统计数据
const ancientBuildings = ref<any[]>([]);
const currentProvinceData = ref<any[]>([]);
const currentCityData = ref<any[]>([]);
const filteredBuildings = ref<any[]>([]);

// 省份概志
const showProvinceInfo = ref(false);
const provinceHistory = ref('');
const provinceArchHistory = ref('');

// 统计页面
const statsPageOpen = ref(false);
const statsChartRef = ref<HTMLDivElement>();

// 地图标题
const mapTitle = ref('中国古代建筑时空分布全景图');

// 列表标题
const listTitle = computed(() => {
  const area = currentLevel.value === 2 ? currentProvince.value : currentLevel.value === 3 ? currentCity.value : '';
  return `${area} (${filteredBuildings.value.length})`;
});

// 当前分类颜色
const currentCategoryColor = computed(() => {
  const cat = CATEGORY_RULES.value.find(c => c.name === currentCategory.value);
  return cat ? cat.color : '#d2b07c';
});
const currentCategoryDisplay = computed(() => {
  return currentCategory.value === '全部' ? '全部建筑' : currentCategory.value;
});

// 图表引用
const chartRef = ref<HTMLDivElement>();
const pageRef = ref<HTMLDivElement>();

// 地图GeoJSON数据
const nationalGeoJson = ref<any>(null);

// 省份拼音映射
const provincePinyin: Record<string, string> = {
  '北京': 'beijing', '天津': 'tianjin', '河北': 'hebei', '山西': 'shanxi', '内蒙古': 'neimenggu',
  '辽宁': 'liaoning', '吉林': 'jilin', '黑龙江': 'heilongjiang', '上海': 'shanghai', '江苏': 'jiangsu',
  '浙江': 'zhejiang', '安徽': 'anhui', '福建': 'fujian', '江西': 'jiangxi', '山东': 'shandong',
  '河南': 'henan', '湖北': 'hubei', '湖南': 'hunan', '广东': 'guangdong', '广西': 'guangxi',
  '海南': 'hainan', '重庆': 'chongqing', '四川': 'sichuan', '贵州': 'guizhou', '云南': 'yunnan',
  '西藏': 'xizang', '陕西': 'shanxi1', '甘肃': 'gansu', '青海': 'qinghai', '宁夏': 'ningxia',
  '新疆': 'xinjiang', '台湾': 'taiwan', '香港': 'xianggang', '澳门': 'aomen'
};

// 点-in-多边形判断（射线法）
function isPointInPolygon(point: number[], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// 判断点是否在MultiPolygon或Polygon中
function isPointInGeoJsonGeometry(point: number[], geometry: any): boolean {
  if (!geometry || !geometry.coordinates) return false;
  
  if (geometry.type === 'Polygon') {
    // Polygon: 第一个环是外部边界，其余是内部洞
    const outerRing = geometry.coordinates[0];
    if (!isPointInPolygon(point, outerRing)) return false;
    // 检查是否在洞内
    for (let i = 1; i < geometry.coordinates.length; i++) {
      if (isPointInPolygon(point, geometry.coordinates[i])) {
        return false;
      }
    }
    return true;
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      if (isPointInGeoJsonGeometry(point, { type: 'Polygon', coordinates: polygon })) {
        return true;
      }
    }
    return false;
  }
  return false;
}

// 标准化省份名称（去除省、市、自治区等后缀）
function normalizeProvinceName(name: string): string {
  if (!name) return '';
  return name.replace(/省|市|自治区|特别行政区/g, '');
}

// 根据全国GeoJSON精确判断点所属的省份
function getProvinceByGeoJson(lng: number, lat: number): string | null {
  if (!nationalGeoJson.value || !nationalGeoJson.value.features) return null;
  
  const point: [number, number] = [lng, lat];
  
  for (const feature of nationalGeoJson.value.features) {
    let provinceName = feature.properties?.name || feature.properties?.NAME;
    if (!provinceName) continue;
    
    // 标准化省份名称
    provinceName = normalizeProvinceName(provinceName);
    
    if (isPointInGeoJsonGeometry(point, feature.geometry)) {
      return provinceName;
    }
  }
  
  return null;
}

// 计算GeoJSON多边形的大致面积（用于判断区域大小）
function calculateGeoJsonArea(geometry: any): number {
  if (!geometry) return 0;
  
  let totalArea = 0;
  
  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates[0];
    totalArea = calculatePolygonArea(ring);
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      totalArea += calculateGeoJsonArea({ type: 'Polygon', coordinates: polygon });
    }
  }
  
  return totalArea;
}

// 计算单个多边形的大致面积（基于经纬度）
function calculatePolygonArea(ring: [number, number][]): number {
  if (ring.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  
  return Math.abs(area / 2);
}

// 根据GeoJSON数据更新所有建筑的省份归属
function updateBuildingsProvinceByGeoJson() {
  if (!nationalGeoJson.value || ancientBuildings.value.length === 0) return;
  
  console.log('=== 更新建筑省份归属 ===');
  console.log('全国GeoJSON加载状态:', !!nationalGeoJson.value);
  console.log('建筑数量:', ancientBuildings.value.length);
  
  let updatedCount = 0;
  let notFoundCount = 0;
  
  ancientBuildings.value = ancientBuildings.value.map(building => {
    const lng = building.value[0];
    const lat = building.value[1];
    const originalProvince = building.value[3];
    
    // 使用GeoJSON精确判断省份
    const provinceByGeo = getProvinceByGeoJson(lng, lat);
    
    if (provinceByGeo) {
      if (provinceByGeo !== originalProvince) {
        console.log(`建筑 [${building.name}] 省份更新: ${originalProvince} -> ${provinceByGeo} (坐标: ${lng}, ${lat})`);
        updatedCount++;
      }
      // 更新省份信息
      return {
        ...building,
        value: [lng, lat, building.value[2], provinceByGeo]
      };
    } else {
      notFoundCount++;
      console.log(`建筑 [${building.name}] 坐标 (${lng}, ${lat}) 无法匹配到省份，使用原始值: ${originalProvince}`);
    }
    
    return building;
  });
  
  console.log(`更新完成: 共 ${ancientBuildings.value.length} 个建筑, 更新 ${updatedCount} 个, 未匹配 ${notFoundCount} 个`);
}

// 获取省份对应的GeoJSON feature
function getProvinceFeature(provinceName: string): any {
  if (!nationalGeoJson.value || !nationalGeoJson.value.features) return null;
  
  for (const feature of nationalGeoJson.value.features) {
    const name = feature.properties?.name || feature.properties?.NAME;
    if (name && (name === provinceName || name.includes(provinceName) || provinceName.includes(name))) {
      return feature;
    }
  }
  return null;
}

// 主题色
const THEME = {
  point: '#d2b07c',
  highlight: '#ffffff',
  area: '#2c241e',
  border: '#4a3e2e',
  text: '#8c8275',
  emphasis: '#3d332a',
  tooltipBg: 'rgba(22, 20, 18, 0.9)',
};

// ============================================
// 建筑分类
// ============================================

// 获取建筑分类信息
function getBuildingCatInfo(building: { name: string; architecture_type?: string }) {
  // 优先使用建筑的类型字段
  if (building.architecture_type && CATEGORY_RULES.value.length > 0) {
    const matchedCat = CATEGORY_RULES.value.find(cat => 
      cat.name === building.architecture_type
    );
    if (matchedCat) return matchedCat;
  }
  
  // 回退到按名称关键字匹配
  if (CATEGORY_RULES.value.length > 0) {
    for (let i = 0; i < CATEGORY_RULES.value.length; i++) {
      if (CATEGORY_RULES.value[i].keywords.some(k => building.name.includes(k))) {
        return CATEGORY_RULES.value[i];
      }
    }
  }
  
  return { name: '其他', color: '#8c8275', keywords: [] };
}

function getFilteredData(sourceData: any[], applySampling: boolean = true) {
  let safeData = sourceData.filter(b => b && b.value);

  const baseSize = currentLevel.value === 1 ? 5 : (currentLevel.value === 2 ? 8 : 12);

  // 先进行分类过滤
  const filtered = safeData.filter(b => {
    if (currentCategory.value === '全部') return true;
    return getBuildingCatInfo(b).name === currentCategory.value;
  });

  console.log(`=== getFilteredData ===`);
  console.log(`当前级别: ${currentLevel.value}, 当前分类: ${currentCategory.value}`);
  console.log(`原始数据量: ${sourceData.length}, 安全数据量: ${safeData.length}, 分类过滤后: ${filtered.length}`);
  
  // 应用点采样：按省区域智能采样
  let sampledData: any[] = [];
  
  if (applySampling && currentLevel.value === 1) {
    // 全国视图：按省份分组，对面积小且建筑多的省份进行采样
    const buildingsByProvince: Record<string, any[]> = {};
    
    filtered.forEach(building => {
      const province = building.value[3] || '未知';
      if (!buildingsByProvince[province]) {
        buildingsByProvince[province] = [];
      }
      buildingsByProvince[province].push(building);
    });
    
    console.log(`按省份分组结果:`, Object.entries(buildingsByProvince).map(([p, bs]) => `${p}: ${bs.length}个`));
    
    // 对每个省份的建筑进行处理
    for (const [provinceName, buildings] of Object.entries(buildingsByProvince)) {
      const feature = getProvinceFeature(provinceName);
      const area = feature ? calculateGeoJsonArea(feature.geometry) : Infinity;
      
      console.log(`省份 [${provinceName}]: 建筑数=${buildings.length}, 面积=${area}`);
      
      // 判断是否需要采样：面积小且建筑数量多
      // 阈值：面积 < 20（较小省份）且建筑 > 20 个
      const needSampling = area < 20 && buildings.length > 20;
      
      console.log(`  需要采样: ${needSampling}`);
      
      if (needSampling) {
        // 采样：保留约一半（但至少保留5个）
        const sampleCount = Math.max(5, Math.floor(buildings.length / 2));
        sampledData = [...sampledData, ...samplePoints(buildings, sampleCount)];
        console.log(`  采样后保留: ${sampleCount}个`);
      } else {
        // 保留全部
        sampledData = [...sampledData, ...buildings];
      }
    }
    
    console.log(`全国视图最终采样结果: ${sampledData.length}个`);
  } else if (applySampling) {
    // 省/市视图：简单采样
    const maxPoints = currentLevel.value === 2 ? MAX_POINTS_PER_REGION.province : MAX_POINTS_PER_REGION.city;
    sampledData = samplePoints(filtered, maxPoints);
    console.log(`省/市视图采样结果: ${sampledData.length}个 (max: ${maxPoints})`);
  } else {
    sampledData = filtered;
    console.log(`未应用采样，使用全部数据: ${sampledData.length}个`);
  }

  return sampledData.map(b => {
    const cat = getBuildingCatInfo(b);
    if (b.name === locatedBuildingName.value) {
      return {
        ...b, symbolSize: baseSize * 2.5,
        itemStyle: {
          color: cat.color,
          opacity: 0.85,
          shadowBlur: 8,
          shadowColor: 'rgba(0,0,0,0.6)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 0.5
        },
        label: { show: false, formatter: '{b}', position: 'top', color: THEME.highlight, fontSize: 16, fontWeight: 'bold', textBorderColor: '#000', textBorderWidth: 2 }
      };
    }
    return {
      ...b, symbolSize: baseSize,
      itemStyle: { color: cat.color, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' },
      label: { show: false }
    };
  });
}

// ============================================
// 提示
// ============================================

function showToast(msg: string, type: 'warning' | 'info' = 'info') {
  toastMsg.value = msg;
  toastStyle.value = {
    background: type === 'warning' ? '#8b0000' : 'rgba(30, 25, 20, 0.95)',
    opacity: 1
  };
  toastVisible.value = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastVisible.value = false; }, 2500);
}

// ============================================
// 指南
// ============================================

function toggleGuide() {
  showGuide.value = !showGuide.value;
}

// ============================================
// 分类筛选
// ============================================

function toggleCategoryMenu() {
  categoryMenuOpen.value = !categoryMenuOpen.value;
}

function manualFilter(catName: string) {
  stopAutoCycle();
  executeFilter(catName);
}

function executeFilter(catName: string) {
  currentCategory.value = catName;
  refreshMapData();
}

function toggleDynamicMode() {
  if (isDynamicMode.value) stopAutoCycle();
  else startAutoCycle();
}

function startAutoCycle() {
  if (autoCycleTimer) clearInterval(autoCycleTimer);
  isDynamicMode.value = true;
  const cycleList = ['全部', ...CATEGORY_RULES.value.map(r => r.name)];
  autoCycleTimer = setInterval(() => {
    cycleIndex = (cycleIndex + 1) % cycleList.length;
    executeFilter(cycleList[cycleIndex]);
  }, 3000);
}

function stopAutoCycle() {
  if (autoCycleTimer) clearInterval(autoCycleTimer);
  isDynamicMode.value = false;
}

// ============================================
// 地图渲染
// ============================================

const tooltipConfig = {
  trigger: 'item',
  backgroundColor: THEME.tooltipBg,
  borderColor: THEME.point,
  textStyle: { color: '#f4ecd8' },
  formatter: function (params: any) {
    if (params.seriesType === 'effectScatter' && params.data && params.data.value) {
      const cat = getBuildingCatInfo({ name: params.data.name, architecture_type: params.data.architecture_type });
      return `<strong style="font-size:16px;color:${cat.color};">${params.data.name}</strong><br>种类: ${cat.name}<br>地域: ${params.data.value[3] || '未知'}<br>朝代: ${params.data.value[2] || '未知'}`;
    }
    return params.name;
  }
};

function initMap() {
  if (!chartRef.value) return;
  if (!(window as any).echarts) {
    setTimeout(initMap, 200);
    return;
  }
  if (chart) return;
  chart = (window as any).echarts.init(chartRef.value);
  fetch('/map-data/china.json')
      .then(res => res.json())
      .then(geoJson => {
        nationalGeoJson.value = geoJson;
        (window as any).echarts.registerMap('china', geoJson);
        // 有了GeoJSON数据后，重新确定建筑的省份归属
        updateBuildingsProvinceByGeoJson();
        renderNationalMap();
      })
      .catch(err => {
        console.error('地图数据加载失败:', err);
        showToast('地图档案调阅失败，请检查网络或文件路径', 'warning');
      });

  chart.on('click', (params: any) => {
    if (currentLevel.value === 1 && params.componentType === 'geo') {
      const shortName = getShortName(params.name);
      renderProvinceMap(shortName);
    } else if (currentLevel.value === 2) {
      if (params.seriesType === 'effectScatter') {
        navigateToDetail(params.data);
      } else if (params.componentType === 'geo') {
        if (cityHasBuilding(params.name)) {
          renderCityMap(params.name);
        } else {
          showToast(`暂未收录【${params.name}】的建筑信息。`, 'warning');
        }
      }
    } else if (currentLevel.value === 3) {
      if (params.seriesType === 'effectScatter') {
        navigateToDetail(params.data);
      }
    }
  });

  window.addEventListener('resize', handleResize);
}

function handleResize() {
  chart && chart.resize();
  statsChart && statsChart.resize();
}

function renderNationalMap() {
  currentLevel.value = 1;
  locatedBuildingName.value = null;
  mapTitle.value = '中国古代建筑时空分布全景图';
  showProvinceInfo.value = false;

  console.log(`=== renderNationalMap ===`);
  console.log(`ancientBuildings 数据长度: ${ancientBuildings.value.length}`);
  console.log(`ancientBuildings 数据示例:`, ancientBuildings.value[0]);
  
  const chartData = getFilteredData(ancientBuildings.value);
  
  console.log(`过滤后数据长度: ${chartData.length}`);
  console.log(`过滤后数据示例:`, chartData[0]);
  
  // 验证坐标范围
  const invalidCoords = chartData.filter(d => {
    if (!d.value || !Array.isArray(d.value)) return true;
    const [lng, lat] = d.value;
    return lng < 73 || lng > 135 || lat < 18 || lat > 54;
  });
  console.log(`坐标超出中国范围的数据: ${invalidCoords.length}个`, invalidCoords);
  
  // 检查是否有有效坐标
  const validData = chartData.filter(d => d.value && Array.isArray(d.value) && d.value[0] && d.value[1]);
  console.log(`有效坐标数据: ${validData.length}个`);
  
  if (validData.length === 0) {
    console.error('ERROR: 没有有效坐标数据！');
    showToast('暂无有效建筑坐标数据', 'warning');
  }
  
  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: tooltipConfig,
    geo: {
      map: 'china', 
      roam: true, 
      zoom: 1.6, 
      center: [104.5, 36.8],
      label: { show: true, color: THEME.text, fontSize: 11 },
      itemStyle: { areaColor: THEME.area, borderColor: THEME.border, borderWidth: 1 },
      emphasis: { itemStyle: { areaColor: THEME.emphasis }, label: { show: true, color: THEME.point, fontWeight: 'bold' } }
    },
    series: [{ 
      name: '古建筑', 
      type: 'effectScatter', 
      coordinateSystem: 'geo', 
      data: validData,
      // 确保光点可见
      symbolSize: 8,
      itemStyle: {
        color: '#C9A96E',
        opacity: 0.9,
        shadowBlur: 15,
        shadowColor: 'rgba(201, 169, 110, 0.6)'
      },
      effectType: 'ripple',
      rippleEffect: {
        period: 3,
        scale: 4,
        brushType: 'fill'
      }
    }]
  }, true);
  
  console.log(`ECharts 配置已设置，使用 ${validData.length} 个有效数据点`);
}

function renderProvinceMap(provinceName: string) {
  const pinyin = provincePinyin[provinceName];
  if (!pinyin) return;
  chart.showLoading({
    text: `正在调阅 ${provinceName} 卷宗...`,
    color: THEME.point, textColor: '#f4ecd8', maskColor: 'rgba(22, 20, 18, 0.8)'
  });
  fetch(`https://fastly.jsdelivr.net/gh/apache/echarts@4.9.0/map/json/province/${pinyin}.json`)
      .then(res => res.json())
      .then(geoJson => {
        chart.hideLoading();
        provinceGeoJson.value = geoJson;
        (window as any).echarts.registerMap(provinceName, geoJson);
        currentProvinceData.value = ancientBuildings.value.filter((item: any) => {
          if (!item.value[3]) return false;
          const buildingProvince = normalizeProvinceName(item.value[3]);
          const targetProvince = normalizeProvinceName(provinceName);
          const match = buildingProvince.includes(targetProvince) || targetProvince.includes(buildingProvince);
          if (match) {
            console.log(`建筑 [${item.name}] 匹配 ${provinceName}: 坐标(${item.value[0]}, ${item.value[1]}), 省份: ${item.value[3]}`);
          }
          return match;
        });
        console.log(`=== ${provinceName} 建筑分布 ===`);
        console.log('原始建筑总数:', ancientBuildings.value.length);
        console.log('匹配到的建筑数:', currentProvinceData.value.length);
        console.log('匹配的建筑详情:', currentProvinceData.value.map(b => ({ name: b.name, lng: b.value[0], lat: b.value[1], province: b.value[3] })));
        
        // 验证坐标是否在当前省份范围内
        if (provinceGeoJson.value && provinceGeoJson.value.features && provinceGeoJson.value.features.length > 0) {
          const provinceFeature = provinceGeoJson.value.features[0];
          currentProvinceData.value.forEach(building => {
            const point = [building.value[0], building.value[1]];
            const isInside = isPointInGeoJsonGeometry(point, provinceFeature.geometry);
            console.log(`建筑 [${building.name}] 坐标(${building.value[0]}, ${building.value[1]}) 是否在 ${provinceName} 范围内: ${isInside}`);
          });
        }
        currentLevel.value = 2;
        currentProvince.value = provinceName;
        locatedBuildingName.value = null;
        mapTitle.value = `${provinceName}建筑分布`;
        filteredBuildings.value = getFilteredData(currentProvinceData.value);
        showProvinceInfo.value = true;

        loadProvinceHistory(provinceName);

        chart.setOption({
          backgroundColor: 'transparent',
          tooltip: tooltipConfig,
          geo: {
            map: provinceName, roam: true, zoom: 1.2,
            label: { show: true, color: THEME.text, fontSize: 11 },
            itemStyle: { areaColor: THEME.area, borderColor: THEME.border, borderWidth: 1 },
            emphasis: { itemStyle: { areaColor: THEME.emphasis }, label: { show: true, color: THEME.point, fontWeight: 'bold' } }
          },
          series: [{ name: '古建筑', type: 'effectScatter', coordinateSystem: 'geo', data: getFilteredData(currentProvinceData.value) }]
        }, true);
      })
      .catch(() => {
        chart.hideLoading();
        showToast('该省份地图数据加载失败', 'warning');
      });
}

function renderCityMap(cityName: string) {
  if (!provinceGeoJson.value) return;
  const cityFeature = provinceGeoJson.value.features.find((f: any) => f.properties.name === cityName);
  if (!cityFeature) return;

  chart.showLoading({
    text: `正在进入 ${cityName}...`,
    color: THEME.point, textColor: '#f4ecd8', maskColor: 'rgba(22, 20, 18, 0.8)'
  });

  // 从已加载的省级 GeoJSON 中直接提取当前城市边界，避免外部 CDN 请求 404
  const cityGeoJson: any = {
    type: 'FeatureCollection',
    features: [cityFeature]
  };

  chart.hideLoading();
  (window as any).echarts.registerMap(cityName, cityGeoJson);

  currentCityData.value = currentProvinceData.value.filter((item: any) => {
    const pt = [item.value[0], item.value[1]];
    const type = cityFeature.geometry.type;
    const coords = cityFeature.geometry.coordinates;
    if (type === 'Polygon') return isPointInPolygon(pt, coords[0]);
    if (type === 'MultiPolygon') return coords.some((c: any) => isPointInPolygon(pt, c[0]));
    return false;
  });

  currentLevel.value = 3;
  currentCity.value = cityName;
  locatedBuildingName.value = null;
  mapTitle.value = `${cityName}建筑分布详情`;
  filteredBuildings.value = getFilteredData(currentCityData.value);
  showProvinceInfo.value = false;

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: tooltipConfig,
    geo: {
      map: cityName, roam: true, layoutCenter: ['50%', '50%'], layoutSize: '85%',
      label: { show: true, color: THEME.text, fontSize: 11 },
      itemStyle: { areaColor: THEME.area, borderColor: THEME.border, borderWidth: 1 },
      emphasis: { itemStyle: { areaColor: '#3d332a' }, label: { show: true, color: THEME.point } }
    },
    series: [{ name: '古建筑', type: 'effectScatter', coordinateSystem: 'geo', data: getFilteredData(currentCityData.value) }]
  }, true);
}

function refreshMapData() {
  let targetData: any[] = [];
  if (currentLevel.value === 1) { targetData = ancientBuildings.value; }
  else if (currentLevel.value === 2) { targetData = currentProvinceData.value; }
  else if (currentLevel.value === 3) { targetData = currentCityData.value; }
  const finalData = getFilteredData(targetData);
  chart.setOption({ series: [{ data: finalData }] });
  if (currentLevel.value > 1) filteredBuildings.value = finalData;
}

function locateBuildingOnMap(item: any) {
  locatedBuildingName.value = item.name;
  refreshMapData();
  showToast(`已标注：${item.name}`, 'info');
}

// ============================================
// 省份概志数据（精简版：无营建大家）
// ============================================

const provinceHistoryData: Record<string, { history: string; arch: string }> = {
  '北京': {
    history: '北京，古称燕京、北平，是一座有着三千多年历史的古都。从周朝蓟城始建，经辽金陪都、元大都、明清京师，直至新中国首都，北京始终是华夏政治文化中心。这里汇聚了自西周以来各朝代的文化积淀，是中国古代都城规划的最高典范，也是中华文明源远流长的缩影。',
    arch: '北京古建筑以皇家宫苑、坛庙陵寝、王府衙署为代表，规模宏大、气势雄伟、布局严整，是中国古代官式建筑的最高成就。故宫、天坛、颐和园、十三陵等世界遗产，不仅体现了"天人合一"的传统哲学，更展示了明清时期巅峰的建筑技艺与礼制规范。'
  },
  '浙江': {
    history: '浙江历史悠久，是吴越文化、江南文化的发源地。早在七千年前的河姆渡文化时期，先民就已在此繁衍生息。春秋时为吴越争霸之地，南宋定都临安（今杭州），使其成为当时世界最繁华的大都会之一，经济文化高度发达，为后世留下了极为丰富的建筑遗产。',
    arch: '浙江古建筑以江南水乡民居、江南园林、宗庙祠堂、书院会馆为主要特色，风格轻盈灵巧、飞檐翘角、粉墙黛瓦、精致典雅。保国寺大殿为中国现存最古老的木构建筑之一，天一阁为亚洲最古老的私家藏书楼，乌镇、西塘等古镇更是江南水乡建筑的活态博物馆。'
  },
  '山西': {
    history: '山西史称"三晋大地"，是中华文明发祥地之一。上古尧都平阳、舜都蒲坂、禹都安邑皆在山西境内。春秋时为晋国核心，战国三家分晋。此后历代均为中原重镇，北魏、北齐、唐、五代等朝代在此留下了大量遗存，被誉为"中国古代建筑的宝库"。',
    arch: '山西古建筑以木构建筑见长，保留了中国各历史时期的完整序列。佛光寺东大殿为中国现存最早、最完整的唐代木构建筑；应县木塔为世界现存最高最古的木构塔式建筑；晋祠圣母殿为宋代建筑典范；大同华严寺、善化寺展现了辽金建筑的雄浑大气；平遥古城完整保留了明清县城格局。'
  },
  '江苏': {
    history: '江苏地处长江下游，自古便是鱼米之乡、富庶之地。春秋属吴、越，后长期为江南东道、江南省的核心区域。南京曾为六朝古都、明初京师、民国首都，苏州自宋代以来一直是江南文化中心。江苏文化底蕴深厚，文人荟萃，是中国古典园林和江南民居建筑最集中的区域。',
    arch: '江苏古建筑以苏州古典园林、南京明城墙、明孝陵、扬州个园和何园等为代表，充分展现了江南建筑的精巧雅致。苏州园林以拙政园、留园、网师园等为代表，将山水、花木、建筑完美融合，是中国古典园林的最高成就，被列入世界文化遗产。'
  },
};

function loadProvinceHistory(provinceName: string) {
  const data = provinceHistoryData[provinceName] || {
    history: `关于${provinceName}的历史文献正在调阅中...`,
    arch: `关于${provinceName}的营建纪实正在修缮中...`
  };
  provinceHistory.value = data.history;
  provinceArchHistory.value = data.arch;
}

// ============================================
// 几何工具
// ============================================

function cityHasBuilding(cityName: string) {
  if (!provinceGeoJson.value) return false;
  const cityFeature = provinceGeoJson.value.features.find((f: any) => f.properties.name === cityName);
  if (!cityFeature) return false;
  const type = cityFeature.geometry.type;
  const coords = cityFeature.geometry.coordinates;
  for (let i = 0; i < currentProvinceData.value.length; i++) {
    const pt = [currentProvinceData.value[i].value[0], currentProvinceData.value[i].value[1]];
    if (type === 'Polygon' && isPointInPolygon(pt, coords[0])) return true;
    if (type === 'MultiPolygon' && coords.some((c: any) => isPointInPolygon(pt, c[0]))) return true;
  }
  return false;
}

function getShortName(fullName: string) {
  if (!fullName) return '';
  return fullName.replace(/维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区|省|市/g, '');
}

// ============================================
// 跳转到建筑详情页（替代内嵌详情页）
// ============================================

function navigateToDetail(data: any) {
  if (data.architecture_id) {
    router.push(`/architecture/${data.architecture_id}`);
  } else {
    showToast('该建筑暂无详情页面', 'warning');
  }
}

function goBack() {
  if (currentLevel.value === 3) {
    currentCity.value = '';
    renderProvinceMap(currentProvince.value);
  } else if (currentLevel.value === 2) {
    currentProvince.value = '';
    showProvinceInfo.value = false;
    renderNationalMap();
  }
}

// ============================================
// 统计页面
// ============================================

function openStatsPage() {
  statsPageOpen.value = true;
  nextTick(() => {
    if (!statsChartRef.value) return;
    const provinceCounts: Record<string, number> = {};
    ancientBuildings.value.forEach((item: any) => {
      const addr = item.value[3] || '';
      for (const prov of Object.keys(provincePinyin)) {
        if (addr.includes(prov)) {
          provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
          break;
        }
      }
    });
    const chartData = Object.entries(provinceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.value - b.value);

    statsChart = (window as any).echarts.init(statsChartRef.value);
    statsChart.setOption({
      grid: { left: '10%', right: '10%', bottom: '5%', top: '5%', containLabel: true },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: 'rgba(210, 176, 124, 0.1)' } },
        axisLabel: { color: '#8c8275' }
      },
      yAxis: {
        type: 'category',
        data: chartData.map(d => d.name),
        axisLabel: { color: '#f4ecd8', fontSize: 13 },
        axisTick: { show: false },
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      series: [{
        name: '收录数量',
        type: 'bar',
        data: chartData.map(d => d.value),
        itemStyle: { color: '#d2b07c', borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: '#d2b07c' }
      }]
    });
  });
}

function closeStatsPage() {
  statsPageOpen.value = false;
}

// ============================================
// 加载古建筑数据
// ============================================

// 点聚合/采样配置
const MAX_POINTS_PER_REGION = {
  national: 100,   // 全国视图最大显示点数
  province: 50,    // 省级视图最大显示点数
  city: 30         // 市级视图最大显示点数
};

// 简单的点采样算法：均匀采样
function samplePoints(points: any[], maxCount: number): any[] {
  if (points.length <= maxCount) return points;
  
  const step = Math.floor(points.length / maxCount);
  const sampled: any[] = [];
  
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
    if (sampled.length >= maxCount) break;
  }
  
  // 如果最后还有剩余，均匀插入一些
  if (sampled.length < maxCount) {
    const remaining = points.slice(sampled.length * step);
    const insertStep = Math.floor(remaining.length / (maxCount - sampled.length));
    for (let i = 0; i < remaining.length && sampled.length < maxCount; i += insertStep) {
      sampled.push(remaining[i]);
    }
  }
  
  return sampled;
}

async function loadBuildings() {
  try {
    const res = await architectureApi.list({ page: 1, limit: 1000 });
    console.log(`=== loadBuildings ===`);
    console.log(`API响应:`, res);
    
    if (res.success && res.data) {
      ancientBuildings.value = res.data.map((arch: any) => {
        // 解析坐标：优先使用 longitude/latitude，其次使用 coordinates 字段
        let lng = parseFloat(arch.longitude || 0);
        let lat = parseFloat(arch.latitude || 0);
        
        // 如果没有 longitude/latitude，尝试解析 coordinates 字段（格式: "lat,lng"）
        if (!lng && !lat && arch.coordinates) {
          const coords = arch.coordinates.split(',');
          if (coords.length === 2) {
            lat = parseFloat(coords[0].trim());
            lng = parseFloat(coords[1].trim());
            console.log(`从 coordinates 解析坐标: ${arch.name} -> (${lng}, ${lat})`);
          }
        }
        
        // 如果坐标仍然无效，使用默认值（不再设置为北京坐标，而是标记为无效）
        const defaultLng = lng || 0;
        const defaultLat = lat || 0;
        
        // 先用地址字符串匹配确定初始省份
        let province = '';
        const loc = (arch.location || arch.address || '');
        for (const prov of Object.keys(provincePinyin)) {
          if (loc.includes(prov)) { province = prov; break; }
        }
        
        const building = {
          name: arch.name,
          value: [defaultLng, defaultLat, arch.founding_dynasty || '', province || arch.location || ''],
          intro: arch.description || arch.introduction || '该建筑的详细档案正在整理中...',
          image_url: arch.image_url || '',
          architecture_id: arch.architecture_id,
          architecture_type: arch.architecture_type || arch.type || '',
        };
        
        console.log(`建筑 [${building.name}]: 坐标(${building.value[0]}, ${building.value[1]}), 省份: ${building.value[3]}, 原始coordinates: ${arch.coordinates}`);
        
        return building;
      }).filter((b: any) => {
        // 只保留有效坐标（在中国范围内：经度 73-135，纬度 18-54）
        if (!b.value || !b.value[0] || !b.value[1]) return false;
        const [lng, lat] = b.value;
        return lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54;
      });
      
      console.log(`加载完成: 原始${res.data.length}个, 过滤后${ancientBuildings.value.length}个`);
      
      // 从建筑数据中提取类型列表
      await loadCategories();
    }
  } catch (e) {
    console.error('加载古建筑数据失败:', e);
    showToast('建筑档案调阅失败', 'warning');
  }
}

// 从数据库加载建筑类型分类
async function loadCategories() {
  try {
    // 尝试从API获取类型列表
    const typesRes = await architectureApi.types();
    if (typesRes.success && typesRes.data && typesRes.data.length > 0) {
      // 使用API返回的类型列表
      CATEGORY_RULES.value = typesRes.data.map((typeName: string, index: number) => ({
        name: typeName,
        color: categoryColors[index % categoryColors.length],
        keywords: [typeName], // 匹配类型
      }));
    } else {
      // 从建筑数据中提取类型
      extractCategoriesFromData();
    }
  } catch (e) {
    // API失败时从数据中提取类型
    extractCategoriesFromData();
  }
}

// 从已加载的建筑数据中提取类型
function extractCategoriesFromData() {
  const typeSet = new Set<string>();
  ancientBuildings.value.forEach((building: any) => {
    if (building.architecture_type) {
      typeSet.add(building.architecture_type);
    }
  });
  
  if (typeSet.size > 0) {
    CATEGORY_RULES.value = Array.from(typeSet).map((typeName, index) => ({
      name: typeName,
      color: categoryColors[index % categoryColors.length],
      keywords: [typeName],
    }));
  }
}

// ============================================
// 生命周期
// ============================================

onMounted(async () => {
  // 先加载建筑数据，再加载地图，确保数据就绪
  await loadBuildings();
  initMap();
});

onBeforeUnmount(() => {
  if (autoCycleTimer) clearInterval(autoCycleTimer);
  if (toastTimer) clearTimeout(toastTimer);
  window.removeEventListener('resize', handleResize);
  chart && chart.dispose();
  statsChart && statsChart.dispose();
});
</script>

<style scoped>
/* ========== 基础布局 ========== */
.map-fullscreen {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: #161412;
  color: #f4ecd8;
  margin: 0;
  overflow: hidden;
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
  z-index: 100;
}

.map-fullscreen::before {
  content: "";
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: url('https://www.transparenttextures.com/patterns/handmade-paper.png');
  opacity: 0.3;
  pointer-events: none;
  z-index: 1;
}

.china-map-container {
  width: 100vw; height: 100vh;
  border: none;
  transition: filter 0.5s;
  z-index: 2;
  position: relative;
}

::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d2b07c; border-radius: 10px; }

/* ========== 按钮全局优化 ========== */
.map-btn {
  position: absolute;
  top: 40px;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  z-index: 999;
  transition: all 0.3s ease;
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
  letter-spacing: 2px;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
  border: 1px solid rgba(210, 176, 124, 0.5);
  background: rgba(30, 25, 20, 0.9);
  color: #d2b07c;
}

.back-btn {
  left: 40px;
}
.back-btn:hover {
  background: rgba(210, 176, 124, 0.15);
  border-color: #d2b07c;
  box-shadow: 0 0 15px rgba(210, 176, 124, 0.3);
  transform: translateY(-1px);
}

.home-btn {
  left: 40px;
  color: #f4ecd8;
  background: rgba(210, 176, 124, 0.1);
}
.home-btn:hover {
  background: rgba(210, 176, 124, 0.25);
  border-color: #d2b07c;
  color: #fff;
  box-shadow: 0 0 15px rgba(210, 176, 124, 0.3);
  transform: translateY(-1px);
}

/* ========== 指南 ========== */
.guide-container {
  position: absolute;
  top: 42px;
  left: 185px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  pointer-events: auto;
  z-index: 1000;
}

.guide-toggle-btn {
  padding: 10px 22px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 8px;
  background: rgba(30, 25, 20, 0.85);
  border: 1px solid rgba(210, 176, 124, 0.5);
  color: #d2b07c;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.3s ease;
  letter-spacing: 2px;
  outline: none;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}
.guide-toggle-btn:hover {
  background: rgba(210, 176, 124, 0.15);
  border-color: #d2b07c;
  box-shadow: 0 0 12px rgba(210, 176, 124, 0.25);
  transform: translateY(-1px);
}

.guide-content {
  margin-top: 12px;
  background: rgba(22, 20, 18, 0.96);
  border: 1px solid rgba(210, 176, 124, 0.2);
  padding: 15px 25px;
  border-radius: 8px;
  text-align: left;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 40px rgba(0,0,0,0.8);
  z-index: 1000;
  animation: fadeInDown 0.3s ease-out;
}
.guide-content p {
  margin: 10px 0;
  color: #a8a095;
  font-size: 14px;
  line-height: 1.6;
  white-space: nowrap;
}

/* ========== 标题 ========== */
.title-box {
  position: absolute;
  top: 30px;
  width: 100%;
  text-align: center;
  pointer-events: none;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.title-box h1 {
  margin: 0;
  font-size: 32px;
  letter-spacing: 2px;
  color: #d2b07c;
  text-shadow: 2px 2px 5px rgba(0,0,0,0.8);
  pointer-events: auto;
}

/* ========== 提示信息 ========== */
.toast {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid #d2b07c;
  color: #f4ecd8;
  padding: 15px 30px;
  border-radius: 4px;
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.4s;
  pointer-events: none;
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
  white-space: pre-wrap;
  line-height: 1.8;
  text-align: left;
  font-size: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.toast.show { opacity: 1; }

/* ========== 建筑列表面板 ========== */
.building-list-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  width: 300px;
  height: calc(100vh - 160px);
  background: rgba(22, 20, 18, 0.95);
  border: 1px solid rgba(210, 176, 124, 0.3);
  border-radius: 8px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}
.list-header {
  padding: 15px;
  border-bottom: 1px solid rgba(210, 176, 124, 0.2);
  color: #d2b07c;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}
.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.building-item {
  padding: 12px;
  margin-bottom: 10px;
  background: rgba(210, 176, 124, 0.05);
  border: 1px solid rgba(210, 176, 124, 0.1);
  border-radius: 4px;
  color: #f4ecd8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: 0.3s;
  cursor: pointer;
}
.building-item:hover {
  border-color: #d2b07c;
  background: rgba(210, 176, 124, 0.15);
}
.building-name { flex: 1; font-size: 15px; }
.locate-btn {
  font-size: 11px;
  color: #d2b07c;
  border: 1px solid rgba(210, 176, 124, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  margin-left: 10px;
  flex-shrink: 0;
}

/* ========== 省份概志面板（精简版） ========== */
.province-info-panel {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: 25px;
  width: 300px;
  max-height: 65vh;
  background: rgba(22, 20, 18, 0.9);
  border: 1px solid rgba(210, 176, 124, 0.3);
  border-radius: 6px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(8px);
  transition: opacity 0.3s, transform 0.3s;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}
.info-section { margin-bottom: 20px; padding: 0 5px; }
.info-section h3 {
  color: #d2b07c;
  font-size: 16px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(210, 176, 124, 0.1);
  padding-bottom: 5px;
}
.info-section p {
  font-size: 13px;
  color: #a8a095;
  line-height: 1.8;
  text-align: justify;
}

/* ========== 统计按钮 ========== */
.stats-btn {
  position: absolute;
  top: 40px;
  right: 40px;
  background: rgba(30, 25, 20, 0.9);
  border: 1px solid rgba(210, 176, 124, 0.6);
  color: #f4ecd8;
  font-family: "Noto Serif SC", serif;
  font-weight: 600;
  letter-spacing: 2px;
  padding: 10px 24px;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.4);
  cursor: pointer;
  z-index: 999;
  backdrop-filter: blur(8px);
  font-size: 15px;
}
.stats-btn:hover {
  background: #d2b07c;
  color: #161412;
  box-shadow: 0 0 20px rgba(210, 176, 124, 0.5);
  transform: translateY(-1px);
}

/* ========== 分类面板 ========== */
.category-panel {
  position: absolute;
  bottom: 30px;
  right: 40px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.category-btn {
  background: rgba(30, 25, 20, 0.85);
  border: 1px solid rgba(210, 176, 124, 0.5);
  color: #f4ecd8;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
  letter-spacing: 1px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.category-btn:hover {
  background: rgba(210, 176, 124, 0.2);
  border-color: #d2b07c;
  color: #d2b07c;
  box-shadow: 0 0 15px rgba(210, 176, 124, 0.25);
  transform: translateY(-1px);
}

.dynamic-toggle-btn {
  background: rgba(30, 25, 20, 0.85);
  border: 1px solid rgba(210, 176, 124, 0.5);
  color: #f4ecd8;
  padding: 10px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
  letter-spacing: 1px;
  font-size: 14px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.dynamic-toggle-btn:hover {
  background: rgba(210, 176, 124, 0.2);
  border-color: #d2b07c;
  color: #d2b07c;
  box-shadow: 0 0 15px rgba(210, 176, 124, 0.25);
  transform: translateY(-1px);
}

.category-list {
  display: flex;
  flex-direction: column;
  background: rgba(22, 20, 18, 0.96);
  border: 1px solid rgba(210, 176, 124, 0.3);
  border-radius: 12px;
  margin-bottom: 10px;
  padding: 10px;
  width: 190px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  backdrop-filter: blur(12px);
}
.cat-item {
  padding: 10px 14px;
  cursor: pointer;
  font-size: 14px;
  color: #a8a095;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  border-radius: 6px;
  margin-bottom: 2px;
}
.cat-item:hover {
  color: #f4ecd8;
  background: rgba(210, 176, 124, 0.08);
}
.cat-item.active {
  color: #d2b07c;
  font-weight: bold;
  background: rgba(210, 176, 124, 0.15);
  border-left: 3px solid #d2b07c;
  padding-left: 11px;
}
.cat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 10px;
  box-shadow: 0 0 4px currentColor;
}

/* ========== 分类状态标签 ========== */
.category-status-tag {
  position: absolute;
  right: 22%;
  top: 42%;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 5px;
  background: rgba(22, 20, 18, 0.5);
  border: 1px solid rgba(210, 176, 124, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(3px);
  pointer-events: none;
  transition: all 0.5s ease;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-bottom: 6px;
  transition: all 0.5s ease;
}
.status-text {
  color: #f4ecd8;
  font-size: 11px;
  font-weight: bold;
  writing-mode: vertical-rl;
  text-orientation: upright;
  letter-spacing: 3px;
  font-family: "Noto Serif SC", serif;
  opacity: 0.8;
}

/* ========== 统计页面 ========== */
.stats-page {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: #161412;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  padding: 3vh 3vw;
  box-sizing: border-box;
  overflow: hidden;
}
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2vh;
  flex-shrink: 0;
}
.stats-header h2 {
  color: #d2b07c;
  margin: 0;
  letter-spacing: 4px;
  font-size: 24px;
}
.stats-back-btn {
  background: rgba(30, 25, 20, 0.9);
  border: 1px solid #d2b07c;
  color: #f4ecd8;
  font-family: "Noto Serif SC", serif;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  letter-spacing: 2px;
  font-size: 15px;
  backdrop-filter: blur(8px);
}
.stats-back-btn:hover {
  background: #d2b07c;
  color: #161412;
  box-shadow: 0 0 15px rgba(210, 176, 124, 0.5);
  transform: translateY(-1px);
}
.stats-main-content {
  flex: 1;
  display: flex;
  gap: 30px;
  min-height: 0;
  align-items: stretch;
}
.stats-chart-container {
  flex: 2;
  background: rgba(30, 25, 20, 0.4);
  border: 1px solid rgba(210, 176, 124, 0.2);
  border-radius: 12px;
  padding: 30px;
  position: relative;
}
.stats-info-card {
  flex: 0.8;
  background: rgba(44, 36, 30, 0.4);
  border: 1px solid rgba(210, 176, 124, 0.2);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.stats-info-card h3 {
  color: #d2b07c;
  border-bottom: 1px dashed rgba(210, 176, 124, 0.3);
  padding-bottom: 10px;
  margin-top: 0;
  flex-shrink: 0;
}
.stats-scroll-text {
  flex: 1;
  overflow-y: auto;
  color: #a8a095;
  line-height: 1.8;
  text-align: justify;
  padding-right: 10px;
  font-size: 14px;
}

/* ========== 动画 ========== */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>