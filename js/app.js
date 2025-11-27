// --- NAVIGATION ---
function switchTab(t) { 
    // Скрываем все страницы
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
    }); 
    
    // Показываем выбранную страницу
    const targetView = document.getElementById(`view-${t}`);
    if(targetView) {
        targetView.classList.remove('hidden');
    }
    
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active')); 
    const btn = document.getElementById(`tab-${t}`); 
    if(btn) btn.classList.add('active'); 
    
    // Обновляем активное состояние в выпадающем меню
    document.querySelectorAll('#dropdownMenu button').forEach(el => el.classList.remove('bg-blue-50', 'dark:bg-blue-900/20'));
    const menuBtn = document.getElementById(`menu-tab-${t}`);
    if(menuBtn) menuBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
    
    // Обновляем активное состояние в мобильном меню
    document.querySelectorAll('#mobileMenu button').forEach(el => el.classList.remove('bg-blue-50', 'dark:bg-blue-900/20'));
    const mobileMenuBtn = document.getElementById(`mobile-menu-${t}`);
    if(mobileMenuBtn) mobileMenuBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
    
    // Закрываем выпадающее меню при переключении вкладок
    if (typeof closeDropdownMenu === 'function') {
        closeDropdownMenu();
    }
    if (typeof closeMobileMenu === 'function') {
        closeMobileMenu();
    }
    
    if(t==='projects') renderProjects(); 
    if(t==='specs') renderSpecProjectList();
    if(t==='commercial') renderCommercialRequestsList();
    if(t==='warehouse') {
        renderCategoryList(); 
        updateMobileCategorySelect(); // Обновляем мобильный список категорий
        updatePaginationButtons(); // Обновляем кнопки при переключении на вкладку
        renderWarehouse();
    } 
    if(t==='movements') {
        renderHistoryTable();
        renderMovementsItemsTable();
    } 
    if(t==='dashboard') renderDashboard(); 
}

// Мобильное меню
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

function closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) {
        menu.classList.add('hidden');
    }
}

// Закрытие мобильного меню при клике вне его
document.addEventListener('click', function(event) {
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    
    if (mobileMenu && mobileMenuBtn && !mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
        closeMobileMenu();
    }
});

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

    // Инициализируем счетчик проектов
    updateProjectSearchResults();
    
    // Инициализируем мобильный список категорий, если открыта страница склада
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab && activeTab.id === 'tab-warehouse') {
        if (typeof updateMobileCategorySelect === 'function') {
            updateMobileCategorySelect();
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
