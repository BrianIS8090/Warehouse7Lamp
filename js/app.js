// --- NAVIGATION ---
function switchTab(t) { 
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden')); 
    document.getElementById(`view-${t}`).classList.remove('hidden'); 
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active')); 
    const btn = document.getElementById(`tab-${t}`); 
    if(btn) btn.classList.add('active'); 
    
    // Обновляем активное состояние в выпадающем меню
    document.querySelectorAll('#dropdownMenu button').forEach(el => el.classList.remove('bg-blue-50', 'dark:bg-blue-900/20'));
    const menuBtn = document.getElementById(`menu-tab-${t}`);
    if(menuBtn) menuBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
    
    // Закрываем выпадающее меню при переключении вкладок
    if (typeof closeDropdownMenu === 'function') {
        closeDropdownMenu();
    }
    
    if(t==='projects') renderProjects(); 
    if(t==='specs') renderSpecProjectList(); 
    if(t==='warehouse') {
        renderCategoryList(); 
        updatePaginationButtons(); // Обновляем кнопки при переключении на вкладку
        renderWarehouse();
    } 
    if(t==='movements') {
        renderHistoryTable();
        renderMovementsItemsTable();
    } 
    if(t==='dashboard') renderDashboard(); 
}

// Инициализация активного состояния меню при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Находим активную вкладку
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        const tabId = activeTab.id;
        if (tabId) {
            const tabName = tabId.replace('tab-', '');
            const menuBtn = document.getElementById(`menu-tab-${tabName}`);
            if (menuBtn) {
                menuBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            }
        }
    }
});

// Закрытие выпадающего меню при клике вне его
document.addEventListener('click', function(event) {
    const dropdownMenu = document.getElementById('dropdownMenu');
    const dropdownMenuBtn = document.getElementById('dropdownMenuBtn');
    
    if (dropdownMenu && dropdownMenuBtn && !dropdownMenu.contains(event.target) && !dropdownMenuBtn.contains(event.target)) {
        if (typeof closeDropdownMenu === 'function') {
            closeDropdownMenu();
        }
    }
});
