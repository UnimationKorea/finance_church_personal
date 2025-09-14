// 새순 교육부 로그인 테스트
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  try {
    const page = await browser.newPage();
    
    // 콘솔 로그 수집
    page.on('console', msg => console.log('브라우저 콘솔:', msg.text()));
    page.on('pageerror', error => console.log('페이지 에러:', error.message));
    
    // 애플리케이션 페이지 로드
    console.log('🌐 애플리케이션 로딩 중...');
    await page.goto('https://3000-izqhfvhjjh1h605pldlq5-6532622b.e2b.dev', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ 페이지 로드 완료');
    
    // 부서 선택 버튼 대기 및 클릭
    console.log('🏢 유아부 버튼 대기 중...');
    await page.waitForSelector('[data-department="유아부"]', { timeout: 10000 });
    
    console.log('👶 유아부 선택');
    await page.click('[data-department="유아부"]');
    
    // 비밀번호 입력 필드 대기
    console.log('🔐 비밀번호 입력 필드 대기 중...');
    await page.waitForSelector('#departmentPassword', { timeout: 5000 });
    
    console.log('📝 비밀번호 입력: 1234');
    await page.type('#departmentPassword', '1234');
    
    // 로그인 버튼 클릭
    console.log('🔍 로그인 버튼 대기 중...');
    await page.waitForSelector('#loginBtn', { timeout: 5000 });
    
    console.log('🔐 로그인 버튼 클릭');
    await page.click('#loginBtn');
    
    // 메인 메뉴 대기
    console.log('🏠 메인 메뉴 대기 중...');
    await page.waitForSelector('#mainMenuSection', { timeout: 10000 });
    
    // 메인 메뉴가 표시되는지 확인
    const isMainMenuVisible = await page.evaluate(() => {
      const mainMenu = document.getElementById('mainMenuSection');
      return mainMenu && mainMenu.style.display !== 'none';
    });
    
    if (isMainMenuVisible) {
      console.log('🎉 로그인 성공! 메인 메뉴가 표시됩니다.');
      
      // 회계 관리 버튼 클릭 테스트
      console.log('💰 회계 관리 버튼 클릭 테스트');
      await page.click('.menu-card[data-action="accounting"]');
      
      // 회계 섹션 대기
      await page.waitForSelector('#accountingSection', { timeout: 5000 });
      
      const isAccountingVisible = await page.evaluate(() => {
        const accounting = document.getElementById('accountingSection');
        return accounting && accounting.style.display !== 'none';
      });
      
      if (isAccountingVisible) {
        console.log('✅ 회계 관리 화면 접근 성공!');
      } else {
        console.log('❌ 회계 관리 화면 접근 실패');
      }
      
    } else {
      console.log('❌ 로그인 실패 - 메인 메뉴가 표시되지 않습니다.');
    }
    
  } catch (error) {
    console.log('❌ 테스트 중 오류:', error.message);
  } finally {
    await browser.close();
  }
})();