import type { RefObject } from 'preact';
import type { NameLanguage, UILanguage } from '../data/anatomyData';
import { getSideLabel, getUIText } from '../i18n/uiText';
import type { FocusSelectionResult } from '../render/focusSelector';

interface SpeechCloudProps {
  selection: FocusSelectionResult;
  nameLang: NameLanguage;
  uiLang: UILanguage;
  dockPosition: 'top' | 'bottom';
  hasPerson: boolean;
  onSelectOverlap: (instanceId: string) => void;
  onClearPin: () => void;
  cloudRef: RefObject<HTMLElement>;
}

const ALL_LANGS: readonly NameLanguage[] = ['de', 'en', 'la'];

export function SpeechCloud({
  selection,
  nameLang,
  uiLang,
  dockPosition,
  hasPerson,
  onSelectOverlap,
  onClearPin,
  cloudRef
}: SpeechCloudProps) {
  const t = getUIText(uiLang);
  const active = selection.active;

  if (!hasPerson) {
    return null;
  }

  if (!active) {
    return (
      <aside
        ref={cloudRef}
        class={`speech-cloud speech-cloud--${dockPosition} speech-cloud--empty`}
        aria-live="polite"
      >
        <p class="speech-cloud__empty-text">{t.focusHintEmpty}</p>
      </aside>
    );
  }

  const { structure, side } = active;
  const primaryName = structure.names[nameLang];
  const sideLabel = getSideLabel(side, nameLang, uiLang);
  const secondaryLangs = ALL_LANGS.filter((l) => l !== nameLang);
  const description = structure.descriptions[uiLang];

  return (
    <aside
      ref={cloudRef}
      class={`speech-cloud speech-cloud--${dockPosition}`}
      data-testid="speech-cloud"
      data-structure-id={structure.id}
      data-structure-type={structure.type}
      aria-live="polite"
    >
      <div class="speech-cloud__header">
        <div class="speech-cloud__title-group">
          <h1 class="speech-cloud__title" lang={nameLang}>
            {primaryName}
          </h1>
          <div class="speech-cloud__badges">
            {sideLabel && (
              <span class="badge badge--side" data-testid="side-badge">
                {sideLabel}
              </span>
            )}
            <span class={`badge badge--${structure.type}`}>
              {structure.type === 'bone' ? t.bones : t.muscles}
            </span>
            {selection.isPinned && (
              <button
                type="button"
                class="badge badge--pinned"
                onClick={onClearPin}
                aria-label={t.unpinLabel}
              >
                {t.pinnedBadge} ×
              </button>
            )}
          </div>
        </div>
      </div>

      <div class="speech-cloud__subnames">
        {secondaryLangs.map((lang) => (
          <span key={lang} class="subname" lang={lang}>
            <span class="subname__tag">{lang.toUpperCase()}</span>
            {structure.names[lang]}
          </span>
        ))}
      </div>

      <p class="speech-cloud__desc" lang={uiLang}>
        {description}
      </p>

      {selection.overlapping.length > 0 && (
        <div class="speech-cloud__chips" role="group" aria-label="Overlapping structures">
          {selection.overlapping.map((item) => {
            const isCurrent = item.instanceId === active.instanceId;
            const chipSide =
              item.side === 'left' ? ' (L)' : item.side === 'right' ? ' (R)' : '';
            return (
              <button
                key={item.instanceId}
                type="button"
                class={`chip ${isCurrent ? 'chip--active' : ''}`}
                aria-pressed={isCurrent}
                onClick={() => onSelectOverlap(item.instanceId)}
              >
                {item.structure.names[nameLang]}
                {chipSide}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
