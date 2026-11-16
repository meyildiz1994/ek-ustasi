/**
 * Writes tools/scenes/preview.html: every stop's scene recipe drawn on a canvas with simple generic
 * shapes, to review palettes and layer choices before the Skia scenes (Phase 7). Run via
 * `pnpm levelgen` (or `pnpm scenes`).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildStops, type Stop } from '../levelgen/stops';

const DRAW = String.raw`
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6d2b79f5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function draw(cv,s){const g=cv.getContext('2d'),W=cv.width,H=cv.height,R=rng(s.scene.seed),L=new Set(s.scene.layers),P=s.palette;
const sky=g.createLinearGradient(0,0,0,H*.7);P.sky.forEach((c,i)=>sky.addColorStop(i/3,c));g.fillStyle=sky;g.fillRect(0,0,W,H);
const hor=H*.62,t=s.scene.time;
if(L.has('stars')||t==='night'){g.fillStyle='#fff';for(let i=0;i<60;i++){g.globalAlpha=.3+R()*.7;g.fillRect(R()*W,R()*hor*.8,1.5,1.5)}g.globalAlpha=1}
if(t==='night'||L.has('moon')){g.fillStyle='#FFF4E0';g.beginPath();g.arc(W*.8,H*.14,14,0,7);g.fill()}else{g.fillStyle=t==='sunset'?'#FFB35C':'#FFE7A3';g.beginPath();g.arc(W*.75,t==='sunset'?hor-30:H*.16,t==='sunset'?26:18,0,7);g.fill()}
if(L.has('clouds')){g.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<3;i++){const x=R()*W,y=20+R()*60;for(let j=0;j<4;j++){g.beginPath();g.arc(x+j*14,y+(j%2)*4,12,0,7);g.fill()}}}
const ridge=(col,base,amp,n,sharp)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,H);for(let i=0;i<=n;i++){const x=i/n*W,y=base-(sharp?(i%2?amp*(.6+R()*.4):amp*.1):amp*(.5+.5*Math.sin(i*1.3+R()*2)));g.lineTo(x,y)}g.lineTo(W,H);g.fill()};
if(L.has('snowPeaks')){ridge(P.ground[0],hor,110,8,true);g.fillStyle='#fff';g.globalAlpha=.85;ridge('#fff',hor-60,50,8,true);g.globalAlpha=1;ridge(P.ground[0],hor+10,70,9,true)}
else if(L.has('mountains'))ridge(P.ground[0],hor,90,8,true);
if(L.has('hills'))ridge(P.ground[1],hor+20,40,6,false);
if(L.has('plateau')){g.fillStyle=P.ground[0];g.fillRect(0,hor-14,W,H)}
if(L.has('rockSpires')){g.fillStyle=P.ground[0];for(let i=0;i<9;i++){const x=R()*W,h=40+R()*60,w=14+R()*10;g.beginPath();g.moveTo(x-w,hor+20);g.lineTo(x,hor+20-h);g.lineTo(x+w,hor+20);g.fill();g.fillStyle='#FFF4E0';g.beginPath();g.arc(x,hor+20-h,4,0,7);g.fill();g.fillStyle=P.ground[0]}}
const water=L.has('sea')||L.has('lake')||L.has('river');
if(L.has('sea')||L.has('lake')){g.fillStyle=P.accent;g.fillRect(0,hor+20,W,H*.15);g.strokeStyle='rgba(255,255,255,.5)';for(let i=0;i<12;i++){const x=R()*W,y=hor+26+R()*H*.12;g.beginPath();g.moveTo(x,y);g.lineTo(x+12,y);g.stroke()}}
if(L.has('desert')){g.fillStyle='#E8C27A';ridge('#E8C27A',hor+30,22,5,false)}
const ground=(L.has('sea')||L.has('lake'))?hor+20+H*.15:hor+20;g.fillStyle=P.ground[2];g.fillRect(0,ground,W,H-ground);
if(L.has('river')){g.fillStyle=P.accent;g.beginPath();g.moveTo(W*.45,ground);g.quadraticCurveTo(W*.3,H*.85,W*.5,H);g.lineTo(W*.7,H);g.quadraticCurveTo(W*.5,H*.85,W*.55,ground);g.fill()}
if(L.has('terraces')){for(let i=0;i<5;i++){g.fillStyle=i%2?P.ground[1]:'#7FBF6A';g.fillRect(0,ground-60+i*12,W*.5-i*20,10)}}
if(L.has('fields')||L.has('vineyards')){for(let i=0;i<6;i++){g.fillStyle=L.has('vineyards')?'#6E8B3D':(i%2?'#D9B55A':'#A9C46C');g.fillRect(i*W/6,ground+4,W/6-2,14)}}
const sky2=ground-2;
if(L.has('city')||L.has('houses')||L.has('skyscrapers')){for(let i=0;i<14;i++){const x=i*W/14,h=L.has('skyscrapers')&&i%3===0?60+R()*70:14+R()*26;g.fillStyle=i%2?P.ground[1]:P.ground[0];g.fillRect(x,sky2-h,W/14-2,h);if(L.has('houses')){g.fillStyle='#C8323C';g.beginPath();g.moveTo(x-1,sky2-h);g.lineTo(x+W/28,sky2-h-8);g.lineTo(x+W/14-1,sky2-h);g.fill()}if(t==='night'){g.fillStyle='#F2A93B';g.fillRect(x+3,sky2-h+5,3,3)}}}
if(L.has('domes')){const x=W*.38;g.fillStyle=P.ground[1];g.fillRect(x-30,sky2-30,60,30);g.beginPath();g.arc(x,sky2-30,24,Math.PI,0);g.fill()}
if(L.has('minarets')){g.fillStyle=P.ground[1];for(const x of [W*.38-42,W*.38+40]){g.fillRect(x-3,sky2-80,6,80);g.beginPath();g.moveTo(x-4,sky2-80);g.lineTo(x,sky2-96);g.lineTo(x+4,sky2-80);g.fill()}}
if(L.has('tower')){const x=W*.68;g.fillStyle=P.ground[0];g.fillRect(x-6,sky2-90,12,90);g.beginPath();g.moveTo(x-9,sky2-90);g.lineTo(x,sky2-110);g.lineTo(x+9,sky2-90);g.fill()}
if(L.has('castle')){const x=W*.2;g.fillStyle=P.ground[0];g.fillRect(x-28,sky2-40,56,40);for(let i=0;i<5;i++)g.fillRect(x-28+i*12,sky2-48,7,8)}
if(L.has('bridge')){g.strokeStyle=P.ground[0];g.lineWidth=4;g.beginPath();g.moveTo(0,ground-14);g.quadraticCurveTo(W/2,ground-40,W,ground-14);g.stroke();g.lineWidth=1}
if(L.has('columns')||L.has('ruins')){g.fillStyle='#EDE3CF';for(let i=0;i<5;i++){const h=L.has('ruins')&&i%2?18:36;g.fillRect(W*.55+i*12,sky2-h,6,h)}}
if(L.has('lighthouse')){const x=W*.9;g.fillStyle='#fff';g.fillRect(x-5,sky2-50,10,50);g.fillStyle='#C8323C';g.fillRect(x-5,sky2-40,10,8);g.fillRect(x-5,sky2-20,10,8)}
if(L.has('windmills')){g.strokeStyle='#FFF4E0';g.lineWidth=2;for(const x of [W*.82,W*.92]){g.beginPath();g.moveTo(x,sky2);g.lineTo(x,sky2-40);g.stroke();for(let k=0;k<4;k++){g.beginPath();g.moveTo(x,sky2-40);g.lineTo(x+16*Math.cos(k*1.57+.4),sky2-40+16*Math.sin(k*1.57+.4));g.stroke()}}g.lineWidth=1}
if(L.has('waterfall')){g.fillStyle='rgba(255,255,255,.8)';g.fillRect(W*.15,hor-50,10,ground-hor+50)}
const tree=(x,y,pine)=>{g.fillStyle=pine?'#1E4D3A':'#2E7D4F';g.beginPath();if(pine){g.moveTo(x-8,y);g.lineTo(x,y-26);g.lineTo(x+8,y)}else g.arc(x,y-12,10,0,7);g.fill()};
if(L.has('trees')||L.has('pines'))for(let i=0;i<10;i++)tree(R()*W,ground+18+R()*30,L.has('pines')&&(i%2===0||!L.has('trees')));
if(L.has('palms')){g.strokeStyle='#5A3E2B';g.lineWidth=3;for(const x of [W*.1,W*.9]){g.beginPath();g.moveTo(x,ground+30);g.quadraticCurveTo(x+6,ground,x+2,ground-30);g.stroke();g.fillStyle='#2E7D4F';for(let k=0;k<5;k++){g.beginPath();g.ellipse(x+2+Math.cos(k*1.25)*12,ground-30+Math.sin(k*1.25)*5,14,4,k*1.25,0,7);g.fill()}}g.lineWidth=1}
if(L.has('boats')&&water){for(let i=0;i<3;i++){const x=R()*W*.8+20,y=hor+30+R()*H*.08;g.fillStyle='#FFF4E0';g.beginPath();g.moveTo(x,y);g.lineTo(x+24,y);g.lineTo(x+18,y+6);g.lineTo(x+6,y+6);g.fill()}}
if(L.has('balloons')){const cols=['#C8323C','#F2A93B','#1FA6A0','#2753A6'];for(let i=0;i<7;i++){const x=R()*W,y=30+R()*hor*.6,r=8+R()*8;g.fillStyle=cols[i%4];g.beginPath();g.arc(x,y,r,0,7);g.fill();g.fillStyle='#5A3E2B';g.fillRect(x-2,y+r+3,4,4)}}
if(L.has('birds')){g.strokeStyle='#1E2A5A';for(let i=0;i<6;i++){const x=R()*W,y=20+R()*80;g.beginPath();g.moveTo(x-6,y);g.quadraticCurveTo(x-3,y-4,x,y);g.quadraticCurveTo(x+3,y-4,x+6,y);g.stroke()}}
if(L.has('snow')){g.fillStyle='#fff';for(let i=0;i<70;i++){g.globalAlpha=.6;g.beginPath();g.arc(R()*W,R()*H,1.6,0,7);g.fill()}g.globalAlpha=1}}
document.querySelectorAll('canvas[data-i]').forEach(cv=>draw(cv,STOPS[+cv.dataset.i]));`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function previewHtml(stops: readonly Stop[]): string {
  const cards = stops
    .map(
      (s, i) =>
        `<figure><canvas data-i="${i}" width="270" height="400"></canvas><figcaption><b>${s.index}. ${esc(s.name)}</b> <small>${s.id} · ${s.scene.time}</small><br>${esc(s.intro)}<br><small>${s.scene.layers.join(', ')}</small><br>${[...s.palette.sky, ...s.palette.ground, s.palette.accent].map((c) => `<i style="background:${c}" title="${c}"></i>`).join('')}</figcaption></figure>`,
    )
    .join('\n');
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>Ek Ustası — durak sahneleri</title>
<style>body{font:13px/1.4 system-ui,sans-serif;background:#FFF4E0;color:#1E2A5A;margin:20px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
figure{margin:0;background:#fff;border-radius:10px;padding:6px;box-shadow:0 1px 3px #0002}canvas{width:100%;border-radius:6px;display:block}i{display:inline-block;width:14px;height:14px;margin:2px 2px 0 0;border-radius:3px}small{color:#6b6f86}</style></head>
<body><h1>Durak sahneleri (${stops.length})</h1><p>Basit önizleme: katman seçimi ve paleti kontrol etmek için. Asıl sahneler uygulamada Skia ile çizilecek; GPT arka planları bölge zemini olarak kullanılır (D-014).</p>
<main>${cards}</main><script>const STOPS=${JSON.stringify(stops)};${DRAW}</script></body></html>
`;
}

export function writePreview(stops = buildStops()): void {
  writeFileSync(join(__dirname, 'preview.html'), previewHtml(stops));
}

if (require.main === module) writePreview();
