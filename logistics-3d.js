import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

(function () {
  const canvas = document.querySelector('.hero-3d');
  if (!canvas) return;

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const motionOn = () => root.getAttribute('data-motion') !== 'off' && !reduced.matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
  } catch {
    canvas.style.display = 'none';
    return;
  }

  // Decorative background: cap device pixel ratio well below native to keep the
  // heavy procedural shaders affordable on high-DPI displays. Lowered once more
  // by the adaptive guard below if the first second of frames runs slow.
  let dprCap = window.innerWidth < 760 ? 1.35 : 1.5;
  const applyDPR = () => renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  applyDPR();
  renderer.setClearColor(0x070b18, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  const lookAt = new THREE.Vector3(0, -0.25, -5.6);
  const clock = new THREE.Clock();

  const state = {
    targetX: 0,
    targetY: 0,
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    time: 0
  };

  const uniforms = {
    uTime: { value: 0 },
    uMotion: { value: 1 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(1, 1) }
  };

  const fullscreenVertex = `
    void main() {
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `;

  // ---- Dusk sky: deep indigo zenith melting into a warm plum horizon, a low
  // ember sun, faint twinkling stars and a breath of drifting dust. ----
  const backgroundFragment = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uPointer;
    uniform vec2 uResolution;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    float noise21(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(1.62, 1.08, -1.08, 1.62);
      for (int i = 0; i < 4; i++) {
        v += a * noise21(p);
        p = m * p + 19.7;
        a *= 0.52;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
      float aspectR = uResolution.x / max(uResolution.y, 1.0);
      vec2 p = uv * 2.0 - 1.0;
      p.x *= aspectR;

      // Moonlit desert night: deep navy sky, faint cool light low on the horizon.
      vec3 horizonCol = vec3(0.078, 0.104, 0.156);
      vec3 midSky     = vec3(0.040, 0.058, 0.108);
      vec3 zenith     = vec3(0.016, 0.026, 0.064);
      vec3 color = mix(horizonCol, midSky, smoothstep(0.0, 0.55, uv.y));
      color = mix(color, zenith, smoothstep(0.30, 1.0, uv.y));

      // Soft cool moon-glow low on the horizon (no warm sun).
      vec2 sunPos = vec2(-0.28 + uPointer.x * 0.05, 0.04 + uPointer.y * 0.03);
      float sd = length((p - sunPos) * vec2(1.0, 1.8));
      float glow = exp(-sd * 1.3);
      color += glow * vec3(0.32, 0.40, 0.54) * 0.55;

      // Faint, slow-twinkling stars (small round points) confined to the upper sky.
      vec2 cell = vec2(uv.x * aspectR, uv.y) * 96.0;
      vec2 cid = floor(cell);
      vec2 cf = fract(cell);
      float present = step(0.91, hash21(cid));
      vec2 sp = vec2(hash21(cid + 1.7), hash21(cid + 9.1));
      float twinkle = 0.35 + 0.65 * sin(uTime * 1.1 + hash21(cid) * 52.0);
      float star = present * smoothstep(0.16, 0.0, length(cf - sp)) * twinkle;
      star *= smoothstep(0.40, 0.92, uv.y);
      star *= 1.0 - clamp(glow * 1.6, 0.0, 1.0);
      color += star * vec3(0.60, 0.62, 0.74) * 0.5;

      // Faint cool cloud band drifting near the horizon.
      float haze = fbm(vec2(p.x * 1.1 + uTime * 0.010, p.y * 0.80));
      color += haze * vec3(0.024, 0.032, 0.048) * (1.0 - smoothstep(0.08, 0.82, uv.y));

      // Cinematic vignette.
      color *= 1.0 - smoothstep(0.42, 1.18, length(p)) * 0.46;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const duneVertex = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uPointer;

    varying vec3 vWorld;
    varying vec3 vNormalW;
    varying float vHeight;
    varying float vSand;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    float noise21(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    // 3-octave fBm — trimmed from 5 for the vertex path, which is evaluated five
    // times per vertex (height + four neighbours for the normal).
    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(1.64, 1.12, -1.12, 1.64);
      for (int i = 0; i < 3; i++) {
        v += a * noise21(p);
        p = m * p + 17.3;
        a *= 0.54;
      }
      return v;
    }

    float duneHeight(vec2 p) {
      float t = uTime;
      vec2 q = p + uPointer * vec2(0.70, -0.40);
      vec2 wind = vec2(t * 0.020, t * 0.006);

      // One dominant dune: a single ridge with a strongly curved (fbm-warped) crest line.
      float warp = fbm(q * 0.050 + wind) * 3.2;
      float ridge = q.x * 0.20 + q.y * 0.10 + warp;
      float frac = fract(ridge * 0.1591549);                  // ridge / 2PI -> 0..1 across the dune
      float windward = pow(smoothstep(0.0, 0.88, frac), 1.7); // long smooth windward face
      float lee = 1.0 - smoothstep(0.88, 0.995, frac);         // sharp slip-face on the lee
      float dune = windward * lee * 3.4;

      // Gentle large-scale undulation; very smooth surface (no ripples).
      float base = sin(q.x * 0.08 + q.y * 0.10 + t * 0.030) * 0.35;
      float grain = fbm(q * 0.60) * 0.012;
      return dune + base + grain - 1.50;
    }

    void main() {
      vec3 p = position;
      float h = duneHeight(p.xz);
      p.y += h;

      float e = 0.18;
      float hx1 = duneHeight(p.xz + vec2(e, 0.0));
      float hx2 = duneHeight(p.xz - vec2(e, 0.0));
      float hz1 = duneHeight(p.xz + vec2(0.0, e));
      float hz2 = duneHeight(p.xz - vec2(0.0, e));
      vec3 normal = normalize(vec3(hx2 - hx1, 2.0 * e, hz2 - hz1));

      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorld = world.xyz;
      vNormalW = normalize(mat3(modelMatrix) * normal);
      vHeight = h;
      vSand = fbm(p.xz * 2.35 + vec2(uTime * 0.24, uTime * 0.035));

      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `;

  // ---- Bronze dunes: deep shadow, grazing ember key light, indigo sky fill on
  // up-facing slopes, and a fresnel rim that catches the sun on crest edges. ----
  const duneFragment = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uPointer;

    varying vec3 vWorld;
    varying vec3 vNormalW;
    varying float vHeight;
    varying float vSand;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    float noise21(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(1.62, 1.08, -1.08, 1.62);
      for (int i = 0; i < 3; i++) {
        v += a * noise21(p);
        p = m * p + 21.1;
        a *= 0.54;
      }
      return v;
    }

    void main() {
      vec3 n = normalize(vNormalW);
      vec3 viewDir = normalize(cameraPosition - vWorld);
      vec3 sunDir = normalize(vec3(-0.64 + uPointer.x * 0.08, 0.30, 0.24));

      float diffuse = max(dot(n, sunDir), 0.0);
      float sky = max(n.y, 0.0);
      float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 2.4);
      float spec = pow(max(dot(reflect(-sunDir, n), viewDir), 0.0), 18.0);
      float slope = 1.0 - clamp(n.y, 0.0, 1.0);

      vec3 shadow  = vec3(0.016, 0.028, 0.072);
      vec3 sand    = vec3(0.400, 0.420, 0.520);
      vec3 crest   = vec3(0.770, 0.790, 0.880);
      vec3 skyTint = vec3(0.050, 0.075, 0.140);

      vec3 color = mix(shadow, sand, 0.05 + diffuse * 0.95);
      color += skyTint * sky * 0.28;
      color = mix(color, crest, smoothstep(0.60, 1.0, diffuse) * 0.55 + spec * 0.22);
      color += crest * fres * 0.10 * (0.30 + diffuse);
      color = mix(color, shadow, slope * 0.16);

      // Smooth moonlit sand — faint tonal variation only (no ripple lines).
      color += (vSand - 0.5) * vec3(0.020, 0.022, 0.030);

      float farHaze = smoothstep(7.0, -11.0, vWorld.z);
      color = mix(color, vec3(0.065, 0.090, 0.145), farHaze * 0.34);
      color *= 1.0 - smoothstep(0.65, 2.6, abs(vHeight)) * 0.06;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ---- Sparse, silky sand drift: a faint warm shimmer that hugs the dune band
  // and catches the ember light, instead of streaking across the whole sky. ----
  const windFragment = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uPointer;
    uniform vec2 uResolution;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    float noise21(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(1.58, 0.96, -0.96, 1.58);
      for (int i = 0; i < 3; i++) {
        v += a * noise21(p);
        p = m * p + 13.4;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      vec2 p = vec2(uv.x * aspect, uv.y);
      vec2 drift = vec2(uTime * 0.040, uTime * 0.006) + uPointer * vec2(0.05, -0.02);

      // Soft drifting veil, gated to the lower dune band so it reads as ground
      // sand catching light rather than streaks across the sky.
      float veil = fbm(p * 2.3 + drift * 0.7);
      float body = smoothstep(0.54, 0.96, veil);
      float shimmer = 0.5 + 0.5 * sin(p.x * 13.0 + p.y * 4.0 + fbm(p * 1.3) * 6.0 + uTime * 0.55);

      float vert = smoothstep(0.08, 0.30, uv.y) * (1.0 - smoothstep(0.46, 0.78, uv.y));
      float edgeFade = smoothstep(0.0, 0.16, uv.x) * smoothstep(1.0, 0.82, uv.x);

      float alpha = body * vert * edgeFade * (0.007 + shimmer * 0.009);
      vec3 tint = vec3(0.56, 0.62, 0.76) * (0.6 + shimmer * 0.5);

      gl_FragColor = vec4(tint, alpha);
    }
  `;

  const background = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: fullscreenVertex,
      fragmentShader: backgroundFragment,
      depthWrite: false,
      depthTest: false
    })
  );
  background.renderOrder = -10;
  scene.add(background);

  // Lighter mesh than before (was 280x205) — the broad dune forms are
  // low-frequency, so this resolution holds up while roughly halving vertex work.
  const segX = window.innerWidth < 760 ? 150 : 210;
  const segZ = window.innerWidth < 760 ? 110 : 150;
  const duneGeometry = new THREE.PlaneGeometry(34, 30, segX, segZ);
  duneGeometry.rotateX(-Math.PI / 2);
  const dunes = new THREE.Mesh(
    duneGeometry,
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: duneVertex,
      fragmentShader: duneFragment
    })
  );
  dunes.position.set(0, -1.52, -2.85);
  scene.add(dunes);

  const wind = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: fullscreenVertex,
      fragmentShader: windFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending
    })
  );
  wind.renderOrder = 10;
  scene.add(wind);

  function resize() {
    applyDPR();
    const rect = canvas.getBoundingClientRect();
    state.width = Math.max(1, rect.width);
    state.height = Math.max(1, rect.height);
    renderer.setSize(state.width, state.height, false);
    uniforms.uResolution.value.set(
      state.width * renderer.getPixelRatio(),
      state.height * renderer.getPixelRatio()
    );

    camera.aspect = state.width / state.height;
    camera.fov = state.width < 760 ? 48 : 42;
    camera.updateProjectionMatrix();
  }

  function updateCamera() {
    const mobile = state.width < 760;
    const baseY = mobile ? 4.88 : 4.05;
    const baseZ = mobile ? 10.0 : 8.72;
    camera.position.x = state.x * (mobile ? 0.62 : 0.96);
    camera.position.y = baseY + state.y * 0.34;
    camera.position.z = baseZ + state.y * 0.28;
    lookAt.set(state.x * 0.55, -0.56 + state.y * 0.16, -5.9 + state.x * 0.22);
    camera.lookAt(lookAt);
    dunes.rotation.z = state.x * 0.018;
  }

  window.addEventListener('pointermove', (event) => {
    if (!finePointer) return;
    state.targetX = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
    state.targetY = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * -2;
  }, { passive: true });

  // Adaptive quality: sample the first ~80 active frames and, if they run slow,
  // drop the pixel ratio one notch so weaker GPUs still hold a smooth cadence.
  let probeFrames = 0;
  let probeAccum = 0;
  let probeDone = false;

  // Render loop is paused whenever the hero is off-screen or the tab is hidden.
  let rafId = null;
  let inView = true;
  let tabVisible = !document.hidden;

  function frame() {
    rafId = requestAnimationFrame(frame);

    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.034);
    const activeMotion = motionOn();
    uniforms.uMotion.value = activeMotion ? 1 : 0;
    if (activeMotion) state.time += dt;

    if (!probeDone && activeMotion && raw > 0.0001 && raw < 0.1) {
      probeFrames += 1;
      probeAccum += raw;
      if (probeFrames >= 80) {
        const avgMs = (probeAccum / probeFrames) * 1000;
        if (avgMs > 20.5 && dprCap > 1.2) {
          dprCap = 1.2;
          resize();
        }
        probeDone = true;
      }
    }

    if (!finePointer && activeMotion) {
      state.targetX = Math.sin(state.time * 0.18) * 0.22;
      state.targetY = Math.cos(state.time * 0.14) * 0.10;
    }

    state.x += (state.targetX - state.x) * 0.045;
    state.y += (state.targetY - state.y) * 0.045;
    uniforms.uTime.value = state.time;
    uniforms.uPointer.value.set(state.x, state.y);
    updateCamera();

    renderer.render(scene, camera);
  }

  function start() {
    if (rafId === null) {
      clock.getDelta();
      frame();
    }
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function syncRun() {
    if (inView && tabVisible) start();
    else stop();
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      syncRun();
    }, { threshold: 0 });
    io.observe(canvas);
  }

  document.addEventListener('visibilitychange', () => {
    tabVisible = !document.hidden;
    syncRun();
  }, { passive: true });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  updateCamera();
  start();
})();
