// 완전히 새로운 이벤트 시스템 - ChatGPT 솔루션 구현

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
const newOpToken = () => `op_${uid()}`;

// 초기화(단 한 번만)
function initOnce() {
    if (state.initialized) {
        console.log('⚠️ 이미 초기화된 상태 - 중복 초기화 방지');
        return;
    }
    state.initialized = true;
    console.log('🚀 시스템 초기화 시작 (단일 초기화)');
    
    // 폼 submit만 사용, 버튼 click 핸들러는 제거
    const accountForm = document.getElementById('transactionForm');
    if (accountForm) {
        accountForm.addEventListener('submit', onAddTransaction);
    }
    
    const ministryForm = document.getElementById('ministryForm');
    if (ministryForm) {
        ministryForm.addEventListener('submit', onAddMinistry);
    }
    
    // 동적 버튼들(수정/삭제/취소)은 body에 위임
    document.body.addEventListener('click', onDelegatedClick);
    
    console.log('✅ 시스템 초기화 완료');
}

// 거래 추가 (폼 submit만)
async function onAddTransaction(e) {
    e.preventDefault();
    if (state.isSubmitting) {
        console.log('⚠️ 중복 제출 방지됨');
        return;
    }
    
    state.isSubmitting = true;
    
    try {
        const form = e.currentTarget;
        const formData = new FormData(form);
        const rec = {
            id: uid(),
            op: newOpToken(),
            date: formData.get('date'),
            type: formData.get('type'),
            category: formData.get('category'),
            description: formData.get('description'),
            manager: formData.get('manager'),
            amount: Number(formData.get('amount') || 0)
        };
        
        // 중복 방지: 같은 op 토큰이면 무시
        if (state.seenOps.has(rec.op)) {
            console.log('⚠️ 중복 작업 토큰 - 무시됨');
            return;
        }
        state.seenOps.add(rec.op);
        
        console.log('💰 거래 추가 API 호출:', rec);
        
        const response = await fetch(`/api/accounting/transaction/${currentDepartment}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rec)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✅ ' + result.message, 'success');
            
            // 폼 초기화 (내용만 초기화)
            form.querySelector('[name="description"]').value = '';
            form.querySelector('[name="manager"]').value = '';
            form.querySelector('[name="amount"]').value = '';
            form.querySelector('[name="description"]').focus();
            
            // 목록 새로고침
            loadTransactions();
        } else {
            showMessage('❌ ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('거래 추가 오류:', error);
        showMessage('❌ 거래 추가 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
        state.isSubmitting = false;
    }
}

// 사역 추가 (폼 submit만)
async function onAddMinistry(e) {
    e.preventDefault();
    if (state.isSubmitting) {
        console.log('⚠️ 중복 제출 방지됨');
        return;
    }
    
    state.isSubmitting = true;
    
    try {
        const form = e.currentTarget;
        const formData = new FormData(form);
        const rec = {
            id: uid(),
            op: newOpToken(),
            date: formData.get('date'),
            type: formData.get('type'),
            category: formData.get('category'),
            content: formData.get('content')
        };
        
        // 중복 방지: 같은 op 토큰이면 무시
        if (state.seenOps.has(rec.op)) {
            console.log('⚠️ 중복 작업 토큰 - 무시됨');
            return;
        }
        state.seenOps.add(rec.op);
        
        console.log('📋 사역 추가 API 호출:', rec);
        
        const response = await fetch(`/api/ministry/item/${currentDepartment}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rec)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✅ ' + result.message, 'success');
            
            // 내용만 초기화 (날짜/유형/항목 유지)
            form.querySelector('[name="content"]').value = '';
            form.querySelector('[name="content"]').focus();
            
            // 목록 새로고침
            loadMinistryItems();
        } else {
            showMessage('❌ ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('사역 추가 오류:', error);
        showMessage('❌ 사역 추가 중 오류가 발생했습니다: ' + error.message, 'error');
    } finally {
        state.isSubmitting = false;
    }
}

// 위임 클릭 (수정/삭제/취소)
function onDelegatedClick(e) {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    const cancelBtn = e.target.closest('[data-action="cancel-edit"]');
    
    if (!editBtn && !deleteBtn && !cancelBtn) return;
    
    if (editBtn) {
        const id = editBtn.dataset.id;
        const type = editBtn.dataset.type || 'transaction';
        console.log('✏️ 수정 버튼 클릭:', type, id);
        
        if (type === 'transaction') {
            editTransaction(id);
        } else if (type === 'ministry') {
            editMinistry(id);
        }
    }
    
    if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const type = deleteBtn.dataset.type || 'transaction';
        console.log('🗑️ 삭제 버튼 클릭:', type, id);
        
        if (!confirm('정말 삭제하시겠습니까?')) return;
        
        if (type === 'transaction') {
            deleteTransaction(id);
        } else if (type === 'ministry') {
            deleteMinistry(id);
        }
    }
    
    if (cancelBtn) {
        console.log('❌ 취소 버튼 클릭');
        cancelEdit();
    }
}

// 거래 수정
function editTransaction(id) {
    // 수정 로직 구현
    console.log('거래 수정 모드 진입:', id);
    state.editState = { type: 'transaction', id };
}

// 거래 삭제
async function deleteTransaction(id) {
    try {
        const response = await fetch(`/api/accounting/transaction/${currentDepartment}/${encodeURIComponent(id)}`, {
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

// 사역 수정
function editMinistry(id) {
    console.log('사역 수정 모드 진입:', id);
    state.editState = { type: 'ministry', id };
}

// 사역 삭제
async function deleteMinistry(id) {
    try {
        const response = await fetch(`/api/ministry/item/${currentDepartment}/${encodeURIComponent(id)}`, {
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
    // 폼을 일반 모드로 되돌리기
    console.log('수정 모드 취소됨');
}

// 시작
document.addEventListener('DOMContentLoaded', initOnce);