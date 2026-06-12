// ============================================
// 华夏营造 - 传统构件定义 (ArchitectureComponents)
// 支持：几何形状、榫卯连接点(localPosition+localDirection)、旋转约束
// ============================================

import type { SceneComponent } from './ThreejsSceneManager';
import type { SnapPoint, RotationConstraint } from './ThreejsMortiseTenonSnapEngine';

export interface ComponentDefinition {
  definitionId: number;
  type: string;
  category: string;
  name: string;
  description: string;
  dimensions: { x: number; y: number; z: number };
  material: {
    type: string;
    color: number;
    roughness: number;
    metalness: number;
  };
  snapPoints: SnapPoint[];
  /** 旋转约束：定义构件在各轴上的允许角度与吸附行为 */
  rotationConstraints: RotationConstraint[];
  era: string[];
  complexity: string;
  tags: string[];
}

/* ---------- 旋转约束预设 ---------- */
const RC_PILLAR_ROUND: RotationConstraint[] = [
  { axis: 'x', allowedAngles: [0], tolerance: 0.05, freeRotation: false },
  { axis: 'z', allowedAngles: [0], tolerance: 0.05, freeRotation: false },
  { axis: 'y', allowedAngles: [0], tolerance: 0.3, freeRotation: true }, // 圆柱对称，Y完全自由
];

const RC_VERTICAL: RotationConstraint[] = [
  { axis: 'x', allowedAngles: [0], tolerance: 0.05, freeRotation: false },
  { axis: 'z', allowedAngles: [0], tolerance: 0.05, freeRotation: false },
  { axis: 'y', allowedAngles: [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2], tolerance: 0.2, freeRotation: true },
];

const RC_STRICT: RotationConstraint[] = [
  { axis: 'x', allowedAngles: [0], tolerance: 0.05, freeRotation: false },
  { axis: 'z', allowedAngles: [0], tolerance: 0.05, freeRotation: false },
  { axis: 'y', allowedAngles: [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2], tolerance: 0.1, freeRotation: false },
];

/* ---------- 15 种标准构件 + 铺作扩展 ---------- */
export const DEFAULT_COMPONENTS: ComponentDefinition[] = [
  // ===== 柱类（3种）=====
  {
    definitionId: 1,
    type: 'pillar_round',
    category: 'pillar',
    name: '圆柱',
    description: '传统圆形木柱，用于主要承重',
    dimensions: { x: 0.3, y: 3, z: 0.3 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'top', localPosition: [0, 1.5, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.25 },
      { id: 'bottom', localPosition: [0, -1.5, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.2 },
    ],
    rotationConstraints: RC_PILLAR_ROUND,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['承重', '主要构件'],
  },
  {
    definitionId: 2,
    type: 'pillar_square',
    category: 'pillar',
    name: '方柱',
    description: '方形石柱或木柱',
    dimensions: { x: 0.35, y: 3, z: 0.35 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'top', localPosition: [0, 1.5, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.3 },
      { id: 'bottom', localPosition: [0, -1.5, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.25 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['承重', '主要构件'],
  },
  {
    definitionId: 3,
    type: 'pillar_corner',
    category: 'pillar',
    name: '角柱',
    description: '建筑角落的柱子',
    dimensions: { x: 0.35, y: 3, z: 0.35 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'top', localPosition: [0, 1.5, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.3 },
      { id: 'bottom', localPosition: [0, -1.5, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.25 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['承重', '转角'],
  },

  // ===== 梁类（3种）=====
  {
    definitionId: 4,
    type: 'beam_main',
    category: 'beam',
    name: '主梁',
    description: '主要水平承重构件',
    dimensions: { x: 4, y: 0.4, z: 0.3 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'left', localPosition: [-2, 0, 0], localDirection: [-1, 0, 0], type: 'tenon', matchSize: 0.25 },
      { id: 'right', localPosition: [2, 0, 0], localDirection: [1, 0, 0], type: 'tenon', matchSize: 0.25 },
      { id: 'center', localPosition: [0, 0, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.3 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['承重', '主要构件'],
  },
  {
    definitionId: 5,
    type: 'beam_cross',
    category: 'beam',
    name: '横梁',
    description: '横向连接梁',
    dimensions: { x: 3, y: 0.3, z: 0.25 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'left', localPosition: [-1.5, 0, 0], localDirection: [-1, 0, 0], type: 'tenon', matchSize: 0.2 },
      { id: 'right', localPosition: [1.5, 0, 0], localDirection: [1, 0, 0], type: 'tenon', matchSize: 0.2 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['承重', '连接'],
  },
  {
    definitionId: 6,
    type: 'beam_purlin',
    category: 'beam',
    name: '檩条',
    description: '支撑屋顶的梁',
    dimensions: { x: 3.5, y: 0.25, z: 0.2 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'left', localPosition: [-1.75, 0, 0], localDirection: [-1, 0, 0], type: 'tenon', matchSize: 0.15 },
      { id: 'right', localPosition: [1.75, 0, 0], localDirection: [1, 0, 0], type: 'tenon', matchSize: 0.15 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['承重', '屋顶'],
  },

  // ===== 屋顶类（3种）=====
  {
    definitionId: 7,
    type: 'roof_hipped',
    category: 'roof',
    name: '歇山顶',
    description: '四坡屋顶，等级较高',
    dimensions: { x: 4, y: 1.5, z: 4 },
    material: { type: 'tile', color: 0x2f4f4f, roughness: 0.7, metalness: 0 },
    snapPoints: [
      { id: 'bottom', localPosition: [0, -0.75, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.3 },
      { id: 'ridge', localPosition: [0, 0.75, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.2 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['屋顶', '高级'],
  },
  {
    definitionId: 8,
    type: 'roof_gable',
    category: 'roof',
    name: '悬山顶',
    description: '两面坡屋顶，最常见',
    dimensions: { x: 4, y: 1.2, z: 3 },
    material: { type: 'tile', color: 0x2f4f4f, roughness: 0.7, metalness: 0 },
    snapPoints: [
      { id: 'bottom', localPosition: [0, -0.6, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.3 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['屋顶', '常见'],
  },
  {
    definitionId: 9,
    type: 'roof_pyramidal',
    category: 'roof',
    name: '攒尖顶',
    description: '锥形屋顶，常用于亭阁',
    dimensions: { x: 3, y: 2, z: 3 },
    material: { type: 'tile', color: 0x2f4f4f, roughness: 0.7, metalness: 0 },
    snapPoints: [
      { id: 'bottom', localPosition: [0, -1, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.3 },
      { id: 'top', localPosition: [0, 1, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.15 },
    ],
    rotationConstraints: RC_PILLAR_ROUND, // 攒尖顶对称，Y自由
    era: ['song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['屋顶', '亭阁'],
  },

  // ===== 台基类（2种）=====
  {
    definitionId: 10,
    type: 'base_platform',
    category: 'base',
    name: '台基',
    description: '建筑基础平台',
    dimensions: { x: 6, y: 0.8, z: 5 },
    material: { type: 'stone', color: 0x808080, roughness: 0.9, metalness: 0 },
    snapPoints: [
      { id: 'top', localPosition: [0, 0.4, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.3 },
      { id: 'front', localPosition: [0, 0, 2.5], localDirection: [0, 0, 1], type: 'any' },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['基础', '主要构件'],
  },
  {
    definitionId: 11,
    type: 'base_stairs',
    category: 'base',
    name: '台阶',
    description: '台基台阶',
    dimensions: { x: 2, y: 0.6, z: 1.5 },
    material: { type: 'stone', color: 0x808080, roughness: 0.9, metalness: 0 },
    snapPoints: [
      { id: 'top', localPosition: [0, 0.3, -0.5], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.2 },
      { id: 'bottom', localPosition: [0, -0.3, 0.5], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.15 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['基础', '通道'],
  },

  // ===== 墙体类（1种）=====
  {
    definitionId: 12,
    type: 'wall_plain',
    category: 'wall',
    name: '实墙',
    description: '普通承重墙体',
    dimensions: { x: 3, y: 2.8, z: 0.3 },
    material: { type: 'brick', color: 0xa0522d, roughness: 0.85, metalness: 0 },
    snapPoints: [
      { id: 'top', localPosition: [0, 1.4, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.2 },
      { id: 'left', localPosition: [-1.5, 0, 0], localDirection: [-1, 0, 0], type: 'any' },
      { id: 'right', localPosition: [1.5, 0, 0], localDirection: [1, 0, 0], type: 'any' },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['围护', '承重'],
  },

  // ===== 门类（1种）=====
  {
    definitionId: 13,
    type: 'door_main',
    category: 'door',
    name: '大门',
    description: '主要出入口',
    dimensions: { x: 2, y: 2.5, z: 0.15 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'top', localPosition: [0, 1.25, 0], localDirection: [0, 1, 0], type: 'tenon', matchSize: 0.15 },
      { id: 'bottom', localPosition: [0, -1.25, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.15 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['出入口', '主要构件'],
  },

  // ===== 窗类（1种）=====
  {
    definitionId: 14,
    type: 'window_lattice',
    category: 'window',
    name: '花窗',
    description: '带花纹的窗户',
    dimensions: { x: 1, y: 1.2, z: 0.1 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'center', localPosition: [0, 0, 0], localDirection: [0, 0, 1], type: 'any' },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['采光', '装饰'],
  },

  // ===== 装饰类（4种）=====
  {
    definitionId: 15,
    type: 'decoration_dougong',
    category: 'decoration',
    name: '斗拱',
    description: '柱头与梁之间的过渡构件',
    dimensions: { x: 0.8, y: 0.5, z: 0.8 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'bottom', localPosition: [0, -0.25, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.3 },
      { id: 'top', localPosition: [0, 0.25, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.25 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['装饰', '结构', '高级'],
  },
  {
    definitionId: 16,
    type: 'decoration_ridge',
    category: 'decoration',
    name: '屋脊',
    description: '屋顶正脊装饰',
    dimensions: { x: 3, y: 0.4, z: 0.3 },
    material: { type: 'tile', color: 0xffd700, roughness: 0.7, metalness: 0 },
    snapPoints: [
      { id: 'center', localPosition: [0, 0, 0], localDirection: [0, 1, 0], type: 'tenon', matchSize: 0.2 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['装饰', '屋顶'],
  },
  {
    definitionId: 17,
    type: 'decoration_railing',
    category: 'decoration',
    name: '栏杆',
    description: '平台边缘栏杆',
    dimensions: { x: 2, y: 1, z: 0.15 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'bottom', localPosition: [0, -0.5, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.15 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['装饰', '围护'],
  },
  {
    definitionId: 18,
    type: 'decoration_bracket',
    category: 'decoration',
    name: '雀替',
    description: '柱头与梁之间的三角形装饰',
    dimensions: { x: 0.6, y: 0.4, z: 0.2 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'left', localPosition: [-0.3, 0, 0], localDirection: [-1, 0, 0], type: 'tenon', matchSize: 0.2 },
      { id: 'right', localPosition: [0.3, 0, 0], localDirection: [1, 0, 0], type: 'mortise', matchSize: 0.2 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['ming', 'qing'],
    complexity: 'medium',
    tags: ['装饰', '雕刻'],
  },

  // ===== 铺作（斗拱）构件 — 严格旋转约束 =====
  {
    definitionId: 19,
    type: 'bracket_ludou',
    category: 'bracket',
    name: '栌斗',
    description: '斗拱最底层的大斗，坐于柱头之上',
    dimensions: { x: 0.8, y: 0.5, z: 0.8 },
    material: { type: 'wood', color: 0x7a5e3d, roughness: 0.85, metalness: 0.05 },
    snapPoints: [
      { id: 'bottom', localPosition: [0, -0.25, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.6 },
      { id: 'top_hua', localPosition: [0, 0.25, 0], localDirection: [0, 1, 0], type: 'tenon', matchSize: 0.3 },
      { id: 'top_ni', localPosition: [0, 0.25, 0.2], localDirection: [0, 0, 1], type: 'tenon', matchSize: 0.3 },
      { id: 'top_gua', localPosition: [0.2, 0.25, 0], localDirection: [1, 0, 0], type: 'tenon', matchSize: 0.3 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['铺作', '斗拱', '基础'],
  },
  {
    definitionId: 20,
    type: 'bracket_hua',
    category: 'bracket',
    name: '华拱',
    description: '纵向出跳的承重拱，是斗拱中最主要的受力构件',
    dimensions: { x: 0.3, y: 0.2, z: 1.2 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'root', localPosition: [0, 0, -0.5], localDirection: [0, 0, -1], type: 'mortise', matchSize: 0.3 },
      { id: 'tip', localPosition: [0, 0, 0.5], localDirection: [0, 0, 1], type: 'tenon', matchSize: 0.3 },
      { id: 'inter', localPosition: [0, 0.1, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.3 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['铺作', '斗拱', '承重'],
  },
  {
    definitionId: 21,
    type: 'bracket_ling',
    category: 'bracket',
    name: '令拱',
    description: '最上层横向短拱，承托耍头与撩檐槫',
    dimensions: { x: 1.0, y: 0.18, z: 0.25 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'center', localPosition: [0, 0, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.3 },
      { id: 'left', localPosition: [-0.4, 0, 0], localDirection: [-1, 0, 0], type: 'tenon', matchSize: 0.25 },
      { id: 'right', localPosition: [0.4, 0, 0], localDirection: [1, 0, 0], type: 'tenon', matchSize: 0.25 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['铺作', '斗拱', '横向'],
  },
  {
    definitionId: 22,
    type: 'bracket_shuatou',
    category: 'bracket',
    name: '耍头',
    description: '斗拱最上层的纵向构件，出头如昂',
    dimensions: { x: 0.25, y: 0.3, z: 1.4 },
    material: { type: 'wood', color: 0x7a5e3d, roughness: 0.85, metalness: 0.05 },
    snapPoints: [
      { id: 'root', localPosition: [0, 0, -0.6], localDirection: [0, 0, -1], type: 'mortise', matchSize: 0.3 },
      { id: 'head', localPosition: [0, 0, 0.6], localDirection: [0, 0, 1], type: 'tenon', matchSize: 0.25 },
      { id: 'ling', localPosition: [0, -0.15, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.3 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['铺作', '斗拱', '顶部'],
  },
  {
    definitionId: 23,
    type: 'bracket_man',
    category: 'bracket',
    name: '慢拱',
    description: '中层横向长拱，连接里外跳',
    dimensions: { x: 1.6, y: 0.16, z: 0.22 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'center', localPosition: [0, 0, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.3 },
      { id: 'left', localPosition: [-0.6, 0, 0], localDirection: [-1, 0, 0], type: 'tenon', matchSize: 0.25 },
      { id: 'right', localPosition: [0.6, 0, 0], localDirection: [1, 0, 0], type: 'tenon', matchSize: 0.25 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['铺作', '斗拱', '横向'],
  },
  {
    definitionId: 24,
    type: 'bracket_guazi',
    category: 'bracket',
    name: '瓜子拱',
    description: '横向短拱，位于华拱之上',
    dimensions: { x: 0.8, y: 0.15, z: 0.2 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'center', localPosition: [0, 0, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.3 },
      { id: 'left', localPosition: [-0.3, 0, 0], localDirection: [-1, 0, 0], type: 'tenon', matchSize: 0.2 },
      { id: 'right', localPosition: [0.3, 0, 0], localDirection: [1, 0, 0], type: 'tenon', matchSize: 0.2 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['铺作', '斗拱', '短拱'],
  },
  {
    definitionId: 25,
    type: 'bracket_ni',
    category: 'bracket',
    name: '泥道拱',
    description: '纵向不出跳的短拱，与华拱垂直交叉',
    dimensions: { x: 0.2, y: 0.15, z: 0.8 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'center', localPosition: [0, 0, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.3 },
      { id: 'front', localPosition: [0, 0, 0.3], localDirection: [0, 0, 1], type: 'tenon', matchSize: 0.2 },
      { id: 'back', localPosition: [0, 0, -0.3], localDirection: [0, 0, -1], type: 'tenon', matchSize: 0.2 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'complex',
    tags: ['铺作', '斗拱', '纵向'],
  },
  {
    definitionId: 26,
    type: 'bracket_xiaang',
    category: 'bracket',
    name: '下昂',
    description: '斜向伸出的杠杆式构件，增加出跳距离',
    dimensions: { x: 0.2, y: 0.35, z: 1.8 },
    material: { type: 'wood', color: 0x7a5e3d, roughness: 0.85, metalness: 0.05 },
    snapPoints: [
      { id: 'root', localPosition: [0, 0.1, -0.8], localDirection: [0, 0.2425, -0.9701], type: 'mortise', matchSize: 0.3 },
      { id: 'tip', localPosition: [0, -0.1, 0.8], localDirection: [0, -0.2425, 0.9701], type: 'tenon', matchSize: 0.25 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song'],
    complexity: 'complex',
    tags: ['铺作', '斗拱', '昂'],
  },
  {
    definitionId: 27,
    type: 'bracket_timu',
    category: 'bracket',
    name: '替木',
    description: '横向短木，承托檩条，位于令拱之上',
    dimensions: { x: 1.2, y: 0.12, z: 0.2 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'center', localPosition: [0, 0, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.3 },
      { id: 'left', localPosition: [-0.5, 0, 0], localDirection: [-1, 0, 0], type: 'tenon', matchSize: 0.2 },
      { id: 'right', localPosition: [0.5, 0, 0], localDirection: [1, 0, 0], type: 'tenon', matchSize: 0.2 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['铺作', '斗拱', '承托'],
  },
];

export function getComponentByType(type: string): ComponentDefinition | undefined {
  return DEFAULT_COMPONENTS.find((c) => c.type === type);
}

export function getComponentsByCategory(category: string): ComponentDefinition[] {
  return DEFAULT_COMPONENTS.filter((c) => c.category === category);
}

export function getAllCategories(): { id: string; name: string; icon: string }[] {
  return [
    { id: 'pillar', name: '柱', icon: 'pillar' },
    { id: 'beam', name: '梁', icon: 'beam' },
    { id: 'roof', name: '屋顶', icon: 'roof' },
    { id: 'base', name: '台基', icon: 'base' },
    { id: 'wall', name: '墙体', icon: 'wall' },
    { id: 'door', name: '门', icon: 'door' },
    { id: 'window', name: '窗', icon: 'window' },
    { id: 'decoration', name: '装饰', icon: 'decoration' },
    { id: 'bracket', name: '铺作', icon: 'bracket' },
  ];
}

export function createSceneComponent(def: ComponentDefinition, position?: { x: number; y: number; z: number }): SceneComponent {
  return {
    uuid: crypto.randomUUID(),
    definitionId: def.definitionId,
    type: def.type,
    category: def.category,
    name: def.name,
    position: position || { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    material: { ...def.material },
    visible: true,
    locked: false,
    snapPoints: def.snapPoints.map((sp) => ({ ...sp })),
    rotationConstraints: def.rotationConstraints.map((rc) => ({ ...rc })),
  } as SceneComponent;
}

export const MATERIAL_PRESETS = [
  { id: 'wood', name: '木材', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
  { id: 'stone', name: '石材', color: 0x808080, roughness: 0.9, metalness: 0 },
  { id: 'brick', name: '砖', color: 0xa0522d, roughness: 0.85, metalness: 0 },
  { id: 'earth', name: '土', color: 0x8b7355, roughness: 0.95, metalness: 0 },
  { id: 'metal', name: '金属', color: 0xb5a642, roughness: 0.3, metalness: 0.8 },
  { id: 'tile', name: '瓦', color: 0x2f4f4f, roughness: 0.7, metalness: 0 },
];