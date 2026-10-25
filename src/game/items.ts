import * as THREE from 'three';
import { createRustedMetalTexture, createCodePaperTexture } from './textures';

export type ItemType = 'crowbar' | 'padlock_key' | 'code_paper' | 'vase';

export interface GameItem {
  id: string;
  type: ItemType;
  nameAr: string;
  descriptionAr: string;
  icon: string;
  mesh: THREE.Group;
  initialPosition: THREE.Vector3;
  currentPosition: THREE.Vector3;
  isHeld: boolean;
  isInWorld: boolean;
}

/**
 * Creates 3D composite mesh for the Crowbar
 */
export function createCrowbarMesh(): THREE.Group {
  const group = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x992222, // Distressed red crowbar like in classic horror
    metalness: 0.85,
    roughness: 0.35,
  });

  // Main hexagonal/round shaft
  const shaftGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.55, 12);
  const shaft = new THREE.Mesh(shaftGeo, metalMat);
  shaft.castShadow = true;
  group.add(shaft);

  // Curved prying hook at top
  const curveGeo = new THREE.TorusGeometry(0.07, 0.016, 8, 16, Math.PI * 0.65);
  const curve = new THREE.Mesh(curveGeo, metalMat);
  curve.position.set(0.05, 0.25, 0);
  curve.rotation.z = -Math.PI * 0.2;
  curve.castShadow = true;
  group.add(curve);

  // Flattened chisel tip
  const tipGeo = new THREE.BoxGeometry(0.035, 0.008, 0.06);
  const tip = new THREE.Mesh(tipGeo, metalMat);
  tip.position.set(0.1, 0.31, 0);
  tip.rotation.z = Math.PI * 0.3;
  group.add(tip);

  // Bottom curved chisel tip
  const bottomTipGeo = new THREE.BoxGeometry(0.032, 0.008, 0.05);
  const bottomTip = new THREE.Mesh(bottomTipGeo, metalMat);
  bottomTip.position.set(0.01, -0.28, 0);
  bottomTip.rotation.z = 0.2;
  group.add(bottomTip);

  group.userData = { type: 'crowbar' };
  return group;
}

/**
 * Creates 3D composite mesh for the Padlock Key
 */
export function createPadlockKeyMesh(): THREE.Group {
  const group = new THREE.Group();
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0x2266aa, // Distinctive blue key head like Granny
    metalness: 0.7,
    roughness: 0.4,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    metalness: 0.9,
    roughness: 0.25,
  });

  // Ring handle
  const ringGeo = new THREE.TorusGeometry(0.045, 0.01, 8, 20);
  const ring = new THREE.Mesh(ringGeo, brassMat);
  ring.castShadow = true;
  group.add(ring);

  // Stem
  const stemGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.16, 10);
  const stem = new THREE.Mesh(stemGeo, ironMat);
  stem.position.set(0, -0.1, 0);
  stem.castShadow = true;
  group.add(stem);

  // Key teeth (bittings)
  const bit1 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 0.008), ironMat);
  bit1.position.set(0.018, -0.16, 0);
  group.add(bit1);

  const bit2 = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.008), ironMat);
  bit2.position.set(0.015, -0.13, 0);
  group.add(bit2);

  group.userData = { type: 'padlock_key' };
  return group;
}

/**
 * Creates 3D composite mesh for the Secret Code Note
 */
export function createCodePaperMesh(secretCode: string): THREE.Group {
  const group = new THREE.Group();
  const paperTex = createCodePaperTexture(secretCode);
  const paperMat = new THREE.MeshStandardMaterial({
    map: paperTex,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const paperGeo = new THREE.PlaneGeometry(0.2, 0.2);
  const paper = new THREE.Mesh(paperGeo, paperMat);
  paper.rotation.x = -Math.PI / 2;
  paper.castShadow = true;
  group.add(paper);

  group.userData = { type: 'code_paper' };
  return group;
}

/**
 * Creates 3D composite mesh for the Crashable Porcelain Vase
 */
export function createVaseMesh(): THREE.Group {
  const group = new THREE.Group();
  const vaseMat = new THREE.MeshStandardMaterial({
    color: 0xdde3ea,
    metalness: 0.1,
    roughness: 0.2,
  });
  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xc8963e,
    metalness: 0.85,
    roughness: 0.3,
  });

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 16), goldTrimMat);
  base.position.y = 0.02;
  base.castShadow = true;
  group.add(base);

  // Bulging belly
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), vaseMat);
  belly.position.y = 0.16;
  belly.scale.set(1, 1.25, 1);
  belly.castShadow = true;
  group.add(belly);

  // Slim neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.14, 16), vaseMat);
  neck.position.y = 0.32;
  neck.castShadow = true;
  group.add(neck);

  // Flared rim
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.015, 8, 16), goldTrimMat);
  rim.position.y = 0.39;
  rim.rotation.x = Math.PI / 2;
  rim.castShadow = true;
  group.add(rim);

  group.userData = { type: 'vase' };
  return group;
}
