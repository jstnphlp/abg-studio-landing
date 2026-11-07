import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { expect, it } from "vitest";
import { createBlackChromeLogo, applyLogoAppearance } from "./black-chrome";

it("changes only materials on the actual GLB, retaining every vertex, index and local transform", async () => {
  const bytes = readFileSync("public/brand/abg-logo.glb");
  // Allocate in the test realm; Node Buffer's ArrayBuffer has a different realm
  // under jsdom and fails GLTFLoader's instanceof ArrayBuffer guard.
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const gltf = await new GLTFLoader().parseAsync(buffer, "");
  const result = createBlackChromeLogo(gltf.scene);
  let meshes = 0,
    chromeMeshes = 0;
  result.traverse((object) => {
    const original = gltf.scene.getObjectByName(object.name)!;
    expect(object.position.toArray()).toEqual(original.position.toArray());
    expect(object.quaternion.toArray()).toEqual(original.quaternion.toArray());
    expect(object.scale.toArray()).toEqual(original.scale.toArray());
    if (!(object instanceof THREE.Mesh)) return;
    const source = original as THREE.Mesh;
    meshes++;
    expect(object.geometry).toBe(source.geometry);
    expect(object.geometry.attributes.position.array).toBe(
      source.geometry.attributes.position.array,
    );
    expect(object.geometry.index?.array).toBe(source.geometry.index?.array);
    expect(object.material).not.toBe(source.material);
    const material = object.material as THREE.MeshStandardMaterial;
    if (material.name.toLowerCase().includes("chrome")) {
      chromeMeshes++;
      expect(material.metalness).toBe(1);
      expect(material.roughness).toBe(0.11);
      expect(material.color.r).toBe(0.13);
    }
  });
  expect(meshes).toBe(20);
  expect(chromeMeshes).toBe(5);
});

it("switches to gray chrome and white STUDIOS in place, then restores light mode", async () => {
  const bytes = readFileSync("public/brand/abg-logo.glb");
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const { scene } = await new GLTFLoader().parseAsync(buffer, "");
  const logo = createBlackChromeLogo(scene);
  const before = new Map<
    THREE.Object3D,
    {
      geometry: THREE.BufferGeometry;
      material: THREE.MeshStandardMaterial;
      color: THREE.Color;
      metalness: number;
      roughness: number;
      environment: number;
    }
  >();
  logo.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const m = o.material as THREE.MeshStandardMaterial;
    before.set(o, {
      geometry: o.geometry,
      material: m,
      color: m.color.clone(),
      metalness: m.metalness,
      roughness: m.roughness,
      environment: m.envMapIntensity,
    });
  });
  applyLogoAppearance(logo, "dark");
  let chrome = 0,
    whiteLetters = 0;
  logo.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const m = o.material as THREE.MeshStandardMaterial;
    expect(o.geometry).toBe(before.get(o)!.geometry);
    expect(m).toBe(before.get(o)!.material);
    if (m.name.toLowerCase().includes("chrome")) {
      chrome++;
      expect(m.color.r).toBe(0.42);
      expect(m.metalness).toBe(1);
    } else if (!m.name.includes("Porcelain")) {
      whiteLetters++;
      expect(m.color.r).toBeGreaterThan(0.9);
      expect(m.metalness).toBe(0);
    } else expect(m.color.toArray()).toEqual(before.get(o)!.color.toArray());
  });
  expect(chrome).toBe(5);
  expect(whiteLetters).toBe(8);
  applyLogoAppearance(logo, "light");
  for (const [object, expected] of before) {
    const m = (object as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(m.color.toArray()).toEqual(expected.color.toArray());
    expect(m.metalness).toBe(expected.metalness);
    expect(m.roughness).toBe(expected.roughness);
    expect(m.envMapIntensity).toBe(expected.environment);
  }
});
