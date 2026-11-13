import type { UILanguage } from '../data/anatomyData';
import { getUIText } from '../i18n/uiText';

export type CameraPromptState =
  | 'needs_consent'
  | 'requesting'
  | 'denied'
  | 'missing'
  | 'ready'
  | 'dev_mode';

interface CameraPromptProps {
  state: CameraPromptState;
  uiLang: UILanguage;
  hasPerson: boolean;
  onEnableCamera: () => void;
  onStartDevMode: () => void;
  onToggleUiLang: () => void;
}

export function CameraPrompt({
  state,
  uiLang,
  hasPerson,
  onEnableCamera,
  onStartDevMode,
  onToggleUiLang
}: CameraPromptProps) {
  const t = getUIText(uiLang);

  if (state === 'ready' || state === 'dev_mode') {
    if (hasPerson) return null;
    return (
      <div class="no-person-hint" role="status" aria-live="polite" data-testid="no-person-hint">
        {t.noPersonHint}
      </div>
    );
  }

  const isDenied = state === 'denied';
  const isMissing = state === 'missing';

  const title = isDenied
    ? t.cameraDeniedTitle
    : isMissing
      ? t.cameraMissingTitle
      : t.enableCameraTitle;

  const body = isDenied
    ? t.cameraDeniedBody
    : isMissing
      ? t.cameraMissingBody
      : t.enableCameraBody;

  return (
    <div class="camera-prompt-backdrop" role="dialog" aria-modal="true" aria-labelledby="cam-prompt-title">
      <div class="camera-prompt-card">
        <div class="camera-prompt-card__top">
          <span class="camera-prompt-card__logo" aria-hidden="true">🩻</span>
          <button
            type="button"
            class="pill-option"
            onClick={onToggleUiLang}
            aria-label="Switch UI language"
          >
            {uiLang === 'de' ? 'DE / EN' : 'EN / DE'}
          </button>
        </div>

        <h1 id="cam-prompt-title" class="camera-prompt-card__title">
          {title}
        </h1>
        <p class="camera-prompt-card__body">{body}</p>
        <p class="camera-prompt-card__privacy">{t.enableCameraPrivacy}</p>

        <div class="camera-prompt-card__actions">
          {!isMissing && (
            <button
              type="button"
              class="btn-primary"
              onClick={onEnableCamera}
              disabled={state === 'requesting'}
              data-testid="enable-camera-btn"
            >
              {isDenied ? t.retryCameraBtn : t.enableCameraBtn}
            </button>
          )}
          <button
            type="button"
            class="btn-secondary"
            onClick={onStartDevMode}
            data-testid="start-dev-mode-btn"
          >
            {t.useDevInputBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
