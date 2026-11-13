import { useRef, useState } from 'preact/hooks';
import type { NameLanguage, StructureType, UILanguage } from '../data/anatomyData';
import { getUIText, getViewButtonLabel } from '../i18n/uiText';
import { DEV_SAMPLES, type DevSampleId } from '../vision/devFixtures';
import type { PoseModelTier } from '../vision/poseEngine';
import type { DetectedOrientation, ViewModeOverride } from '../vision/types';

export type InputSourceMode = 'camera' | 'dev_sample' | 'uploaded_file';

interface ControlBarProps {
  layer: StructureType;
  onToggleLayer: () => void;
  isFrozen: boolean;
  onToggleFreeze: () => void;
  nameLang: NameLanguage;
  uiLang: UILanguage;
  onCycleLanguage: () => void;
  viewOverride: ViewModeOverride;
  detectedOrientation: DetectedOrientation;
  onCycleViewOverride: () => void;
  canFlipCamera: boolean;
  onFlipCamera: () => void;
  inputMode: InputSourceMode;
  activeDevSample: DevSampleId;
  onSelectCamera: () => void;
  onSelectDevSample: (id: DevSampleId) => void;
  onUploadFile: (file: File) => void;
  modelTier: PoseModelTier;
  onChangeModelTier: (tier: PoseModelTier) => void;
  fps: number;
}

export function ControlBar({
  layer,
  onToggleLayer,
  isFrozen,
  onToggleFreeze,
  nameLang,
  uiLang,
  onCycleLanguage,
  viewOverride,
  detectedOrientation,
  onCycleViewOverride,
  canFlipCamera,
  onFlipCamera,
  inputMode,
  activeDevSample,
  onSelectCamera,
  onSelectDevSample,
  onUploadFile,
  modelTier,
  onChangeModelTier,
  fps
}: ControlBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = getUIText(uiLang);

  return (
    <div class="hud-bottom">
      {menuOpen && (
        <div
          class="settings-popover"
          role="dialog"
          aria-label={t.devAndSettings}
          data-testid="settings-popover"
        >
          <div class="settings-popover__head">
            <span class="settings-popover__title">{t.devAndSettings}</span>
            <span class="fps-pill" data-testid="fps-badge">
              {fps > 0 ? `${Math.round(fps)} ${t.fpsLabel}` : `-- ${t.fpsLabel}`}
            </span>
            <button
              type="button"
              class="icon-close-btn"
              onClick={() => setMenuOpen(false)}
              aria-label={t.closeLabel}
            >
              ×
            </button>
          </div>

          <div class="settings-section">
            <div class="settings-section__label">{t.inputSourceLabel}</div>
            <div class="settings-grid">
              <button
                type="button"
                class={`pill-option ${inputMode === 'camera' ? 'pill-option--active' : ''}`}
                onClick={() => {
                  onSelectCamera();
                  setMenuOpen(false);
                }}
              >
                {t.liveCameraLabel}
              </button>
              {DEV_SAMPLES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  data-testid={`dev-sample-${sample.id}`}
                  class={`pill-option ${
                    inputMode === 'dev_sample' && activeDevSample === sample.id
                      ? 'pill-option--active'
                      : ''
                  }`}
                  onClick={() => {
                    onSelectDevSample(sample.id);
                    setMenuOpen(false);
                  }}
                >
                  {uiLang === 'de' ? sample.labelDe : sample.labelEn}
                </button>
              ))}
              <button
                type="button"
                class={`pill-option ${inputMode === 'uploaded_file' ? 'pill-option--active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {t.uploadMediaLabel}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              class="visually-hidden"
              data-testid="dev-file-input"
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) {
                  onUploadFile(file);
                  setMenuOpen(false);
                }
              }}
            />
          </div>

          <div class="settings-section">
            <div class="settings-section__label">{t.poseModelLabel}</div>
            <div class="settings-row">
              <button
                type="button"
                class={`pill-option ${modelTier === 'full' ? 'pill-option--active' : ''}`}
                onClick={() => onChangeModelTier('full')}
              >
                {t.modelFullLabel}
              </button>
              <button
                type="button"
                class={`pill-option ${modelTier === 'lite' ? 'pill-option--active' : ''}`}
                onClick={() => onChangeModelTier('lite')}
              >
                {t.modelLiteLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <nav class="control-bar" aria-label="Controls">
        <button
          type="button"
          class={`ctrl-btn ctrl-btn--layer ctrl-btn--${layer}`}
          onClick={onToggleLayer}
          aria-pressed={layer === 'muscle'}
          data-testid="toggle-layer-btn"
        >
          <span class="ctrl-btn__icon" aria-hidden="true">
            {layer === 'muscle' ? '💪' : '🦴'}
          </span>
          <span class="ctrl-btn__text">
            {layer === 'muscle' ? t.muscles : t.bones}
          </span>
        </button>

        <button
          type="button"
          class={`ctrl-btn ${isFrozen ? 'ctrl-btn--active' : ''}`}
          onClick={onToggleFreeze}
          aria-pressed={isFrozen}
          data-testid="toggle-freeze-btn"
        >
          <span class="ctrl-btn__icon" aria-hidden="true">
            {isFrozen ? '▶️' : '❄️'}
          </span>
          <span class="ctrl-btn__text">
            {isFrozen ? t.live : t.freeze}
          </span>
        </button>

        <button
          type="button"
          class="ctrl-btn"
          onClick={onCycleLanguage}
          data-testid="cycle-lang-btn"
          aria-label={`Language ${nameLang.toUpperCase()}`}
        >
          <span class="ctrl-btn__lang">{nameLang.toUpperCase()}</span>
        </button>

        <button
          type="button"
          class={`ctrl-btn ${viewOverride !== 'auto' ? 'ctrl-btn--active' : ''}`}
          onClick={onCycleViewOverride}
          data-testid="cycle-view-btn"
        >
          <span class="ctrl-btn__text">
            {getViewButtonLabel(viewOverride, detectedOrientation, t)}
          </span>
        </button>

        {canFlipCamera && (
          <button
            type="button"
            class="ctrl-btn ctrl-btn--icon"
            onClick={onFlipCamera}
            aria-label={t.flipCamera}
            data-testid="flip-camera-btn"
          >
            <span aria-hidden="true">🔄</span>
          </button>
        )}

        <button
          type="button"
          class={`ctrl-btn ctrl-btn--icon ${menuOpen ? 'ctrl-btn--active' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label={t.devAndSettings}
          data-testid="settings-btn"
        >
          <span aria-hidden="true">⚙️</span>
        </button>
      </nav>
    </div>
  );
}
