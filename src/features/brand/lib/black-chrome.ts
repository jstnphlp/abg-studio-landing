import * as THREE from "three";

/** Clone object hierarchy only. Geometry, local transforms and all overlaps stay original. */
export function createBlackChromeLogo(source: THREE.Object3D): THREE.Object3D {
  const logo = source.clone(true);
  logo.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const original = object.material as THREE.Material;
    const chrome = original.name.toLowerCase().includes("chrome");
    const white = original.name.includes("Porcelain");
    object.material = new THREE.MeshStandardMaterial(
      chrome
        ? {
            color: new THREE.Color(0.13, 0.13, 0.13),
            metalness: 1,
            roughness: 0.11,
          }
        : white
          ? { color: 0xeeeeee, roughness: 0.6, envMapIntensity: 0.3 }
          : {
              color: new THREE.Color(0.012, 0.012, 0.012),
              metalness: 1,
              roughness: 0.13,
              envMapIntensity: 0.75,
            },
    );
    object.material.name = original.name;
  });
  return logo;
}
