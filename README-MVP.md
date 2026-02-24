# Learning MVP – Run instructions

## Backend (FastAPI)

From repo root, backend lives under `JinyoungOh/fastapi/backend/`.

```bash
cd JinyoungOh/fastapi/backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs

On startup, tables are created if they don’t exist (`db.sqlite` in the backend directory).

**카카오 로그인 사용 시:** 백엔드 `.env`에 다음을 설정하세요.  
카카오 개발자 콘솔의 Redirect URI도 동일하게 등록해야 합니다.

- `KAKAO_REDIRECT_URI=http://localhost:3000/auth/kakao/callback`

## Frontend (Next.js 14)

From repo root, frontend lives under `JinyoungOh/next/frontend/`.

```bash
cd JinyoungOh/next/frontend
cp .env.local.example .env.local
# Edit .env.local if your API is not at http://localhost:8000
npm install
npm run dev
```

- App: http://localhost:3000

## Account ID (Kakao flow)

1. 홈에서 **카카오 로그인** 클릭 → 백엔드에서 OAuth URL을 받아 카카오 로그인 페이지로 이동.
2. 로그인 후 카카오가 `http://localhost:3000/auth/kakao/callback?code=...` 로 리다이렉트.
3. 프론트엔드 콜백 페이지가 백엔드에 code를 보내 토큰·user_info를 받고, `POST /account/sync`로 `account_id`를 받아 `localStorage`에 저장 후 홈으로 이동.

**테스트 계정:** 홈에서 **테스트 계정 사용** 버튼을 누르면 백엔드에 계정이 생성되고 `account_id`가 저장됩니다. (백엔드 서버가 포트 8000에서 실행 중이어야 함.)

## Folder tree (relevant parts)

```
JinyoungOh/fastapi/backend/
  app/
    main.py                 # FastAPI app, Kakao router, startup
    kakao_authentication/   # (unchanged)
    config/
  database.py
  models/
    base.py
    account.py
    event_log.py
    quiz_attempt.py
    __init__.py
  engagement/
    router.py
    service.py
    __init__.py
  quiz/
    router.py
    service.py
    __init__.py
  aggregation/
    router.py
    service.py
    __init__.py
  account/
    router.py
    __init__.py
  main.py                  # uvicorn entry
  requirements.txt
  db.sqlite                 # created on first run

JinyoungOh/next/frontend/
  app/
    layout.tsx
    page.tsx
    globals.css
    quiz/
      page.tsx
    analytics/
      page.tsx
  lib/
    api.ts
  .env.local.example
  next.config.js
  package.json
  tsconfig.json
```
