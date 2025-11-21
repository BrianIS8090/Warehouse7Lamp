// --- UTILITIES MODULE ---

// Debounce function for search input
let searchDebounceTimer = null;
function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(searchDebounceTimer);
            func(...args);
        };
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(later, wait);
    };
}

// Convert Google Drive Links to direct image URLs
function getDirectImageUrl(url) {
    if (!url) return "";
    
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/
    ];

    for (let pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }
    return url;
}

// Theme toggle function
function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.className = 'fas fa-moon';
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

// Initialize theme on page load
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

// Escape HTML attributes to prevent XSS
function escapeAttr(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// CSV Parser - robust parser that handles quoted strings containing commas
function parseCSV(text) {
    let p = '', row = [''], ret = [row], i = 0, r = 0, s = !0, l;
    for (l of text) {
        if ('"' === l) {
            if (s && l === p) row[i] += l;
            s = !s;
        } else if (',' === l && s) l = row[++i] = '';
        else if ('\n' === l && s) {
            if ('\r' === p) row[i] = row[i].slice(0, -1);
            row = ret[++r] = ['']; i = 0;
        } else row[i] += l;
        p = l;
    }
    return ret;
}

// Export data to JSON file
function exportData() {
    const db = window.db || { items: [], projects: [], specs: {}, movements: [] };
    if (!db || !db.items) {
        alert("Нет данных для экспорта");
        return;
    }
    const dataStr = JSON.stringify(db);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'warehouse_backup_'+new Date().toISOString().slice(0,10)+'.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Export data to Excel (CSV format)
function exportToExcel() {
    const db = window.db || { items: [], projects: [], specs: {}, movements: [] };
    if (!db || !db.items) {
        alert("Нет данных для экспорта");
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Название,Производитель,Категория,Остаток,Ед.изм,Цена\r\n";
    
    db.items.forEach(function(rowArray) {
        let row = `${rowArray.id},"${rowArray.name}","${rowArray.manuf}","${rowArray.cat}",${rowArray.qty},"${rowArray.unit}",${rowArray.cost}`;
        csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "warehouse_items.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
}

// Make functions global for use in other modules and HTML
if (typeof window !== 'undefined') {
    window.debounce = debounce;
    window.getDirectImageUrl = getDirectImageUrl;
    window.toggleTheme = toggleTheme;
    window.escapeAttr = escapeAttr;
    window.parseCSV = parseCSV;
    window.exportData = exportData;
    window.exportToExcel = exportToExcel;
}

