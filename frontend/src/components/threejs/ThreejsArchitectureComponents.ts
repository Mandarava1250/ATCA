// ============================================
// 筑见山河 - 传统构件定义 (ArchitectureComponents)
// 支持：几何形状、榫卯连接点(localPosition+localDirection)、旋转约束
// ============================================

import type { SceneComponent } from './ThreejsSceneManager';
import type { SnapPoint, RotationConstraint } from './ThreejsMortiseTenonSnapEngine';
import { generateUUID } from '../../utils/uuid';

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
// ============================================
// 中国古建筑文化信息
// ============================================
export interface CulturalInfo {
  era: string[];
  region: string[];
  description: string;
  culturalBackground: string;
  usage: string;
}

// ============================================
// 构件库扩展 - 中国古建筑特有构件
// ============================================
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

  // ===== 屋顶瓦片类（新增中国古建筑特有）=====
  {
    definitionId: 28,
    type: 'roof_glazed_gray',
    category: 'roof',
    name: '青灰琉璃瓦',
    description: '传统青灰色琉璃瓦，常用于普通建筑屋顶',
    dimensions: { x: 0.4, y: 0.05, z: 0.3 },
    material: { type: 'glazed_tile', color: 0x4a4a4a, roughness: 0.3, metalness: 0.1 },
    snapPoints: [
      { id: 'top', localPosition: [0, 0.025, 0], localDirection: [0, 1, 0], type: 'any' },
      { id: 'bottom', localPosition: [0, -0.025, 0], localDirection: [0, -1, 0], type: 'any' },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['ming', 'qing'],
    complexity: 'simple',
    tags: ['屋顶', '瓦片', '琉璃'],
  },
  {
    definitionId: 29,
    type: 'roof_glazed_yellow',
    category: 'roof',
    name: '黄琉璃瓦',
    description: '金黄色琉璃瓦，皇家专用，等级最高',
    dimensions: { x: 0.4, y: 0.05, z: 0.3 },
    material: { type: 'glazed_tile', color: 0xffd700, roughness: 0.2, metalness: 0.2 },
    snapPoints: [
      { id: 'top', localPosition: [0, 0.025, 0], localDirection: [0, 1, 0], type: 'any' },
      { id: 'bottom', localPosition: [0, -0.025, 0], localDirection: [0, -1, 0], type: 'any' },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['ming', 'qing'],
    complexity: 'simple',
    tags: ['屋顶', '瓦片', '琉璃', '皇家'],
  },
  {
    definitionId: 30,
    type: 'roof_glazed_green',
    category: 'roof',
    name: '绿琉璃瓦',
    description: '绿色琉璃瓦，用于王府、庙宇等建筑',
    dimensions: { x: 0.4, y: 0.05, z: 0.3 },
    material: { type: 'glazed_tile', color: 0x228b22, roughness: 0.25, metalness: 0.15 },
    snapPoints: [
      { id: 'top', localPosition: [0, 0.025, 0], localDirection: [0, 1, 0], type: 'any' },
      { id: 'bottom', localPosition: [0, -0.025, 0], localDirection: [0, -1, 0], type: 'any' },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['ming', 'qing'],
    complexity: 'simple',
    tags: ['屋顶', '瓦片', '琉璃', '王府'],
  },
  {
    definitionId: 31,
    type: 'roof_wadang',
    category: 'roof',
    name: '瓦当',
    description: '屋檐端头上的圆形装饰构件，刻有吉祥图案',
    dimensions: { x: 0.25, y: 0.03, z: 0.25 },
    material: { type: 'glazed_tile', color: 0xffd700, roughness: 0.2, metalness: 0.2 },
    snapPoints: [
      { id: 'back', localPosition: [0, 0, -0.125], localDirection: [0, 0, -1], type: 'tenon', matchSize: 0.1 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['屋顶', '装饰', '瓦当'],
  },
  {
    definitionId: 32,
    type: 'roof_dishui',
    category: 'roof',
    name: '滴水',
    description: '屋檐边缘的三角形瓦片，引导雨水滴落',
    dimensions: { x: 0.3, y: 0.04, z: 0.4 },
    material: { type: 'glazed_tile', color: 0x4a4a4a, roughness: 0.3, metalness: 0.1 },
    snapPoints: [
      { id: 'back', localPosition: [0, 0, -0.2], localDirection: [0, 0, -1], type: 'tenon', matchSize: 0.1 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'simple',
    tags: ['屋顶', '排水', '滴水'],
  },

  // ===== 榫卯结构构件（新增中国古建筑特有）=====
  {
    definitionId: 33,
    type: 'mortise_dou',
    category: 'mortise',
    name: '斗榫',
    description: '方形榫眼，用于梁架节点连接',
    dimensions: { x: 0.2, y: 0.15, z: 0.2 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'inner', localPosition: [0, 0, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.15 },
      { id: 'outer', localPosition: [0, -0.075, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.18 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['榫卯', '连接', '节点'],
  },
  {
    definitionId: 34,
    type: 'mortise_mao',
    category: 'mortise',
    name: '卯眼',
    description: '圆形榫眼，用于柱子与梁的连接',
    dimensions: { x: 0.25, y: 0.2, z: 0.25 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'inner', localPosition: [0, 0, 0], localDirection: [0, 1, 0], type: 'mortise', matchSize: 0.2 },
      { id: 'outer', localPosition: [0, -0.1, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.22 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['榫卯', '连接', '节点'],
  },
  {
    definitionId: 35,
    type: 'mortise_sunmao',
    category: 'mortise',
    name: '榫卯套',
    description: '成套榫卯连接件，包含榫头和卯眼',
    dimensions: { x: 0.4, y: 0.3, z: 0.4 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'male', localPosition: [0, 0.15, 0], localDirection: [0, 1, 0], type: 'tenon', matchSize: 0.18 },
      { id: 'female', localPosition: [0, -0.15, 0], localDirection: [0, -1, 0], type: 'mortise', matchSize: 0.18 },
    ],
    rotationConstraints: RC_STRICT,
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['榫卯', '连接', '成套'],
  },

  // ===== 装饰构件（新增）=====
  {
    definitionId: 36,
    type: 'decoration_dragon',
    category: 'decoration',
    name: '龙纹装饰',
    description: '雕刻龙纹的装饰构件，用于重要建筑',
    dimensions: { x: 1, y: 0.4, z: 0.2 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.7, metalness: 0.15 },
    snapPoints: [
      { id: 'mount', localPosition: [0, -0.2, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.15 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['ming', 'qing'],
    complexity: 'complex',
    tags: ['装饰', '雕刻', '龙纹', '皇家'],
  },
  {
    definitionId: 37,
    type: 'decoration_lotus',
    category: 'decoration',
    name: '莲花纹',
    description: '莲花图案装饰，常用于佛教建筑',
    dimensions: { x: 0.6, y: 0.3, z: 0.15 },
    material: { type: 'stone', color: 0x9ca3af, roughness: 0.85, metalness: 0 },
    snapPoints: [
      { id: 'mount', localPosition: [0, -0.15, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.12 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    complexity: 'medium',
    tags: ['装饰', '雕刻', '佛教', '莲花'],
  },
  {
    definitionId: 38,
    type: 'decoration_peony',
    category: 'decoration',
    name: '牡丹纹',
    description: '牡丹花卉雕刻，象征富贵吉祥',
    dimensions: { x: 0.5, y: 0.35, z: 0.12 },
    material: { type: 'wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1 },
    snapPoints: [
      { id: 'mount', localPosition: [0, -0.175, 0], localDirection: [0, -1, 0], type: 'tenon', matchSize: 0.1 },
    ],
    rotationConstraints: RC_VERTICAL,
    era: ['ming', 'qing'],
    complexity: 'medium',
    tags: ['装饰', '雕刻', '花卉', '吉祥'],
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
    uuid: generateUUID(),
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

// ============================================
// 中国古建筑风格材质预设库
// ============================================
export interface MaterialPreset {
  id: string;
  name: string;
  nameEn: string;
  color: number;
  roughness: number;
  metalness: number;
  category: string;
  description: string;
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  // ===== 木材类 =====
  { id: 'wood_yellow', name: '黄杨木', nameEn: 'Boxwood', color: 0xd4a574, roughness: 0.75, metalness: 0.05, category: 'wood', description: '淡黄色木材，纹理细腻' },
  { id: 'wood_red', name: '红木', nameEn: 'Rosewood', color: 0x8b3a3a, roughness: 0.7, metalness: 0.1, category: 'wood', description: '深红色硬木，常用于高档家具' },
  { id: 'wood_cypress', name: '柏木', nameEn: 'Cypress', color: 0x6b4423, roughness: 0.8, metalness: 0.05, category: 'wood', description: '淡褐色木材，有芳香' },
  { id: 'wood_pine', name: '松木', nameEn: 'Pine', color: 0xc9a962, roughness: 0.85, metalness: 0.03, category: 'wood', description: '淡黄色软木，纹理清晰' },
  { id: 'wood_elm', name: '榆木', nameEn: 'Elm', color: 0x8b6914, roughness: 0.78, metalness: 0.05, category: 'wood', description: '灰褐色硬木，耐久性强' },
  
  // ===== 石材类 =====
  { id: 'stone_white', name: '汉白玉', nameEn: 'White Marble', color: 0xf5f5f5, roughness: 0.6, metalness: 0.05, category: 'stone', description: '白色大理石，皇家建筑常用' },
  { id: 'stone_gray', name: '青石板', nameEn: 'Gray Slate', color: 0x696969, roughness: 0.85, metalness: 0.02, category: 'stone', description: '青灰色石板，用于地面铺设' },
  { id: 'stone_sand', name: '砂岩', nameEn: 'Sandstone', color: 0xc2b280, roughness: 0.9, metalness: 0, category: 'stone', description: '黄色砂岩，质地细腻' },
  { id: 'stone_limestone', name: '石灰岩', nameEn: 'Limestone', color: 0xd4c4a8, roughness: 0.85, metalness: 0.02, category: 'stone', description: '灰白色石灰岩' },
  
  // ===== 砖瓦类 =====
  { id: 'brick_red', name: '青砖', nameEn: 'Gray Brick', color: 0x4a4a4a, roughness: 0.85, metalness: 0, category: 'brick', description: '青灰色传统砖块' },
  { id: 'brick_yellow', name: '金砖', nameEn: 'Golden Brick', color: 0xcd853f, roughness: 0.8, metalness: 0.05, category: 'brick', description: '黄色地砖，宫廷专用' },
  { id: 'tile_gray', name: '青灰瓦', nameEn: 'Gray Tile', color: 0x4a4a4a, roughness: 0.7, metalness: 0.05, category: 'tile', description: '传统青灰色瓦片' },
  { id: 'tile_yellow', name: '黄琉璃瓦', nameEn: 'Yellow Glazed', color: 0xffd700, roughness: 0.25, metalness: 0.2, category: 'tile', description: '金黄色琉璃瓦，皇家专用' },
  { id: 'tile_green', name: '绿琉璃瓦', nameEn: 'Green Glazed', color: 0x228b22, roughness: 0.25, metalness: 0.15, category: 'tile', description: '绿色琉璃瓦，王府庙宇使用' },
  { id: 'tile_blue', name: '蓝琉璃瓦', nameEn: 'Blue Glazed', color: 0x4169e1, roughness: 0.25, metalness: 0.15, category: 'tile', description: '蓝色琉璃瓦' },
  
  // ===== 金属类 =====
  { id: 'metal_gold', name: '鎏金', nameEn: 'Gilded', color: 0xffd700, roughness: 0.15, metalness: 0.95, category: 'metal', description: '表面鎏金，金碧辉煌' },
  { id: 'metal_bronze', name: '青铜', nameEn: 'Bronze', color: 0xcd7f32, roughness: 0.4, metalness: 0.6, category: 'metal', description: '青褐色铜合金' },
  { id: 'metal_iron', name: '铁', nameEn: 'Iron', color: 0x4a4a4a, roughness: 0.7, metalness: 0.5, category: 'metal', description: '深灰色铁' },
  { id: 'metal_silver', name: '银', nameEn: 'Silver', color: 0xc0c0c0, roughness: 0.1, metalness: 0.9, category: 'metal', description: '银白色金属' },
  
  // ===== 彩绘类 =====
  { id: 'paint_red', name: '朱红', nameEn: 'Vermilion', color: 0xcc0000, roughness: 0.3, metalness: 0.1, category: 'paint', description: '鲜艳的红色彩绘' },
  { id: 'paint_gold', name: '描金', nameEn: 'Gold Paint', color: 0xffd700, roughness: 0.2, metalness: 0.8, category: 'paint', description: '金色描边彩绘' },
  { id: 'paint_green', name: '石绿', nameEn: 'Malachite', color: 0x228b22, roughness: 0.4, metalness: 0.05, category: 'paint', description: '石绿色彩绘' },
  { id: 'paint_blue', name: '石青', nameEn: 'Azurite', color: 0x1e90ff, roughness: 0.35, metalness: 0.05, category: 'paint', description: '石青色彩绘' },
  { id: 'paint_white', name: '粉白', nameEn: 'Whitewash', color: 0xfffaf0, roughness: 0.7, metalness: 0, category: 'paint', description: '白色粉刷' },
  
  // ===== 特殊材质 =====
  { id: 'wood', name: '木材', nameEn: 'Wood', color: 0x8b6e4d, roughness: 0.8, metalness: 0.1, category: 'wood', description: '标准木材材质' },
  { id: 'stone', name: '石材', nameEn: 'Stone', color: 0x808080, roughness: 0.9, metalness: 0, category: 'stone', description: '标准石材材质' },
  { id: 'brick', name: '砖', nameEn: 'Brick', color: 0xa0522d, roughness: 0.85, metalness: 0, category: 'brick', description: '标准砖材质' },
  { id: 'earth', name: '土', nameEn: 'Earth', color: 0x8b7355, roughness: 0.95, metalness: 0, category: 'earth', description: '泥土材质' },
  { id: 'metal', name: '金属', nameEn: 'Metal', color: 0xb5a642, roughness: 0.3, metalness: 0.8, category: 'metal', description: '标准金属材质' },
  { id: 'tile', name: '瓦', nameEn: 'Tile', color: 0x2f4f4f, roughness: 0.7, metalness: 0, category: 'tile', description: '标准瓦材质' },
];

// ============================================
// 中国古建筑文化背景说明系统
// ============================================
export interface CulturalBackground {
  id: string;
  componentType: string;
  era: string[];
  region: string[];
  description: string;
  culturalSignificance: string;
  constructionMethod: string;
  historicalContext: string;
  relatedComponents: string[];
}

export const CULTURAL_BACKGROUNDS: CulturalBackground[] = [
  // 斗拱文化背景
  {
    id: 'dougong',
    componentType: 'decoration_dougong',
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    region: ['华北', '中原'],
    description: '斗拱是中国古建筑特有的结构构件，位于柱头与梁架之间，起到承重和装饰的双重作用。',
    culturalSignificance: '斗拱不仅是结构构件，更是中国古代建筑等级制度的象征，只有高等级的宫殿、庙宇才能使用复杂的斗拱。',
    constructionMethod: '斗拱由斗、拱、昂等部件组成，通过榫卯连接，不用一钉一铆。宋代《营造法式》对斗拱有详细的规制。',
    historicalContext: '斗拱最早出现于战国时期，到唐代发展成熟，宋代达到巅峰，明清时期逐渐简化。',
    relatedComponents: ['bracket_ludou', 'bracket_hua', 'bracket_ling', 'bracket_shuatou'],
  },
  // 榫卯文化背景
  {
    id: 'sunmao',
    componentType: 'mortise_sunmao',
    era: ['han', 'tang', 'song', 'yuan', 'ming', 'qing'],
    region: ['全国'],
    description: '榫卯是中国古代建筑和家具的核心连接方式，通过凸榫和凹卯的精密配合实现牢固连接。',
    culturalSignificance: '榫卯结构体现了中国传统"天人合一"的哲学思想，不用金属连接件，完全依靠木材本身的结构力。',
    constructionMethod: '榫卯种类繁多，常见的有燕尾榫、粽角榫、格肩榫等，每种榫卯都有特定的用途和加工方法。',
    historicalContext: '榫卯技术可以追溯到7000年前的河姆渡文化，是中国传统木工技艺的精髓。',
    relatedComponents: ['mortise_dou', 'mortise_mao'],
  },
  // 琉璃瓦文化背景
  {
    id: 'liuliwa',
    componentType: 'roof_glazed_yellow',
    era: ['ming', 'qing'],
    region: ['华北'],
    description: '琉璃瓦是中国古建筑屋顶的重要材料，表面覆盖彩色釉层，具有防水和装饰双重功能。',
    culturalSignificance: '黄色琉璃瓦是皇家专用，象征皇权至高无上；绿色用于王府和庙宇；蓝色用于祭祀建筑。',
    constructionMethod: '琉璃瓦采用二次烧成工艺，先烧素坯，再施釉烧制，釉料中含有金属氧化物呈现不同颜色。',
    historicalContext: '琉璃瓦最早出现于北魏时期，明清时期达到鼎盛，成为宫殿建筑的标志性元素。',
    relatedComponents: ['roof_glazed_gray', 'roof_glazed_green', 'roof_wadang', 'roof_dishui'],
  },
  // 斗拱铺作文化背景
  {
    id: 'bracket',
    componentType: 'bracket_ludou',
    era: ['tang', 'song', 'yuan', 'ming', 'qing'],
    region: ['华北', '西北'],
    description: '铺作是宋代对斗拱组合的称呼，是中国古代建筑中最复杂、最精巧的结构体系。',
    culturalSignificance: '铺作的层数和出跳数是建筑等级的重要标志，体现了中国古代建筑的标准化和模数化思想。',
    constructionMethod: '宋代《营造法式》规定了铺作的严格规制，包括材、契、分等模数单位。',
    historicalContext: '唐代铺作宏大有力，宋代铺作精巧华丽，明清铺作逐渐程式化。',
    relatedComponents: ['bracket_hua', 'bracket_ling', 'bracket_man', 'bracket_xiaang'],
  },
];

export function getCulturalBackground(componentType: string): CulturalBackground | undefined {
  return CULTURAL_BACKGROUNDS.find(cb => cb.componentType === componentType);
}

export function getCulturalBackgroundById(id: string): CulturalBackground | undefined {
  return CULTURAL_BACKGROUNDS.find(cb => cb.id === id);
}