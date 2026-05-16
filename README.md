# Term Tracker — Frontend

구독·금융 서비스의 **약관(이용약관·요금)을 추적하고 변경 사항을 알려주는** 웹 앱입니다.
React + Vite 기반이며, `service_openapi.json` 스펙에 맞춰 백엔드 API와 연동합니다.

## 주요 기능

- **대시보드** — 등록한 서비스 목록과 약관 버전 현황 확인
- **검색** — 약관 조항에 대한 자연어 질의 검색
- **캘린더** — 결제일·약관 변경 일정 한눈에 보기

## 실행

```bash
npm install
cp .env.example .env   # 필요 시 값 수정
npm run dev
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |

## 환경 변수

| 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 백엔드 API 주소 | Railway 프로덕션 주소 |
| `VITE_USER_ID` | 요청에 사용할 사용자 UUID | `00000000-...-0001` |

`VITE_API_BASE_URL`이 비어 있거나 기본 Railway 주소이면 `/api` 프록시 경로를 사용합니다
(CORS 회피용, `vercel.json` rewrite 참고). 별도 백엔드를 쓰려면 해당 주소를 직접 지정하세요.

## API 연동 범위

| 기능 | 엔드포인트 |
| --- | --- |
| 서비스(약관) 목록 조회 | `GET /terms` |
| 서비스 상세·버전·조항 조회 | `GET /terms/{term_id}` |
| 서비스 등록 | `POST /terms/upload` |
| 약관 버전 업데이트 | `POST /terms/{term_id}/update` |
| 약관 질의 검색 | `POST /terms/{term_id}/search` |
| 알림 조회 | `GET /notifications` |
| 캘린더 조회 | `GET /calendar` |
| 헬스체크 | `GET /health` |

## 프로젝트 구조

```
src/
├─ components/
│  ├─ dashboard/   대시보드 화면
│  ├─ search/      검색 화면
│  ├─ calendar/    캘린더 화면
│  ├─ layout/      TopBar · Sidebar
│  └─ common/      공용 모달
├─ lib/            API 클라이언트 · 도메인 유틸
├─ logos/          서비스 로고 (자동 매핑)
├─ AppContext.jsx  전역 상태
└─ config.js       API 주소 · 환경 설정
```

## 배포

`vercel.json`에 SPA rewrite와 `/api` 프록시가 설정되어 있어 Vercel에 그대로 배포할 수 있습니다.

## 보류된 기능

현재 OpenAPI 스펙에 엔드포인트가 없어 미구현 상태입니다.

- 카테고리 CRUD (서비스 분류 관리 API 없음)
- 대화 기록 서버 저장·조회 (채팅 세션 API 없음)
- 조항 내 정확한 위치 하이라이트 (offset/span 미반환 — 현재는 텍스트 포함 단위)
- 평문 번역 생성 (현재는 `plain_text` 필드가 있을 때만 매핑)
