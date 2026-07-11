/* Heart physics canvas — matter-js powered heart rain overlay */
import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import './heart-physics-canvas.css';

const HEART_EMOJIS = ['❤️', '🩷', '💗', '💕', '💖', '🫶'];
const HEART_SIZE = 28;

/** Pick a random heart emoji */
const randomHeart = () => HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];

export default function HeartPhysicsCanvas() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const heartsRef = useRef([]); // { body, id }
  const [hearts, setHearts] = useState([]); // render state: { id, x, y, angle, emoji }
  const rafRef = useRef(null);
  const idCounter = useRef(0);

  /* Initialize Matter.js engine + world boundaries */
  useEffect(() => {
    const engine = Matter.Engine.create({ gravity: { x: 0, y: 0.8 } });
    engineRef.current = engine;

    const createWalls = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = 50; // thickness
      Matter.Composite.clear(engine.world, false, true);
      // Re-add heart bodies after clearing
      heartsRef.current.forEach(({ body }) => Matter.Composite.add(engine.world, body));
      Matter.Composite.add(engine.world, [
        Matter.Bodies.rectangle(w / 2, h + t / 2, w + 100, t, { isStatic: true }), // floor
        Matter.Bodies.rectangle(-t / 2, h / 2, t, h * 2, { isStatic: true }),       // left
        Matter.Bodies.rectangle(w + t / 2, h / 2, t, h * 2, { isStatic: true }),     // right
      ]);
    };

    createWalls();
    window.addEventListener('resize', createWalls);

    /* Physics loop */
    const tick = () => {
      Matter.Engine.update(engine, 1000 / 60);
      setHearts(
        heartsRef.current.map(({ body, id, emoji }) => ({
          id, emoji,
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

  /* Spawn hearts on custom event */
  const spawnHearts = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const count = 10 + Math.floor(Math.random() * 20);
    const newBodies = [];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * window.innerWidth;
      const y = -50 - Math.random() * 200;
      const body = Matter.Bodies.circle(x, y, HEART_SIZE / 2, {
        restitution: 0.5,
        friction: 0.3,
        frictionAir: 0.01,
        density: 0.002,
      });
      /* Random initial spin + horizontal drift */
      Matter.Body.setVelocity(body, { x: (Math.random() - 0.5) * 3, y: Math.random() * 2 });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
      const id = ++idCounter.current;
      newBodies.push({ body, id, emoji: randomHeart() });
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
    Matter.Body.setVelocity(heart.body, { x: Math.max(-15, Math.min(15, vx)), y: Math.max(-15, Math.min(15, vy)) });
    dragRef.current = null;
  };

  return (
    <div ref={containerRef} className="heart-canvas">
      {hearts.map(({ id, x, y, angle, emoji }) => (
        <span key={id} className="heart-canvas__heart"
          style={{ left: x, top: y, transform: `translate(-50%, -50%) rotate(${angle}rad)` }}
          onPointerDown={(e) => onPointerDown(e, id)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {emoji}
        </span>
      ))}
    </div>
  );
}
