// ============================================
// 华夏营造 - 选择管理器
// 负责3D场景中的构件选择、多选、框选等操作
// ============================================

import * as THREE from 'three';
import type { SceneComponent } from './ThreejsSceneManager';

export class SelectionManager {
  private selectedUuids: Set<string> = new Set();
  private components: Map<string, SceneComponent>;
  private onSelectCallback: ((uuids: string[]) => void) | null = null;

  constructor(components: Map<string, SceneComponent>) {
    this.components = components;
  }

  setComponents(components: Map<string, SceneComponent>): void {
    this.components = components;
  }

  setOnSelectCallback(callback: (uuids: string[]) => void): void {
    this.onSelectCallback = callback;
  }

  selectSingle(uuid: string | null, additive: boolean = false): void {
    if (!additive) {
      this.selectedUuids.forEach((uid) => {
        const c = this.components.get(uid);
        if (c?.mesh) {
          (c.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        }
      });
      this.selectedUuids.clear();
    }

    if (uuid) {
      const comp = this.components.get(uuid);
      if (comp && !comp.locked) {
        if (additive && this.selectedUuids.has(uuid)) {
          this.selectedUuids.delete(uuid);
          if (comp.mesh) (comp.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        } else {
          this.selectedUuids.add(uuid);
          if (comp.mesh) (comp.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x332211);
        }
      }
    }

    this.emitSelection();
  }

  selectByBox(
    renderer: THREE.WebGLRenderer,
    boxSelectStart: THREE.Vector2,
    boxSelectEnd: THREE.Vector2
  ): void {
    this.selectedUuids.forEach((uid) => {
      const c = this.components.get(uid);
      if (c?.mesh) (c.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
    });
    this.selectedUuids.clear();

    const rect = renderer.domElement.getBoundingClientRect();
    const ndcMinX = ((Math.min(boxSelectStart.x, boxSelectEnd.x) - rect.left) / rect.width) * 2 - 1;
    const ndcMaxX = ((Math.max(boxSelectStart.x, boxSelectEnd.x) - rect.left) / rect.width) * 2 - 1;
    const ndcMinY = -((Math.max(boxSelectStart.y, boxSelectEnd.y) - rect.top) / rect.height) * 2 + 1;
    const ndcMaxY = -((Math.min(boxSelectStart.y, boxSelectEnd.y) - rect.top) / rect.height) * 2 + 1;

    this.components.forEach((comp) => {
      if (!comp.mesh || comp.locked || !comp.visible) return;
      const projVec = new THREE.Vector3();
      comp.mesh.getWorldPosition(projVec);
      const inBox = projVec.x >= ndcMinX && projVec.x <= ndcMaxX && projVec.y >= ndcMinY && projVec.y <= ndcMaxY;
      if (inBox) {
        this.selectedUuids.add(comp.uuid);
        (comp.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x332211);
      }
    });

    this.emitSelection();
  }

  clearSelection(): void {
    this.selectedUuids.forEach((uid) => {
      const c = this.components.get(uid);
      if (c?.mesh) (c.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
    });
    this.selectedUuids.clear();
    this.emitSelection();
  }

  getSelectedUuids(): string[] {
    return Array.from(this.selectedUuids);
  }

  getSelectedCount(): number {
    return this.selectedUuids.size;
  }

  hasSelection(): boolean {
    return this.selectedUuids.size > 0;
  }

  isSelected(uuid: string): boolean {
    return this.selectedUuids.has(uuid);
  }

  delete(uuid: string): void {
    this.selectedUuids.delete(uuid);
    this.emitSelection();
  }

  clear(): void {
    this.selectedUuids.clear();
    this.emitSelection();
  }

  private emitSelection(): void {
    if (this.onSelectCallback) {
      this.onSelectCallback(this.getSelectedUuids());
    }
  }
}