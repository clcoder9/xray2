import type { NameLanguage, UILanguage } from '../data/anatomyData';
import type { AnatomicalSide, DetectedOrientation, ViewModeOverride } from '../vision/types';

export interface UITextBundle {
  appName: string;
  bones: string;
  muscles: string;
  freeze: string;
  live: string;
  autoView: string;
  frontView: string;
  backView: string;
  flipCamera: string;
  devAndSettings: string;
  enableCameraTitle: string;
  enableCameraBody: string;
  enableCameraPrivacy: string;
  enableCameraBtn: string;
  useDevInputBtn: string;
  cameraDeniedTitle: string;
  cameraDeniedBody: string;
  cameraMissingTitle: string;
  cameraMissingBody: string;
  retryCameraBtn: string;
  noPersonHint: string;
  focusHintEmpty: string;
  pinnedBadge: string;
  tapToPinHint: string;
  unpinLabel: string;
  closeLabel: string;
  inputSourceLabel: string;
  liveCameraLabel: string;
  uploadMediaLabel: string;
  poseModelLabel: string;
  modelFullLabel: string;
  modelLiteLabel: string;
  fpsLabel: string;
  lensHandleAria: string;
  lensMoveAria: string;
  lensResetHint: string;
  sideLabel: Record<AnatomicalSide, string>;
}

const DE_TEXT: UITextBundle = {
  appName: 'Anatomy Lens',
  bones: 'Knochen',
  muscles: 'Muskeln',
  freeze: 'Freeze',
  live: 'Live',
  autoView: 'Auto',
  frontView: 'Vorne',
  backView: 'Hinten',
  flipCamera: 'Kamera wechseln',
  devAndSettings: 'Input & Modell',
  enableCameraTitle: 'Kamera für Anatomy Lens aktivieren',
  enableCameraBody:
    'Richte die Kamera auf eine Person, um Muskeln oder Knochen im Röntgen-Fokuskreis direkt auf dem Körper zu erkunden.',
  enableCameraPrivacy:
    '100 % lokal auf dem Gerät: Keine Bilder, Videos oder Körperdaten verlassen dein Gerät.',
  enableCameraBtn: 'Kamera starten',
  useDevInputBtn: 'Testbild / Dev-Modus',
  cameraDeniedTitle: 'Kamerazugriff verweigert',
  cameraDeniedBody:
    'Bitte erlaube den Kamerazugriff in den Browser-Einstellungen oder nutze den Testbild-/Dev-Modus.',
  cameraMissingTitle: 'Keine Kamera gefunden',
  cameraMissingBody:
    'Auf diesem Gerät wurde keine Kamera erkannt. Du kannst ein Foto oder Video im Dev-Modus laden.',
  retryCameraBtn: 'Erneut versuchen',
  noPersonHint:
    'Keine Person erkannt — bitte etwas zurücktreten oder Beleuchtung verbessern.',
  focusHintEmpty: 'Fokuskreis auf den Körper bewegen',
  pinnedBadge: 'Fixiert',
  tapToPinHint: 'Tippen zum Fixieren · Doppelklick Reset',
  unpinLabel: 'Fixierung lösen',
  closeLabel: 'Schließen',
  inputSourceLabel: 'Eingabequelle',
  liveCameraLabel: 'Live-Kamera',
  uploadMediaLabel: 'Foto / Video laden',
  poseModelLabel: 'Pose-Modell',
  modelFullLabel: 'Full (Präzise)',
  modelLiteLabel: 'Lite (Schnell)',
  fpsLabel: 'FPS',
  lensHandleAria:
    'Fokuskreis-Griff. Mit Pfeiltasten verschieben, Plus/Minus zum Skalieren, Eingabetaste zum Zurücksetzen.',
  lensMoveAria: 'Fokuskreis bewegt',
  lensResetHint: 'Fokuskreis zurückgesetzt',
  sideLabel: {
    left: 'Links',
    right: 'Rechts',
    midline: ''
  }
};

const EN_TEXT: UITextBundle = {
  appName: 'Anatomy Lens',
  bones: 'Bones',
  muscles: 'Muscles',
  freeze: 'Freeze',
  live: 'Live',
  autoView: 'Auto',
  frontView: 'Front',
  backView: 'Back',
  flipCamera: 'Switch camera',
  devAndSettings: 'Input & Model',
  enableCameraTitle: 'Enable Camera for Anatomy Lens',
  enableCameraBody:
    'Point your camera at a person to inspect muscles or bones inside the X-ray focus circle aligned to their body.',
  enableCameraPrivacy:
    '100% on-device processing: no video frames, images, or landmarks ever leave your device.',
  enableCameraBtn: 'Enable Camera',
  useDevInputBtn: 'Demo / Dev Input Mode',
  cameraDeniedTitle: 'Camera Permission Denied',
  cameraDeniedBody:
    'Allow camera access in your browser settings to use the live lens, or continue with Demo / Dev Input Mode.',
  cameraMissingTitle: 'No Camera Detected',
  cameraMissingBody:
    'No usable camera was found on this device. You can inspect a built-in pose or upload an image/video.',
  retryCameraBtn: 'Try Camera Again',
  noPersonHint:
    'No person detected — step back slightly or improve lighting.',
  focusHintEmpty: 'Move focus circle over the body',
  pinnedBadge: 'Pinned',
  tapToPinHint: 'Tap structure to pin · Double-tap resets',
  unpinLabel: 'Unpin structure',
  closeLabel: 'Close',
  inputSourceLabel: 'Input Source',
  liveCameraLabel: 'Live Camera',
  uploadMediaLabel: 'Upload Photo / Video',
  poseModelLabel: 'Pose Model',
  modelFullLabel: 'Full (Accurate)',
  modelLiteLabel: 'Lite (Fast)',
  fpsLabel: 'FPS',
  lensHandleAria:
    'Focus lens handle. Use arrow keys to move, plus or minus to resize, Enter to reset.',
  lensMoveAria: 'Focus lens moved',
  lensResetHint: 'Focus lens reset',
  sideLabel: {
    left: 'Left',
    right: 'Right',
    midline: ''
  }
};

export function getUIText(lang: UILanguage): UITextBundle {
  return lang === 'de' ? DE_TEXT : EN_TEXT;
}

export function getSideLabel(
  side: AnatomicalSide,
  nameLang: NameLanguage,
  uiLang: UILanguage
): string {
  if (side === 'midline') return '';
  if (nameLang === 'la') {
    return side === 'left' ? 'Sinister' : 'Dexter';
  }
  if (nameLang === 'de') {
    return side === 'left' ? 'Links' : 'Rechts';
  }
  return uiLang === 'de'
    ? side === 'left'
      ? 'Links'
      : 'Rechts'
    : side === 'left'
      ? 'Left'
      : 'Right';
}

export function getViewButtonLabel(
  override: ViewModeOverride,
  detected: DetectedOrientation,
  t: UITextBundle
): string {
  if (override === 'front') return t.frontView;
  if (override === 'back') return t.backView;
  return `${t.autoView}: ${detected === 'front' ? t.frontView : t.backView}`;
}
