# Release Notes

## v3.2.0

카드 번호를 직접 입력하는 기능이 추가되었습니다. 기존에는 카드 번호가 무작위로만 생성되었지만, 이제 실물 카드에 인쇄된 카드 번호(코나미 ID)를 직접 입력할 수 있습니다.

### ✨ 새로운 기능 (Features)

- **카드 번호 직접 입력**: 카드 추가/편집 화면에서 카드에 인쇄된 16자리 번호(코나미 ID)를 직접 입력할 수 있습니다. 입력한 번호는 내부 SID로 변환되어 미리보기와 저장에 반영됩니다.
  - 네이티브에 코나미 ID → SID 역변환(`convertKonamiID`)을 노출했습니다.
  - 입력값은 자동으로 대문자화·영숫자 필터링되며 16자로 제한됩니다.
  - "무작위 번호 생성" 버튼으로 기존처럼 무작위 카드도 계속 만들 수 있습니다.

### 🛠 개선 (Improvements)

- **카드 활성화 실패 안내**: 카드 활성화(HCE-F)에 실패하면 이제 실패 사유를 알림으로 표시합니다. 이전에는 조용히 실패해 아무 반응이 없었습니다.
- **에뮬레이션 불가 카드 사전 안내**: 카드 편집 시 입력한 번호가 활성화 불가능한 카드(NFCID2가 `02FE`로 시작하지 않는 카드)일 경우, 저장/활성화 전에 즉시 경고를 표시합니다.
  - 참고: Android의 HCE-F 제약으로, NFCID2가 `02FE`로 시작하는 카드만 에뮬레이션할 수 있습니다. 실물 물리 카드(예: `012E…`)는 OS 차원에서 에뮬레이션이 차단됩니다.

### 🐛 버그 수정 (Bug Fixes)

- **카드 번호 변환 오류 수정**: `02FE`로 시작하지 않는 유효한 카드 번호가 "카드 번호 로딩중"에서 멈추던 문제를 수정했습니다. 변환기가 실제로 지원하는 접두사(`E004`, `0`)를 모두 허용하도록 개선했습니다.
- 카드 번호 변환 실패 시 예외가 처리되지 않던 문제를 수정했습니다.

### 🎨 기타 (Misc)

- 테마에 `error`, `warning` 색상 토큰을 추가했습니다.
- 신규 문자열은 한국어/영어 모두 지원합니다.

---

## v3.2.0 (English)

Added the ability to enter a card number directly. Previously card numbers could only be generated randomly; now you can type the card number (KONAMI ID) printed on a physical card.

### ✨ Features

- **Manual card number input**: On the add/edit card screen you can now enter the 16-character number (KONAMI ID) printed on your card. It is converted to the internal SID and reflected in the preview and when saving.
  - Exposed native KONAMI ID → SID reverse conversion (`convertKonamiID`).
  - Input is auto-uppercased, filtered to alphanumerics, and capped at 16 characters.
  - The "Generate random number" button still creates random cards as before.

### 🛠 Improvements

- **Activation failure feedback**: When card activation (HCE-F) fails, the reason is now shown in an alert. Previously it failed silently.
- **Early non-emulatable warning**: When editing a card, if the entered number resolves to a card that cannot be activated (NFCID2 not starting with `02FE`), a warning is shown immediately before saving/activating.
  - Note: Due to Android's HCE-F restriction, only cards whose NFCID2 starts with `02FE` can be emulated. Physical cards (e.g. `012E…`) are blocked at the OS level.

### 🐛 Bug Fixes

- Fixed valid card numbers not starting with `02FE` getting stuck on "Loading card number". The converter now accepts all prefixes it actually supports (`E004`, `0`).
- Fixed unhandled exceptions during card number conversion.

### 🎨 Misc

- Added `error` and `warning` color tokens to the theme.
- New strings are localized in both Korean and English.
