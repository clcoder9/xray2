import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const iconsDir = path.join(rootDir, 'public', 'icons');
const samplesDir = path.join(rootDir, 'public', 'dev-samples');

async function generateIcons() {
  await fs.mkdir(iconsDir, { recursive: true });

  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#0f2744"/>
      <stop offset="100%" stop-color="#060a12"/>
    </radialGradient>
    <radialGradient id="lens" cx="45%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.32"/>
      <stop offset="70%" stop-color="#0284c7" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="164" fill="url(#lens)" stroke="#38bdf8" stroke-width="14"/>
  <circle cx="256" cy="256" r="128" fill="none" stroke="#bae6fd" stroke-width="2" stroke-dasharray="10 10" opacity="0.5"/>
  <!-- Stylized X-ray humerus + muscle fibers inside lens -->
  <path d="M214 148c16-14 36-14 48 0 10 12 8 34-4 58v104c12 24 14 46 4 58-12 14-32 14-48 0-12-12-10-34 2-58V206c-12-24-14-46-2-58z" fill="#e0f2fe" opacity="0.9"/>
  <path d="M276 168c32 22 44 62 34 106-8 36-24 64-44 76 12-34 14-76 6-114-4-24-8-46 4-68z" fill="#ef4444" opacity="0.92"/>
  <circle cx="256" cy="256" r="10" fill="#22d3ee"/>
</svg>`;

  await fs.writeFile(path.join(iconsDir, 'favicon.svg'), iconSvg, 'utf8');

  const svgBuf = Buffer.from(iconSvg);
  await sharp(svgBuf).resize(192, 192).png().toFile(path.join(iconsDir, 'pwa-192x192.png'));
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(iconsDir, 'pwa-512x512.png'));
  await sharp(svgBuf).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
}

function buildAthleteSvg({ isBack, upperOnly }) {
  // 720x1080 portrait aligned to devFixtures.ts landmark coordinates
  const scaleY = upperOnly ? 1.45 : 1.0;
  const offY = upperOnly ? 65 : 0;
  const y = (normY) => Math.round((offY / 1080 + normY * scaleY) * 1080);

  const headCy = y(0.12);
  const neckTop = y(0.165);
  const shoulderY = y(0.235);
  const elbowY = y(0.37);
  const wristY = y(0.5);
  const hipY = y(0.495);
  const kneeY = y(0.695);
  const ankleY = y(0.885);

  const skinGrad = `<linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="0%">
    <stop offset="0%" stop-color="#b88464"/>
    <stop offset="32%" stop-color="#dfa987"/>
    <stop offset="68%" stop-color="#d59d7a"/>
    <stop offset="100%" stop-color="#a87354"/>
  </linearGradient>`;

  const studioBg = `<radialGradient id="studio" cx="50%" cy="38%" r="72%">
    <stop offset="0%" stop-color="#283548"/>
    <stop offset="65%" stop-color="#151d2b"/>
    <stop offset="100%" stop-color="#0b1019"/>
  </radialGradient>`;

  // Athletic torso + limbs silhouettes
  const legs = upperOnly
    ? ''
    : `
    <!-- Left & Right Thighs -->
    <path d="M292 ${hipY - 12} C272 ${hipY + 80} 266 ${kneeY - 50} 276 ${kneeY + 12} L330 ${kneeY + 12} C342 ${kneeY - 60} 352 ${hipY + 60} 356 ${hipY + 25} Z" fill="url(#skin)"/>
    <path d="M428 ${hipY - 12} C448 ${hipY + 80} 454 ${kneeY - 50} 444 ${kneeY + 12} L390 ${kneeY + 12} C378 ${kneeY - 60} 368 ${hipY + 60} 364 ${hipY + 25} Z" fill="url(#skin)"/>
    <!-- Athletic Shorts -->
    <path d="M288 ${hipY - 38} L432 ${hipY - 38} L444 ${hipY + 72} L366 ${hipY + 72} L360 ${hipY + 22} L354 ${hipY + 72} L276 ${hipY + 72} Z" fill="#1e293b"/>
    <!-- Lower legs -->
    <path d="M278 ${kneeY} C258 ${kneeY + 70} 260 ${kneeY + 135} 276 ${ankleY} L306 ${ankleY} C318 ${kneeY + 130} 326 ${kneeY + 65} 326 ${kneeY} Z" fill="url(#skin)"/>
    <path d="M442 ${kneeY} C462 ${kneeY + 70} 460 ${kneeY + 135} 444 ${ankleY} L414 ${ankleY} C402 ${kneeY + 130} 394 ${kneeY + 65} 394 ${kneeY} Z" fill="url(#skin)"/>
    <!-- Feet -->
    <ellipse cx="278" cy="${ankleY + 34}" rx="28" ry="18" fill="url(#skin)"/>
    <ellipse cx="442" cy="${ankleY + 34}" rx="28" ry="18" fill="url(#skin)"/>
    `;

  const headDetails = isBack
    ? `
    <!-- Hair back of head -->
    <ellipse cx="360" cy="${headCy - 4}" rx="48" ry="58" fill="#1e1b18"/>
    <path d="M314 ${headCy + 10} Q360 ${headCy + 56} 406 ${headCy + 10} L400 ${headCy + 42} Q360 ${headCy + 64} 320 ${headCy + 42} Z" fill="#1e1b18"/>
    `
    : `
    <!-- Hair top + Facial features -->
    <path d="M312 ${headCy - 6} C312 ${headCy - 64} 408 ${headCy - 64} 408 ${headCy - 6} C392 ${headCy - 28} 328 ${headCy - 28} 312 ${headCy - 6} Z" fill="#1e1b18"/>
    <ellipse cx="342" cy="${headCy - 4}" rx="5" ry="3.5" fill="#1e293b"/>
    <ellipse cx="378" cy="${headCy - 4}" rx="5" ry="3.5" fill="#1e293b"/>
    <path d="M360 ${headCy - 4} L357 ${headCy + 14} L364 ${headCy + 15}" fill="none" stroke="#9e6c4f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M348 ${headCy + 27} Q360 ${headCy + 34} 372 ${headCy + 27}" fill="none" stroke="#8b5244" stroke-width="3" stroke-linecap="round"/>
    `;

  const torsoCont = isBack
    ? `
    <!-- Subtle posterior scapular & spine contour lines -->
    <path d="M360 ${neckTop + 30} L360 ${hipY - 35}" stroke="#a87354" stroke-width="4" opacity="0.45"/>
    <path d="M298 ${shoulderY + 36} Q335 ${shoulderY + 55} 342 ${shoulderY + 102}" fill="none" stroke="#a87354" stroke-width="2.5" opacity="0.35"/>
    <path d="M422 ${shoulderY + 36} Q385 ${shoulderY + 55} 378 ${shoulderY + 102}" fill="none" stroke="#a87354" stroke-width="2.5" opacity="0.35"/>
    `
    : `
    <!-- Subtle anterior pectoral & abdominal contours -->
    <path d="M275 ${shoulderY + 62} Q318 ${shoulderY + 86} 356 ${shoulderY + 68}" fill="none" stroke="#a87354" stroke-width="2.5" opacity="0.45"/>
    <path d="M445 ${shoulderY + 62} Q402 ${shoulderY + 86} 364 ${shoulderY + 68}" fill="none" stroke="#a87354" stroke-width="2.5" opacity="0.45"/>
    <path d="M360 ${shoulderY + 75} L360 ${hipY - 40}" stroke="#a87354" stroke-width="2.2" opacity="0.35"/>
    `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
  <defs>${studioBg}${skinGrad}</defs>
  <rect width="720" height="1080" fill="url(#studio)"/>
  <!-- Subtle floor horizon -->
  <ellipse cx="360" cy="${upperOnly ? 1050 : 1010}" rx="220" ry="28" fill="#000000" opacity="0.35"/>

  <!-- Neck -->
  <rect x="334" y="${neckTop}" width="52" height="${shoulderY - neckTop + 18}" rx="20" fill="url(#skin)"/>

  <!-- Head -->
  <ellipse cx="360" cy="${headCy}" rx="46" ry="56" fill="url(#skin)"/>
  ${headDetails}

  <!-- Left & Right Arms (at ~15 deg natural athletic stance) -->
  <path d="M262 ${shoulderY - 12} C236 ${shoulderY + 25} 214 ${elbowY - 30} 204 ${elbowY + 8} L244 ${elbowY + 14} C256 ${elbowY - 30} 268 ${shoulderY + 40} 282 ${shoulderY + 38} Z" fill="url(#skin)"/>
  <path d="M204 ${elbowY + 4} C192 ${elbowY + 55} 182 ${wristY - 25} 178 ${wristY + 10} L204 ${wristY + 14} C216 ${wristY - 35} 232 ${elbowY + 40} 242 ${elbowY + 10} Z" fill="url(#skin)"/>
  <ellipse cx="186" cy="${wristY + 42}" rx="15" ry="30" transform="rotate(8 186 ${wristY + 42})" fill="url(#skin)"/>

  <path d="M458 ${shoulderY - 12} C484 ${shoulderY + 25} 506 ${elbowY - 30} 516 ${elbowY + 8} L476 ${elbowY + 14} C464 ${elbowY - 30} 452 ${shoulderY + 40} 438 ${shoulderY + 38} Z" fill="url(#skin)"/>
  <path d="M516 ${elbowY + 4} C528 ${elbowY + 55} 538 ${wristY - 25} 542 ${wristY + 10} L516 ${wristY + 14} C504 ${wristY - 35} 488 ${elbowY + 40} 478 ${elbowY + 10} Z" fill="url(#skin)"/>
  <ellipse cx="534" cy="${wristY + 42}" rx="15" ry="30" transform="rotate(-8 534 ${wristY + 42})" fill="url(#skin)"/>

  <!-- Torso -->
  <path d="M256 ${shoulderY} Q360 ${shoulderY - 24} 464 ${shoulderY} L444 ${shoulderY + 115} L428 ${hipY - 35} L292 ${hipY - 35} L276 ${shoulderY + 115} Z" fill="url(#skin)"/>
  ${torsoCont}

  ${legs}
</svg>`;
}

async function generateSamples() {
  await fs.mkdir(samplesDir, { recursive: true });
  const specs = [
    { file: 'anterior-athlete.png', isBack: false, upperOnly: false },
    { file: 'posterior-athlete.png', isBack: true, upperOnly: false },
    { file: 'upper-body.png', isBack: false, upperOnly: true }
  ];

  for (const spec of specs) {
    const svg = buildAthleteSvg(spec);
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(samplesDir, spec.file));
  }
}

await generateIcons();
await generateSamples();
console.log('Generated PWA icons and Dev Input sample images.');
