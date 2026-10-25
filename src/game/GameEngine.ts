import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildHauntedHouse, HouseData, HidingSpot } from './houseBuilder';
import { GrannyEntity } from './granny';
import {
  GameItem,
  ItemType,
  createCrowbarMesh,
  createPadlockKeyMesh,
  createCodePaperMesh,
  createVaseMesh,
} from './items';
import { horrorAudio } from '../audio/HorrorAudio';

export interface GameEngineCallbacks {
  onDayChange: (day: number) => void;
  onJumpscare: () => void;
  onGameOver: () => void;
  onVictory: () => void;
  onHoverInteraction: (prompt: string | null) => void;
  onItemHeldChange: (item: GameItem | null) => void;
  onSoundMade: (level: number) => void; // 0 to 1
  onFlashlightChange: (on: boolean) => void;
  onHidingStateChange: (isHiding: boolean, spotName: string | null) => void;
}

export class HorrorGameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;

  // Three.js Core
  public renderer!: THREE.WebGLRenderer;
  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  private clock: THREE.Clock = new THREE.Clock();
  private frameId: number = 0;
  private isSoftwareGl: boolean = false;

  // World & Entities
  private house!: HouseData;
  private granny!: GrannyEntity;
  private items: GameItem[] = [];
  public heldItem: GameItem | null = null;
  public secretCode: string = '8419';

  // Player State
  public currentDay: number = 1;
  public isPlayerHidden: boolean = false;
  public currentHidingSpot: HidingSpot | null = null;
  public isFlashlightOn: boolean = true;
  private flashlight!: THREE.SpotLight;
  private flashlightTarget!: THREE.Object3D;

  public playerPos: THREE.Vector3 = new THREE.Vector3(-5.5, 1.6, -4); // Starts in bedroom
  private playerVelocity: THREE.Vector3 = new THREE.Vector3();
  private cameraPitch: number = 0; // Look up/down
  private cameraYaw: number = 0;   // Look left/right
  private isCrouching: boolean = false;
  private isRunning: boolean = false;
  private headBobTimer: number = 0;
  private footstepTimer: number = 0;

  // Raycasting & Interaction
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private hoveredInteractable: {
    type: 'item' | 'plank' | 'padlock' | 'keypad' | 'door' | 'hiding_spot';
    target: unknown;
    prompt: string;
  } | null = null;

  // Input states
  private keysHeld: Record<string, boolean> = {};
  public isPointerLocked: boolean = false;
  private isDisposed: boolean = false;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // Generate random 4-digit secret code each game
    this.secretCode = Math.floor(1000 + Math.random() * 9000).toString();

    this.initRenderer();
    this.initScene();
    this.initItems();
    this.setupInputs();
    this.startLoop();
  }

  private initRenderer() {
    // Detect software WebGL per Three.js skill
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    // Deep dark horror fog
    this.scene.fog = new THREE.FogExp2(0x060505, 0.12);
    this.scene.background = new THREE.Color(0x060505);

    // Studio Environment map per SKILL
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      40
    );
    this.camera.position.copy(this.playerPos);

    // Low eerie ambient light
    const ambient = new THREE.AmbientLight(0x1a1614, 0.35);
    this.scene.add(ambient);

    // Player Flashlight
    this.flashlight = new THREE.SpotLight(0xfff2dc, 2.8, 14, Math.PI / 5.5, 0.4, 1.2);
    this.flashlight.position.copy(this.camera.position);
    this.flashlight.castShadow = !this.isSoftwareGl;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);

    // Build Haunted House
    this.house = buildHauntedHouse();
    this.scene.add(this.house.root);

    // Build Granny AI Entity
    this.granny = new GrannyEntity();
    this.scene.add(this.granny.group);
  }

  private initItems() {
    // 1. Crowbar (in kitchen)
    const crowbarMesh = createCrowbarMesh();
    crowbarMesh.position.copy(this.house.crowbarSpawn);
    this.scene.add(crowbarMesh);

    this.items.push({
      id: 'crowbar_1',
      type: 'crowbar',
      nameAr: 'عتلة حديدية',
      descriptionAr: 'أداة قوية لخلع الألواح الخشبية من الباب الرئيسي',
      icon: 'axe',
      mesh: crowbarMesh,
      initialPosition: this.house.crowbarSpawn.clone(),
      currentPosition: this.house.crowbarSpawn.clone(),
      isHeld: false,
      isInWorld: true,
    });

    // 2. Padlock Key (in bedroom nightstand)
    const keyMesh = createPadlockKeyMesh();
    keyMesh.position.copy(this.house.keySpawn);
    this.scene.add(keyMesh);

    this.items.push({
      id: 'padlock_key_1',
      type: 'padlock_key',
      nameAr: 'مفتاح القفل الأزرق',
      descriptionAr: 'مفتاح معدني خاص يفتح القفل الثقيل على الباب الرئيسي',
      icon: 'key',
      mesh: keyMesh,
      initialPosition: this.house.keySpawn.clone(),
      currentPosition: this.house.keySpawn.clone(),
      isHeld: false,
      isInWorld: true,
    });

    // 3. Secret Code Note (in storage room)
    const codeMesh = createCodePaperMesh(this.secretCode);
    codeMesh.position.copy(this.house.codeSpawn);
    this.scene.add(codeMesh);

    this.items.push({
      id: 'code_paper_1',
      type: 'code_paper',
      nameAr: 'قصاصة الرمز السري',
      descriptionAr: `ورقة قديمة مكتوب عليها رمز لوحة المفاتيح: [${this.secretCode}]`,
      icon: 'file-text',
      mesh: codeMesh,
      initialPosition: this.house.codeSpawn.clone(),
      currentPosition: this.house.codeSpawn.clone(),
      isHeld: false,
      isInWorld: true,
    });

    // 4. Fragile Porcelain Vase (on living room table)
    const vaseMesh = createVaseMesh();
    vaseMesh.position.copy(this.house.vaseTablePosition);
    this.scene.add(vaseMesh);

    this.items.push({
      id: 'vase_1',
      type: 'vase',
      nameAr: 'مزهرية خزفية',
      descriptionAr: 'مزهرية رقيقة قابلة للكسر.. إذا سقطت ستسمعك العجوز فوراً!',
      icon: 'sparkles',
      mesh: vaseMesh,
      initialPosition: this.house.vaseTablePosition.clone(),
      currentPosition: this.house.vaseTablePosition.clone(),
      isHeld: false,
      isInWorld: true,
    });
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      this.keysHeld[e.code] = true;

      // Toggle crouch
      if (e.code === 'KeyC') {
        this.toggleCrouch();
      }

      // Toggle flashlight
      if (e.code === 'KeyF') {
        this.toggleFlashlight();
      }

      // Drop held item
      if (e.code === 'KeyQ') {
        this.dropHeldItem();
      }

      // Interact with hovered object
      if (e.code === 'KeyE') {
        this.triggerInteraction();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysHeld[e.code] = false;
    });

    window.addEventListener('blur', () => {
      this.keysHeld = {};
    });

    // Pointer Lock for immersive first-person desktop mouse control
    this.container.addEventListener('click', () => {
      if (!this.isPointerLocked && !this.isPlayerHidden) {
        this.container.requestPointerLock?.();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === this.container;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.rotateCamera(e.movementX * 0.0024, e.movementY * 0.0024);
      }
    });

    // Resize Handler
    window.addEventListener('resize', this.onResize);
  }

  public rotateCamera(deltaYaw: number, deltaPitch: number) {
    this.cameraYaw -= deltaYaw;
    this.cameraPitch -= deltaPitch;
    // Clamp vertical look between straight down and straight up
    this.cameraPitch = Math.max(-Math.PI * 0.44, Math.min(Math.PI * 0.44, this.cameraPitch));
  }

  public toggleCrouch() {
    this.isCrouching = !this.isCrouching;
  }

  public toggleFlashlight() {
    this.isFlashlightOn = !this.isFlashlightOn;
    this.flashlight.visible = this.isFlashlightOn;
    horrorAudio.playFlashlightClick();
    this.callbacks.onFlashlightChange(this.isFlashlightOn);
  }

  public dropHeldItem() {
    if (!this.heldItem) return;

    const item = this.heldItem;
    item.isHeld = false;
    item.isInWorld = true;

    // Drop in front of player
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const dropPos = this.playerPos.clone().addScaledVector(forward, 0.8);
    dropPos.y = 0.2; // On the floor

    item.mesh.position.copy(dropPos);
    item.mesh.visible = true;
    this.heldItem = null;
    this.callbacks.onItemHeldChange(null);

    // If vase was dropped, it shatters loudly and alerts Granny!
    if (item.type === 'vase') {
      horrorAudio.playCrashSound();
      this.granny.hearSound(dropPos, 18); // Loud crash radius
      this.callbacks.onSoundMade(1.0);
      // Remove broken vase
      this.scene.remove(item.mesh);
      this.items = this.items.filter((i) => i.id !== item.id);
    } else {
      horrorAudio.playFloorCreak();
      this.granny.hearSound(dropPos, 7);
      this.callbacks.onSoundMade(0.4);
    }
  }

  public triggerInteraction() {
    // If currently hiding in closet or bed, exit hiding spot!
    if (this.isPlayerHidden) {
      this.exitHidingSpot();
      return;
    }

    if (!this.hoveredInteractable) return;

    const { type, target } = this.hoveredInteractable;

    if (type === 'item') {
      const item = target as GameItem;
      // If already holding an item, drop it first
      if (this.heldItem) {
        this.dropHeldItem();
      }
      // Pick up item
      item.isHeld = true;
      item.isInWorld = false;
      item.mesh.visible = false;
      this.heldItem = item;
      horrorAudio.playItemPickup();
      this.callbacks.onItemHeldChange(item);
    } else if (type === 'hiding_spot') {
      const spot = target as HidingSpot;
      this.enterHidingSpot(spot);
    } else if (type === 'plank') {
      if (this.heldItem?.type === 'crowbar') {
        horrorAudio.playCrowbarPry();
        this.house.exitDoor.state.hasPlank = false;
        this.house.exitDoor.plankMesh.visible = false;
        // Prying creates noise!
        this.granny.hearSound(this.playerPos, 14);
        this.callbacks.onSoundMade(0.8);
      }
    } else if (type === 'padlock') {
      if (this.heldItem?.type === 'padlock_key') {
        horrorAudio.playLockUnlock();
        this.house.exitDoor.state.hasPadlock = false;
        this.house.exitDoor.padlockMesh.visible = false;
      }
    } else if (type === 'keypad') {
      // Enter secret code
      horrorAudio.playKeypadBeep(true);
      this.house.exitDoor.state.hasCodeLock = false;
      this.house.exitDoor.keypadMesh.visible = false;
    } else if (type === 'door') {
      // All 3 locks cleared -> ESCAPE VICTORY!
      const state = this.house.exitDoor.state;
      if (!state.hasPlank && !state.hasPadlock && !state.hasCodeLock) {
        horrorAudio.playDoorCreak();
        this.callbacks.onVictory();
      }
    }
  }

  private enterHidingSpot(spot: HidingSpot) {
    this.isPlayerHidden = true;
    this.currentHidingSpot = spot;
    horrorAudio.playDoorCreak();
    this.callbacks.onHidingStateChange(true, spot.nameAr);
  }

  private exitHidingSpot() {
    this.isPlayerHidden = false;
    horrorAudio.playDoorCreak();
    // Step outside hiding spot
    if (this.currentHidingSpot?.type === 'closet') {
      this.playerPos.set(-6.2, 1.6, -1.8);
    } else {
      this.playerPos.set(-5.5, 1.6, -2.8);
    }
    this.currentHidingSpot = null;
    this.callbacks.onHidingStateChange(false, null);
  }

  /**
   * Called when Granny catches the player
   */
  public handleGrannyCatch() {
    horrorAudio.playJumpscare();
    this.callbacks.onJumpscare();

    setTimeout(() => {
      this.currentDay += 1;
      if (this.currentDay > 5) {
        this.callbacks.onGameOver();
      } else {
        this.callbacks.onDayChange(this.currentDay);
        this.respawnPlayer();
      }
    }, 2200);
  }

  public respawnPlayer() {
    // Reset to bedroom bed
    this.playerPos.set(-5.5, 1.6, -4);
    this.cameraPitch = 0;
    this.cameraYaw = 0;
    this.isPlayerHidden = false;
    this.currentHidingSpot = null;
    this.granny.resetToInitialPosition();
  }

  /**
   * Reset entire game for new playthrough
   */
  public restartGame() {
    this.currentDay = 1;
    this.secretCode = Math.floor(1000 + Math.random() * 9000).toString();

    // Reset door locks
    this.house.exitDoor.state.hasPlank = true;
    this.house.exitDoor.state.hasPadlock = true;
    this.house.exitDoor.state.hasCodeLock = true;
    this.house.exitDoor.plankMesh.visible = true;
    this.house.exitDoor.padlockMesh.visible = true;
    this.house.exitDoor.keypadMesh.visible = true;

    // Reset items
    this.heldItem = null;
    this.callbacks.onItemHeldChange(null);
    for (const item of this.items) {
      item.isHeld = false;
      item.isInWorld = true;
      item.mesh.position.copy(item.initialPosition);
      item.mesh.visible = true;
      if (!this.scene.children.includes(item.mesh)) {
        this.scene.add(item.mesh);
      }
    }

    this.respawnPlayer();
    this.callbacks.onDayChange(1);
  }

  // Mobile / Touch directional move vector
  public mobileMoveVector: { x: number; y: number } = { x: 0, y: 0 };

  private updateMovement(dt: number) {
    if (this.isPlayerHidden) {
      // Camera stays fixed inside hiding spot
      if (this.currentHidingSpot) {
        this.camera.position.copy(this.currentHidingSpot.hidingCameraPosition);
        this.camera.rotation.set(this.cameraPitch * 0.4, this.cameraYaw, 0, 'YXZ');
      }
      return;
    }

    this.isRunning = !!this.keysHeld['ShiftLeft'] || !!this.keysHeld['ShiftRight'];

    let moveSpeed = 2.8;
    if (this.isCrouching) moveSpeed = 1.35;
    else if (this.isRunning) moveSpeed = 4.8;

    // Direction calculation
    const moveDir = new THREE.Vector3(0, 0, 0);

    // Keyboard inputs (WASD + Arrow keys)
    if (this.keysHeld['KeyW'] || this.keysHeld['ArrowUp']) moveDir.z -= 1;
    if (this.keysHeld['KeyS'] || this.keysHeld['ArrowDown']) moveDir.z += 1;
    if (this.keysHeld['KeyA'] || this.keysHeld['ArrowLeft']) moveDir.x -= 1;
    if (this.keysHeld['KeyD'] || this.keysHeld['ArrowRight']) moveDir.x += 1;

    // Mobile touch inputs
    if (Math.abs(this.mobileMoveVector.x) > 0.05 || Math.abs(this.mobileMoveVector.y) > 0.05) {
      moveDir.x += this.mobileMoveVector.x;
      moveDir.z -= this.mobileMoveVector.y;
    }

    const isMoving = moveDir.lengthSq() > 0.001;

    if (isMoving) {
      moveDir.normalize();
      // Rotate movement vector by camera yaw
      moveDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

      const targetX = this.playerPos.x + moveDir.x * moveSpeed * dt;
      const targetZ = this.playerPos.z + moveDir.z * moveSpeed * dt;

      // Simple collision resolution with house colliders
      const playerRadius = 0.35;
      let canMoveX = true;
      let canMoveZ = true;

      for (const box of this.house.colliders) {
        if (
          targetX + playerRadius > box.min.x &&
          targetX - playerRadius < box.max.x &&
          this.playerPos.z + playerRadius > box.min.z &&
          this.playerPos.z - playerRadius < box.max.z
        ) {
          canMoveX = false;
        }

        if (
          this.playerPos.x + playerRadius > box.min.x &&
          this.playerPos.x - playerRadius < box.max.x &&
          targetZ + playerRadius > box.min.z &&
          targetZ - playerRadius < box.max.z
        ) {
          canMoveZ = false;
        }
      }

      if (canMoveX) this.playerPos.x = targetX;
      if (canMoveZ) this.playerPos.z = targetZ;

      // Head bobbing animation
      this.headBobTimer += dt * (this.isRunning ? 14 : 9);
      const bobOffset = Math.sin(this.headBobTimer) * (this.isRunning ? 0.07 : 0.035);

      // Footstep audio & noise generation
      this.footstepTimer += dt;
      const stepInterval = this.isRunning ? 0.28 : this.isCrouching ? 0.65 : 0.45;

      if (this.footstepTimer > stepInterval) {
        horrorAudio.playFootstep(false, this.isRunning, this.isCrouching);
        this.footstepTimer = 0;

        // Running alerts Granny!
        if (this.isRunning) {
          this.granny.hearSound(this.playerPos, 12);
          this.callbacks.onSoundMade(0.7);
        } else if (!this.isCrouching) {
          this.granny.hearSound(this.playerPos, 4.5);
          this.callbacks.onSoundMade(0.25);
        }
      }

      const targetHeight = (this.isCrouching ? 0.85 : 1.6) + bobOffset;
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetHeight, 12, dt);
    } else {
      const targetHeight = this.isCrouching ? 0.85 : 1.6;
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetHeight, 12, dt);
    }

    this.camera.position.x = this.playerPos.x;
    this.camera.position.z = this.playerPos.z;

    // Apply rotation
    this.camera.rotation.set(this.cameraPitch, this.cameraYaw, 0, 'YXZ');

    // Update Flashlight position & direction
    this.flashlight.position.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).addScaledVector(forward, 6);
  }

  private updateRaycasting() {
    if (this.isPlayerHidden) {
      this.hoveredInteractable = null;
      this.callbacks.onHoverInteraction('اضغط E للخروج من المكان السري');
      return;
    }

    // Cast ray from center of screen
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    this.hoveredInteractable = null;

    // Check items in world
    for (const item of this.items) {
      if (item.isInWorld && !item.isHeld) {
        const dist = this.playerPos.distanceTo(item.mesh.position);
        if (dist < 2.5) {
          const hits = this.raycaster.intersectObject(item.mesh, true);
          if (hits.length > 0) {
            this.hoveredInteractable = {
              type: 'item',
              target: item,
              prompt: `اضغط E لالتقاط [${item.nameAr}]`,
            };
            this.callbacks.onHoverInteraction(this.hoveredInteractable.prompt);
            return;
          }
        }
      }
    }

    // Check hiding spots
    for (const spot of this.house.hidingSpots) {
      const dist = this.playerPos.distanceTo(spot.position);
      if (dist < 2.2) {
        this.hoveredInteractable = {
          type: 'hiding_spot',
          target: spot,
          prompt: `اضغط E للاختباء [${spot.nameAr}]`,
        };
        this.callbacks.onHoverInteraction(this.hoveredInteractable.prompt);
        return;
      }
    }

    // Check Exit Door elements (North Hall: dist < 2.8)
    const distToExit = this.playerPos.distanceTo(this.house.exitDoor.group.position);
    if (distToExit < 2.8) {
      const state = this.house.exitDoor.state;

      // Check plank
      if (state.hasPlank) {
        const hits = this.raycaster.intersectObject(this.house.exitDoor.plankMesh);
        if (hits.length > 0) {
          const prompt =
            this.heldItem?.type === 'crowbar'
              ? 'اضغط E لخلع اللوح الخشبي بالعتلة!'
              : 'لوح خشبي مساميره مشدودة (يحتاج عتلة)';
          this.hoveredInteractable = { type: 'plank', target: null, prompt };
          this.callbacks.onHoverInteraction(prompt);
          return;
        }
      }

      // Check padlock
      if (state.hasPadlock) {
        const hits = this.raycaster.intersectObject(this.house.exitDoor.padlockMesh, true);
        if (hits.length > 0) {
          const prompt =
            this.heldItem?.type === 'padlock_key'
              ? 'اضغط E لفتح القفل بالمفتاح الأزرق!'
              : 'قفل ثقيل مقفل بسلسلة (يحتاج مفتاح القفل الأزرق)';
          this.hoveredInteractable = { type: 'padlock', target: null, prompt };
          this.callbacks.onHoverInteraction(prompt);
          return;
        }
      }

      // Check keypad
      if (state.hasCodeLock) {
        const hits = this.raycaster.intersectObject(this.house.exitDoor.keypadMesh, true);
        if (hits.length > 0) {
          const prompt = `اضغط E لإدخال الرمز السري [${this.secretCode}]`;
          this.hoveredInteractable = { type: 'keypad', target: null, prompt };
          this.callbacks.onHoverInteraction(prompt);
          return;
        }
      }

      // Check door opening when unlocked
      if (!state.hasPlank && !state.hasPadlock && !state.hasCodeLock) {
        const prompt = 'الباب مفتوح بالكامل! اضغط E للهروب والنجاة!';
        this.hoveredInteractable = { type: 'door', target: null, prompt };
        this.callbacks.onHoverInteraction(prompt);
        return;
      }
    }

    this.callbacks.onHoverInteraction(null);
  }

  private startLoop() {
    horrorAudio.startAmbientDrone();

    const tick = () => {
      if (this.isDisposed) return;

      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Clamp frame dt per Game Craft guidelines

      this.updateMovement(dt);
      this.updateRaycasting();

      // Update Granny AI
      this.granny.update(dt, this.playerPos, this.isPlayerHidden, () => {
        this.handleGrannyCatch();
      });

      // Subtle flickering of light fixtures for horror ambiance
      for (const light of this.house.flickerLights) {
        if (Math.random() < 0.03) {
          light.intensity = 0.1 + Math.random() * 0.8;
        }
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.isDisposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 60);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    horrorAudio.cleanup();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
