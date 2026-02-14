# VectorSurfer Plus

VectorWave SDK 전용 관측 대시보드입니다.
함수 실행 추적, 에러 분석, AI 진단(Healer), 리플레이 등의 기능을 제공합니다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4, Zustand, React Query |
| Backend | FastAPI, SQLAlchemy (async), PostgreSQL |
| Vector DB | Weaviate (Local / WCS Cloud) |
| SDK | VectorWave (`@vectorize` 데코레이터 기반 자동 관측) |

## 프로젝트 구조

```
VectorSurfer-Plus/
├── src/                    # Next.js 프론트엔드
│   ├── app/
│   │   ├── page.tsx        # 메인 대시보드 (개요, 차트, 토큰 사용량)
│   │   ├── functions/      # 등록된 함수 목록 + 상세 모달
│   │   ├── executions/     # 실행 기록 조회 + 필터
│   │   ├── errors/         # 에러 분석 + 시맨틱 검색
│   │   ├── traces/         # 트레이스 목록 + 상세 (Waterfall/Tree)
│   │   ├── healer/         # AI 진단 & 자동 수정 제안
│   │   ├── settings/       # DB 연결 관리 + 환경 설정
│   │   ├── projects/       # 프로젝트(연결) 선택
│   │   ├── login/          # 로그인
│   │   └── signup/         # 회원가입
│   ├── components/         # 공통 컴포넌트 (Sidebar, StatusBadge 등)
│   └── lib/
│       ├── hooks/          # React Query 기반 API 훅
│       ├── stores/         # Zustand 전역 상태 (인증, 대시보드)
│       ├── services/       # API 호출 함수
│       ├── i18n/           # 다국어 지원 (en, ko, ja)
│       └── types/          # TypeScript 타입 정의
│
├── backend/                # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST API 엔드포인트
│   │   ├── core/               # 설정, 보안, DB 연결, Weaviate 어댑터
│   │   ├── dashboard/          # 비즈니스 로직 (Service Layer)
│   │   └── models/             # SQLAlchemy 모델 (User, Connection)
│   ├── requirements.txt
│   └── run.py
│
└── vw_docker.yml           # Docker Compose (Weaviate + PostgreSQL)
```

## 시작하기

### 1. 사전 준비

- Node.js 18+
- Python 3.10+
- Docker (Weaviate + PostgreSQL)
- VectorWave SDK 설치 (`pip install vectorwave`)

### 2. Docker 실행

```bash
docker compose -f vw_docker.yml up -d
```

Weaviate (`localhost:8080`), Weaviate Console (`localhost:8081`), PostgreSQL (`localhost:5432`)이 실행됩니다.

### 3. 백엔드 설정

```bash
cd backend
pip install -r requirements.txt
```

`.env` 파일을 프로젝트 루트에 생성하세요:

```env
OPENAI_API_KEY=sk-...
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql+asyncpg://vectorsurfer:vectorsurfer_dev@localhost:5432/vectorsurfer
```

### 4. 프론트엔드 설정

```bash
npm install
```

### 5. 개발 서버 실행

```bash
npm run dev
```

프론트엔드(`localhost:3000`)와 백엔드(`localhost:8000`)가 동시에 실행됩니다.

### 6. 접속

1. `http://localhost:3000`에 접속
2. 회원가입 후 로그인
3. Settings 페이지에서 Weaviate 연결 추가 (Local 또는 WCS Cloud)
4. 프로젝트 선택 후 대시보드 사용

## 주요 기능

### BYOD (Bring Your Own Database)
사용자별로 별도의 Weaviate 인스턴스에 연결할 수 있습니다. Local Self-Hosted와 WCS Cloud 모두 지원합니다.

### 다국어 지원
한국어, 영어, 일본어 3개 언어를 지원합니다. 사이드바에서 언어를 변경할 수 있습니다.

### 페이지 간 연동
- 함수 상세 모달에서 "실행 보기" / "에러 보기" 클릭 시 해당 함수로 필터링된 페이지로 이동
- 트레이스 상세에서 함수명 클릭 시 해당 함수의 실행 목록으로 이동
- 에러 카드에서 트레이스 링크로 상세 분석 가능

## API 문서

백엔드 실행 후 `http://localhost:8000/docs`에서 Swagger UI를 통해 API를 확인할 수 있습니다.
