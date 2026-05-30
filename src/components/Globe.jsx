import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as topojson from "topojson-client";
import { geoEquirectangular, geoPath, geoGraticule10 } from "d3-geo";
import countriesAtlas from "world-atlas/countries-110m.json";

const RADIUS = 1;
const RESUME_DELAY = 1500; // ms paused after a drag before auto-rotation resumes
const RESET_DURATION = 600; // ms for the reset-view camera animation
const ORIGIN = new THREE.Vector3(0, 0, 0);

// Base auto-rotation: one full turn every 20 seconds, scaled by the speed
// multiplier and integrated with delta-time so it's frame-rate independent.
const BASE_SPEED = (2 * Math.PI) / 20; // rad per second

const SPEEDS = [0.5, 1.0, 2.0, 5.0];

// The three swappable spheres. Earth uses the locally-painted canvas texture
// (continents + ocean); Mars and Jupiter load NASA equirectangular-ish photos.
const PLANETS = [
  { id: "earth", name: "Earth" },
  {
    id: "mars",
    name: "Mars",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Solarsystemscope_texture_8k_mars.jpg/1280px-Solarsystemscope_texture_8k_mars.jpg",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/be/Solarsystemscope_texture_2k_jupiter.jpg",
  },
];

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

  // Refs mirror the playback state so the animation loop (set up once) can read
  // the latest values without re-running the Three.js effect.
  const playingRef = useRef(true);
  const speedRef = useRef(1.0);

  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [planetIndex, setPlanetIndex] = useState(0);

  const togglePlay = () =>
    setPlaying((p) => {
      const next = !p;
      playingRef.current = next;
      return next;
    });

  const changeSpeed = (s) => {
    speedRef.current = s;
    setSpeed(s);
  };

  const cyclePlanet = (dir) =>
    setPlanetIndex((i) => (i + dir + PLANETS.length) % PLANETS.length);

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

    const earthTexture = makeGlobeTexture();
    earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 64, 64),
      new THREE.MeshBasicMaterial({ map: earthTexture })
    );
    globe.add(sphere);

    // Lazily-loaded planet textures, keyed by planet id. Earth is ready now.
    const textures = { earth: earthTexture };
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");

    const setPlanet = (id) => {
      const apply = (tex) => {
        sphere.material.map = tex;
        sphere.material.needsUpdate = true;
      };
      if (textures[id]) {
        apply(textures[id]);
        return;
      }
      const planet = PLANETS.find((p) => p.id === id);
      if (!planet?.url) return;
      loader.load(planet.url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        textures[id] = tex;
        apply(tex);
      });
    };

    // Drag to rotate freely; zoom and pan disabled. Auto-rotation is handled
    // manually (delta-time) in the animation loop rather than by OrbitControls.
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = false;

    // While the user drags (and briefly after) we suspend the spin regardless of
    // the play/pause state, then let it resume if still playing.
    let dragSuspended = false;
    let resumeTimer = null;
    const clearResume = () => {
      if (resumeTimer) {
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    };
    controls.addEventListener("start", () => {
      dragSuspended = true;
      clearResume();
    });
    controls.addEventListener("end", () => {
      clearResume();
      resumeTimer = setTimeout(() => {
        dragSuspended = false;
      }, RESUME_DELAY);
    });

    // Reset view — smoothly animate the camera back to the default
    // equator-facing position, then resume auto-rotation.
    let reset = null;
    const tmpTarget = new THREE.Vector3();
    const startReset = () => {
      clearResume();
      dragSuspended = false;
      controls.enabled = false;
      reset = {
        start: performance.now(),
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
      };
    };
    apiRef.current = { reset: startReset, setPlanet };

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

    const clock = new THREE.Clock();
    let frame;
    const animate = () => {
      const delta = clock.getDelta();

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
          controls.update();
          reset = null;
        }
      } else {
        if (playingRef.current && !dragSuspended) {
          globe.rotation.y += BASE_SPEED * speedRef.current * delta;
        }
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
      Object.values(textures).forEach((t) => t.dispose());
      sphere.geometry.dispose();
      sphere.material.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      apiRef.current = null;
    };
  }, []);

  // Swap the sphere texture whenever the selected planet changes. Runs after the
  // Three.js setup effect above, so apiRef is always populated by this point.
  useEffect(() => {
    apiRef.current?.setPlanet(PLANETS[planetIndex].id);
  }, [planetIndex]);

  return (
    <div className="globe-wrap">
      <div className="globe-disc" ref={containerRef} aria-hidden="true" />

      <div className="globe-controls">
        <button
          className="globe-btn"
          onClick={() => cyclePlanet(-1)}
          aria-label="Previous planet"
        >
          ⏮
        </button>
        <button
          className="globe-btn"
          onClick={togglePlay}
          aria-label={playing ? "Pause rotation" : "Play rotation"}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button
          className="globe-btn"
          onClick={() => cyclePlanet(1)}
          aria-label="Next planet"
        >
          ⏭
        </button>

        <div className="globe-speed">
          <button className="globe-btn globe-speed-btn" aria-label="Rotation speed">
            {speed.toFixed(1)}×
          </button>
          <div className="globe-speed-menu">
            {SPEEDS.map((s) => (
              <button
                key={s}
                className={s === speed ? "active" : ""}
                onClick={() => changeSpeed(s)}
              >
                {s.toFixed(1)}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="globe-reset" onClick={() => apiRef.current?.reset()}>
        Reset View
      </button>
    </div>
  );
}
