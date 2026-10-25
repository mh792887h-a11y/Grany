import * as THREE from 'three';
import {
  createWoodFloorTexture,
  createDecayingWallTexture,
  createWarningWallTexture,
  createRustedMetalTexture,
} from './textures';

export interface ExitDoorState {
  hasPlank: boolean;
  hasPadlock: boolean;
  hasCodeLock: boolean;
  isOpen: boolean;
}

export interface InteractiveDoor {
  group: THREE.Group;
  doorMesh: THREE.Mesh;
  isOpen: boolean;
  pivot: THREE.Vector3;
  currentAngle: number;
  targetAngle: number;
}

export interface HidingSpot {
  id: string;
  type: 'closet' | 'bed';
  nameAr: string;
  position: THREE.Vector3;
  hidingCameraPosition: THREE.Vector3;
  interactionBox: THREE.Box3;
}

export interface HouseData {
  root: THREE.Group;
  colliders: THREE.Box3[];
  exitDoor: {
    group: THREE.Group;
    plankMesh: THREE.Mesh;
    padlockMesh: THREE.Group;
    keypadMesh: THREE.Group;
    doorLeaf: THREE.Mesh;
    state: ExitDoorState;
    box: THREE.Box3;
  };
  interiorDoors: InteractiveDoor[];
  hidingSpots: HidingSpot[];
  flickerLights: THREE.PointLight[];
  vaseTablePosition: THREE.Vector3;
  crowbarSpawn: THREE.Vector3;
  keySpawn: THREE.Vector3;
  codeSpawn: THREE.Vector3;
}

export function buildHauntedHouse(): HouseData {
  const root = new THREE.Group();
  const colliders: THREE.Box3[] = [];
  const interiorDoors: InteractiveDoor[] = [];
  const hidingSpots: HidingSpot[] = [];
  const flickerLights: THREE.PointLight[] = [];

  // Textures
  const floorTex = createWoodFloorTexture();
  floorTex.repeat.set(8, 8);
  const wallTex = createDecayingWallTexture();
  wallTex.repeat.set(4, 2);
  const rustTex = createRustedMetalTexture();

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.7,
    metalness: 0.1,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x181714,
    roughness: 0.95,
    metalness: 0.0,
  });

  const darkWoodMat = new THREE.MeshStandardMaterial({
    color: 0x2e1e12,
    roughness: 0.65,
    metalness: 0.1,
  });

  // 1. Floor & Ceiling (House bounds roughly -8 to 8 on X, -8 to 8 on Z, 3m height)
  const floorGeo = new THREE.PlaneGeometry(16, 16);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.0;
  root.add(ceiling);

  // Helper to build a solid wall with collider
  function addWall(x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material = wallMat) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);

    const box = new THREE.Box3().setFromObject(mesh);
    colliders.push(box);
    return mesh;
  }

  // Outer Perimeter Walls
  addWall(0, 1.5, -8, 16, 3, 0.4); // North wall
  addWall(0, 1.5, 8, 16, 3, 0.4);  // South wall
  addWall(-8, 1.5, 0, 0.4, 3, 16); // West wall
  addWall(8, 1.5, 0, 0.4, 3, 16);  // East wall

  // Internal Dividing Walls:
  // Main Hallway runs along Z (-7 to 7) around X = 0
  // Left side: Bedroom (Z: -7 to 0) & Kitchen (Z: 0 to 7)
  // Right side: Living Room (Z: -7 to 0) & Storage Room (Z: 0 to 7)

  // West dividing wall separating rooms from hallway with doorway openings
  addWall(-2.2, 1.5, -6, 0.3, 3, 3.6); // North part of west corridor wall
  addWall(-2.2, 1.5, -2.2, 0.3, 3, 2.2); // Mid part
  // Doorway to bedroom is at Z: -3.8

  addWall(-2.2, 1.5, 2.2, 0.3, 3, 2.2);
  addWall(-2.2, 1.5, 6, 0.3, 3, 3.6);
  // Doorway to kitchen is at Z: 3.8

  // East dividing wall
  addWall(2.2, 1.5, -6, 0.3, 3, 3.6);
  addWall(2.2, 1.5, -2.2, 0.3, 3, 2.2);
  // Doorway to living room is at Z: -3.8

  addWall(2.2, 1.5, 2.2, 0.3, 3, 2.2);
  addWall(2.2, 1.5, 6, 0.3, 3, 3.6);
  // Doorway to storage is at Z: 3.8

  // Partition between Bedroom and Kitchen (X: -8 to -2.2, Z = 0)
  addWall(-5.1, 1.5, 0, 5.8, 3, 0.3);

  // Partition between Living Room and Storage (X: 2.2 to 8, Z = 0)
  addWall(5.1, 1.5, 0, 5.8, 3, 0.3);

  // Warning Decal on Hallway Wall
  const warningTex = createWarningWallTexture('إنها تسمعك... لا تصدر صوتاً!');
  const warningMat = new THREE.MeshBasicMaterial({ map: warningTex, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const warningPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), warningMat);
  warningPlane.position.set(-2.04, 1.7, -1.5);
  warningPlane.rotation.y = Math.PI / 2;
  root.add(warningPlane);

  // Second Warning Decal
  const warningTex2 = createWarningWallTexture('الهروب من الباب الرئيسي مستحيل');
  const warningMat2 = new THREE.MeshBasicMaterial({ map: warningTex2, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const warningPlane2 = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), warningMat2);
  warningPlane2.position.set(2.04, 1.7, 1.5);
  warningPlane2.rotation.y = -Math.PI / 2;
  root.add(warningPlane2);

  // 2. THE MAIN EXIT DOOR (At North end of Hallway: X: 0, Z: -7.8)
  const exitDoorGroup = new THREE.Group();
  exitDoorGroup.position.set(0, 0, -7.75);

  // Heavy Outer Door Frame
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x1c1209, roughness: 0.8 });
  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.22), frameMat);
  leftPost.position.set(-0.75, 1.2, 0);
  exitDoorGroup.add(leftPost);

  const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.4, 0.22), frameMat);
  rightPost.position.set(0.75, 1.2, 0);
  exitDoorGroup.add(rightPost);

  const topPost = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.18, 0.22), frameMat);
  topPost.position.set(0, 2.31, 0);
  exitDoorGroup.add(topPost);

  // Door Leaf
  const doorGeo = new THREE.BoxGeometry(1.3, 2.2, 0.08);
  const doorLeaf = new THREE.Mesh(doorGeo, darkWoodMat);
  doorLeaf.position.set(0, 1.1, 0);
  doorLeaf.castShadow = true;
  exitDoorGroup.add(doorLeaf);

  // Lock 1: Thick Wooden Plank bolted horizontally
  const plankMat = new THREE.MeshStandardMaterial({
    color: 0x6e4526,
    roughness: 0.9,
    metalness: 0.05,
  });
  const plankMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 0.05), plankMat);
  plankMesh.position.set(0, 1.35, 0.07);
  plankMesh.castShadow = true;
  exitDoorGroup.add(plankMesh);

  // Nails on the plank
  for (const nx of [-0.6, -0.4, 0.4, 0.6]) {
    const nail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.04, 8),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9 })
    );
    nail.position.set(nx, 0, 0.03);
    nail.rotation.x = Math.PI / 2;
    plankMesh.add(nail);
  }

  // Lock 2: Heavy Padlock & Chain
  const padlockGroup = new THREE.Group();
  padlockGroup.position.set(-0.25, 0.95, 0.08);

  const padlockBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.18, 0.06),
    new THREE.MeshStandardMaterial({ map: rustTex, roughness: 0.5, metalness: 0.85 })
  );
  padlockGroup.add(padlockBody);

  const shackle = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.016, 8, 16, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 })
  );
  shackle.position.set(0, 0.09, 0);
  shackle.rotation.z = Math.PI;
  padlockGroup.add(shackle);

  // Keyhole
  const keyhole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8),
    new THREE.MeshBasicMaterial({ color: 0x000000 })
  );
  keyhole.position.set(0, -0.02, 0.032);
  keyhole.rotation.x = Math.PI / 2;
  padlockGroup.add(keyhole);

  exitDoorGroup.add(padlockGroup);

  // Lock 3: Electronic Keypad
  const keypadGroup = new THREE.Group();
  keypadGroup.position.set(0.35, 1.0, 0.07);

  const keypadBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.28, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7, roughness: 0.4 })
  );
  keypadGroup.add(keypadBody);

  // Keypad digital display
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 0.06),
    new THREE.MeshBasicMaterial({ color: 0x880000 }) // Red locked LED
  );
  display.position.set(0, 0.08, 0.026);
  keypadGroup.add(display);

  // Keypad buttons
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const btn = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.022, 0.01),
        new THREE.MeshStandardMaterial({ color: 0x333333 })
      );
      btn.position.set(-0.04 + c * 0.04, 0.02 - r * 0.032, 0.028);
      keypadGroup.add(btn);
    }
  }
  exitDoorGroup.add(keypadGroup);

  root.add(exitDoorGroup);

  const exitBox = new THREE.Box3().setFromObject(exitDoorGroup);
  colliders.push(exitBox);

  // 3. BEDROOM FURNITURE (X: -5.5, Z: -4)
  // Large Bed (Hiding spot 1)
  const bedGroup = new THREE.Group();
  bedGroup.position.set(-5.5, 0, -4);

  // Bed frame
  const bedFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.45, 1.4),
    darkWoodMat
  );
  bedFrame.position.y = 0.25;
  bedFrame.castShadow = true;
  bedGroup.add(bedFrame);

  // Headboard
  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 1.1, 1.45),
    darkWoodMat
  );
  headboard.position.set(-1.0, 0.55, 0);
  headboard.castShadow = true;
  bedGroup.add(headboard);

  // Mattress & Dirty Sheets
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xb5a898, roughness: 0.9 });
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.25, 1.3), sheetMat);
  mattress.position.set(0.05, 0.55, 0);
  bedGroup.add(mattress);

  // Pillow
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.8), sheetMat);
  pillow.position.set(-0.7, 0.72, 0);
  bedGroup.add(pillow);

  root.add(bedGroup);
  colliders.push(new THREE.Box3().setFromObject(bedGroup));

  // Bed Hiding Spot (Crawl under bed)
  hidingSpots.push({
    id: 'bed_hide',
    type: 'bed',
    nameAr: 'تحت السرير',
    position: new THREE.Vector3(-5.5, 0, -4),
    hidingCameraPosition: new THREE.Vector3(-5.5, 0.28, -3.8),
    interactionBox: new THREE.Box3(
      new THREE.Vector3(-6.8, 0, -5.0),
      new THREE.Vector3(-4.2, 1.2, -3.0)
    ),
  });

  // Tall Wardrobe / Closet (Hiding spot 2 at X: -7.2, Z: -1.8)
  const closetGroup = new THREE.Group();
  closetGroup.position.set(-7.2, 0, -1.8);

  const closetBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 2.4, 1.3),
    darkWoodMat
  );
  closetBody.position.y = 1.2;
  closetBody.castShadow = true;
  closetGroup.add(closetBody);

  // Slatted Louvered Doors with handles
  const doorPanelMat = new THREE.MeshStandardMaterial({ color: 0x22150a, roughness: 0.7 });
  const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.2, 0.58), doorPanelMat);
  leftPanel.position.set(0.46, 1.2, -0.3);
  closetGroup.add(leftPanel);

  const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.2, 0.58), doorPanelMat);
  rightPanel.position.set(0.46, 1.2, 0.3);
  closetGroup.add(rightPanel);

  // Handles
  const handleGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x997733, metalness: 0.8 });
  const h1 = new THREE.Mesh(handleGeo, handleMat);
  h1.position.set(0.49, 1.2, -0.06);
  closetGroup.add(h1);
  const h2 = new THREE.Mesh(handleGeo, handleMat);
  h2.position.set(0.49, 1.2, 0.06);
  closetGroup.add(h2);

  root.add(closetGroup);
  colliders.push(new THREE.Box3().setFromObject(closetGroup));

  // Closet Hiding Spot
  hidingSpots.push({
    id: 'closet_hide',
    type: 'closet',
    nameAr: 'داخل الخزانة',
    position: new THREE.Vector3(-7.2, 0, -1.8),
    hidingCameraPosition: new THREE.Vector3(-6.9, 1.45, -1.8),
    interactionBox: new THREE.Box3(
      new THREE.Vector3(-7.6, 0, -2.6),
      new THREE.Vector3(-6.2, 2.2, -1.0)
    ),
  });

  // Nightstand with Padlock Key inside bedroom
  const nightstand = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.7, 0.6),
    darkWoodMat
  );
  nightstand.position.set(-4.0, 0.35, -5.5);
  nightstand.castShadow = true;
  root.add(nightstand);
  colliders.push(new THREE.Box3().setFromObject(nightstand));

  // Key spawn on the nightstand
  const keySpawn = new THREE.Vector3(-4.0, 0.75, -5.5);

  // 4. LIVING ROOM FURNITURE (X: 5.2, Z: -4)
  // Table with the crashable Vase
  const tableGroup = new THREE.Group();
  tableGroup.position.set(5.2, 0, -4);

  const tabletop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.0), darkWoodMat);
  tabletop.position.y = 0.76;
  tabletop.castShadow = true;
  tableGroup.add(tabletop);

  for (const lx of [-0.68, 0.68]) {
    for (const lz of [-0.4, 0.4]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.76, 0.08), darkWoodMat);
      leg.position.set(lx, 0.38, lz);
      leg.castShadow = true;
      tableGroup.add(leg);
    }
  }
  root.add(tableGroup);
  colliders.push(new THREE.Box3().setFromObject(tableGroup));

  const vaseTablePosition = new THREE.Vector3(5.2, 0.8, -4);

  // Sofa with decayed fabric
  const sofaGroup = new THREE.Group();
  sofaGroup.position.set(5.2, 0, -1.8);

  const sofaMat = new THREE.MeshStandardMaterial({ color: 0x3d2822, roughness: 0.9 });
  const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.45, 0.9), sofaMat);
  sofaBase.position.y = 0.25;
  sofaGroup.add(sofaBase);

  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.25), sofaMat);
  sofaBack.position.set(0, 0.65, 0.35);
  sofaGroup.add(sofaBack);

  root.add(sofaGroup);
  colliders.push(new THREE.Box3().setFromObject(sofaGroup));

  // TV set flickering static
  const tvMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.6, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 })
  );
  tvMesh.position.set(7.3, 0.9, -4);
  root.add(tvMesh);

  // TV Screen light
  const tvLight = new THREE.PointLight(0x7799bb, 0.6, 4);
  tvLight.position.set(7.0, 0.9, -4);
  root.add(tvLight);
  flickerLights.push(tvLight);

  // 5. KITCHEN FURNITURE (X: -5.2, Z: 4.5)
  // Kitchen counter
  const counter = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.9, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x242422, roughness: 0.7 })
  );
  counter.position.set(-5.2, 0.45, 6.8);
  root.add(counter);
  colliders.push(new THREE.Box3().setFromObject(counter));

  // Kitchen dining table holding the Crowbar
  const kTable = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.8, 1.0),
    darkWoodMat
  );
  kTable.position.set(-5.2, 0.4, 3.5);
  root.add(kTable);
  colliders.push(new THREE.Box3().setFromObject(kTable));

  // Crowbar spawn location
  const crowbarSpawn = new THREE.Vector3(-5.2, 0.85, 3.5);

  // 6. STORAGE ROOM (X: 5.2, Z: 4.5)
  // Wooden Crates & Shelves holding the Secret Code Note
  for (let c = 0; c < 3; c++) {
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 })
    );
    crate.position.set(5.5 + (c % 2) * 0.75, 0.35 + (c === 2 ? 0.7 : 0), 4.5 + (c === 1 ? 0.8 : 0));
    crate.castShadow = true;
    root.add(crate);
    colliders.push(new THREE.Box3().setFromObject(crate));
  }

  // Code note spawn location (on top of the wooden crate)
  const codeSpawn = new THREE.Vector3(5.5, 0.72, 4.5);

  // 7. LIGHTING RIG (Moody, terrifying low horror lighting)
  // Hallway swinging lamp
  const hallLight = new THREE.PointLight(0xffcc77, 0.9, 9, 1.8);
  hallLight.position.set(0, 2.6, -1);
  hallLight.castShadow = true;
  root.add(hallLight);
  flickerLights.push(hallLight);

  // Small hanging bulb model
  const bulbWire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.5, 6),
    new THREE.MeshBasicMaterial({ color: 0x111111 })
  );
  bulbWire.position.set(0, 2.75, -1);
  root.add(bulbWire);

  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffeebb })
  );
  bulb.position.set(0, 2.5, -1);
  root.add(bulb);

  // Bedroom dim moonlight
  const bedroomLight = new THREE.PointLight(0x446699, 0.45, 7, 2);
  bedroomLight.position.set(-5, 2.4, -3);
  root.add(bedroomLight);

  // Kitchen faint sickly yellow light
  const kitchenLight = new THREE.PointLight(0x998844, 0.5, 8, 2);
  kitchenLight.position.set(-5, 2.5, 4.5);
  root.add(kitchenLight);
  flickerLights.push(kitchenLight);

  return {
    root,
    colliders,
    exitDoor: {
      group: exitDoorGroup,
      plankMesh,
      padlockMesh: padlockGroup,
      keypadMesh: keypadGroup,
      doorLeaf,
      state: {
        hasPlank: true,
        hasPadlock: true,
        hasCodeLock: true,
        isOpen: false,
      },
      box: exitBox,
    },
    interiorDoors,
    hidingSpots,
    flickerLights,
    vaseTablePosition,
    crowbarSpawn,
    keySpawn,
    codeSpawn,
  };
}
