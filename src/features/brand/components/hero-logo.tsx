"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createBlackChromeLogo } from "../lib/black-chrome";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";

// Share the parsed original across Strict Mode mounts and context recovery.
let originalLogo: Promise<GLTF> | undefined;
function loadOriginalLogo() {
  originalLogo ??= new GLTFLoader()
    .loadAsync("/brand/abg-logo.glb")
    .catch((error: unknown) => {
      originalLogo = undefined;
      throw error;
    });
  return originalLogo;
}

export function HeroLogo() {
  const host = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(true);
  const [status, setStatus] = useState<string | null>("Loading 3D logo...");
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let cancelled = false;
    let ready = false;
    let lost = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let scene: THREE.Scene | undefined;
    let environment: THREE.WebGLRenderTarget | undefined;
    let observer: ResizeObserver | undefined;
    let intersection: IntersectionObserver | undefined;
    let visible = true;
    let elapsed = 0;
    let lastDraw = 0;
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    let model: THREE.Group | undefined;
    let camera: THREE.OrthographicCamera | undefined;
    let frame = 0,
      last = 0,
      targetX = 0,
      targetY = 0;
    const bounds = new THREE.Vector3();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const hover = matchMedia("(hover: hover) and (pointer: fine)");
    function draw() {
      if (
        cancelled ||
        lost ||
        !ready ||
        !renderer ||
        !scene ||
        !camera ||
        !model ||
        document.hidden ||
        !visible
      )
        return;
      renderer.render(scene, camera);
      if (renderer.getContext().isContextLost()) return;
      if (element!.dataset.ready !== "true") {
        element!.dataset.ready = "true";
        setStatus(null);
        setFallback(false);
      }
    }
    function tick(now: number) {
      frame = 0;
      if (
        !model ||
        !ready ||
        cancelled ||
        reduced.matches ||
        document.hidden ||
        !visible
      )
        return;
      if (now - lastDraw < 32) {
        frame = requestAnimationFrame(tick);
        return;
      }
      lastDraw = now;
      elapsed += Math.min((now - last) / 1000, 0.05);
      const ease = 1 - Math.exp(-Math.min((now - last) / 1000, 0.05) * 7);
      last = now;
      model.rotation.x += (targetX - model.rotation.x) * ease;
      model.rotation.y += (targetY - model.rotation.y) * ease;
      scene!.environmentRotation.y = 0.2 + Math.sin(elapsed / 12) * 0.12;
      scene!.environmentRotation.z = Math.sin(elapsed / 17) * 0.035;
      draw();
      if (
        (!saveData && visible) ||
        Math.abs(targetX - model.rotation.x) +
          Math.abs(targetY - model.rotation.y) >
          0.0001
      )
        frame = requestAnimationFrame(tick);
    }
    function animate() {
      if (!frame && ready && !reduced.matches && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    }
    function resize() {
      if (!renderer || !camera || !model) return;
      const { width, height } = element!.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      const aspect = width / height,
        half = Math.max(bounds.y, bounds.x / aspect) * 0.5;
      camera.left = -half * aspect;
      camera.right = half * aspect;
      camera.top = half;
      camera.bottom = -half;
      camera.updateProjectionMatrix();
      draw();
    }
    function move(event: PointerEvent) {
      if (reduced.matches || !hover.matches || event.pointerType === "touch")
        return;
      const rect = element!.getBoundingClientRect();
      targetX =
        (-(event.clientY - rect.top - rect.height / 2) / rect.height) * 0.055;
      targetY =
        ((event.clientX - rect.left - rect.width / 2) / rect.width) * 0.075;
      animate();
    }
    function reset() {
      targetX = targetY = 0;
      cancelAnimationFrame(frame);
      frame = 0;
      if (model && (reduced.matches || !hover.matches))
        model.rotation.set(0, 0, 0);
      draw();
      animate();
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        draw();
        animate();
      }
    }
    function contextLost(event: Event) {
      event.preventDefault();
      lost = true;
      ready = false;
      cancelAnimationFrame(frame);
      frame = 0;
      delete element!.dataset.ready;
      setFallback(true);
      setStatus("3D logo unavailable. Refresh to try again.");
    }
    function contextRestored() {
      setStatus("Loading 3D logo...");
      setGeneration((value) => value + 1);
    }
    async function init() {
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        // Supersample even on 1x desktop displays: thin white reflections need
        // more coverage than native-resolution MSAA alone can provide.
        renderer.setPixelRatio(
          Math.min(Math.max(devicePixelRatio || 1, 2), 2.5),
        );
        renderer.setClearColor(0, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        renderer.domElement.addEventListener(
          "webglcontextrestored",
          contextRestored,
        );
        element!.append(renderer.domElement);
        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-6, 6, 4, -4, 0.1, 60);
        camera.position.z = 20;
        const gltf = await loadOriginalLogo();
        if (cancelled || lost) return;
        const studio = new THREE.Scene();
        studio.background = new THREE.Color(0.004, 0.004, 0.004);
        // Real white reflection cards against a nearly black studio. Broad cards
        // illuminate the faces; narrower strips follow the existing beveled edges.
        for (const [x, y, z, w, h, power] of [
          [-4, 2, 5, 2.5, 8, 7],
          [5, 0, 3, 0.7, 7, 10],
          [0, 5, 2, 8, 0.8, 8],
          [0, -3, 5, 8, 0.3, 12],
          [-1, 1, 7, 2.2, 3, 2.5],
        ]) {
          const card = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(power, power, power),
              side: THREE.DoubleSide,
              toneMapped: false,
            }),
          );
          card.position.set(x, y, z);
          card.lookAt(0, 0, 0);
          studio.add(card);
        }
        const pmrem = new THREE.PMREMGenerator(renderer);
        environment = pmrem.fromScene(studio, 0.015);
        scene.environment = environment.texture;
        scene.environmentIntensity = 1;
        scene.environmentRotation.y = 0.2;
        studio.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            (object.material as THREE.Material).dispose();
          }
        });
        pmrem.dispose();
        const key = new THREE.DirectionalLight(0xffffff, 2.5);
        key.position.set(-3, 5, 8);
        scene.add(key);
        const logo = createBlackChromeLogo(gltf.scene);
        logo.rotation.x = Math.PI / 2;
        logo.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(logo);
        box.getSize(bounds);
        logo.position.sub(box.getCenter(new THREE.Vector3()));
        model = new THREE.Group();
        model.add(logo);
        scene.add(model);
        observer = new ResizeObserver(resize);
        observer.observe(element!);
        ready = true;
        resize();
        intersection = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (!visible) {
            cancelAnimationFrame(frame);
            frame = 0;
          } else {
            draw();
            animate();
          }
        });
        intersection.observe(element!);
        animate();
      } catch (error) {
        ready = false;
        if (!cancelled) {
          setStatus("Static logo preview");
          setFallback(true);
          console.warn("ABG chrome logo unavailable", error);
        }
      }
    }
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    reduced.addEventListener("change", reset);
    hover.addEventListener("change", reset);
    document.addEventListener("visibilitychange", visibility);
    void init();
    return () => {
      cancelled = true;
      ready = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      intersection?.disconnect();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      reduced.removeEventListener("change", reset);
      hover.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", visibility);
      renderer?.domElement.removeEventListener("webglcontextlost", contextLost);
      renderer?.domElement.removeEventListener(
        "webglcontextrestored",
        contextRestored,
      );
      // Geometry is shared with the cached original; only instance materials are owned here.
      model?.traverse((object) => {
        if (object instanceof THREE.Mesh)
          (object.material as THREE.Material).dispose();
      });
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      renderer?.domElement.remove();
      delete element.dataset.ready;
    };
  }, [generation]);
  return (
    <div className="abg-logo-frame abg-live-logo">
      {/* eslint-disable-next-line @next/next/no-img-element -- Local transparent render of the identical GLB. */}
      <img
        className="abg-logo-fallback"
        src="/brand/abg-logo-black-chrome.webp"
        alt="ABG Studios - black chrome logo"
        hidden={!fallback}
        width={1200}
        height={808}
      />
      <div
        ref={host}
        className="abg-logo-canvas"
        role="img"
        aria-label="ABG Studios - original black chrome composition"
        aria-hidden={fallback}
        style={{ opacity: fallback ? 0 : 1 }}
      />
      {status && (
        <p className="abg-logo-status" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
