import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as topojson from "topojson-client";
import { geoEquirectangular, geoPath, geoGraticule10 } from "d3-geo";
import countriesAtlas from "world-atlas/countries-110m.json";

const RADIUS = 1;
const RESUME_DELAY = 1500; // ms paused after a drag before auto-rotation resumes
const RESET_DURATION = 600; // ms for the reset-view camera animation
const ORIGIN = new THREE.Vector3(0, 0, 0);

const land = topojson.feature(countriesAtlas, countriesAtlas.objects.land);

// Paint an equirectangular vintage-paper world onto a canvas; wrapped onto the
// sphere it gives filled continents + outlines + graticule with exact colors.
function makeGlobeTexture() {
  const w = 2048;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  // Ocean
  ctx.fillStyle = "#4A90B8";
  ctx.fillRect(0, 0, w, h);

  const projection = geoEquirectangular()
    .scale(w / (2 * Math.PI))
    .translate([w / 2, h / 2]);
  const path = geoPath(projection, ctx);

  // Continent fill
  ctx.beginPath();
  path(land);
  ctx.fillStyle = "#EDE0C8";
  ctx.fill();

  // Latitude / longitude grid — dark brown at 10% opacity
  ctx.beginPath();
  path(geoGraticule10());
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = "#3D2B1F";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Landmass / continent outlines only (no internal country borders)
  ctx.beginPath();
  path(land);
  ctx.strokeStyle = "#3D2B1F";
  ctx.lineWidth = 1.4;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function Globe() {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    // Camera distance sized so the sphere fills ~80% of the canvas height.
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const DEFAULT_POS = new THREE.Vector3(
      0,
      0,
      RADIUS / (0.8 * Math.tan((45 * Math.PI) / 360))
    );
    camera.position.copy(DEFAULT_POS);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    const texture = makeGlobeTexture();
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshBasicMaterial({ map: texture })
    );
    globe.add(sphere);

    // Drag to rotate freely; zoom and pan disabled. Auto-rotates around Y at
    // ~20s/rotation (autoRotateSpeed 3 ≈ 2π/60·speed rad per frame at 60fps).
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 3;

    let resumeTimer = null;
    const clearResume = () => {
      if (resumeTimer) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
      clearResume();
    });
    controls.addEventListener("end", () => {
      clearResume();
      resumeTimer = setTimeout(() => {
        controls.autoRotate = true;
      }, RESUME_DELAY);
    });

    // Reset view — smoothly animate the camera back to the default
    // equator-facing position, then resume auto-rotation.
    let reset = null;
    const tmpTarget = new THREE.Vector3();
    const startReset = () => {
      clearResume();
      controls.autoRotate = false;
      controls.enabled = false;
      reset = {
        start: performance.now(),
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
      };
    };
    apiRef.current = { reset: startReset };

    const resize = () => {
      const size = container.clientWidth;
      renderer.setSize(size, size, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let frame;
    const animate = () => {
      if (reset) {
        const t = Math.min((performance.now() - reset.start) / RESET_DURATION, 1);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
        camera.position.lerpVectors(reset.fromPos, DEFAULT_POS, e);
        tmpTarget.lerpVectors(reset.fromTarget, ORIGIN, e);
        camera.up.set(0, 1, 0);
        camera.lookAt(tmpTarget);
        if (t >= 1) {
          controls.target.copy(ORIGIN);
          camera.position.copy(DEFAULT_POS);
          camera.lookAt(ORIGIN);
          controls.enabled = true;
          controls.autoRotate = true;
          controls.update();
          reset = null;
        }
      } else {
        controls.update();
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      clearResume();
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      texture.dispose();
      sphere.geometry.dispose();
      sphere.material.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      apiRef.current = null;
    };
  }, []);

  return (
    <div className="globe-wrap">
      <div className="globe-disc" ref={containerRef} aria-hidden="true" />
      <button className="globe-reset" onClick={() => apiRef.current?.reset()}>
        Reset view
      </button>
    </div>
  );
}
