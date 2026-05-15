# T-T Frontend (React + Vite)

`service_openapi.json` 기준으로 프론트를 React 실무 구조로 재구성했습니다.

## 1. 실행

```bash
npm install
npm run dev
```

`.env.example`를 `.env`로 복사 후 값 설정:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USER_ID=00000000-0000-0000-0000-000000000001
```

## 2. 현재 API 연동 완료 범위

1. 서비스(약관) 목록 조회: `GET /terms`
2. 서비스 상세/버전/조항 조회: `GET /terms/{term_id}`
3. 서비스(초기 약관) 등록: `POST /terms/upload`
4. 약관 버전 업데이트: `POST /terms/{term_id}/update`
5. 약관 질의 검색: `POST /terms/{term_id}/search`
6. 알림 조회: `GET /notifications`
7. 캘린더 조회: `GET /calendar`
8. 헬스체크: `GET /health`

## 3. Vercel 배포

`vercel.json`에 SPA rewrite 설정이 포함되어 있어 바로 배포 가능합니다.

## 4. 현재 API 기준으로 보류된 기능

아래는 OpenAPI에 엔드포인트가 없어 구현을 보류한 항목입니다.

1. 카테고리 CRUD (서비스 분류 관리 API 없음)
2. 대화 기록 서버 저장/조회 (채팅 세션 API 없음)
3. 조항 내 정확한 위치 하이라이트 (offset/span 반환 API 없음, 현재는 텍스트 포함 단위 하이라이트)
4. 평문 번역 생성 API (현재는 `plain_text` 필드가 있는 경우만 정확 매핑)
