# Kusi 아트머그 GitHub Pages

## 파일 구조

- `index.html`: GitHub Pages에서 직접 확인하는 완성 페이지
- `kusi-style.css`: 페이지 디자인과 반응형 스타일
- `kusi-runtime.js`: 견적 계산, 신청서 복사, FAQ 등 사용자 기능
- `artmug-loader.js`: GitHub의 페이지를 아트머그 상세 설명 안에 불러오는 로더
- `ARTMUG-PASTE.html`: 아트머그 HTML 모드에 붙여 넣는 짧은 코드
- `.nojekyll`: GitHub Pages가 파일을 그대로 배포하도록 하는 설정

## GitHub Pages 배포

1. 이 폴더 안의 파일을 `dPfl123/kushi-commission-page` 저장소 최상위에 업로드합니다.
2. GitHub 저장소의 `Settings` → `Pages`로 이동합니다.
3. Source를 `Deploy from a branch`로 선택합니다.
4. Branch는 `main`, 폴더는 `/(root)`로 선택하고 저장합니다.
5. 배포 주소 `https://dpfl123.github.io/kushi-commission-page/`에서 페이지를 확인합니다.

## 아트머그 연결

GitHub Pages 배포가 완료된 뒤 `ARTMUG-PASTE.html`의 두 줄을 아트머그 상세 설명 편집기의 HTML 모드에 붙여 넣습니다.

```html
<div id="kusiCommissionMount" style="display:block;width:100%;margin:0;padding:0"></div>
<script src="https://dpfl123.github.io/kushi-commission-page/artmug-loader.js?v=20260828-4"></script>
```

실제 화면은 GitHub에서 관리되므로 이후에는 저장소 파일만 업데이트하면 됩니다. 아트머그 코드는 버전 번호를 변경할 때만 다시 교체하면 됩니다.

## 공개용 구성

- 사진 넣기·사진 추가·파일 업로드 기능 없음
- 작가 정보 편집 입력란 없음
- 신청서 견적 계산과 복사 기능만 유지
- 외부 서버로 신청 내용을 전송하거나 저장하지 않음
