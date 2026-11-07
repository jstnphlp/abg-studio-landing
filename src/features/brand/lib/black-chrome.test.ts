import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { expect, it } from "vitest";
import { createBlackChromeLogo } from "./black-chrome";

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
