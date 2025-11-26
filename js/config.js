// --- FIREBASE CONFIG ---
// Конфигурация загружается из env.js (не коммитится в git)
const firebaseConfig = {
    apiKey: ENV.FIREBASE_API_KEY, 
    authDomain: ENV.FIREBASE_AUTH_DOMAIN, 
    databaseURL: ENV.FIREBASE_DATABASE_URL, 
    projectId: ENV.FIREBASE_PROJECT_ID, 
    storageBucket: ENV.FIREBASE_STORAGE_BUCKET, 
    messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID, 
    appId: ENV.FIREBASE_APP_ID, 
    measurementId: ENV.FIREBASE_MEASUREMENT_ID
};

let auth, dbRef, isDemoMode = false;

try { 
    firebase.initializeApp(firebaseConfig); 
    dbRef = firebase.database().ref('warehouse_v4'); 
    auth = firebase.auth(); 
    document.getElementById('techInfo').innerText = "SDK Loaded. AppID: " + firebaseConfig.appId.substring(0,15) + "..."; 
} catch (e) { 
    console.error("Firebase Init Error:", e); 
    document.getElementById('loginError').innerHTML = "Ошибка инициализации Firebase.<br>Проверьте консоль (F12).<br>" + e.message; 
    document.getElementById('loginError').classList.remove('hidden'); 
}







