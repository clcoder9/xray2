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
    <radialGradient id="bg" cx="50%" cy="45%" r="68%">
      <stop offset="0%" stop-color="#0f294a"/>
      <stop offset="65%" stop-color="#081426"/>
      <stop offset="100%" stop-color="#030712"/>
    </radialGradient>
    <radialGradient id="lens" cx="46%" cy="42%" r="54%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.34"/>
      <stop offset="68%" stop-color="#0369a1" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.92"/>
    </radialGradient>
    <linearGradient id="bone" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f0f9ff"/>
      <stop offset="30%" stop-color="#7dd3fc"/>
      <stop offset="50%" stop-color="#0c4a6e"/>
      <stop offset="70%" stop-color="#7dd3fc"/>
      <stop offset="100%" stop-color="#f0f9ff"/>
    </linearGradient>
    <linearGradient id="muscle" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="22%" stop-color="#b91c1c"/>
      <stop offset="55%" stop-color="#ef4444"/>
      <stop offset="82%" stop-color="#991b1b"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- Outer clinical lens bezel -->
  <circle cx="256" cy="256" r="172" fill="url(#lens)" stroke="#38bdf8" stroke-width="12"/>
  <circle cx="256" cy="256" r="144" fill="none" stroke="#bae6fd" stroke-width="2" stroke-dasharray="8 10" opacity="0.55"/>
  <!-- Anatomical Humerus with humeral head, tubercles & distal condyles -->
  <path d="M212 134c-14-14-36-8-42 10-5 16 2 34 16 42l8 16v104l-12 22c-12 14-8 34 6 42 12 6 24 2 30-6 8 8 20 10 30 2 12-10 12-28 2-40l-12-22V200c14-10 22-26 16-42-6-16-24-22-42-24z" fill="url(#bone)" stroke="#f0f9ff" stroke-width="3"/>
  <!-- Anatomical Biceps & Brachialis muscle belly -->
  <path d="M278 158c38 24 54 68 42 118-10 40-28 70-50 84 14-36 16-82 6-126-5-26-10-50 2-76z" fill="url(#muscle)" stroke="#fecaca" stroke-width="2" opacity="0.94"/>
  <!-- Fascicle highlight lines -->
  <path d="M286 184c20 26 28 62 20 98M298 196c16 26 20 56 12 86" fill="none" stroke="#fecaca" stroke-width="2" opacity="0.55" stroke-linecap="round"/>
  <!-- Diagnostic center reticle -->
  <circle cx="256" cy="256" r="9" fill="#22d3ee" stroke="#060a12" stroke-width="3"/>
</svg>`;

  await fs.writeFile(path.join(iconsDir, 'favicon.svg'), iconSvg, 'utf8');

  const svgBuf = Buffer.from(iconSvg);
  await sharp(svgBuf).resize(192, 192).png().toFile(path.join(iconsDir, 'pwa-192x192.png'));
  await sharp(svgBuf).resize(512, 512).png().toFile(path.join(iconsDir, 'pwa-512x512.png'));
  await sharp(svgBuf).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
}

function buildAthleteSvg({ isBack, upperOnly }) {
  // 720x1080 portrait strictly aligned to devFixtures.ts landmark coordinates
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
  const heelY = y(0.915);
  const toeY = y(0.935);

  const defs = `
    <radialGradient id="studio" cx="50%" cy="35%" r="72%">
      <stop offset="0%" stop-color="#223149"/>
      <stop offset="55%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#060a12"/>
    </radialGradient>
    <radialGradient id="rimGlow" cx="50%" cy="42%" r="48%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#060a12" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="skinTorso" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#9e6d51"/>
      <stop offset="22%" stop-color="#d59d7a"/>
      <stop offset="48%" stop-color="#e7b493"/>
      <stop offset="76%" stop-color="#cfa07f"/>
      <stop offset="100%" stop-color="#8c5d43"/>
    </linearGradient>
    <linearGradient id="skinLimbL" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#98674b"/>
      <stop offset="38%" stop-color="#e1ac8b"/>
      <stop offset="85%" stop-color="#bf8868"/>
      <stop offset="100%" stop-color="#8d5e45"/>
    </linearGradient>
    <linearGradient id="skinLimbR" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#8d5e45"/>
      <stop offset="15%" stop-color="#bf8868"/>
      <stop offset="62%" stop-color="#e1ac8b"/>
      <stop offset="100%" stop-color="#98674b"/>
    </linearGradient>
    <radialGradient id="skinHead" cx="46%" cy="40%" r="58%">
      <stop offset="0%" stop-color="#ebba9a"/>
      <stop offset="62%" stop-color="#d49b79"/>
      <stop offset="100%" stop-color="#9a684c"/>
    </radialGradient>
    <linearGradient id="shortsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="32%" stop-color="#273549"/>
      <stop offset="68%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0b1120"/>
    </linearGradient>
    <linearGradient id="muscleShade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#7c4a33" stop-opacity="0.34"/>
      <stop offset="100%" stop-color="#7c4a33" stop-opacity="0.06"/>
    </linearGradient>
    <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#292320"/>
      <stop offset="100%" stop-color="#141110"/>
    </linearGradient>
  `;

  // Continuous seamless left & right legs + compression shorts + sculpted knees/calves/feet
  const legs = upperOnly
    ? ''
    : `
    <!-- Left & Right Continuous Legs (Thigh -> Knee -> Calf -> Ankle) -->
    <path d="M290 ${hipY + 20}
      C270 ${hipY + 75}, 264 ${kneeY - 58}, 270 ${kneeY - 8}
      C272 ${kneeY + 18}, 260 ${kneeY + 62}, 261 ${kneeY + 95}
      C262 ${kneeY + 135}, 272 ${ankleY - 40}, 272 ${ankleY}
      L304 ${ankleY}
      C308 ${ankleY - 38}, 322 ${kneeY + 110}, 324 ${kneeY + 68}
      C326 ${kneeY + 34}, 322 ${kneeY + 8}, 328 ${kneeY - 12}
      C342 ${kneeY - 62}, 354 ${hipY + 62}, 356 ${hipY + 25} Z"
      fill="url(#skinLimbL)"/>
    <path d="M430 ${hipY + 20}
      C450 ${hipY + 75}, 456 ${kneeY - 58}, 450 ${kneeY - 8}
      C448 ${kneeY + 18}, 460 ${kneeY + 62}, 459 ${kneeY + 95}
      C458 ${kneeY + 135}, 448 ${ankleY - 40}, 448 ${ankleY}
      L416 ${ankleY}
      C412 ${ankleY - 38}, 398 ${kneeY + 110}, 396 ${kneeY + 68}
      C394 ${kneeY + 34}, 398 ${kneeY + 8}, 392 ${kneeY - 12}
      C378 ${kneeY - 62}, 366 ${hipY + 62}, 364 ${hipY + 25} Z"
      fill="url(#skinLimbR)"/>

    <!-- Surface anatomy shading on thighs, patellae & calves -->
    ${
      isBack
        ? `
      <path d="M276 ${kneeY + 22} Q292 ${kneeY + 65} 288 ${kneeY + 108}" fill="none" stroke="#8f5c43" stroke-width="3" opacity="0.38" stroke-linecap="round"/>
      <path d="M444 ${kneeY + 22} Q428 ${kneeY + 65} 432 ${kneeY + 108}" fill="none" stroke="#8f5c43" stroke-width="3" opacity="0.38" stroke-linecap="round"/>
      <path d="M284 ${kneeY + 110} L286 ${ankleY - 6}" stroke="#9c6a50" stroke-width="4" opacity="0.32" stroke-linecap="round"/>
      <path d="M436 ${kneeY + 110} L434 ${ankleY - 6}" stroke="#9c6a50" stroke-width="4" opacity="0.32" stroke-linecap="round"/>
      `
        : `
      <!-- Vastus medialis & rectus femoris surface relief -->
      <path d="M294 ${hipY + 62} Q288 ${kneeY - 55} 296 ${kneeY - 18}" fill="none" stroke="#8f5c43" stroke-width="3" opacity="0.32" stroke-linecap="round"/>
      <path d="M426 ${hipY + 62} Q432 ${kneeY - 55} 424 ${kneeY - 18}" fill="none" stroke="#8f5c43" stroke-width="3" opacity="0.32" stroke-linecap="round"/>
      <!-- Patella highlights -->
      <ellipse cx="297" cy="${kneeY - 4}" rx="12" ry="14" fill="#ebc0a3" opacity="0.45"/>
      <ellipse cx="423" cy="${kneeY - 4}" rx="12" ry="14" fill="#ebc0a3" opacity="0.45"/>
      <!-- Anterior shin ridge -->
      <path d="M296 ${kneeY + 16} Q291 ${kneeY + 90} 288 ${ankleY - 8}" fill="none" stroke="#ebc0a3" stroke-width="3" opacity="0.35" stroke-linecap="round"/>
      <path d="M424 ${kneeY + 16} Q429 ${kneeY + 90} 432 ${ankleY - 8}" fill="none" stroke="#ebc0a3" stroke-width="3" opacity="0.35" stroke-linecap="round"/>
      `
    }

    <!-- Sculpted Athletic Compression Shorts -->
    <path d="M292 ${hipY - 40}
      Q360 ${hipY - 30} 428 ${hipY - 40}
      L444 ${hipY + 68}
      Q406 ${hipY + 75} 368 ${hipY + 68}
      L360 ${hipY + 26}
      L352 ${hipY + 68}
      Q314 ${hipY + 75} 276 ${hipY + 68} Z"
      fill="url(#shortsGrad)"/>
    <path d="M292 ${hipY - 40} Q360 ${hipY - 30} 428 ${hipY - 40} L430 ${hipY - 24} Q360 ${hipY - 14} 290 ${hipY - 24} Z" fill="#0f172a"/>
    <path d="M294 ${hipY - 31} Q360 ${hipY - 22} 426 ${hipY - 31}" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.45"/>

    <!-- Feet (Ankle -> Heel -> Metatarsals -> Toes) -->
    <path d="M273 ${ankleY - 12}
      C272 ${ankleY + 4}, 266 ${heelY}, 256 ${toeY - 10}
      L254 ${toeY + 12}
      C254 ${toeY + 26}, 288 ${toeY + 28}, 304 ${toeY + 16}
      C310 ${toeY}, 305 ${heelY}, 303 ${ankleY - 12} Z"
      fill="url(#skinLimbL)"/>
    <path d="M447 ${ankleY - 12}
      C448 ${ankleY + 4}, 454 ${heelY}, 464 ${toeY - 10}
      L466 ${toeY + 12}
      C466 ${toeY + 26}, 432 ${toeY + 28}, 416 ${toeY + 16}
      C410 ${toeY}, 415 ${heelY}, 417 ${ankleY - 12} Z"
      fill="url(#skinLimbR)"/>
    `;

  const headDetails = isBack
    ? `
    <!-- Ears -->
    <ellipse cx="314" cy="${headCy + 2}" rx="8" ry="15" fill="#c78d6b"/>
    <ellipse cx="406" cy="${headCy + 2}" rx="8" ry="15" fill="#c78d6b"/>
    <!-- Posterior Hair Contour -->
    <path d="M314 ${headCy + 14}
      C310 ${headCy - 42}, 330 ${headCy - 66}, 360 ${headCy - 66}
      C390 ${headCy - 66}, 410 ${headCy - 42}, 406 ${headCy + 14}
      Q360 ${headCy + 42} 314 ${headCy + 14} Z"
      fill="url(#hairGrad)"/>
    `
    : `
    <!-- Ears -->
    <ellipse cx="313" cy="${headCy + 2}" rx="8" ry="15" fill="#c78d6b"/>
    <ellipse cx="407" cy="${headCy + 2}" rx="8" ry="15" fill="#c78d6b"/>
    <!-- Sculpted Hair -->
    <path d="M312 ${headCy - 8}
      C310 ${headCy - 56}, 334 ${headCy - 68}, 360 ${headCy - 68}
      C386 ${headCy - 68}, 410 ${headCy - 56}, 408 ${headCy - 8}
      C392 ${headCy - 34}, 372 ${headCy - 40}, 360 ${headCy - 38}
      C348 ${headCy - 40}, 328 ${headCy - 34}, 312 ${headCy - 8} Z"
      fill="url(#hairGrad)"/>
    <!-- Eyebrows, Eyes, Nose & Mouth -->
    <path d="M332 ${headCy - 14} Q342 ${headCy - 18} 352 ${headCy - 13}" fill="none" stroke="#292320" stroke-width="3" stroke-linecap="round"/>
    <path d="M368 ${headCy - 13} Q378 ${headCy - 18} 388 ${headCy - 14}" fill="none" stroke="#292320" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="342" cy="${headCy - 5}" rx="5.5" ry="3.2" fill="#f8fafc"/>
    <circle cx="342" cy="${headCy - 5}" r="2.6" fill="#1e293b"/>
    <ellipse cx="378" cy="${headCy - 5}" rx="5.5" ry="3.2" fill="#f8fafc"/>
    <circle cx="378" cy="${headCy - 5}" r="2.6" fill="#1e293b"/>
    <path d="M360 ${headCy - 8} L356 ${headCy + 12} Q360 ${headCy + 16} 364 ${headCy + 12}" fill="none" stroke="#9e6c4f" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M348 ${headCy + 26} Q360 ${headCy + 32} 372 ${headCy + 26}" fill="none" stroke="#8b5244" stroke-width="3" stroke-linecap="round"/>
    <path d="M352 ${headCy + 36} Q360 ${headCy + 38} 368 ${headCy + 36}" fill="none" stroke="#9e6c4f" stroke-width="1.8" opacity="0.5"/>
    `;

  const torsoCont = isBack
    ? `
    <!-- Posterior Trapezius, Scapular & Erector Spinae Surface Anatomy -->
    <path d="M360 ${neckTop + 26} L360 ${hipY - 38}" stroke="#8c5a41" stroke-width="4.5" opacity="0.42" stroke-linecap="round"/>
    <path d="M348 ${neckTop + 36} Q338 ${shoulderY + 90} 346 ${hipY - 40}" fill="none" stroke="#9b664b" stroke-width="2.5" opacity="0.32"/>
    <path d="M372 ${neckTop + 36} Q382 ${shoulderY + 90} 374 ${hipY - 40}" fill="none" stroke="#9b664b" stroke-width="2.5" opacity="0.32"/>
    <path d="M294 ${shoulderY + 26} Q332 ${shoulderY + 54} 342 ${shoulderY + 98}" fill="none" stroke="#8c5a41" stroke-width="3" opacity="0.38" stroke-linecap="round"/>
    <path d="M426 ${shoulderY + 26} Q388 ${shoulderY + 54} 378 ${shoulderY + 98}" fill="none" stroke="#8c5a41" stroke-width="3" opacity="0.38" stroke-linecap="round"/>
    <path d="M276 ${shoulderY + 86} Q310 ${shoulderY + 145} 316 ${hipY - 44}" fill="none" stroke="#8c5a41" stroke-width="3" opacity="0.30" stroke-linecap="round"/>
    <path d="M444 ${shoulderY + 86} Q410 ${shoulderY + 145} 404 ${hipY - 44}" fill="none" stroke="#8c5a41" stroke-width="3" opacity="0.30" stroke-linecap="round"/>
    `
    : `
    <!-- Clavicle, Pectoral, Linea Alba & Abdominal Surface Anatomy -->
    <path d="M350 ${shoulderY - 8} Q310 ${shoulderY - 16} 274 ${shoulderY - 2}" fill="none" stroke="#f0c4a6" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
    <path d="M370 ${shoulderY - 8} Q410 ${shoulderY - 16} 446 ${shoulderY - 2}" fill="none" stroke="#f0c4a6" stroke-width="3" opacity="0.45" stroke-linecap="round"/>
    <path d="M272 ${shoulderY + 54} Q316 ${shoulderY + 84} 356 ${shoulderY + 66}" fill="none" stroke="#8c5a41" stroke-width="3.2" opacity="0.45" stroke-linecap="round"/>
    <path d="M448 ${shoulderY + 54} Q404 ${shoulderY + 84} 364 ${shoulderY + 66}" fill="none" stroke="#8c5a41" stroke-width="3.2" opacity="0.45" stroke-linecap="round"/>
    <path d="M360 ${shoulderY + 64} L360 ${hipY - 38}" stroke="#8c5a41" stroke-width="2.4" opacity="0.38"/>
    <path d="M332 ${shoulderY + 110} Q360 ${shoulderY + 114} 388 ${shoulderY + 110}" fill="none" stroke="#8c5a41" stroke-width="2" opacity="0.28"/>
    <path d="M330 ${shoulderY + 146} Q360 ${shoulderY + 150} 390 ${shoulderY + 146}" fill="none" stroke="#8c5a41" stroke-width="2" opacity="0.28"/>
    <path d="M332 ${shoulderY + 182} Q360 ${shoulderY + 186} 388 ${shoulderY + 182}" fill="none" stroke="#8c5a41" stroke-width="2" opacity="0.28"/>
    <path d="M326 ${shoulderY + 95} Q322 ${shoulderY + 165} 330 ${hipY - 40}" fill="none" stroke="#8c5a41" stroke-width="2.2" opacity="0.26"/>
    <path d="M394 ${shoulderY + 95} Q398 ${shoulderY + 165} 390 ${hipY - 40}" fill="none" stroke="#8c5a41" stroke-width="2.2" opacity="0.26"/>
    `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1080" viewBox="0 0 720 1080">
  <defs>${defs}</defs>
  <rect width="720" height="1080" fill="url(#studio)"/>
  <rect width="720" height="1080" fill="url(#rimGlow)"/>
  <!-- Studio floor shadow -->
  <ellipse cx="360" cy="${upperOnly ? 1050 : 1018}" rx="210" ry="26" fill="#000000" opacity="0.45"/>

  <!-- Trapezius & Neck Slope -->
  <path d="M336 ${neckTop}
    L384 ${neckTop}
    C386 ${neckTop + 26}, 406 ${shoulderY - 18}, 456 ${shoulderY - 6}
    L264 ${shoulderY - 6}
    C314 ${shoulderY - 18}, 334 ${neckTop + 26}, 336 ${neckTop} Z"
    fill="url(#skinTorso)"/>

  <!-- Sculpted Athletic Torso (rendered underneath deltoid caps for seamless shoulder junction) -->
  <path d="M262 ${shoulderY - 6}
    Q360 ${shoulderY - 20} 458 ${shoulderY - 6}
    C458 ${shoulderY + 45}, 448 ${shoulderY + 95}, 436 ${shoulderY + 135}
    C428 ${shoulderY + 168}, 426 ${hipY - 62}, 430 ${hipY - 34}
    L290 ${hipY - 34}
    C294 ${hipY - 62}, 292 ${shoulderY + 168}, 284 ${shoulderY + 135}
    C272 ${shoulderY + 95}, 262 ${shoulderY + 45}, 262 ${shoulderY - 6} Z"
    fill="url(#skinTorso)"/>
  ${torsoCont}

  <!-- Continuous Left & Right Arms (Deltoid cap -> Biceps -> Forearm -> Sculpted Hand) -->
  <path d="M276 ${shoulderY - 8}
    C242 ${shoulderY - 4}, 224 ${shoulderY + 34}, 212 ${elbowY - 34}
    C204 ${elbowY - 10}, 194 ${elbowY + 34}, 186 ${wristY - 26}
    L178 ${wristY + 6}
    C170 ${wristY + 26}, 168 ${wristY + 52}, 176 ${wristY + 68}
    C184 ${wristY + 76}, 196 ${wristY + 72}, 200 ${wristY + 52}
    L204 ${wristY + 38}
    C208 ${wristY + 46}, 214 ${wristY + 36}, 210 ${wristY + 20}
    L204 ${wristY + 8}
    C220 ${wristY - 32}, 236 ${elbowY + 28}, 244 ${elbowY + 4}
    C256 ${elbowY - 32}, 268 ${shoulderY + 36}, 280 ${shoulderY + 56}
    Q282 ${shoulderY + 22} 276 ${shoulderY - 8} Z"
    fill="url(#skinLimbL)"/>
  <path d="M444 ${shoulderY - 8}
    C478 ${shoulderY - 4}, 496 ${shoulderY + 34}, 508 ${elbowY - 34}
    C516 ${elbowY - 10}, 526 ${elbowY + 34}, 534 ${wristY - 26}
    L542 ${wristY + 6}
    C550 ${wristY + 26}, 552 ${wristY + 52}, 544 ${wristY + 68}
    C536 ${wristY + 76}, 524 ${wristY + 72}, 520 ${wristY + 52}
    L516 ${wristY + 38}
    C512 ${wristY + 46}, 506 ${wristY + 36}, 510 ${wristY + 20}
    L516 ${wristY + 8}
    C500 ${wristY - 32}, 484 ${elbowY + 28}, 476 ${elbowY + 4}
    C464 ${elbowY - 32}, 452 ${shoulderY + 36}, 440 ${shoulderY + 56}
    Q438 ${shoulderY + 22} 444 ${shoulderY - 8} Z"
    fill="url(#skinLimbR)"/>

  <!-- Deltoid / Biceps surface definition -->
  <path d="M242 ${shoulderY + 46} Q262 ${shoulderY + 52} 276 ${shoulderY + 38}" fill="none" stroke="#8c5a41" stroke-width="2.5" opacity="0.35" stroke-linecap="round"/>
  <path d="M478 ${shoulderY + 46} Q458 ${shoulderY + 52} 444 ${shoulderY + 38}" fill="none" stroke="#8c5a41" stroke-width="2.5" opacity="0.35" stroke-linecap="round"/>

  <!-- Sculpted Head & Jawline -->
  <path d="M316 ${headCy - 10}
    C316 ${headCy - 58}, 404 ${headCy - 58}, 404 ${headCy - 10}
    C404 ${headCy + 24}, 386 ${headCy + 54}, 360 ${headCy + 56}
    C334 ${headCy + 54}, 316 ${headCy + 24}, 316 ${headCy - 10} Z"
    fill="url(#skinHead)"/>
  ${headDetails}

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
console.log('Generated AAA PWA icons and Dev Input sample images.');
