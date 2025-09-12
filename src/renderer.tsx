import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title = '새순 교육부 통합 관리 시스템' }) => {
  return (
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <link href="/static/styles.css" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
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

            /* 기존 앱 화면들 */
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

            /* CSV 섹션 */
            .csv-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
            }

            .action-buttons {
              display: flex;
              gap: 15px;
              flex-wrap: wrap;
              margin: 20px 0;
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
          `
        }} />
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>🏫 새순 교육부 통합 관리 시스템</h1>
            <p>부서별 회계관리 및 사역관리 시스템</p>
          </div>
          
          <div className="main-content">
            {/* 부서 선택 화면 */}
            <div className="department-section" id="departmentSection">
              <h2>부서를 선택해주세요</h2>
              <div className="department-grid">
                <button className="department-card" onClick={() => selectDepartment('유아부')}>
                  👶 유아부
                </button>
                <button className="department-card" onClick={() => selectDepartment('유치부')}>
                  🧒 유치부  
                </button>
                <button className="department-card" onClick={() => selectDepartment('유년부')}>
                  🧑 유년부
                </button>
                <button className="department-card" onClick={() => selectDepartment('초등부')}>
                  👦 초등부
                </button>
                <button className="department-card" onClick={() => selectDepartment('중등부')}>
                  👨 중등부
                </button>
                <button className="department-card" onClick={() => selectDepartment('고등부')}>
                  👩 고등부
                </button>
                <button className="department-card" onClick={() => selectDepartment('영어예배부')}>
                  🌍 영어예배부
                </button>
              </div>

              <div className="password-section" id="passwordSection">
                <h3 id="selectedDepartmentName"></h3>
                <input 
                  type="password" 
                  className="password-input" 
                  id="departmentPassword" 
                  placeholder="비밀번호를 입력하세요"
                  onKeyPress={(e) => e.key === 'Enter' && authenticateDepartment()}
                />
                <br />
                <button className="btn-primary" onClick={() => authenticateDepartment()}>
                  로그인
                </button>
                <button className="btn-secondary" onClick={() => cancelDepartmentSelection()}>
                  취소
                </button>
              </div>
            </div>

            {/* 메인 메뉴 선택 화면 */}
            <div className="main-menu-section" id="mainMenuSection">
              <button className="back-btn" onClick={() => logout()}>← 부서 변경</button>
              
              <h2 id="welcomeMessage"></h2>
              <div className="menu-grid">
                <div className="menu-card accounting" onClick={() => showAccountingApp()}>
                  <h3>💰 회계 관리</h3>
                  <p>부서 예산 및 지출 관리<br/>수입/지출 내역 추적<br/>재정 현황 분석</p>
                </div>
                <div className="menu-card ministry" onClick={() => showMinistryApp()}>
                  <h3>📋 사역 관리</h3>
                  <p>사역 계획 및 실행 관리<br/>기도제목 관리<br/>사역 내용 기록</p>
                </div>
              </div>
            </div>

            {/* 기존 앱 화면들은 여기에 추가 */}
          </div>
        </div>

        <div id="messageArea"></div>

        <script dangerouslySetInnerHTML={{
          __html: `
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
              // TODO: 회계 앱 화면 구현
            }

            // 사역 앱 표시 
            function showMinistryApp() {
              currentMode = 'ministry';
              document.getElementById('mainMenuSection').style.display = 'none';
              // TODO: 사역 앱 화면 구현
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

            // 페이지 로드 시 초기화
            document.addEventListener('DOMContentLoaded', function() {
              // 초기 화면 설정
            });
          `
        }} />
      </body>
    </html>
  )
})