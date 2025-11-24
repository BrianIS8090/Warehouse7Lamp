// --- NAVIGATION ---
function switchTab(t) { 
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden')); 
    document.getElementById(`view-${t}`).classList.remove('hidden'); 
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active')); 
    const btn = document.getElementById(`tab-${t}`); 
    if(btn) btn.classList.add('active'); 
    
    if(t==='projects') renderProjects(); 
    if(t==='specs') renderSpecProjectList(); 
    if(t==='warehouse') {
        renderCategoryList(); 
        updatePaginationButtons(); // Обновляем кнопки при переключении на вкладку
        renderWarehouse();
    } 
    if(t==='movements') renderHistoryTable(); 
    if(t==='dashboard') renderDashboard(); 
}
