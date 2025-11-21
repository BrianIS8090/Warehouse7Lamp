// --- AUTHENTICATION MODULE ---

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyChf2f13grceK8sjkPP7dKz6_1YP1RLkZE", 
    authDomain: "warehouse7lamp.firebaseapp.com", 
    databaseURL: "https://warehouse7lamp-default-rtdb.europe-west1.firebasedatabase.app", 
    projectId: "warehouse7lamp", 
    storageBucket: "warehouse7lamp.firebasestorage.app", 
    messagingSenderId: "349274471054", 
    appId: "1:349274471054:web:03302aeb9b42135ae5e7df", 
    measurementId: "G-9NLYY972T8"
};

// Firebase instances
let auth, dbRef;
let isDemoMode = false;

// Initialize Firebase
try { 
    firebase.initializeApp(firebaseConfig); 
    dbRef = firebase.database().ref('warehouse_v4'); 
    auth = firebase.auth(); 
    if (document.getElementById('techInfo')) {
        document.getElementById('techInfo').innerText = "SDK Loaded. AppID: " + firebaseConfig.appId.substring(0,15) + "..."; 
    }
} catch (e) { 
    console.error("Firebase Init Error:", e); 
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.innerHTML = "Ошибка инициализации Firebase.<br>Проверьте консоль (F12).<br>" + e.message; 
        loginError.classList.remove('hidden'); 
    }
}

// Setup auth state listener
if (auth) { 
    auth.onAuthStateChanged((user) => { 
        if (user) { 
            const loginScreen = document.getElementById('loginScreen');
            const connectionStatus = document.getElementById('connectionStatus');
            const userEmailText = document.getElementById('userEmailText');
            
            if (userEmailText) {
                userEmailText.textContent = user.email || "User";
                userEmailText.classList.remove('hidden');
                console.log("User email set to:", user.email);
            } else {
                console.error("Element userEmailText not found!");
            }
            
            if (loginScreen) loginScreen.classList.add('hidden');  
            if (connectionStatus) {
                connectionStatus.innerText = "Online (Cloud)"; 
                connectionStatus.classList.add("text-green-600"); 
            }
            // Call init from db module
            if (typeof init === 'function') {
                init(false); 
            }
        } else { 
            if(!isDemoMode) { 
                const loginScreen = document.getElementById('loginScreen');
                const globalLoader = document.getElementById('globalLoader');
                if (loginScreen) loginScreen.classList.remove('hidden'); 
                if (globalLoader) globalLoader.style.display = 'none'; 
            } 
        } 
    }); 
}

// Login function
function login() { 
    const em = document.getElementById('loginEmail').value; 
    const pw = document.getElementById('loginPass').value; 
    const err = document.getElementById('loginError'); 
    
    if (!em || !pw) { 
        if (err) {
            err.textContent = "Введите почту и пароль!"; 
            err.classList.remove('hidden'); 
        }
        return; 
    } 
    if (!auth) { 
        if (err) {
            err.innerHTML = "Firebase не инициализирован. Попробуйте <b>Демо вход</b>."; 
            err.classList.remove('hidden'); 
        }
        return; 
    } 
    
    if (typeof showLoader === 'function') {
        showLoader(true); 
    }
    if (err) err.classList.add('hidden'); 
    
    auth.signInWithEmailAndPassword(em, pw)
        .then(() => { console.log("Вход выполнен успешно"); })
        .catch((error) => { 
            if (typeof showLoader === 'function') {
                showLoader(false); 
            }
            console.error("Ошибка входа:", error); 
            let msg = `Ошибка (${error.code}): ${error.message}`; 
            if (error.code === 'auth/invalid-email') msg = "Некорректный формат Email"; 
            if (error.code === 'auth/user-not-found') msg = "Пользователь не найден. Зарегистрируйте его в консоли Firebase."; 
            if (error.code === 'auth/wrong-password') msg = "Неверный пароль"; 
            if (error.code === 'auth/network-request-failed') msg = "Нет сети или доступ заблокирован (CORS/Firewall)."; 
            if (error.code === 'auth/operation-not-allowed') msg = "Вход по Email/Пароль отключен в консоли Firebase!"; 
            if (err) {
                err.innerHTML = `<b>Ошибка входа:</b><br>${msg}`; 
                err.classList.remove('hidden'); 
            }
        }); 
}

// Demo login (no authentication)
function demoLogin() { 
    isDemoMode = true; 
    const loginScreen = document.getElementById('loginScreen');
    const connectionStatus = document.getElementById('connectionStatus');
    const userEmailText = document.getElementById('userEmailText');
    
    if (userEmailText) {
        userEmailText.textContent = "Demo User";
        userEmailText.classList.remove('hidden');
    }

    if (loginScreen) loginScreen.classList.add('hidden'); 
    if (connectionStatus) {
        connectionStatus.innerText = "Demo (Local)"; 
        connectionStatus.classList.add("text-orange-500"); 
    }
    if (typeof showToast === 'function') {
        showToast("Демо режим: данные не сохраняются в облако"); 
    }
    if (typeof seedData === 'function') {
        seedData(); 
    }
    if (typeof init === 'function') {
        init(true); 
    }
}

// Logout function
function logout() { 
    if (typeof hasUnsavedChanges !== 'undefined' && hasUnsavedChanges && !confirm("Есть несохраненные данные. Точно выйти?")) return; 
    if (isDemoMode) { 
        isDemoMode = false; 
        location.reload(); 
    } else if (auth) { 
        auth.signOut().then(() => location.reload()); 
    } 
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.auth = auth;
    window.dbRef = dbRef;
    window.isDemoMode = isDemoMode;
    // Make functions global for HTML onclick handlers
    window.login = login;
    window.demoLogin = demoLogin;
    window.logout = logout;
}

