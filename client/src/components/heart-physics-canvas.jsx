/* Heart physics canvas — matter-js powered heart rain overlay with SVG hearts */
import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import './heart-physics-canvas.css';

/** Heart color palette — warm pinks and reds */
const HEART_COLORS = [
  '#E11D48', '#F43F5E', '#FB7185', '#FDA4AF',
  '#FF6B9D', '#FF1493', '#FF69B4', '#C71585',
];
const HEART_SIZE = 28;

/** Pick a random heart color */
const randomColor = () => HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];

/** SVG heart path for rendering */
function HeartSvg({ color, size = HEART_SIZE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function HeartPhysicsCanvas() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const heartsRef = useRef([]); // { body, id, color }
  const [hearts, setHearts] = useState([]); // render state
  const rafRef = useRef(null);
  const idCounter = useRef(0);
  const clickCountRef = useRef(0);

  const vacuumActiveRef = useRef(false);

  /* Listen for vacuum events */
  useEffect(() => {
    const handleVacuum = (e) => { vacuumActiveRef.current = e.detail; };
    window.addEventListener('heart-vacuum', handleVacuum);
    return () => window.removeEventListener('heart-vacuum', handleVacuum);
  }, []);

  /* Initialize Matter.js engine + world boundaries */
  useEffect(() => {
    /* Much lighter gravity for balloon effect */
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0.1 } });
    engineRef.current = engine;

    const createWalls = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = 50;
      Matter.Composite.clear(engine.world, false, true);
      heartsRef.current.forEach(({ body }) => Matter.Composite.add(engine.world, body));
      Matter.Composite.add(engine.world, [
        Matter.Bodies.rectangle(w / 2, h + t / 2, w + 100, t, { isStatic: true }), // Floor
        Matter.Bodies.rectangle(-t / 2, -h, t, h * 4, { isStatic: true }),       // Extended left wall (for high flying)
        Matter.Bodies.rectangle(w + t / 2, -h, t, h * 4, { isStatic: true }),     // Extended right wall
        Matter.Bodies.rectangle(w / 2, -h - t, w, t, { isStatic: true }),         // Ceiling (so they don't fly away forever)
      ]);
    };

    createWalls();
    window.addEventListener('resize', createWalls);

    /* Physics loop */
    const tick = () => {
      Matter.Engine.update(engine, 1000 / 60);

      /* Vacuum effect: apply continuous upward force to all hearts */
      if (vacuumActiveRef.current) {
        heartsRef.current.forEach(({ body }) => {
          // Add a little random X force so they swirl
          const swirl = (Math.random() - 0.5) * 0.0001;
          Matter.Body.applyForce(body, body.position, { x: swirl, y: -0.0004 });
        });
      }

      setHearts(
        heartsRef.current.map(({ body, id, color }) => ({
          id, color,
          x: body.position.x,
          y: body.position.y,
          angle: body.angle,
        }))
      );
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', createWalls);
      Matter.Engine.clear(engine);
    };
  }, []);

  /* Spawn hearts — more clicks = more hearts (cumulative burst) */
  const spawnHearts = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;

    clickCountRef.current += 1;
    const multiplier = Math.min(clickCountRef.current, 5);
    const count = (8 + Math.floor(Math.random() * 12)) * multiplier;

    clearTimeout(clickCountRef.timeout);
    clickCountRef.timeout = setTimeout(() => { clickCountRef.current = 0; }, 2000);

    const newBodies = [];
    for (let i = 0; i < count; i++) {
      const x = Math.random() * window.innerWidth;
      const y = -30 - Math.random() * 300;
      const body = Matter.Bodies.circle(x, y, HEART_SIZE / 2, {
        restitution: 0.8,    // Bouncier
        friction: 0.1,
        frictionAir: 0.04,   // High air friction = floaty like a balloon
        density: 0.001,      // Very light
      });
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 8, // Wider spread
        y: Math.random() * 2 + 1,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);
      const id = ++idCounter.current;
      newBodies.push({ body, id, color: randomColor() });
      Matter.Composite.add(engine.world, body);
    }
    heartsRef.current = [...heartsRef.current, ...newBodies];
  }, []);

  useEffect(() => {
    window.addEventListener('heart-rain', spawnHearts);
    return () => window.removeEventListener('heart-rain', spawnHearts);
  }, [spawnHearts]);

  /* Drag handling */
  const dragRef = useRef(null);

  const onPointerDown = (e, heartId) => {
    const heart = heartsRef.current.find((h) => h.id === heartId);
    if (!heart) return;
    Matter.Body.setStatic(heart.body, true);
    dragRef.current = { heart, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, time: Date.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const { heart } = dragRef.current;
    Matter.Body.setPosition(heart.body, { x: e.clientX, y: e.clientY });
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;
  };

  const onPointerUp = (e) => {
    if (!dragRef.current) return;
    const { heart, lastX, lastY, time } = dragRef.current;
    const dt = Math.max(Date.now() - time, 1) / 1000;
    const vx = (e.clientX - lastX) / dt * 0.01;
    const vy = (e.clientY - lastY) / dt * 0.01;
    Matter.Body.setStatic(heart.body, false);
    Matter.Body.setVelocity(heart.body, {
      x: Math.max(-15, Math.min(15, vx)),
      y: Math.max(-15, Math.min(15, vy)),
    });
    dragRef.current = null;
  };

  return (
    <div ref={containerRef} className="heart-canvas">
      {hearts.map(({ id, x, y, angle, color }) => (
        <span key={id} className="heart-canvas__heart"
          style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${angle}rad)` }}
          onPointerDown={(e) => onPointerDown(e, id)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <HeartSvg color={color} />
        </span>
      ))}
    </div>
  );
}
