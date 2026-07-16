// ============================================
// 华夏营造 - 空间索引系统 (Spatial Index)
// 用于优化碰撞检测和重力计算的性能
// 使用 BVH (Bounding Volume Hierarchy) 实现 O(n log n) 复杂度
// ============================================

import * as THREE from 'three';

export interface BoundingBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
}

export interface SpatialObject {
  uuid: string;
  boundingBox: BoundingBox;
  mesh?: THREE.Mesh;
}

interface BVHNode {
  boundingBox: BoundingBox;
  objects: SpatialObject[];
  left: BVHNode | null;
  right: BVHNode | null;
  depth: number;
}

/**
 * BVH空间索引 - 用于加速碰撞检测和支撑面查找
 * 时间复杂度: 构建 O(n log n), 查询 O(log n + k)
 */
export class SpatialIndex {
  private root: BVHNode | null = null;
  private objects: Map<string, SpatialObject> = new Map();
  private readonly MAX_OBJECTS_PER_NODE = 8;
  private readonly MAX_DEPTH = 20;
  private isDirty = true;

  /**
   * 添加或更新空间对象
   */
  addOrUpdate(uuid: string, mesh: THREE.Mesh): void {
    const boundingBox = this.computeBoundingBox(mesh);
    const obj: SpatialObject = { uuid, boundingBox, mesh };
    this.objects.set(uuid, obj);
    this.isDirty = true;
  }

  /**
   * 移除空间对象
   */
  remove(uuid: string): void {
    this.objects.delete(uuid);
    this.isDirty = true;
  }

  /**
   * 清空所有对象
   */
  clear(): void {
    this.objects.clear();
    this.root = null;
    this.isDirty = true;
  }

  /**
   * 更新索引（在查询前调用）
   */
  update(): void {
    if (!this.isDirty && this.root) return;
    this.buildBVH();
    this.isDirty = false;
  }

  /**
   * 构建BVH树
   */
  private buildBVH(): void {
    const objects = Array.from(this.objects.values());
    if (objects.length === 0) {
      this.root = null;
      return;
    }
    this.root = this.buildNode(objects, 0);
  }

  /**
   * 递归构建BVH节点
   */
  private buildNode(objects: SpatialObject[], depth: number): BVHNode {
    const boundingBox = this.computeEnclosingBox(objects);

    // 叶子节点条件
    if (objects.length <= this.MAX_OBJECTS_PER_NODE || depth >= this.MAX_DEPTH) {
      return {
        boundingBox,
        objects,
        left: null,
        right: null,
        depth,
      };
    }

    // 选择分割轴（基于包围盒最长轴）
    const extent = new THREE.Vector3().subVectors(boundingBox.max, boundingBox.min);
    let axis: 'x' | 'y' | 'z' = 'x';
    if (extent.y > extent.x && extent.y > extent.z) axis = 'y';
    else if (extent.z > extent.x && extent.z > extent.y) axis = 'z';

    // 按分割轴排序
    objects.sort((a, b) => a.boundingBox.center[axis] - b.boundingBox.center[axis]);

    // 分割对象
    const mid = Math.floor(objects.length / 2);
    const leftObjects = objects.slice(0, mid);
    const rightObjects = objects.slice(mid);

    return {
      boundingBox,
      objects: [],
      left: this.buildNode(leftObjects, depth + 1),
      right: this.buildNode(rightObjects, depth + 1),
      depth,
    };
  }

  /**
   * 查询与给定包围盒碰撞的所有对象
   * 时间复杂度: O(log n + k), k为结果数量
   */
  queryCollisions(queryBox: BoundingBox, excludeUuid?: string): SpatialObject[] {
    this.update();
    if (!this.root) return [];

    const results: SpatialObject[] = [];
    this.queryNode(this.root, queryBox, excludeUuid, results);
    return results;
  }

  /**
   * 递归查询BVH节点
   */
  private queryNode(
    node: BVHNode,
    queryBox: BoundingBox,
    excludeUuid: string | undefined,
    results: SpatialObject[]
  ): void {
    // 检查包围盒是否相交
    if (!this.boxIntersects(queryBox, node.boundingBox)) {
      return;
    }

    // 叶子节点：检查所有对象
    if (node.objects.length > 0) {
      for (const obj of node.objects) {
        if (obj.uuid === excludeUuid) continue;
        if (this.boxIntersects(queryBox, obj.boundingBox)) {
          results.push(obj);
        }
      }
      return;
    }

    // 递归查询子节点
    if (node.left) this.queryNode(node.left, queryBox, excludeUuid, results);
    if (node.right) this.queryNode(node.right, queryBox, excludeUuid, results);
  }

  /**
   * 查找指定位置下方的支撑面
   * 用于重力计算优化
   */
  findSupportBelow(
    position: THREE.Vector3,
    bottomY: number,
    tolerance: number = 0.1
  ): { uuid: string; topY: number } | null {
    this.update();
    if (!this.root) return null;

    let bestSupport: { uuid: string; topY: number } | null = null;

    // 创建查询区域（向下搜索）
    const queryBox: BoundingBox = {
      min: new THREE.Vector3(position.x - 0.5, bottomY - 10, position.z - 0.5),
      max: new THREE.Vector3(position.x + 0.5, bottomY - tolerance, position.z + 0.5),
      center: new THREE.Vector3(position.x, bottomY - 5, position.z),
    };

    const candidates: SpatialObject[] = [];
    this.queryNode(this.root, queryBox, undefined, candidates);

    for (const obj of candidates) {
      const topY = obj.boundingBox.max.y;
      // 检查是否在支撑范围内
      if (
        topY <= bottomY &&
        topY > (bestSupport?.topY ?? -Infinity) &&
        this.isPointAboveBox(position, obj.boundingBox)
      ) {
        bestSupport = { uuid: obj.uuid, topY };
      }
    }

    return bestSupport;
  }

  /**
   * 检查点是否在包围盒的XZ平面上方
   */
  private isPointAboveBox(point: THREE.Vector3, box: BoundingBox): boolean {
    return (
      point.x >= box.min.x &&
      point.x <= box.max.x &&
      point.z >= box.min.z &&
      point.z <= box.max.z
    );
  }

  /**
   * 检查两个包围盒是否相交
   */
  private boxIntersects(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.min.x <= b.max.x &&
      a.max.x >= b.min.x &&
      a.min.y <= b.max.y &&
      a.max.y >= b.min.y &&
      a.min.z <= b.max.z &&
      a.max.z >= b.min.z
    );
  }

  /**
   * 计算Mesh的包围盒
   */
  private computeBoundingBox(mesh: THREE.Mesh): BoundingBox {
    const box = new THREE.Box3().setFromObject(mesh);
    return {
      min: box.min.clone(),
      max: box.max.clone(),
      center: box.getCenter(new THREE.Vector3()),
    };
  }

  /**
   * 计算包围所有对象的最小包围盒
   */
  private computeEnclosingBox(objects: SpatialObject[]): BoundingBox {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

    for (const obj of objects) {
      min.min(obj.boundingBox.min);
      max.max(obj.boundingBox.max);
    }

    return {
      min,
      max,
      center: new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5),
    };
  }

  /**
   * 获取统计信息（用于调试）
   */
  getStats(): { objectCount: number; treeDepth: number; nodeCount: number } {
    let nodeCount = 0;
    let maxDepth = 0;

    const countNodes = (node: BVHNode | null) => {
      if (!node) return;
      nodeCount++;
      maxDepth = Math.max(maxDepth, node.depth);
      countNodes(node.left);
      countNodes(node.right);
    };

    countNodes(this.root);

    return {
      objectCount: this.objects.size,
      treeDepth: maxDepth,
      nodeCount,
    };
  }
}

/**
 * 全局空间索引实例
 */
export const spatialIndex = new SpatialIndex();