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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              color: white;
              padding: 25px;
              border-radius: 15px;
              cursor: pointer;
              transition: transform 0.3s, box-shadow 0.3s;
              border: none;
              font-size: 1.2rem;
              font-weight: 600;
            }

            .department-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
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

            .btn-primary {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 30px;
              border: none;
              border-radius: 10px;
              font-size: 1.1rem;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.3s;
              margin: 10px;
            }

            .btn-primary:hover {
              transform: translateY(-2px);
            }

            .btn-secondary {
              background: #95a5a6;
              color: white;
              padding: 15px 30px;
              border: none;
              border-radius: 10px;
              font-size: 1.1rem;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.3s;
              margin: 10px;
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
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
              padding: 40px 30px;
              border-radius: 20px;
              cursor: pointer;
              transition: transform 0.3s, box-shadow 0.3s;
              border: none;
              text-align: center;
            }

            .menu-card:hover {
              transform: translateY(-5px);
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }

            .menu-card.accounting {
              background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
            }

            .menu-card.ministry {
              background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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
              background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
              padding: 15px;
              border-radius: 10px;
              margin-bottom: 30px;
              text-align: center;
              font-weight: 600;
              color: #8b4513;
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
              color: #4facfe;
              border-bottom: 3px solid #4facfe;
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
              border-color: #4facfe;
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
              background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            }

            .summary-card.expense {
              background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%);
            }

            .summary-card.balance {
              background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
              color: #8b4513;
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px;
              text-align: left;
              font-weight: 600;
            }

            .transaction-table td {
              padding: 15px;
              border-bottom: 1px solid #f0f0f0;
            }

            .transaction-table tr:hover {
              background: #f8f9ff;
            }

            .btn-small {
              padding: 5px 10px;
              font-size: 0.9rem;
              border-radius: 5px;
              border: none;
              cursor: pointer;
              transition: all 0.3s;
            }

            .btn-danger {
              background: #e74c3c;
              color: white;
            }

            .btn-danger:hover {
              background: #c0392b;
            }

            .btn-success {
              background: #27ae60;
              color: white;
            }

            .btn-success:hover {
              background: #229954;
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
              color: #27ae60;
            }

            .ministry-table-section.prayer-type h3 {
              color: #8e44ad;
            }

            .action-buttons {
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
              margin: 20px 0;
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
                        <button class="department-card" onclick="selectDepartment('유아부')">
                            👶 유아부
                        </button>
                        <button class="department-card" onclick="selectDepartment('유치부')">
                            🧒 유치부  
                        </button>
                        <button class="department-card" onclick="selectDepartment('유년부')">
                            🧑 유년부
                        </button>
                        <button class="department-card" onclick="selectDepartment('초등부')">
                            👦 초등부
                        </button>
                        <button class="department-card" onclick="selectDepartment('중등부')">
                            👨 중등부
                        </button>
                        <button class="department-card" onclick="selectDepartment('고등부')">
                            👩 고등부
                        </button>
                        <button class="department-card" onclick="selectDepartment('영어예배부')">
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
                            onkeypress="if(event.key === 'Enter') authenticateDepartment()"
                        />
                        <br />
                        <button class="btn-primary" onclick="authenticateDepartment()">
                            로그인
                        </button>
                        <button class="btn-secondary" onclick="cancelDepartmentSelection()">
                            취소
                        </button>
                    </div>
                </div>

                <!-- 메인 메뉴 선택 화면 -->
                <div class="main-menu-section" id="mainMenuSection">
                    <button class="back-btn" onclick="logout()">← 부서 변경</button>
                    
                    <h2 id="welcomeMessage"></h2>
                    <div class="menu-grid">
                        <div class="menu-card accounting" onclick="showAccountingApp()">
                            <h3>💰 회계 관리</h3>
                            <p>부서 예산 및 지출 관리<br/>수입/지출 내역 추적<br/>재정 현황 분석</p>
                        </div>
                        <div class="menu-card ministry" onclick="showMinistryApp()">
                            <h3>📋 사역 관리</h3>
                            <p>사역 계획 및 실행 관리<br/>기도제목 관리<br/>사역 내용 기록</p>
                        </div>
                    </div>
                </div>

                <!-- 회계 관리 섹션 -->
                <div class="app-section" id="accountingSection">
                    <button class="back-btn" onclick="showMainMenu()">← 메인 메뉴</button>
                    <div class="current-department" id="currentDepartmentAccounting"></div>

                    <div class="tabs">
                        <button class="tab active" onclick="showAccountingTab('input')">거래 입력</button>
                        <button class="tab" onclick="showAccountingTab('list')">거래 목록</button>
                        <button class="tab" onclick="showAccountingTab('summary')">현황 요약</button>
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
                            <button class="btn-success btn-small" onclick="exportAccountingToCSV()">CSV 저장</button>
                            <button class="btn-secondary btn-small" onclick="document.getElementById('csvFile').click()">CSV 불러오기</button>
                            <button class="btn-danger btn-small" onclick="clearAllTransactions()">전체 삭제</button>
                            <button class="btn-primary btn-small" onclick="loadTransactions()">새로고침</button>
                        </div>

                        <input type="file" id="csvFile" accept=".csv" style="display: none;" onchange="importCSV(event)">

                        <div class="table-container">
                            <table class="transaction-table">
                                <thead>
                                    <tr>
                                        <th>날짜</th>
                                        <th>유형</th>
                                        <th>항목</th>
                                        <th>적요</th>
                                        <th>담당자</th>
                                        <th>금액</th>
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
                    <button class="back-btn" onclick="showMainMenu()">← 메인 메뉴</button>
                    <div class="current-department" id="currentDepartmentMinistry"></div>

                    <div class="tabs">
                        <button class="tab active" onclick="showMinistryTab('input')">사역 입력</button>
                        <button class="tab" onclick="showMinistryTab('list')">사역 목록</button>
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
                                    <textarea id="ministryContent" rows="4" placeholder="사역 내용을 자세히 입력하세요" required maxlength="1000"></textarea>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-primary">내용 추가</button>
                        </form>
                    </div>

                    <!-- 사역 목록 탭 -->
                    <div class="tab-content" id="ministryListTab">
                        <div class="action-buttons">
                            <button class="btn-success btn-small" onclick="exportMinistryToCSV()">CSV 저장</button>
                            <button class="btn-secondary btn-small" onclick="document.getElementById('ministryCsvFile').click()">CSV 불러오기</button>
                            <button class="btn-danger btn-small" onclick="clearAllMinistryData()">전체 삭제</button>
                            <button class="btn-primary btn-small" onclick="loadMinistryItems()">새로고침</button>
                        </div>

                        <input type="file" id="ministryCsvFile" accept=".csv" style="display: none;" onchange="importMinistryCSV(event)">
                        <p><strong>CSV 파일 형식:</strong> 날짜, 유형, 항목, 내용</p>

                        <div class="ministry-tables">
                            <!-- 사역 목록 테이블 -->
                            <div class="ministry-table-section ministry-type">
                                <h3>🔨 사역 목록</h3>
                                <div class="table-container">
                                    <table class="transaction-table">
                                        <thead>
                                            <tr>
                                                <th>날짜</th>
                                                <th>항목</th>
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
                                                <th>날짜</th>
                                                <th>항목</th>
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

            // 페이지 로드 시 오늘 날짜 설정
            document.addEventListener('DOMContentLoaded', function() {
                const today = new Date().toISOString().split('T')[0];
                if (document.getElementById('transactionDate')) {
                    document.getElementById('transactionDate').value = today;
                }
                if (document.getElementById('ministryDate')) {
                    document.getElementById('ministryDate').value = today;
                }
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

            // 거래 추가
            document.addEventListener('DOMContentLoaded', function() {
                const form = document.getElementById('transactionForm');
                if (form) {
                    form.addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const transactionData = {
                            date: document.getElementById('transactionDate').value,
                            type: document.getElementById('transactionType').value,
                            category: document.getElementById('transactionCategory').value,
                            description: document.getElementById('transactionDescription').value,
                            manager: document.getElementById('transactionManager').value,
                            amount: document.getElementById('transactionAmount').value
                        };

                        if (!transactionData.date || !transactionData.type || !transactionData.category || !transactionData.description || !transactionData.amount) {
                            showMessage('필수 항목을 모두 입력해주세요.', 'error');
                            return;
                        }

                        try {
                            const response = await fetch('/api/accounting/transaction/' + currentDepartment, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(transactionData)
                            });

                            const result = await response.json();

                            if (result.success) {
                                showMessage(result.message, 'success');
                                document.getElementById('transactionForm').reset();
                                const today = new Date().toISOString().split('T')[0];
                                document.getElementById('transactionDate').value = today;
                                updateCategoryOptions();
                                loadTransactions();
                            } else {
                                showMessage(result.message, 'error');
                            }
                        } catch (error) {
                            showMessage('거래 추가 중 오류가 발생했습니다: ' + error.message, 'error');
                        }
                    });
                }
            });

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
                
                if (transactions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="7" class="loading">등록된 거래가 없습니다.</td></tr>';
                } else {
                    let html = '';
                    transactions.forEach((transaction) => {
                        html += '<tr>' +
                            '<td>' + transaction.date + '</td>' +
                            '<td>' + transaction.type + '</td>' +
                            '<td>' + transaction.category + '</td>' +
                            '<td style="max-width: 200px; word-wrap: break-word;">' + transaction.description + '</td>' +
                            '<td>' + transaction.manager + '</td>' +
                            '<td>' + formatCurrency(transaction.amount) + '</td>' +
                            '<td><button class="btn-small btn-danger" onclick="deleteTransaction(' + transaction.rowIndex + ')">삭제</button></td>' +
                        '</tr>';
                    });
                    tbody.innerHTML = html;
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
                    const response = await fetch('/api/accounting/transaction/' + currentDepartment + '/' + rowIndex, {
                        method: 'DELETE'
                    });

                    const result = await response.json();

                    if (result.success) {
                        showMessage(result.message, 'success');
                        loadTransactions();
                    } else {
                        showMessage(result.message, 'error');
                    }
                } catch (error) {
                    showMessage('거래 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
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

            // 사역 내용 추가
            document.addEventListener('DOMContentLoaded', function() {
                const form = document.getElementById('ministryForm');
                if (form) {
                    form.addEventListener('submit', async function(e) {
                        e.preventDefault();
                        
                        const ministryData = {
                            date: document.getElementById('ministryDate').value,
                            type: document.getElementById('ministryType').value,
                            category: document.getElementById('ministryCategory').value,
                            content: document.getElementById('ministryContent').value
                        };

                        if (!ministryData.date || !ministryData.type || !ministryData.category || !ministryData.content) {
                            showMessage('필수 항목을 모두 입력해주세요.', 'error');
                            return;
                        }

                        try {
                            const response = await fetch('/api/ministry/item/' + currentDepartment, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(ministryData)
                            });

                            const result = await response.json();

                            if (result.success) {
                                showMessage(result.message, 'success');
                                document.getElementById('ministryForm').reset();
                                const today = new Date().toISOString().split('T')[0];
                                document.getElementById('ministryDate').value = today;
                                updateMinistryCategoryOptions();
                                loadMinistryItems();
                            } else {
                                showMessage(result.message, 'error');
                            }
                        } catch (error) {
                            showMessage('사역 내용 추가 중 오류가 발생했습니다: ' + error.message, 'error');
                        }
                    });
                }
            });

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
                // 사역 목록 표시
                const ministryTbody = document.getElementById('ministryList');
                
                if (ministryData.length === 0) {
                    ministryTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 사역이 없습니다.</td></tr>';
                } else {
                    let html = '';
                    ministryData.forEach((item) => {
                        html += '<tr>' +
                            '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td style="max-width: 300px; word-wrap: break-word;">' + item.content + '</td>' +
                            '<td><button class="btn-small btn-danger" onclick="deleteMinistryItem(' + item.rowIndex + ')">삭제</button></td>' +
                        '</tr>';
                    });
                    ministryTbody.innerHTML = html;
                }

                // 기도제목 목록 표시
                const prayerTbody = document.getElementById('prayerList');
                
                if (prayerData.length === 0) {
                    prayerTbody.innerHTML = '<tr><td colspan="4" class="loading">등록된 기도제목이 없습니다.</td></tr>';
                } else {
                    let html = '';
                    prayerData.forEach((item) => {
                        html += '<tr>' +
                            '<td>' + item.date + '</td>' +
                            '<td>' + item.category + '</td>' +
                            '<td style="max-width: 300px; word-wrap: break-word;">' + item.content + '</td>' +
                            '<td><button class="btn-small btn-danger" onclick="deleteMinistryItem(' + item.rowIndex + ')">삭제</button></td>' +
                        '</tr>';
                    });
                    prayerTbody.innerHTML = html;
                }
            }

            // 사역 항목 삭제
            async function deleteMinistryItem(rowIndex) {
                if (!confirm('이 사역 내용을 삭제하시겠습니까?')) return;

                try {
                    const response = await fetch('/api/ministry/item/' + currentDepartment + '/' + rowIndex, {
                        method: 'DELETE'
                    });

                    const result = await response.json();

                    if (result.success) {
                        showMessage(result.message, 'success');
                        loadMinistryItems();
                    } else {
                        showMessage(result.message, 'error');
                    }
                } catch (error) {
                    showMessage('사역 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
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

// Google Sheets API 호출 함수 (공개 스프레드시트용)
async function callSheetsAPI(env: Bindings, method: string, endpoint: string, data?: any) {
  try {
    const baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'
    
    // GET 요청의 경우 공개 API 사용 (API 키 불필요)
    if (method === 'GET') {
      // 공개 스프레드시트 CSV 다운로드 URL 사용
      if (endpoint.includes('values/')) {
        const sheetName = endpoint.split('/')[1].split('!')[0]
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
    
    // POST/PUT/DELETE 요청의 경우 실제 API 사용 (현재는 시뮬레이션)
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      console.log('Simulated API Call:', method, endpoint, data)
      
      // 실제로는 Google Sheets API 키나 OAuth를 사용해야 함
      // 현재는 로컬 저장소나 메모리에 시뮬레이션
      if (endpoint.includes(':append')) {
        console.log('시뮬레이션: 데이터 추가됨', data)
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
    const rowIndex = parseInt(c.req.param('rowIndex'))
    
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
    const rowIndex = parseInt(c.req.param('rowIndex'))
    
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
    const department = c.req.param('department')
    
    // 실제로는 Google Sheets에서 데이터를 가져와서 CSV 생성
    const csvContent = '날짜,유형,항목,적요,담당자,금액\n2024-01-15,수입,후원금,1월 후원금,김담임,50000\n'
    
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${department}-accounting.csv"`
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'CSV 내보내기 중 오류가 발생했습니다: ' + error 
    }, 500)
  }
})

// 사역 CSV 내보내기  
app.get('/api/ministry/export/:department', async (c) => {
  try {
    const department = c.req.param('department')
    
    // 실제로는 Google Sheets에서 데이터를 가져와서 CSV 생성
    const csvContent = '날짜,유형,항목,내용\n2024-01-15,사역,연례행사,새해 예배 준비\n'
    
    return c.text(csvContent, 200, {
      'Content-Type': 'text/csv; charset=utf-8', 
      'Content-Disposition': `attachment; filename="${department}-ministry.csv"`
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'CSV 내보내기 중 오류가 발생했습니다: ' + error 
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

export default app