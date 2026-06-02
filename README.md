# Neo Brave

Neo Brave는 애니, 게임, 특촬 리뷰에서 출발해 코스튬과 피규어 제작 공방으로 확장하기 위한 개인 웹페이지입니다.

## 파일 구성

- `index.html`: GitHub Pages에서 바로 열리는 메인 페이지
- `admin.html`: 사이트 문구, 리뷰, 연락처를 관리하는 화면
- `styles.css`: 전체 디자인과 반응형 스타일
- `data.js`: 사이트 기본 데이터
- `script.js`: 메인 화면의 리뷰 반응과 움직임 처리
- `admin.js`: 관리창 저장, 수정, 백업 처리
- `assets/neo-brave-hero.svg`: 메인 히어로 이미지

## 관리창 사용

- `admin.html`을 열면 첫 화면 문구, 리뷰 카드, 연락처를 수정할 수 있습니다.
- 리뷰에는 댓글란이 없고 좋아요/싫어요 반응만 표시됩니다.
- GitHub Pages는 서버가 없는 정적 호스팅이라 관리창 저장 내용은 현재 브라우저에 저장됩니다.
- `백업과 초기화` 영역에서 현재 데이터를 복사해 보관하거나, 나중에 기본 데이터로 반영할 수 있습니다.

## GitHub Pages로 공개하기

1. GitHub에서 새 저장소를 만듭니다. 예: `neo-brave`
2. 이 폴더의 파일을 저장소 최상단에 올립니다.
3. 저장소의 `Settings`로 이동합니다.
4. `Pages` 메뉴에서 `Deploy from a branch`를 선택합니다.
5. Branch는 `main`, 폴더는 `/root`로 선택한 뒤 저장합니다.
6. 잠시 뒤 `https://계정명.github.io/neo-brave/` 주소로 접속할 수 있습니다.

## 나중에 바꾸면 좋은 곳

- `index.html`의 연락처 링크: YouTube, Blog, SNS, 이메일 주소
- 리뷰 예시 문구: 실제 운영할 콘텐츠 이름으로 교체
- 공방 로드맵: 실제 제작 계획과 포트폴리오에 맞게 조정
