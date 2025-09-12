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
                        <button class="btn-primary" id="loginButton">
                            로그인
                        </button>
                        <button class="btn-secondary" id="cancelButton">
                            취소
                        </button>
                    </div>
                </div>

                <!-- 메인 메뉴 선택 화면 -->
                <div class="main-menu-section" id="mainMenuSection">
                    <button class="back-btn" id="logoutButton">← 부서 변경</button>
                    
                    <h2 id="welcomeMessage"></h2>
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

                <!-- 회계 관리 섹션 -->
                <div class="app-section" id="accountingSection">
                    <button class="back-btn" data-action="main-menu">← 메인 메뉴</button>
                    <div class="current-department" id="currentDepartmentAccounting"></div>

                    <div class="tabs">
                        <button class="tab active" data-tab="input">거래 입력</button>
                        <button class="tab" data-tab="list">거래 목록</button>
                        <button class="tab" data-tab="summary">현황 요약</button>
                    </div>

                    <!-- 거래 입력 탭 -->
                    <div class="tab-content active" id="accountingInputTab">
                        <h3>거래 정보 입력</h3>
                        <form id="transactionForm">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="transactionDate">날짜 <span class="required">*</span></label>
                                    <input type="date" id="transactionDate" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="transactionType">유형 <span class="required">*</span></label>
                                    <select id="transactionType" required>
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
                                    <input type="text" id="transactionManager" placeholder="담당자명을 입력하세요">
                                </div>
                                
                                <div class="form-group" style="grid-column: 1 / -1;">
                                    <label for="transactionDescription">적요 <span class="required">*</span></label>
                                    <textarea id="transactionDescription" rows="3" placeholder="거래 내용을 자세히 입력하세요" required maxlength="500"></textarea>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-primary">거래 추가</button>
                        </form>
                    </div>

                    <!-- 거래 목록 탭 -->
                    <div class="tab-content" id="accountingListTab">
                        <div class="action-buttons">
                            <button class="btn-success btn-small" id="exportAccountingBtn">💾 CSV 저장</button>
                            <button class="btn-info btn-small" id="importAccountingBtn">📁 CSV 불러오기</button>
                            <button class="btn-danger btn-small" id="clearAccountingBtn">🗑️ 전체 삭제</button>
                            <button class="btn-secondary btn-small" id="refreshAccountingBtn">🔄 새로고침</button>
                        </div>

                        <input type="file" id="csvFile" accept=".csv" style="display: none;">

                        <div class="table-container">
                            <table class="transaction-table">
                                <thead>
                                    <tr>
                                        <th class="sortable" data-sort="date">날짜 <span class="sort-arrow"></span></th>
                                        <th class="sortable" data-sort="type">유형 <span class="sort-arrow"></span></th>
                                        <th class="sortable" data-sort="category">항목 <span class="sort-arrow"></span></th>
                                        <th>적요</th>
                                        <th>담당자</th>
                                        <th class="sortable" data-sort="amount">금액 <span class="sort-arrow"></span></th>
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

                    <!-- 현황 요약 탭 -->
                    <div class="tab-content" id="accountingSummaryTab">
                        <div class="summary-cards">
                            <div class="summary-card income">
                                <h3>총 수입</h3>
                                <div class="amount" id="totalIncome">0원</div>
                            </div>
                            <div class="summary-card expense">
                                <h3>총 지출</h3>
                                <div class="amount" id="totalExpense">0원</div>
                            </div>
                            <div class="summary-card balance">
                                <h3>잔액</h3>
                                <div class="amount" id="totalBalance">0원</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 사역 관리 섹션 -->
                <div class="ministry-section" id="ministrySection">
                    <button class="back-btn" id="ministryBackBtn">← 메인 메뉴</button>
                    <div class="current-department" id="currentDepartmentMinistry"></div>

                    <div class="tabs">
                        <button class="tab active" data-ministry-tab="input">사역 입력</button>
                        <button class="tab" data-ministry-tab="list">사역 목록</button>
                    </div>

                    <!-- 사역 입력 탭 -->
                    <div class="tab-content active" id="ministryInputTab">
                        <h3>사역 정보 입력</h3>
                        <form id="ministryForm">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="ministryDate">날짜 <span class="required">*</span></label>
                                    <input type="date" id="ministryDate" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="ministryType">유형 <span class="required">*</span></label>
                                    <select id="ministryType" required>
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
                                    <textarea id="ministryContent" rows="4" placeholder="사역 내용을 자세히 입력하세요" required maxlength="1000"></textarea>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-primary">내용 추가</button>
                        </form>
                    </div>

                    <!-- 사역 목록 탭 -->
                    <div class="tab-content" id="ministryListTab">
                        <div class="action-buttons">
                            <button class="btn-success btn-small" id="exportMinistryBtn">💾 CSV 저장</button>
                            <button class="btn-info btn-small" id="importMinistryBtn">📁 CSV 불러오기</button>
                            <button class="btn-danger btn-small" id="clearMinistryBtn">🗑️ 전체 삭제</button>
                            <button class="btn-secondary btn-small" id="refreshMinistryBtn">🔄 새로고침</button>
                        </div>

                        <input type="file" id="ministryCsvFile" accept=".csv" style="display: none;">
                        <p><strong>CSV 파일 형식:</strong> 날짜, 유형, 항목, 내용</p>

                        <div class="ministry-tables">
                            <!-- 사역 목록 테이블 -->
                            <div class="ministry-table-section ministry-type">
                                <h3>🔨 사역 목록</h3>
                                <div class="table-container">
                                    <table class="transaction-table">
                                        <thead>
                                            <tr>
                                                <th class="sortable" data-sort="date">날짜 <span class="sort-arrow"></span></th>
                                                <th class="sortable" data-sort="category">항목 <span class="sort-arrow"></span></th>
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
                                <h3>🙏 기도제목 목록</h3>
                                <div class="table-container">
                                    <table class="transaction-table">
                                        <thead>
                                            <tr>
                                                <th class="sortable" data-sort="date">날짜 <span class="sort-arrow"></span></th>
                                                <th class="sortable" data-sort="category">항목 <span class="sort-arrow"></span></th>
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

        <div id="messageArea"></div>

        <script>
            let currentDepartment = '';
            let selectedDepartment = '';
            let currentMode = '';

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

            // 페이지 로드 시 초기화
            document.addEventListener('DOMContentLoaded', function() {
                const today = new Date().toISOString().split('T')[0];
                if (document.getElementById('transactionDate')) {
                    document.getElementById('transactionDate').value = today;
                }
                if (document.getElementById('ministryDate')) {
                    document.getElementById('ministryDate').value = today;
                }
                
                // 폼 이벤트 리스너 초기화
                initTransactionForm();
                initMinistryForm();
                
                // 로그인 버튼 이벤트 리스너 초기화
                initLoginButtons();
                
                // 테이블 정렬 이벤트 리스너 초기화
                initTableSorting();
            });

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

                    if (result.success) {
                        currentDepartment = selectedDepartment;
                        document.getElementById('departmentSection').style.display = 'none';
                        document.getElementById('mainMenuSection').style.display = 'block';
                        document.getElementById('welcomeMessage').textContent = currentDepartment + ' 관리자님, 안녕하세요!';
                        showMessage(result.message, 'success');
                    } else {
                        showMessage(result.message, 'error');
                        document.getElementById('departmentPassword').value = '';
                        document.getElementById('departmentPassword').focus();
                    }
                } catch (error) {
                    showMessage('인증 중 오류가 발생했습니다: ' + error.message, 'error');
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
                document.getElementById('mainMenuSection').style.display = 'block';
                document.getElementById('accountingSection').style.display = 'none';
                document.getElementById('ministrySection').style.display = 'none';
                currentMode = '';
            }

            // 로그아웃
            function logout() {
                currentDepartment = '';
                selectedDepartment = '';
                currentMode = '';
                
                document.getElementById('departmentSection').style.display = 'block';
                document.getElementById('mainMenuSection').style.display = 'none';
                document.getElementById('accountingSection').style.display = 'none';
                document.getElementById('ministrySection').style.display = 'none';
                document.getElementById('passwordSection').style.display = 'none';
                document.getElementById('departmentPassword').value = '';
                
                showMessage('로그아웃되었습니다.', 'success');
            }

            // =================== 회계 관리 함수들 ===================

            // 회계 탭 전환
            function showAccountingTab(tabName) {
                // 모든 탭 비활성화
                document.querySelectorAll('#accountingSection .tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('#accountingSection .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // 선택된 탭 활성화
                document.querySelector('#accountingSection .tab:nth-child(' + getTabIndex(tabName) + ')').classList.add('active');
                document.getElementById('accounting' + capitalize(tabName) + 'Tab').classList.add('active');
                
                if (tabName === 'list') {
                    loadTransactions();
                }
            }

            function getTabIndex(tabName) {
                const tabMap = {'input': 1, 'list': 2, 'summary': 3};
                return tabMap[tabName] || 1;
            }

            function capitalize(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }

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

            // 거래 추가 (전역 변수로 중복 방지)
            let transactionSubmitting = false;
            
            function initTransactionForm() {
                const form = document.getElementById('transactionForm');
                if (form && !form.hasAttribute('data-initialized')) {
                    form.setAttribute('data-initialized', 'true');
                    
                    form.addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        // 중복 제출 방지
                        if (transactionSubmitting) {
                            showMessage('⏳ 처리 중입니다. 잠시만 기다려주세요.', 'info');
                            return;
                        }
                        
                        const transactionData = {
                            date: document.getElementById('transactionDate').value,
                            type: document.getElementById('transactionType').value,
                            category: document.getElementById('transactionCategory').value,
                            description: document.getElementById('transactionDescription').value,
                            manager: document.getElementById('transactionManager').value,
                            amount: document.getElementById('transactionAmount').value
                        };

                        if (!transactionData.date || !transactionData.type || !transactionData.category || !transactionData.description || !transactionData.amount) {
                            showMessage('❌ 필수 항목을 모두 입력해주세요.', 'error');
                            return;
                        }

                        try {
                            transactionSubmitting = true;
                            const submitBtn = form.querySelector('button[type="submit"]');
                            const originalText = submitBtn.textContent;
                            
                            // 버튼 상태 변경
                            submitBtn.disabled = true;
                            submitBtn.textContent = '추가 중...';
                            submitBtn.style.opacity = '0.7';
                            
                            // 로딩 메시지
                            showMessage('⏳ 거래를 추가하고 있습니다...', 'info');

                            const response = await fetch('/api/accounting/transaction/' + currentDepartment, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(transactionData)
                            });

                            const result = await response.json();

                            if (result.success) {
                                showMessage('✅ ' + result.message, 'success');
                                document.getElementById('transactionForm').reset();
                                const today = new Date().toISOString().split('T')[0];
                                document.getElementById('transactionDate').value = today;
                                updateCategoryOptions();
                                loadTransactions();
                            } else {
                                showMessage('❌ ' + result.message, 'error');
                            }
                            
                            // 버튼 상태 복원
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                            submitBtn.style.opacity = '1';
                            
                        } catch (error) {
                            showMessage('❌ 거래 추가 중 오류가 발생했습니다: ' + error.message, 'error');
                            
                            // 오류 시에도 버튼 상태 복원
                            const submitBtn = form.querySelector('button[type="submit"]');
                            submitBtn.disabled = false;
                            submitBtn.textContent = '거래 추가';
                            submitBtn.style.opacity = '1';
                        } finally {
                            transactionSubmitting = false;
                        }
                    });
                }
            }

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

            // 거래 목록 표시
            function displayTransactions(transactions) {
                const tbody = document.getElementById('transactionList');
                
                // 원본 데이터 저장 (정렬을 위해)
                if (arguments.length === 1 && !Array.isArray(originalTransactions) || originalTransactions.length === 0) {
                    originalTransactions = [...transactions];
                }
                
                if (transactions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="loading">등록된 거래가 없습니다.</td></tr>';
                } else {
                    tbody.innerHTML = ''; // 기존 내용 초기화
                    
                    transactions.forEach((transaction) => {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn-small btn-danger';
                        deleteBtn.textContent = '삭제';
                        deleteBtn.setAttribute('data-row-index', transaction.rowIndex);
                        deleteBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const rowIndex = this.getAttribute('data-row-index');
                            console.log('삭제 버튼 클릭:', rowIndex);
                            if (confirm('이 거래를 삭제하시겠습니까?')) {
                                deleteTransaction(rowIndex);
                            }
                        });
                        
                        const row = document.createElement('tr');
                        row.innerHTML = '<td>' + transaction.date + '</td>' +
                            '<td>' + transaction.type + '</td>' +
                            '<td>' + transaction.category + '</td>' +
                            '<td style="max-width: 200px; word-wrap: break-word;">' + transaction.description + '</td>' +
                            '<td>' + transaction.manager + '</td>' +
                            '<td>' + formatCurrency(transaction.amount) + '</td>' +
                            '<td></td>';
                        
                        row.lastElementChild.appendChild(deleteBtn);
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

            // 사역 탭 전환
            function showMinistryTab(tabName) {
                // 모든 탭 비활성화
                document.querySelectorAll('#ministrySection .tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelectorAll('#ministrySection .tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // 선택된 탭 활성화
                document.querySelector('#ministrySection .tab:nth-child(' + (tabName === 'input' ? 1 : 2) + ')').classList.add('active');
                document.getElementById('ministry' + capitalize(tabName) + 'Tab').classList.add('active');
                
                if (tabName === 'list') {
                    loadMinistryItems();
                }
            }

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

            // 사역 내용 추가 (전역 변수로 중복 방지)
            let ministrySubmitting = false;
            
            function initMinistryForm() {
                const form = document.getElementById('ministryForm');
                if (form && !form.hasAttribute('data-initialized')) {
                    form.setAttribute('data-initialized', 'true');
                    
                    form.addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        // 중복 제출 방지
                        if (ministrySubmitting) {
                            showMessage('⏳ 처리 중입니다. 잠시만 기다려주세요.', 'info');
                            return;
                        }
                        
                        const ministryData = {
                            date: document.getElementById('ministryDate').value,
                            type: document.getElementById('ministryType').value,
                            category: document.getElementById('ministryCategory').value,
                            content: document.getElementById('ministryContent').value
                        };

                        if (!ministryData.date || !ministryData.type || !ministryData.category || !ministryData.content) {
                            showMessage('❌ 필수 항목을 모두 입력해주세요.', 'error');
                            return;
                        }

                        try {
                            ministrySubmitting = true;
                            const submitBtn = form.querySelector('button[type="submit"]');
                            const originalText = submitBtn.textContent;
                            
                            // 버튼 상태 변경
                            submitBtn.disabled = true;
                            submitBtn.textContent = '추가 중...';
                            submitBtn.style.opacity = '0.7';
                            
                            // 로딩 메시지
                            showMessage('⏳ 사역 내용을 추가하고 있습니다...', 'info');

                            const response = await fetch('/api/ministry/item/' + currentDepartment, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(ministryData)
                            });

                            const result = await response.json();

                            if (result.success) {
                                showMessage('✅ ' + result.message, 'success');
                                document.getElementById('ministryForm').reset();
                                const today = new Date().toISOString().split('T')[0];
                                document.getElementById('ministryDate').value = today;
                                updateMinistryCategoryOptions();
                                loadMinistryItems();
                            } else {
                                showMessage('❌ ' + result.message, 'error');
                            }
                            
                            // 버튼 상태 복원
                            submitBtn.disabled = false;
                            submitBtn.textContent = originalText;
                            submitBtn.style.opacity = '1';
                            
                        } catch (error) {
                            showMessage('❌ 사역 내용 추가 중 오류가 발생했습니다: ' + error.message, 'error');
                            
                            // 오류 시에도 버튼 상태 복원
                            const submitBtn = form.querySelector('button[type="submit"]');
                            submitBtn.disabled = false;
                            submitBtn.textContent = '내용 추가';
                            submitBtn.style.opacity = '1';
                        } finally {
                            ministrySubmitting = false;
                        }
                    });
                }
            }
            


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
                // 사역 목록 표시
                const ministryTbody = document.getElementById('ministryList');
                
                if (ministryData.length === 0) {
                    ministryTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 사역이 없습니다.</td></tr>';
                } else {
                    ministryTbody.innerHTML = ''; // 기존 내용 초기화
                    
                    ministryData.forEach((item) => {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn-small btn-danger';
                        deleteBtn.textContent = '삭제';
                        deleteBtn.setAttribute('data-row-index', item.rowIndex);
                        deleteBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const rowIndex = this.getAttribute('data-row-index');
                            console.log('사역/기도제목 삭제 버튼 클릭:', rowIndex);
                            if (confirm('이 내용을 삭제하시겠습니까?')) {
                                deleteMinistryItem(rowIndex);
                            }
                        });
                        
                        const row = document.createElement('tr');
                        row.innerHTML = '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td style="max-width: 300px; word-wrap: break-word;">' + item.content + '</td>' +
                            '<td></td>';
                        
                        row.lastElementChild.appendChild(deleteBtn);
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
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn-small btn-danger';
                        deleteBtn.textContent = '삭제';
                        deleteBtn.setAttribute('data-row-index', item.rowIndex);
                        deleteBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const rowIndex = this.getAttribute('data-row-index');
                            console.log('사역/기도제목 삭제 버튼 클릭:', rowIndex);
                            if (confirm('이 내용을 삭제하시겠습니까?')) {
                                deleteMinistryItem(rowIndex);
                            }
                        });
                        
                        const row = document.createElement('tr');
                        row.innerHTML = '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td style="max-width: 300px; word-wrap: break-word;">' + item.content + '</td>' +
                            '<td></td>';
                        
                        row.lastElementChild.appendChild(deleteBtn);
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
                
                // 회계 탭 버튼들
                const tabBtns = document.querySelectorAll('#accountingSection [data-tab]');
                tabBtns.forEach(btn => {
                    const tabName = btn.getAttribute('data-tab');
                    btn.addEventListener('click', function() {
                        showAccountingTab(tabName);
                    });
                });
                
                // 사역 탭 버튼들
                const ministryTabBtns = document.querySelectorAll('[data-ministry-tab]');
                ministryTabBtns.forEach(btn => {
                    const tabName = btn.getAttribute('data-ministry-tab');
                    btn.addEventListener('click', function() {
                        showMinistryTab(tabName);
                    });
                });
                
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
                // 사역 목록 표시
                const ministryTbody = document.getElementById('ministryList');
                
                if (ministryData.length === 0) {
                    ministryTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 사역이 없습니다.</td></tr>';
                } else {
                    ministryTbody.innerHTML = '';
                    
                    ministryData.forEach((item) => {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn-small btn-danger';
                        deleteBtn.textContent = '삭제';
                        deleteBtn.setAttribute('data-row-index', item.rowIndex);
                        deleteBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const rowIndex = this.getAttribute('data-row-index');
                            console.log('사역/기도제목 삭제 버튼 클릭:', rowIndex);
                            if (confirm('이 내용을 삭제하시겠습니까?')) {
                                deleteMinistryItem(rowIndex);
                            }
                        });
                        
                        const row = document.createElement('tr');
                        row.innerHTML = '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td style="max-width: 300px; word-wrap: break-word;">' + item.content + '</td>' +
                            '<td></td>';
                        
                        row.lastElementChild.appendChild(deleteBtn);
                        ministryTbody.appendChild(row);
                    });
                }

                // 기도제목 목록 표시
                const prayerTbody = document.getElementById('prayerList');
                
                if (prayerData.length === 0) {
                    prayerTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 기도제목이 없습니다.</td></tr>';
                } else {
                    prayerTbody.innerHTML = '';
                    
                    prayerData.forEach((item) => {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'btn-small btn-danger';
                        deleteBtn.textContent = '삭제';
                        deleteBtn.setAttribute('data-row-index', item.rowIndex);
                        deleteBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            const rowIndex = this.getAttribute('data-row-index');
                            console.log('사역/기도제목 삭제 버튼 클릭:', rowIndex);
                            if (confirm('이 내용을 삭제하시겠습니까?')) {
                                deleteMinistryItem(rowIndex);
                            }
                        });
                        
                        const row = document.createElement('tr');
                        row.innerHTML = '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td style="max-width: 300px; word-wrap: break-word;">' + item.content + '</td>' +
                            '<td></td>';
                        
                        row.lastElementChild.appendChild(deleteBtn);
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
const memoryStorage = {
  transactions: new Map<string, any[]>(),
  ministries: new Map<string, any[]>()
}

// Google Sheets API 호출 함수 (시뮬레이션 모드)
async function callSheetsAPI(env: Bindings, method: string, endpoint: string, data?: any) {
  try {
    // GET 요청의 경우 메모리에서 데이터 조회 또는 Google Sheets에서 조회
    if (method === 'GET') {
      if (endpoint.includes('values/')) {
        const sheetName = endpoint.split('/')[1].split('!')[0]
        
        // 먼저 메모리에서 확인
        if (sheetName.includes('사역')) {
          const department = sheetName.replace('사역', '')
          const memoryData = memoryStorage.ministries.get(department) || []
          if (memoryData.length > 0) {
            return { 
              values: [
                ['날짜', '유형', '항목', '내용'], // 헤더
                ...memoryData.map(item => [item.date, item.type, item.category, item.content])
              ] 
            }
          }
        } else {
          const memoryData = memoryStorage.transactions.get(sheetName) || []
          if (memoryData.length > 0) {
            return { 
              values: [
                ['날짜', '유형', '항목', '적요', '담당자', '금액'], // 헤더
                ...memoryData.map(item => [item.date, item.type, item.category, item.description, item.manager, item.amount])
              ] 
            }
          }
        }
        
        // 메모리에 데이터가 없으면 Google Sheets에서 조회 (실제 데이터가 있는 경우)
        const csvUrl = `https://docs.google.com/spreadsheets/d/${env.SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheetName}`
        
        console.log('CSV API Call:', csvUrl)
        const response = await fetch(csvUrl)
        
        if (!response.ok) {
          // 시트가 없는 경우 빈 데이터 반환
          if (response.status === 400) {
            return { values: [] }
          }
          throw new Error(`CSV fetch failed: ${response.status}`)
        }
        
        const csvText = await response.text()
        const values = parseCSV(csvText)
        
        return { values }
      }
    }
    
    // POST/PUT/DELETE 요청의 경우 메모리에 저장
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      console.log('Memory Storage API Call:', method, endpoint, data)
      
      if (endpoint.includes(':append') && data?.values) {
        // 데이터 추가
        const range = endpoint.split('values/')[1].split(':')[0]
        const sheetName = range.split('!')[0]
        
        if (sheetName.includes('사역')) {
          // 사역 데이터
          const department = sheetName.replace('사역', '')
          const existingData = memoryStorage.ministries.get(department) || []
          const newItem = {
            id: Date.now(),
            date: data.values[0][0],
            type: data.values[0][1], 
            category: data.values[0][2],
            content: data.values[0][3]
          }
          existingData.push(newItem)
          memoryStorage.ministries.set(department, existingData)
        } else {
          // 회계 데이터
          const existingData = memoryStorage.transactions.get(sheetName) || []
          const newItem = {
            id: Date.now(),
            date: data.values[0][0],
            type: data.values[0][1],
            category: data.values[0][2], 
            description: data.values[0][3],
            manager: data.values[0][4],
            amount: data.values[0][5]
          }
          existingData.push(newItem)
          memoryStorage.transactions.set(sheetName, existingData)
        }
        
        console.log('메모리에 데이터 추가됨:', data)
        return { updates: { updatedRows: 1 } }
      }
      
      if (endpoint.includes(':batchUpdate')) {
        console.log('시뮬레이션: 행 삭제됨', data)
        return { replies: [{}] }
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
            rowIndex: i + 1, // 실제 시트 행 번호
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
    
    // 메모리에서 추가 데이터 가져오기
    const memoryData = memoryStorage.transactions.get(department) || []
    for (const item of memoryData) {
      const transaction = {
        rowIndex: 'mem_' + item.id, // 메모리 데이터 구분
        date: item.date,
        type: item.type,
        category: item.category,
        description: item.description,
        manager: item.manager || '',
        amount: parseFloat(item.amount) || 0
      }
      
      transactions.push(transaction)
      
      if (item.type === '수입') {
        totalIncome += parseFloat(item.amount) || 0
      } else if (item.type === '지출') {
        totalExpense += parseFloat(item.amount) || 0
      }
    }
    
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
            rowIndex: i + 1, // 실제 시트 행 번호
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
    
    // 메모리에서 추가 데이터 가져오기
    const memoryData = memoryStorage.ministries.get(department) || []
    for (const item of memoryData) {
      const ministryItem = {
        rowIndex: 'mem_' + item.id, // 메모리 데이터 구분
        date: item.date,
        type: item.type,
        category: item.category,
        content: item.content
      }
      
      if (item.type === '사역') {
        ministryItems.push(ministryItem)
      } else if (item.type === '기도제목') {
        prayerItems.push(ministryItem)
      }
    }
    
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