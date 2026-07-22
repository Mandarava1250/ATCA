// ============================================
// 筑见山河 - 榫卯吸附引擎 (MortiseTenonSnapEngine Pro)
// 支持：方向兼容性检测、旋转约束对齐、尺寸匹配
// ============================================

/** 旋转约束：定义构件在各轴上的允许角度 */
export interface RotationConstraint {
  axis: 'x' | 'y' | 'z';
  /** 允许的基准角度（弧度），吸附时会优先对齐到这些角度 */
  allowedAngles: number[];
  /** 吸附容差（弧度） */
  tolerance: number;
  /** 是否允许自由旋转（true时allowedAngles作为吸附参考，false时严格限制） */
  freeRotation: boolean;
}

export interface SnapPoint {
  id: string;
  localPosition: [number, number, number];
  /** 榫卯接口的局部法线方向（指向构件外部） */
  localDirection?: [number, number, number];
  type: 'mortise' | 'tenon' | 'any';
  /** 榫卯匹配尺寸（直径，单位：米），用于真实搭建模式的尺寸校验 */
  matchSize?: number;
}

export interface SnapCandidate {
  sourceUuid: string;
  sourcePoint: SnapPoint;
  targetUuid: string;
  targetPoint: SnapPoint;
  distance: number;
  alignmentScore: number;
  /** 吸附后的推荐旋转 */
  suggestedRotation?: { x: number; y: number; z: number };
}

export interface SnapResult {
  snapped: boolean;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  matchedPoint?: SnapCandidate;
}

export class MortiseTenonSnapEngine {
  private snapThreshold: number = 0.3;
  private rotationSnapThreshold: number = 0.15;
  private directionTolerance: number = -0.3;
  private sizeTolerance: number = 0.03;
  private categoryCompatibility: Map<string, Set<string>> = new Map();
  private strictMode: boolean = false;

  constructor() {
    this.initCategoryCompatibility();
  }

  setStrictMode(strict: boolean): void {
    this.strictMode = strict;
  }

  getStrictMode(): boolean {
    return this.strictMode;
  }

  private initCategoryCompatibility(): void {
    this.categoryCompatibility.set('pillar', new Set(['beam', 'bracket', 'purlin']));
    this.categoryCompatibility.set('beam', new Set(['pillar', 'purlin', 'roof', 'bracket']));
    this.categoryCompatibility.set('purlin', new Set(['beam', 'roof', 'bracket']));
    this.categoryCompatibility.set('bracket', new Set(['pillar', 'beam', 'purlin']));
    this.categoryCompatibility.set('roof', new Set(['beam', 'purlin']));
    this.categoryCompatibility.set('base', new Set(['pillar', 'wall']));
    this.categoryCompatibility.set('wall', new Set(['pillar', 'base', 'door', 'window']));
    this.categoryCompatibility.set('door', new Set(['wall']));
    this.categoryCompatibility.set('window', new Set(['wall']));
    this.categoryCompatibility.set('decoration', new Set(['beam', 'roof', 'bracket']));
  }

  private areCategoriesCompatible(catA: string, catB: string): boolean {
    const compatibleA = this.categoryCompatibility.get(catA);
    if (compatibleA && compatibleA.has(catB)) return true;
    const compatibleB = this.categoryCompatibility.get(catB);
    if (compatibleB && compatibleB.has(catA)) return true;
    return catA === catB;
  }

  setThreshold(threshold: number): void {
    this.snapThreshold = Math.max(0.1, Math.min(3.0, threshold));
  }

  getThreshold(): number {
    return this.snapThreshold;
  }

  /**
   * 检测并计算吸附位置与旋转
   * @param sourceConstraints 源构件的旋转约束（用于计算最佳对齐旋转）
   */
  detectSnap(
      sourcePosition: { x: number; y: number; z: number },
      sourceRotation: { x: number; y: number; z: number },
      sourceSnapPoints: SnapPoint[],
      targetComponents: Array<{
        uuid: string;
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
        snapPoints: SnapPoint[];
      }>,
      sourceConstraints?: RotationConstraint[]
  ): SnapResult {
    let bestCandidate: SnapCandidate | null = null;
    let bestScore = Infinity;

    for (const target of targetComponents) {
      for (const sPoint of sourceSnapPoints) {
        for (const tPoint of target.snapPoints) {
          // 1. 类型兼容性检查（mortise ↔ tenon）
          if (!this.isCompatible(sPoint.type, tPoint.type)) continue;

          // 2. 严格模式下的榫卯结构强制匹配检查
          if (this.strictMode) {
            // 严格模式：必须都有matchSize且匹配
            if (!sPoint.matchSize || !tPoint.matchSize) continue;
            if (Math.abs(sPoint.matchSize - tPoint.matchSize) > this.sizeTolerance) continue;
          } else {
            // 自由模式：有matchSize时才检查匹配
            if (sPoint.matchSize && tPoint.matchSize && Math.abs(sPoint.matchSize - tPoint.matchSize) > 0.05) continue;
          }

          // 3. 计算世界坐标
          const sWorld = this.localToWorld(sourcePosition, sourceRotation, sPoint.localPosition);
          const tWorld = this.localToWorld(target.position, target.rotation, tPoint.localPosition);

          // 4. 距离检查
          const dx = sWorld.x - tWorld.x;
          const dy = sWorld.y - tWorld.y;
          const dz = sWorld.z - tWorld.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (distance > this.snapThreshold) continue;

          // 5. 方向兼容性检查（接口法线是否大致相反）
          const dirCompatible = this.areDirectionsCompatible(sourceRotation, sPoint.localDirection, target.rotation, tPoint.localDirection);
          if (!dirCompatible) continue;

          // 6. 计算旋转对齐分数和推荐旋转
          const suggestedRotation = this.calculateBestRotation(sourceRotation, sPoint, target.rotation, tPoint, sourceConstraints);
          if (!suggestedRotation) continue; // 旋转约束不允许此连接

          const rotScore = this.calculateRotationAlignment(sourceRotation, suggestedRotation);
          const score = distance + rotScore * 0.3;

          if (score < bestScore) {
            bestScore = score;
            bestCandidate = {
              sourceUuid: '',
              sourcePoint: sPoint,
              targetUuid: target.uuid,
              targetPoint: tPoint,
              distance,
              alignmentScore: rotScore,
              suggestedRotation,
            };
          }
        }
      }
    }

    if (!bestCandidate || !bestCandidate.suggestedRotation) {
      return { snapped: false };
    }

    // 计算吸附后的位置（使用推荐旋转）
    const targetComp = targetComponents.find((c) => c.uuid === bestCandidate!.targetUuid)!;
    const tWorld = this.localToWorld(targetComp.position, targetComp.rotation, bestCandidate.targetPoint.localPosition);

    const snappedPosition = this.calculateSnappedPosition(tWorld, bestCandidate.sourcePoint.localPosition, bestCandidate.suggestedRotation);

    return {
      snapped: true,
      position: snappedPosition,
      rotation: bestCandidate.suggestedRotation,
      matchedPoint: bestCandidate,
    };
  }

// ==================== 私有辅助方法 ====================

  private isCompatible(typeA: string, typeB: string): boolean {
    if (typeA === 'any' || typeB === 'any') return true;
    return (typeA === 'mortise' && typeB === 'tenon') || (typeA === 'tenon' && typeB === 'mortise');
  }

  /** 将向量绕各轴旋转（顺序：X -> Y -> Z） */
  private rotateVector(v: [number, number, number], rotation: { x: number; y: number; z: number }): [number, number, number] {
    let [x, y, z] = v;

    // 绕X轴
    const cx = Math.cos(rotation.x),
        sx = Math.sin(rotation.x);
    let y1 = y * cx - z * sx;
    let z1 = y * sx + z * cx;

    // 绕Y轴
    const cy = Math.cos(rotation.y),
        sy = Math.sin(rotation.y);
    let x2 = x * cy + z1 * sy;
    let z2 = -x * sy + z1 * cy;

    // 绕Z轴
    const cz = Math.cos(rotation.z),
        sz = Math.sin(rotation.z);
    let x3 = x2 * cz - y1 * sz;
    let y3 = x2 * sz + y1 * cz;

    return [x3, y3, z2];
  }

  /** 局部坐标转世界坐标 */
  private localToWorld(
      position: { x: number; y: number; z: number },
      rotation: { x: number; y: number; z: number },
      local: [number, number, number]
  ): { x: number; y: number; z: number } {
    const rotated = this.rotateVector(local, rotation);
    return {
      x: position.x + rotated[0],
      y: position.y + rotated[1],
      z: position.z + rotated[2],
    };
  }

  /** 检查两个接口方向在世界坐标系下是否兼容（应大致相反） */
  private areDirectionsCompatible(
      sourceRot: { x: number; y: number; z: number },
      sourceDir?: [number, number, number],
      targetRot?: { x: number; y: number; z: number },
      targetDir?: [number, number, number]
  ): boolean {
    // 严格模式下，任一方向信息缺失都必须返回不兼容
    if (this.strictMode && (!sourceDir || !targetDir)) {
      return false;
    }
    // 自由模式下，方向信息缺失时跳过检查（返回兼容）
    if (!sourceDir || !targetDir || !targetRot) {
      return true;
    }

    const sWorld = this.rotateVector(sourceDir, sourceRot);
    const tWorld = this.rotateVector(targetDir, targetRot);

    // 点积接近-1表示方向相反（可以插入连接）
    const dot = sWorld[0] * tWorld[0] + sWorld[1] * tWorld[1] + sWorld[2] * tWorld[2];
    return dot < -0.2; // 夹角大于约100度即可
  }

  /** 计算满足旋转约束且方向兼容的最佳旋转 */
  private calculateBestRotation(
      sourceRot: { x: number; y: number; z: number },
      sourceSnap: SnapPoint,
      targetRot: { x: number; y: number; z: number },
      targetSnap: SnapPoint,
      constraints?: RotationConstraint[]
  ): { x: number; y: number; z: number } | null {
    // 1. 应用硬约束（非自由旋转轴强制对齐到最近允许角度）
    const result = { ...sourceRot };
    if (constraints) {
      for (const c of constraints) {
        if (!c.freeRotation && c.allowedAngles.length > 0) {
          const normalized = ((sourceRot[c.axis] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          let bestAngle = c.allowedAngles[0];
          let bestDiff = Infinity;
          for (const a of c.allowedAngles) {
            const na = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const diff = Math.min(Math.abs(normalized - na), Math.PI * 2 - Math.abs(normalized - na));
            if (diff < bestDiff) {
              bestDiff = diff;
              bestAngle = a;
            }
          }
          result[c.axis] = bestAngle;
        } else if (!c.freeRotation && c.allowedAngles.length === 0) {
          result[c.axis] = 0;
        }
      }
    }

    // 2. 根据方向兼容性优化Y轴
    const sDir = sourceSnap.localDirection;
    const tDir = targetSnap.localDirection;
    if (sDir && tDir) {
      const yConstraint = constraints?.find((c) => c.axis === 'y');
      const candidates = yConstraint?.freeRotation
          ? [
            result.y,
            result.y + Math.PI / 2,
            result.y - Math.PI / 2,
            result.y + Math.PI,
            result.y - Math.PI,
            0,
            Math.PI / 2,
            Math.PI,
            (Math.PI * 3) / 2,
          ]
          : yConstraint?.allowedAngles || [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];

      // 去重并归一化到 [0, 2π)
      const uniqueCandidates = Array.from(
          new Set(candidates.map((a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)))
      );

      let bestY = result.y;
      let bestScore = Infinity;
      const tWorldDir = this.rotateVector(tDir, targetRot);
      const desiredSourceDir = [-tWorldDir[0], -tWorldDir[1], -tWorldDir[2]];

      for (const yAngle of uniqueCandidates) {
        const testRot = { ...result, y: yAngle };
        const sWorldDir = this.rotateVector(sDir, testRot);
        // 计算与期望方向的匹配度（点积越接近1越好）
        const dot = sWorldDir[0] * desiredSourceDir[0] + sWorldDir[1] * desiredSourceDir[1] + sWorldDir[2] * desiredSourceDir[2];
        const score = 1 - dot; // 越小越好
        if (score < bestScore) {
          bestScore = score;
          bestY = yAngle;
        }
      }
      result.y = bestY;

      // 验证最终方向兼容性
      const finalDir = this.rotateVector(sDir, result);
      const finalDot = finalDir[0] * tWorldDir[0] + finalDir[1] * tWorldDir[1] + finalDir[2] * tWorldDir[2];
      if (finalDot > -0.2) return null; // 方向仍然不兼容
    }

    return result;
  }

  private calculateRotationAlignment(
      rotA: { x: number; y: number; z: number },
      rotB: { x: number; y: number; z: number }
  ): number {
    const dx = Math.abs(rotA.x - rotB.x);
    const dy = Math.abs(rotA.y - rotB.y);
    const dz = Math.abs(rotA.z - rotB.z);
    const nx = Math.min(dx, Math.PI * 2 - dx);
    const ny = Math.min(dy, Math.PI * 2 - dy);
    const nz = Math.min(dz, Math.PI * 2 - dz);
    return nx + ny + nz;
  }

  private calculateSnappedPosition(
      targetWorld: { x: number; y: number; z: number },
      sourceLocal: [number, number, number],
      sourceRotation: { x: number; y: number; z: number }
  ): { x: number; y: number; z: number } {
    const rotated = this.rotateVector(sourceLocal, sourceRotation);
    return {
      x: targetWorld.x - rotated[0],
      y: targetWorld.y - rotated[1],
      z: targetWorld.z - rotated[2],
    };
  }

  private snapRotation(
      sourceRot: { x: number; y: number; z: number },
      targetRot: { x: number; y: number; z: number }
  ): { x: number; y: number; z: number } {
    const snapAngles = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];
    let bestY = sourceRot.y;
    let bestDiff = Infinity;

    for (const angle of snapAngles) {
      const diff = Math.abs(sourceRot.y - angle);
      const wrappedDiff = Math.min(diff, Math.PI * 2 - diff);
      if (wrappedDiff < this.rotationSnapThreshold && wrappedDiff < bestDiff) {
        bestDiff = wrappedDiff;
        bestY = angle;
      }
    }

    return {
      x: sourceRot.x,
      y: bestY,
      z: sourceRot.z,
    };
  }

  /**
   * 网格吸附
   */
  snapToGrid(position: { x: number; y: number; z: number }, gridSize: number = 0.1): { x: number; y: number; z: number } {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
      z: Math.round(position.z / gridSize) * gridSize,
    };
  }
}