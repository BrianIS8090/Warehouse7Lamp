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
    
    // Переотрисовываем графики при смене темы
    if (typeof renderCategoryChart === 'function') {
        renderCategoryChart();
    }
    if (typeof renderTopItemsChart === 'function') {
        renderTopItemsChart();
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
    '--color-black': '#000000',
    '--color-btn-blue': '#2563eb',
    '--color-btn-green': '#16a34a',
    '--color-btn-red': '#dc2626'
};

// Пресеты цветовых схем
const COLOR_PRESETS = {
    light: {
        name: 'Светлая тема',
        colors: {
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
            '--color-black': '#000000',
            '--color-btn-blue': '#2563eb',
            '--color-btn-green': '#16a34a',
            '--color-btn-red': '#dc2626'
        }
    },
    dark: {
        name: 'Темная тема',
        colors: {
            '--color-slate-50': '#0f172a',
            '--color-slate-100': '#1e293b',
            '--color-slate-200': '#334155',
            '--color-slate-300': '#475569',
            '--color-slate-400': '#64748b',
            '--color-slate-500': '#94a3b8',
            '--color-slate-600': '#cbd5e1',
            '--color-slate-700': '#1e293b',
            '--color-slate-800': '#334155',
            '--color-slate-900': '#0f172a',
            '--color-blue-50': '#1e3a8a',
            '--color-blue-100': '#1e40af',
            '--color-blue-400': '#60a5fa',
            '--color-blue-500': '#3b82f6',
            '--color-blue-600': '#2563eb',
            '--color-blue-700': '#1d4ed8',
            '--color-blue-800': '#1e40af',
            '--color-white': '#f1f5f9',
            '--color-black': '#ffffff',
            '--color-btn-blue': '#60a5fa',
            '--color-btn-green': '#4ade80',
            '--color-btn-red': '#f87171'
        }
    },
    terminal: {
        name: 'Зеленая терминальная тема',
        colors: {
            '--color-slate-50': '#0a0e0a',
            '--color-slate-100': '#0d150d',
            '--color-slate-200': '#1a2e1a',
            '--color-slate-300': '#2d4a2d',
            '--color-slate-400': '#3d5c3d',
            '--color-slate-500': '#4a6b4a',
            '--color-slate-600': '#5a7a5a',
            '--color-slate-700': '#2d4a2d',
            '--color-slate-800': '#1a2e1a',
            '--color-slate-900': '#0d150d',
            '--color-blue-50': '#0d2e0d',
            '--color-blue-100': '#1a4a1a',
            '--color-blue-400': '#00ff41',
            '--color-blue-500': '#00cc33',
            '--color-blue-600': '#00ff41',
            '--color-blue-700': '#00cc33',
            '--color-blue-800': '#009922',
            '--color-white': '#00ff41',
            '--color-black': '#0a0e0a',
            '--color-btn-blue': '#00ff41',
            '--color-btn-green': '#00ff41',
            '--color-btn-red': '#ff4444'
        }
    },
    pastel: {
        name: 'Пастельные цвета',
        colors: {
            '--color-slate-50': '#fef7ff',
            '--color-slate-100': '#fce7f3',
            '--color-slate-200': '#fbcfe8',
            '--color-slate-300': '#f9a8d4',
            '--color-slate-400': '#f472b6',
            '--color-slate-500': '#ec4899',
            '--color-slate-600': '#db2777',
            '--color-slate-700': '#be185d',
            '--color-slate-800': '#9f1239',
            '--color-slate-900': '#831843',
            '--color-blue-50': '#f0f9ff',
            '--color-blue-100': '#e0f2fe',
            '--color-blue-400': '#7dd3fc',
            '--color-blue-500': '#38bdf8',
            '--color-blue-600': '#0ea5e9',
            '--color-blue-700': '#0284c7',
            '--color-blue-800': '#0369a1',
            '--color-white': '#ffffff',
            '--color-black': '#581c87',
            '--color-btn-blue': '#0ea5e9',
            '--color-btn-green': '#ec4899',
            '--color-btn-red': '#f472b6'
        }
    },
    apple: {
        name: 'Цвета в стиле Apple',
        colors: {
            '--color-slate-50': '#f5f5f7',
            '--color-slate-100': '#e8e8ed',
            '--color-slate-200': '#d2d2d7',
            '--color-slate-300': '#c7c7cc',
            '--color-slate-400': '#aeaeb2',
            '--color-slate-500': '#8e8e93',
            '--color-slate-600': '#636366',
            '--color-slate-700': '#48484a',
            '--color-slate-800': '#3a3a3c',
            '--color-slate-900': '#1c1c1e',
            '--color-blue-50': '#e3f2fd',
            '--color-blue-100': '#bbdefb',
            '--color-blue-400': '#42a5f5',
            '--color-blue-500': '#2196f3',
            '--color-blue-600': '#007aff',
            '--color-blue-700': '#0051d5',
            '--color-blue-800': '#0040a8',
            '--color-white': '#ffffff',
            '--color-black': '#000000',
            '--color-btn-blue': '#007aff',
            '--color-btn-green': '#34c759',
            '--color-btn-red': '#ff3b30'
        }
    },
    material: {
        name: 'Материал дизайн',
        colors: {
            '--color-slate-50': '#fafafa',
            '--color-slate-100': '#f5f5f5',
            '--color-slate-200': '#eeeeee',
            '--color-slate-300': '#e0e0e0',
            '--color-slate-400': '#bdbdbd',
            '--color-slate-500': '#9e9e9e',
            '--color-slate-600': '#757575',
            '--color-slate-700': '#616161',
            '--color-slate-800': '#424242',
            '--color-slate-900': '#212121',
            '--color-blue-50': '#e3f2fd',
            '--color-blue-100': '#bbdefb',
            '--color-blue-400': '#42a5f5',
            '--color-blue-500': '#2196f3',
            '--color-blue-600': '#1976d2',
            '--color-blue-700': '#1565c0',
            '--color-blue-800': '#0d47a1',
            '--color-white': '#ffffff',
            '--color-black': '#000000',
            '--color-btn-blue': '#1976d2',
            '--color-btn-green': '#388e3c',
            '--color-btn-red': '#d32f2f'
        }
    }
};

// Применить пресет цветов
function applyColorPreset(presetKey) {
    const preset = COLOR_PRESETS[presetKey];
    if (!preset) return;
    
    Object.keys(preset.colors).forEach(key => {
        setThemeColor(key, preset.colors[key]);
    });
    
    // Обновить инпуты в модальном окне
    updateThemeColorInputs();
    
    if (typeof showToast === 'function') {
        showToast(`Применена тема: ${preset.name}`);
    }
}

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
            // Получаем значение цвета
            const val = getThemeColor(variable);
            if (val.startsWith('#')) {
                input.value = val;
            } else if (val.startsWith('rgb')) {
                // Конвертируем rgb в hex
                input.value = rgbToHex(val);
            } else if (val) {
                // Если значение есть, но не в формате hex или rgb, пробуем использовать как есть
                input.value = val;
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

// Открыть модальное окно настроек цветов
function openColorSchemeModal() {
    const modal = document.getElementById('colorSchemeModal');
    if (modal) {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.add('show');
            updateThemeColorInputs();
        }, 10);
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
    
    // Init colors
    initThemeColors();
})();
