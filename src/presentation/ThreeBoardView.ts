import * as THREE from "three";
import type { BoardState, InputMode, LegalMove, ProductSKU } from "../domain/types";
import { getCompartment, isLegalMove } from "../domain/board";

interface BoardViewCallbacks {
  onMove: (move: LegalMove) => void;
  onInvalid: (reason: string) => void;
  onSelect: (selection: { compartmentId: string; cellIndex: number } | null) => void;
}

interface ProductMeshUserData {
  kind: "product";
  compartmentId: string;
  cellIndex: number;
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
  private selected: { compartmentId: string; cellIndex: number } | null = null;
  private hint: LegalMove | null = null;
  private state: BoardState | null = null;
  private productMap: Map<string, ProductSKU>;
  private textureLoader = new THREE.TextureLoader();
  private assetTextures = new Map<string, THREE.Texture>();
  private animationHandle = 0;
  private dragStart: { x: number; y: number } | null = null;
  private inputMode: InputMode = "tap_and_drag";
  private reduceMotion = false;

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
          hidden: false
        } satisfies ProductMeshUserData & { dynamic: boolean };
        if (this.isSelected(compartment.id, cellIndex)) mesh.scale.multiplyScalar(1.16);
        this.products.push(mesh);
        this.scene.add(mesh);
      });
    }
    this.addHighlights();
  }

  setSelected(selection: { compartmentId: string; cellIndex: number } | null): void {
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
    this.dragStart = { x: event.clientX, y: event.clientY };
    const product = this.pick<ProductMeshUserData>(event, this.products, "product");
    if (!product || product.data.hidden) return;
    this.setSelected({ compartmentId: product.data.compartmentId, cellIndex: product.data.cellIndex });
  };

  private onPointerMove = (_event: PointerEvent): void => {
    // Drag movement is intentionally interpreted on pointerup so tap and drag stay deterministic.
  };

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.state) return;
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
          this.callbacks.onMove(move);
        } else if (draggedEnough) {
          this.callbacks.onInvalid(legal.reason ?? "invalid_move");
        }
      }
      return;
    }

    if (product && !product.data.hidden && this.inputMode !== "drag") {
      this.setSelected({ compartmentId: product.data.compartmentId, cellIndex: product.data.cellIndex });
      return;
    }
    if (!draggedEnough) this.setSelected(null);
  };

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
