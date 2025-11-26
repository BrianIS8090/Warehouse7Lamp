// --- THEME LOGIC ---
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        document.getElementById('themeIcon').className = 'fas fa-moon';
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

function toggleMassSelectionSetting(checked) {
    massSelectionEnabled = checked;
    localStorage.setItem('settings_massSelection', checked);
    
    // Если выключили, очищаем выбор
    if (!checked) {
        selectedItems.clear();
        updateDeleteButton();
    }
    
    renderWarehouse();
    
    // Если открыта карточка товара, обновляем видимость кнопки удаления
    const itemCardModal = document.getElementById('itemCardModal');
    if (itemCardModal && !itemCardModal.classList.contains('hidden')) {
        const viewOnly = itemCardModal.dataset.viewOnly === 'true';
        setItemCardViewMode(viewOnly);
    }
}

function toggleDeleteProjectsSetting(checked) {
    deleteProjectsEnabled = checked;
    localStorage.setItem('settings_deleteProjects', checked);
    
    // Если открыта карточка проекта, обновляем видимость кнопки удаления
    const projectCardModal = document.getElementById('projectCardModal');
    if (projectCardModal && !projectCardModal.classList.contains('hidden')) {
        const deleteBtn = document.getElementById('btnDeleteProject');
        if (deleteBtn) {
            deleteBtn.classList.toggle('hidden', !checked);
        }
    }
}

// Init Theme
(function() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        // Wait for DOM to update icon
        window.addEventListener('DOMContentLoaded', () => {
            const icon = document.getElementById('themeIcon');
            if(icon) icon.className = 'fas fa-sun';
        });
    }
})();




