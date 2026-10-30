'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode, useEffect, useRef, useState } from 'react';

const HeroScene = dynamic(() => import('./three/hero-scene'), {
  ssr: false,
  loading: () => <SceneFallback />,
});

function SceneFallback() {
  return (
    <div className="scene-fallback product-fallback" aria-hidden="true">
      <div className="fallback-product-browser">
        <div className="fallback-window-bar"><i /><i /><i /><span>NGD / PRODUCT SYSTEM</span></div>
        <div className="fallback-window-content">
          <small>NGD</small>
          <strong>Digital products.</strong>
          <p>Designed around your business.</p>
          <b>BUILD. LAUNCH. AUTOMATE.</b>
          <div className="fallback-product-cards"><span>Design</span><span>Develop</span><span>Automate</span></div>
        </div>
      </div>
      <div className="fallback-product-phone">
        <small>NGD</small>
        <strong>Mobile<br />app</strong>
        <span>Fast</span><span>Useful</span><span>Connected</span>
      </div>
      <div className="fallback-product-ai">
        <small>AI AUTOMATION</small>
        <span>01&nbsp; Input</span><span>02&nbsp; Assistant</span><span>03&nbsp; Action</span>
      </div>
    </div>
  );
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <SceneFallback /> : this.props.children; }
}

export function HeroVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [checked, setChecked] = useState(false);
  const [allow3D, setAllow3D] = useState(true);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setAllow3D(!reduced && !connection?.saveData);
    setChecked(true);

    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '120px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-visual" ref={containerRef}>
      <div className="visual-topbar">
        <span><i />NGD / PRODUCT SHOWCASE</span>
        <span className="visual-status">INTERACTIVE 3D</span>
      </div>
      <div className="scene-wrap" aria-hidden="true">
        {!checked || !allow3D ? <SceneFallback /> : <SceneBoundary><HeroScene active={active} /></SceneBoundary>}
      </div>
      <div className="visual-bottom">
        <div><span>01</span><p>Design<strong>Human-first</strong></p></div>
        <div><span>02</span><p>Build<strong>Performance-led</strong></p></div>
        <div><span>03</span><p>Grow<strong>Data-informed</strong></p></div>
      </div>
    </div>
  );
}
