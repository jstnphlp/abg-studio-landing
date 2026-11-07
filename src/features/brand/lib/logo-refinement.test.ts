import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { expect, it } from "vitest";

it("refines only five chrome surfaces, preserving all other geometry and every object's placement", async () => {
  const before = JSON.parse(
    readFileSync(
      "docs/verification/logo-refinement/preserved-objects.json",
      "utf8",
    ),
  );
  const bytes = readFileSync("public/brand/abg-logo.glb");
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const gltf = await new GLTFLoader().parseAsync(buffer, "");
  const topology = JSON.parse(
    readFileSync("docs/verification/logo-refinement/topology.json", "utf8"),
  );
  const hash = (a: THREE.TypedArray) =>
    createHash("sha256")
      .update(new Uint8Array(a.buffer, a.byteOffset, a.byteLength))
      .digest("hex");
  let changed = 0,
    unchanged = 0;
  gltf.scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const original = before[object.name];
    expect(original).toBeDefined();
    expect(object.position.toArray()).toEqual(original.position);
    expect(object.quaternion.toArray()).toEqual(original.quaternion);
    expect(object.scale.toArray()).toEqual(original.scale);
    const geometry: THREE.BufferGeometry = object.geometry;
    const normal = geometry.getAttribute("normal");
    for (let i = 0; i < normal.count; i++) {
      const length = Math.hypot(normal.getX(i), normal.getY(i), normal.getZ(i));
      expect(length).toBeCloseTo(1, 4);
    }
    if (original.chrome) {
      changed++;
      expect(hash(geometry.attributes.position.array)).not.toBe(
        original.attributes.position,
      );
      expect(geometry.index!.count / 3).toBeLessThan(60000);
      const expected = topology.find(
        (mesh: { name: string }) =>
          THREE.PropertyBinding.sanitizeNodeName(mesh.name) === object.name,
      );
      expect(expected).toBeDefined();
      const position = geometry.attributes.position;
      const points = Array.from({ length: position.count }, (_, i) =>
        [position.getX(i), position.getY(i), position.getZ(i)].map((v) =>
          Math.abs(v) < 1e-12 ? 0 : v,
        ),
      );
      points.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
      const sorted = new Float32Array(points.flat());
      expect(hash(sorted)).toBe(expected.expected_sorted_gltf_position_sha256);
      expect(position.count).toBe(expected.vertices);
      expect(geometry.index!.count / 3).toBe(expected.faces);
    } else {
      unchanged++;
      for (const [name, attribute] of Object.entries(geometry.attributes))
        expect(hash(attribute.array)).toBe(original.attributes[name]);
      expect(hash(geometry.index!.array)).toBe(original.indices);
    }
  });
  expect(changed).toBe(5);
  expect(unchanged).toBe(15);
  expect(topology).toHaveLength(5);
  for (const mesh of topology) {
    expect(mesh.nonmanifold_edges).toBe(0);
    expect(mesh.volume).toBeGreaterThan(0);
    expect(mesh.custom_normals).toBe(true);
  }
});
