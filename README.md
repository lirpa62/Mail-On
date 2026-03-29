# Mail:ON 📬

부경대 컴퓨터·인공지능공학부 취업게시물을 메일로 구독하는 웹 서비스입니다.

🔗 **https://mail-on.vercel.app**

> 🚧 **개발 진행 중** — 핵심 기능은 동작하며 지속적으로 개선하고 있습니다.

<br>

## 서비스 소개

학과 게시판의 취업 관련 게시물을 직접 확인하러 들어가지 않아도  
**매일 오전 9시 ~ 오후 9시**에 새 게시물이 있으면 메일로 보내드립니다.

<div align="center">
  <img src="./screenshots/mail-on-main.png" alt="Mail:ON 메인 화면" width="800" />
</div>

- 이메일 인증을 통해 구독 신청
- 새로운 게시물이 없으면 메일이 발송되지 않음
- 구독 즉시 최신 게시물 1건을 메일로 전송

<br>

## 기능

| 기능                 | 설명                                                     |
| :------------------- | :------------------------------------------------------- |
| **이메일 인증**      | 인증번호 발송 → 5분 내 인증 → 구독 등록                  |
| **인증 보안**        | 인증번호 해시 저장(bcrypt), 5회 실패 시 30분 잠금        |
| **게시물 스크래핑**  | 학과 취업게시판 자동 크롤링                              |
| **스케줄 메일 발송** | 매일 9시 ~ 21시 사이 30분마다 자동 발송 (GitHub Actions) |
| **구독 환영 메일**   | 구독 완료 시 최신 게시물과 함께 환영 메일 발송           |

<br>

## Tech Stack

### Frontend

![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-000000?style=flat&logo=shadcnui&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat&logo=framer&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-0F9DCE?style=flat&logo=minutemailer&logoColor=white)

### Infrastructure

![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Koyeb](https://img.shields.io/badge/Koyeb-121212?style=flat&logo=koyeb&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white)

<br>
 
## 아키텍처
 
```
┌──────────────────┐     HTTPS      ┌──────────────────┐
│                  │   ──────────>  │                  │
│  Frontend        │                │  Backend         │
│  (React + TS)    │   <──────────  │  (Express + TS)  │
│                  │   REST API     │                  │
│  Vercel          │                │  Koyeb           │
└──────────────────┘                └────────┬─────────┘
                                             │
         ┌───────────────────┐               │  Supabase Client
         │                   │               │
         │  GitHub Actions   │  POST /api/   │
         │  (cron trigger)   │──cron/process─┤
         │                   │               │
         └───────────────────┘      ┌────────▼─────────┐
                                    │                  │
                                    │  Supabase        │
                                    │  (PostgreSQL)    │
                                    │                  │
                                    └──────────────────┘
```
 
> **왜 GitHub Actions?**  
> Koyeb 무료 티어는 트래픽이 없으면 서버를 슬립 모드로 전환(Scale-to-Zero)합니다.  
> 내부 `node-cron` 스케줄러는 서버와 함께 멈추므로 크롤링 트리거를 외부(GitHub Actions)로 분리하여  
> 슬립 여부와 관계없이 스케줄이 정상 동작하도록 구성했습니다.
 
<br>
 
## 프로젝트 구조
 
```
Mail-On/
├── .github/
│   └── workflows/
│       └── crawl.yml           # GitHub Actions 크롤링 스케줄러
│
├── frontend/                   # React + TypeScript (Vite)
│   ├── src/
│   │   ├── components/         # UI 컴포넌트 (Header, VerifyForm, NoticeAlert 등)
│   │   ├── hooks/              # 커스텀 훅 (useVerification)
│   │   ├── types/              # TypeScript 타입 정의
│   │   └── main.jsx            # 엔트리 포인트
│   └── vite.config.js
│
├── backend/                    # Express + TypeScript
│   └── src/
│       ├── processors/         # 메일 발송, 게시물 처리
│       ├── repositories/       # Supabase DB 접근 계층
│       ├── scrapers/           # 게시판 크롤링
│       ├── supabase/           # Supabase 클라이언트 설정
│       ├── verifications/      # 인증번호 발송·검증 로직
│       ├── types/              # TypeScript 타입 정의
│       └── app.ts              # Express 서버 엔트리 포인트
│
└── tsconfig.base.json
```

<br>

## 로컬 실행 방법

### 사전 준비

- Node.js 18+
- Supabase 프로젝트 (테이블: `subscribers`, `email_verifications`, `board_state`)
- Gmail 앱 비밀번호

### Frontend

```bash
cd frontend
npm install
# .env 파일 생성
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev
```

### Backend

```bash
cd backend
npm install
# .env 파일 생성 (아래 항목 채워넣기)
cat > .env << EOF
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
EMAIL=your_gmail@gmail.com
PASSWORD=your_app_password
ALLOW_CORS_URL=http://localhost:5173
CRON_SECRET=your_cron_secret
EOF
npm run dev
```

<br>
 
## 배포 환경
 
| 구성 요소        | 플랫폼         | 비고                                              |
| :--------------- | :------------- | :------------------------------------------------ |
| Frontend         | Vercel         | `main` 브랜치 push 시 자동 배포                   |
| Backend          | Koyeb          | `main` 브랜치 push 시 자동 배포 (무료 티어)       |
| Database         | Supabase       | PostgreSQL 기반 클라우드 DB                        |
| Cron Scheduler   | GitHub Actions | 매일 9시~21시 30분마다 서버 크롤링 트리거             |
 
### GitHub Secrets 설정
 
GitHub Actions 워크플로우가 동작하려면 리포지토리의 **Settings → Secrets and variables → Actions**에 아래 두 값을 등록해야 합니다.
 
| Secret 이름    | 설명                                                        |
| :------------- | :---------------------------------------------------------- |
| `SERVER_URL`   | Koyeb 서버 주소 (예: `https://your-app.koyeb.app`)          |
| `CRON_SECRET`  | 크롤링 API 인증용 비밀 키 (Koyeb 환경변수와 동일한 값)      |
 
`CRON_SECRET` 생성:
 
 ```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 openssl

openssl rand -hex 32

````

<br>

## 트러블슈팅

<details>
<summary>트러블슈팅 펼치기</summary>

### 메일이 발송되지 않음 (DB에 새 게시글 번호가 갱신되지 않음)

**증상**: `board_state` 테이블의 `updated_at`이 오래전에 멈춰 있고 이후 게시글에 대한 메일이 발송되지 않음

**원인**: Koyeb 무료 티어의 Scale-to-Zero로 서버가 슬립 상태에 진입하면 내부 스케줄러(`node-cron`)도 함께 중단됨

**해결**: 크롤링 스케줄을 GitHub Actions 외부 트리거 방식으로 전환 → `POST /api/cron/process` 엔드포인트를 외부에서 호출

<br />

### GitHub Actions에서 404 응답

**원인**: 수정된 코드(`/api/cron/process` 엔드포인트 포함)가 Koyeb에 아직 배포되지 않았거나 `SERVER_URL` 끝에 `/`가 붙어 있음

**해결**:
- Koyeb 대시보드에서 최신 빌드가 정상 배포되었는지 확인
- `SERVER_URL`에 후행 슬래시가 없는지 확인 (예: `https://app.koyeb.app` ✅ / `https://app.koyeb.app/` ❌)

<br />

### GitHub Actions에서 401 응답

**원인**: `CRON_SECRET` 값이 Koyeb 환경변수와 GitHub Secrets 간에 일치하지 않음

**해결**:
- Koyeb 환경변수와 GitHub Secrets 양쪽의 `CRON_SECRET` 값이 정확히 동일한지 확인
- 값 복사 시 앞뒤 공백이나 줄바꿈이 포함되지 않았는지 확인
- Koyeb 환경변수 변경 후 재배포가 필요

<br />

### backend에서 `package-lock.json`이 생성되지 않음

**원인**: 루트 `package.json`의 `workspaces` 설정이 하위 디렉토리의 lock 파일 생성을 방지

**해결**:
```bash
mv package.json package.json.bak   # 루트 package.json 임시 이동
cd backend
npm install --package-lock-only     # lock 파일만 생성
cd ..
mv package.json.bak package.json   # 복원
````

<br />

### GitHub Actions에서 503 응답

**원인**: Koyeb 서버가 슬립 상태(Scale-to-Zero)에서 깨어나는 데 수십 초 이상 걸릴 수 있음 (cold start). 고정 대기 시간(예: 15초)으로는 부족한 경우가 있음

**해결**: 워크플로우의 웨이크업 단계에서 서버가 200을 반환할 때까지 최대 2분간 반복 확인(polling) 후 본 요청을 전송하도록 변경

</details>

## TODO

- [ ] 구독 해지 기능
- [ ] 구독자 관리 대시보드
- [ ] 다른 학과/게시판 확장
- [ ] 모바일 반응형 UI 개선
- [ ] 테스트 코드 작성

<br>

## AI-assisted Development

이 프로젝트는 AI 도구(Claude, ChatGPT, Gemini)를 활용한 AI-assisted 방식으로 개발했습니다.  
문제 정의, 기능 설계, 프롬프트 설계, 생성 코드 검증·통합, UX 조정, 테스트, 배포, 운영은 직접 담당합니다.
