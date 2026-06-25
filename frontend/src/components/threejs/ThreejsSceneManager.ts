// ============================================
// 华夏营造 - 专业级3D场景管理器 (SceneManager Pro)
// 支持: Gizmo操控、多选、框选、测量、线框模式、榫卯吸附
// ============================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { DEFAULT_COMPONENTS } from './ThreejsArchitectureComponents';
import { MortiseTenonSnapEngine, type SnapPoint, type SnapResult, type RotationConstraint } from './ThreejsMortiseTenonSnapEngine';
import { SelectionManager } from './ThreejsSelectionManager';
import { MeasureTool } from './ThreejsMeasureTool';
import { generateUUID } from '../../utils/uuid';

export interface SceneComponent {
  uuid: string;
  definitionId: number;
  type: string;
  category: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  material?: {
    type: string;
    color: number;
    roughness: number;
    metalness: number;
    opacity?: number;
    transparent?: boolean;
    wireframe?: boolean;
  };
  visible: boolean;
  locked: boolean;
  mesh?: THREE.Mesh;
  /** 自定义顶点数据（OBJ导入等外部模型使用），每个元素是 [x,y,z] */
  vertices?: number[][];
  /** 榫卯接口点 */
  snapPoints?: SnapPoint[];
  /** 旋转约束 */
  rotationConstraints?: RotationConstraint[];
  /** 是否已被榫卯吸附（吸附后不受重力影响） */
  isSnapped?: boolean;
  /** 被哪个构件支撑/吸附 */
  snappedTo?: string;
}

export type TransformMode = 'select' | 'translate' | 'rotate' | 'scale';

export interface SceneStats {
  componentCount: number;
  vertexCount: number;
  faceCount: number;
  selectedCount: number;
}

export class SceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private transformControl!: TransformControls;

  /** 获取 TransformControls 的 helper（兼容 Three.js r170+，TransformControls 不再继承 Object3D） */
  private get transformHelper(): THREE.Object3D {
    return (this.transformControl as any).getHelper();
  }
  private container: HTMLElement;
  private components: Map<string, SceneComponent> = new Map();
  private selectionManager: SelectionManager;
  private measureTool: MeasureTool;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private gridHelper!: THREE.GridHelper;
  private axesHelper!: THREE.AxesHelper;
  private directionalLight!: THREE.DirectionalLight;
  private ambientLight!: THREE.AmbientLight;
  private selectionBox: THREE.LineSegments | null = null;
  private onTransformCallback: (() => void) | null = null;
  private onLongPressPlaceCallback: ((position: THREE.Vector3) => void) | null = null;
  private longPressPlaceTimer: ReturnType<typeof setTimeout> | null = null;
  private longPressPlacePos = new THREE.Vector2();
  private readonly LONG_PRESS_PLACE_DURATION = 500;
  private animationId: number = 0;

  // 榫卯吸附引擎
  private snapEngine: MortiseTenonSnapEngine;

  // 交互状态
  private transformMode: TransformMode = 'select';
  private isBoxSelecting = false;
  private boxSelectStart = new THREE.Vector2();
  private boxSelectEnd = new THREE.Vector2();
  private isDragging = false;
  private isCtrlPressed = false;
  private wireframeMode = false;
  private gridSize = 1;
  private gridVisible = true;

  // 长按拖拽移动
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private isLongPressDragging = false;
  private longPressStartPos = new THREE.Vector2();
  private dragPlane: THREE.Plane | null = null;
  private dragOffset = new THREE.Vector3();
  private dragStartPos = new THREE.Vector3();
  private readonly LONG_PRESS_DURATION = 500;

  // 搭建模式
  private buildMode: 'free' | 'real' = 'free';
  private ruleWarnings: string[] = [];

  // 物理引擎（真实搭建模式）
  private gravityEnabled = false;
  private collisionEnabled = false;
  private snapEnabled = false;
  private gravityAcceleration = 9.8;
  private snapDistance = 0.3;
  private collisionMargin = 0.02;

  /** 设置搭建模式 */
  setBuildMode(mode: 'free' | 'real'): void {
    this.buildMode = mode;
    this.ruleWarnings = [];
    if (mode === 'real') {
      this.gravityEnabled = true;
      this.collisionEnabled = true;
      this.snapEnabled = true;
      this.snapEngine.setStrictMode(true);
      this.applyGravityToAll();
    } else {
      this.gravityEnabled = false;
      this.collisionEnabled = false;
      this.snapEnabled = false;
      this.snapEngine.setStrictMode(false);
    }
  }

  getBuildMode(): 'free' | 'real' {
    return this.buildMode;
  }

  /** 获取相机（用于射线检测等外部操作） */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /** 真实搭建模式下的规则校验 */
  checkBuildingRules(comp: SceneComponent): string[] {
    const warnings: string[] = [];
    if (this.buildMode !== 'real') return warnings;

    if (comp.category === 'pillar') {
      const height = comp.scale.y * 2;
      const diameter = comp.scale.x * 2;
      const ratio = height / diameter;
      if (ratio < 6 || ratio > 15) {
        warnings.push(`柱高与柱径比 ${ratio.toFixed(1)}:1 超出传统范围（9:1～10:1）`);
      }
    }
    if (comp.category === 'beam') {
      const width = comp.scale.x * 2;
      const height = comp.scale.y * 2;
      if (width / height > 3 || height / width > 3) {
        warnings.push(`梁截面比例异常，传统梁宽高比约为 2:3`);
      }
    }
    if (comp.category === 'purlin') {
      const diameter = comp.scale.x * 2;
      if (diameter < 10 || diameter > 60) {
        warnings.push(`檩径 ${diameter.toFixed(0)}cm 超出传统范围（10～60cm）`);
      }
    }
    if (comp.category === 'bracket') {
      const height = comp.scale.y * 2;
      if (height < 15 || height > 50) {
        warnings.push(`斗拱高 ${height.toFixed(0)}cm 超出传统范围（15～50cm）`);
      }
    }
    const minY = comp.position.y - comp.scale.y;
    if (minY > 0.5 && comp.category !== 'roof') {
      warnings.push(`${comp.name} 悬浮于空中，传统建筑构件应坐落在基础或下层构件上`);
    }
    return warnings;
  }

  /** 获取当前所有规则警告 */
  getRuleWarnings(): string[] {
    return [...this.ruleWarnings];
  }
  clearRuleWarnings(): void {
    this.ruleWarnings = [];
  }

  // 变换轴约束
  private axisConstraint: 'X' | 'Y' | 'Z' | 'XY' | 'YZ' | 'XZ' | 'XYZ' = 'XYZ';

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.snapEngine = new MortiseTenonSnapEngine();
    this.selectionManager = new SelectionManager(this.components);
    this.measureTool = new MeasureTool(this.scene);

    this.init();
  }

  private init() {
    this.scene.background = new THREE.Color(0xf5f0e8);

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(15, 12, 15);
    this.camera.lookAt(0, 0, 0);

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 80;
    this.controls.mouseButtons = { LEFT: null as any, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    this.controls.enablePan = true;

    this.renderer.domElement.addEventListener(
        'pointerdown',
        (e: PointerEvent) => {
          if (!this.controls || e.button !== 0) return;
          if (e.ctrlKey || e.metaKey) {
            this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
          } else if (e.shiftKey) {
            this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
          } else {
            this.controls.mouseButtons.LEFT = null as any;
          }
        },
        true
    );

    this.renderer.domElement.addEventListener(
        'pointerup',
        () => {
          if (this.controls) {
            this.controls.mouseButtons.LEFT = null as any;
          }
        },
        true
    );

    // 灯光系统
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xfff5e6, 1.0);
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(this.directionalLight);

    const fillLight = new THREE.DirectionalLight(0xe6f0ff, 0.25);
    fillLight.position.set(-10, 10, -10);
    this.scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xffeedd, 0.2);
    backLight.position.set(0, 5, -15);
    this.scene.add(backLight);

    // 网格
    this.gridHelper = new THREE.GridHelper(60, 60, 0xc8bfb0, 0xe0d8cc);
    this.scene.add(this.gridHelper);

    // 坐标轴
    this.axesHelper = new THREE.AxesHelper(2);
    this.axesHelper.position.set(-14, 0.01, -14);
    this.scene.add(this.axesHelper);

    // 地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f0e8,
      roughness: 1,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Transform Controls (Gizmo)
    this.transformControl = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControl.addEventListener('dragging-changed', (event: any) => {
      this.controls.enabled = !event.value;
    });
    this.transformControl.addEventListener('change', () => {
      this.syncTransformToComponent();
    });
    this.scene.add(this.transformHelper);

    // 事件
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);

    this.animate();
  }

  // ============ 构件管理 ============

  addComponent(comp: SceneComponent): string {
    let geometry: THREE.BufferGeometry;

    if (comp.vertices && comp.vertices.length >= 3) {
      geometry = this.createGeometryFromVertices(comp.vertices);
    } else {
      geometry = this.createGeometry(comp.type, comp.category);
    }

    const material = this.createMaterial(comp.material);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(comp.position.x, comp.position.y, comp.position.z);
    mesh.rotation.set(comp.rotation.x, comp.rotation.y, comp.rotation.z);
    mesh.scale.set(comp.scale.x, comp.scale.y, comp.scale.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { uuid: comp.uuid };

    this.scene.add(mesh);
    comp.mesh = mesh;

    if (!comp.snapPoints && comp.definitionId > 0) {
      const def = DEFAULT_COMPONENTS.find((d) => d.definitionId === comp.definitionId);
      if (def?.snapPoints) {
        comp.snapPoints = def.snapPoints.map((sp) => ({ ...sp }));
      }
    }

    if (!comp.rotationConstraints && comp.definitionId > 0) {
      const def = DEFAULT_COMPONENTS.find((d) => d.definitionId === comp.definitionId);
      if (def?.rotationConstraints) {
        comp.rotationConstraints = def.rotationConstraints.map((rc) => ({ ...rc }));
      }
    }

    this.components.set(comp.uuid, comp);

    const warnings = this.checkBuildingRules(comp);
    if (warnings.length > 0) {
      this.ruleWarnings.push(...warnings);
      console.warn('[Building Rules]', warnings.join('; '));
    }

    if (this.buildMode === 'real' && this.collisionEnabled) {
      const collision = this.checkCollision(comp.uuid);
      if (collision.collided) {
        this.ruleWarnings.push(`${comp.name} 与 ${collision.conflicts.join('、')} 发生碰撞`);
        console.warn(`[Collision] ${comp.name} collides with:`, collision.conflicts);
      }
      this.applyGravityToComponent(comp.uuid);
    }

    return comp.uuid;
  }

  private createGeometryFromVertices(vertices: number[][]): THREE.BufferGeometry {
    const flatVerts: number[] = [];
    for (const v of vertices) {
      if (v.length >= 3) {
        flatVerts.push(v[0], v[1], v[2]);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(flatVerts, 3));
    geometry.computeVertexNormals();
    return geometry;
  }

  private createGeometry(type: string, category: string): THREE.BufferGeometry {
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
      if (type.includes('hipped')) return this.createHippedRoofGeometry();
      if (type.includes('gable')) return this.createGableRoofGeometry();
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

  private createHippedRoofGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(-2, 0);
    shape.lineTo(0, 1.5);
    shape.lineTo(2, 0);
    shape.lineTo(-2, 0);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 4, bevelEnabled: false });
    geometry.center();
    return geometry;
  }

  private createGableRoofGeometry(): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    shape.moveTo(-2, 0);
    shape.lineTo(0, 1.2);
    shape.lineTo(2, 0);
    shape.lineTo(-2, 0);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false });
    geometry.center();
    return geometry;
  }

  private createMaterial(materialConfig?: SceneComponent['material']): THREE.MeshStandardMaterial {
    const defaults = { color: 0x8b6e4d, roughness: 0.8, metalness: 0.1, opacity: 1, transparent: false };
    const cfg = materialConfig || defaults;
    return new THREE.MeshStandardMaterial({
      color: cfg.color ?? defaults.color,
      roughness: cfg.roughness ?? defaults.roughness,
      metalness: cfg.metalness ?? defaults.metalness,
      opacity: cfg.opacity ?? defaults.opacity,
      transparent: cfg.transparent ?? defaults.transparent,
      wireframe: (cfg as Record<string, unknown>).wireframe as boolean ?? false,
    });
  }

  removeComponent(uuid: string): boolean {
    const comp = this.components.get(uuid);
    if (!comp) return false;
    if (comp.mesh) {
      this.scene.remove(comp.mesh);
      comp.mesh.geometry.dispose();
      (comp.mesh.material as THREE.Material).dispose();
    }
    this.components.delete(uuid);
    this.selectionManager.delete(uuid);
    this.updateGizmo();
    return true;
  }

  cloneComponent(uuid: string): SceneComponent | null {
    const comp = this.components.get(uuid);
    if (!comp) return null;
    const newComp: SceneComponent = {
      ...comp,
      uuid: generateUUID(),
      position: { x: comp.position.x + 0.5, y: comp.position.y, z: comp.position.z + 0.5 },
      mesh: undefined,
    };
    this.addComponent(newComp);
    return newComp;
  }

  updateComponentName(uuid: string, name: string): void {
    const comp = this.components.get(uuid);
    if (comp) {
      comp.name = name;
    }
  }

  updateSnapPoints(uuid: string, snapPoints: SnapPoint[]): void {
    const comp = this.components.get(uuid);
    if (comp) {
      comp.snapPoints = snapPoints;
    }
  }

  raycastComponent(x: number, y: number): SceneComponent | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((x) / rect.width) * 2 - 1;
    this.mouse.y = -((y) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const meshes: THREE.Object3D[] = [];
    this.components.forEach(comp => {
      if (comp.mesh) {
        meshes.push(comp.mesh);
      }
    });

    const intersects = this.raycaster.intersectObjects(meshes);
    if (intersects.length > 0) {
      const mesh = intersects[0].object as THREE.Mesh;
      return this.components.get(mesh.userData.uuid || '') || null;
    }
    return null;
  }

  clearScene(): void {
    this.components.forEach((comp) => {
      if (comp.mesh) {
        this.scene.remove(comp.mesh);
        comp.mesh.geometry.dispose();
        (comp.mesh.material as THREE.Material).dispose();
      }
    });
    this.components.clear();
    this.selectionManager.clear();
    this.updateGizmo();
  }

  // ============ 选择与Gizmo ============

  selectSingle(uuid: string | null, additive: boolean = false): void {
    this.selectionManager.selectSingle(uuid, additive);
    this.updateGizmo();
  }

  private selectByBox(): void {
    this.selectionManager.selectByBox(this.renderer, this.boxSelectStart, this.boxSelectEnd);
    this.updateGizmo();
  }

  private updateGizmo(): void {
    const selectedUuids = this.selectionManager.getSelectedUuids();
    if (selectedUuids.length === 1 && this.transformMode !== 'select') {
      const uuid = selectedUuids[0];
      const comp = this.components.get(uuid);
      if (comp?.mesh) {
        this.transformControl.attach(comp.mesh);
        this.transformControl.setMode(
            this.transformMode === 'translate' ? 'translate' : this.transformMode === 'rotate' ? 'rotate' : 'scale'
        );
        this.transformHelper.visible = true;
        this.transformControl.enabled = true;
        return;
      }
    }
    this.transformControl.detach();
    this.transformHelper.visible = false;
    this.transformControl.enabled = false;
  }

  setTransformMode(mode: TransformMode): void {
    this.transformMode = mode;
    this.updateGizmo();
  }

  getTransformMode(): TransformMode {
    return this.transformMode;
  }

  private syncTransformToComponent(): void {
    const selectedUuids = this.selectionManager.getSelectedUuids();
    selectedUuids.forEach((uuid) => {
      const comp = this.components.get(uuid);
      if (!comp || !comp.mesh) return;
      const position = comp.mesh.position;
      const rotation = comp.mesh.rotation;
      const scale = comp.mesh.scale;
      comp.position = { x: position.x, y: position.y, z: position.z };
      comp.rotation = { x: rotation.x, y: rotation.y, z: rotation.z };
      comp.scale = { x: scale.x, y: scale.y, z: scale.z };
    });
    if (this.onTransformCallback) this.onTransformCallback();
  }

  // ============ 框选 ============

  private onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if (this.transformMode !== 'select' && this.transformControl.dragging) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.mouse.set(x, y);
    this.raycaster.setFromCamera(this.mouse, this.camera);
    if (this.transformHelper.visible) {
      const gizmoIntersects = this.raycaster.intersectObject((this.transformControl as any).getHelper(), true);
      if (gizmoIntersects.length > 0) return;
    }

    // Ctrl+左键 = 旋转视角（OrbitControls 接管）
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    // Shift+左键 = 平移视角（OrbitControls 接管）
    if (event.shiftKey) {
      return;
    }

    // 普通左键：框选 / 长按拖拽
    this.boxSelectStart.set(event.clientX, event.clientY);
    this.isBoxSelecting = true;
    this.isDragging = false;
    this.isLongPressDragging = false;
    this.longPressStartPos.set(event.clientX, event.clientY);

    if (this.longPressPlaceTimer) {
      clearTimeout(this.longPressPlaceTimer);
      this.longPressPlaceTimer = null;
    }

    const allMeshes: THREE.Mesh[] = [];
    this.components.forEach((comp) => {
      if (comp.mesh && comp.visible) allMeshes.push(comp.mesh);
    });
    const intersects = this.raycaster.intersectObjects(allMeshes);

    if (intersects.length > 0 && this.transformMode === 'select') {
      const hitObject = intersects[0].object as THREE.Mesh;
      const hitPoint = intersects[0].point;
      const uuid = hitObject.userData.uuid as string;

      // 长按左键（500ms）→ 进入拖拽移动构件模式
      this.longPressTimer = setTimeout(() => {
        if (this.isBoxSelecting && !this.isDragging) {
          this.isLongPressDragging = true;
          this.controls.enabled = false;
          if (!this.selectionManager.isSelected(uuid)) {
            this.selectSingle(uuid, false);
          }
          this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -hitPoint.y);
          this.dragStartPos.copy(hitPoint);
          this.renderer.domElement.style.cursor = 'grabbing';
        }
      }, this.LONG_PRESS_DURATION);
    } else if (intersects.length === 0 && this.onLongPressPlaceCallback && this.transformMode === 'select') {
      this.longPressPlacePos.set(event.clientX, event.clientY);
      const savedRayDirection = this.raycaster.ray.direction.clone();
      const savedRayOrigin = this.raycaster.ray.origin.clone();
      this.longPressPlaceTimer = setTimeout(() => {
        const ray = new THREE.Ray(savedRayOrigin, savedRayDirection);
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectPoint = new THREE.Vector3();
        ray.intersectPlane(groundPlane, intersectPoint);
        if (intersectPoint && this.onLongPressPlaceCallback) {
          this.onLongPressPlaceCallback(intersectPoint);
        }
      }, this.LONG_PRESS_PLACE_DURATION);
      this.isBoxSelecting = false;
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    if (this.isLongPressDragging && this.dragPlane) {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersectPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint)) {
        const delta = new THREE.Vector3().subVectors(intersectPoint, this.dragStartPos);
        const selectedUuids = this.selectionManager.getSelectedUuids();
        selectedUuids.forEach((uuid) => {
          const comp = this.components.get(uuid);
          if (!comp || !comp.mesh || comp.locked) return;
          const newPos = {
            x: comp.position.x + delta.x,
            y: comp.position.y,
            z: comp.position.z + delta.z,
          };
          this.moveComponent(uuid, newPos);
        });
        this.dragStartPos.copy(intersectPoint);
        if (this.onTransformCallback) this.onTransformCallback();
      }
      return;
    }

    if (!this.isBoxSelecting) return;

    const moveDx = Math.abs(event.clientX - this.longPressStartPos.x);
    const moveDy = Math.abs(event.clientY - this.longPressStartPos.y);
    if (moveDx > 5 || moveDy > 5) {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      if (this.longPressPlaceTimer) {
        clearTimeout(this.longPressPlaceTimer);
        this.longPressPlaceTimer = null;
      }
    }

    const dx = Math.abs(event.clientX - this.boxSelectStart.x);
    const dy = Math.abs(event.clientY - this.boxSelectStart.y);
    if (dx > 5 || dy > 5) this.isDragging = true;

    if (this.isDragging) {
      this.boxSelectEnd.set(event.clientX, event.clientY);
      this.drawSelectionBox();
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.longPressPlaceTimer) {
      clearTimeout(this.longPressPlaceTimer);
      this.longPressPlaceTimer = null;
    }

    if (this.isLongPressDragging) {
      this.isLongPressDragging = false;
      this.dragPlane = null;
      this.controls.enabled = true;
      this.renderer.domElement.style.cursor = 'crosshair';
      this.isBoxSelecting = false;
      return;
    }

    if (!this.isBoxSelecting) return;
    this.isBoxSelecting = false;

    if (this.isDragging) {
      this.boxSelectEnd.set(event.clientX, event.clientY);
      this.removeSelectionBox();
      this.selectByBox();
    } else {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const meshes: THREE.Mesh[] = [];
      this.components.forEach((comp) => {
        if (comp.mesh && comp.visible) meshes.push(comp.mesh);
      });
      const intersects = this.raycaster.intersectObjects(meshes);
      if (intersects.length > 0) {
        const uuid = (intersects[0].object as THREE.Mesh).userData.uuid as string;
        this.selectSingle(uuid, false);
      } else {
        this.selectSingle(null, false);
      }
    }
  };

  private drawSelectionBox(): void {
    this.removeSelectionBox();
    const rect = this.renderer.domElement.getBoundingClientRect();
    const x1 = Math.min(this.boxSelectStart.x, this.boxSelectEnd.x) - rect.left;
    const y1 = Math.min(this.boxSelectStart.y, this.boxSelectEnd.y) - rect.top;
    const x2 = Math.max(this.boxSelectStart.x, this.boxSelectEnd.x) - rect.left;
    const y2 = Math.max(this.boxSelectStart.y, this.boxSelectEnd.y) - rect.top;

    const width = x2 - x1;
    const height = y2 - y1;
    if (width < 2 || height < 2) return;

    const div = document.createElement('div');
    div.id = 'selection-box-overlay';
    div.style.cssText = `position:absolute;left:${x1}px;top:${y1}px;width:${width}px;height:${height}px;border:1px dashed var(--color-primary);background:rgba(var(--color-primary-rgb),0.08);pointer-events:none;z-index:100;`;
    this.container.style.position = 'relative';
    this.container.appendChild(div);
  }

  private removeSelectionBox(): void {
    const box = this.container.querySelector('#selection-box-overlay');
    if (box) box.remove();
  }

  private calculateFrustumFromBox(): THREE.Frustum | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const sx = ((Math.min(this.boxSelectStart.x, this.boxSelectEnd.x) - rect.left) / rect.width) * 2 - 1;
    const sy = -((Math.min(this.boxSelectStart.y, this.boxSelectEnd.y) - rect.top) / rect.height) * 2 + 1;
    const ex = ((Math.max(this.boxSelectStart.x, this.boxSelectEnd.x) - rect.left) / rect.width) * 2 - 1;
    const ey = -((Math.max(this.boxSelectStart.y, this.boxSelectEnd.y) - rect.top) / rect.height) * 2 + 1;

    if (Math.abs(ex - sx) < 0.01 || Math.abs(ey - sy) < 0.01) return null;

    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
    return frustum;
  }

  // ============ 键盘快捷键 ============

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

    if (event.key === 'Control' || event.key === 'Meta') this.isCtrlPressed = true;

    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      this.emitUndo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || event.key === 'Z')) {
      event.preventDefault();
      this.emitRedo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
      event.preventDefault();
      this.emitClone();
      return;
    }

    switch (event.key) {
      case 'q':
      case 'Q':
        this.setTransformMode('select');
        this.emitToolChange();
        break;
      case 't':
      case 'T':
        this.setTransformMode('translate');
        this.emitToolChange();
        break;
      case 'r':
      case 'R':
        this.setTransformMode('rotate');
        this.emitToolChange();
        break;
      case 's':
      case 'S':
        this.setTransformMode('scale');
        this.emitToolChange();
        break;
      case 'Delete':
      case 'Backspace':
        this.emitDelete();
        break;
      case 'f':
      case 'F':
        this.focusSelected();
        break;
      case 'Escape':
        this.selectSingle(null, false);
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Control' || event.key === 'Meta') this.isCtrlPressed = false;
  };

  // ============ 测量工具 ============

  startMeasure(): void {
    this.measureTool.startMeasure();
  }
  stopMeasure(): void {
    this.measureTool.stopMeasure();
  }
  isMeasureMode(): boolean {
    return this.measureTool.isMeasureMode();
  }

  addMeasurePoint(worldPoint: THREE.Vector3): number {
    return this.measureTool.addMeasurePoint(worldPoint);
  }

  clearMeasurements(): void {
    this.measureTool.clearMeasurements();
  }

  // ============ 场景设置 ============

  setCameraPreset(preset: 'perspective' | 'top' | 'front' | 'side' | 'isometric'): void {
    switch (preset) {
      case 'perspective':
        this.camera.position.set(15, 12, 15);
        break;
      case 'top':
        this.camera.position.set(0, 30, 0.1);
        break;
      case 'front':
        this.camera.position.set(0, 5, 25);
        break;
      case 'side':
        this.camera.position.set(25, 5, 0);
        break;
      case 'isometric':
        this.camera.position.set(12, 12, 12);
        break;
    }
    this.camera.lookAt(0, 0, 0);
    this.controls.update();
  }

  setBackgroundColor(color: string | number): void {
    this.scene.background = new THREE.Color(color);
  }

  setGridSize(size: number): void {
    this.gridSize = size;
    this.scene.remove(this.gridHelper);
    const divisions = Math.round(60 / size);
    this.gridHelper = new THREE.GridHelper(60, divisions, 0xc8bfb0, 0xe0d8cc);
    this.gridHelper.visible = this.gridVisible;
    this.scene.add(this.gridHelper);
  }

  toggleGrid(visible: boolean): void {
    this.gridVisible = visible;
    this.gridHelper.visible = visible;
  }

  setLightIntensity(intensity: number): void {
    this.directionalLight.intensity = intensity;
  }

  setAmbientIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
  }

  setWireframe(enabled: boolean): void {
    this.wireframeMode = enabled;
    this.components.forEach((comp) => {
      if (!comp.mesh) return;
      (comp.mesh.material as THREE.MeshStandardMaterial).wireframe = enabled;
    });
  }

  // ============ 材质 ============

  updateMaterial(
      uuid: string,
      config: { color?: number; roughness?: number; metalness?: number; opacity?: number; wireframe?: boolean }
  ): void {
    const comp = this.components.get(uuid);
    if (!comp || !comp.mesh) return;
    const mat = comp.mesh.material as THREE.MeshStandardMaterial;
    if (config.color !== undefined) mat.color.setHex(config.color);
    if (config.roughness !== undefined) mat.roughness = config.roughness;
    if (config.metalness !== undefined) mat.metalness = config.metalness;
    if (config.opacity !== undefined) {
      mat.opacity = config.opacity;
      mat.transparent = config.opacity < 1;
    }
    if (config.wireframe !== undefined) mat.wireframe = config.wireframe;
    mat.needsUpdate = true;
    if (comp.material) Object.assign(comp.material as Record<string, unknown>, config);
  }

  // ============ 数据操作 ============

  moveComponent(uuid: string, position: { x: number; y: number; z: number }): void {
    const comp = this.components.get(uuid);
    if (!comp || !comp.mesh) return;
    comp.position = position;
    comp.mesh.position.set(position.x, position.y, position.z);
  }

  rotateComponent(uuid: string, rotation: { x: number; y: number; z: number }): void {
    const comp = this.components.get(uuid);
    if (!comp || !comp.mesh) return;
    comp.rotation = rotation;
    comp.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  }

  scaleComponent(uuid: string, scale: { x: number; y: number; z: number }): void {
    const comp = this.components.get(uuid);
    if (!comp || !comp.mesh) return;
    comp.scale = scale;
    comp.mesh.scale.set(scale.x, scale.y, scale.z);
  }

  setVisibility(uuid: string, visible: boolean): void {
    const comp = this.components.get(uuid);
    if (!comp || !comp.mesh) return;
    comp.visible = visible;
    comp.mesh.visible = visible;
  }

  setLocked(uuid: string, locked: boolean): void {
    const comp = this.components.get(uuid);
    if (comp) {
      comp.locked = locked;
      if (locked && this.selectionManager.isSelected(uuid)) {
        this.selectionManager.delete(uuid);
        if (comp.mesh) (comp.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        this.updateGizmo();
      }
    }
  }

  focusSelected(): void {
    const selectedUuids = this.selectionManager.getSelectedUuids();
    if (selectedUuids.length === 0) return;
    const center = new THREE.Vector3();
    let count = 0;
    selectedUuids.forEach((uuid) => {
      const comp = this.components.get(uuid);
      if (comp?.mesh) {
        center.add(comp.mesh.position);
        count++;
      }
    });
    if (count === 0) return;
    center.divideScalar(count);
    this.controls.target.copy(center);
    const offset = this.camera.position.clone().sub(center);
    const dist = Math.max(offset.length(), 5);
    this.camera.position.copy(center.clone().add(offset.normalize().multiplyScalar(dist)));
    this.controls.update();
  }

  // ============ 查询 ============

  getAllComponents(): SceneComponent[] {
    return Array.from(this.components.values());
  }
  getComponent(uuid: string): SceneComponent | undefined {
    return this.components.get(uuid);
  }
  getSelected(): string[] {
    return this.selectionManager.getSelectedUuids();
  }
  getSelectedComponents(): SceneComponent[] {
    return this.selectionManager.getSelectedUuids()
        .map((uuid) => this.components.get(uuid))
        .filter((c): c is SceneComponent => c !== undefined);
  }
  getStats(): SceneStats {
    let vc = 0,
        fc = 0;
    this.components.forEach((comp) => {
      if (comp.mesh?.geometry) {
        const g = comp.mesh.geometry;
        vc += g.attributes.position?.count || 0;
        fc += g.index ? g.index.count / 3 : (g.attributes.position?.count || 0) / 3;
      }
    });
    return { componentCount: this.components.size, vertexCount: vc, faceCount: Math.floor(fc), selectedCount: this.selectionManager.getSelectedCount() };
  }

  // ============ 导入导出 ============

  exportToJSON(): string {
    const comps = this.getAllComponents().map((c) => {
      let defType = c.type;
      let defCategory = c.category;
      let defName = c.name;
      if (c.definitionId > 0) {
        const found = DEFAULT_COMPONENTS.find((d) => d.definitionId === c.definitionId);
        if (found) {
          defType = found.type;
          defCategory = found.category;
          defName = found.name;
        }
      }
      const base: Record<string, any> = {
        uuid: c.uuid,
        definitionId: c.definitionId,
        type: defType,
        category: defCategory,
        name: defName,
        position: { x: c.position.x, y: c.position.y, z: c.position.z },
        rotation: { x: c.rotation.x, y: c.rotation.y, z: c.rotation.z },
        scale: { x: c.scale.x, y: c.scale.y, z: c.scale.z },
        material: c.material
            ? {
              type: c.material.type || 'standard',
              color: c.material.color ?? 0x8b6e4d,
              roughness: c.material.roughness ?? 0.8,
              metalness: c.material.metalness ?? 0.1,
              opacity: c.material.opacity ?? 1,
              transparent: c.material.transparent ?? false,
              wireframe: c.material.wireframe ?? false,
            }
            : undefined,
        visible: c.visible,
        locked: c.locked,
        snapPoints: c.snapPoints,
        rotationConstraints: c.rotationConstraints,
      };
      if (c.vertices && c.vertices.length > 0) {
        base.vertices = c.vertices;
      }
      return base;
    });
    return JSON.stringify(
        {
          version: '2.1',
          modelName: '未命名模型',
          createdAt: new Date().toISOString(),
          components: comps,
        },
        null,
        2
    );
  }

  exportToGLTF(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(
          this.scene,
          (gltf: any) => {
            if (gltf instanceof ArrayBuffer) {
              const blob = new Blob([gltf], { type: 'model/gltf-binary' });
              resolve(blob);
            } else {
              const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
              resolve(blob);
            }
          },
          (error: any) => reject(error),
          { binary: true }
      );
    });
  }

  importFromJSON(json: string): void {
    const data = JSON.parse(json);
    this.clearScene();
    if (data.components && Array.isArray(data.components)) {
      data.components.forEach((raw: any) => {
        let defId = raw.definitionId ?? raw.definition_id ?? 0;
        let defType = raw.type || 'pillar_round';
        let defCategory = raw.category || 'pillar';
        let defName = raw.name || '构件';

        const hasVertices = raw.vertices && Array.isArray(raw.vertices) && raw.vertices.length > 0;

        if (!hasVertices && defId > 0) {
          const found = DEFAULT_COMPONENTS.find((d) => d.definitionId === defId);
          if (found) {
            defType = found.type;
            defCategory = found.category;
            defName = found.name;
          }
        }

        let pos = { x: 0, y: 0, z: 0 };
        if (raw.position) {
          if (Array.isArray(raw.position)) {
            pos = { x: Number(raw.position[0] ?? 0), y: Number(raw.position[1] ?? 0), z: Number(raw.position[2] ?? 0) };
          } else {
            pos = { x: Number(raw.position.x ?? 0), y: Number(raw.position.y ?? 0), z: Number(raw.position.z ?? 0) };
          }
        }

        let mat = raw.material;
        if (!mat && raw.color) {
          let colorNum = 0x8b6e4d;
          if (typeof raw.color === 'string' && raw.color.startsWith('#')) {
            colorNum = parseInt(raw.color.slice(1), 16);
          } else if (typeof raw.color === 'number') {
            colorNum = raw.color;
          }
          mat = { type: 'standard', color: colorNum, roughness: 0.8, metalness: 0.1 };
        }

        const comp: SceneComponent = {
          uuid: raw.uuid || raw.id || generateUUID(),
          definitionId: defId,
          type: defType,
          category: defCategory,
          name: defName,
          position: pos,
          rotation: {
            x: Number(raw.rotation?.x ?? 0),
            y: Number(raw.rotation?.y ?? 0),
            z: Number(raw.rotation?.z ?? 0),
          },
          scale: {
            x: Number(raw.scale?.x ?? raw.scale?.[0] ?? 1),
            y: Number(raw.scale?.y ?? raw.scale?.[1] ?? 1),
            z: Number(raw.scale?.z ?? raw.scale?.[2] ?? 1),
          },
          material: mat
              ? {
                type: mat.type || 'standard',
                color: mat.color ?? 0x8b6e4d,
                roughness: mat.roughness ?? 0.8,
                metalness: mat.metalness ?? 0.1,
                opacity: mat.opacity ?? 1,
                transparent: mat.transparent ?? false,
                wireframe: mat.wireframe ?? false,
              }
              : undefined,
          visible: raw.visible !== false,
          locked: raw.locked === true,
          vertices: hasVertices ? raw.vertices : undefined,
          snapPoints: raw.snapPoints,
          rotationConstraints: raw.rotationConstraints,
        };
        this.addComponent(comp);
      });
    }
  }

  importGLTF(gltf: any): void {
    const scene = gltf.scene || gltf;
    scene.traverse((node: any) => {
      if (node.isMesh && node.geometry) {
        const box = new THREE.Box3().setFromObject(node);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxSize = Math.max(size.x, size.y, size.z) || 1;
        const scale = 10 / maxSize;

        node.scale.set(node.scale.x * scale, node.scale.y * scale, node.scale.z * scale);
        node.position.set(
            (node.position.x - (box.min.x + box.max.x) / 2) * scale,
            (node.position.y - box.min.y) * scale,
            (node.position.z - (box.min.z + box.max.z) / 2) * scale
        );

        const geo = node.geometry.clone();
        const positions = geo.attributes.position;
        const vertices: number[][] = [];
        for (let i = 0; i < positions.count; i++) {
          vertices.push([positions.getX(i) * scale, positions.getY(i) * scale, positions.getZ(i) * scale]);
        }

        const comp: SceneComponent = {
          uuid: generateUUID(),
          definitionId: 0,
          type: 'mesh',
          category: 'import',
          name: node.name || '导入构件',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          material: node.material
              ? {
                type: 'standard',
                color: (node.material.color?.getHex?.() ?? 0x8b6e4d) as number,
                roughness: node.material.roughness ?? 0.8,
                metalness: node.material.metalness ?? 0.1,
              }
              : undefined,
          visible: true,
          locked: false,
          vertices,
        };
        this.addComponent(comp);
      }
    });
    this.updateGizmo();
  }

  takeScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

// ============ 回调系统 ============

  onSelect(callback: (uuids: string[]) => void): void {
    this.selectionManager.setOnSelectCallback(callback);
  }
  onTransform(callback: () => void): void {
    this.onTransformCallback = callback;
  }
  onLongPressPlace(callback: (position: THREE.Vector3) => void): void {
    this.onLongPressPlaceCallback = callback;
  }

  // Selection callback is now handled by SelectionManager

  private undoCallback: (() => void) | null = null;
  private redoCallback: (() => void) | null = null;
  private cloneCallback: (() => void) | null = null;
  private deleteCallback: (() => void) | null = null;
  private toolChangeCallback: (() => void) | null = null;

  onUndo(callback: () => void): void {
    this.undoCallback = callback;
  }
  onRedo(callback: () => void): void {
    this.redoCallback = callback;
  }
  onClone(callback: () => void): void {
    this.cloneCallback = callback;
  }
  onDelete(callback: () => void): void {
    this.deleteCallback = callback;
  }
  onToolChange(callback: () => void): void {
    this.toolChangeCallback = callback;
  }

  private emitUndo(): void {
    if (this.undoCallback) this.undoCallback();
  }
  private emitRedo(): void {
    if (this.redoCallback) this.redoCallback();
  }
  private emitClone(): void {
    if (this.cloneCallback) this.cloneCallback();
  }
  private emitDelete(): void {
    if (this.deleteCallback) this.deleteCallback();
  }
  private emitToolChange(): void {
    if (this.toolChangeCallback) this.toolChangeCallback();
  }

// ============ 生命周期 ============

  private onResize = () => {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

// ==================== 物理引擎（真实搭建模式）====================

  applyGravity(): void {
    if (!this.gravityEnabled || this.buildMode !== 'real') return;
    const selectedUuids = this.selectionManager.getSelectedUuids();
    for (const uuid of selectedUuids) {
      this.applyGravityToComponent(uuid);
    }
  }

  applyGravityToAll(): void {
    if (!this.gravityEnabled) return;
    for (const comp of this.components.values()) {
      this.applyGravityToComponent(comp.uuid);
    }
  }

  private applyGravityToComponent(uuid: string): void {
    const comp = this.components.get(uuid);
    if (!comp || !comp.mesh || comp.isSnapped) return;

    const bbox = new THREE.Box3().setFromObject(comp.mesh);
    const bottomY = bbox.min.y;

    if (bottomY <= 0.01) {
      comp.position.y = 0;
      if (comp.mesh) comp.mesh.position.y = 0;
      return;
    }

    let supportY = 0;
    let bestSupport: string | null = null;

    for (const other of this.components.values()) {
      if (other.uuid === uuid || !other.mesh) continue;
      const otherBox = new THREE.Box3().setFromObject(other.mesh);
      const otherTopY = otherBox.max.y;
      const otherXRange = [otherBox.min.x, otherBox.max.x];
      const otherZRange = [otherBox.min.z, otherBox.max.z];

      const compCenterX = (bbox.min.x + bbox.max.x) / 2;
      const compCenterZ = (bbox.min.z + bbox.max.z) / 2;
      if (
          compCenterX >= otherXRange[0] - this.collisionMargin &&
          compCenterX <= otherXRange[1] + this.collisionMargin &&
          compCenterZ >= otherZRange[0] - this.collisionMargin &&
          compCenterZ <= otherZRange[1] + this.collisionMargin
      ) {
        if (otherTopY < bottomY && otherTopY > supportY) {
          supportY = otherTopY;
          bestSupport = other.uuid;
        }
      }
    }

    const dropDistance = bottomY - supportY;
    if (dropDistance > 0.01) {
      const steps = Math.min(Math.ceil(dropDistance / 0.05), 20);
      let step = 0;
      const originalY = comp.position.y;
      const targetY = originalY - dropDistance;
      const animateDrop = () => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 2);
        comp.position.y = originalY + (targetY - originalY) * eased;
        if (comp.mesh) comp.mesh.position.y = comp.position.y;
        this.onTransformCallback?.();
        if (step < steps) requestAnimationFrame(animateDrop);
        else {
          comp.position.y = targetY;
          if (comp.mesh) comp.mesh.position.y = targetY;
          if (bestSupport) {
            this.snapComponents(uuid, bestSupport);
            comp.isSnapped = true;
            comp.snappedTo = bestSupport;
          }
        }
      };
      animateDrop();
    }
  }

  checkCollision(uuid: string): { collided: boolean; conflicts: string[] } {
    if (!this.collisionEnabled) return { collided: false, conflicts: [] };
    const comp = this.components.get(uuid);
    if (!comp || !comp.mesh) return { collided: false, conflicts: [] };

    const bbox = new THREE.Box3().setFromObject(comp.mesh);
    const conflicts: string[] = [];

    for (const other of this.components.values()) {
      if (other.uuid === uuid || !other.mesh) continue;
      const otherBox = new THREE.Box3().setFromObject(other.mesh);
      if (
          bbox.min.x < otherBox.max.x + this.collisionMargin &&
          bbox.max.x > otherBox.min.x - this.collisionMargin &&
          bbox.min.y < otherBox.max.y + this.collisionMargin &&
          bbox.max.y > otherBox.min.y - this.collisionMargin &&
          bbox.min.z < otherBox.max.z + this.collisionMargin &&
          bbox.max.z > otherBox.min.z - this.collisionMargin
      ) {
        conflicts.push(other.name || other.uuid);
      }
    }

    return { collided: conflicts.length > 0, conflicts };
  }

  /** 使用榫卯吸附引擎进行构件吸附（增强版：支持旋转约束与方向检测） */
  snapComponents(uuidA: string, uuidB: string): boolean {
    if (!this.snapEnabled) return false;
    const compA = this.components.get(uuidA);
    const compB = this.components.get(uuidB);
    if (!compA || !compB || !compA.mesh || !compB.mesh) return false;

    // 确保 snapPoints 和 rotationConstraints 已加载
    if (!compA.snapPoints && compA.definitionId > 0) {
      const defA = DEFAULT_COMPONENTS.find((d) => d.definitionId === compA!.definitionId);
      if (defA?.snapPoints) compA.snapPoints = defA.snapPoints.map((sp) => ({ ...sp }));
      if (defA?.rotationConstraints) compA.rotationConstraints = defA.rotationConstraints.map((rc) => ({ ...rc }));
    }
    if (!compB.snapPoints && compB.definitionId > 0) {
      const defB = DEFAULT_COMPONENTS.find((d) => d.definitionId === compB!.definitionId);
      if (defB?.snapPoints) compB.snapPoints = defB.snapPoints.map((sp) => ({ ...sp }));
    }

    const result = this.snapEngine.detectSnap(
        compA.position,
        compA.rotation,
        compA.snapPoints || [],
        [{ uuid: uuidB, position: compB.position, rotation: compB.rotation, snapPoints: compB.snapPoints || [] }],
        compA.rotationConstraints
    );

    if (result.snapped && result.position && result.rotation && result.matchedPoint) {
      // 使用带动画的对齐，同时应用旋转约束
      this.alignToSnapPoint(
          uuidA,
          compB,
          result.matchedPoint.targetPoint,
          result.matchedPoint.sourcePoint,
          result.rotation
      );

      compA.isSnapped = true;
      compA.snappedTo = uuidB;
      if (!compB.isSnapped) {
        compB.isSnapped = true;
        compB.snappedTo = uuidA;
      }
      return true;
    }
    return false;
  }

  /** 对齐构件到目标榫卯点（带动画，支持目标旋转） */
  private alignToSnapPoint(
      uuid: string,
      targetComp: SceneComponent,
      targetSnap: SnapPoint,
      sourceSnap?: SnapPoint,
      targetRotation?: { x: number; y: number; z: number }
  ): void {
    const comp = this.components.get(uuid);
    if (!comp || !comp.mesh || !targetComp.mesh) return;

    const targetWorld = new THREE.Vector3(...targetSnap.localPosition).applyMatrix4(targetComp.mesh.matrixWorld);

    let sourceLocal: [number, number, number] = sourceSnap?.localPosition || comp.snapPoints?.[0]?.localPosition || [0, 0, 0];

// 使用目标旋转（或当前旋转）计算源局部点的世界偏移
    const rot = targetRotation || comp.rotation;
    const euler = new THREE.Euler(rot.x, rot.y, rot.z);
    const rotatedLocal = new THREE.Vector3(...sourceLocal).applyEuler(euler);

    const targetPos = {
      x: targetWorld.x - rotatedLocal.x,
      y: targetWorld.y - rotatedLocal.y,
      z: targetWorld.z - rotatedLocal.z,
    };

    const startPos = { ...comp.position };
    const startRot = { ...comp.rotation };
    const steps = 10;
    let step = 0;

    const lerpAngle = (a: number, b: number, f: number): number => {
      let diff = b - a;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      return a + diff * f;
    };

    const animateSnap = () => {
      step++;
      const t = step / steps;
      const ease = t * t * (3 - 2 * t);

      comp.position.x = startPos.x + (targetPos.x - startPos.x) * ease;
      comp.position.y = startPos.y + (targetPos.y - startPos.y) * ease;
      comp.position.z = startPos.z + (targetPos.z - startPos.z) * ease;

      if (targetRotation) {
        comp.rotation.x = lerpAngle(startRot.x, targetRotation.x, ease);
        comp.rotation.y = lerpAngle(startRot.y, targetRotation.y, ease);
        comp.rotation.z = lerpAngle(startRot.z, targetRotation.z, ease);
        if (comp.mesh) comp.mesh.rotation.set(comp.rotation.x, comp.rotation.y, comp.rotation.z);
      }

      if (comp.mesh) comp.mesh.position.set(comp.position.x, comp.position.y, comp.position.z);
      this.onTransformCallback?.();
      if (step < steps) requestAnimationFrame(animateSnap);
    };
    animateSnap();
  }

  checkStructuralIntegrity(): string[] {
    const issues: string[] = [];
    if (!this.gravityEnabled) return issues;

    for (const comp of this.components.values()) {
      if (!comp.mesh) continue;
      const bbox = new THREE.Box3().setFromObject(comp.mesh);
      const bottomY = bbox.min.y;

      if (bottomY > 0.05) {
        let hasSupport = false;
        for (const other of this.components.values()) {
          if (other.uuid === comp.uuid || !other.mesh) continue;
          const otherBox = new THREE.Box3().setFromObject(other.mesh);
          const otherTopY = otherBox.max.y;
          const cx = (bbox.min.x + bbox.max.x) / 2;
          const cz = (bbox.min.z + bbox.max.z) / 2;
          if (
              Math.abs(otherTopY - bottomY) < 0.1 &&
              cx >= otherBox.min.x &&
              cx <= otherBox.max.x &&
              cz >= otherBox.min.z &&
              cz <= otherBox.max.z
          ) {
            hasSupport = true;
            break;
          }
        }
        if (!hasSupport) {
          issues.push(`${comp.name} 处于悬空状态，缺少下方支撑`);
        }
      }
    }
    return issues;
  }

  getPhysicsState(): { gravity: boolean; collision: boolean; snap: boolean } {
    return {
      gravity: this.gravityEnabled,
      collision: this.collisionEnabled,
      snap: this.snapEnabled,
    };
  }

  destroy(): void {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    if (this.longPressPlaceTimer) {
      clearTimeout(this.longPressPlaceTimer);
      this.longPressPlaceTimer = null;
    }
    this.removeSelectionBox();
    this.clearScene();
    this.clearMeasurements();
    this.renderer.dispose();
    this.controls.dispose();
    this.transformControl.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}