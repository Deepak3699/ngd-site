import { ImageResponse } from 'next/og';

export const alt = 'NGD Solutions — NextGenDev Solutions';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', background: '#070a12', color: '#f4f7fc', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ position: 'absolute', width: 560, height: 560, borderRadius: 560, right: -90, top: -130, background: '#152c64', opacity: .7 }} />
      <div style={{ position: 'absolute', width: 390, height: 390, borderRadius: 390, right: 5, top: -45, border: '2px solid #4668b9', opacity: .65 }} />
      <div style={{ position: 'absolute', width: 250, height: 250, borderRadius: 34, right: 75, top: 25, border: '3px solid #83abff', transform: 'rotate(28deg)', background: '#254ca9', opacity: .8 }} />
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', padding: '62px 70px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 4 }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, marginRight: 18, border: '2px solid #4165b5', borderRadius: 13, color: '#b8cffd', fontSize: 20 }}>NGD</div>NGD SOLUTIONS</div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 35 }}>
          <div style={{ display: 'flex', fontSize: 65, lineHeight: 1.05, letterSpacing: -3, fontWeight: 700, maxWidth: 800 }}>Build. Launch.<br />Automate.</div>
          <div style={{ display: 'flex', marginTop: 27, color: '#a9b9d3', fontSize: 24 }}>Websites · Apps · AI · SEO · Student mentorship</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7f92b2', fontSize: 18 }}><span>NextGenDev Solutions</span><span>ngdsolutions.com</span></div>
      </div>
    </div>,
    size,
  );
}
