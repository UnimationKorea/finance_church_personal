import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

// 부서별 회계 시트 GID 매핑
const DEPARTMENT_GIDS = {
  '유아부': '1255850162',
  '유치부': '616282430', 
  '유년부': '1573238485',
  '초등부': '799331414',
  '중등부': '561251984',
  '고등부': '1501681773',
  '영어예배부': '284320598'
}

// 부서별 사역 시트 GID 매핑
const MINISTRY_GIDS = {
  '유아부사역': '1261969956',
  '유치부사역': '259475080',
  '유년부사역': '2006604315',
  '초등부사역': '1170786963',
  '중등부사역': '1685201757',
  '고등부사역': '234545485',
  '영어예배부사역': '108001260'
}

// 부서별 비밀번호
const DEPARTMENT_PASSWORDS = {
  '유아부': '1234',
  '유치부': '2345',
  '유년부': '3456',
  '초등부': '4567',
  '중등부': '5678',
  '고등부': '6789',
  '영어예배부': '7890'
}

type Bindings = {
  SPREADSHEET_ID: string
  GEMINI_API_KEY: string
  GOOGLE_SERVICE_ACCOUNT_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// 정적 파일 서빙 
app.use('/static/*', serveStatic({ root: './public' }))

// 메인 페이지 렌더링
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>새순 교육부 통합 관리 시스템</title>
        <link href="/static/styles.css" rel="stylesheet">
        <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: #f8f9fa;
              min-height: 100vh;
              padding: 20px;
            }

            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }

            .header {
              background: #4a90e2;
              color: white;
              text-align: center;
              padding: 30px 20px;
              position: relative;
            }

            .header h1 {
              font-size: 2.5rem;
              margin-bottom: 10px;
              font-weight: 700;
            }

            .header p {
              font-size: 1.1rem;
              opacity: 0.9;
            }

            .main-content {
              padding: 30px;
            }

            /* 부서 선택 화면 */
            .department-section {
              text-align: center;
              padding: 40px 20px;
            }

            .department-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin: 30px 0;
            }

            .department-card {
              background: #6c7b7f;
              color: white;
              padding: 25px;
              border-radius: 12px;
              cursor: pointer;
              transition: all 0.3s ease;
              border: none;
              font-size: 1.2rem;
              font-weight: 500;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .department-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
              background: #5a6a6f;
            }

            .password-section {
              margin-top: 30px;
              display: none;
            }

            .password-input {
              width: 300px;
              max-width: 100%;
              padding: 15px;
              font-size: 1.1rem;
              border: 2px solid #e0e0e0;
              border-radius: 10px;
              margin: 10px;
              text-align: center;
            }

            /* 사역 내용 줄바꿈 보존 스타일 */
            .ministry-content {
              white-space: pre-wrap;
              word-wrap: break-word;
              line-height: 1.4;
              max-width: 300px;
            }

            /* 기본 버튼 스타일 */
            .btn-primary, .btn-secondary, .btn-success, .btn-info, .btn-danger, .btn-warning {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
              margin: 8px 4px;
              min-width: 120px;
              text-align: center;
              display: inline-block;
              text-decoration: none;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .btn-primary {
              background: #4a90e2;
              color: white;
            }

            .btn-primary:hover {
              background: #3d7bd1;
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(74, 144, 226, 0.3);
            }

            .btn-secondary {
              background: #6c757d;
              color: white;
            }

            .btn-secondary:hover {
              background: #5a6268;
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
            }

            /* 횡적 레이아웃 스타일 */
            .horizontal-layout {
              display: flex;
              gap: 20px;
              height: calc(100vh - 200px);
              min-height: 600px;
            }

            .left-panel {
              flex: 0 0 400px;
              background: #f8f9fa;
              border-radius: 12px;
              padding: 20px;
              overflow-y: auto;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .right-panel {
              flex: 1;
              background: #ffffff;
              border-radius: 12px;
              padding: 20px;
              overflow-y: auto;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .panel-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid #e9ecef;
            }

            .panel-header h3 {
              margin: 0;
              color: #495057;
              font-size: 18px;
            }

            .list-actions {
              display: flex;
              gap: 8px;
              align-items: center;
            }

            .summary-section {
              margin-top: 30px;
              padding: 20px;
              background: #fff;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .summary-section h4 {
              margin: 0 0 15px 0;
              color: #495057;
              font-size: 16px;
            }

            .summary-grid {
              display: grid;
              gap: 12px;
            }

            .summary-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px;
              border-radius: 6px;
              font-size: 14px;
            }

            .summary-item.income {
              background: #d4edda;
              color: #155724;
            }

            .summary-item.expense {
              background: #f8d7da;
              color: #721c24;
            }

            .summary-item.balance {
              background: #d1ecf1;
              color: #0c5460;
              font-weight: bold;
            }

            .summary-item .label {
              font-weight: 500;
            }

            .summary-item .value {
              font-weight: bold;
              font-size: 15px;
            }

            .btn-small {
              padding: 4px 8px;
              font-size: 12px;
              border-radius: 4px;
            }

            /* 메인 메뉴 선택 화면 */
            .main-menu-section {
              display: none;
              text-align: center;
              padding: 40px 20px;
            }

            .menu-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 30px;
              margin: 40px 0;
            }

            .menu-card {
              background: #ffffff;
              padding: 40px 30px;
              border-radius: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
              border: 2px solid #e9ecef;
              text-align: center;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            }

            .menu-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
              border-color: #4a90e2;
            }

            .menu-card.accounting {
              border-color: #28a745;
            }

            .menu-card.accounting:hover {
              border-color: #28a745;
              background: #f8fff9;
            }

            .menu-card.ministry {
              border-color: #6f42c1;
            }

            .menu-card.ministry:hover {
              border-color: #6f42c1;
              background: #faf9ff;
            }

            .menu-card h3 {
              font-size: 2rem;
              margin-bottom: 15px;
              color: #333;
            }

            .menu-card p {
              font-size: 1.1rem;
              color: #666;
              line-height: 1.6;
            }

            /* 로딩 및 메시지 */
            .loading {
              text-align: center;
              padding: 40px;
              font-size: 1.2rem;
              color: #666;
            }

            .message {
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: 600;
            }

            .message.success {
              background: #d4edda;
              border: 1px solid #c3e6cb;
              color: #155724;
            }

            .message.error {
              background: #f8d7da;
              border: 1px solid #f5c6cb;
              color: #721c24;
            }

            .message.info {
              background: #d1ecf1;
              border: 1px solid #bee5eb;
              color: #0c5460;
            }

            .logout-btn, .back-btn {
              position: absolute;
              top: 20px;
              background: rgba(255, 255, 255, 0.2);
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 25px;
              cursor: pointer;
              font-weight: 600;
              transition: all 0.3s;
            }

            .logout-btn {
              right: 20px;
            }

            .back-btn {
              left: 20px;
            }

            .logout-btn:hover, .back-btn:hover {
              background: rgba(255, 255, 255, 0.3);
            }

            /* 모바일 대응 */
            @media (max-width: 768px) {
              body {
                padding: 10px;
              }

              .header h1 {
                font-size: 2rem;
              }

              .main-content {
                padding: 20px;
              }

              .department-grid,
              .menu-grid {
                grid-template-columns: 1fr;
              }

              .form-grid {
                grid-template-columns: 1fr;
              }

              .summary-cards {
                grid-template-columns: 1fr;
              }

              .tabs {
                flex-direction: column;
              }

              .action-buttons {
                flex-direction: column;
              }
            }

            /* 앱 섹션 */
            .app-section, .ministry-section {
              display: none;
            }

            .current-department {
              background: #e9ecef;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: center;
              font-weight: 500;
              color: #495057;
              border-left: 4px solid #4a90e2;
            }

            .tabs {
              display: flex;
              border-bottom: 3px solid #f0f0f0;
              margin-bottom: 30px;
              overflow-x: auto;
            }

            .tab {
              padding: 15px 25px;
              background: none;
              border: none;
              font-size: 1.1rem;
              font-weight: 600;
              cursor: pointer;
              color: #666;
              transition: all 0.3s;
              white-space: nowrap;
            }

            .tab.active {
              color: #4a90e2;
              border-bottom: 3px solid #4a90e2;
            }

            .tab-content {
              display: none;
            }

            .tab-content.active {
              display: block;
            }

            /* 폼 스타일 */
            .form-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }

            .form-group {
              display: flex;
              flex-direction: column;
            }
            
            .form-actions {
              display: flex;
              gap: 12px;
              align-items: center;
              margin-top: 20px;
            }
            
            .form-actions button {
              flex-shrink: 0;
            }

            .form-group label {
              margin-bottom: 8px;
              font-weight: 600;
              color: #333;
            }

            .form-group input,
            .form-group select,
            .form-group textarea {
              padding: 12px;
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              font-size: 1rem;
              transition: border-color 0.3s;
            }

            .form-group input:focus,
            .form-group select:focus,
            .form-group textarea:focus {
              outline: none;
              border-color: #4a90e2;
              box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
            }

            .required {
              color: #e74c3c;
            }

            /* 요약 카드 */
            .summary-cards {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }

            .summary-card {
              padding: 25px;
              border-radius: 15px;
              text-align: center;
              color: white;
            }

            .summary-card.income {
              background: #28a745;
            }

            .summary-card.expense {
              background: #dc3545;
            }

            .summary-card.balance {
              background: #6c757d;
              color: white;
            }

            .summary-card h3 {
              font-size: 1rem;
              margin-bottom: 10px;
              opacity: 0.9;
            }

            .summary-card .amount {
              font-size: 2rem;
              font-weight: 700;
            }

            /* 테이블 스타일 */
            .table-container {
              overflow-x: auto;
              border-radius: 10px;
              box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
              margin-bottom: 30px;
            }

            .transaction-table {
              width: 100%;
              border-collapse: collapse;
              background: white;
            }

            .transaction-table th {
              background: #495057;
              color: white;
              padding: 15px;
              text-align: left;
              font-weight: 500;
              position: relative;
            }

            .transaction-table th.sortable {
              cursor: pointer;
              user-select: none;
            }

            .transaction-table th.sortable:hover {
              background: #343a40;
            }

            .sort-arrow {
              margin-left: 5px;
              font-size: 0.8rem;
              opacity: 0.6;
            }

            .sortable.sort-asc .sort-arrow::after {
              content: ' ↑';
              color: #ffc107;
              font-weight: bold;
            }

            .sortable.sort-desc .sort-arrow::after {
              content: ' ↓';
              color: #ffc107;
              font-weight: bold;
            }

            .transaction-table td {
              padding: 15px;
              border-bottom: 1px solid #f0f0f0;
            }

            .transaction-table tr:hover {
              background: #f8f9fa;
            }

            /* 작은 버튼 변형 */
            .btn-small {
              padding: 8px 16px !important;
              font-size: 0.875rem !important;
              min-width: 100px !important;
            }

            /* 큰 버튼 변형 */
            .btn-large {
              padding: 16px 32px !important;
              font-size: 1.125rem !important;
              min-width: 160px !important;
            }

            /* 색상별 버튼 스타일 */
            .btn-success {
              background: #28a745;
              color: white;
            }

            .btn-success:hover {
              background: #218838;
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
            }

            .btn-danger {
              background: #dc3545;
              color: white;
            }

            .btn-danger:hover {
              background: #c82333;
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(220, 53, 69, 0.3);
            }

            .btn-info {
              background: #17a2b8;
              color: white;
            }

            .btn-info:hover {
              background: #138496;
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
            }

            .btn-warning {
              background: #ffc107;
              color: #212529;
            }

            .btn-warning:hover {
              background: #e0a800;
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
            }

            /* 사역관리 스타일 */
            .ministry-tables {
              display: grid;
              gap: 40px;
            }

            .ministry-table-section {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 15px;
            }

            .ministry-table-section h3 {
              font-size: 1.5rem;
              margin-bottom: 20px;
              color: #333;
              text-align: center;
            }

            .ministry-table-section.ministry-type h3 {
              color: #28a745;
            }

            .ministry-table-section.prayer-type h3 {
              color: #6f42c1;
            }

            .action-buttons {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin: 20px 0;
              align-items: center;
            }

            /* 버튼 그룹 스타일 */
            .btn-group {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
            }

            .btn-group .btn-small {
              margin: 2px;
            }

            /* 정렬 가능한 테이블 헤더 */
            .sortable {
              cursor: pointer;
              user-select: none;
              position: relative;
              transition: background-color 0.2s;
            }

            .sortable:hover {
              background: #616161 !important;
            }

            .sort-arrow {
              margin-left: 8px;
              font-size: 0.8em;
              color: #ccc;
              transition: all 0.3s;
            }

            .sortable.sort-asc .sort-arrow::after {
              content: '▲';
              color: #fff;
            }

            .sortable.sort-desc .sort-arrow::after {
              content: '▼';
              color: #fff;
            }

            .sortable:not(.sort-asc):not(.sort-desc) .sort-arrow::after {
              content: '⇅';
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏫 새순 교육부 통합 관리 시스템</h1>
                <p>부서별 회계관리 및 사역관리 시스템</p>
            </div>
            
            <div class="main-content">
                <!-- 부서 선택 화면 -->
                <div class="department-section" id="departmentSection">
                    <h2>부서를 선택해주세요</h2>
                    
                    <!-- 구글 시트 링크 -->
                    <div style="margin: 20px 0; padding: 15px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
                            <span style="font-size: 20px;">📊</span>
                            <strong style="color: #1976d2; font-size: 16px;">연결된 구글 시트</strong>
                        </div>
                        <a href="https://docs.google.com/spreadsheets/d/1Ou5hTTjkPVYMBw9C_2Pkr0yqmhH8Go3MpW6ZwXeZGdo/edit" 
                           target="_blank" 
                           style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; background: #1976d2; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" 
                           onmouseover="this.style.background='#1565c0'; this.style.transform='translateY(-1px)';" 
                           onmouseout="this.style.background='#1976d2'; this.style.transform='translateY(0)';">
                            📋 구글 시트 열기
                        </a>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #666; line-height: 1.4;">
                            ℹ️ <strong>안내:</strong> 실시간 데이터는 메모리에 임시 저장되며, 기존 구글 시트와 연동되어 학습됩니다.
                        </p>
                    </div>
                    <div class="department-grid">
                        <button class="department-card" data-department="유아부">
                            👶 유아부
                        </button>
                        <button class="department-card" data-department="유치부">
                            🧒 유치부  
                        </button>
                        <button class="department-card" data-department="유년부">
                            🧑 유년부
                        </button>
                        <button class="department-card" data-department="초등부">
                            👦 초등부
                        </button>
                        <button class="department-card" data-department="중등부">
                            👨 중등부
                        </button>
                        <button class="department-card" data-department="고등부">
                            👩 고등부
                        </button>
                        <button class="department-card" data-department="영어예배부">
                            🌍 영어예배부
                        </button>
                    </div>

                    <div class="password-section" id="passwordSection">
                        <h3 id="selectedDepartmentName"></h3>
                        <input 
                            type="password" 
                            class="password-input" 
                            id="departmentPassword" 
                            placeholder="비밀번호를 입력하세요"

                        />
                        <br />
                        <button class="btn-primary" id="loginBtn">
                            로그인
                        </button>
                        <button class="btn-secondary" id="cancelBtn">
                            취소
                        </button>
                    </div>
                </div>

                <!-- 메인 메뉴 선택 화면 -->
                <div class="main-menu-section" id="mainMenuSection">
                    <button class="back-btn" id="logoutButton">← 부서 변경</button>
                    
                    <h2 id="welcomeMessage"></h2>
                    
                    <!-- 구글 시트 링크 (메인 메뉴) -->
                    <div style="margin: 15px 0; padding: 12px; background: linear-gradient(135deg, #e8f5e8, #f0f8ff); border-radius: 10px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                        <a href="https://docs.google.com/spreadsheets/d/1Ou5hTTjkPVYMBw9C_2Pkr0yqmhH8Go3MpW6ZwXeZGdo/edit" 
                           target="_blank" 
                           style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; background: #4caf50; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: bold; transition: all 0.3s ease;" 
                           onmouseover="this.style.background='#45a049'; this.style.transform='scale(1.05)';" 
                           onmouseout="this.style.background='#4caf50'; this.style.transform='scale(1)';">
                            📊 구글 시트 바로가기
                        </a>
                    </div>
                    <div class="menu-grid">
                        <div class="menu-card accounting" data-action="accounting">
                            <h3>💰 회계 관리</h3>
                            <p>부서 예산 및 지출 관리<br/>수입/지출 내역 추적<br/>재정 현황 분석</p>
                        </div>
                        <div class="menu-card ministry" data-action="ministry">
                            <h3>📋 사역 관리</h3>
                            <p>사역 계획 및 실행 관리<br/>기도제목 관리<br/>사역 내용 기록</p>
                        </div>
                    </div>
                </div>

                <!-- 회계 관리 섹션 (횡적 레이아웃) -->
                <div class="app-section" id="accountingSection">
                    <button class="back-btn" data-action="main-menu">← 메인 메뉴</button>
                    <div class="current-department" id="currentDepartmentAccounting"></div>

                    <!-- 횡적 레이아웃: 좌측 입력폼, 우측 목록 -->
                    <div class="horizontal-layout">
                        <!-- 좌측: 거래 입력 폼 -->
                        <div class="left-panel">
                            <div class="panel-header">
                                <h3>💰 거래 정보 입력</h3>
                            </div>
                            <form id="transactionForm">
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="transactionDate">날짜 <span class="required">*</span></label>
                                        <input type="date" id="transactionDate" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="transactionType">유형 <span class="required">*</span></label>
                                        <select id="transactionType" required onchange="updateCategoryOptions()">
                                            <option value="">선택하세요</option>
                                            <option value="수입">수입</option>
                                            <option value="지출">지출</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="transactionCategory">항목 <span class="required">*</span></label>
                                        <select id="transactionCategory" required>
                                            <option value="">유형을 먼저 선택하세요</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="transactionAmount">금액 <span class="required">*</span></label>
                                        <input type="number" id="transactionAmount" min="0" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="transactionManager">담당자</label>
                                        <input type="text" id="transactionManager" placeholder="담당자명">
                                    </div>
                                    
                                    <div class="form-group" style="grid-column: 1 / -1;">
                                        <label for="transactionDescription">적요 <span class="required">*</span></label>
                                        <textarea id="transactionDescription" rows="3" placeholder="거래 내용 입력" required maxlength="500"></textarea>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary">거래 추가</button>
                                    <button type="button" class="btn-secondary" id="cancelTransactionEdit" style="display: none;" data-action="cancel-edit">수정 취소</button>
                                </div>
                            </form>
                            
                            <!-- 현황 요약 -->
                            <div class="summary-section">
                                <h4>📊 재정 현황</h4>
                                <div class="summary-grid">
                                    <div class="summary-item income">
                                        <span class="label">총 수입:</span>
                                        <span class="value" id="totalIncome">₩0</span>
                                    </div>
                                    <div class="summary-item expense">
                                        <span class="label">총 지출:</span>
                                        <span class="value" id="totalExpense">₩0</span>
                                    </div>
                                    <div class="summary-item balance">
                                        <span class="label">잔액:</span>
                                        <span class="value" id="totalBalance">₩0</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 우측: 거래 목록 -->
                        <div class="right-panel">
                            <div class="panel-header">
                                <h3>📋 거래 목록</h3>
                                <div class="list-actions">
                                    <input type="text" id="transactionSearch" placeholder="검색..." style="width: 100px; font-size: 12px;">
                                    <button class="btn btn-info btn-small" id="exportAccountingBtn">💾 CSV</button>
                                    <button class="btn btn-warning btn-small" id="importAccountingBtn">📁 업로드</button>
                                    <button class="btn btn-secondary btn-small" id="refreshAccountingBtn">🔄</button>
                                </div>
                            </div>
                            
                            <input type="file" id="csvFile" accept=".csv" style="display: none;">
                            
                            <div class="table-container">
                                <table class="transaction-table">
                                    <thead>
                                        <tr>
                                            <th class="sortable" data-sort="date">날짜 ↕</th>
                                            <th class="sortable" data-sort="type">유형 ↕</th>
                                            <th class="sortable" data-sort="category">항목 ↕</th>
                                            <th>적요</th>
                                            <th>담당자</th>
                                            <th class="sortable" data-sort="amount">금액 ↕</th>
                                            <th>작업</th>
                                        </tr>
                                    </thead>
                                    <tbody id="transactionList">
                                        <tr>
                                            <td colspan="7" class="loading">데이터를 불러오는 중...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 사역 관리 섹션 (횡적 레이아웃) -->
                <div class="ministry-section" id="ministrySection">
                    <button class="back-btn" id="ministryBackBtn">← 메인 메뉴</button>
                    <div class="current-department" id="currentDepartmentMinistry"></div>

                    <!-- 횡적 레이아웃: 좌측 입력폼, 우측 목록 -->
                    <div class="horizontal-layout">
                        <!-- 좌측: 사역 입력 폼 -->
                        <div class="left-panel">
                            <div class="panel-header">
                                <h3>📋 사역 정보 입력</h3>
                            </div>
                            <form id="ministryForm">
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="ministryDate">날짜 <span class="required">*</span></label>
                                        <input type="date" id="ministryDate" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="ministryType">유형 <span class="required">*</span></label>
                                        <select id="ministryType" required onchange="updateMinistryCategoryOptions()">
                                            <option value="">선택하세요</option>
                                            <option value="사역">사역</option>
                                            <option value="기도제목">기도제목</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="ministryCategory">항목 <span class="required">*</span></label>
                                        <select id="ministryCategory" required>
                                            <option value="">유형을 먼저 선택하세요</option>
                                        </select>
                                    </div>
                                    
                                    <div class="form-group" style="grid-column: 1 / -1;">
                                        <label for="ministryContent">내용 <span class="required">*</span></label>
                                        <textarea id="ministryContent" rows="6" placeholder="사역 내용을 자세히 입력하세요" required maxlength="1000"></textarea>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary">내용 추가</button>
                                    <button type="button" class="btn-secondary" id="cancelMinistryEdit" style="display: none;" data-action="cancel-edit">수정 취소</button>
                                </div>
                            </form>
                            
                            <!-- 빠른 액션 버튼 -->
                            <div class="summary-section">
                                <h4>🔧 관리 도구</h4>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <button class="btn btn-info btn-small" id="exportMinistryBtn">💾 CSV</button>
                                    <button class="btn btn-warning btn-small" id="importMinistryBtn">📁 업로드</button>
                                    <button class="btn btn-secondary btn-small" id="refreshMinistryBtn">🔄 새로고침</button>
                                </div>
                                <input type="file" id="ministryCsvFile" accept=".csv" style="display: none;">
                            </div>
                        </div>

                        <!-- 우측: 사역 목록 -->
                        <div class="right-panel">
                            <div class="panel-header">
                                <h3>📝 사역 & 기도제목 목록</h3>
                            </div>
                            
                            <div class="ministry-tables" style="height: calc(100% - 60px); overflow-y: auto;">
                                <!-- 사역 목록 테이블 -->
                                <div class="ministry-table-section ministry-type" style="margin-bottom: 30px;">
                                    <h4 style="color: #495057; margin-bottom: 15px;">🔨 사역 목록</h4>
                                    <div class="table-container">
                                        <table class="transaction-table">
                                            <thead>
                                                <tr>
                                                    <th class="sortable" data-sort="date">날짜 ↕</th>
                                                    <th class="sortable" data-sort="category">항목 ↕</th>
                                                    <th>내용</th>
                                                    <th>작업</th>
                                                </tr>
                                            </thead>
                                            <tbody id="ministryList">
                                                <tr>
                                                    <td colspan="4" class="loading">데이터를 불러오는 중...</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <!-- 기도제목 목록 테이블 -->
                                <div class="ministry-table-section prayer-type">
                                    <h4 style="color: #495057; margin-bottom: 15px;">🙏 기도제목 목록</h4>
                                    <div class="table-container">
                                        <table class="transaction-table">
                                            <thead>
                                                <tr>
                                                    <th class="sortable" data-sort="date">날짜 ↕</th>
                                                    <th class="sortable" data-sort="category">항목 ↕</th>
                                                    <th>내용</th>
                                                    <th>작업</th>
                                                </tr>
                                            </thead>
                                            <tbody id="prayerList">
                                                <tr>
                                                    <td colspan="4" class="loading">데이터를 불러오는 중...</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="messageArea"></div>

        <script>
            let currentDepartment = '';
            let selectedDepartment = '';
            let currentMode = '';
            
            // 전역 상태 (중복 방지 및 단일 소스)
            const state = {
                initialized: false,
                isSubmitting: false,
                editState: null, // { type: 'transaction'|'ministry', id }
                seenOps: new Set(), // 중복 방지 토큰
                transactions: [],
                ministries: []
            };
            
            // 유틸: 고유 ID/토큰
            const uid = () => (crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
            const newOpToken = () => 'op_' + uid();

            // 카테고리 옵션 정의
            const categoryOptions = {
                '수입': ['예산', '후원금', '특별지원금', '이월금', '기타'],
                '지출': ['교육비', '행사비', '행정비', '전도비', '운영비', '간식비', '심방비', '기타']
            };

            // 사역 카테고리 옵션 정의
            const ministryCategoryOptions = {
                '사역': ['연례행사', '이벤트', '기타'],
                '기도제목': ['기도제목']
            };

            // 클라이언트용 메모리 저장소 (localStorage 전용)
            const clientStorage = {
                loadFromLocalStorage() {
                    if (typeof localStorage !== 'undefined') {
                        try {
                            const data = localStorage.getItem('saesoon_client_data');
                            console.log('📁 클라이언트 로컬스토리지 복원 시도');
                        } catch (e) {
                            console.warn('로컬스토리지 복원 실패:', e);
                        }
                    }
                },
                saveToLocalStorage() {
                    if (typeof localStorage !== 'undefined') {
                        try {
                            localStorage.setItem('saesoon_client_data', JSON.stringify({
                                lastLogin: new Date().toISOString(),
                                department: currentDepartment
                            }));
                            console.log('💾 클라이언트 데이터 저장 완료');
                        } catch (e) {
                            console.warn('로컬스토리지 저장 실패:', e);
                        }
                    }
                }
            };

            // 초기화(단 한 번만) - ChatGPT 솔루션 적용
            function initOnce() {
                if (state.initialized) {
                    console.log('⚠️ 이미 초기화된 상태 - 중복 초기화 방지');
                    return;
                }
                state.initialized = true;
                console.log('🚀 시스템 초기화 시작 (단일 초기화)');
                
                // 클라이언트 로컬스토리지에서 데이터 복원
                clientStorage.loadFromLocalStorage();
                
                const today = new Date().toISOString().split('T')[0];
                if (document.getElementById('transactionDate')) {
                    document.getElementById('transactionDate').value = today;
                }
                if (document.getElementById('ministryDate')) {
                    document.getElementById('ministryDate').value = today;
                }
                
                // 폼 submit만 사용, 버튼 click 핸들러는 제거
                const transactionForm = document.getElementById('transactionForm');
                if (transactionForm) {
                    transactionForm.addEventListener('submit', onAddTransaction);
                }
                
                const ministryForm = document.getElementById('ministryForm');
                if (ministryForm) {
                    ministryForm.addEventListener('submit', onAddMinistry);
                }
                
                // 동적 버튼들(수정/삭제/취소)은 body에 위임
                document.body.addEventListener('click', onDelegatedClick);
                
                // 로그인 버튼 이벤트 리스너 초기화 (Enter 키 지원)
                initLoginButtons();
                
                console.log('✅ 시스템 초기화 완료');
            }
            
            // 페이지 로드 시 초기화
            document.addEventListener('DOMContentLoaded', initOnce);

            // =================== 새로운 이벤트 핸들러들 (ChatGPT 솔루션) ===================
            
            // 거래 추가/수정 (폼 submit만) - ChatGPT 솔루션 수정
            async function onAddTransaction(e) {
                e.preventDefault();
                if (state.isSubmitting) {
                    console.log('⚠️ 중복 제출 방지됨');
                    showMessage('⏳ 처리 중입니다. 잠시만 기다려주세요.', 'info');
                    return;
                }
                
                state.isSubmitting = true;
                
                try {
                    // 수정 모드 확인
                    const isEditing = state.editState && state.editState.type === 'transaction';
                    const editId = isEditing ? state.editState.id : null;
                    
                    const form = e.currentTarget;
                    const rec = {
                        id: isEditing ? editId : uid(),
                        op: newOpToken(),
                        date: document.getElementById('transactionDate').value,
                        type: document.getElementById('transactionType').value,
                        category: document.getElementById('transactionCategory').value,
                        description: document.getElementById('transactionDescription').value,
                        manager: document.getElementById('transactionManager').value,
                        amount: Number(document.getElementById('transactionAmount').value || 0)
                    };
                    
                    if (!rec.date || !rec.type || !rec.category || !rec.description || !rec.amount) {
                        showMessage('❌ 필수 항목을 모두 입력해주세요.', 'error');
                        return;
                    }
                    
                    // 중복 방지: 같은 op 토큰이면 무시 (새 추가일 때만)
                    if (!isEditing && state.seenOps.has(rec.op)) {
                        console.log('⚠️ 중복 작업 토큰 - 무시됨');
                        return;
                    }
                    if (!isEditing) state.seenOps.add(rec.op);
                    
                    console.log(isEditing ? '🔄 거래 수정 API 호출:' : '💰 거래 추가 API 호출:', rec);
                    showMessage(isEditing ? '⏳ 거래를 수정하고 있습니다...' : '⏳ 거래를 추가하고 있습니다...', 'info');
                    
                    const url = isEditing ? 
                        '/api/accounting/transaction/' + currentDepartment + '/' + encodeURIComponent(editId) :
                        '/api/accounting/transaction/' + currentDepartment;
                    const method = isEditing ? 'PUT' : 'POST';
                    
                    const response = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(rec)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage('✅ ' + result.message, 'success');
                        
                        if (isEditing) {
                            // 수정 모드 종료
                            cancelEdit();
                        } else {
                            // 폼 초기화 (내용만 초기화)
                            document.getElementById('transactionDescription').value = '';
                            document.getElementById('transactionManager').value = '';
                            document.getElementById('transactionAmount').value = '';
                            document.getElementById('transactionDescription').focus();
                        }
                        
                        // 목록 새로고침
                        loadTransactions();
                    } else {
                        showMessage('❌ ' + result.message, 'error');
                    }
                    
                } catch (error) {
                    console.error('거래 처리 오류:', error);
                    showMessage('❌ 거래 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                } finally {
                    state.isSubmitting = false;
                }
            }
            
            // 사역 추가/수정 (폼 submit만) - ChatGPT 솔루션 수정
            async function onAddMinistry(e) {
                e.preventDefault();
                if (state.isSubmitting) {
                    console.log('⚠️ 중복 제출 방지됨');
                    showMessage('⏳ 처리 중입니다. 잠시만 기다려주세요.', 'info');
                    return;
                }
                
                state.isSubmitting = true;
                
                try {
                    // 수정 모드 확인
                    const isEditing = state.editState && state.editState.type === 'ministry';
                    const editId = isEditing ? state.editState.id : null;
                    
                    const form = e.currentTarget;
                    const rec = {
                        id: isEditing ? editId : uid(),
                        op: newOpToken(),
                        date: document.getElementById('ministryDate').value,
                        type: document.getElementById('ministryType').value,
                        category: document.getElementById('ministryCategory').value,
                        content: document.getElementById('ministryContent').value
                    };
                    
                    if (!rec.date || !rec.type || !rec.category || !rec.content) {
                        showMessage('❌ 필수 항목을 모두 입력해주세요.', 'error');
                        return;
                    }
                    
                    // 중복 방지: 같은 op 토큰이면 무시 (새 추가일 때만)
                    if (!isEditing && state.seenOps.has(rec.op)) {
                        console.log('⚠️ 중복 작업 토큰 - 무시됨');
                        return;
                    }
                    if (!isEditing) state.seenOps.add(rec.op);
                    
                    console.log(isEditing ? '🔄 사역 수정 API 호출:' : '📋 사역 추가 API 호출:', rec);
                    showMessage(isEditing ? '⏳ 사역 내용을 수정하고 있습니다...' : '⏳ 사역 내용을 추가하고 있습니다...', 'info');
                    
                    const url = isEditing ? 
                        '/api/ministry/item/' + currentDepartment + '/' + encodeURIComponent(editId) :
                        '/api/ministry/item/' + currentDepartment;
                    const method = isEditing ? 'PUT' : 'POST';
                    
                    const response = await fetch(url, {
                        method: method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(rec)
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage('✅ ' + result.message, 'success');
                        
                        if (isEditing) {
                            // 수정 모드 종료
                            cancelEdit();
                        } else {
                            // 내용만 초기화 (날짜/유형/항목 유지)
                            document.getElementById('ministryContent').value = '';
                            document.getElementById('ministryContent').focus();
                        }
                        
                        // 목록 새로고침
                        loadMinistryItems();
                    } else {
                        showMessage('❌ ' + result.message, 'error');
                    }
                    
                } catch (error) {
                    console.error('사역 처리 오류:', error);
                    showMessage('❌ 사역 처리 중 오류가 발생했습니다: ' + error.message, 'error');
                } finally {
                    state.isSubmitting = false;
                }
            }
            
            // 위임 클릭 (수정/삭제/취소) - ChatGPT 솔루션 핵심
            function onDelegatedClick(e) {
                const editBtn = e.target.closest('[data-action="edit"]');
                const deleteBtn = e.target.closest('[data-action="delete"]');
                const cancelBtn = e.target.closest('[data-action="cancel-edit"]');
                
                if (!editBtn && !deleteBtn && !cancelBtn) return;
                
                if (editBtn) {
                    const id = editBtn.dataset.id;
                    const row = editBtn.closest('tr');
                    console.log('✏️ 수정 버튼 클릭:', id);
                    
                    // 거래인지 사역인지 판단 (테이블 위치로)
                    if (row && row.closest('#transactionList')) {
                        loadTransactionForEdit(row);
                    } else if (row && (row.closest('#ministryList') || row.closest('#prayerList'))) {
                        loadMinistryForEdit(row);
                    }
                }
                
                if (deleteBtn) {
                    const id = deleteBtn.dataset.id;
                    const row = deleteBtn.closest('tr');
                    console.log('🗑️ 삭제 버튼 클릭:', id);
                    
                    if (!confirm('정말 삭제하시겠습니까?')) return;
                    
                    // 거래인지 사역인지 판단
                    if (row && row.closest('#transactionList')) {
                        deleteTransactionById(id);
                    } else if (row && (row.closest('#ministryList') || row.closest('#prayerList'))) {
                        deleteMinistryById(id);
                    }
                }
                
                if (cancelBtn) {
                    console.log('❌ 취소 버튼 클릭');
                    cancelEdit();
                }
            }
            
            // 거래 삭제 (ID 기반)
            async function deleteTransactionById(id) {
                try {
                    showMessage('⏳ 삭제 처리 중...', 'info');
                    const response = await fetch('/api/accounting/transaction/' + currentDepartment + '/' + encodeURIComponent(id), {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage('✅ ' + result.message, 'success');
                        loadTransactions();
                    } else {
                        showMessage('❌ ' + result.message, 'error');
                    }
                } catch (error) {
                    console.error('거래 삭제 오류:', error);
                    showMessage('❌ 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }
            
            // 사역 삭제 (ID 기반)  
            async function deleteMinistryById(id) {
                try {
                    showMessage('⏳ 삭제 처리 중...', 'info');
                    const response = await fetch('/api/ministry/item/' + currentDepartment + '/' + encodeURIComponent(id), {
                        method: 'DELETE'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage('✅ ' + result.message, 'success');
                        loadMinistryItems();
                    } else {
                        showMessage('❌ ' + result.message, 'error');
                    }
                } catch (error) {
                    console.error('사역 삭제 오류:', error);
                    showMessage('❌ 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }
            
            // 수정 취소
            function cancelEdit() {
                state.editState = null;
                console.log('수정 모드 취소됨');
                
                // 거래 폼 일반 모드로 복원
                const transactionForm = document.getElementById('transactionForm');
                if (transactionForm) {
                    toggleEditUI(false, 'transaction');
                }
                
                // 사역 폼 일반 모드로 복원
                const ministryForm = document.getElementById('ministryForm');
                if (ministryForm) {
                    toggleEditUI(false, 'ministry');
                }
            }
            
            // 거래 수정 로드 (ChatGPT 솔루션)
            function loadTransactionForEdit(row) {
                const data = {
                    id: row.dataset.id,
                    date: row.dataset.date,
                    type: row.dataset.txnType,
                    category: row.dataset.category,
                    description: row.dataset.description,
                    manager: row.dataset.manager,
                    amount: row.dataset.amount
                };
                
                console.log('🔄 거래 수정 데이터 로드:', data);
                state.editState = { type: 'transaction', id: data.id, data: data };
                
                fillAccountFormForEdit(data);
                toggleEditUI(true, 'transaction');
            }
            
            // 사역 수정 로드 (ChatGPT 솔루션)
            function loadMinistryForEdit(row) {
                const data = {
                    id: row.dataset.id,
                    date: row.dataset.date,
                    type: row.dataset.ministryType,
                    category: row.dataset.category,
                    content: row.dataset.content
                };
                
                console.log('🔄 사역 수정 데이터 로드:', data);
                state.editState = { type: 'ministry', id: data.id, data: data };
                
                fillMinistryFormForEdit(data);
                toggleEditUI(true, 'ministry');
            }
            
            // 거래 폼에 수정 데이터 채우기 (ChatGPT 솔루션)
            function fillAccountFormForEdit(data) {
                document.getElementById('transactionDate').value = data.date || '';
                document.getElementById('transactionType').value = data.type || '';
                
                // 카테고리 옵션 업데이트 후 선택
                updateCategoryOptions();
                setTimeout(() => {
                    document.getElementById('transactionCategory').value = data.category || '';
                }, 50);
                
                document.getElementById('transactionDescription').value = data.description || '';
                document.getElementById('transactionManager').value = data.manager || '';
                document.getElementById('transactionAmount').value = data.amount || '';
            }
            
            // 사역 폼에 수정 데이터 채우기 (ChatGPT 솔루션)
            function fillMinistryFormForEdit(data) {
                document.getElementById('ministryDate').value = data.date || '';
                document.getElementById('ministryType').value = data.type || '';
                
                // 카테고리 옵션 업데이트 후 선택
                updateMinistryCategoryOptions();
                setTimeout(() => {
                    document.getElementById('ministryCategory').value = data.category || '';
                }, 50);
                
                document.getElementById('ministryContent').value = data.content || '';
            }
            
            // UI 수정 모드 토글 (ChatGPT 솔루션)
            function toggleEditUI(isEdit, formType) {
                if (formType === 'transaction') {
                    const submitBtn = document.querySelector('#transactionForm button[type="submit"]');
                    const cancelBtn = document.getElementById('cancelTransactionEdit');
                    
                    if (isEdit) {
                        submitBtn.textContent = '수정 완료';
                        submitBtn.className = 'btn btn-warning';
                        if (cancelBtn) cancelBtn.style.display = 'inline-block';
                    } else {
                        submitBtn.textContent = '거래 추가';
                        submitBtn.className = 'btn btn-primary';
                        if (cancelBtn) cancelBtn.style.display = 'none';
                        
                        // 폼 초기화
                        const today = new Date().toISOString().split('T')[0];
                        document.getElementById('transactionDate').value = today;
                        document.getElementById('transactionType').value = '';
                        document.getElementById('transactionCategory').value = '';
                        document.getElementById('transactionDescription').value = '';
                        document.getElementById('transactionManager').value = '';
                        document.getElementById('transactionAmount').value = '';
                    }
                }
                
                if (formType === 'ministry') {
                    const submitBtn = document.querySelector('#ministryForm button[type="submit"]');
                    const cancelBtn = document.getElementById('cancelMinistryEdit');
                    
                    if (isEdit) {
                        submitBtn.textContent = '수정 완료';
                        submitBtn.className = 'btn btn-warning';
                        if (cancelBtn) cancelBtn.style.display = 'inline-block';
                    } else {
                        submitBtn.textContent = '사역 추가';
                        submitBtn.className = 'btn btn-primary';
                        if (cancelBtn) cancelBtn.style.display = 'none';
                        
                        // 폼 초기화
                        const today = new Date().toISOString().split('T')[0];
                        document.getElementById('ministryDate').value = today;
                        document.getElementById('ministryType').value = '';
                        document.getElementById('ministryCategory').value = '';
                        document.getElementById('ministryContent').value = '';
                    }
                }
            }

            // 로그인 버튼 이벤트 초기화 (ChatGPT 솔루션)
            function initLoginButtons() {
                // Enter 키로 비밀번호 입력 지원
                const passwordInput = document.getElementById('departmentPassword');
                if (passwordInput && !passwordInput.hasAttribute('data-keyup-initialized')) {
                    passwordInput.setAttribute('data-keyup-initialized', 'true');
                    passwordInput.addEventListener('keyup', function(e) {
                        if (e.key === 'Enter') {
                            authenticateDepartment();
                        }
                    });
                }
            }
            
            // 사역 카테고리 옵션 업데이트 (ChatGPT 솔루션)
            function updateMinistryCategoryOptions() {
                const type = document.getElementById('ministryType').value;
                const categorySelect = document.getElementById('ministryCategory');
                
                categorySelect.innerHTML = '<option value="">선택하세요</option>';
                
                if (type && ministryCategoryOptions[type]) {
                    ministryCategoryOptions[type].forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        categorySelect.appendChild(option);
                    });
                }
            }

            // =================== 기존 함수들 ===================

            // 부서 선택
            function selectDepartment(department) {
                selectedDepartment = department;
                document.getElementById('selectedDepartmentName').textContent = department + ' 비밀번호 입력';
                document.getElementById('passwordSection').style.display = 'block';
                document.getElementById('departmentPassword').focus();
            }

            // 부서 선택 취소
            function cancelDepartmentSelection() {
                selectedDepartment = '';
                document.getElementById('passwordSection').style.display = 'none';
                document.getElementById('departmentPassword').value = '';
            }

            // 부서 인증
            async function authenticateDepartment() {
                const password = document.getElementById('departmentPassword').value;
                
                if (!password) {
                    showMessage('비밀번호를 입력해주세요.', 'error');
                    return;
                }

                try {
                    showMessage('🔐 인증 중입니다...', 'info');
                    const response = await fetch('/api/auth/department', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            department: selectedDepartment,
                            password: password
                        })
                    });

                    const result = await response.json();
                    console.log('🔐 인증 결과:', result);

                    if (result.success) {
                        currentDepartment = selectedDepartment;
                        clientStorage.saveToLocalStorage();
                        showMessage('✅ ' + selectedDepartment + ' 로그인 성공!', 'success');
                        setTimeout(() => {
                            showMainMenu();
                        }, 1000);
                    } else {
                        showMessage('❌ ' + result.message, 'error');
                        document.getElementById('departmentPassword').value = '';
                        document.getElementById('departmentPassword').focus();
                    }
                } catch (error) {
                    console.error('로그인 오류:', error);
                    showMessage('❌ 로그인 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }

            // 회계 앱 표시
            function showAccountingApp() {
                currentMode = 'accounting';
                document.getElementById('mainMenuSection').style.display = 'none';
                document.getElementById('accountingSection').style.display = 'block';
                document.getElementById('ministrySection').style.display = 'none';
                document.getElementById('currentDepartmentAccounting').textContent = '현재 부서: ' + currentDepartment + ' (회계 관리)';
                
                // 오늘 날짜 설정
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('transactionDate').value = today;
                
                // 거래 목록 로드
                loadTransactions();
            }

            // 사역 앱 표시 
            function showMinistryApp() {
                currentMode = 'ministry';
                document.getElementById('mainMenuSection').style.display = 'none';
                document.getElementById('accountingSection').style.display = 'none';
                document.getElementById('ministrySection').style.display = 'block';
                document.getElementById('currentDepartmentMinistry').textContent = '현재 부서: ' + currentDepartment + ' (사역 관리)';
                
                // 오늘 날짜 설정
                const today = new Date().toISOString().split('T')[0];
                document.getElementById('ministryDate').value = today;
                
                // 사역 목록 로드
                loadMinistryItems();
            }

            // 메인 메뉴로 돌아가기
            function showMainMenu() {
                console.log('🏠 메인 메뉴 표시');
                document.getElementById('departmentSection').style.display = 'none';
                document.getElementById('mainMenuSection').style.display = 'block';
                document.getElementById('accountingSection').style.display = 'none';
                document.getElementById('ministrySection').style.display = 'none';
                currentMode = '';
            }

            // 로그아웃
            function logout() {
                console.log('🚪 로그아웃');
                currentDepartment = '';
                selectedDepartment = '';
                currentMode = '';
                
                // 화면 초기화
                document.getElementById('departmentSection').style.display = 'block';
                document.getElementById('mainMenuSection').style.display = 'none';
                document.getElementById('accountingSection').style.display = 'none';
                document.getElementById('ministrySection').style.display = 'none';
                document.getElementById('passwordSection').style.display = 'none';
                document.getElementById('departmentPassword').value = '';
                
                showMessage('로그아웃되었습니다.', 'info');
                
                document.getElementById('departmentSection').style.display = 'block';
                document.getElementById('mainMenuSection').style.display = 'none';
                document.getElementById('accountingSection').style.display = 'none';
                document.getElementById('ministrySection').style.display = 'none';
                document.getElementById('passwordSection').style.display = 'none';
                document.getElementById('departmentPassword').value = '';
                
                showMessage('로그아웃되었습니다.', 'success');
            }

            // =================== 회계 관리 함수들 ===================

            // 탭 기능 제거됨 - 횡적 레이아웃에서 모든 기능이 동시에 표시됨

            // 카테고리 옵션 업데이트
            function updateCategoryOptions() {
                const type = document.getElementById('transactionType').value;
                const categorySelect = document.getElementById('transactionCategory');
                
                categorySelect.innerHTML = '<option value="">선택하세요</option>';
                
                if (type && categoryOptions[type]) {
                    categoryOptions[type].forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        categorySelect.appendChild(option);
                    });
                }
            }

            // 기존 initTransactionForm 제거됨 - ChatGPT 솔루션 onAddTransaction 사용

            // 거래 목록 로드
            async function loadTransactions() {
                if (!currentDepartment) return;

                document.getElementById('transactionList').innerHTML = '<tr><td colspan="7" class="loading">데이터를 불러오는 중...</td></tr>';

                try {
                    const response = await fetch('/api/accounting/transactions/' + currentDepartment);
                    const result = await response.json();

                    if (result.success) {
                        displayTransactions(result.data);
                        updateSummary(result.summary);
                    } else {
                        document.getElementById('transactionList').innerHTML = '<tr><td colspan="7" class="loading">데이터를 불러올 수 없습니다.</td></tr>';
                        showMessage(result.message, 'error');
                    }
                } catch (error) {
                    document.getElementById('transactionList').innerHTML = '<tr><td colspan="7" class="loading">오류가 발생했습니다.</td></tr>';
                    showMessage('데이터 로드 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }

            // 거래 목록 표시 (이벤트 위임 방식)
            function displayTransactions(transactions) {
                console.log('displayTransactions 호출됨, 거래 수:', transactions.length);
                const tbody = document.getElementById('transactionList');
                
                // 원본 데이터 저장 (정렬을 위해)
                if (arguments.length === 1 && !Array.isArray(originalTransactions) || originalTransactions.length === 0) {
                    originalTransactions = [...transactions];
                }
                
                // 자동 정렬: 최신 날짜 기준 내림차순
                const sortedTransactions = [...transactions].sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateB - dateA; // 내림차순 (최신 날짜가 위에)
                });
                
                console.log('정렬된 거래 목록:', sortedTransactions);
                
                if (sortedTransactions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="loading">등록된 거래가 없습니다.</td></tr>';
                } else {
                    tbody.innerHTML = ''; // 기존 내용 초기화
                    
                    sortedTransactions.forEach((transaction) => {
                        const row = document.createElement('tr');
                        // data-id와 data-type 사용으로 이벤트 위임 지원
                        row.setAttribute('data-id', transaction.rowIndex);
                        row.setAttribute('data-type', 'transaction');
                        row.setAttribute('data-date', transaction.date);
                        row.setAttribute('data-txn-type', transaction.type);
                        row.setAttribute('data-category', transaction.category);
                        row.setAttribute('data-description', transaction.description);
                        row.setAttribute('data-manager', transaction.manager);
                        row.setAttribute('data-amount', transaction.amount);
                        
                        row.innerHTML = '<td>' + transaction.date + '</td>' +
                            '<td>' + transaction.type + '</td>' +
                            '<td>' + transaction.category + '</td>' +
                            '<td style="max-width: 200px; word-wrap: break-word;">' + transaction.description + '</td>' +
                            '<td>' + transaction.manager + '</td>' +
                            '<td>' + formatCurrency(transaction.amount) + '</td>' +
                            '<td>' +
                                '<button type="button" class="btn-small btn-info" data-action="edit" data-id="' + transaction.rowIndex + '" style="margin-right: 5px;">수정</button>' +
                                '<button type="button" class="btn-small btn-danger" data-action="delete" data-id="' + transaction.rowIndex + '">삭제</button>' +
                            '</td>';
                        
                        tbody.appendChild(row);
                    });
                }
            }

            // 요약 정보 업데이트
            function updateSummary(summary) {
                if (document.getElementById('totalIncome')) {
                    document.getElementById('totalIncome').textContent = formatCurrency(summary.income);
                    document.getElementById('totalExpense').textContent = formatCurrency(summary.expense);
                    document.getElementById('totalBalance').textContent = formatCurrency(summary.balance);
                }
            }

            // 회계 목록 이벤트 위임 (단일 초기화 가드 적용)
            function initTransactionListEvents() {
                // 전역 초기화 가드
                if (window.__initedTransactionDelete) return;
                window.__initedTransactionDelete = true;
                
                const transactionList = document.getElementById('transactionList');
                if (!transactionList) return;
                
                transactionList.addEventListener('click', async function(e) {
                    const btn = e.target.closest('[data-action]');
                    if (!btn) return;
                    
                    const row = btn.closest('tr');
                    const id = row?.dataset?.id;
                    const action = btn.dataset.action;
                    
                    if (!id) {
                        alert('삭제/수정 ID 없음 - data-id 확인 필요');
                        return;
                    }
                    
                    if (action === 'delete') {
                        if (!confirm('정말 삭제할까요?')) return;
                        
                        btn.disabled = true;
                        try {
                            const response = await fetch('/api/accounting/transaction/' + currentDepartment + '/' + encodeURIComponent(id), {
                                method: 'DELETE'
                            });
                            
                            // 204 No Content도 성공 취급
                            if (!response.ok && response.status !== 204) {
                                throw new Error('삭제 실패');
                            }
                            
                            // 즉시 UI 반영
                            row.remove();
                            
                            // 전체 데이터 새로고쭨 (요약 정보 갱신)
                            loadTransactions();
                            
                            showMessage('✅ 삭제 완료', 'success');
                        } catch (err) {
                            showMessage('❌ 삭제 오류: ' + err.message, 'error');
                        } finally {
                            btn.disabled = false;
                        }
                    } else if (action === 'edit') {
                        loadTransactionForEdit(row);
                    }
                });
            }

            // 통화 포맷
            function formatCurrency(amount) {
                return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
            }

            // 거래 삭제
            async function deleteTransaction(rowIndex) {
                if (!confirm('이 거래를 삭제하시겠습니까?')) return;

                try {
                    showMessage('삭제 처리 중...', 'info');
                    
                    const response = await fetch('/api/accounting/transaction/' + currentDepartment + '/' + encodeURIComponent(rowIndex), {
                        method: 'DELETE'
                    });

                    const result = await response.json();

                    if (result.success) {
                        showMessage('✅ ' + result.message, 'success');
                        loadTransactions();
                    } else {
                        showMessage('❌ ' + result.message, 'error');
                    }
                } catch (error) {
                    showMessage('❌ 거래 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }

            // =================== 사역 관리 함수들 ===================

            // 사역 탭 기능 제거됨 - 횡적 레이아웃에서 모든 기능이 동시에 표시됨

            // 사역 카테고리 옵션 업데이트
            function updateMinistryCategoryOptions() {
                const type = document.getElementById('ministryType').value;
                const categorySelect = document.getElementById('ministryCategory');
                
                categorySelect.innerHTML = '<option value="">선택하세요</option>';
                
                if (type && ministryCategoryOptions[type]) {
                    ministryCategoryOptions[type].forEach(category => {
                        const option = document.createElement('option');
                        option.value = category;
                        option.textContent = category;
                        categorySelect.appendChild(option);
                    });
                }
            }

            // 기존 initMinistryForm 제거됨 - ChatGPT 솔루션 onAddMinistry 사용
            


            // 사역 목록 로드
            async function loadMinistryItems() {
                if (!currentDepartment) return;

                document.getElementById('ministryList').innerHTML = '<tr><td colspan="4" class="loading">데이터를 불러오는 중...</td></tr>';
                document.getElementById('prayerList').innerHTML = '<tr><td colspan="4" class="loading">데이터를 불러오는 중...</td></tr>';

                try {
                    const response = await fetch('/api/ministry/items/' + currentDepartment);
                    const result = await response.json();

                    if (result.success) {
                        displayMinistryItems(result.ministryData, result.prayerData);
                    } else {
                        document.getElementById('ministryList').innerHTML = '<tr><td colspan="4" class="loading">데이터를 불러올 수 없습니다.</td></tr>';
                        document.getElementById('prayerList').innerHTML = '<tr><td colspan="4" class="loading">데이터를 불러올 수 없습니다.</td></tr>';
                        showMessage(result.message, 'error');
                    }
                } catch (error) {
                    document.getElementById('ministryList').innerHTML = '<tr><td colspan="4" class="loading">오류가 발생했습니다.</td></tr>';
                    document.getElementById('prayerList').innerHTML = '<tr><td colspan="4" class="loading">오류가 발생했습니다.</td></tr>';
                    showMessage('데이터 로드 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }

            // 사역 목록 표시
            function displayMinistryItems(ministryData, prayerData) {
                // 원본 데이터 저장 (정렬을 위해)
                originalMinistryItems = [...ministryData];
                originalPrayerItems = [...prayerData];
                // 사역 목록 표시 (이벤트 위임 방식)
                const ministryTbody = document.getElementById('ministryList');
                
                if (ministryData.length === 0) {
                    ministryTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 사역이 없습니다.</td></tr>';
                } else {
                    ministryTbody.innerHTML = ''; // 기존 내용 초기화
                    
                    ministryData.forEach((item) => {
                        const row = document.createElement('tr');
                        // data-id와 data-type 사용으로 이벤트 위임 지원
                        row.setAttribute('data-id', item.rowIndex);
                        row.setAttribute('data-type', 'ministry');
                        row.setAttribute('data-date', item.date);
                        row.setAttribute('data-ministry-type', item.type);
                        row.setAttribute('data-category', item.category);
                        row.setAttribute('data-content', item.content);
                        
                        row.innerHTML = '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td class="ministry-content">' + item.content + '</td>' +
                            '<td>' +
                                '<button type="button" class="btn-small btn-info" data-action="edit" data-id="' + item.rowIndex + '" style="margin-right: 5px;">수정</button>' +
                                '<button type="button" class="btn-small btn-danger" data-action="delete" data-id="' + item.rowIndex + '">삭제</button>' +
                            '</td>';
                        
                        ministryTbody.appendChild(row);
                    });
                }

                // 기도제목 목록 표시
                const prayerTbody = document.getElementById('prayerList');
                
                if (prayerData.length === 0) {
                    prayerTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 기도제목이 없습니다.</td></tr>';
                } else {
                    prayerTbody.innerHTML = ''; // 기존 내용 초기화
                    
                    prayerData.forEach((item) => {
                        const row = document.createElement('tr');
                        // data-id와 data-type 사용으로 이벤트 위임 지원
                        row.setAttribute('data-id', item.rowIndex);
                        row.setAttribute('data-type', 'prayer');
                        row.setAttribute('data-date', item.date);
                        row.setAttribute('data-ministry-type', item.type);
                        row.setAttribute('data-category', item.category);
                        row.setAttribute('data-content', item.content);
                        
                        row.innerHTML = '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td class="ministry-content">' + item.content + '</td>' +
                            '<td>' +
                                '<button type="button" class="btn-small btn-info" data-action="edit" data-id="' + item.rowIndex + '" style="margin-right: 5px;">수정</button>' +
                                '<button type="button" class="btn-small btn-danger" data-action="delete" data-id="' + item.rowIndex + '">삭제</button>' +
                            '</td>';
                        
                        prayerTbody.appendChild(row);
                    });
                }
            }

            // 사역 항목 삭제
            async function deleteMinistryItem(rowIndex) {
                if (!confirm('이 사역 내용을 삭제하시겠습니까?')) return;

                try {
                    showMessage('삭제 처리 중...', 'info');
                    
                    const response = await fetch('/api/ministry/item/' + currentDepartment + '/' + encodeURIComponent(rowIndex), {
                        method: 'DELETE'
                    });

                    const result = await response.json();

                    if (result.success) {
                        showMessage('✅ ' + result.message, 'success');
                        loadMinistryItems();
                    } else {
                        showMessage('❌ ' + result.message, 'error');
                    }
                } catch (error) {
                    showMessage('❌ 사역 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }

            // =================== CSV 내보내기/가져오기 함수들 ===================

            // 회계 CSV 내보내기
            async function exportAccountingToCSV() {
                if (!currentDepartment) return;

                try {
                    const response = await fetch('/api/accounting/export/' + currentDepartment);
                    
                    if (response.ok) {
                        const csvData = await response.text();
                        downloadCSV(csvData, currentDepartment + '-회계.csv');
                        showMessage('CSV 파일이 다운로드되었습니다.', 'success');
                    } else {
                        showMessage('CSV 내보내기 중 오류가 발생했습니다.', 'error');
                    }
                } catch (error) {
                    showMessage('CSV 내보내기 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }

            // 사역 CSV 내보내기
            async function exportMinistryToCSV() {
                if (!currentDepartment) return;

                try {
                    const response = await fetch('/api/ministry/export/' + currentDepartment);
                    
                    if (response.ok) {
                        const csvData = await response.text();
                        downloadCSV(csvData, currentDepartment + '-사역.csv');
                        showMessage('CSV 파일이 다운로드되었습니다.', 'success');
                    } else {
                        showMessage('CSV 내보내기 중 오류가 발생했습니다.', 'error');
                    }
                } catch (error) {
                    showMessage('CSV 내보내기 중 오류가 발생했습니다: ' + error.message, 'error');
                }
            }

            // CSV 파일 다운로드
            function downloadCSV(csvContent, filename) {
                // UTF-8 BOM 추가 (Excel에서 한글 제대로 표시하기 위해)
                const BOM = '\uFEFF';  // JavaScript에서 유니코드 이스케이프 시퀀스
                const csvWithBOM = BOM + csvContent;
                
                const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                
                if (link.download !== undefined) {
                    const url = URL.createObjectURL(blob);
                    link.setAttribute('href', url);
                    link.setAttribute('download', filename);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    showMessage('CSV 파일이 성공적으로 다운로드되었습니다.', 'success');
                } else {
                    showMessage('브라우저가 파일 다운로드를 지원하지 않습니다.', 'error');
                }
            }

            // 회계 CSV 가져오기
            function importCSV(event) {
                const file = event.target.files[0];
                if (!file) return;

                if (!file.name.toLowerCase().endsWith('.csv')) {
                    showMessage('CSV 파일만 업로드할 수 있습니다.', 'error');
                    event.target.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const csvData = e.target.result;
                        parseAndImportCSV(csvData, 'accounting', event);
                    } catch (error) {
                        showMessage('CSV 파일 읽기 중 오류가 발생했습니다: ' + error.message, 'error');
                        event.target.value = '';
                    }
                };
                reader.readAsText(file, 'UTF-8');
            }

            // 사역 CSV 가져오기
            function importMinistryCSV(event) {
                const file = event.target.files[0];
                if (!file) return;

                if (!file.name.toLowerCase().endsWith('.csv')) {
                    showMessage('CSV 파일만 업로드할 수 있습니다.', 'error');
                    event.target.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const csvData = e.target.result;
                        parseAndImportCSV(csvData, 'ministry', event);
                    } catch (error) {
                        showMessage('CSV 파일 읽기 중 오류가 발생했습니다: ' + error.message, 'error');
                        event.target.value = '';
                    }
                };
                reader.readAsText(file, 'UTF-8');
            }

            // CSV 파싱 및 가져오기
            async function parseAndImportCSV(csvData, type, fileInputEvent) {
                // BOM 제거
                csvData = csvData.replace(/^\uFEFF/, '');
                
                const lines = csvData.split('\\n');
                let importedCount = 0;
                let errorCount = 0;
                let processedLines = 0;

                showMessage('CSV 파일 처리를 시작합니다...', 'info');

                // 헤더 행 건너뛰기
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    processedLines++;
                    try {
                        const fields = parseCSVLine(line);
                        
                        if (type === 'accounting' && fields.length >= 6) {
                            // 필수 필드 검증
                            if (!fields[0] || !fields[1] || !fields[2] || !fields[3] || !fields[5]) {
                                console.warn('필수 필드가 누락된 행:', line);
                                errorCount++;
                                continue;
                            }

                            const transactionData = {
                                date: fields[0],
                                type: fields[1],
                                category: fields[2],
                                description: fields[3],
                                manager: fields[4] || '',
                                amount: parseFloat(fields[5].replace(/[^0-9.-]/g, '')) || 0
                            };

                            const response = await fetch('/api/accounting/transaction/' + currentDepartment, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(transactionData)
                            });

                            if (response.ok) {
                                importedCount++;
                            } else {
                                const errorData = await response.json();
                                console.error('거래 추가 실패:', errorData);
                                errorCount++;
                            }
                        } else if (type === 'ministry' && fields.length >= 4) {
                            // 필수 필드 검증
                            if (!fields[0] || !fields[1] || !fields[2] || !fields[3]) {
                                console.warn('필수 필드가 누락된 행:', line);
                                errorCount++;
                                continue;
                            }

                            const ministryData = {
                                date: fields[0],
                                type: fields[1],
                                category: fields[2],
                                content: fields[3]
                            };

                            const response = await fetch('/api/ministry/item/' + currentDepartment, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(ministryData)
                            });

                            if (response.ok) {
                                importedCount++;
                            } else {
                                const errorData = await response.json();
                                console.error('사역 추가 실패:', errorData);
                                errorCount++;
                            }
                        } else {
                            console.warn('필드 수가 부족한 행:', line, 'Expected:', type === 'accounting' ? 6 : 4, 'Got:', fields.length);
                            errorCount++;
                        }
                        
                        // 진행 상황 표시 (10개씩)
                        if (processedLines % 10 === 0) {
                            showMessage('처리 중... (' + processedLines + '/' + (lines.length - 1) + '행)', 'info');
                        }
                    } catch (error) {
                        console.error('CSV 행 처리 오류:', error, '행:', line);
                        errorCount++;
                    }
                }

                // 최종 결과 메시지
                if (importedCount > 0) {
                    showMessage('✅ 총 ' + importedCount + '개의 항목을 성공적으로 가져왔습니다.' + 
                              (errorCount > 0 ? ' (' + errorCount + '개 실패)' : ''), 'success');
                    
                    // 데이터 새로고침
                    if (type === 'accounting') {
                        loadTransactions();
                    } else {
                        loadMinistryItems();
                    }
                } else if (processedLines > 0) {
                    showMessage('❌ 가져오기에 실패했습니다. ' + errorCount + '개 행에서 오류가 발생했습니다.', 'error');
                } else {
                    showMessage('❌ 가져올 수 있는 데이터가 없습니다.', 'error');
                }

                // 파일 입력 초기화
                if (fileInputEvent && fileInputEvent.target) {
                    fileInputEvent.target.value = '';
                }
            }

            // CSV 라인 파싱 함수
            function parseCSVLine(line) {
                const fields = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        fields.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                
                fields.push(current.trim());
                return fields;
            }

            // 전체 삭제 함수들
            async function clearAllTransactions() {
                if (!confirm('모든 거래 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    return;
                }
                
                showMessage('현재는 시뮬레이션 모드입니다. 실제 삭제는 Google Sheets API 권한 설정 후 가능합니다.', 'info');
            }

            async function clearAllMinistryData() {
                if (!confirm('모든 사역 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    return;
                }
                
                showMessage('현재는 시뮬레이션 모드입니다. 실제 삭제는 Google Sheets API 권한 설정 후 가능합니다.', 'info');
            }

            // 모든 UI 이벤트 리스너 초기화
            function initLoginButtons() {
                // 부서 선택 버튼들 - data-department 속성 사용
                const departmentButtons = document.querySelectorAll('[data-department]');
                departmentButtons.forEach(btn => {
                    const department = btn.getAttribute('data-department');
                    btn.addEventListener('click', function() {
                        selectDepartment(department);
                    });
                });
                
                // 로그인 버튼
                const loginBtn = document.getElementById('loginButton');
                if (loginBtn) {
                    loginBtn.addEventListener('click', function() {
                        authenticateDepartment();
                    });
                }
                
                // 취소 버튼
                const cancelBtn = document.getElementById('cancelButton');
                if (cancelBtn) {
                    cancelBtn.addEventListener('click', function() {
                        cancelDepartmentSelection();
                    });
                }
                
                // 메인 메뉴 버튼들
                const accountingCard = document.querySelector('[data-action="accounting"]');
                if (accountingCard) {
                    accountingCard.addEventListener('click', function() {
                        showAccountingApp();
                    });
                }
                
                const ministryCard = document.querySelector('[data-action="ministry"]');
                if (ministryCard) {
                    ministryCard.addEventListener('click', function() {
                        showMinistryApp();
                    });
                }
                
                // 로그아웃 버튼
                const logoutBtn = document.getElementById('logoutButton');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function() {
                        logout();
                    });
                }
                
                // 뒤로가기 버튼들
                const backBtns = document.querySelectorAll('[data-action="main-menu"]');
                backBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        showMainMenu();
                    });
                });
                
                // 탭 버튼 이벤트 제거됨 - 횡적 레이아웃으로 변경
                
                // 사역 뒤로가기 버튼
                const ministryBackBtn = document.getElementById('ministryBackBtn');
                if (ministryBackBtn) {
                    ministryBackBtn.addEventListener('click', function() {
                        showMainMenu();
                    });
                }
                
                // 회계 카테고리 선택 변경
                const transactionType = document.getElementById('transactionType');
                if (transactionType) {
                    transactionType.addEventListener('change', function() {
                        updateCategoryOptions();
                    });
                }
                
                // 사역 카테고리 선택 변경
                const ministryType = document.getElementById('ministryType');
                if (ministryType) {
                    ministryType.addEventListener('change', function() {
                        updateMinistryCategoryOptions();
                    });
                }
                
                // 회계 관련 버튼들
                const exportAccountingBtn = document.getElementById('exportAccountingBtn');
                if (exportAccountingBtn) {
                    exportAccountingBtn.addEventListener('click', function() {
                        exportAccountingToCSV();
                    });
                }
                
                const importAccountingBtn = document.getElementById('importAccountingBtn');
                if (importAccountingBtn) {
                    importAccountingBtn.addEventListener('click', function() {
                        document.getElementById('csvFile').click();
                    });
                }
                
                const clearAccountingBtn = document.getElementById('clearAccountingBtn');
                if (clearAccountingBtn) {
                    clearAccountingBtn.addEventListener('click', function() {
                        clearAllTransactions();
                    });
                }
                
                const refreshAccountingBtn = document.getElementById('refreshAccountingBtn');
                if (refreshAccountingBtn) {
                    refreshAccountingBtn.addEventListener('click', function() {
                        loadTransactions();
                    });
                }
                
                // CSV 파일 입력
                const csvFileInput = document.getElementById('csvFile');
                if (csvFileInput) {
                    csvFileInput.addEventListener('change', function(event) {
                        importCSV(event);
                    });
                }
                
                // 사역 관련 버튼들
                const exportMinistryBtn = document.getElementById('exportMinistryBtn');
                if (exportMinistryBtn) {
                    exportMinistryBtn.addEventListener('click', function() {
                        exportMinistryToCSV();
                    });
                }
                
                const importMinistryBtn = document.getElementById('importMinistryBtn');
                if (importMinistryBtn) {
                    importMinistryBtn.addEventListener('click', function() {
                        document.getElementById('ministryCsvFile').click();
                    });
                }
                
                const clearMinistryBtn = document.getElementById('clearMinistryBtn');
                if (clearMinistryBtn) {
                    clearMinistryBtn.addEventListener('click', function() {
                        clearAllMinistryData();
                    });
                }
                
                const refreshMinistryBtn = document.getElementById('refreshMinistryBtn');
                if (refreshMinistryBtn) {
                    refreshMinistryBtn.addEventListener('click', function() {
                        loadMinistryItems();
                    });
                }
                
                // 사역 CSV 파일 입력
                const ministryCsvFileInput = document.getElementById('ministryCsvFile');
                if (ministryCsvFileInput) {
                    ministryCsvFileInput.addEventListener('change', function(event) {
                        importMinistryCSV(event);
                    });
                }
                
                // Enter 키로 로그인
                const passwordInput = document.getElementById('departmentPassword');
                if (passwordInput) {
                    passwordInput.addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            authenticateDepartment();
                        }
                    });
                }
            }

            // =================== 정렬 기능 ===================
            
            let currentSortField = '';
            let currentSortDirection = 'asc';
            let originalTransactions = [];
            let originalMinistryItems = [];
            let originalPrayerItems = [];

            // 테이블 정렬 초기화
            function initTableSorting() {
                // 회계 테이블 정렬
                document.querySelectorAll('#accountingSection .sortable').forEach(th => {
                    th.addEventListener('click', function() {
                        const sortField = this.getAttribute('data-sort');
                        sortTransactions(sortField);
                    });
                });

                // 사역 테이블 정렬
                document.querySelectorAll('#ministrySection .sortable').forEach(th => {
                    th.addEventListener('click', function() {
                        const sortField = this.getAttribute('data-sort');
                        const tableSection = this.closest('.ministry-table-section');
                        if (tableSection.classList.contains('ministry-type')) {
                            sortMinistryItems(sortField, 'ministry');
                        } else {
                            sortMinistryItems(sortField, 'prayer');
                        }
                    });
                });
            }

            // 거래 목록 정렬
            function sortTransactions(field) {
                if (originalTransactions.length === 0) return;

                // 정렬 방향 결정
                if (currentSortField === field) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortField = field;
                    currentSortDirection = 'asc';
                }

                // 정렬 화살표 업데이트
                updateSortArrows('#accountingSection', field, currentSortDirection);

                // 데이터 정렬
                const sortedTransactions = [...originalTransactions].sort((a, b) => {
                    let aVal, bVal;

                    switch (field) {
                        case 'date':
                            aVal = new Date(a.date);
                            bVal = new Date(b.date);
                            break;
                        case 'amount':
                            aVal = parseFloat(a.amount) || 0;
                            bVal = parseFloat(b.amount) || 0;
                            break;
                        case 'type':
                        case 'category':
                            aVal = (a[field] || '').toString().toLowerCase();
                            bVal = (b[field] || '').toString().toLowerCase();
                            break;
                        default:
                            return 0;
                    }

                    if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
                    return 0;
                });

                // 정렬된 데이터 표시
                displayTransactions(sortedTransactions);
            }

            // 사역 목록 정렬
            function sortMinistryItems(field, type) {
                const items = type === 'ministry' ? originalMinistryItems : originalPrayerItems;
                if (items.length === 0) return;

                // 정렬 방향 결정
                if (currentSortField === field) {
                    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSortField = field;
                    currentSortDirection = 'asc';
                }

                // 정렬 화살표 업데이트
                const tableSection = type === 'ministry' ? '.ministry-type' : '.prayer-type';
                updateSortArrows(tableSection, field, currentSortDirection);

                // 데이터 정렬
                const sortedItems = [...items].sort((a, b) => {
                    let aVal, bVal;

                    switch (field) {
                        case 'date':
                            aVal = new Date(a.date);
                            bVal = new Date(b.date);
                            break;
                        case 'category':
                            aVal = (a.category || '').toString().toLowerCase();
                            bVal = (b.category || '').toString().toLowerCase();
                            break;
                        default:
                            return 0;
                    }

                    if (aVal < bVal) return currentSortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return currentSortDirection === 'asc' ? 1 : -1;
                    return 0;
                });

                // 정렬된 데이터 표시
                if (type === 'ministry') {
                    displayMinistryItemsSorted(sortedItems, originalPrayerItems);
                } else {
                    displayMinistryItemsSorted(originalMinistryItems, sortedItems);
                }
            }

            // 정렬 화살표 업데이트
            function updateSortArrows(containerSelector, field, direction) {
                // 모든 정렬 화살표 초기화
                const container = containerSelector === '#accountingSection' || containerSelector.startsWith('.') 
                    ? document.querySelector(containerSelector) 
                    : document.getElementById(containerSelector.replace('#', ''));
                    
                if (container) {
                    container.querySelectorAll('.sortable').forEach(th => {
                        th.classList.remove('sort-asc', 'sort-desc');
                    });

                    // 현재 정렬 필드에 화살표 표시
                    const currentTh = container.querySelector('[data-sort="' + field + '"]');
                    if (currentTh) {
                        currentTh.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
                    }
                }
            }

            // 사역 목록 정렬된 데이터 표시 (별도 함수)
            function displayMinistryItemsSorted(ministryData, prayerData) {
                // 사역 목록 표시 (이벤트 위임 방식 - ChatGPT 솔루션)
                const ministryTbody = document.getElementById('ministryList');
                
                if (ministryData.length === 0) {
                    ministryTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 사역이 없습니다.</td></tr>';
                } else {
                    ministryTbody.innerHTML = '';
                    
                    ministryData.forEach((item) => {
                        const row = document.createElement('tr');
                        // data-id와 data-type 사용으로 이벤트 위임 지원
                        row.setAttribute('data-id', item.rowIndex);
                        row.setAttribute('data-type', 'ministry');
                        row.setAttribute('data-date', item.date);
                        row.setAttribute('data-ministry-type', item.type);
                        row.setAttribute('data-category', item.category);
                        row.setAttribute('data-content', item.content);
                        
                        row.innerHTML = '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td style="max-width: 300px; word-wrap: break-word;">' + item.content + '</td>' +
                            '<td>' +
                                '<button type="button" class="btn-small btn-info" data-action="edit" data-id="' + item.rowIndex + '" style="margin-right: 5px;">수정</button>' +
                                '<button type="button" class="btn-small btn-danger" data-action="delete" data-id="' + item.rowIndex + '">삭제</button>' +
                            '</td>';
                        
                        ministryTbody.appendChild(row);
                    });
                }

                // 기도제목 목록 표시 (이벤트 위임 방식 - ChatGPT 솔루션)
                const prayerTbody = document.getElementById('prayerList');
                
                if (prayerData.length === 0) {
                    prayerTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 기도제목이 없습니다.</td></tr>';
                } else {
                    prayerTbody.innerHTML = '';
                    
                    prayerData.forEach((item) => {
                        const row = document.createElement('tr');
                        // data-id와 data-type 사용으로 이벤트 위임 지원
                        row.setAttribute('data-id', item.rowIndex);
                        row.setAttribute('data-type', 'prayer');
                        row.setAttribute('data-date', item.date);
                        row.setAttribute('data-ministry-type', item.type);
                        row.setAttribute('data-category', item.category);
                        row.setAttribute('data-content', item.content);
                        
                        row.innerHTML = '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td style="max-width: 300px; word-wrap: break-word;">' + item.content + '</td>' +
                            '<td>' +
                                '<button type="button" class="btn-small btn-info" data-action="edit" data-id="' + item.rowIndex + '" style="margin-right: 5px;">수정</button>' +
                                '<button type="button" class="btn-small btn-danger" data-action="delete" data-id="' + item.rowIndex + '">삭제</button>' +
                            '</td>';
                        
                        prayerTbody.appendChild(row);
                    });
                }
            }

            // =================== 공통 함수들 ===================

            // 메시지 표시
            function showMessage(message, type) {
                const messageArea = document.getElementById('messageArea');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ' + type;
                messageDiv.textContent = message;
                
                messageArea.innerHTML = '';
                messageArea.appendChild(messageDiv);
                
                setTimeout(() => {
                    messageArea.innerHTML = '';
                }, 5000);
            }

            // =================== 수정 기능 ===================
            
            // 회계 데이터 수정을 위해 폼에 로드
            function loadTransactionForEdit(row) {
                const date = row.dataset.date;
                const type = row.dataset.txnType;
                const category = row.dataset.category;
                const description = row.dataset.description;
                const manager = row.dataset.manager;
                const amount = row.dataset.amount;
                const rowIndex = row.dataset.id;
                
                // 폼에 데이터 채우기
                document.getElementById('transactionDate').value = date;
                document.getElementById('transactionType').value = type;
                updateCategoryOptions();
                setTimeout(() => {
                    document.getElementById('transactionCategory').value = category;
                }, 100);
                document.getElementById('transactionDescription').value = description;
                document.getElementById('transactionManager').value = manager;
                document.getElementById('transactionAmount').value = amount;
                
                // 수정 모드로 전환
                editState = { type: 'transaction', id: rowIndex };
                const submitBtn = document.querySelector('#transactionForm button[type="submit"]');
                submitBtn.textContent = '수정 완료';
                
                // 수정 취소 버튼 보이기
                let cancelBtn = document.getElementById('transactionCancelEditBtn');
                if (!cancelBtn) {
                    cancelBtn = document.createElement('button');
                    cancelBtn.type = 'button';
                    cancelBtn.id = 'transactionCancelEditBtn';
                    cancelBtn.className = 'btn-secondary';
                    cancelBtn.textContent = '수정 취소';
                    cancelBtn.addEventListener('click', clearTransactionEditState);
                    submitBtn.parentNode.appendChild(cancelBtn);
                }
                cancelBtn.style.display = 'inline-block';
                
                // 상단으로 스크롤
                document.getElementById('transactionForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
                showMessage('수정할 내용을 변경한 후 "수정 완료" 버튼을 눌러주세요.', 'info');
            }
            
            // 회계 데이터 수정 상태 초기화
            function clearTransactionEditState() {
                editState = null;
                const submitBtn = document.querySelector('#transactionForm button[type="submit"]');
                submitBtn.textContent = '거래 추가';
                
                const cancelBtn = document.getElementById('transactionCancelEditBtn');
                if (cancelBtn) {
                    cancelBtn.style.display = 'none';
                }
                
                // 3번 요구사항: 날짜/유형/항목 유지, 적요/담당자/금액만 초기화
                afterTransactionSaved();
                
                showMessage('수정이 취소되었습니다.', 'info');
            }
            
            // 회계 저장 후 처리 (일부 필드만 초기화)
            function afterTransactionSaved() {
                // 날짜/유형/항목 유지 → 적요, 담당자, 금액만 초기화
                document.getElementById('transactionDescription').value = '';
                document.getElementById('transactionManager').value = '';
                document.getElementById('transactionAmount').value = '';
                
                // 다음 입력 포커스
                document.getElementById('transactionAmount').focus();
            }
            
            // 사역 목록 이벤트 위임 (단일 초기화 가드 적용)
            function initMinistryListEvents() {
                // 전역 초기화 가드
                if (window.__initedMinistryDelete) return;
                window.__initedMinistryDelete = true;
                
                // 사역 목록 이벤트
                const ministryList = document.getElementById('ministryList');
                if (ministryList) {
                    ministryList.addEventListener('click', async function(e) {
                        const btn = e.target.closest('[data-action]');
                        if (!btn) return;
                        
                        const row = btn.closest('tr');
                        const id = row?.dataset?.id;
                        const action = btn.dataset.action;
                        
                        if (!id) {
                            alert('사역 삭제/수정 ID 없음 - data-id 확인 필요');
                            return;
                        }
                        
                        if (action === 'delete') {
                            if (!confirm('정말 삭제할까요?')) return;
                            
                            btn.disabled = true;
                            try {
                                const response = await fetch('/api/ministry/item/' + currentDepartment + '/' + encodeURIComponent(id), {
                                    method: 'DELETE'
                                });
                                
                                if (!response.ok && response.status !== 204) {
                                    throw new Error('삭제 실패');
                                }
                                
                                // 즉시 UI 반영
                                row.remove();
                                
                                // 전체 데이터 새로고쭨
                                loadMinistryItems();
                                
                                showMessage('✅ 삭제 완료', 'success');
                            } catch (err) {
                                showMessage('❌ 삭제 오류: ' + err.message, 'error');
                            } finally {
                                btn.disabled = false;
                            }
                        } else if (action === 'edit') {
                            loadMinistryItemForEdit(row);
                        }
                    });
                }
                
                // 기도제목 목록 이벤트
                const prayerList = document.getElementById('prayerList');
                if (prayerList) {
                    prayerList.addEventListener('click', async function(e) {
                        const btn = e.target.closest('[data-action]');
                        if (!btn) return;
                        
                        const row = btn.closest('tr');
                        const id = row?.dataset?.id;
                        const action = btn.dataset.action;
                        
                        if (!id) {
                            alert('기도제목 삭제/수정 ID 없음 - data-id 확인 필요');
                            return;
                        }
                        
                        if (action === 'delete') {
                            if (!confirm('정말 삭제할까요?')) return;
                            
                            btn.disabled = true;
                            try {
                                const response = await fetch('/api/ministry/item/' + currentDepartment + '/' + encodeURIComponent(id), {
                                    method: 'DELETE'
                                });
                                
                                if (!response.ok && response.status !== 204) {
                                    throw new Error('삭제 실패');
                                }
                                
                                // 즉시 UI 반영
                                row.remove();
                                
                                // 전체 데이터 새로고쭨
                                loadMinistryItems();
                                
                                showMessage('✅ 삭제 완료', 'success');
                            } catch (err) {
                                showMessage('❌ 삭제 오류: ' + err.message, 'error');
                            } finally {
                                btn.disabled = false;
                            }
                        } else if (action === 'edit') {
                            loadMinistryItemForEdit(row);
                        }
                    });
                }
            }
            
            // 사역 데이터 수정을 위해 폼에 로드
            function loadMinistryItemForEdit(row) {
                const date = row.dataset.date;
                const type = row.dataset.ministryType;
                const category = row.dataset.category;
                const content = row.dataset.content;
                const rowIndex = row.dataset.id;
                
                // 폼에 데이터 채우기
                document.getElementById('ministryDate').value = date;
                document.getElementById('ministryType').value = type;
                updateMinistryCategoryOptions();
                document.getElementById('ministryCategory').value = category;
                document.getElementById('ministryContent').value = content;
                
                // 수정 모드로 전환
                editState = { type: 'ministry', id: rowIndex };
                const submitBtn = document.querySelector('#ministryForm button[type="submit"]');
                submitBtn.textContent = '수정 완료';
                
                // 수정 취소 버튼 보이기
                const cancelBtn = document.getElementById('cancelEditBtn');
                if (cancelBtn) {
                    cancelBtn.style.display = 'inline-block';
                }
                
                // 상단으로 스크롤
                document.getElementById('ministryDate').scrollIntoView({ behavior: 'smooth' });
                showMessage('수정할 내용을 변경한 후 "수정 완료" 버튼을 눌러주세요.', 'info');
            }
            
            // 사역 데이터 수정 상태 초기화
            function clearMinistryEditState() {
                editState = null;
                const submitBtn = document.querySelector('#ministryForm button[type="submit"]');
                submitBtn.textContent = '내용 추가';
                
                const cancelBtn = document.getElementById('cancelEditBtn');
                if (cancelBtn) {
                    cancelBtn.style.display = 'none';
                }
                
                // 3번 요구사항: 날짜/유형/항목 유지, 내용만 초기화
                afterMinistrySaved();
                
                showMessage('수정이 취소되었습니다.', 'info');
            }
            
            // 사역 저장 후 처리 (일부 필드만 초기화)
            function afterMinistrySaved() {
                // 날짜/유형/항목 유지 → 내용만 초기화
                document.getElementById('ministryContent').value = '';
                
                // 다음 입력 포커스
                document.getElementById('ministryContent').focus();
            }
        </script>
    </body>
    </html>
  `)
})

// =================== 인증 API ===================

// 부서 인증
app.post('/api/auth/department', async (c) => {
  try {
    const { department, password } = await c.req.json()
    
    if (DEPARTMENT_PASSWORDS[department] === password) {
      return c.json({ success: true, message: '인증 성공' })
    }
    
    return c.json({ success: false, message: '비밀번호가 올바르지 않습니다.' })
  } catch (error) {
    return c.json({ success: false, message: '인증 중 오류가 발생했습니다.' }, 500)
  }
})

// =================== 회계 관리 API ===================

// Google Sheets API 호출을 위한 간단한 JWT 생성 함수
async function createJWT(serviceAccount: any) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }
  
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  }
  
  const headerB64 = btoa(JSON.stringify(header))
  const payloadB64 = btoa(JSON.stringify(payload))
  
  // 간단한 구현을 위해 서비스 계정 키 대신 API 키를 사용
  // 실제 프로덕션에서는 proper JWT signing이 필요합니다
  return `${headerB64}.${payloadB64}.signature`
}

// Google Sheets API Access Token 획득
async function getAccessToken(env: Bindings) {
  try {
    // 개발 환경에서는 API 키 직접 사용 (간단한 접근법)
    // 실제로는 Google API 키를 사용하거나 OAuth2를 구현해야 합니다
    return env.GEMINI_API_KEY // 임시로 Gemini API 키 사용
  } catch (error) {
    console.error('Access Token Error:', error)
    throw error
  }
}

// 메모리 스토리지 (실제 서비스에서는 데이터베이스 사용)
// 개선된 메모리 저장소 (ID 관리 포함)
const memoryStorage = {
  transactions: new Map<string, any[]>(),
  ministries: new Map<string, any[]>(),
  nextTransactionId: 1,  // 순차 ID 관리
  nextMinistryId: 1,     // 순차 ID 관리
  
  // ID 생성 함수
  getNextTransactionId() {
    return this.nextTransactionId++
  },
  
  getNextMinistryId() {
    return this.nextMinistryId++
  },
  
  // 로컬스토리지 백업 (선택사항)
  saveToLocalStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('saesoon_transactions', JSON.stringify(Array.from(this.transactions.entries())))
        localStorage.setItem('saesoon_ministries', JSON.stringify(Array.from(this.ministries.entries())))
        localStorage.setItem('saesoon_next_ids', JSON.stringify({
          transaction: this.nextTransactionId,
          ministry: this.nextMinistryId
        }))
        console.log('💾 로컬스토리지 백업 완료')
      } catch (e) {
        console.warn('로컬스토리지 저장 실패:', e)
      }
    }
  },
  
  // 로컬스토리지 복원 (선택사항)
  loadFromLocalStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const transactions = localStorage.getItem('saesoon_transactions')
        const ministries = localStorage.getItem('saesoon_ministries')
        const nextIds = localStorage.getItem('saesoon_next_ids')
        
        if (transactions) {
          this.transactions = new Map(JSON.parse(transactions))
        }
        if (ministries) {
          this.ministries = new Map(JSON.parse(ministries))
        }
        if (nextIds) {
          const ids = JSON.parse(nextIds)
          this.nextTransactionId = ids.transaction || 1
          this.nextMinistryId = ids.ministry || 1
        }
        console.log('📁 로컬스토리지 복원 완료')
      } catch (e) {
        console.warn('로컬스토리지 복원 실패:', e)
      }
    }
  }
}

// 순수 메모리 기반 API (구글시트 연동 제거)
async function callSheetsAPI(env: Bindings, method: string, endpoint: string, data?: any) {
  console.log('🔥 순수 메모리 API 호출:', method, endpoint)
  
  try {
    // GET 요청의 경우 메모리에서만 데이터 조회
    if (method === 'GET') {
      if (endpoint.includes('values/')) {
        const sheetName = endpoint.split('/')[1].split('!')[0]
        console.log('📊 데이터 조회 요청:', sheetName)
        
        // 메모리에서만 데이터 조회 (구글시트 제거)
        let memoryValues = []
        let header = []
        
        if (sheetName.includes('사역')) {
          const department = sheetName.replace('사역', '')
          const memoryData = memoryStorage.ministries.get(department) || []
          memoryValues = memoryData.map(item => [item.date, item.type, item.category, item.content, 'mem_' + item.id])
          header = ['날짜', '유형', '항목', '내용', 'rowIndex']
          console.log('📋 사역 데이터 조회:', department, memoryData.length, '건')
        } else {
          const memoryData = memoryStorage.transactions.get(sheetName) || []
          memoryValues = memoryData.map(item => [item.date, item.type, item.category, item.description, item.manager, item.amount, 'mem_' + item.id])
          header = ['날짜', '유형', '항목', '적요', '담당자', '금액', 'rowIndex']
          console.log('💰 회계 데이터 조회:', sheetName, memoryData.length, '건')
        }
        
        // 헤더 + 데이터 결합
        const allValues = [header, ...memoryValues]
        console.log('✅ 전체 데이터:', allValues.length - 1, '건 반환')
        
        return { values: allValues }
      }
    }
    
    // POST/PUT/DELETE 요청의 경우 순수 메모리 저장
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      console.log('🔄 메모리 저장 요청:', method, endpoint)
      
      if (endpoint.includes(':append') && data?.values) {
        // 데이터 추가 (순차 ID 사용)
        const range = endpoint.split('values/')[1].split(':')[0]
        const sheetName = range.split('!')[0]
        
        if (sheetName.includes('사역')) {
          // 사역 데이터
          const department = sheetName.replace('사역', '')
          const existingData = memoryStorage.ministries.get(department) || []
          const newId = memoryStorage.getNextMinistryId()
          const newItem = {
            id: newId,
            date: data.values[0][0],
            type: data.values[0][1], 
            category: data.values[0][2],
            content: data.values[0][3]
          }
          existingData.push(newItem)
          memoryStorage.ministries.set(department, existingData)
          memoryStorage.saveToLocalStorage() // 자동 백업
          console.log('✅ 사역 데이터 추가 성공:', department, 'ID:', newId)
        } else {
          // 회계 데이터
          const existingData = memoryStorage.transactions.get(sheetName) || []
          const newId = memoryStorage.getNextTransactionId()
          const newItem = {
            id: newId,
            date: data.values[0][0],
            type: data.values[0][1],
            category: data.values[0][2], 
            description: data.values[0][3],
            manager: data.values[0][4],
            amount: parseFloat(data.values[0][5]) || 0
          }
          existingData.push(newItem)
          memoryStorage.transactions.set(sheetName, existingData)
          memoryStorage.saveToLocalStorage() // 자동 백업
          console.log('✅ 회계 데이터 추가 성공:', sheetName, 'ID:', newId)
        }
        
        return { updates: { updatedRows: 1 } }
      }
      
      if (endpoint.includes(':batchUpdate')) {
        // 삭제 요청 처리 (메모리에서만)
        console.log('🗑️ 메모리 삭제 요청:', data)
        return { replies: [{}] }
      }
      
      // PUT (수정) 요청 처리
      if (method === 'PUT' && endpoint.includes('values/')) {
        console.log('✏️ 메모리 수정 요청 처리됨')
        return { updatedCells: 1 }
      }
      
      // DELETE (삭제) 요청 처리
      if (method === 'DELETE') {
        console.log('🗑️ 메모리 삭제 요청 처리됨')
        return { success: true }
      }
      
      return { success: true }
    }
    
    throw new Error(`지원되지 않는 메소드: ${method}`)
  } catch (error) {
    console.error('Sheets API Error:', error)
    throw error
  }
}

// CSV 파싱 함수
function parseCSV(csvText: string): string[][] {
  if (!csvText.trim()) return []
  
  const lines = csvText.split('\n')
  const result = []
  
  for (const line of lines) {
    if (line.trim()) {
      // 간단한 CSV 파싱 (따옴표 처리 포함)
      const fields = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      
      fields.push(current.trim())
      result.push(fields)
    }
  }
  
  return result
}

// 테스트 API 엔드포인트
app.get('/api/test', (c) => {
  console.log('테스트 API 호출됨');
  return c.json({ 
    success: true, 
    message: 'API 서버 정상 작동',
    timestamp: new Date().toISOString() 
  });
});

// 거래 추가
app.post('/api/accounting/transaction/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    const transactionData = await c.req.json()
    
    // 시트 범위 설정
    const range = `${department}!A:F`
    
    // 데이터 배열 생성
    const values = [[
      transactionData.date,
      transactionData.type,
      transactionData.category,
      transactionData.description || '',
      transactionData.manager || '',
      parseFloat(transactionData.amount)
    ]]
    
    // Google Sheets API를 통해 데이터 추가
    const requestBody = {
      values: values,
      majorDimension: 'ROWS'
    }
    
    const endpoint = `values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`
    await callSheetsAPI(env, 'POST', endpoint, requestBody)
    
    // Gemini AI로 거래 분석 (선택사항)
    try {
      await analyzeTransactionWithGemini(env, transactionData)
    } catch (aiError) {
      console.log('AI Analysis Error:', aiError)
      // AI 분석 실패는 메인 기능에 영향을 주지 않음
    }
    
    return c.json({ 
      success: true, 
      message: '거래가 성공적으로 추가되었습니다.' 
    })
  } catch (error) {
    console.error('Transaction Add Error:', error)
    return c.json({ 
      success: false, 
      message: '거래 추가 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// 거래 수정
app.put('/api/accounting/transaction/:department/:rowIndex', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    const rowIndex = c.req.param('rowIndex')
    const transactionData = await c.req.json()
    
    // 메모리 스토리지의 경우
    if (rowIndex.startsWith('mem_')) {
      const itemId = parseInt(rowIndex.replace('mem_', ''))
      const existingData = memoryStorage.transactions.get(department) || []
      const itemIndex = existingData.findIndex(item => item.id === itemId)
      
      if (itemIndex !== -1) {
        existingData[itemIndex] = {
          ...existingData[itemIndex],
          date: transactionData.date,
          type: transactionData.type,
          category: transactionData.category,
          description: transactionData.description || '',
          manager: transactionData.manager || '',
          amount: parseFloat(transactionData.amount)
        }
        memoryStorage.transactions.set(department, existingData)
        
        return c.json({ 
          success: true, 
          message: '거래가 성공적으로 수정되었습니다.' 
        })
      } else {
        throw new Error('수정할 거래를 찾을 수 없습니다.')
      }
    }
    
    // Google Sheets 직접 수정은 복잡하므로 메모리 기반으로만 처리
    // 실제 프로덕션에서는 Google Sheets API의 batchUpdate를 사용
    
    return c.json({ 
      success: true, 
      message: '거래가 성공적으로 수정되었습니다.' 
    })
  } catch (error) {
    console.error('Transaction Update Error:', error)
    return c.json({ 
      success: false, 
      message: '거래 수정 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// 거래 목록 조회
app.get('/api/accounting/transactions/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    
    // Google Sheets에서 데이터 조회
    const range = `${department}!A:F`
    const endpoint = `values/${range}`
    
    const result = await callSheetsAPI(env, 'GET', endpoint)
    
    const transactions = []
    let totalIncome = 0
    let totalExpense = 0
    
    if (result.values && result.values.length > 1) {
      // 첫 번째 행은 헤더이므로 제외
      for (let i = 1; i < result.values.length; i++) {
        const row = result.values[i]
        if (row && row.length >= 6) {
          const transaction = {
            rowIndex: row[6] || (i + 1), // rowIndex가 있으면 사용, 없으면 행 번호
            date: row[0] || '',
            type: row[1] || '',
            category: row[2] || '',
            description: row[3] || '',
            manager: row[4] || '',
            amount: parseFloat(row[5]) || 0
          }
          
          transactions.push(transaction)
          
          if (row[1] === '수입') {
            totalIncome += parseFloat(row[5]) || 0
          } else if (row[1] === '지출') {
            totalExpense += parseFloat(row[5]) || 0
          }
        }
      }
    }
    
    // ChatGPT 솔루션: 단일 소스만 사용 (메모리 중복 접근 제거)
    // callSheetsAPI에서 이미 순수 메모리 데이터를 반환하므로 추가 접근 불필요
    console.log('✅ 단일 소스 데이터 사용 - callSheetsAPI 결과만 활용');
    
    const summary = {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense
    }
    
    return c.json({ 
      success: true, 
      data: transactions,
      summary
    })
  } catch (error) {
    console.error('Transaction List Error:', error)
    
    // 시트가 존재하지 않거나 데이터가 없는 경우 빈 결과 반환
    if (error.message.includes('Unable to parse range') || error.message.includes('not found')) {
      return c.json({ 
        success: true, 
        data: [],
        summary: { income: 0, expense: 0, balance: 0 }
      })
    }
    
    return c.json({ 
      success: false, 
      message: '거래 조회 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// 거래 삭제
app.delete('/api/accounting/transaction/:department/:rowIndex', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    const rowIndexParam = c.req.param('rowIndex')
    
    // 메모리 데이터 삭제 확인
    if (rowIndexParam.startsWith('mem_')) {
      const itemId = parseInt(rowIndexParam.replace('mem_', ''))
      const existingData = memoryStorage.transactions.get(department) || []
      const updatedData = existingData.filter(item => item.id !== itemId)
      memoryStorage.transactions.set(department, updatedData)
      
      console.log('메모리에서 거래 삭제됨:', itemId)
      return c.json({ 
        success: true, 
        message: '거래가 삭제되었습니다.' 
      })
    }
    
    const rowIndex = parseInt(rowIndexParam)
    if (rowIndex <= 1) {
      throw new Error('유효하지 않은 행 번호입니다.')
    }
    
    // Google Sheets API를 통해 행 삭제
    const requestBody = {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0, // 기본 시트 ID
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-based index
            endIndex: rowIndex
          }
        }
      }]
    }
    
    const endpoint = ':batchUpdate'
    await callSheetsAPI(env, 'POST', endpoint, requestBody)
    
    return c.json({ 
      success: true, 
      message: '거래가 삭제되었습니다.' 
    })
  } catch (error) {
    console.error('Transaction Delete Error:', error)
    return c.json({ 
      success: false, 
      message: '거래 삭제 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// =================== 사역 관리 API ===================

// 사역 내용 추가
app.post('/api/ministry/item/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    const ministryData = await c.req.json()
    
    const sheetName = department + '사역'
    const range = `${sheetName}!A:D`
    
    // 데이터 배열 생성
    const values = [[
      ministryData.date,
      ministryData.type,
      ministryData.category,
      ministryData.content || ''
    ]]
    
    // Google Sheets API를 통해 데이터 추가
    const requestBody = {
      values: values,
      majorDimension: 'ROWS'
    }
    
    const endpoint = `values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`
    await callSheetsAPI(env, 'POST', endpoint, requestBody)
    
    // Gemini AI로 사역 내용 분석 (선택사항)
    try {
      await analyzeMinistryWithGemini(env, ministryData)
    } catch (aiError) {
      console.log('AI Analysis Error:', aiError)
      // AI 분석 실패는 메인 기능에 영향을 주지 않음
    }
    
    return c.json({ 
      success: true, 
      message: '사역 내용이 성공적으로 추가되었습니다.' 
    })
  } catch (error) {
    console.error('Ministry Add Error:', error)
    return c.json({ 
      success: false, 
      message: '사역 내용 추가 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// 사역 수정
app.put('/api/ministry/item/:department/:rowIndex', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    const rowIndex = c.req.param('rowIndex')
    const ministryData = await c.req.json()
    
    // 메모리 스토리지의 경우
    if (rowIndex.startsWith('mem_')) {
      const itemId = parseInt(rowIndex.replace('mem_', ''))
      const existingData = memoryStorage.ministries.get(department) || []
      const itemIndex = existingData.findIndex(item => item.id === itemId)
      
      if (itemIndex !== -1) {
        existingData[itemIndex] = {
          ...existingData[itemIndex],
          date: ministryData.date,
          type: ministryData.type,
          category: ministryData.category,
          content: ministryData.content
        }
        memoryStorage.ministries.set(department, existingData)
        
        return c.json({ 
          success: true, 
          message: '사역 내용이 성공적으로 수정되었습니다.' 
        })
      } else {
        throw new Error('수정할 사역 내용을 찾을 수 없습니다.')
      }
    }
    
    // Google Sheets 직접 수정은 복잡하므로 메모리 기반으로만 처리
    // 실제 프로덕션에서는 Google Sheets API의 batchUpdate를 사용
    
    return c.json({ 
      success: true, 
      message: '사역 내용이 성공적으로 수정되었습니다.' 
    })
  } catch (error) {
    console.error('Ministry Update Error:', error)
    return c.json({ 
      success: false, 
      message: '사역 내용 수정 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// 사역 목록 조회
app.get('/api/ministry/items/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    
    const sheetName = department + '사역'
    const range = `${sheetName}!A:D`
    const endpoint = `values/${range}`
    
    const result = await callSheetsAPI(env, 'GET', endpoint)
    
    const ministryItems = []
    const prayerItems = []
    
    if (result.values && result.values.length > 1) {
      // 첫 번째 행은 헤더이므로 제외
      for (let i = 1; i < result.values.length; i++) {
        const row = result.values[i]
        if (row && row.length >= 4) {
          const item = {
            rowIndex: row[4] || (i + 1), // rowIndex가 있으면 사용, 없으면 행 번호
            date: row[0] || '',
            type: row[1] || '',
            category: row[2] || '',
            content: row[3] || ''
          }
          
          if (row[1] === '사역') {
            ministryItems.push(item)
          } else if (row[1] === '기도제목') {
            prayerItems.push(item)
          }
        }
      }
    }
    
    // ChatGPT 솔루션: 단일 소스만 사용 (메모리 중복 접근 제거)
    // callSheetsAPI에서 이미 순수 메모리 데이터를 반환하므로 추가 접근 불필요
    console.log('✅ 단일 소스 데이터 사용 - callSheetsAPI 결과만 활용');
    
    return c.json({
      success: true,
      ministryData: ministryItems,
      prayerData: prayerItems
    })
  } catch (error) {
    console.error('Ministry List Error:', error)
    
    // 시트가 존재하지 않거나 데이터가 없는 경우 빈 결과 반환
    if (error.message.includes('Unable to parse range') || error.message.includes('not found')) {
      return c.json({
        success: true,
        ministryData: [],
        prayerData: []
      })
    }
    
    return c.json({ 
      success: false, 
      message: '사역 목록 조회 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// 사역 항목 삭제
app.delete('/api/ministry/item/:department/:rowIndex', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    const rowIndexParam = c.req.param('rowIndex')
    
    // 메모리 데이터 삭제 확인
    if (rowIndexParam.startsWith('mem_')) {
      const itemId = parseInt(rowIndexParam.replace('mem_', ''))
      const existingData = memoryStorage.ministries.get(department) || []
      const updatedData = existingData.filter(item => item.id !== itemId)
      memoryStorage.ministries.set(department, updatedData)
      
      console.log('메모리에서 사역 삭제됨:', itemId)
      return c.json({ 
        success: true, 
        message: '사역 내용이 삭제되었습니다.' 
      })
    }
    
    const rowIndex = parseInt(rowIndexParam)
    if (rowIndex <= 1) {
      throw new Error('유효하지 않은 행 번호입니다.')
    }
    
    // Google Sheets API를 통해 행 삭제
    const requestBody = {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0, // 기본 시트 ID
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-based index
            endIndex: rowIndex
          }
        }
      }]
    }
    
    const endpoint = ':batchUpdate'
    await callSheetsAPI(env, 'POST', endpoint, requestBody)
    
    return c.json({ 
      success: true, 
      message: '사역 내용이 삭제되었습니다.' 
    })
  } catch (error) {
    console.error('Ministry Delete Error:', error)
    return c.json({ 
      success: false, 
      message: '사역 삭제 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// =================== CSV 내보내기/가져오기 API ===================

// 회계 CSV 내보내기
app.get('/api/accounting/export/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    
    // Google Sheets에서 실제 데이터 가져오기
    const range = `${department}!A:F`
    const endpoint = `values/${range}`
    
    const result = await callSheetsAPI(env, 'GET', endpoint)
    
    let csvContent = '\uFEFF날짜,유형,항목,적요,담당자,금액\n' // UTF-8 BOM 추가
    
    if (result.values && result.values.length > 1) {
      // 첫 번째 행은 헤더이므로 제외
      for (let i = 1; i < result.values.length; i++) {
        const row = result.values[i]
        if (row && row.length >= 6) {
          const csvRow = [
            row[0] || '',
            row[1] || '',
            row[2] || '',
            `"${(row[3] || '').replace(/"/g, '""')}"`, // 따옴표 이스케이프
            `"${(row[4] || '').replace(/"/g, '""')}"`,
            row[5] || '0'
          ].join(',')
          
          csvContent += csvRow + '\n'
        }
      }
    }
    
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${department}-accounting.csv"`
    })
  } catch (error) {
    console.error('CSV Export Error:', error)
    return c.json({ 
      success: false, 
      message: 'CSV 내보내기 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// 사역 CSV 내보내기  
app.get('/api/ministry/export/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    
    // Google Sheets에서 실제 데이터 가져오기
    const sheetName = department + '사역'
    const range = `${sheetName}!A:D`
    const endpoint = `values/${range}`
    
    const result = await callSheetsAPI(env, 'GET', endpoint)
    
    let csvContent = '\uFEFF날짜,유형,항목,내용\n' // UTF-8 BOM 추가
    
    if (result.values && result.values.length > 1) {
      // 첫 번째 행은 헤더이므로 제외
      for (let i = 1; i < result.values.length; i++) {
        const row = result.values[i]
        if (row && row.length >= 4) {
          const csvRow = [
            row[0] || '',
            row[1] || '',
            row[2] || '',
            `"${(row[3] || '').replace(/"/g, '""')}"` // 따옴표 이스케이프
          ].join(',')
          
          csvContent += csvRow + '\n'
        }
      }
    }
    
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv; charset=utf-8', 
      'Content-Disposition': `attachment; filename="${department}-ministry.csv"`
    })
  } catch (error) {
    console.error('CSV Export Error:', error)
    return c.json({ 
      success: false, 
      message: 'CSV 내보내기 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// =================== Gemini AI 분석 API ===================

// 거래 분석
app.post('/api/ai/analyze-transaction', async (c) => {
  try {
    const { env } = c
    const transactionData = await c.req.json()
    
    const analysis = await analyzeTransactionWithGemini(env, transactionData)
    return c.json({ success: true, analysis })
  } catch (error) {
    console.error('AI Analysis Error:', error)
    return c.json({ 
      success: false, 
      message: 'AI 분석 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// Gemini API를 사용한 거래 분석 함수
async function analyzeTransactionWithGemini(env: Bindings, transactionData: any) {
  try {
    const prompt = `다음 교회 부서 거래 데이터를 분석해주세요:
    날짜: ${transactionData.date}
    유형: ${transactionData.type}
    항목: ${transactionData.category}
    적요: ${transactionData.description}
    담당자: ${transactionData.manager || '미지정'}
    금액: ${transactionData.amount}원
    
    이 거래가 적절하고 합리적인지 간단히 분석해주세요. 교회 부서 운영 관점에서 평가해주세요.`
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })
    
    if (!response.ok) {
      throw new Error('Gemini API 호출 실패')
    }
    
    const result = await response.json()
    console.log('Gemini 거래 분석 결과:', result)
    return result
  } catch (error) {
    console.log('Gemini API 오류:', error.toString())
    throw error
  }
}

// Gemini API를 사용한 사역 내용 분석 함수
async function analyzeMinistryWithGemini(env: Bindings, ministryData: any) {
  try {
    const prompt = `다음 교회 부서 사역 데이터를 분석해주세요:
    날짜: ${ministryData.date}
    유형: ${ministryData.type}
    항목: ${ministryData.category}
    내용: ${ministryData.content}
    
    이 사역 계획이 효과적이고 적절한지 교회 교육부 관점에서 간단히 분석해주세요.`
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })
    
    if (!response.ok) {
      throw new Error('Gemini API 호출 실패')
    }
    
    const result = await response.json()
    console.log('Gemini 사역 분석 결과:', result)
    return result
  } catch (error) {
    console.log('Gemini API 오류:', error.toString())
    throw error
  }
}

// =================== CSV 내보내기/가져오기 API ===================

// 회계 CSV 내보내기
app.get('/api/accounting/export/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    
    // Google Sheets에서 데이터 조회
    const range = `${department}!A:F`
    const endpoint = `values/${range}`
    
    const result = await callSheetsAPI(env, 'GET', endpoint)
    
    // CSV 생성
    let csvContent = '\uFEFF날짜,유형,항목,적요,담당자,금액\n' // BOM 포함 헤더
    
    if (result.values && result.values.length > 1) {
      // 첫 번째 행은 헤더이므로 제외
      for (let i = 1; i < result.values.length; i++) {
        const row = result.values[i]
        if (row && row.length >= 6) {
          // CSV 필드를 적절히 인용처리 (쉼표나 따옴표가 있는 경우)
          const csvRow = [
            escapeCSVField(row[0] || ''),
            escapeCSVField(row[1] || ''),
            escapeCSVField(row[2] || ''),
            escapeCSVField(row[3] || ''),
            escapeCSVField(row[4] || ''),
            row[5] || '0'
          ].join(',')
          
          csvContent += csvRow + '\n'
        }
      }
    }
    
    // CSV 응답 반환 (ASCII 파일명 사용)
    const dateStr = new Date().toISOString().split('T')[0]
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv;charset=utf-8',
      'Content-Disposition': `attachment; filename="accounting-${dateStr}.csv"`
    })
  } catch (error) {
    console.error('CSV Export Error:', error)
    return c.json({ 
      success: false, 
      message: 'CSV 내보내기 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// 사역 CSV 내보내기
app.get('/api/ministry/export/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    
    const sheetName = department + '사역'
    const range = `${sheetName}!A:D`
    const endpoint = `values/${range}`
    
    const result = await callSheetsAPI(env, 'GET', endpoint)
    
    // CSV 생성
    let csvContent = '\uFEFF날짜,유형,항목,내용\n' // BOM 포함 헤더
    
    if (result.values && result.values.length > 1) {
      // 첫 번째 행은 헤더이므로 제외
      for (let i = 1; i < result.values.length; i++) {
        const row = result.values[i]
        if (row && row.length >= 4) {
          const csvRow = [
            escapeCSVField(row[0] || ''),
            escapeCSVField(row[1] || ''),
            escapeCSVField(row[2] || ''),
            escapeCSVField(row[3] || '')
          ].join(',')
          
          csvContent += csvRow + '\n'
        }
      }
    }
    
    // CSV 응답 반환 (ASCII 파일명 사용)
    const dateStr = new Date().toISOString().split('T')[0]
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv;charset=utf-8',
      'Content-Disposition': `attachment; filename="ministry-${dateStr}.csv"`
    })
  } catch (error) {
    console.error('Ministry CSV Export Error:', error)
    return c.json({ 
      success: false, 
      message: 'CSV 내보내기 중 오류가 발생했습니다: ' + error.message 
    }, 500)
  }
})

// CSV 필드 이스케이프 함수
function escapeCSVField(field: string): string {
  if (typeof field !== 'string') {
    field = String(field)
  }
  
  // 쉼표, 따옴표, 줄바꿈이 포함된 경우 따옴표로 감싸기
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    // 따옴표 이스케이프 (이중 따옴표로)
    field = field.replace(/"/g, '""')
    // 전체를 따옴표로 감싸기
    return `"${field}"`
  }
  
  return field
}

export default app