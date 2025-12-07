/**
 * Globes - A compact solar system visualization
 * Usage: import globes from './globes.js'; globes(containerElement, options);
 * 
 * Options:
 *   fill: string    - Globe fill color (default: '#fff')
 *   stroke: string  - Globe outline color (default: '#000')
 *   ring: string    - Ring color (default: 'rgba(220,220,220,0.8)')
 */
export default function globes(container, options = {}) {
  const { fill = '#fff', stroke = '#000', ring = 'rgba(220,220,220,0.8)' } = options;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  container.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  const S = 2000, E = 18.33, M = 5, J = 201, SA = 167, U = 72.9, N = 70.5;
  const MAX_ORBIT = S + 4500; // Neptune's orbit distance from center
  
  const bodies = [
    { r: S, d: 0, p: 1, o: null }, // Sun
    { r: 7, d: S + 20, p: 58.6 * 864e2, o: 0 }, // Mercury
    { r: 17, d: S + 50, p: 243 * 864e2, o: 0 }, // Venus
    { r: E, d: S + 150, p: 365.256 * 864e2, o: 0 }, // Earth
    { r: M, d: E + 50, p: 29.5 * 864e2, o: 3 }, // Moon -> Earth
    { r: 9.76, d: S + 250, p: 687 * 864e2, o: 0 }, // Mars
    { r: J, d: S + 700, p: 4333 * 864e2, o: 0 }, // Jupiter
    { r: 5.25, d: J + 20, p: 42.5 * 36e2, o: 6 }, // Io -> Jupiter
    { r: 4.49, d: J + 40, p: 3.5 * 864e2, o: 6 }, // Europa -> Jupiter
    { r: 7.57, d: J + 70, p: 7.155 * 864e2, o: 6 }, // Ganymede -> Jupiter
    { r: 7.4, d: J + 200, p: 16.689 * 864e2, o: 6 }, // Callisto -> Jupiter
    { r: SA, d: S + 1500, p: 10756 * 864e2, o: 0, ring: [SA + 100, SA + 200] }, // Saturn
    { r: U, d: S + 2500, p: 30688 * 864e2, o: 0, ring: [U + 100, U + 200] }, // Uranus
    { r: N, d: S + 4500, p: 60182 * 864e2, o: 0 }, // Neptune
  ];
  
  let t = 0, angle = -0.3, scale = 1;
  const state = bodies.map(() => ({ x: 0, y: 0, z: 0, r: 0, dr: 0 }));
  
  function resize() {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and set transform (prevents cumulative scaling)
    scale = Math.min(rect.width, rect.height) / (MAX_ORBIT * 2);
  }
  
  function orbit(t, p, off = 0) { return Math.cos(t / p * 2 * Math.PI + off); }
  
  function draw() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    const cx = w / 2, cy = h / 2;
    
    ctx.clearRect(0, 0, w, h);
    
    // Update positions
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i], s = state[i];
      const parent = b.o !== null ? state[b.o] : { x: 0, y: 0, z: 0 };
      const dist = b.d * scale;
      
      s.x = parent.x + dist * orbit(t, b.p);
      s.y = parent.y + Math.sin(angle) * dist * orbit(t, b.p, Math.PI / 2);
      s.z = parent.z + Math.cos(angle) * dist * orbit(t, b.p, Math.PI / 2);
      s.r = Math.max(b.o !== null ? 0.5 : 0.51, b.r * scale);
      s.dr = b.d * scale;
    }
    
    // Sort by z-depth (back to front)
    const sorted = state.map((s, i) => ({ ...s, i })).sort((a, b) => b.z - a.z);
    
    // Draw
    for (const obj of sorted) {
      const b = bodies[obj.i];
      
      if (obj.r > 0.5 || b.o === null) {
        ctx.beginPath();
        ctx.arc(cx + obj.x, cy + obj.y, obj.r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = stroke;
        ctx.stroke();
      }
      
      if (b.ring) {
        const ringR = (obj.r / b.r) * (b.ring[0] + b.ring[1]) / 2;
        const lw = Math.sin(angle) * ringR + 1;
        const hidden = -Math.tan(angle) * (obj.r / b.r) * b.ring[0] >= obj.r ? 0 
          : Math.cos(angle) * 2 * Math.asin(Math.min(1, obj.r / ringR));
        
        ctx.beginPath();
        ctx.ellipse(cx + obj.x, cy + obj.y, ringR, ringR * -Math.sin(angle), 
          0, (-Math.PI + hidden) / 2, (3 * Math.PI - hidden) / 2);
        ctx.lineWidth = Math.max(1, lw);
        ctx.strokeStyle = ring;
        ctx.stroke();
      }
    }
    
    t += 9e5; // Time step
    requestAnimationFrame(draw);
  }
  
  resize();
  window.addEventListener('resize', resize);
  draw();
  
  return () => {
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
}

