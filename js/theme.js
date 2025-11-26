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

// --- THEME COLOR LOGIC ---
const DEFAULT_COLORS = {
    '--color-slate-50': '#f8fafc',
    '--color-slate-100': '#f1f5f9',
    '--color-slate-200': '#e2e8f0',
    '--color-slate-300': '#cbd5e1',
    '--color-slate-400': '#94a3b8',
    '--color-slate-500': '#64748b',
    '--color-slate-600': '#475569',
    '--color-slate-700': '#334155',
    '--color-slate-800': '#1e293b',
    '--color-slate-900': '#0f172a',
    '--color-blue-50': '#eff6ff',
    '--color-blue-100': '#dbeafe',
    '--color-blue-400': '#60a5fa',
    '--color-blue-500': '#3b82f6',
    '--color-blue-600': '#2563eb',
    '--color-blue-700': '#1d4ed8',
    '--color-blue-800': '#1e40af',
    '--color-white': '#ffffff',
    '--color-black': '#000000'
};

function initThemeColors() {
    const savedColors = localStorage.getItem('theme_colors');
    if (savedColors) {
        try {
            const colors = JSON.parse(savedColors);
            Object.keys(colors).forEach(key => {
                document.documentElement.style.setProperty(key, colors[key]);
            });
        } catch (e) {
            console.error('Error loading theme colors', e);
        }
    }
}

function setThemeColor(variable, value) {
    document.documentElement.style.setProperty(variable, value);
    
    // Save to local storage
    let colors = {};
    const saved = localStorage.getItem('theme_colors');
    if (saved) {
        try { colors = JSON.parse(saved); } catch(e) {}
    }
    colors[variable] = value;
    localStorage.setItem('theme_colors', JSON.stringify(colors));
}

function resetThemeColors() {
    if (!confirm('Сбросить все настройки цветов к умолчанию?')) return;
    
    localStorage.removeItem('theme_colors');
    Object.keys(DEFAULT_COLORS).forEach(key => {
        document.documentElement.style.removeProperty(key);
    });
    
    // Update inputs if modal is open
    updateThemeColorInputs();
    if (typeof showToast === 'function') showToast('Цвета сброшены');
}

function getThemeColor(variable) {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || DEFAULT_COLORS[variable];
}

function updateThemeColorInputs() {
    const inputs = document.querySelectorAll('input[type="color"][id^="clr-"]');
    inputs.forEach(input => {
        const id = input.id;
        let variable = '';
        if (id.startsWith('clr-')) {
            let name = id.replace('clr-', '');
            if (name.endsWith('-dark') || name.endsWith('-light')) {
                name = name.replace(/-dark$/, '').replace(/-light$/, '');
            }
            variable = `--color-${name}`;
        }
        
        if (variable) {
            // Hex color needs to be 6 chars, sometimes computed style returns rgb
            const val = getThemeColor(variable);
            if (val.startsWith('#')) {
                input.value = val;
            } else if (val.startsWith('rgb')) {
                // Convert rgb to hex if needed, but usually default CSS vars are hex
                // For now assuming hex as defined in default style
                input.value = rgbToHex(val);
            }
        }
    });
}

function rgbToHex(rgb) {
    if (!rgb) return '#000000';
    const separator = rgb.indexOf(",") > -1 ? "," : " ";
    const rgbVals = rgb.substr(4).split(")")[0].split(separator);
    
    let r = (+rgbVals[0]).toString(16),
        g = (+rgbVals[1]).toString(16),
        b = (+rgbVals[2]).toString(16);
  
    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;
  
    return "#" + r + g + b;
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
    
    // Init colors
    initThemeColors();
})();
