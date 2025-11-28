// --- UTILITY FUNCTIONS ---

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

// Format number with decimals
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '0';
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals).replace(/\.?0+$/, '');
}

// Format currency
function formatCurrency(value, decimals = 2) {
    return formatNumber(value, decimals) + ' ₽';
}

// Escape HTML attributes
function escapeAttr(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Convert Google Drive Links to direct URLs
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

// Show loader
function showLoader(v){
    const el = document.getElementById('globalLoader');
    if(el) el.style.display = v ? 'flex' : 'none';
}

// Show toast notification
function showToast(m){
    const t = document.getElementById('toast');
    const msg = document.getElementById('toastMsg');
    if(t && msg) {
        msg.textContent = m;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }
}












