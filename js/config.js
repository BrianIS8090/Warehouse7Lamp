// --- FIREBASE CONFIG ---
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



