'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  EdgesGeometry,
  ExtrudeGeometry,
  Group,
  MathUtils,
  Points,
  Shape,
  SRGBColorSpace,
  Texture,
} from 'three';

type Point = [number, number, number];
type Draw = (context: CanvasRenderingContext2D, width: number, height: number) => void;

function roundedPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function panelBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#172a4b');
  gradient.addColorStop(0.48, '#0c172b');
  gradient.addColorStop(1, '#080f1e');
  roundedPath(context, 2, 2, width - 4, height - 4, 28);
  context.fillStyle = gradient;
  context.fill();
  context.save();
  roundedPath(context, 2, 2, width - 4, height - 4, 28);
  context.clip();
  const glow = context.createRadialGradient(width * 0.78, height * 0.1, 0, width * 0.78, height * 0.1, width * 0.7);
  glow.addColorStop(0, 'rgba(91, 133, 255, .24)');
  glow.addColorStop(1, 'rgba(91, 133, 255, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  context.restore();
}

function label(context: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color = '#edf4ff', weight = 600, align: CanvasTextAlign = 'left') {
  context.font = `${weight} ${size}px Inter, Arial, sans-serif`;
  context.fillStyle = color;
  context.textAlign = align;
  context.fillText(text, x, y);
}

function createTexture(width: number, height: number, draw: Draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas textures are not supported in this browser.');
  context.clearRect(0, 0, width, height);
  roundedPath(context, 2, 2, width - 4, height - 4, 28);
  context.clip();
  draw(context, width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function browserTexture() {
  return createTexture(1200, 760, (context, width, height) => {
    panelBackground(context, width, height);

    context.fillStyle = 'rgba(255,255,255,.035)';
    context.fillRect(0, 0, width, 88);
    context.strokeStyle = 'rgba(173,201,255,.16)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 88);
    context.lineTo(width, 88);
    context.stroke();

    ['#a5f3d0', '#83abff', '#a78bfa'].forEach((color, index) => {
      context.beginPath();
      context.arc(42 + index * 28, 44, 7, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    });
    label(context, 'NGD / PRODUCT SYSTEM', 145, 53, 20, '#93a8c9', 500);
    roundedPath(context, 930, 24, 210, 42, 21);
    context.fillStyle = 'rgba(117,156,255,.1)';
    context.fill();
    label(context, 'WEB  •  APP  •  AI', 1035, 51, 16, '#b7cfff', 600, 'center');

    label(context, 'NGD', 64, 166, 30, '#a9c5ff', 800);
    label(context, 'Digital products.', 64, 247, 62, '#f5f8ff', 650);
    label(context, 'Designed around your business.', 64, 296, 25, '#a3b2c9', 400);

    roundedPath(context, 64, 342, 326, 68, 14);
    const button = context.createLinearGradient(64, 342, 390, 410);
    button.addColorStop(0, '#638fff');
    button.addColorStop(1, '#3c65df');
    context.fillStyle = button;
    context.fill();
    label(context, 'BUILD. LAUNCH. AUTOMATE.', 227, 384, 17, '#ffffff', 700, 'center');

    label(context, 'One connected team', 64, 470, 22, '#d7e4f8', 600);
    label(context, 'from first sketch to final deploy.', 64, 505, 20, '#8293ad', 400);

    roundedPath(context, 714, 132, 424, 394, 22);
    context.fillStyle = 'rgba(102,143,244,.065)';
    context.fill();
    context.strokeStyle = 'rgba(150,184,255,.16)';
    context.stroke();
    label(context, 'YOUR DIGITAL STACK', 754, 182, 17, '#8fa7cc', 600);

    const nodes = [
      { y: 234, name: 'WEBSITE', detail: 'Design & develop', color: '#83abff' },
      { y: 336, name: 'MOBILE APP', detail: 'Connect every screen', color: '#a5f3d0' },
      { y: 438, name: 'AI WORKFLOW', detail: 'Automate the busywork', color: '#c4b5fd' },
    ];
    context.strokeStyle = 'rgba(131,171,255,.3)';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(784, 258);
    context.lineTo(784, 458);
    context.stroke();
    nodes.forEach((node) => {
      context.beginPath();
      context.arc(784, node.y, 12, 0, Math.PI * 2);
      context.fillStyle = node.color;
      context.fill();
      label(context, node.name, 824, node.y - 2, 22, '#e7effc', 650);
      label(context, node.detail, 824, node.y + 28, 18, '#8193af', 400);
    });

    const cards = [
      { x: 64, title: '01  DESIGN', detail: 'Human-first' },
      { x: 424, title: '02  DEVELOP', detail: 'Performance-led' },
      { x: 784, title: '03  AUTOMATE', detail: 'Data-informed' },
    ];
    cards.forEach((card) => {
      roundedPath(context, card.x, 584, 320, 116, 18);
      context.fillStyle = 'rgba(255,255,255,.035)';
      context.fill();
      context.strokeStyle = 'rgba(160,190,255,.12)';
      context.stroke();
      label(context, card.title, card.x + 24, 628, 17, '#8faef0', 650);
      label(context, card.detail, card.x + 24, 670, 24, '#d8e5f8', 550);
    });
  });
}

function phoneTexture() {
  return createTexture(360, 720, (context, width, height) => {
    panelBackground(context, width, height);
    roundedPath(context, 130, 24, 100, 12, 6);
    context.fillStyle = 'rgba(190,211,255,.25)';
    context.fill();
    label(context, 'NGD', 34, 102, 30, '#a9c5ff', 800);
    label(context, 'MOBILE', 34, 174, 42, '#f4f7ff', 650);
    label(context, 'APP', 34, 220, 42, '#f4f7ff', 650);
    label(context, 'Useful on every screen.', 34, 264, 17, '#8e9fb9', 400);

    ['FAST', 'USEFUL', 'CONNECTED'].forEach((item, index) => {
      const y = 320 + index * 92;
      roundedPath(context, 28, y, 304, 70, 15);
      context.fillStyle = 'rgba(128,165,255,.075)';
      context.fill();
      context.strokeStyle = 'rgba(160,190,255,.14)';
      context.stroke();
      context.beginPath();
      context.arc(58, y + 35, 7, 0, Math.PI * 2);
      context.fillStyle = index === 1 ? '#a5f3d0' : '#83abff';
      context.fill();
      label(context, item, 84, y + 43, 19, '#d7e5fa', 650);
    });

    roundedPath(context, 28, 624, 304, 54, 14);
    context.fillStyle = '#4f7df3';
    context.fill();
    label(context, 'BUILT FOR PEOPLE', 180, 658, 16, '#ffffff', 700, 'center');
  });
}

function automationTexture() {
  return createTexture(640, 520, (context, width, height) => {
    panelBackground(context, width, height);
    label(context, 'AI AUTOMATION', 42, 76, 28, '#edf4ff', 700);
    label(context, 'A practical connected workflow', 42, 112, 18, '#8ea2c1', 400);

    const steps = [
      { y: 170, number: '01', name: 'INPUT', color: '#83abff' },
      { y: 288, number: '02', name: 'ASSISTANT', color: '#c4b5fd' },
      { y: 406, number: '03', name: 'ACTION', color: '#a5f3d0' },
    ];
    context.strokeStyle = 'rgba(131,171,255,.35)';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(69, 194);
    context.lineTo(69, 424);
    context.stroke();
    steps.forEach((step) => {
      roundedPath(context, 42, step.y, 556, 76, 16);
      context.fillStyle = 'rgba(255,255,255,.04)';
      context.fill();
      context.strokeStyle = 'rgba(160,190,255,.14)';
      context.stroke();
      context.beginPath();
      context.arc(69, step.y + 38, 10, 0, Math.PI * 2);
      context.fillStyle = step.color;
      context.fill();
      label(context, step.number, 104, step.y + 46, 18, '#7993c2', 650);
      label(context, step.name, 176, step.y + 46, 22, '#dce8fa', 650);
      label(context, '→', 546, step.y + 47, 26, step.color, 500);
    });
  });
}

function useTexture(factory: () => Texture) {
  const texture = useMemo(factory, [factory]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function ProductPanel({ width, height, texture, radius = 0.1 }: { width: number; height: number; texture: Texture; radius?: number }) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    const x = -width / 2;
    const y = -height / 2;
    const r = Math.min(radius, width / 2, height / 2);
    shape.moveTo(x + r, y);
    shape.lineTo(x + width - r, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + r);
    shape.lineTo(x + width, y + height - r);
    shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    shape.lineTo(x + r, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    const result = new ExtrudeGeometry(shape, {
      depth: 0.065,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.018,
      bevelThickness: 0.018,
      curveSegments: 8,
      steps: 1,
    });
    result.center();
    return result;
  }, [width, height, radius]);
  const edges = useMemo(() => new EdgesGeometry(geometry, 24), [geometry]);
  useEffect(() => () => { geometry.dispose(); edges.dispose(); }, [geometry, edges]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#162642" metalness={0.68} roughness={0.25} emissive="#0a1c48" emissiveIntensity={0.4} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#94b7ff" transparent opacity={0.24} />
      </lineSegments>
      <mesh position={[0, 0, 0.061]}>
        <planeGeometry args={[width - 0.035, height - 0.035]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

function BrowserPanel() {
  const texture = useTexture(browserTexture);
  return <ProductPanel width={3.45} height={2.18} radius={0.11} texture={texture} />;
}

function PhonePanel() {
  const texture = useTexture(phoneTexture);
  return <ProductPanel width={0.79} height={1.58} radius={0.12} texture={texture} />;
}

function AutomationPanel() {
  const texture = useTexture(automationTexture);
  return <ProductPanel width={1.25} height={1.02} radius={0.1} texture={texture} />;
}

function ConnectionLines() {
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new BufferAttribute(new Float32Array([
      -1.48, 0.46, -0.1, -0.92, 0.82, -0.35,
      -0.92, 0.82, -0.35, 0.2, 1.02, -0.42,
      0.85, 0.92, -0.36, 1.5, 0.82, -0.08,
      -1.36, -0.82, -0.15, -0.45, -1.18, -0.4,
      -0.45, -1.18, -0.4, 0.88, -1.02, -0.28,
    ]), 3));
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#719cff" transparent opacity={0.24} depthWrite={false} />
    </lineSegments>
  );
}

function ProductShowcase() {
  const root = useRef<Group>(null);
  const browser = useRef<Group>(null);
  const phone = useRef<Group>(null);
  const automation = useRef<Group>(null);
  const viewport = useThree((state) => state.viewport);
  const scale = Math.min(viewport.width > 6 ? 1.22 : 1.04, viewport.width / 5.1, viewport.height / 3.9);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (root.current) {
      root.current.rotation.y = MathUtils.lerp(root.current.rotation.y, state.pointer.x * 0.1, 0.035);
      root.current.rotation.x = MathUtils.lerp(root.current.rotation.x, -state.pointer.y * 0.055, 0.035);
    }
    if (browser.current) browser.current.position.y = 0.08 + Math.sin(time * 0.55) * 0.045;
    if (phone.current) phone.current.position.y = -0.22 + Math.sin(time * 0.7 + 1.2) * 0.075;
    if (automation.current) automation.current.position.y = 0.4 + Math.sin(time * 0.62 + 2.4) * 0.065;
  });

  return (
    <group ref={root} scale={scale} position={[0, -0.03, 0]}>
      <ConnectionLines />
      <group ref={browser} position={[0.05, 0.08, 0]} rotation={[-0.055, -0.1, -0.018]}>
        <BrowserPanel />
      </group>
      <group ref={phone} position={[-1.82, -0.22, 0.58]} rotation={[-0.035, 0.25, -0.085]}>
        <PhonePanel />
      </group>
      <group ref={automation} position={[1.68, 0.4, 0.5]} rotation={[0.025, -0.26, 0.065]}>
        <AutomationPanel />
      </group>
      {([
        [-1.47, 0.46, 0.02], [0.2, 1.02, -0.28], [1.5, 0.82, 0.02], [-0.45, -1.18, -0.25], [0.88, -1.02, -0.14],
      ] as Point[]).map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[index % 2 ? 0.035 : 0.045, 12, 12]} />
          <meshBasicMaterial color={index === 2 ? '#a5f3d0' : index === 3 ? '#c4b5fd' : '#83abff'} />
        </mesh>
      ))}
    </group>
  );
}

function ParticleField() {
  const points = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(48 * 3);
    for (let index = 0; index < 48; index += 1) {
      const seed = (offset: number) => {
        const value = Math.sin((index + 1) * (12.9898 + offset)) * 43758.5453;
        return value - Math.floor(value);
      };
      values[index * 3] = (seed(0) - 0.5) * 8;
      values[index * 3 + 1] = (seed(1.7) - 0.5) * 6;
      values[index * 3 + 2] = -1.5 - seed(3.1) * 3;
    }
    return values;
  }, []);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.006;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#88aaff" size={0.022} transparent opacity={0.42} sizeAttenuation />
    </points>
  );
}

export default function HeroScene({ active }: { active: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 7.2], fov: 42 }}
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'demand'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={1.05} />
      <directionalLight position={[3, 4, 6]} intensity={2.1} color="#dbe7ff" />
      <pointLight position={[-4, -2, 3]} intensity={22} color="#5546c8" distance={10} />
      <pointLight position={[3, -3, 3]} intensity={16} color="#4b8dff" distance={9} />
      <ProductShowcase />
      <ParticleField />
    </Canvas>
  );
}
