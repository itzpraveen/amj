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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x080706, 1);
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
      for (int i = 0; i < 5; i++) {
        v += a * noise21(p);
        p = m * p + 19.7;
        a *= 0.52;
      }
      return v;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / max(uResolution, vec2(1.0));
      vec2 p = uv * 2.0 - 1.0;
      p.x *= uResolution.x / max(uResolution.y, 1.0);

      float horizon = smoothstep(0.05, 0.92, uv.y);
      vec3 low = vec3(0.255, 0.142, 0.064);
      vec3 high = vec3(0.020, 0.018, 0.016);
      vec3 color = mix(low, high, horizon);

      float sun = exp(-length((p - vec2(-0.74 + uPointer.x * 0.08, 0.30 + uPointer.y * 0.04)) * vec2(1.18, 1.78)) * 2.15);
      color += sun * vec3(0.300, 0.180, 0.076);

      float haze = fbm(vec2(p.x * 1.35 + uTime * 0.010, p.y * 0.9));
      color += haze * vec3(0.030, 0.020, 0.012) * (1.0 - smoothstep(0.10, 0.80, uv.y));
      color *= 1.0 - smoothstep(0.42, 1.08, length(p)) * 0.38;

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

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 m = mat2(1.64, 1.12, -1.12, 1.64);
      for (int i = 0; i < 5; i++) {
        v += a * noise21(p);
        p = m * p + 17.3;
        a *= 0.52;
      }
      return v;
    }

    float duneHeight(vec2 p) {
      float t = uTime;
      vec2 q = p + uPointer * vec2(0.88, -0.50);
      q.x += sin(q.y * 0.22 + t * 0.035) * 1.15;
      vec2 wind = vec2(t * 0.046, t * 0.015);

      float broadA = sin(q.x * 0.28 + q.y * 0.40 + t * 0.070) * 0.98;
      float broadB = sin(q.x * -0.19 + q.y * 0.30 - t * 0.050) * 0.62;
      float broadC = sin(q.x * 0.12 + q.y * 0.18 + t * 0.035) * 0.34;
      float ridgeNoise = fbm(q * 0.12 + wind * 1.15);
      float ridgePhase = q.x * 0.72 + q.y * 0.54 + ridgeNoise * 1.85 + t * 0.16;
      float ridgeWave = sin(ridgePhase);
      float crest = pow(smoothstep(-0.18, 1.0, ridgeWave), 5.2) * 0.58;
      float slipFace = smoothstep(0.20, 0.86, ridgeWave) * 0.34;
      float leeShadow = smoothstep(-0.82, -0.20, -ridgeWave) * -0.12;
      float grain = fbm(q * 1.05 + vec2(t * 0.12, -t * 0.045)) * 0.10;
      float ripples = sin(q.x * 3.6 + q.y * 5.4 + fbm(q * 0.52) * 3.0 + t * 0.78) * 0.018;

      return broadA + broadB + broadC + crest + slipFace + leeShadow + grain + ripples - 0.62;
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
      for (int i = 0; i < 4; i++) {
        v += a * noise21(p);
        p = m * p + 21.1;
        a *= 0.52;
      }
      return v;
    }

    void main() {
      vec3 n = normalize(vNormalW);
      vec3 viewDir = normalize(cameraPosition - vWorld);
      vec3 sunDir = normalize(vec3(-0.56 + uPointer.x * 0.10, 0.70, 0.30));
      vec3 rimDir = normalize(vec3(0.46, 0.18, -0.82));

      float diffuse = max(dot(n, sunDir), 0.0);
      float rim = max(dot(n, rimDir), 0.0);
      float spec = pow(max(dot(reflect(-sunDir, n), viewDir), 0.0), 34.0);
      float slope = 1.0 - clamp(n.y, 0.0, 1.0);

      vec3 shadow = vec3(0.068, 0.043, 0.026);
      vec3 sand = vec3(0.560, 0.365, 0.160);
      vec3 crest = vec3(0.98, 0.700, 0.300);
      vec3 cool = vec3(0.032, 0.040, 0.040);

      vec3 color = mix(shadow, sand, 0.18 + diffuse * 0.82);
      color = mix(color, crest, spec * 0.52 + smoothstep(0.78, 1.0, diffuse) * 0.16);
      color = mix(color, cool, rim * 0.10 + slope * 0.14);

      float ripple = sin(vWorld.x * 4.2 + vWorld.z * 7.2 + fbm(vWorld.xz * 0.44) * 3.8 + uTime * 0.74);
      color += smoothstep(0.76, 0.99, ripple) * vec3(0.055, 0.034, 0.012) * (0.36 + diffuse);
      color -= smoothstep(-0.98, -0.72, ripple) * vec3(0.018, 0.012, 0.007) * slope;
      color += (vSand - 0.5) * vec3(0.050, 0.032, 0.014);

      float farHaze = smoothstep(7.0, -11.0, vWorld.z);
      color = mix(color, vec3(0.335, 0.255, 0.150), farHaze * 0.16);
      color *= 1.0 - smoothstep(0.65, 2.6, abs(vHeight)) * 0.06;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

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
      for (int i = 0; i < 4; i++) {
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
      vec2 drift = vec2(uTime * 0.10, uTime * 0.013) + uPointer * vec2(0.09, -0.035);

      float wind = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        vec2 q = p * (5.8 + fi * 2.15) + drift * (1.0 + fi * 0.35);
        float band = sin(q.x * 2.0 + q.y * 8.8 + fbm(q * 0.32) * 3.8 + fi * 1.7);
        float mask = smoothstep(0.70, 0.985, band);
        mask *= smoothstep(0.08, 0.40, uv.y) * (1.0 - smoothstep(0.92, 1.0, uv.y));
        wind += mask * (0.050 - fi * 0.009);
      }

      float veil = fbm(p * 3.3 + drift * 0.52) * 0.052;
      float edgeFade = smoothstep(0.0, 0.14, uv.x) * smoothstep(1.0, 0.86, uv.x);
      float alpha = (wind + veil) * edgeFade * smoothstep(0.02, 0.22, uv.y);

      gl_FragColor = vec4(vec3(0.94, 0.68, 0.34), alpha);
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

  const duneGeometry = new THREE.PlaneGeometry(34, 30, 280, 205);
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

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.034);
    const activeMotion = motionOn();
    uniforms.uMotion.value = activeMotion ? 1 : 0;
    if (activeMotion) state.time += dt;

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
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  updateCamera();
  frame();
})();
