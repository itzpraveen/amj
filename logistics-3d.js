import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

(function () {
  const canvas = document.querySelector('.hero-3d');
  if (!canvas) return;

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motionOn = () => root.getAttribute('data-motion') !== 'off' && !reduced.matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
  } catch {
    canvas.style.display = 'none';
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 9.2);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const palette = {
    blue: 0x70bdff,
    deepBlue: 0x10375e,
    green: 0x7ef2ad,
    amber: 0xe8c56e,
    white: 0xf6fbff,
    steel: 0xa9d4f0
  };

  scene.add(new THREE.AmbientLight(0x83b9e5, 1.15));
  const key = new THREE.PointLight(0x8fcbff, 24, 18);
  key.position.set(-4.5, 3.2, 5);
  scene.add(key);
  const rim = new THREE.PointLight(0x80f0b0, 10, 14);
  rim.position.set(4, -2.2, 3.2);
  scene.add(rim);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);
  const labels = [];

  const mapGroup = new THREE.Group();
  mapGroup.rotation.x = -0.26;
  mapGroup.rotation.y = -0.18;
  rootGroup.add(mapGroup);

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function makeLabel(text, opts = {}) {
    const dpr = 2;
    const fontSize = opts.size || 24;
    const padX = opts.padX || 22;
    const padY = opts.padY || 11;
    const canvasLabel = document.createElement('canvas');
    const ctx = canvasLabel.getContext('2d');
    ctx.font = `600 ${fontSize}px Hanken Grotesk, system-ui, sans-serif`;
    const width = Math.ceil(ctx.measureText(text).width + padX * 2);
    const height = Math.ceil(fontSize + padY * 2);
    canvasLabel.width = width * dpr;
    canvasLabel.height = height * dpr;
    canvasLabel.style.width = `${width}px`;
    canvasLabel.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    ctx.font = `600 ${fontSize}px Hanken Grotesk, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    roundedRect(ctx, 1, 1, width - 2, height - 2, opts.radius || 16);
    ctx.fillStyle = opts.bg || 'rgba(8, 24, 42, 0.58)';
    ctx.fill();
    ctx.strokeStyle = opts.stroke || 'rgba(150, 210, 255, 0.34)';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (opts.dot) {
      ctx.beginPath();
      ctx.arc(padX - 5, height / 2, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = opts.dot;
      ctx.fill();
      ctx.shadowColor = opts.dot;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = opts.color || 'rgba(245, 251, 255, 0.92)';
    ctx.letterSpacing = '1px';
    ctx.fillText(text, opts.dot ? padX + 10 : padX, height / 2 + 1);
    const texture = new THREE.CanvasTexture(canvasLabel);
    texture.anisotropy = 4;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false
    }));
    const scale = opts.scale || 0.01;
    sprite.scale.set(width * scale, height * scale, 1);
    sprite.renderOrder = 20;
    labels.push(sprite);
    return sprite;
  }

  const qatar = [
    [-0.46, 1.95], [0.12, 2.18], [0.50, 1.86], [0.70, 1.28],
    [0.62, 0.66], [0.82, 0.15], [0.60, -0.38], [0.38, -1.06],
    [0.05, -1.78], [-0.30, -1.92], [-0.52, -1.36], [-0.66, -0.58],
    [-0.57, 0.22], [-0.70, 0.86], [-0.61, 1.48]
  ];

  const shape = new THREE.Shape(qatar.map(([x, y]) => new THREE.Vector2(x, y)));
  const mapFill = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color: palette.blue,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  mapGroup.add(mapFill);

  const outlinePoints = qatar.map(([x, y]) => new THREE.Vector3(x, y, 0.018));
  outlinePoints.push(outlinePoints[0].clone());
  const outline = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(outlinePoints),
    new THREE.LineBasicMaterial({ color: palette.steel, transparent: true, opacity: 0.58 })
  );
  mapGroup.add(outline);

  const coastLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0.42, 1.62, 0.025),
      new THREE.Vector3(0.50, 0.92, 0.025),
      new THREE.Vector3(0.57, 0.34, 0.025),
      new THREE.Vector3(0.44, -0.36, 0.025),
      new THREE.Vector3(0.25, -1.08, 0.025)
    ]),
    new THREE.LineBasicMaterial({ color: palette.green, transparent: true, opacity: 0.32 })
  );
  mapGroup.add(coastLine);

  const hubPos = new THREE.Vector3(0.48, -0.12, 0.22);
  const hub = new THREE.Group();
  hub.position.copy(hubPos);
  mapGroup.add(hub);

  const hubCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.16, 0.18, 32),
    new THREE.MeshStandardMaterial({
      color: palette.white,
      emissive: palette.blue,
      emissiveIntensity: 0.44,
      metalness: 0.18,
      roughness: 0.35
    })
  );
  hubCore.rotation.x = Math.PI / 2;
  hub.add(hubCore);

  const hubGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 32, 16),
    new THREE.MeshBasicMaterial({
      color: palette.blue,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    })
  );
  hub.add(hubGlow);

  const hubLabel = makeLabel('AMJ hub', { size: 18, scale: 0.0052, dot: 'rgba(126,242,173,1)' });
  hubLabel.position.set(0.06, 0.34, 0.25);
  hub.add(hubLabel);

  const tempRings = [
    { name: 'Ambient', color: palette.amber, r: 0.55, z: 0.05, speed: 0.16 },
    { name: 'Chilled', color: palette.blue, r: 0.75, z: 0.09, speed: -0.11 },
    { name: 'Frozen', color: palette.green, r: 0.96, z: 0.13, speed: 0.08 }
  ].map((item, index) => {
    const mat = new THREE.MeshBasicMaterial({ color: item.color, transparent: true, opacity: 0.32 - index * 0.04 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(item.r, 0.008, 8, 150), mat);
    ring.position.copy(hubPos);
    ring.position.z += item.z;
    ring.rotation.x = Math.PI / 2;
    ring.scale.y = 0.42;
    ring.userData.speed = item.speed;
    mapGroup.add(ring);

    const label = makeLabel(item.name, {
      size: 15,
      scale: 0.0045,
      bg: 'rgba(8, 24, 42, 0.44)',
      stroke: 'rgba(255,255,255,0.18)',
      dot: index === 0 ? 'rgba(232,197,110,1)' : index === 1 ? 'rgba(112,189,255,1)' : 'rgba(126,242,173,1)'
    });
    label.position.set(hubPos.x - 1.06 + index * 0.18, hubPos.y - 1.02 - index * 0.13, 0.62 + index * 0.03);
    mapGroup.add(label);
    return ring;
  });

  const markerMat = new THREE.MeshBasicMaterial({ color: palette.green, transparent: true, opacity: 0.96 });
  const markerRingMat = new THREE.MeshBasicMaterial({ color: palette.blue, transparent: true, opacity: 0.24 });
  const routes = [];
  const targets = [
    { name: 'Retail', p: [-0.12, 1.25, 0.2], color: palette.green },
    { name: 'HORECA', p: [-0.50, 0.36, 0.2], color: palette.blue },
    { name: 'Restaurants', p: [0.20, -1.18, 0.2], color: palette.amber },
    { name: 'Institutions', p: [-0.42, -0.72, 0.2], color: palette.green },
    { name: 'Lulu', p: [1.25, 0.82, 0.22], color: palette.green },
    { name: 'Al Meera', p: [1.32, 0.10, 0.22], color: palette.blue },
    { name: 'Carrefour', p: [1.08, -0.58, 0.22], color: palette.amber }
  ];

  targets.forEach((target, index) => {
    const end = new THREE.Vector3(...target.p);
    const mid = hubPos.clone().lerp(end, 0.5);
    mid.z += 0.82 + (index % 3) * 0.16;
    mid.x += (index % 2 ? -0.12 : 0.12);
    const curve = new THREE.QuadraticBezierCurve3(hubPos, mid, end);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 56, 0.006, 8, false),
      new THREE.MeshBasicMaterial({ color: target.color, transparent: true, opacity: index > 3 ? 0.18 : 0.26 })
    );
    mapGroup.add(tube);

    const marker = new THREE.Mesh(new THREE.SphereGeometry(index > 3 ? 0.052 : 0.065, 18, 10), markerMat.clone());
    marker.material.color.setHex(target.color);
    marker.position.copy(end);
    mapGroup.add(marker);

    const markerRing = new THREE.Mesh(new THREE.TorusGeometry(index > 3 ? 0.12 : 0.16, 0.004, 8, 48), markerRingMat);
    markerRing.position.copy(end);
    markerRing.rotation.x = Math.PI / 2;
    markerRing.userData.pulseOffset = index * 0.5;
    mapGroup.add(markerRing);

    const pulse = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 18, 10),
      new THREE.MeshBasicMaterial({ color: target.color, transparent: true, opacity: 0.94 })
    );
    pulse.userData = {
      curve,
      t: index / targets.length,
      speed: 0.0012 + (index % 4) * 0.0002
    };
    routes.push(pulse);
    mapGroup.add(pulse);

    const label = makeLabel(target.name, {
      size: index > 3 ? 16 : 17,
      scale: index > 3 ? 0.0047 : 0.005,
      bg: index > 3 ? 'rgba(8, 24, 42, 0.46)' : 'rgba(8, 24, 42, 0.58)',
      stroke: 'rgba(150, 210, 255, 0.26)',
      dot: target.color === palette.green ? 'rgba(126,242,173,1)' : target.color === palette.amber ? 'rgba(232,197,110,1)' : 'rgba(112,189,255,1)'
    });
    label.position.set(end.x + (index > 3 ? -0.33 : -0.30), end.y + (index % 2 ? -0.08 : 0.12), end.z + 0.28);
    mapGroup.add(label);
  });

  const crateMat = new THREE.MeshStandardMaterial({
    color: 0xdceaf6,
    emissive: 0x2d6fa8,
    emissiveIntensity: 0.15,
    metalness: 0.12,
    roughness: 0.44
  });
  const crates = [];
  for (let i = 0; i < 10; i++) {
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), crateMat);
    box.userData = {
      angle: (i / 10) * Math.PI * 2,
      radius: 0.58 + (i % 3) * 0.22,
      speed: 0.001 + (i % 4) * 0.0002,
      lift: ((i % 4) - 1.5) * 0.055
    };
    crates.push(box);
    hub.add(box);
  }

  const sourceLabel = makeLabel('World brands', {
    size: 17,
    scale: 0.0049,
    bg: 'rgba(8, 24, 42, 0.46)',
    stroke: 'rgba(255,255,255,0.18)',
    dot: 'rgba(112,189,255,1)'
  });
  sourceLabel.position.set(-1.30, 0.06, 0.52);
  mapGroup.add(sourceLabel);
  const sourceRoute = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.15, 0.03, 0.28),
      new THREE.Vector3(-0.38, -0.02, 0.34),
      hubPos
    ]),
    new THREE.LineBasicMaterial({ color: palette.blue, transparent: true, opacity: 0.28 })
  );
  mapGroup.add(sourceRoute);

  const starsGeo = new THREE.BufferGeometry();
  const starCount = 150;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 7.2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5.6;
    positions[i * 3 + 2] = -1.6 - Math.random() * 2.4;
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(
    starsGeo,
    new THREE.PointsMaterial({
      color: 0xa9d7ff,
      size: 0.024,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    })
  );
  rootGroup.add(stars);

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
    rootGroup.position.set(mobile ? 1.06 : 2.68, mobile ? -0.62 : 0.12, mobile ? -0.18 : 0);
    rootGroup.scale.setScalar(mobile ? 0.72 : 0.94);
    labels.forEach((label) => {
      label.visible = !mobile;
    });
  }

  const clock = new THREE.Clock();
  function frame() {
    const dt = Math.min(clock.getDelta(), 0.034);
    const elapsed = clock.elapsedTime;

    if (motionOn()) {
      state.px += (state.mx - state.px) * 0.035;
      state.py += (state.my - state.py) * 0.035;
      rootGroup.rotation.y = state.px * -0.08 + Math.sin(elapsed * 0.16) * 0.035;
      rootGroup.rotation.x = state.py * 0.08;
      mapGroup.rotation.z = Math.sin(elapsed * 0.18) * 0.025;
      stars.rotation.y -= dt * 0.015;
      hubGlow.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.06);
      hubCore.rotation.z += dt * 0.48;

      tempRings.forEach((ring) => {
        ring.rotation.z += dt * ring.userData.speed;
      });

      crates.forEach((box) => {
        box.userData.angle += box.userData.speed * 60 * dt;
        const a = box.userData.angle;
        box.position.set(
          Math.cos(a) * box.userData.radius,
          Math.sin(a) * box.userData.radius * 0.42,
          0.28 + box.userData.lift + Math.sin(a * 1.7) * 0.04
        );
        box.rotation.x += dt * 0.52;
        box.rotation.y += dt * 0.72;
      });

      routes.forEach((pulse) => {
        pulse.userData.t = (pulse.userData.t + pulse.userData.speed * 60 * dt) % 1;
        const p = pulse.userData.curve.getPointAt(pulse.userData.t);
        pulse.position.copy(p);
        const s = 0.8 + Math.sin(elapsed * 6 + pulse.userData.t * 10) * 0.18;
        pulse.scale.setScalar(s);
      });

      mapGroup.children.forEach((child) => {
        if (child.userData.pulseOffset !== undefined) {
          const s = 1 + Math.sin(elapsed * 2.1 + child.userData.pulseOffset) * 0.16;
          child.scale.setScalar(s);
        }
      });
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  frame();
})();
