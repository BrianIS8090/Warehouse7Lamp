// --- UI MODULE ---
// Basic UI utilities: loaders, toasts, modals, sync UI

// Show/hide global loader
function showLoader(show) {
    const el = document.getElementById('globalLoader'); 
    if(el) el.style.display = show ? 'flex' : 'none';
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (toast && toastMsg) {
        toastMsg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
}

// Update sync button UI
function updateSyncUI() { 
    const btn = document.getElementById('syncBtn'); 
    const txt = document.getElementById('syncText'); 
    const hasUnsaved = typeof window.hasUnsavedChanges === 'function' ? window.hasUnsavedChanges() : false;
    
    if(btn && txt) {
        if(hasUnsaved) { 
            btn.className = "sync-fab sync-dirty"; 
            txt.textContent = "Нажмите для сохранения"; 
        } else { 
            btn.className = "sync-fab sync-clean"; 
            txt.textContent = "Синхронизировано"; 
        }
    }
}

// Open modal
function openModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('hidden'); 
}

// Close modal
function closeModal(id) { 
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('hidden'); 
}

// Open settings modal
function openSettings() { 
    openModal('settingsModal'); 
}

// Make functions global
if (typeof window !== 'undefined') {
    window.showLoader = showLoader;
    window.showToast = showToast;
    window.updateSyncUI = updateSyncUI;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.openSettings = openSettings;
}


