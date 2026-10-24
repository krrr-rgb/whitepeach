/* 사이드바 광원 효과 상세 설정: feralui.dev/gradients의 작업 패널을 참고했습니다.
 * 매개변수 행은 '84px 라벨 + 사용자 정의 슬라이더 + 오른쪽 동일 폭 수치'로 구성됩니다.
 * 색상 행을 누르면 바로 아래에 색상표가 펼쳐집니다.
 * 참고 자료: docs/reference-snapshots/feralui-studio-boardui-accent-measured.md
 *
 * 사전 설정 색상 타일은 이 화면과 사이드바 하단의 색상 카드에서 같은 항목과 저장값을 공유합니다.
 * 두 곳 모두 앱 셸의 store를 사용하므로 한쪽에서 선택하면 다른 쪽에도 즉시 반영됩니다.
 * 현재 사전 설정 이름, 색상 타일, 다섯 가지 매개변수는 모두 '색상' 그룹에 속합니다.
 *
 * '기본 유리 색상' 사전 설정에는 세 개의 광원 효과가 없습니다. 해당 효과의 강도는 0으로 처리되며,
 * 유리 자체에 있는 두 개의 반사광만 표시됩니다. 따라서 강도, 입자감, 부드러움, 크기, 세 가지 색상은
 * 적용되지 않습니다. 이 사전 설정에서는 해당 항목을 숨기고 색상이 밝음/어두움 테마를 따른다고 안내합니다.
 * 이동 속도는 유리 자체의 반사광에도 적용되므로 계속 표시합니다. '기본값 복원'도 모든 사전 설정에서
 * 사용할 수 있어야 하므로 항상 표시합니다.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { closeAnchoredMenu, wireAnchoredMenu } from '@peach/legacy/ui';
import {
  GLOW_SPOT_LABELS, GLOW_SWATCH_FAMILIES, GLOW_SWATCHES, HOME_GLOW_SPOTS, glowColor, glowPresetName, isNativeGlass,
  normalizeHomeGlow, type HomeGlow,
} from '@peach/appearance';

import { GlowPresetGrid } from '../components/glow-preset-grid';
import type { SettingsPanelHost } from './settings-panel-api';
import { Icon } from './icon';
import { DialRow } from './legacy-controls';

type Field = 'strength' | 'noise' | 'speed' | 'soften' | 'size';
type Spot = 'spot1' | 'spot2' | 'spot3';

const FIELDS: readonly [Field, string, number][] = [
  ['strength', '강도', 100], ['noise', '입자감', 60], ['speed', '이동 속도', 300], ['soften', '부드러움', 100], ['size', '크기', 100],
];


function StopRow({ host, spot, index, glow }: { host: SettingsPanelHost; spot: Spot; index: number; glow: HomeGlow }) {
  const label = GLOW_SPOT_LABELS[index];
  const row = useRef<HTMLDivElement | null>(null);
  const toggle = useRef<HTMLButtonElement | null>(null);
  const pop = useRef<HTMLDivElement | null>(null);
  const [family, setFamily] = useState('all');
  /* 팝업을 해당 행의 좌우 폭에 맞춥니다. 행보다 좁으면 어느 행에서 열린 색상표인지 알아보기 어렵습니다.
     이 처리는 wireAnchoredMenu보다 먼저 실행되어야 합니다. wireAnchoredMenu가 현재 폭을 기준으로 왼쪽 위치를 계산합니다. */
  useLayoutEffect(() => {
    const [mount, button, menu] = [row.current, toggle.current, pop.current];
    if (!mount || !button || !menu) return;
    button.addEventListener('click', () => { menu.style.width = `${mount.getBoundingClientRect().width}px` });
    wireAnchoredMenu(mount, button, menu);
  }, []);
  const color = glow[spot].color;
  const pick = (hex: string) => {
    const current = host.store.value.homeGlow;
    current[spot].color = glowColor(hex, current[spot].color);
    current.preset = 'custom';
    host.store.save();
    host.changed('glow');
    closeAnchoredMenu();
    toggle.current?.focus();
  };
  return (
    <div data-glow-stop={spot} ref={row}>
      <button type="button" data-glow-stop-toggle="" aria-haspopup="dialog" aria-expanded="false" ref={toggle}>
        <span aria-hidden="true" data-glow-stop-dot="" style={{ '--glow-swatch': color } as CSSProperties} />
        <span data-glow-stop-text=""><b>{label}</b><small className="mono" data-glow-stop-hex="">{color}</small></span>
        <Icon name="chevron-down" />
      </button>
      <div className="popmenu" data-glow-stop-pop="" popover="manual" hidden ref={pop}>
        <div data-glow-pills="" role="group" aria-label="색상 계열">
          {GLOW_SWATCH_FAMILIES.map(([key, name]) => (
            <button type="button" key={key} data-glow-pill={key} aria-pressed={key === family}
              onClick={() => setFamily(key)}>{name}</button>
          ))}
        </div>
        <div data-glow-palette="" role="radiogroup" aria-label={`${label} 색상`}>
          {GLOW_SWATCHES.map(([swatchFamily, name, hex]) => (
            <button type="button" key={hex} role="radio" aria-checked={hex === color} data-glow-swatch={hex}
              data-glow-family={swatchFamily} style={{ '--glow-swatch': hex } as CSSProperties}
              title={name} aria-label={name} hidden={family !== 'all' && swatchFamily !== family}
              onClick={() => pick(hex)} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function GlowSettings({ host }: { host: SettingsPanelHost }) {
  const glow = host.store.value.homeGlow;
  const native = isNativeGlass(glow.preset);
  return (
    <section data-glow-setting="" id="homeGlowControls" aria-label="사이드바 광원 효과 설정" hidden={!glow.on}>
      <section data-glow-group=""><h4>색상</h4>
        <p data-glow-current="">현재 색상 <b data-glow-preset-name="">{glowPresetName(glow.preset)}</b></p>
        <GlowPresetGrid store={host.store} label="광원 효과 색상" />
        <p data-glow-native-note="" hidden={!native}>이 사전 설정은 유리 자체의 반사광을 사용하며, 색상은 밝음/어두움 테마를 따릅니다.</p>
        <div data-glow-fields="">
          {/* 드래그 중에는 매개변수만 변경하고 한 프레임만 다시 그립니다. 저장은 마우스를 놓을 때 수행합니다.
              다른 유리 표면에 영향을 주는 값은 이동 속도뿐이며, 관련 변수는 루트 요소에만 기록됩니다.
              따라서 드래그 중에는 사이드바 효과만 바뀌고, 마우스를 놓으면 전체 페이지에 반영됩니다. */}
          {FIELDS.map(([field, label, max]) => (
            <DialRow key={field} field={field} label={label} max={max} value={glow[field]} hidden={native && field !== 'speed'}
              onStep={(value) => { host.store.value.homeGlow[field] = value; host.changed('glowFrame') }}
              onSettle={() => { host.store.save(); if (field === 'speed') host.changed('glow') }} />
          ))}
        </div>
      </section>
      <section data-glow-group="" data-glow-colours="" hidden={native}><h4>색상</h4>
        <div data-glow-stops="">
          {HOME_GLOW_SPOTS.map((spot, index) => <StopRow key={spot} host={host} spot={spot as Spot} index={index} glow={glow} />)}
        </div>
      </section>
      <div data-glow-actions="">
        <button type="button" className="geist-button" data-glow-reset=""
          onClick={() => { host.store.value.homeGlow = normalizeHomeGlow(null); host.store.save(); host.changed('glow') }}>기본값 복원</button>
      </div>
    </section>
  );
}
