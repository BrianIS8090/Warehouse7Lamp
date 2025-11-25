// --- AUTHENTICATION ---

if (auth) { 
    auth.onAuthStateChanged((user) => { 
        if (user) { 
            document.getElementById('loginScreen').classList.add('hidden'); 
            document.getElementById('connectionStatus').innerText = "Online (Cloud)"; 
            document.getElementById('connectionStatus').classList.add("text-green-600"); 
            
            const userEmailText = document.getElementById('userEmailText');
            if (userEmailText) {
                userEmailText.textContent = user.email;
                userEmailText.classList.remove('hidden');
            }

            init(false); 
        } else { 
            if(!isDemoMode) { 
                document.getElementById('loginScreen').classList.remove('hidden'); 
                document.getElementById('globalLoader').style.display = 'none'; 
            } 
        } 
    }); 
}

function login() { 
    const em = document.getElementById('loginEmail').value; 
    const pw = document.getElementById('loginPass').value; 
    const err = document.getElementById('loginError'); 
    
    if (!em || !pw) { 
        err.textContent = "Введите почту и пароль!"; 
        err.classList.remove('hidden'); 
        return; 
    } 
    if (!auth) { 
        err.innerHTML = "Firebase не инициализирован. Попробуйте <b>Демо вход</b>."; 
        err.classList.remove('hidden'); 
        return; 
    } 
    
    showLoader(true); 
    err.classList.add('hidden'); 
    
    auth.signInWithEmailAndPassword(em, pw)
        .then(() => { console.log("Вход выполнен успешно"); })
        .catch((error) => { 
            showLoader(false); 
            console.error("Ошибка входа:", error); 
            let msg = `Ошибка (${error.code}): ${error.message}`; 
            if (error.code === 'auth/invalid-email') msg = "Некорректный формат Email"; 
            if (error.code === 'auth/user-not-found') msg = "Пользователь не найден. Зарегистрируйте его в консоли Firebase."; 
            if (error.code === 'auth/wrong-password') msg = "Неверный пароль"; 
            if (error.code === 'auth/network-request-failed') msg = "Нет сети или доступ заблокирован (CORS/Firewall)."; 
            if (error.code === 'auth/operation-not-allowed') msg = "Вход по Email/Пароль отключен в консоли Firebase!"; 
            err.innerHTML = `<b>Ошибка входа:</b><br>${msg}`; 
            err.classList.remove('hidden'); 
        }); 
}

function demoLogin() { 
    isDemoMode = true; 
    document.getElementById('loginScreen').classList.add('hidden'); 
    document.getElementById('connectionStatus').innerText = "Demo (Local)"; 
    document.getElementById('connectionStatus').classList.add("text-orange-500"); 
    
    const userEmailText = document.getElementById('userEmailText');
    if (userEmailText) {
        userEmailText.textContent = "Demo User";
        userEmailText.classList.remove('hidden');
    }

    showToast("Демо режим: данные не сохраняются в облако"); 
    seedData(); 
    init(true); 
}

function logout() { 
    if(hasUnsavedChanges && !confirm("Есть несохраненные данные. Точно выйти?")) return; 
    if (isDemoMode) { 
        isDemoMode = false; 
        location.reload(); 
    } else if (auth) { 
        auth.signOut().then(() => location.reload()); 
    } 
}



