import * as THREE from 'three';
import { createGrannyFaceTexture, createGrannyRobeTexture } from './textures';
import { horrorAudio } from '../audio/HorrorAudio';

export type GrannyState = 'PATROL' | 'INVESTIGATE' | 'CHASE' | 'ATTACK' | 'SEARCH';

export interface Waypoint {
  x: number;
  z: number;
  pauseTime?: number;
}

export class GrannyEntity {
  public group: THREE.Group;
  public state: GrannyState = 'PATROL';
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public speed: number = 1.45; // Default patrol speed
  public chaseSpeed: number = 2.8; // Fast terrifying chase speed
  public targetPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Animation parts
  private headMesh!: THREE.Mesh;
  private torsoMesh!: THREE.Mesh;
  private rightArm!: THREE.Group;
  private leftArm!: THREE.Group;
  private batMesh!: THREE.Group;
  private eyeLight!: THREE.PointLight;

  private animTimer: number = 0;
  private searchTimer: number = 0;
  private footstepTimer: number = 0;
  private tauntTimer: number = 0;

  // Patrol waypoints in the house
  private waypoints: Waypoint[] = [
    { x: 0, z: -4 },    // Main hall / Exit door area
    { x: 3.5, z: -4 },  // Living room table
    { x: 3.5, z: -1 },  // Living room couch
    { x: 0, z: 0 },     // Central corridor
    { x: -3.5, z: 0 },  // Bedroom door
    { x: -4, z: -2.5 }, // Near bed / closet
    { x: -3.5, z: 3 },  // Kitchen
    { x: 0, z: 3 },     // Back corridor
    { x: 3.5, z: 3 },   // Storage room
  ];
  private currentWaypointIndex: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.createGrannyModel();
    this.resetToInitialPosition();
  }

  private createGrannyModel() {
    // 1. Textures & Materials
    const faceTex = createGrannyFaceTexture();
    const robeTex = createGrannyRobeTexture();

    const skinMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.8,
      metalness: 0.1,
    });

    const robeMat = new THREE.MeshStandardMaterial({
      map: robeTex,
      roughness: 0.9,
      metalness: 0.05,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xd8d4cb, // Messy thin grey hair
      roughness: 0.95,
      metalness: 0.0,
    });

    const woodBatMat = new THREE.MeshStandardMaterial({
      color: 0x4a2e18,
      roughness: 0.6,
      metalness: 0.1,
    });

    const bloodMat = new THREE.MeshStandardMaterial({
      color: 0x6e0606,
      roughness: 0.3,
      metalness: 0.2,
    });

    // 2. Torso (Hunched ragged gown)
    const torsoGeo = new THREE.CylinderGeometry(0.28, 0.44, 1.15, 14);
    this.torsoMesh = new THREE.Mesh(torsoGeo, robeMat);
    this.torsoMesh.position.y = 0.85;
    this.torsoMesh.rotation.x = 0.2; // Eerie hunched posture
    this.torsoMesh.castShadow = true;
    this.group.add(this.torsoMesh);

    // Hunchback bulge
    const hunchGeo = new THREE.SphereGeometry(0.22, 10, 10);
    const hunch = new THREE.Mesh(hunchGeo, robeMat);
    hunch.position.set(0, 0.3, -0.15);
    this.torsoMesh.add(hunch);

    // 3. Head & Creepy Face
    const headGeo = new THREE.SphereGeometry(0.21, 16, 16);
    this.headMesh = new THREE.Mesh(headGeo, skinMat);
    this.headMesh.position.set(0, 1.46, 0.12);
    this.headMesh.rotation.x = -0.05;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Messy stringy hair strands
    for (let i = 0; i < 7; i++) {
      const strandGeo = new THREE.BoxGeometry(0.04, 0.28 + Math.random() * 0.15, 0.04);
      const strand = new THREE.Mesh(strandGeo, hairMat);
      const angle = (i / 7) * Math.PI + Math.PI * 0.5;
      strand.position.set(Math.cos(angle) * 0.18, 0.05, Math.sin(angle) * 0.18 - 0.05);
      strand.rotation.z = (Math.random() - 0.5) * 0.4;
      this.headMesh.add(strand);
    }

    // Glowing eerie eyes light
    this.eyeLight = new THREE.PointLight(0xff3333, 0.8, 2.5);
    this.eyeLight.position.set(0, 0, 0.3);
    this.headMesh.add(this.eyeLight);

    // 4. Right Arm holding Bloody Bat
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.38, 1.25, 0);

    const armGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.65, 8);
    const armMesh = new THREE.Mesh(armGeo, skinMat);
    armMesh.position.y = -0.3;
    armMesh.castShadow = true;
    this.rightArm.add(armMesh);

    // Bat assembly
    this.batMesh = new THREE.Group();
    this.batMesh.position.set(0, -0.58, 0.1);
    this.batMesh.rotation.x = Math.PI * 0.35;

    const batGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.75, 10);
    const bat = new THREE.Mesh(batGeo, woodBatMat);
    bat.castShadow = true;
    this.batMesh.add(bat);

    // Bat blood stains and nails
    const batTip = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.25, 10), bloodMat);
    batTip.position.y = 0.25;
    this.batMesh.add(batTip);

    // Rusty nails sticking out of the bat
    for (let n = 0; n < 4; n++) {
      const nail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.08, 6),
        new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 })
      );
      nail.position.set((Math.random() - 0.5) * 0.04, 0.2 + n * 0.04, 0.03);
      nail.rotation.x = Math.PI / 2;
      this.batMesh.add(nail);
    }

    this.rightArm.add(this.batMesh);
    this.group.add(this.rightArm);

    // 5. Left Arm (reaching forward menacingly)
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.38, 1.25, 0);

    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    leftArmMesh.position.y = -0.3;
    leftArmMesh.castShadow = true;
    this.leftArm.add(leftArmMesh);
    this.leftArm.rotation.x = 0.4; // Reaching out
    this.group.add(this.leftArm);

    // Bottom grounding contact shadow
    const shadowGeo = new THREE.PlaneGeometry(0.9, 0.9);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    this.group.add(shadow);
  }

  public resetToInitialPosition() {
    this.position.set(0, 0, 4); // Starts in the back of the house
    this.group.position.copy(this.position);
    this.state = 'PATROL';
    this.currentWaypointIndex = 0;
    this.targetPos.set(this.waypoints[0].x, 0, this.waypoints[0].z);
  }

  /**
   * Called when player creates a sound (footsteps, vase drop, crowbar prying)
   * If within hearing range, Granny immediately rushes to investigate!
   */
  public hearSound(soundPosition: THREE.Vector3, loudnessRadius: number) {
    const dist = this.position.distanceTo(soundPosition);
    if (dist <= loudnessRadius) {
      this.state = 'INVESTIGATE';
      this.targetPos.copy(soundPosition);
      this.targetPos.y = 0;
      horrorAudio.playGrannyTaunt();
    }
  }

  /**
   * Main AI Update Loop
   */
  public update(
    dt: number,
    playerPosition: THREE.Vector3,
    isPlayerHidden: boolean,
    onCatchPlayer: () => void
  ) {
    this.animTimer += dt * 6;
    this.footstepTimer += dt;
    this.tauntTimer += dt;

    const distToPlayer = this.position.distanceTo(playerPosition);

    // Calculate proximity for heartbeat (0 to 1)
    const proximity = Math.max(0, 1 - distToPlayer / 12);
    horrorAudio.updateHeartbeat(proximity);

    // Random creepy taunt voice line
    if (this.tauntTimer > 15 && distToPlayer < 9) {
      horrorAudio.playGrannyTaunt();
      this.tauntTimer = 0;
    }

    // Line of sight check to player
    const canSeePlayer = !isPlayerHidden && distToPlayer < 9.5;

    // AI State Transitions
    if (canSeePlayer) {
      this.state = 'CHASE';
      this.targetPos.copy(playerPosition);
      this.targetPos.y = 0;
    } else if (this.state === 'CHASE') {
      // Lost sight of player -> switch to search area
      this.state = 'SEARCH';
      this.searchTimer = 4.0;
    }

    // Execute state behavior
    if (this.state === 'PATROL') {
      const wp = this.waypoints[this.currentWaypointIndex];
      this.targetPos.set(wp.x, 0, wp.z);

      const distToWp = this.position.distanceTo(this.targetPos);
      if (distToWp < 0.6) {
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
      }
      this.moveTowardsTarget(dt, this.speed);
    } else if (this.state === 'INVESTIGATE') {
      const distToSound = this.position.distanceTo(this.targetPos);
      if (distToSound < 0.8) {
        // Reached sound origin, look around
        this.state = 'SEARCH';
        this.searchTimer = 3.5;
      } else {
        this.moveTowardsTarget(dt, this.chaseSpeed * 0.85);
      }
    } else if (this.state === 'CHASE') {
      this.moveTowardsTarget(dt, this.chaseSpeed);

      // Caught player!
      if (distToPlayer < 1.35) {
        this.state = 'ATTACK';
        onCatchPlayer();
        return;
      }
    } else if (this.state === 'SEARCH') {
      this.searchTimer -= dt;
      // Head looking left and right
      this.headMesh.rotation.y = Math.sin(this.animTimer * 1.5) * 0.6;
      if (this.searchTimer <= 0) {
        this.state = 'PATROL';
        this.headMesh.rotation.y = 0;
      }
    } else if (this.state === 'ATTACK') {
      // Swing bat violently!
      this.rightArm.rotation.x = -Math.PI * 0.6 + Math.sin(this.animTimer * 12) * 0.5;
    }

    // Walking animation
    if (this.state !== 'SEARCH' && this.state !== 'ATTACK') {
      const stride = Math.sin(this.animTimer);
      this.torsoMesh.position.y = 0.85 + Math.abs(stride) * 0.05;
      this.rightArm.rotation.x = stride * 0.3;
      this.leftArm.rotation.x = -stride * 0.3 + 0.3;

      // Heavy dragging footsteps
      const stepInterval = this.state === 'CHASE' ? 0.32 : 0.55;
      if (this.footstepTimer > stepInterval) {
        horrorAudio.playFootstep(true);
        this.footstepTimer = 0;
      }
    }

    // Eye glow intensity increases in chase mode
    this.eyeLight.intensity = this.state === 'CHASE' ? 1.6 : 0.7;
    this.eyeLight.color.setHex(this.state === 'CHASE' ? 0xff0000 : 0xaa2222);
  }

  private moveTowardsTarget(dt: number, moveSpeed: number) {
    const dir = new THREE.Vector3().subVectors(this.targetPos, this.position);
    dir.y = 0;
    const len = dir.length();

    if (len > 0.05) {
      dir.normalize();
      this.position.addScaledVector(dir, moveSpeed * dt);
      this.group.position.copy(this.position);

      // Rotate towards movement direction smoothly
      const targetAngle = Math.atan2(dir.x, dir.z);
      this.group.rotation.y = THREE.MathUtils.damp(
        this.group.rotation.y,
        targetAngle,
        10,
        dt
      );
    }
  }
}
