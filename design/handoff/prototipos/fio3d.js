import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

export function mountFio(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1326, 5, 44);
  const cam = new THREE.PerspectiveCamera(58, 1, 0.05, 120);

  const pts = [];
  for (let i = 0; i <= 52; i++) {
    const t = i / 52;
    pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 6) * 2.6 + Math.sin(t * 17) * 0.35, Math.cos(t * Math.PI * 4) * 1.1, -t * 140));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const layer = (r, op) => {
    const m = new THREE.MeshBasicMaterial({ color: 0xacd6fa, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 900, r, 10, false), m);
    scene.add(mesh); return mesh;
  };
  const layers = [layer(0.016, 1), layer(0.05, 0.34), layer(0.15, 0.06)];
  const total = layers[0].geometry.index.count;

  const c2 = document.createElement('canvas'); c2.width = c2.height = 128;
  const g = c2.getContext('2d'), grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c2);
  const head = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  head.scale.set(0.9, 0.9, 1); scene.add(head);

  const P = 1400, pos = new Float32Array(P * 3), tmp = new THREE.Vector3();
  for (let i = 0; i < P; i++) {
    curve.getPointAt(Math.random(), tmp);
    pos[i * 3] = tmp.x + (Math.random() - 0.5) * 14; pos[i * 3 + 1] = tmp.y + (Math.random() - 0.5) * 8; pos[i * 3 + 2] = tmp.z + (Math.random() - 0.5) * 6;
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pm = new THREE.PointsMaterial({ color: 0x9cc8ff, size: 0.045, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(new THREE.Points(pg, pm));

  const st = { p: 0, drawn: 0.3, color: [172, 214, 250] }, cur = { p: 0, drawn: 0 }, ptr = { x: 0, y: 0 }, pc = { x: 0, y: 0 };
  let raf = 0, visible = true;
  const col = new THREE.Color(), look = new THREE.Vector3();
  const resize = () => { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);

  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (document.hidden || !visible) return;
    cur.p += (st.p - cur.p) * 0.08; cur.drawn += (st.drawn - cur.drawn) * 0.05;
    pc.x += (ptr.x - pc.x) * 0.05; pc.y += (ptr.y - pc.y) * 0.05;
    const u = Math.min(cur.p * 0.86, 0.86);
    curve.getPointAt(u, tmp);
    cam.position.set(tmp.x * 0.6 + pc.x * 0.8, tmp.y + 1.5 - pc.y * 0.4, tmp.z + 3.8);
    curve.getPointAt(Math.min(u + 0.045, 1), look);
    cam.lookAt(look.x, look.y - 0.1, look.z);
    const d = Math.min(1, Math.max(0.001, cur.drawn));
    const cnt = Math.floor(total * d / 6) * 6;
    const s0 = Math.floor(total * Math.min(d, u + 0.03) / 6) * 6;
    layers.forEach(l => l.geometry.setDrawRange(s0, Math.max(0, cnt - s0)));
    curve.getPointAt(d, tmp); head.position.copy(tmp);
    col.setRGB(st.color[0] / 255, st.color[1] / 255, st.color[2] / 255, THREE.SRGBColorSpace);
    layers.forEach(l => l.material.color.lerp(col, 0.08));
    head.material.color.copy(layers[0].material.color);
    renderer.render(scene, cam);
  };
  loop();

  return {
    set(o) { Object.assign(st, o); },
    pointer(x, y) { ptr.x = x; ptr.y = y; },
    visible(v) { visible = v; },
    destroy() {
      cancelAnimationFrame(raf); removeEventListener('resize', resize);
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      tex.dispose(); renderer.dispose();
    }
  };
}
