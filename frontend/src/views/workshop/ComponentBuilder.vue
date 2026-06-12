<template>
  <div class="builder-page">
    <Navbar />
    
    <div class="builder-layout">
      <!-- 左侧：3D预览区 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>构件预览</h3>
          <div class="view-controls">
            <button @click="setView('perspective')" :class="{ active: activeView === 'perspective' }">透视</button>
            <button @click="setView('front')" :class="{ active: activeView === 'front' }">前视</button>
            <button @click="setView('top')" :class="{ active: activeView === 'top' }">俯视</button>
            <button @click="setView('side')" :class="{ active: activeView === 'side' }">侧视</button>
          </div>
        </div>
        <div ref="previewContainer" class="preview-canvas"></div>
        <div class="preview-hints">
          <span>左键旋转 | 滚轮缩放 | 右键平移</span>
        </div>
      </div>

      <!-- 中央：构件属性编辑 -->
      <div class="editor-panel">
        <div class="panel-header">
          <h3>构件建模</h3>
          <div class="mode-badge" :class="buildMode">
            {{ buildMode === 'real' ? '真实搭建模式' : '自由创建模式' }}
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="editor-section">
          <div class="section-header" @click="sections.basic = !sections.basic">
            <span>基本信息</span>
            <span class="collapse-icon">{{ sections.basic ? '▼' : '▲' }}</span>
          </div>
          <div v-show="sections.basic" class="section-content">
            <div class="form-row">
              <label>构件名称</label>
              <input v-model="form.name" class="atca-input" />
            </div>
            <div class="form-row">
              <label>构件类型</label>
              <select v-model="form.type" class="atca-input" @change="updateComponentGeometry">
                <option value="pillar_round">圆柱</option>
                <option value="pillar_square">方柱</option>
                <option value="beam_main">主梁</option>
                <option value="beam_cross">横梁</option>
                <option value="purlin">檩条</option>
                <option value="bracket_ludou">栌斗</option>
                <option value="bracket_hua">华拱</option>
                <option value="roof_hipped">庑殿顶</option>
                <option value="roof_gable">歇山顶</option>
                <option value="base_platform">台基</option>
                <option value="wall">墙体</option>
                <option value="door_main">大门</option>
                <option value="window">窗户</option>
              </select>
            </div>
            <div class="form-row">
              <label>分类</label>
              <span class="form-value">{{ getCategoryLabel(form.category) }}</span>
            </div>
          </div>
        </div>

        <!-- 几何变换 -->
        <div class="editor-section">
          <div class="section-header" @click="sections.transform = !sections.transform">
            <span>几何变换</span>
            <span class="collapse-icon">{{ sections.transform ? '▼' : '▲' }}</span>
          </div>
          <div v-show="sections.transform" class="section-content">
            <!-- 尺寸设置 -->
            <div class="transform-group">
              <h4>尺寸</h4>
              <div class="transform-row">
                <div class="transform-item">
                  <label>宽度 (X)</label>
                  <input v-model.number="form.scale.x" type="number" step="0.1" class="atca-input small" @input="updateScale" />
                </div>
                <div class="transform-item">
                  <label>高度 (Y)</label>
                  <input v-model.number="form.scale.y" type="number" step="0.1" class="atca-input small" @input="updateScale" />
                </div>
                <div class="transform-item">
                  <label>深度 (Z)</label>
                  <input v-model.number="form.scale.z" type="number" step="0.1" class="atca-input small" @input="updateScale" />
                </div>
              </div>
              <div class="transform-actions">
                <button class="btn btn-sm" @click="uniformScale(1)">1x</button>
                <button class="btn btn-sm" @click="uniformScale(0.5)">0.5x</button>
                <button class="btn btn-sm" @click="uniformScale(2)">2x</button>
              </div>
            </div>

            <!-- 位置设置 -->
            <div class="transform-group">
              <h4>位置</h4>
              <div class="transform-row">
                <div class="transform-item">
                  <label>X</label>
                  <input v-model.number="form.position.x" type="number" step="0.1" class="atca-input small" @input="updatePosition" />
                </div>
                <div class="transform-item">
                  <label>Y</label>
                  <input v-model.number="form.position.y" type="number" step="0.1" class="atca-input small" @input="updatePosition" />
                </div>
                <div class="transform-item">
                  <label>Z</label>
                  <input v-model.number="form.position.z" type="number" step="0.1" class="atca-input small" @input="updatePosition" />
                </div>
              </div>
            </div>

            <!-- 旋转设置 -->
            <div class="transform-group">
              <h4>旋转</h4>
              <div class="transform-row">
                <div class="transform-item">
                  <label>X</label>
                  <input v-model.number="form.rotation.x" type="number" step="0.1" class="atca-input small" @input="updateRotation" />
                </div>
                <div class="transform-item">
                  <label>Y</label>
                  <input v-model.number="form.rotation.y" type="number" step="0.1" class="atca-input small" @input="updateRotation" />
                </div>
                <div class="transform-item">
                  <label>Z</label>
                  <input v-model.number="form.rotation.z" type="number" step="0.1" class="atca-input small" @input="updateRotation" />
                </div>
              </div>
              <div class="transform-actions">
                <button class="btn btn-sm" @click="resetRotation">重置</button>
                <button class="btn btn-sm" @click="rotateY90">+90°</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 榫卯接口编辑 -->
        <div class="editor-section">
          <div class="section-header" @click="sections.snap = !sections.snap">
            <span>榫卯接口</span>
            <span class="badge">{{ form.snapPoints.length }}</span>
            <span class="collapse-icon">{{ sections.snap ? '▼' : '▲' }}</span>
          </div>
          <div v-show="sections.snap" class="section-content">
            <!-- 榫卯接口列表 -->
            <div class="snap-points-list">
              <div v-for="(point, index) in form.snapPoints" :key="index" class="snap-point-card">
                <div class="snap-point-header">
                  <div class="snap-point-type-badge" :class="point.type">
                    {{ point.type === 'mortise' ? '凹槽' : point.type === 'tenon' ? '凸起' : '通用' }}
                  </div>
                  <span class="snap-point-id">{{ point.id }}</span>
                  <button class="btn-delete" @click="removeSnapPoint(index)">×</button>
                </div>
                
                <div class="snap-point-body">
                  <div class="snap-property">
                    <label>匹配尺寸</label>
                    <input v-model.number="point.matchSize" type="number" step="0.01" min="0" class="atca-input small" 
                           placeholder="0.2" @input="updateSnapPoints" />
                    <span class="unit">m</span>
                  </div>
                  
                  <div class="snap-property">
                    <label>局部位置</label>
                    <div class="coord-inputs">
                      <input v-model.number="point.localPosition[0]" type="number" step="0.1" class="atca-input tiny" />
                      <input v-model.number="point.localPosition[1]" type="number" step="0.1" class="atca-input tiny" />
                      <input v-model.number="point.localPosition[2]" type="number" step="0.1" class="atca-input tiny" />
                    </div>
                  </div>
                  
                  <div class="snap-property">
                    <label>法线方向</label>
                    <div class="coord-inputs">
                      <input v-model.number="point.localDirection[0]" type="number" step="0.1" class="atca-input tiny" />
                      <input v-model.number="point.localDirection[1]" type="number" step="0.1" class="atca-input tiny" />
                      <input v-model.number="point.localDirection[2]" type="number" step="0.1" class="atca-input tiny" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 添加榫卯接口按钮 -->
            <button class="btn btn-add" @click="addSnapPoint">
              <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 5v14M5 12h14" stroke="currentColor" fill="none" stroke-width="2"/></svg>
              添加榫卯接口
            </button>

            <!-- 真实搭建模式提示 -->
            <div v-if="buildMode === 'real'" class="snap-hint">
              <div class="hint-icon">💡</div>
              <div class="hint-content">
                <strong>真实搭建模式</strong>
                <p>在真实搭建模式下，构件间必须通过榫卯接口连接。凹槽(mortise)与凸起(tenon)需尺寸匹配才能实现吸附。</p>
                <ul>
                  <li>榫头(凸起)尺寸应略小于卯眼(凹槽)</li>
                  <li>建议预留0.1-0.2厘米的配合间隙</li>
                  <li>接口方向应指向构件外部</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 材质设置 -->
        <div class="editor-section">
          <div class="section-header" @click="sections.material = !sections.material">
            <span>材质设置</span>
            <span class="collapse-icon">{{ sections.material ? '▼' : '▲' }}</span>
          </div>
          <div v-show="sections.material" class="section-content">
            <div class="material-presets">
              <button v-for="mat in materialPresets" :key="mat.id" 
                      class="mat-preset" :class="{ active: currentMaterial === mat.id }"
                      :style="{ backgroundColor: '#' + mat.color.toString(16).padStart(6, '0') }"
                      @click="applyMaterial(mat)" :title="mat.name">
                {{ mat.name.charAt(0) }}
              </button>
            </div>
            <div class="material-sliders">
              <div class="slider-item">
                <label>粗糙度</label>
                <input type="range" min="0" max="1" step="0.05" v-model.number="materialValues.roughness" @input="updateMaterial" />
                <span>{{ materialValues.roughness.toFixed(2) }}</span>
              </div>
              <div class="slider-item">
                <label>金属度</label>
                <input type="range" min="0" max="1" step="0.05" v-model.number="materialValues.metalness" @input="updateMaterial" />
                <span>{{ materialValues.metalness.toFixed(2) }}</span>
              </div>
              <div class="slider-item">
                <label>颜色</label>
                <input type="color" v-model="materialValues.colorHex" @input="updateMaterial" />
              </div>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="editor-actions">
          <button class="btn btn-sec" @click="resetForm">重置</button>
          <button class="btn btn-pri" @click="saveComponent">保存构件</button>
          <button class="btn btn-gold" @click="addToScene">添加到场景</button>
        </div>
      </div>

      <!-- 右侧：营造规则参考 -->
      <div class="rules-panel">
        <div class="panel-header">
          <h3>营造规则参考</h3>
        </div>
        <div class="rules-content">
          <div v-if="buildMode === 'real'" class="rule-section">
            <h4>🏛️ 尺寸规范</h4>
            <div class="rule-item">柱径: 30-60cm</div>
            <div class="rule-item">柱高与柱径比: 9:1 ~ 10:1</div>
            <div class="rule-item">梁高: 柱径的 1/2 ~ 2/3</div>
            <div class="rule-item">榫厚: 梁高的 1/3 ~ 1/2</div>
          </div>
          <div class="rule-section">
            <h4>🔗 榫卯配合</h4>
            <div class="rule-item">榫宽略小于卯口</div>
            <div class="rule-item">留0.1~0.2cm缝隙</div>
            <div class="rule-item">榫长: 构件厚的1/3~1/2</div>
          </div>
          <div class="rule-section">
            <h4>📐 当前构件约束</h4>
            <div v-if="ruleWarnings.length > 0">
              <div v-for="(warning, index) in ruleWarnings" :key="index" class="warning-item">
                ⚠️ {{ warning }}
              </div>
            </div>
            <div v-else class="success-item">✓ 符合营造规则</div>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '@/components/common/CommonNavbar.vue';
import Footer from '@/components/common/CommonFooter.vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MATERIAL_PRESETS, type ComponentDefinition, DEFAULT_COMPONENTS } from '@/components/threejs/ThreejsArchitectureComponents';
import type { SnapPoint } from '@/components/threejs/ThreejsMortiseTenonSnapEngine';

const route = useRoute();
const router = useRouter();

// 预览容器
const previewContainer = ref<HTMLElement>();
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
let componentMesh: THREE.Mesh | null = null;
let snapPointMarkers: THREE.Mesh[] = [];

// 视图模式
const activeView = ref('perspective');

// 搭建模式
const buildMode = ref<'free' | 'real'>('free');

// 面板折叠状态
const sections = reactive({
  basic: true,
  transform: true,
  snap: true,
  material: true,
});

// 表单数据
const form = reactive({
  uuid: '',
  definitionId: 0,
  type: 'pillar_round',
  category: 'pillar',
  name: '新构件',
  position: { x: 0, y: 2, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  snapPoints: [] as SnapPoint[],
  material: {
    type: 'MeshStandardMaterial',
    color: 0x8B6E4D,
    roughness: 0.8,
    metalness: 0.1,
  },
});

// 材质值
const materialValues = reactive({
  roughness: 0.8,
  metalness: 0.1,
  opacity: 1,
  colorHex: '#8B6E4D',
});

const currentMaterial = ref('wood');
const materialPresets = MATERIAL_PRESETS;

// 规则警告
const ruleWarnings = ref<string[]>([]);

// 计算分类标签
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    pillar: '柱类',
    beam: '梁类',
    purlin: '檩椽',
    bracket: '斗拱',
    roof: '屋顶',
    base: '台基',
    wall: '墙体',
    door: '门窗',
    window: '窗户',
    decoration: '装饰',
  };
  return labels[category] || category;
}

// 获取分类
function getCategory(type: string): string {
  if (type.includes('pillar')) return 'pillar';
  if (type.includes('beam')) return 'beam';
  if (type.includes('purlin')) return 'purlin';
  if (type.includes('bracket')) return 'bracket';
  if (type.includes('roof')) return 'roof';
  if (type.includes('base')) return 'base';
  if (type.includes('wall')) return 'wall';
  if (type.includes('door')) return 'door';
  if (type.includes('window')) return 'window';
  if (type.includes('decoration') || type.includes('dougong')) return 'decoration';
  return 'pillar';
}

// 创建几何体
function createGeometry(type: string, category: string): THREE.BufferGeometry {
  if (category === 'pillar') {
    if (type.includes('square') || type.includes('corner')) {
      return new THREE.BoxGeometry(0.35, 3, 0.35);
    }
    return new THREE.CylinderGeometry(0.15, 0.15, 3, 16);
  }
  if (category === 'beam') {
    if (type.includes('purlin')) return new THREE.BoxGeometry(3.5, 0.25, 0.2);
    if (type.includes('cross')) return new THREE.BoxGeometry(3, 0.3, 0.25);
    return new THREE.BoxGeometry(4, 0.4, 0.3);
  }
  if (category === 'roof') {
    if (type.includes('hipped')) {
      const shape = new THREE.Shape();
      shape.moveTo(-2, 0);
      shape.lineTo(0, 1.5);
      shape.lineTo(2, 0);
      shape.lineTo(-2, 0);
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false });
      geometry.center();
      return geometry;
    }
    if (type.includes('gable')) {
      const shape = new THREE.Shape();
      shape.moveTo(-2, 0);
      shape.lineTo(0, 1.2);
      shape.lineTo(2, 0);
      shape.lineTo(-2, 0);
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false });
      geometry.center();
      return geometry;
    }
    return new THREE.ConeGeometry(2.5, 1.5, 4);
  }
  if (category === 'base') {
    if (type.includes('stairs')) return new THREE.BoxGeometry(2, 0.6, 1.5);
    return new THREE.BoxGeometry(6, 0.8, 5);
  }
  if (category === 'wall') return new THREE.BoxGeometry(3, 2.8, 0.3);
  if (category === 'door') return new THREE.BoxGeometry(2, 2.5, 0.15);
  if (category === 'window') return new THREE.BoxGeometry(1, 1.2, 0.1);
  if (category === 'decoration') {
    if (type.includes('dougong')) return new THREE.BoxGeometry(0.8, 0.5, 0.8);
    if (type.includes('ridge')) return new THREE.BoxGeometry(3, 0.4, 0.3);
    if (type.includes('railing')) return new THREE.BoxGeometry(2, 1, 0.15);
    return new THREE.BoxGeometry(0.6, 0.4, 0.2);
  }
  if (category === 'bracket') {
    if (type.includes('ludou')) return new THREE.BoxGeometry(0.8, 0.5, 0.8);
    if (type.includes('hua')) return new THREE.BoxGeometry(0.3, 0.2, 1.2);
    if (type.includes('ling')) return new THREE.BoxGeometry(1.0, 0.18, 0.25);
    if (type.includes('shuatou')) return new THREE.BoxGeometry(0.25, 0.3, 1.4);
    if (type.includes('man')) return new THREE.BoxGeometry(1.6, 0.16, 0.22);
    if (type.includes('guazi')) return new THREE.BoxGeometry(0.8, 0.15, 0.2);
    if (type.includes('ni')) return new THREE.BoxGeometry(0.2, 0.15, 0.8);
    if (type.includes('xiaang')) return new THREE.BoxGeometry(0.2, 0.35, 1.8);
    if (type.includes('timu')) return new THREE.BoxGeometry(1.2, 0.12, 0.2);
    return new THREE.BoxGeometry(0.5, 0.2, 0.5);
  }
  return new THREE.BoxGeometry(1, 1, 1);
}

// 更新几何体
function updateComponentGeometry() {
  if (!componentMesh || !previewContainer.value) return;
  
  const category = getCategory(form.type);
  form.category = category;
  
  const newGeometry = createGeometry(form.type, category);
  
  // 保存材质
  const material = componentMesh.material;
  
  // 销毁旧几何体
  componentMesh.geometry.dispose();
  
  // 创建新网格
  componentMesh.geometry = newGeometry;
  componentMesh.position.set(form.position.x, form.position.y, form.position.z);
  componentMesh.rotation.set(form.rotation.x, form.rotation.y, form.rotation.z);
  componentMesh.scale.set(form.scale.x, form.scale.y, form.scale.z);
  
  // 更新规则警告
  validateRules();
}

// 验证规则
function validateRules() {
  ruleWarnings.value = [];
  if (buildMode.value !== 'real') return;
  
  const category = form.category;
  const height = form.scale.y * 2;
  const width = form.scale.x * 2;
  
  if (category === 'pillar') {
    const diameter = form.scale.x * 2;
    const ratio = height / diameter;
    if (ratio < 6 || ratio > 15) {
      ruleWarnings.value.push(`柱高与柱径比 ${ratio.toFixed(1)}:1 超出传统范围（9:1～10:1）`);
    }
  }
  
  if (category === 'beam') {
    const beamHeight = form.scale.y * 2;
    if (width / beamHeight > 3 || beamHeight / width > 3) {
      ruleWarnings.value.push('梁截面比例异常，传统梁宽高比约为 2:3');
    }
  }
  
  if (category === 'bracket') {
    if (height < 0.15 || height > 0.5) {
      ruleWarnings.value.push(`斗拱高 ${(height * 100).toFixed(0)}cm 超出传统范围（15～50cm）`);
    }
  }
}

// 更新缩放
function updateScale() {
  if (!componentMesh) return;
  componentMesh.scale.set(form.scale.x, form.scale.y, form.scale.z);
  validateRules();
}

// 更新位置
function updatePosition() {
  if (!componentMesh) return;
  componentMesh.position.set(form.position.x, form.position.y, form.position.z);
}

// 更新旋转
function updateRotation() {
  if (!componentMesh) return;
  componentMesh.rotation.set(form.rotation.x, form.rotation.y, form.rotation.z);
}

// 均匀缩放
function uniformScale(s: number) {
  form.scale = { x: s, y: s, z: s };
  updateScale();
}

// 重置旋转
function resetRotation() {
  form.rotation = { x: 0, y: 0, z: 0 };
  updateRotation();
}

// 旋转90度
function rotateY90() {
  form.rotation.y += Math.PI / 2;
  updateRotation();
}

// 添加榫卯接口
function addSnapPoint() {
  form.snapPoints.push({
    id: `snap_${Date.now()}`,
    localPosition: [0, 0, 0],
    localDirection: [0, 1, 0],
    type: 'mortise',
    matchSize: 0.2,
  });
  updateSnapPoints();
}

// 移除榫卯接口
function removeSnapPoint(index: number) {
  form.snapPoints.splice(index, 1);
  updateSnapPoints();
}

// 更新榫卯接口显示
function updateSnapPoints() {
  // 清除旧标记
  snapPointMarkers.forEach(marker => {
    scene.remove(marker);
    marker.geometry.dispose();
    (marker.material as THREE.Material).dispose();
  });
  snapPointMarkers = [];
  
  // 添加新标记
  form.snapPoints.forEach((point) => {
    const markerGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: point.type === 'mortise' ? 0xff4444 : point.type === 'tenon' ? 0x44ff44 : 0x4444ff,
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    
    const pos = point.localPosition;
    marker.position.set(pos[0] * form.scale.x, pos[1] * form.scale.y, pos[2] * form.scale.z);
    
    if (componentMesh) {
      marker.position.add(componentMesh.position);
    }
    
    scene.add(marker);
    snapPointMarkers.push(marker);
  });
}

// 应用材质预设
function applyMaterial(mat: any) {
  currentMaterial.value = mat.id;
  materialValues.roughness = mat.roughness;
  materialValues.metalness = mat.metalness;
  materialValues.colorHex = '#' + mat.color.toString(16).padStart(6, '0');
  updateMaterial();
}

// 更新材质
function updateMaterial() {
  if (!componentMesh) return;
  const mat = componentMesh.material as THREE.MeshStandardMaterial;
  const color = parseInt(materialValues.colorHex.replace('#', ''), 16);
  mat.color.setHex(color);
  mat.roughness = materialValues.roughness;
  mat.metalness = materialValues.metalness;
  mat.opacity = materialValues.opacity;
  mat.transparent = materialValues.opacity < 1;
  mat.needsUpdate = true;
  
  form.material = {
    type: 'MeshStandardMaterial',
    color,
    roughness: materialValues.roughness,
    metalness: materialValues.metalness,
  };
}

// 设置视图
function setView(view: string) {
  activeView.value = view;
  switch (view) {
    case 'perspective':
      camera.position.set(5, 4, 5);
      break;
    case 'front':
      camera.position.set(0, 3, 8);
      break;
    case 'top':
      camera.position.set(0, 8, 0);
      break;
    case 'side':
      camera.position.set(8, 3, 0);
      break;
  }
  camera.lookAt(0, 2, 0);
  controls.target.set(0, 2, 0);
  controls.update();
}

// 重置表单
function resetForm() {
  form.type = 'pillar_round';
  form.category = 'pillar';
  form.name = '新构件';
  form.position = { x: 0, y: 2, z: 0 };
  form.rotation = { x: 0, y: 0, z: 0 };
  form.scale = { x: 1, y: 1, z: 1 };
  form.snapPoints = [];
  materialValues.roughness = 0.8;
  materialValues.metalness = 0.1;
  materialValues.colorHex = '#8B6E4D';
  
  updateComponentGeometry();
  updateMaterial();
  updateSnapPoints();
}

// 保存构件
function saveComponent() {
  const componentData = {
    ...form,
    uuid: form.uuid || crypto.randomUUID(),
    visible: true,
    locked: false,
  };
  
  // 保存到localStorage供场景使用
  localStorage.setItem('atca_component_builder', JSON.stringify(componentData));
  
  alert('构件已保存！可以添加到场景中使用。');
}

// 添加到场景
function addToScene() {
  const componentData = {
    ...form,
    uuid: form.uuid || crypto.randomUUID(),
    visible: true,
    locked: false,
  };
  
  localStorage.setItem('atca_component_builder', JSON.stringify(componentData));
  
  // 跳转到工坊编辑器
  router.push('/workshop/editor?builder=true');
}

// 初始化场景
function initScene() {
  if (!previewContainer.value) return;
  
  // 创建场景
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f0e8);
  
  // 创建相机
  camera = new THREE.PerspectiveCamera(45, previewContainer.value.clientWidth / previewContainer.value.clientHeight, 0.1, 100);
  camera.position.set(5, 4, 5);
  
  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(previewContainer.value.clientWidth, previewContainer.value.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  previewContainer.value.appendChild(renderer.domElement);
  
  // 创建控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 2, 0);
  
  // 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
  
  // 添加地面网格
  const gridHelper = new THREE.GridHelper(20, 20, 0xc8bfb0, 0xe0d8cc);
  scene.add(gridHelper);
  
  // 添加坐标轴
  const axesHelper = new THREE.AxesHelper(3);
  axesHelper.position.set(-8, 0, -8);
  scene.add(axesHelper);
  
  // 创建构件
  createComponent();
  
  // 开始渲染循环
  animate();
}

// 创建构件网格
function createComponent() {
  const geometry = createGeometry(form.type, form.category);
  const material = new THREE.MeshStandardMaterial({
    color: 0x8B6E4D,
    roughness: 0.8,
    metalness: 0.1,
  });
  
  componentMesh = new THREE.Mesh(geometry, material);
  componentMesh.position.set(form.position.x, form.position.y, form.position.z);
  componentMesh.scale.set(form.scale.x, form.scale.y, form.scale.z);
  componentMesh.castShadow = true;
  componentMesh.receiveShadow = true;
  
  scene.add(componentMesh);
}

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// 处理窗口大小变化
function onResize() {
  if (!previewContainer.value) return;
  camera.aspect = previewContainer.value.clientWidth / previewContainer.value.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(previewContainer.value.clientWidth, previewContainer.value.clientHeight);
}

// 加载路由参数中的构件数据
function loadComponentFromRoute() {
  const componentData = route.query.component;
  if (componentData && typeof componentData === 'string') {
    try {
      const data = JSON.parse(decodeURIComponent(componentData));
      Object.assign(form, data);
      updateComponentGeometry();
      updateMaterial();
      updateSnapPoints();
    } catch (e) {
      console.error('加载构件数据失败:', e);
    }
  }
}

onMounted(() => {
  initScene();
  window.addEventListener('resize', onResize);
  loadComponentFromRoute();
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  if (renderer) {
    renderer.dispose();
  }
});
</script>

<style scoped>
.builder-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.builder-layout {
  display: flex;
  gap: 20px;
  padding: 20px;
  max-width: 1800px;
  margin: 0 auto;
}

.preview-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
}

.preview-panel .panel-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.view-controls {
  display: flex;
  gap: 8px;
}

.view-controls button {
  padding: 4px 10px;
  font-size: 0.75rem;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-controls button:hover {
  background: var(--bg-hover);
}

.view-controls button.active {
  background: var(--gold);
  border-color: var(--gold);
  color: white;
}

.preview-canvas {
  flex: 1;
  min-height: 400px;
}

.preview-hints {
  padding: 8px 16px;
  background: var(--bg-secondary);
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: center;
}

.editor-panel {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 16px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.editor-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.editor-panel .panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.mode-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 500;
}

.mode-badge.free {
  background: #e8f5e9;
  color: #2e7d32;
}

.mode-badge.real {
  background: #fff3e0;
  color: #e65100;
}

.editor-section {
  margin-bottom: 16px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: var(--bg-secondary);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  gap: 8px;
}

.section-header .collapse-icon {
  margin-left: auto;
  font-size: 0.6rem;
  color: var(--text-muted);
}

.section-header .badge {
  padding: 2px 8px;
  background: var(--gold);
  color: white;
  border-radius: 10px;
  font-size: 0.65rem;
}

.section-content {
  padding: 12px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.form-row label {
  width: 80px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.form-row .form-value {
  font-size: 0.8rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-row input,
.form-row select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  font-size: 0.8rem;
}

.transform-group {
  margin-bottom: 16px;
}

.transform-group h4 {
  margin: 0 0 8px 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.transform-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.transform-item {
  flex: 1;
}

.transform-item label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.transform-item input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  font-size: 0.75rem;
}

.transform-actions {
  display: flex;
  gap: 6px;
}

.transform-actions .btn-sm {
  padding: 3px 8px;
  font-size: 0.7rem;
}

.snap-points-list {
  margin-bottom: 12px;
}

.snap-point-card {
  border: 1px solid var(--border-light);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
}

.snap-point-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: var(--bg-secondary);
  gap: 8px;
}

.snap-point-type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 500;
}

.snap-point-type-badge.mortise {
  background: #ffebee;
  color: #c62828;
}

.snap-point-type-badge.tenon {
  background: #e8f5e9;
  color: #2e7d32;
}

.snap-point-type-badge.any {
  background: #e3f2fd;
  color: #1565c0;
}

.snap-point-id {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: monospace;
}

.btn-delete {
  margin-left: auto;
  width: 24px;
  height: 24px;
  border: none;
  background: #ffebee;
  color: #c62828;
  border-radius: 50%;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.snap-point-body {
  padding: 10px;
}

.snap-property {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.snap-property label {
  width: 70px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.snap-property input {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid var(--border-light);
  border-radius: 4px;
  font-size: 0.7rem;
}

.snap-property .unit {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.coord-inputs {
  display: flex;
  gap: 6px;
  flex: 1;
}

.coord-inputs input {
  flex: 1;
  width: 50px;
}

.btn-add {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  border: 2px dashed var(--border-light);
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  border-color: var(--gold);
  color: var(--gold);
}

.snap-hint {
  margin-top: 12px;
  padding: 12px;
  background: #fff8e1;
  border-radius: 8px;
  display: flex;
  gap: 12px;
}

.hint-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.hint-content strong {
  display: block;
  margin-bottom: 4px;
  font-size: 0.8rem;
}

.hint-content p {
  margin: 0 0 8px 0;
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.hint-content ul {
  margin: 0;
  padding-left: 16px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.material-presets {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.mat-preset {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 2px solid transparent;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.mat-preset:hover {
  transform: scale(1.1);
}

.mat-preset.active {
  border-color: var(--gold);
}

.material-sliders {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.slider-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-item label {
  width: 60px;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.slider-item input[type="range"] {
  flex: 1;
}

.slider-item input[type="color"] {
  width: 40px;
  height: 28px;
  border: none;
  cursor: pointer;
}

.slider-item span {
  width: 40px;
  font-size: 0.7rem;
  color: var(--text-muted);
  text-align: right;
}

.editor-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.editor-actions .btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-sec {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-sec:hover {
  background: var(--bg-hover);
}

.btn-pri {
  background: var(--primary);
  color: white;
}

.btn-pri:hover {
  background: var(--primary-dark);
}

.btn-gold {
  background: var(--gold);
  color: white;
}

.btn-gold:hover {
  background: var(--gold-dark);
}

.rules-panel {
  width: 280px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.rules-panel .panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
}

.rules-panel .panel-header h3 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
}

.rules-content {
  padding: 12px;
}

.rule-section {
  margin-bottom: 16px;
}

.rule-section h4 {
  margin: 0 0 8px 0;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.rule-item {
  font-size: 0.7rem;
  color: var(--text-primary);
  padding: 4px 0;
  border-bottom: 1px dashed var(--border-light);
}

.warning-item {
  font-size: 0.7rem;
  color: #c62828;
  padding: 6px 8px;
  background: #ffebee;
  border-radius: 4px;
  margin-bottom: 4px;
}

.success-item {
  font-size: 0.7rem;
  color: #2e7d32;
  padding: 6px 8px;
  background: #e8f5e9;
  border-radius: 4px;
}

.atca-input {
  padding: 6px 10px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  font-size: 0.8rem;
}

.atca-input.small {
  width: 80px;
}

.atca-input.tiny {
  width: 50px;
}
</style>