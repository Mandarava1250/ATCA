// ============================================
// 华夏营造 - LOD (Level of Detail) 分级渲染系统
// 根据构件与相机距离动态调整模型精度
// 目标: 在保持画面质量的前提下降低GPU负载30%以上
// ============================================

import * as THREE from 'three';

export interface LODLevel {
  distance: number;      // 切换距离阈值
  mesh: THREE.Mesh;      // 该级别的网格
  visible: boolean;      // 是否可见
}

export interface LODConfig {
  levels: LODLevel[];
  currentLevel: number;
  updateInterval: number; // 更新间隔（毫秒）
}

/**
 * LOD管理器 - 管理单个构件的多级细节
 */
export class LODManager {
  private levels: LODLevel[] = [];
  private currentLevel = 0;
  private lastUpdate = 0;
  private updateInterval = 100; // 100ms更新一次
  private object: THREE.Object3D | null = null;

  constructor(object: THREE.Object3D, updateInterval = 100) {
    this.object = object;
    this.updateInterval = updateInterval;
  }

  /**
   * 添加LOD级别
   * @param distance 切换距离
   * @param mesh 该级别的网格
   */
  addLevel(distance: number, mesh: THREE.Mesh): void {
    this.levels.push({ distance, mesh, visible: false });
    // 按距离排序
    this.levels.sort((a, b) => a.distance - b.distance);
  }

  /**
   * 根据相机位置更新LOD级别
   */
  update(cameraPosition: THREE.Vector3): boolean {
    const now = Date.now();
    if (now - this.lastUpdate < this.updateInterval) {
      return false;
    }
    this.lastUpdate = now;

    if (!this.object || this.levels.length === 0) return false;

    // 计算与相机的距离
    const objectPosition = new THREE.Vector3();
    this.object.getWorldPosition(objectPosition);
    const distance = objectPosition.distanceTo(cameraPosition);

    // 确定应该显示的LOD级别
    let newLevel = this.levels.length - 1;
    for (let i = 0; i < this.levels.length; i++) {
      if (distance < this.levels[i].distance) {
        newLevel = i;
        break;
      }
    }

    // 如果级别变化，更新可见性
    if (newLevel !== this.currentLevel) {
      this.setLevel(newLevel);
      return true;
    }

    return false;
  }

  /**
   * 设置当前LOD级别
   */
  private setLevel(level: number): void {
    if (level < 0 || level >= this.levels.length) return;

    // 隐藏所有级别
    for (const lodLevel of this.levels) {
      lodLevel.mesh.visible = false;
      lodLevel.visible = false;
    }

    // 显示当前级别
    this.levels[level].mesh.visible = true;
    this.levels[level].visible = true;
    this.currentLevel = level;
  }

  /**
   * 获取当前LOD级别
   */
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  /**
   * 获取LOD级别数量
   */
  getLevelCount(): number {
    return this.levels.length;
  }

  /**
   * 销毁LOD管理器
   */
  dispose(): void {
    for (const level of this.levels) {
      level.mesh.geometry?.dispose();
      if (level.mesh.material) {
        if (Array.isArray(level.mesh.material)) {
          level.mesh.material.forEach(m => m.dispose());
        } else {
          level.mesh.material.dispose();
        }
      }
    }
    this.levels = [];
    this.object = null;
  }
}

/**
 * LOD系统 - 管理场景中所有构件的LOD
 */
export class LODSystem {
  private lodManagers: Map<string, LODManager> = new Map();
  private camera: THREE.Camera | null = null;
  private enabled = true;
  private lastFullUpdate = 0;
  private fullUpdateInterval = 500; // 500ms全量更新一次

  // LOD距离配置
  private readonly LOD_DISTANCES = {
    HIGH: 10,    // 10米内使用高精度
    MEDIUM: 30,  // 30米内使用中精度
    LOW: 100,    // 100米内使用低精度
  };

  /**
   * 设置相机引用
   */
  setCamera(camera: THREE.Camera): void {
    this.camera = camera;
  }

  /**
   * 为构件创建LOD级别
   * @param uuid 构件UUID
   * @param highDetailMesh 高精度网格
   */
  createLODForComponent(uuid: string, highDetailMesh: THREE.Mesh): LODManager {
    const lodManager = new LODManager(highDetailMesh);

    // 高精度级别（原始网格）
    lodManager.addLevel(this.LOD_DISTANCES.HIGH, highDetailMesh);

    // 中精度级别（简化网格）
    const mediumMesh = this.createSimplifiedMesh(highDetailMesh, 0.5);
    lodManager.addLevel(this.LOD_DISTANCES.MEDIUM, mediumMesh);

    // 低精度级别（最简化网格）
    const lowMesh = this.createSimplifiedMesh(highDetailMesh, 0.2);
    lodManager.addLevel(this.LOD_DISTANCES.LOW, lowMesh);

    this.lodManagers.set(uuid, lodManager);
    return lodManager;
  }

  /**
   * 创建简化版本的网格
   * @param originalMesh 原始网格
   * @param detailFactor 细节因子 (0-1)
   */
  private createSimplifiedMesh(originalMesh: THREE.Mesh, detailFactor: number): THREE.Mesh {
    // 克隆几何体
    let geometry: THREE.BufferGeometry;
    
    if (originalMesh.geometry) {
      // 使用简化的几何体
      geometry = this.simplifyGeometry(originalMesh.geometry, detailFactor);
    } else {
      // 创建简单的盒体作为占位
      const box = new THREE.Box3().setFromObject(originalMesh);
      const size = new THREE.Vector3();
      box.getSize(size);
      geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    }

    // 克隆材质（简化版本）
    const material = this.createSimplifiedMaterial(originalMesh.material);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(originalMesh.position);
    mesh.rotation.copy(originalMesh.rotation);
    mesh.scale.copy(originalMesh.scale);
    mesh.visible = false; // 默认隐藏

    return mesh;
  }

  /**
   * 简化几何体
   */
  private simplifyGeometry(
    geometry: THREE.BufferGeometry,
    detailFactor: number
  ): THREE.BufferGeometry {
    // 对于简单几何体，直接返回
    if (geometry.attributes.position.count < 100) {
      return geometry.clone();
    }

    // 使用顶点抽取简化
    const positions = geometry.attributes.position.array;
    const vertexCount = Math.floor(positions.length / 3 * detailFactor);
    
    // 创建简化的几何体
    const simplifiedGeometry = new THREE.BufferGeometry();
    const newPositions = new Float32Array(vertexCount * 3);
    
    // 均匀采样顶点
    const step = Math.floor(positions.length / 3 / vertexCount);
    let newIndex = 0;
    for (let i = 0; i < positions.length && newIndex < vertexCount * 3; i += step * 3) {
      newPositions[newIndex++] = positions[i];
      newPositions[newIndex++] = positions[i + 1];
      newPositions[newIndex++] = positions[i + 2];
    }

    simplifiedGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    
    // 如果有法线，也进行简化
    if (geometry.attributes.normal) {
      const normals = geometry.attributes.normal.array;
      const newNormals = new Float32Array(vertexCount * 3);
      let normalIndex = 0;
      for (let i = 0; i < normals.length && normalIndex < vertexCount * 3; i += step * 3) {
        newNormals[normalIndex++] = normals[i];
        newNormals[normalIndex++] = normals[i + 1];
        newNormals[normalIndex++] = normals[i + 2];
      }
      simplifiedGeometry.setAttribute('normal', new THREE.BufferAttribute(newNormals, 3));
    }

    return simplifiedGeometry;
  }

  /**
   * 创建简化版本的材质
   */
  private createSimplifiedMaterial(
    originalMaterial: THREE.Material | THREE.Material[]
  ): THREE.Material {
    const sourceMaterial = Array.isArray(originalMaterial) ? originalMaterial[0] : originalMaterial;
    
    // 创建简化的MeshLambertMaterial（比MeshStandardMaterial更轻量）
    const simplifiedMaterial = new THREE.MeshLambertMaterial({
      color: (sourceMaterial as any).color || 0xcccccc,
      transparent: (sourceMaterial as any).transparent || false,
      opacity: (sourceMaterial as any).opacity || 1,
    });

    return simplifiedMaterial;
  }

  /**
   * 更新所有LOD管理器
   */
  update(): void {
    if (!this.enabled || !this.camera) return;

    const cameraPosition = new THREE.Vector3();
    this.camera.getWorldPosition(cameraPosition);

    const now = Date.now();
    const isFullUpdate = now - this.lastFullUpdate > this.fullUpdateInterval;

    for (const lodManager of this.lodManagers.values()) {
      lodManager.update(cameraPosition);
    }

    if (isFullUpdate) {
      this.lastFullUpdate = now;
    }
  }

  /**
   * 移除构件的LOD管理
   */
  removeComponent(uuid: string): void {
    const lodManager = this.lodManagers.get(uuid);
    if (lodManager) {
      lodManager.dispose();
      this.lodManagers.delete(uuid);
    }
  }

  /**
   * 清空所有LOD管理
   */
  clear(): void {
    for (const lodManager of this.lodManagers.values()) {
      lodManager.dispose();
    }
    this.lodManagers.clear();
  }

  /**
   * 启用/禁用LOD系统
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 获取LOD系统状态
   */
  getStats(): { totalComponents: number; levelDistribution: number[] } {
    const levelDistribution = [0, 0, 0];
    
    for (const lodManager of this.lodManagers.values()) {
      const level = lodManager.getCurrentLevel();
      if (level < levelDistribution.length) {
        levelDistribution[level]++;
      }
    }

    return {
      totalComponents: this.lodManagers.size,
      levelDistribution,
    };
  }

  /**
   * 销毁LOD系统
   */
  dispose(): void {
    this.clear();
    this.camera = null;
  }
}

/**
 * 全局LOD系统实例
 */
export const lodSystem = new LODSystem();