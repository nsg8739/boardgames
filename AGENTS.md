# AGENTS.md — pingpong (클라이언트)

> 이 파일은 OpenAI Codex 등 코딩 에이전트를 위한 프로젝트 가이드입니다.
> 응답·주석·커밋 메시지는 **한국어**로 작성하세요.

## 프로젝트 개요

웹 보드게임 모음 (정적 사이트, **빌드 도구·프레임워크 없음**). 순수 HTML/CSS/JS 단일 파일들로 구성됩니다.

| 파일 | 설명 |
|------|------|
| `index.html` | 1인용 탁구 (AI 대전) |
| `versus.html` | 2인 온라인 탁구 대전 |
| `davinci.html` | **다빈치코드 2~4인 온라인** (엔진+렌더링+네트워크가 한 파일에 자체 완결) |
| `DA VINCI CODE_1.png` | 다빈치코드 게임 배경 이미지 |
| `ship.ps1` | 배포 스크립트 (git + netlify 일괄) |
| `README.md`, `HANDOVER.md`, `PRD.md` | 문서 |

## 아키텍처 (핵심)

- **정적 파일**입니다. 트랜스파일/번들 단계가 없습니다. `davinci.html`을 수정하면 그게 곧 배포물입니다.
- `davinci.html`은 IIFE 하나 안에 **게임 엔진(호스트만 실행) + 렌더링 + WebSocket 네트워킹 + CSS**가 모두 들어 있습니다.
- **호스트 권한 모델**: 방장(슬롯 0) 브라우저가 게임 상태 `G`를 계산·보관하고, 각 플레이어에게 개인화된 view를 전송합니다. 서버는 **메시지 중계만** 합니다(게임 로직 없음).
- 게스트의 액션은 호스트에게 전달되어(`{type:"act"}`) 호스트가 적용 후 브로드캐스트합니다.

### 서버 연동
- 중계 서버는 별도 저장소 **`pingpong-server`** (Render 배포). 이 클라이언트와 함께 봐야 합니다.
- 접속 주소 결정 로직(각 HTML 상단):
  - 기본: `wss://pingpong-server-hgl2.onrender.com`
  - `?server=` 쿼리로 오버라이드
  - `localhost`/`127.0.0.1`/`file:` 이면 자동으로 `ws://localhost:8080`
- 다빈치코드 3버전(`RULE_NOTES` 객체, `davinci.html`): **BASIC / PLUS / ZION**. 조커는 모든 버전 고정 2개.

## 로컬 실행

정적이라 파일을 브라우저로 바로 열어도 되지만, 상대 경로/WS 테스트를 위해 정적 서버 권장:

```bash
# 저장소 루트에서
npx serve .            # 또는  python -m http.server 8000
# 브라우저: http://localhost:8000/davinci.html
```

로컬에서 **온라인 기능(방 만들기/입장)** 을 테스트하려면 `pingpong-server`를 8080에 띄운 뒤:

```bash
# pingpong-server 저장소에서
PORT=8080 npm start
# 클라이언트: davinci.html?server=ws://localhost:8080  (file:// 로 열면 자동 8080)
```

## 테스트 (e2e)

- 설치된 Chrome을 **`puppeteer-core`** 로 제어해 2개 페이지로 대전을 시뮬레이션합니다. (별도 npm 프로젝트가 없으므로 `pingpong-server`의 node_modules에 있는 puppeteer-core를 재사용하거나 임시로 설치)
- **주의**: 헤드리스에서 두 페이지가 동시에 백그라운드면 `requestAnimationFrame`이 멈춰 게임이 정지합니다. CDP `Emulation.setFocusEmulationEnabled({enabled:true})` 를 **모든 페이지**에 적용해야 합니다.
- `davinci.html?debug=1` 이면 진단 훅 노출: `window.__dbg()`, `window.__view()`, `window.__act(a)`, `window.__truth()`(호스트만 정답 상태).

## 배포

- **canonical(현재 라이브)**: **GitHub Pages** — `main`에 push하면 자동 재빌드(1~3분). 
  - URL: `https://nsg8739.github.io/pingpong/davinci.html`
  - 빌드 상태: `gh api repos/nsg8739/pingpong/pages/builds/latest`
- Netlify(`pingpong26.netlify.app`)는 팀 크레딧 소진으로 프로덕션 배포가 **멈춰 있음**. `ship.ps1`은 git + `netlify deploy --prod` 를 함께 하지만 현재 Netlify 단계는 실패할 수 있음 → **git push(=GitHub Pages)** 가 실질 배포.
- 커밋만 하면 배포되지 않습니다. `main`에 **push** 해야 GitHub Pages가 반영합니다.

## 컨벤션 / 규칙

- **한국어**로 커밋 메시지·주석 작성. 주석은 '무엇'보다 '왜'.
- **시크릿 하드코딩 금지**: 토큰/비밀번호/DB 접속정보 등. `.gitignore`에 `.env`, `.env.local`, `config/secrets.json`, `.netlify` 등이 제외돼 있음.
- 요청 범위를 넘는 대규모 리팩터링은 먼저 확인.
- 커밋 메시지 마지막 줄:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  ```
  (Codex로 작업 시 해당 도구 표기로 바꿔도 됩니다.)

## 자주 만지는 곳

- 다빈치코드 UI/로비: `davinci.html`의 `<style>` 블록과 `#menu`(lobbyHome) 마크업.
- 게임 규칙/엔진: `davinci.html`의 `newGame()`, `applyAction()`, `doGuess*`, `RULE_NOTES`.
- 화면 전환: `setScreen()` (menu/lobby/playing/over + `#stage` 토글).
- 반응형 주의: flex 자식엔 `min-width:0`, body는 `width:100%`로 shrink-to-fit 가로 넘침을 차단(모바일 320px까지 가로 스크롤 0 유지).
