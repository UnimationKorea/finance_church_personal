# 새순 교육부 통합 관리 시스템

## 프로젝트 개요
- **이름**: 새순 교육부 통합 관리 시스템
- **목표**: 부서별 회계 관리 및 사역 관리 통합 플랫폼
- **주요 기능**: 
  - 7개 부서별 개별 인증 시스템
  - 회계 관리 (수입/지출 기록, 예산 추적)
  - 사역 관리 (사역 계획, 기도제목 관리)
  - Google Sheets 연동을 통한 데이터 저장
  - Gemini AI를 통한 데이터 분석
  - CSV 내보내기/가져오기 기능

## 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Hono Framework (TypeScript)
- **Platform**: Cloudflare Pages + Workers
- **Database**: Google Sheets API
- **AI**: Gemini 1.5 Flash API
- **Deployment**: Cloudflare Pages

## 프로젝트 구조
```
saesoon-education/
├── src/
│   ├── index.tsx          # 메인 Hono 애플리케이션
│   └── renderer.tsx       # JSX 렌더러 및 프론트엔드
├── public/
│   └── static/
│       └── styles.css     # 추가 스타일시트
├── .dev.vars              # 개발환경 환경변수
├── ecosystem.config.cjs   # PM2 설정
├── wrangler.jsonc         # Cloudflare 설정
└── package.json           # 프로젝트 설정
```

## 환경 설정

### 필요한 환경 변수
```bash
# Google Spreadsheet ID
SPREADSHEET_ID=1Ou5hTTjkPVYMBw9C_2Pkr0yqmhH8Go3MpW6ZwXeZGdo

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key

# Google Service Account Key (JSON)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### Google Sheets 설정
1. Google Cloud Console에서 프로젝트 생성
2. Sheets API 활성화
3. 서비스 계정 생성 및 키 다운로드
4. Google Sheets를 서비스 계정과 공유

### 부서별 시트 구조
**회계 시트 (부서명)**:
- 날짜 | 유형 | 항목 | 적요 | 담당자 | 금액

**사역 시트 (부서명사역)**:
- 날짜 | 유형 | 항목 | 내용

## 개발 환경 실행

### 로컬 개발 서버
```bash
# 의존성 설치
npm install

# 빌드
npm run build

# PM2로 개발 서버 실행 
pm2 start ecosystem.config.cjs

# 서버 확인
curl http://localhost:3000
```

### 포트 정리
```bash
npm run clean-port
```

## 배포

### Cloudflare Pages 배포
```bash
# 환경 변수 설정 (프로덕션)
npx wrangler pages secret put SPREADSHEET_ID
npx wrangler pages secret put GEMINI_API_KEY
npx wrangler pages secret put GOOGLE_SERVICE_ACCOUNT_KEY

# 배포 실행
npm run deploy:prod
```

## API 엔드포인트

### 인증
- `POST /api/auth/department` - 부서 인증

### 회계 관리
- `POST /api/accounting/transaction/:department` - 거래 추가
- `GET /api/accounting/transactions/:department` - 거래 목록 조회
- `DELETE /api/accounting/transaction/:department/:rowIndex` - 거래 삭제
- `GET /api/accounting/export/:department` - CSV 내보내기

### 사역 관리  
- `POST /api/ministry/item/:department` - 사역 내용 추가
- `GET /api/ministry/items/:department` - 사역 목록 조회
- `DELETE /api/ministry/item/:department/:rowIndex` - 사역 항목 삭제
- `GET /api/ministry/export/:department` - CSV 내보내기

### AI 분석
- `POST /api/ai/analyze-transaction` - 거래 분석

## 부서별 접근
- **유아부**: 비밀번호 1234
- **유치부**: 비밀번호 2345
- **유년부**: 비밀번호 3456
- **초등부**: 비밀번호 4567
- **중등부**: 비밀번호 5678
- **고등부**: 비밀번호 6789
- **영어예배부**: 비밀번호 7890

## 현재 진행 상황

### ✅ 완료된 기능
1. Cloudflare Pages + Hono 프로젝트 구조 생성
2. 부서별 인증 시스템 구현
3. 기본 API 엔드포인트 설계
4. 메인 페이지 UI/UX 구현
5. 환경 변수 및 보안 설정

### 🔄 진행 중
1. Google Sheets API 연동 완성
2. 회계/사역 관리 전체 기능 구현

### ⏳ 예정된 작업
1. 전체 기능 테스트
2. 프로덕션 배포
3. 성능 최적화

## Google Apps Script에서 마이그레이션
기존 Google Apps Script 기반 시스템에서 Cloudflare Pages로 완전 마이그레이션:
- 서버리스 아키텍처로 성능 향상
- 글로벌 CDN을 통한 빠른 접근
- 더 나은 보안 및 확장성

## 문의사항
개발 관련 문의: developer@saesoon.kr

---
**마지막 업데이트**: 2025-01-15  
**배포 상태**: 🔄 개발 중  
**버전**: v1.0.0-migration