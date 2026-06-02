import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

(function () {
  const canvas = document.querySelector('.hero-3d');
  if (!canvas) return;

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOn = () => root.getAttribute('data-motion') !== 'off' && !reduced.matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
  } catch {
    canvas.style.display = 'none';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 9.4);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const group = new THREE.Group();
  scene.add(group);

  const palette = {
    blue: 0x6cb7ff,
    steel: 0xb9d9f3,
    green: 0x7df0ad,
    amber: 0xe7c77a,
    white: 0xf5fbff
  };

  scene.add(new THREE.AmbientLight(0x6c9dc9, 1.2));
  const key = new THREE.PointLight(0x8fc9ff, 24, 18);
  key.position.set(-4, 3.2, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x7df0ad, 12, 16);
  rim.position.set(4, -2.6, 3);
  scene.add(rim);

  const hub = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.58, 2),
    new THREE.MeshStandardMaterial({
      color: palette.white,
      emissive: palette.blue,
      emissiveIntensity: 0.28,
      metalness: 0.22,
      roughness: 0.32
    })
  );
  group.add(hub);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.78, 32, 16),
    new THREE.MeshBasicMaterial({
      color: palette.blue,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    })
  );
  group.add(halo);

  const ringMaterials = [
    new THREE.MeshBasicMaterial({ color: palette.blue, transparent: true, opacity: 0.42 }),
    new THREE.MeshBasicMaterial({ color: palette.green, transparent: true, opacity: 0.36 }),
    new THREE.MeshBasicMaterial({ color: palette.amber, transparent: true, opacity: 0.28 })
  ];
  [1.25, 1.72, 2.18].forEach((radius, index) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.009, 8, 160),
      ringMaterials[index]
    );
    ring.rotation.x = Math.PI / 2 + index * 0.22;
    ring.rotation.y = index * 0.36;
    ring.userData.spin = (index + 1) * 0.00045;
    group.add(ring);
  });

  const crateMat = new THREE.MeshStandardMaterial({
    color: 0xd9e8f7,
    emissive: 0x2d6fa8,
    emissiveIntensity: 0.14,
    metalness: 0.12,
    roughness: 0.44
  });
  const crateEdgesMat = new THREE.LineBasicMaterial({ color: 0x8fc9ff, transparent: true, opacity: 0.42 });
  const crates = [];
  for (let i = 0; i < 14; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), crateMat);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), crateEdgesMat);
    box.add(edges);
    box.userData = {
      angle: (i / 14) * Math.PI * 2,
      radius: 1.38 + (i % 3) * 0.44,
      speed: 0.0012 + (i % 5) * 0.00018,
      y: ((i % 4) - 1.5) * 0.18
    };
    crates.push(box);
    group.add(box);
  }

  const routes = [];
  const routeMat = new THREE.MeshBasicMaterial({ color: palette.blue, transparent: true, opacity: 0.22 });
  const routePoints = [
    [-3.8, 1.4, -0.8],
    [-3.1, -1.6, 0.2],
    [-0.8, 2.7, -0.5],
    [2.1, 2.2, -0.8],
    [3.4, 0.4, 0.1],
    [2.7, -2.1, -0.4],
    [-1.4, -2.7, 0.2]
  ];
  routePoints.forEach((target, index) => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(...target);
    const mid = start.clone().lerp(end, 0.5);
    mid.z += 1.4 + (index % 3) * 0.45;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 54, 0.008, 8, false), routeMat);
    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 18, 10),
      new THREE.MeshBasicMaterial({ color: index % 2 ? palette.green : palette.white })
    );
    pulse.userData = { curve, t: index / routePoints.length, speed: 0.0013 + (index % 4) * 0.00022 };
    routes.push(pulse);
    group.add(tube, pulse);
  });

  const starGeo = new THREE.BufferGeometry();
  const starCount = 170;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10.5;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 2] = -2 - Math.random() * 4;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      color: 0xa9d7ff,
      size: 0.024,
      transparent: true,
      opacity: 0.48,
      depthWrite: false
    })
  );
  group.add(stars);

  const state = { mx: 0, my: 0, px: 0, py: 0, w: 0, h: 0 };
  window.addEventListener('pointermove', (event) => {
    if (!fine) return;
    state.mx = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    state.my = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
  }, { passive: true });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    state.w = Math.max(1, rect.width);
    state.h = Math.max(1, rect.height);
    renderer.setSize(state.w, state.h, false);
    camera.aspect = state.w / state.h;
    camera.updateProjectionMatrix();
    const mobile = state.w < 760;
    group.position.set(mobile ? 1.35 : 2.65, mobile ? -0.92 : 0.05, mobile ? -0.25 : 0);
    group.scale.setScalar(mobile ? 0.64 : 1);
  }

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.034);
    const elapsed = clock.elapsedTime;
    if (motionOn()) {
      state.px += (state.mx - state.px) * 0.035;
      state.py += (state.my - state.py) * 0.035;
      group.rotation.y += dt * 0.12;
      group.rotation.x = -0.2 + state.py * 0.12;
      group.rotation.z = state.px * -0.08;
      halo.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.035);
      hub.rotation.y += dt * 0.42;
      stars.rotation.y -= dt * 0.015;
      group.children.forEach((child) => {
        if (child.userData.spin) child.rotation.z += child.userData.spin * 60 * dt;
      });
      crates.forEach((box) => {
        box.userData.angle += box.userData.speed * 60 * dt;
        const a = box.userData.angle;
        box.position.set(
          Math.cos(a) * box.userData.radius,
          box.userData.y + Math.sin(a * 1.7) * 0.12,
          Math.sin(a) * box.userData.radius * 0.36
        );
        box.rotation.x += dt * 0.52;
        box.rotation.y += dt * 0.72;
      });
      routes.forEach((pulse) => {
        pulse.userData.t = (pulse.userData.t + pulse.userData.speed * 60 * dt) % 1;
        const p = pulse.userData.curve.getPointAt(pulse.userData.t);
        pulse.position.copy(p);
        const s = 0.72 + Math.sin(elapsed * 6 + pulse.userData.t * 10) * 0.18;
        pulse.scale.setScalar(s);
      });
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  frame();
})();
