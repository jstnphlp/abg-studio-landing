import * as THREE from "three";
import type { Appearance } from "@/features/appearance/theme-store";

/** Update uniforms in place: no new geometry, materials, downloads or context. */
export function applyLogoAppearance(
  logo: THREE.Object3D,
  appearance: Appearance,
): void {
  const dark = appearance === "dark";
  logo.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = object.material as THREE.MeshStandardMaterial;
    if (material.name.toLowerCase().includes("chrome")) {
      material.color.setRGB(
        dark ? 0.42 : 0.13,
        dark ? 0.42 : 0.13,
        dark ? 0.42 : 0.13,
      );
      material.metalness = 1;
      material.roughness = 0.11;
    } else if (!material.name.includes("Porcelain")) {
      material.color.copy(
        dark ? new THREE.Color(0xf5f5f2) : new THREE.Color(0.012, 0.012, 0.012),
      );
      material.metalness = dark ? 0 : 1;
      material.roughness = dark ? 0.5 : 0.13;
      material.envMapIntensity = dark ? 0.35 : 0.75;
    }
  });
}

/** Clone object hierarchy only. Geometry, local transforms and all overlaps stay original. */
export function createBlackChromeLogo(
  source: THREE.Object3D,
  appearance: Appearance = "light",
): THREE.Object3D {
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
  applyLogoAppearance(logo, appearance);
  return logo;
}
