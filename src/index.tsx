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
            </div>
        </div>

        <div id="messageArea"></div>

        <script>
            let currentDepartment = '';
            let selectedDepartment = '';
            let currentMode = '';

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
                showMessage('회계 관리 시스템 (준비 중...)', 'success');
            }

            // 사역 앱 표시 
            function showMinistryApp() {
                currentMode = 'ministry';
                showMessage('사역 관리 시스템 (준비 중...)', 'success');
            }

            // 로그아웃
            function logout() {
                currentDepartment = '';
                selectedDepartment = '';
                currentMode = '';
                
                document.getElementById('departmentSection').style.display = 'block';
                document.getElementById('mainMenuSection').style.display = 'none';
                document.getElementById('passwordSection').style.display = 'none';
                document.getElementById('departmentPassword').value = '';
                
                showMessage('로그아웃되었습니다.', 'success');
            }

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

// Google Sheets API 호출 함수
async function callSheetsAPI(env: Bindings, method: string, url: string, data?: any) {
  try {
    // Google Service Account 키 파싱
    const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY)
    
    // JWT 토큰 생성 (간단한 구현)
    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }
    
    // 실제로는 JWT 라이브러리를 사용해야 하지만, 
    // Cloudflare Workers에서 간단한 구현을 위해 fetch로 대체
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: 'jwt-token-here' // 실제로는 JWT 생성 필요
      })
    })
    
    // 간단한 API 키 방식으로 대체 (실제 배포시 수정 필요)
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${env.GOOGLE_SERVICE_ACCOUNT_KEY}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    })
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Sheets API Error:', error)
    throw error
  }
}

// 거래 추가
app.post('/api/accounting/transaction/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    const transactionData = await c.req.json()
    
    // Google Sheets API를 통해 데이터 추가
    const spreadsheetId = env.SPREADSHEET_ID
    const range = `${department}!A:F`
    
    const values = [[
      transactionData.date,
      transactionData.type,
      transactionData.category,
      transactionData.description || '',
      transactionData.manager || '',
      parseFloat(transactionData.amount)
    ]]
    
    // 실제 Google Sheets API 호출은 여기서 구현
    // 현재는 성공 응답만 반환
    
    return c.json({ 
      success: true, 
      message: '거래가 성공적으로 추가되었습니다.' 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: '거래 추가 중 오류가 발생했습니다: ' + error 
    }, 500)
  }
})

// 거래 목록 조회
app.get('/api/accounting/transactions/:department', async (c) => {
  try {
    const { env } = c
    const department = c.req.param('department')
    
    // Google Sheets API를 통해 데이터 조회
    const spreadsheetId = env.SPREADSHEET_ID
    const range = `${department}!A:F`
    
    // 실제 Google Sheets API 호출은 여기서 구현
    // 현재는 더미 데이터 반환
    const dummyTransactions = [
      {
        rowIndex: 2,
        date: '2024-01-15',
        type: '수입',
        category: '후원금',
        description: '1월 후원금',
        manager: '김담임',
        amount: 50000
      }
    ]
    
    const summary = {
      income: 50000,
      expense: 0,
      balance: 50000
    }
    
    return c.json({ 
      success: true, 
      data: dummyTransactions,
      summary
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: '거래 조회 중 오류가 발생했습니다: ' + error 
    }, 500)
  }
})

// 거래 삭제
app.delete('/api/accounting/transaction/:department/:rowIndex', async (c) => {
  try {
    const department = c.req.param('department')
    const rowIndex = c.req.param('rowIndex')
    
    // Google Sheets API를 통해 행 삭제
    // 실제 구현 필요
    
    return c.json({ 
      success: true, 
      message: '거래가 삭제되었습니다.' 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: '거래 삭제 중 오류가 발생했습니다: ' + error 
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
    
    // Google Sheets API를 통해 데이터 추가
    const values = [[
      ministryData.date,
      ministryData.type,
      ministryData.category,
      ministryData.content || ''
    ]]
    
    // 실제 구현 필요
    
    return c.json({ 
      success: true, 
      message: '사역 내용이 성공적으로 추가되었습니다.' 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: '사역 내용 추가 중 오류가 발생했습니다: ' + error 
    }, 500)
  }
})

// 사역 목록 조회
app.get('/api/ministry/items/:department', async (c) => {
  try {
    const department = c.req.param('department')
    
    // 더미 데이터 반환 (실제로는 Google Sheets API 호출)
    const dummyMinistry = [
      {
        rowIndex: 2,
        date: '2024-01-15',
        type: '사역',
        category: '연례행사',
        content: '새해 예배 준비'
      }
    ]
    
    const dummyPrayer = [
      {
        rowIndex: 3,
        date: '2024-01-15', 
        type: '기도제목',
        category: '기도제목',
        content: '아이들의 건강한 성장을 위해'
      }
    ]
    
    return c.json({
      success: true,
      ministryData: dummyMinistry,
      prayerData: dummyPrayer
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: '사역 목록 조회 중 오류가 발생했습니다: ' + error 
    }, 500)
  }
})

// 사역 항목 삭제
app.delete('/api/ministry/item/:department/:rowIndex', async (c) => {
  try {
    const department = c.req.param('department')
    const rowIndex = c.req.param('rowIndex')
    
    // Google Sheets API를 통해 행 삭제
    // 실제 구현 필요
    
    return c.json({ 
      success: true, 
      message: '사역 내용이 삭제되었습니다.' 
    })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: '사역 삭제 중 오류가 발생했습니다: ' + error 
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
    
    const prompt = `다음 거래 데이터를 분석해주세요:
    날짜: ${transactionData.date}
    유형: ${transactionData.type}
    항목: ${transactionData.category}
    적요: ${transactionData.description}
    금액: ${transactionData.amount}
    
    이 거래가 적절한지 간단히 분석해주세요.`
    
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
    return c.json({ success: true, analysis: result })
  } catch (error) {
    return c.json({ 
      success: false, 
      message: 'AI 분석 중 오류가 발생했습니다: ' + error 
    }, 500)
  }
})

export default app