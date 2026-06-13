import * as THREE from "three";
import type { BoardState, BoosterId, CellState, InputMode, LegalMove, MoveQuality, ProductSKU, ResolutionResult } from "../domain/types";
import { getCompartment, isLegalMove } from "../domain/board";
import { animationMs, parallel, sequence, tweenElement, wait } from "./AnimationDirector";
import { burst, rewardFlight } from "./ParticleSystem";
import type { CellPoint } from "./VisualEvents";

interface BoardViewCallbacks {
  onMove: (move: LegalMove) => void;
  onInvalid: (reason: string) => void;
  onSelect: (selection: { compartmentId: string; cellIndex: number } | null) => void;
  onDragCancel?: () => void;
  onFeedback?: (cue: "snap" | "pair" | "clear" | "combo" | "reveal" | "booster") => void;
}

interface ProductMeshUserData {
  kind: "product";
  compartmentId: string;
  cellIndex: number;
  instanceId: string;
  skuId: string;
  hidden: boolean;
}

interface TargetMeshUserData {
  kind: "target";
  compartmentId: string;
  cellIndex: number;
}

type BoardUserData = ProductMeshUserData | TargetMeshUserData;

const CELL_GAP = 1.08;
const COMPARTMENT_GAP_X = 3.9;
const COMPARTMENT_GAP_Y = 2.15;

export class ThreeBoardView {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-8, 8, 12, -12, 0.1, 100);
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private products: THREE.Object3D[] = [];
  private targets: THREE.Object3D[] = [];
  private productViewsByInstanceId = new Map<string, THREE.Object3D>();
  private shelfViewsByCompartmentId = new Map<string, THREE.Object3D>();
  private targetViewsByCell = new Map<string, THREE.Object3D>();
  private selected: { compartmentId: string; cellIndex: number } | null = null;
  private hint: LegalMove | null = null;
  private state: BoardState | null = null;
  private productMap: Map<string, ProductSKU>;
  private textureLoader = new THREE.TextureLoader();
  private assetTextures = new Map<string, THREE.Texture>();
  private animationHandle = 0;
  private dragStart: { x: number; y: number } | null = null;
  private dragGhost: HTMLElement | null = null;
  private dragProduct: ProductMeshUserData | null = null;
  private inputMode: InputMode = "tap_and_drag";
  private reduceMotion = false;
  private animationLocked = false;

  constructor(
    private host: HTMLElement,
    products: ProductSKU[],
    private callbacks: BoardViewCallbacks
  ) {
    this.productMap = new Map(products.map((product) => [product.skuId, product]));
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = "board-canvas";
    this.host.appendChild(this.renderer.domElement);
    this.host.classList.add("board-host");

    this.camera.position.set(0, 0, 30);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 8, 12);
    key.castShadow = true;
    this.scene.add(key);

    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.addEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("resize", this.resize);
    this.resize();
    this.animate();
  }

  destroy(): void {
    window.removeEventListener("resize", this.resize);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("pointermove", this.onPointerMove);
    this.renderer.domElement.removeEventListener("pointerup", this.onPointerUp);
    cancelAnimationFrame(this.animationHandle);
    for (const texture of this.assetTextures.values()) texture.dispose();
    this.renderer.dispose();
    this.host.innerHTML = "";
  }

  renderBoard(state: BoardState, hint: LegalMove | null = this.hint): void {
    this.state = state;
    this.hint = hint;
    for (const child of [...this.scene.children]) {
      if (child.userData.dynamic) {
        this.scene.remove(child);
      }
    }
    this.products = [];
    this.targets = [];
    this.productViewsByInstanceId.clear();
    this.shelfViewsByCompartmentId.clear();
    this.targetViewsByCell.clear();
    const rows = Math.max(...state.compartments.map((compartment) => compartment.row)) + 1;
    const columns = Math.max(...state.compartments.map((compartment) => compartment.column)) + 1;
    const originX = -((columns - 1) * COMPARTMENT_GAP_X) / 2;
    const originY = ((rows - 1) * COMPARTMENT_GAP_Y) / 2;

    for (const compartment of state.compartments) {
      const baseX = originX + compartment.column * COMPARTMENT_GAP_X;
      const baseY = originY - compartment.row * COMPARTMENT_GAP_Y;
      this.addShelf(compartment.id, baseX, baseY, compartment.type === "reserve");
      compartment.hiddenLayers[0]?.forEach((cell, cellIndex) => {
        if (!cell.product) return;
        const x = baseX + (cellIndex - 1) * CELL_GAP;
        const sku = this.productMap.get(cell.product.skuId);
        const mesh = this.createProductMesh(sku, true);
        mesh.position.set(x, baseY + 0.05, -0.92);
        mesh.scale.setScalar(0.93);
        mesh.userData = {
          dynamic: true,
          kind: "product",
          compartmentId: compartment.id,
          cellIndex,
          instanceId: cell.product.instanceId,
          skuId: cell.product.skuId,
          hidden: true
        } satisfies ProductMeshUserData & { dynamic: boolean };
        this.scene.add(mesh);
      });

      compartment.front.forEach((cell, cellIndex) => {
        const x = baseX + (cellIndex - 1) * CELL_GAP;
        const target = this.createTargetMesh();
        target.position.set(x, baseY, 0.05);
        target.userData = {
          dynamic: true,
          kind: "target",
          compartmentId: compartment.id,
          cellIndex
        } satisfies TargetMeshUserData & { dynamic: boolean };
        this.targets.push(target);
        this.targetViewsByCell.set(cellKey(compartment.id, cellIndex), target);
        this.scene.add(target);

        if (!cell.product) return;
        const sku = this.productMap.get(cell.product.skuId);
        const mesh = this.createProductMesh(sku, false);
        mesh.position.set(x, baseY + 0.12, 0.4);
        mesh.userData = {
          dynamic: true,
          kind: "product",
          compartmentId: compartment.id,
          cellIndex,
          instanceId: cell.product.instanceId,
          skuId: cell.product.skuId,
          hidden: false
        } satisfies ProductMeshUserData & { dynamic: boolean };
        if (this.isSelected(compartment.id, cellIndex)) mesh.scale.multiplyScalar(1.16);
        this.products.push(mesh);
        this.productViewsByInstanceId.set(cell.product.instanceId, mesh);
        this.scene.add(mesh);
      });
    }
    this.addHighlights();
  }

  setSelected(selection: { compartmentId: string; cellIndex: number } | null): void {
    if (this.animationLocked) return;
    this.selected = selection;
    this.callbacks.onSelect(selection);
    if (this.state) this.renderBoard(this.state);
  }

  setHint(hint: LegalMove | null): void {
    this.hint = hint;
    if (this.state) this.renderBoard(this.state, hint);
  }

  setInputMode(inputMode: InputMode): void {
    this.inputMode = inputMode;
    this.renderer.domElement.dataset.inputMode = inputMode;
  }

  setReduceMotion(reduceMotion: boolean): void {
    this.reduceMotion = reduceMotion;
    if (reduceMotion) {
      for (const product of this.products) product.rotation.y = 0;
    }
  }

  isAnimating(): boolean {
    return this.animationLocked;
  }

  debugCellPoint(compartmentId: string, cellIndex: number): CellPoint | null {
    if (!this.state) return null;
    return this.cellToHostPoint(this.state, compartmentId, cellIndex);
  }

  async playResolution(before: BoardState, after: BoardState, result: ResolutionResult, move: LegalMove): Promise<number> {
    if (this.animationLocked) return 0;
    const started = performance.now();
    this.animationLocked = true;
    this.host.dataset.animating = "true";
    const movedCell = getCellState(before, move.sourceCompartmentId, move.sourceCellIndex);
    const movedProduct = movedCell?.product ?? null;
    const source = this.cellToHostPoint(before, move.sourceCompartmentId, move.sourceCellIndex);
    const target = this.cellToHostPoint(before, move.targetCompartmentId, move.targetCellIndex);
    this.renderBoard(before);

    if (movedProduct && source && target) {
      await this.playMoveOverlay(movedProduct.skuId, source, target, result.moveQuality ?? "neutral");
    }

    const preview = makeMovedPreview(before, move);
    this.renderBoard(preview);
    await this.playMoveQuality(target ?? source, result.moveQuality ?? "neutral");

    await sequence([
      () => this.playTripleEffects(preview, result),
      () => this.playRevealEffects(after, result),
      () => {
        this.renderBoard(after);
      }
    ]);

    this.animationLocked = false;
    delete this.host.dataset.animating;
    return performance.now() - started;
  }

  async playBoosterEffect(boosterId: BoosterId): Promise<void> {
    if (this.animationLocked) return;
    this.animationLocked = true;
    this.host.dataset.animating = "true";
    this.callbacks.onFeedback?.("booster");
    const center = this.hostCenter();
    const label = boosterLabel(boosterId);
    const badge = this.effectBadge(center, label, `booster-${boosterId}`);
    burst(this.host, center, "booster", this.reduceMotion);
    await tweenElement(
      badge,
      [
        { transform: "translate(-50%, -50%) scale(.72)", opacity: 0 },
        { transform: "translate(-50%, -72%) scale(1.08)", opacity: 1, offset: 0.38 },
        { transform: "translate(-50%, -104%) scale(.95)", opacity: 0 }
      ],
      { durationMs: 680, easing: "snap", reduceMotion: this.reduceMotion }
    );
    badge.remove();
    this.animationLocked = false;
    delete this.host.dataset.animating;
  }

  async playInvalid(reason: string): Promise<void> {
    const point = this.selected ? this.cellToHostPoint(this.state!, this.selected.compartmentId, this.selected.cellIndex) : this.hostCenter();
    const badge = this.effectBadge(point ?? this.hostCenter(), invalidLabel(reason), "invalid");
    this.host.classList.add("board-shake");
    burst(this.host, point ?? this.hostCenter(), "invalid", this.reduceMotion);
    await wait(animationMs(380, this.reduceMotion));
    this.host.classList.remove("board-shake");
    badge.remove();
  }

  private addShelf(compartmentId: string, x: number, y: number, reserve: boolean): void {
    const shelf = new THREE.Group();
    shelf.userData.dynamic = true;
    const material = new THREE.MeshStandardMaterial({
      color: reserve ? "#9fb7b2" : "#a97745",
      roughness: 0.66,
      metalness: 0.03
    });
    const backMaterial = new THREE.MeshStandardMaterial({
      color: reserve ? "#d5e5df" : "#f1d0a7",
      roughness: 0.8
    });
    const back = new THREE.Mesh(new THREE.BoxGeometry(3.55, 1.52, 0.18), backMaterial);
    back.position.set(0, 0, -0.28);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(3.78, 0.18, 0.42), material);
    bottom.position.set(0, -0.84, 0.1);
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.78, 0.14, 0.34), material);
    top.position.set(0, 0.84, 0);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.72, 0.38), material);
    left.position.set(-1.95, 0, 0.08);
    const right = left.clone();
    right.position.x = 1.95;
    shelf.add(back, bottom, top, left, right);
    shelf.position.set(x, y, -0.08);
    shelf.name = compartmentId;
    this.shelfViewsByCompartmentId.set(compartmentId, shelf);
    this.scene.add(shelf);
  }

  private createTargetMesh(): THREE.Mesh {
    const material = new THREE.MeshBasicMaterial({ color: "#62c8ff", transparent: true, opacity: 0 });
    return new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.28), material);
  }

  private createProductMesh(product: ProductSKU | undefined, hidden: boolean): THREE.Group {
    const group = new THREE.Group();
    const color = product?.visual.color ?? "#8fc7ff";
    const accent = product?.visual.accent ?? "#ffffff";
    const shape = product?.visual.shape ?? "box";
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      metalness: 0.02,
      transparent: hidden,
      opacity: hidden ? 0.36 : 1
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.5,
      transparent: hidden,
      opacity: hidden ? 0.32 : 1
    });

    const body = this.createShape(shape, material);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const texture = product ? this.getAssetTexture(product.assetAddress) : null;
    if (texture) {
      const icon = new THREE.Mesh(
        new THREE.PlaneGeometry(0.56, 0.56),
        new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: hidden ? 0.42 : 0.96
        })
      );
      icon.position.set(0, -0.02, 0.48);
      group.add(icon);
    } else {
      const label = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.035), accentMaterial);
      label.position.set(0, -0.06, 0.43);
      group.add(label);
    }

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.04), accentMaterial);
    cap.position.set(0, 0.38, 0.45);
    if (shape === "bottle" || shape === "can" || shape === "tube") group.add(cap);

    return group;
  }

  private getAssetTexture(assetAddress: string): THREE.Texture | null {
    if (!assetAddress) return null;
    const cached = this.assetTextures.get(assetAddress);
    if (cached) return cached;
    const texture = this.textureLoader.load(assetAddress);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 2;
    this.assetTextures.set(assetAddress, texture);
    return texture;
  }

  private createShape(shape: ProductSKU["visual"]["shape"], material: THREE.Material): THREE.Mesh {
    if (shape === "sphere") return new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), material);
    if (shape === "bottle") return new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.58, 6, 16), material);
    if (shape === "can") return new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.72, 20), material);
    if (shape === "toy") return new THREE.Mesh(new THREE.DodecahedronGeometry(0.42), material);
    if (shape === "tube") return new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.88, 16), material);
    if (shape === "pouch") return new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.82, 0.42), material);
    if (shape === "crate") return new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.62, 0.5), material);
    return new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.72, 0.48), material);
  }

  private addHighlights(): void {
    if (!this.state) return;
    if (this.selected) {
      for (const target of this.targets) {
        const data = target.userData as TargetMeshUserData;
        const legal = isLegalMove(this.state, {
          sourceCompartmentId: this.selected.compartmentId,
          sourceCellIndex: this.selected.cellIndex,
          targetCompartmentId: data.compartmentId,
          targetCellIndex: data.cellIndex,
          timestamp: Date.now()
        });
        if (legal.ok) {
          (target as THREE.Mesh).material = new THREE.MeshBasicMaterial({
            color: "#88f1b2",
            transparent: true,
            opacity: 0.28
          });
        }
      }
    }

    if (this.hint) {
      for (const product of this.products) {
        const data = product.userData as ProductMeshUserData;
        const isHintSource =
          data.compartmentId === this.hint.sourceCompartmentId && data.cellIndex === this.hint.sourceCellIndex;
        if (isHintSource) product.scale.multiplyScalar(1.12);
      }
      for (const target of this.targets) {
        const data = target.userData as TargetMeshUserData;
        const isHintTarget =
          data.compartmentId === this.hint.targetCompartmentId && data.cellIndex === this.hint.targetCellIndex;
        if (isHintTarget) {
          (target as THREE.Mesh).material = new THREE.MeshBasicMaterial({
            color: "#fff06a",
            transparent: true,
            opacity: 0.42
          });
        }
      }
    }
  }

  private isSelected(compartmentId: string, cellIndex: number): boolean {
    return this.selected?.compartmentId === compartmentId && this.selected.cellIndex === cellIndex;
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (this.animationLocked) return;
    this.dragStart = { x: event.clientX, y: event.clientY };
    this.dragProduct = null;
    this.removeDragGhost();
    const product = this.pick<ProductMeshUserData>(event, this.products, "product");
    if (!product || product.data.hidden) return;
    this.setSelected({ compartmentId: product.data.compartmentId, cellIndex: product.data.cellIndex });
    this.dragProduct = product.data;
    if (this.inputMode !== "tap") {
      this.createDragGhost(product.data, event);
      try {
        this.renderer.domElement.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is best-effort; the drag ghost still tracks ordinary pointermove events.
      }
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.animationLocked || !this.dragGhost || this.inputMode === "tap") return;
    this.updateDragGhost(event);
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.state || this.animationLocked) return;
    const target = this.pick<TargetMeshUserData>(event, this.targets, "target");
    const product = this.pick<ProductMeshUserData>(event, this.products, "product");
    const draggedEnough = this.dragStart
      ? Math.hypot(event.clientX - this.dragStart.x, event.clientY - this.dragStart.y) > 8
      : false;

    const canTapMove = this.inputMode !== "drag";
    const canDragMove = this.inputMode !== "tap" && draggedEnough;
    if (this.selected && target && (canTapMove || canDragMove)) {
      const move = {
        sourceCompartmentId: this.selected.compartmentId,
        sourceCellIndex: this.selected.cellIndex,
        targetCompartmentId: target.data.compartmentId,
        targetCellIndex: target.data.cellIndex
      };
      const sourceCompartment = getCompartment(this.state, move.sourceCompartmentId);
      if (sourceCompartment) {
        const legal = isLegalMove(this.state, { ...move, timestamp: Date.now() });
        if (legal.ok) {
          this.selected = null;
          this.callbacks.onSelect(null);
          this.finishDrag(event);
          this.callbacks.onMove(move);
        } else if (draggedEnough) {
          this.finishDrag(event);
          this.callbacks.onInvalid(legal.reason ?? "invalid_move");
        }
      }
      this.finishDrag(event);
      return;
    }

    if (product && !product.data.hidden && this.inputMode !== "drag") {
      this.setSelected({ compartmentId: product.data.compartmentId, cellIndex: product.data.cellIndex });
      return;
    }
    if (draggedEnough) {
      this.callbacks.onDragCancel?.();
    } else {
      this.setSelected(null);
    }
    this.finishDrag(event);
  };

  private createDragGhost(data: ProductMeshUserData, event: PointerEvent): void {
    const product = this.productMap.get(data.skuId);
    const ghost = document.createElement("div");
    ghost.className = "fx-drag-product";
    ghost.style.background = product?.visual.color ?? "#56d6ff";
    ghost.style.borderColor = product?.visual.accent ?? "#ffffff";
    ghost.innerHTML = product ? `<img src="${product.assetAddress}" alt="">` : "";
    this.host.appendChild(ghost);
    this.dragGhost = ghost;
    this.updateDragGhost(event);
  }

  private updateDragGhost(event: PointerEvent): void {
    if (!this.dragGhost) return;
    const rect = this.host.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.dragGhost.style.left = `${x}px`;
    this.dragGhost.style.top = `${y}px`;
    const distance = this.dragStart ? Math.hypot(event.clientX - this.dragStart.x, event.clientY - this.dragStart.y) : 0;
    this.dragGhost.classList.toggle("dragging-active", distance > 8);
  }

  private finishDrag(event: PointerEvent): void {
    this.removeDragGhost();
    this.dragProduct = null;
    try {
      this.renderer.domElement.releasePointerCapture(event.pointerId);
    } catch {
      // Matching setPointerCapture is best-effort for browser compatibility.
    }
  }

  private removeDragGhost(): void {
    this.dragGhost?.remove();
    this.dragGhost = null;
  }

  private pick<T extends BoardUserData>(event: PointerEvent, objects: THREE.Object3D[], kind: T["kind"]): { data: T } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObjects(objects, true);
    for (const hit of intersections) {
      let object: THREE.Object3D | null = hit.object;
      while (object) {
        if (object.userData.kind === kind) return { data: object.userData as T };
        object = object.parent;
      }
    }
    return null;
  }

  private resize = (): void => {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.renderer.setSize(width, height);
    const aspect = width / height;
    const vertical = 8.4;
    this.camera.left = -vertical * aspect;
    this.camera.right = vertical * aspect;
    this.camera.top = vertical;
    this.camera.bottom = -vertical;
    this.camera.updateProjectionMatrix();
  };

  private async playMoveOverlay(skuId: string, source: CellPoint, target: CellPoint, quality: MoveQuality): Promise<void> {
    const product = this.productMap.get(skuId);
    const flyer = document.createElement("div");
    flyer.className = `fx-product fx-quality-${quality}`;
    flyer.style.left = `${source.x}px`;
    flyer.style.top = `${source.y}px`;
    flyer.style.background = product?.visual.color ?? "#56d6ff";
    flyer.style.borderColor = product?.visual.accent ?? "#ffffff";
    flyer.innerHTML = product ? `<img src="${product.assetAddress}" alt="">` : "";
    this.host.appendChild(flyer);
    const pulse = this.targetPulse(target, "snap");
    await tweenElement(
      flyer,
      [
        { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${(target.x - source.x) * 0.55}px), calc(-72% + ${(target.y - source.y) * 0.38}px)) scale(1.18) rotate(-5deg)`,
          opacity: 1,
          offset: 0.55
        },
        {
          transform: `translate(calc(-50% + ${target.x - source.x}px), calc(-50% + ${target.y - source.y}px)) scale(.98) rotate(0deg)`,
          opacity: 1
        }
      ],
      { durationMs: 230, easing: "snap", reduceMotion: this.reduceMotion }
    );
    this.callbacks.onFeedback?.(quality === "match_ready" ? "pair" : "snap");
    burst(this.host, target, quality === "match_ready" ? "pair" : "snap", this.reduceMotion);
    await wait(animationMs(70, this.reduceMotion));
    flyer.remove();
    pulse.remove();
  }

  private async playMoveQuality(point: CellPoint | null | undefined, quality: MoveQuality): Promise<void> {
    if (!point || quality === "neutral") return;
    const badge = this.effectBadge(point, qualityLabel(quality), `quality-${quality}`);
    await tweenElement(
      badge,
      [
        { transform: "translate(-50%, -50%) scale(.7)", opacity: 0 },
        { transform: "translate(-50%, -92%) scale(1)", opacity: 1, offset: 0.42 },
        { transform: "translate(-50%, -132%) scale(.92)", opacity: 0 }
      ],
      { durationMs: 520, easing: "soft", reduceMotion: this.reduceMotion }
    );
    badge.remove();
  }

  private async playTripleEffects(preview: BoardState, result: ResolutionResult): Promise<void> {
    if (result.clearedTriples.length === 0) {
      await wait(animationMs(80, this.reduceMotion));
      return;
    }
    await parallel(
      result.clearedTriples.map((clear) => async () => {
        const center = this.compartmentCenter(preview, clear.compartmentId);
        if (!center) return;
        const badge = this.effectBadge(center, clear.combo > 1 ? `Combo x${clear.combo}` : "Sorted!", clear.combo > 1 ? "combo" : "clear");
        await this.playClearAnticipation(preview, clear.compartmentId, clear.skuId);
        this.targetPulse(center, clear.combo > 1 ? "combo" : "clear");
        this.callbacks.onFeedback?.(clear.combo > 1 ? "combo" : "clear");
        burst(this.host, center, clear.combo > 1 ? "combo" : "clear", this.reduceMotion);
        await rewardFlight(this.host, center, this.hudTargetPoint(), clear.combo > 1 ? `x${clear.combo}` : "+", this.reduceMotion);
        badge.remove();
      })
    );
  }

  private async playClearAnticipation(state: BoardState, compartmentId: string, skuId: string): Promise<void> {
    const sku = this.productMap.get(skuId);
    const chips = [0, 1, 2]
      .map((cellIndex) => {
        const cell = getCellState(state, compartmentId, cellIndex);
        const point = this.cellToHostPoint(state, compartmentId, cellIndex);
        if (!cell?.product || cell.product.skuId !== skuId || !point) return null;
        const chip = document.createElement("span");
        chip.className = "fx-clear-chip";
        chip.style.left = `${point.x}px`;
        chip.style.top = `${point.y}px`;
        chip.style.background = sku?.visual.color ?? "#ffcf5a";
        chip.style.borderColor = sku?.visual.accent ?? "#ffffff";
        chip.innerHTML = sku ? `<img src="${sku.assetAddress}" alt="">` : "";
        this.host.appendChild(chip);
        return chip;
      })
      .filter(Boolean) as HTMLElement[];
    if (chips.length === 0) {
      await wait(animationMs(120, this.reduceMotion));
      return;
    }
    await parallel(
      chips.map((chip, index) => async () => {
        await tweenElement(
          chip,
          [
            { transform: "translate(-50%, -50%) scale(0.88)", opacity: 0.72 },
            { transform: `translate(calc(-50% + ${(index - 1) * -7}px), -58%) scale(1.16)`, opacity: 1, offset: 0.55 },
            { transform: "translate(-50%, -50%) scale(0.34)", opacity: 0 }
          ],
          { durationMs: 340, easing: "snap", reduceMotion: this.reduceMotion }
        );
        chip.remove();
      })
    );
  }

  private async playRevealEffects(after: BoardState, result: ResolutionResult): Promise<void> {
    if (result.revealedLayers.length === 0) return;
    await parallel(
      result.revealedLayers.map((reveal) => async () => {
        const center = this.compartmentCenter(after, reveal.compartmentId);
        if (!center) return;
        const badge = this.effectBadge(center, "New row", "reveal");
        const revealPanel = this.revealPanel(center);
        this.callbacks.onFeedback?.("reveal");
        burst(this.host, center, "reveal", this.reduceMotion);
        await tweenElement(
          badge,
          [
            { transform: "translate(-50%, 12%) scale(.86)", opacity: 0 },
            { transform: "translate(-50%, -72%) scale(1)", opacity: 1, offset: 0.45 },
            { transform: "translate(-50%, -108%) scale(.94)", opacity: 0 }
          ],
          { durationMs: 420, easing: "snap", reduceMotion: this.reduceMotion }
        );
        revealPanel.remove();
        badge.remove();
      })
    );
  }

  private revealPanel(point: CellPoint): HTMLElement {
    const panel = document.createElement("span");
    panel.className = "fx-reveal-panel";
    panel.style.left = `${point.x}px`;
    panel.style.top = `${point.y}px`;
    panel.style.animationDuration = `${animationMs(480, this.reduceMotion)}ms`;
    this.host.appendChild(panel);
    return panel;
  }

  private effectBadge(point: CellPoint, label: string, kind: string): HTMLElement {
    const badge = document.createElement("span");
    badge.className = `fx-badge fx-badge-${kind}`;
    badge.textContent = label;
    badge.style.left = `${point.x}px`;
    badge.style.top = `${point.y}px`;
    this.host.appendChild(badge);
    return badge;
  }

  private targetPulse(point: CellPoint, kind: string): HTMLElement {
    const pulse = document.createElement("span");
    pulse.className = `fx-target-pulse fx-target-${kind}`;
    pulse.style.left = `${point.x}px`;
    pulse.style.top = `${point.y}px`;
    pulse.style.animationDuration = `${animationMs(520, this.reduceMotion)}ms`;
    this.host.appendChild(pulse);
    window.setTimeout(() => pulse.remove(), animationMs(560, this.reduceMotion));
    return pulse;
  }

  private cellToHostPoint(state: BoardState, compartmentId: string, cellIndex: number): CellPoint | null {
    const compartment = getCompartment(state, compartmentId);
    if (!compartment) return null;
    const layout = boardLayout(state);
    const world = new THREE.Vector3(
      layout.originX + compartment.column * COMPARTMENT_GAP_X + (cellIndex - 1) * CELL_GAP,
      layout.originY - compartment.row * COMPARTMENT_GAP_Y + 0.12,
      0.4
    );
    return this.worldToHostPoint(world);
  }

  private compartmentCenter(state: BoardState, compartmentId: string): CellPoint | null {
    const points = [0, 1, 2].map((cellIndex) => this.cellToHostPoint(state, compartmentId, cellIndex)).filter(Boolean) as CellPoint[];
    if (points.length === 0) return null;
    return {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length
    };
  }

  private worldToHostPoint(world: THREE.Vector3): CellPoint {
    const projected = world.clone().project(this.camera);
    return {
      x: ((projected.x + 1) / 2) * this.host.clientWidth,
      y: ((1 - projected.y) / 2) * this.host.clientHeight
    };
  }

  private hostCenter(): CellPoint {
    return { x: this.host.clientWidth / 2, y: this.host.clientHeight / 2 };
  }

  private hudTargetPoint(): CellPoint {
    return { x: this.host.clientWidth - 92, y: 36 };
  }

  private animate = (): void => {
    const elapsed = performance.now() / 1000;
    if (!this.reduceMotion) {
      for (const product of this.products) {
        product.rotation.y = Math.sin(elapsed * 0.9 + product.position.x) * 0.05;
      }
    }
    this.renderer.render(this.scene, this.camera);
    this.animationHandle = requestAnimationFrame(this.animate);
  };
}

function cellKey(compartmentId: string, cellIndex: number): string {
  return `${compartmentId}:${cellIndex}`;
}

function getCellState(state: BoardState, compartmentId: string, cellIndex: number): CellState | null {
  return state.compartments.find((compartment) => compartment.id === compartmentId)?.front[cellIndex] ?? null;
}

function boardLayout(state: BoardState): { originX: number; originY: number } {
  const rows = Math.max(...state.compartments.map((compartment) => compartment.row)) + 1;
  const columns = Math.max(...state.compartments.map((compartment) => compartment.column)) + 1;
  return {
    originX: -((columns - 1) * COMPARTMENT_GAP_X) / 2,
    originY: ((rows - 1) * COMPARTMENT_GAP_Y) / 2
  };
}

function makeMovedPreview(state: BoardState, move: LegalMove): BoardState {
  const preview = structuredClone(state) as BoardState;
  const source = getCellState(preview, move.sourceCompartmentId, move.sourceCellIndex);
  const target = getCellState(preview, move.targetCompartmentId, move.targetCellIndex);
  if (!source?.product || !target || target.product) return preview;
  target.product = source.product;
  source.product = null;
  return preview;
}

function qualityLabel(quality: MoveQuality): string {
  if (quality === "match_ready") return "Match!";
  if (quality === "reveal_enabling") return "Reveal!";
  if (quality === "good") return "Nice";
  if (quality === "risky") return "Careful";
  return "";
}

function boosterLabel(boosterId: BoosterId): string {
  if (boosterId === "hint") return "Spotlight";
  if (boosterId === "shuffle") return "Swirl";
  if (boosterId === "hammer") return "Smash";
  if (boosterId === "freeze_time") return "Freeze";
  return "Shelf In";
}

function invalidLabel(reason: string): string {
  if (reason === "target_occupied") return "Full";
  if (reason === "source_blocked" || reason === "target_blocked") return "Blocked";
  if (reason === "same_compartment") return "Same shelf";
  return "Nope";
}
