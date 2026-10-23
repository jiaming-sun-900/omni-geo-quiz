import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import * as topojson from "topojson-client";
import { geoEquirectangular, geoPath, geoGraticule10 } from "d3-geo";
import countriesAtlas from "world-atlas/countries-110m.json";

const RADIUS = 1;
// The canvas is drawn larger than the sphere so Saturn's ring (outer radius 2.2)
// fits inside the frame instead of being clipped at the canvas edge. The camera
// zooms out by the same factor so the sphere keeps its on-screen size.
const CANVAS_SCALE = 2.5;
const RESUME_DELAY = 1500; // ms paused after a drag before auto-rotation resumes
const RESET_DURATION = 600; // ms for the reset-view camera animation
const ORIGIN = new THREE.Vector3(0, 0, 0);

// Auto-rotation: one full turn every 20 seconds, integrated with delta-time so
// it's frame-rate independent.
const BASE_SPEED = (2 * Math.PI) / 20; // rad per second

// Planet textures are self-hosted under public/textures/ rather than hotlinked
// from Wikimedia Commons. They used to be fetched from the Commons CDN at click
// time, which made a core piece of the home screen depend on a third party at
// runtime — an offline or filtered network, or a renamed Commons file, silently
// fell back to a flat colour. All five are CC BY 4.0 by Solar System Scope; the
// credit is in the home page footer (and on About).
const TEX_BASE = `${import.meta.env.BASE_URL}textures/`;

// The swappable spheres. Earth uses the locally-painted canvas texture
// (continents + ocean); the others load equirectangular planet photos. Saturn
// additionally gets a tilted 3D ring (see the Three.js setup effect below).
const PLANETS = [
  { id: "earth", name: "Earth", color: "#4A90B8" },
  { id: "mars", name: "Mars", color: "#C1440E", url: `${TEX_BASE}mars.jpg` },
  { id: "jupiter", name: "Jupiter", color: "#C88B3A", url: `${TEX_BASE}jupiter.jpg` },
  { id: "saturn", name: "Saturn", color: "#C8A96E", url: `${TEX_BASE}saturn.jpg` },
  { id: "neptune", name: "Neptune", color: "#3F54BA", url: `${TEX_BASE}neptune.jpg` },
];

// Saturn's ring texture: a radial slice (with alpha) from the same Solar System
// Scope set as the planet photos above.
const SATURN_RING_URL = `${TEX_BASE}saturn-ring-alpha.png`;

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

  // A ref mirrors the play state so the animation loop (set up once) can read
  // the latest value without re-running the Three.js effect.
  const playingRef = useRef(true);

  const [playing, setPlaying] = useState(true);
  const [planetIndex, setPlanetIndex] = useState(0);
  // Whether the user has dragged the view away from its default. Reset View is
  // only offered then: before any drag it has nothing to reset.
  const [moved, setMoved] = useState(false);

  const togglePlay = () =>
    setPlaying((p) => {
      const next = !p;
      playingRef.current = next;
      return next;
    });

  // Drag-to-scrub: while the mouse is held down over the dots row, switch to
  // whichever dot the cursor is currently over, so a single click-and-drag can
  // sweep through all five planets. Works alongside the per-dot click handler.
  const dotsRef = useRef(null);
  const draggingRef = useRef(false);

  const dotIndexFromX = (clientX) => {
    const dots = dotsRef.current?.children;
    if (!dots) return -1;
    for (let i = 0; i < dots.length; i++) {
      const r = dots[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) return i;
    }
    return -1;
  };

  const startScrub = (e) => {
    draggingRef.current = true;
    const i = dotIndexFromX(e.clientX);
    if (i !== -1) setPlanetIndex(i);
  };

  const scrub = (e) => {
    if (!draggingRef.current) return;
    const i = dotIndexFromX(e.clientX);
    if (i !== -1) setPlanetIndex(i);
  };

  useEffect(() => {
    const endScrub = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mouseup", endScrub);
    return () => window.removeEventListener("mouseup", endScrub);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    // Camera distance sized so the sphere fills ~80% of the canvas height.
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const DEFAULT_POS = new THREE.Vector3(
      0,
      0,
      (RADIUS / (0.8 * Math.tan((45 * Math.PI) / 360))) * CANVAS_SCALE
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

    // Saturn's rings: a real 3D ring added to the same group as the sphere, so it
    // auto-rotates and responds to camera drag. Tilted 63° (27° off horizontal) to
    // echo Saturn's axial tilt, so from the equatorial camera it reads as the
    // classic thin ellipse. Shown only while Saturn is the active planet.
    const ringGeometry = new THREE.RingGeometry(1.3, 2.2, 64);
    // Remap UVs so the texture's horizontal axis runs along the ring's radius —
    // this turns the radial-slice image into concentric bands instead of a flat
    // stamped square.
    const ringPos = ringGeometry.attributes.position;
    const ringUv = ringGeometry.attributes.uv;
    const ringVec = new THREE.Vector3();
    const ringMid = (1.3 + 2.2) / 2;
    for (let i = 0; i < ringPos.count; i++) {
      ringVec.fromBufferAttribute(ringPos, i);
      ringUv.setXY(i, ringVec.length() < ringMid ? 0 : 1, 1);
    }
    const ringMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = (63 * Math.PI) / 180;
    ring.visible = false;
    globe.add(ring);

    // Lazily-loaded planet textures, keyed by planet id. Earth is ready now.
    const textures = { earth: earthTexture };
    const loader = new THREE.TextureLoader();

    // Every texture here is fetched over the network, so a load can still land
    // after this effect is torn down. The callbacks below all bail on this flag:
    // without it they write into the orphaned `textures` map and flag
    // `needsUpdate` on an already-disposed material.
    let disposed = false;
    let ringTexture = null;

    // Load Saturn's ring texture once and apply it to the ring material. A
    // failure here just leaves the untextured ring geometry, which still reads
    // as a ring, so there is nothing to fall back to. Held in its own variable
    // rather than in `textures` (which is keyed by planet id) so the cleanup
    // still disposes it — Material.dispose() does not touch its own maps.
    loader.load(
      SATURN_RING_URL,
      (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        ringTexture = tex;
        ringMaterial.map = tex;
        ringMaterial.needsUpdate = true;
      },
      undefined,
      () => {}
    );

    // The planet the user last picked, and the photo downloads still running.
    // A download can finish after the user has moved on (jupiter.jpg is ~0.5 MB,
    // saturn.jpg 60 kB, so Mars → Jupiter → Saturn on a slow line used to end on
    // Jupiter), so a texture is only put on the sphere if its planet is still
    // the current one. It is cached either way, and a planet whose download is
    // already running doesn't start a second one, whose texture would leak.
    let currentId = null;
    const inFlight = new Set();

    const setPlanet = (id) => {
      currentId = id;
      ring.visible = id === "saturn";
      const planet = PLANETS.find((p) => p.id === id);
      const apply = (tex) => {
        sphere.material.map = tex;
        sphere.material.color.set("#ffffff");
        sphere.material.needsUpdate = true;
      };
      // A photo can fail to load: offline, or a file missing from the deploy.
      // Without this the sphere kept the PREVIOUS planet's texture while the
      // label read the new one, so a failed Mars looked exactly like Earth. Fall
      // back to the planet's flat base colour instead: plainly not a photo, but
      // at least it is the right planet.
      const applyFallbackColour = () => {
        if (disposed || currentId !== id) return;
        sphere.material.map = null;
        sphere.material.color.set(planet?.color || "#888888");
        sphere.material.needsUpdate = true;
      };
      if (textures[id]) {
        apply(textures[id]);
        return;
      }
      if (!planet?.url) return;
      // Clear the outgoing planet's photo right away so the wrong texture is
      // never shown while the new one is in flight.
      applyFallbackColour();
      if (inFlight.has(id)) return;
      inFlight.add(id);
      loader.load(
        planet.url,
        (tex) => {
          inFlight.delete(id);
          if (disposed) {
            tex.dispose();
            return;
          }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          textures[id] = tex;
          if (currentId === id) apply(tex);
        },
        undefined,
        () => {
          inFlight.delete(id);
          applyFallbackColour();
        }
      );
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
      setMoved(true);
    });
    controls.addEventListener("end", () => {
      clearResume();
      resumeTimer = setTimeout(() => {
        dragSuspended = false;
      }, RESUME_DELAY);
    });

    // Cursor affordance: show the grab hand over the planet so it reads as
    // draggable. This has to be a raycast, not `cursor: grab` in CSS — the
    // canvas is CANVAS_SCALE (2.5×) the size of the visible disc and fully
    // transparent outside the planet, so a blanket rule would put the grab hand
    // over a large empty region of the home screen. Saturn's ring is included
    // because dragging it rotates the globe just the same. `grabbing` holds for
    // the whole drag even once the pointer slides off the sphere.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let overPlanet = false;
    let grabbing = false;
    const applyCursor = () => {
      renderer.domElement.style.cursor = grabbing
        ? "grabbing"
        : overPlanet
          ? "grab"
          : "";
    };
    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit =
        raycaster.intersectObjects(ring.visible ? [sphere, ring] : [sphere], false)
          .length > 0;
      if (hit !== overPlanet) {
        overPlanet = hit;
        applyCursor();
      }
    };
    const onPointerLeave = () => {
      overPlanet = false;
      applyCursor();
    };
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    controls.addEventListener("start", () => {
      grabbing = true;
      applyCursor();
    });
    controls.addEventListener("end", () => {
      grabbing = false;
      applyCursor();
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

    // The canvas is always square and always displayed at CANVAS_SCALE of the
    // disc box, so neither the CSS size nor the camera aspect ever changes.
    renderer.domElement.style.width = `${CANVAS_SCALE * 100}%`;
    renderer.domElement.style.height = `${CANVAS_SCALE * 100}%`;
    camera.aspect = 1;
    camera.updateProjectionMatrix();

    // Only the drawing buffer tracks the container. setSize reallocates it, so
    // bail when the measurement hasn't actually changed: the observer fires on
    // every step of a window drag and on mobile URL-bar collapse, and each of
    // those would otherwise throw away and rebuild a multi-megapixel buffer.
    let lastSize = 0;
    const resize = () => {
      const size = Math.round(container.clientWidth * CANVAS_SCALE);
      if (size === 0 || size === lastSize) return;
      lastSize = size;
      renderer.setSize(size, size, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    // THREE.Clock is deprecated as of three 0.184; the file already reads
    // performance.now() directly for the reset tween, so do the same here
    // rather than pull in the Timer addon.
    let last = performance.now();
    let frame;
    const animate = () => {
      const now = performance.now();
      const delta = (now - last) / 1000;
      last = now;

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
          globe.rotation.y += BASE_SPEED * delta;
        }
        controls.update();
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      clearResume();
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();
      renderer.dispose();
      // dispose() frees Three's GPU resources but not the WebGL context itself;
      // after ~16 Home ↔ quiz round trips Chrome starts evicting old contexts.
      renderer.forceContextLoss();
      Object.values(textures).forEach((t) => t.dispose());
      ringTexture?.dispose();
      sphere.geometry.dispose();
      sphere.material.dispose();
      ringGeometry.dispose();
      ringMaterial.dispose();
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

  const resetView = () => {
    apiRef.current?.reset();
    setMoved(false);
  };

  // One row under the planet: play/pause, a dot per planet, and the planet's
  // name. There used to be four rows (dots; previous / play / next plus a radial
  // speed menu; Reset View; the texture credit), which competed with the Daily
  // Challenge for attention. The dots already switch planets, so previous / next
  // went; the speed menu went; Reset View only appears once there is something to
  // reset; the credit moved to the home footer.
  return (
    <div className="globe-wrap">
      <div className="globe-stage">
        <div className="globe-disc" ref={containerRef} aria-hidden="true" />
        {moved && (
          <button type="button" className="globe-reset" onClick={resetView}>
            Reset view
          </button>
        )}
      </div>

      <div className="globe-bar">
        <button
          type="button"
          className="globe-btn"
          onClick={togglePlay}
          aria-label={playing ? "Pause rotation" : "Play rotation"}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <div
          className="globe-dots"
          ref={dotsRef}
          onMouseDown={startScrub}
          onMouseMove={scrub}
        >
          {PLANETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`globe-dot${i === planetIndex ? " active" : ""}`}
              style={{ "--planet-color": p.color }}
              onClick={() => setPlanetIndex(i)}
              aria-label={p.name}
              aria-pressed={i === planetIndex}
            />
          ))}
        </div>
        <span className="globe-name" aria-hidden="true">
          {PLANETS[planetIndex].name}
        </span>
      </div>
    </div>
  );
}
