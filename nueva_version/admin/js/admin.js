// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCsMf8gbDEvXU8Z3K2rX1uiq367TsVW68A",
  authDomain: "estudio-precinto.firebaseapp.com",
  projectId: "estudio-precinto",
  storageBucket: "estudio-precinto.firebasestorage.app",
  messagingSenderId: "503794259553",
  appId: "1:503794259553:web:1418d7abfae8841bbfbc20"
};

// Como estamos en un subdirectorio, inicializamos con SDK v8 compat
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig); 
}

const auth = firebase.auth();
const db = firebase.firestore();

// ─── LOGIN LOGIC (index.html) ─────────────────────────────────────────────────
const loginForm = document.getElementById("login-form");
if (loginForm) {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Si ya está logueado, redirigir al dashboard
            window.location.href = "dashboard.html";
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorMsg = document.getElementById("error-msg");

        try {
            // Restricción extra por frontend (aunque la real está en Firestore Rules)
            if (email !== "info@estudioprecinto.com") {
                throw new Error("Usuario no autorizado");
            }
            
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Error de login:", error);
            errorMsg.style.display = "block";
        }
    });
}

// ─── DASHBOARD LOGIC (dashboard.html) ─────────────────────────────────────────
const dashboardBody = document.getElementById("dashboard-body");
if (dashboardBody) {
    let currentSlots = [];

    // Verificar seguridad antes de mostrar la página
    auth.onAuthStateChanged(user => {
        if (!user || user.email !== "info@estudioprecinto.com") {
            // Expulsar si no es el admin
            auth.signOut().then(() => {
                window.location.href = "index.html";
            });
        } else {
            // Mostrar interfaz y cargar datos
            dashboardBody.style.display = "block";
            loadData();
        }
    });

    document.getElementById("btn-logout").addEventListener("click", () => {
        auth.signOut();
    });

    async function loadData() {
        try {
            // Cargar precios
            const pricingDoc = await db.collection("settings").doc("pricing").get();
            if (pricingDoc.exists) {
                document.getElementById("price-individual").value = pricingDoc.data().individual || 90000;
            }

            // Cargar agenda
            const agendaDoc = await db.collection("settings").doc("agenda").get();
            if (agendaDoc.exists && agendaDoc.data().slots) {
                currentSlots = agendaDoc.data().slots;
            } else {
                currentSlots = ["09:00", "10:30", "12:00", "14:30", "16:00", "17:30"];
            }
            renderSlots();
        } catch (error) {
            console.error("Error al cargar datos. Verifica las reglas de Firestore.", error);
            alert("No se pudieron cargar los datos. ¿Están configuradas las Reglas de Firestore?");
        }
    }

    // -- Lógica de Precios --
    document.getElementById("btn-save-pricing").addEventListener("click", async () => {
        const newPrice = parseInt(document.getElementById("price-individual").value);
        if (isNaN(newPrice)) return alert("Precio inválido");

        const btn = document.getElementById("btn-save-pricing");
        btn.disabled = true;
        btn.innerText = "Guardando...";

        try {
            await db.collection("settings").doc("pricing").set({
                individual: newPrice
            }, { merge: true });
            showToast();
        } catch (error) {
            alert("Error al guardar: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Guardar Precios";
        }
    });

    // -- Lógica de Agenda --
    function renderSlots() {
        const container = document.getElementById("slot-list");
        container.innerHTML = "";
        
        currentSlots.sort().forEach(slot => {
            const div = document.createElement("div");
            div.className = "slot-item";
            div.innerHTML = `<span>${slot}</span> <button onclick="removeSlot('${slot}')">✕</button>`;
            container.appendChild(div);
        });
    }

    window.removeSlot = (slotToRemove) => {
        currentSlots = currentSlots.filter(s => s !== slotToRemove);
        renderSlots();
    };

    document.getElementById("btn-add-slot").addEventListener("click", () => {
        const input = document.getElementById("new-slot-time");
        const newTime = input.value;
        if (newTime && !currentSlots.includes(newTime)) {
            currentSlots.push(newTime);
            renderSlots();
            input.value = "";
        }
    });

    document.getElementById("btn-save-agenda").addEventListener("click", async () => {
        const btn = document.getElementById("btn-save-agenda");
        btn.disabled = true;
        btn.innerText = "Guardando...";

        try {
            await db.collection("settings").doc("agenda").set({
                slots: currentSlots.sort()
            });
            showToast();
        } catch (error) {
            alert("Error al guardar la agenda: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Guardar Calendario";
        }
    });

    function showToast() {
        const toast = document.getElementById("toast");
        toast.style.display = "block";
        setTimeout(() => toast.style.display = "none", 3000);
    }
}
