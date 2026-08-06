// ── app.js — Lógica principal de la Academia Maleki (Realtime Database Version) ──

(function(){
'use strict';

// ── FIREBASE INIT ─────────────────────────────────────────────────────────────
let firebaseApp=null, firebaseAuth=null, firebaseDB=null;
let demoMode=false;

function initFirebase(){
  try{
    if(typeof firebase==='undefined'||FIREBASE_CONFIG.apiKey.includes('PLACE_PLACEHOLDER')){
      console.warn('Firebase no configurado correctamente — usando modo demo (localStorage)');
      demoMode=true; return;
    }
    if(!firebase.apps.length) firebaseApp=firebase.initializeApp(FIREBASE_CONFIG);
    else firebaseApp=firebase.apps[0];
    
    firebaseAuth=firebase.auth();
    firebaseDB=firebase.database(); // Volvemos a Realtime Database
    console.log('Firebase (Realtime DB) inicializado');
  }catch(e){
    console.warn('Error iniciando Firebase, usando modo demo',e);
    demoMode=true;
  }
}

// ── DEMO DATA HELPERS (Fallback) ──────────────────────────────────────────────
function getDemoUser(){
  const u=localStorage.getItem('maleki_user');
  return u?JSON.parse(u):null;
}
function setDemoUser(u){ localStorage.setItem('maleki_user',JSON.stringify(u)); }
function getDemoProgress(uid){
  const p=localStorage.getItem('maleki_progress_'+uid);
  return p?JSON.parse(p):{level:1,completedUnits:[],completedLevels:[],examScores:{},discordId:null,discordUsername:null,discordRole:null};
}
function setDemoProgress(uid,p){ localStorage.setItem('maleki_progress_'+uid,JSON.stringify(p)); }

// ── AUTH ──────────────────────────────────────────────────────────────────────
window.MalekiAuth={
  async login(email,pass){
    if(demoMode){
      const users=JSON.parse(localStorage.getItem('maleki_users')||'[]');
      const u=users.find(x=>x.email===email&&x.password===pass);
      if(!u)return{ok:false,error:'Email o contraseña incorrectos'};
      setDemoUser(u); return{ok:true,user:u};
    }
    try{
      const r=await firebaseAuth.signInWithEmailAndPassword(email,pass);
      return{ok:true,user:r.user};
    }catch(e){
      const msgs={'auth/user-not-found':'No existe una cuenta con ese email','auth/wrong-password':'Contraseña incorrecta','auth/invalid-email':'Email inválido','auth/network-request-failed':'Error de conexión'};
      return{ok:false,error:msgs[e.code]||e.message};
    }
  },
  async register(email,pass,name,birthDate){
    if(demoMode){
      const users=JSON.parse(localStorage.getItem('maleki_users')||'[]');
      if(users.find(x=>x.email===email))return{ok:false,error:'Ya existe una cuenta con ese email'};
      const uid='demo_'+Date.now();
      const u={uid,email,displayName:name,birthDate,createdAt:new Date().toISOString()};
      users.push({...u,password:pass});
      localStorage.setItem('maleki_users',JSON.stringify(users));
      setDemoUser(u); setDemoProgress(uid,{level:1,completedUnits:[],completedLevels:[],examScores:{},discordId:null,discordUsername:null,discordRole:null});
      return{ok:true,user:u};
    }
    try{
      const r=await firebaseAuth.createUserWithEmailAndPassword(email,pass);
      await r.user.updateProfile({displayName:name});
      
      // Guardar datos en Realtime Database
      await firebaseDB.ref('users/' + r.user.uid).set({
        uid:r.user.uid,
        email,
        displayName:name,
        birthDate:birthDate||null,
        createdAt:new Date().toISOString(),
        level:1,
        completedUnits:[],
        completedLevels:[],
        examScores:{},
        discordId:null,
        discordUsername:null,
        discordRole:null
      });
      return{ok:true,user:r.user};
    }catch(e){
      const msgs={'auth/email-already-in-use':'Ya existe una cuenta con ese email','auth/weak-password':'La contraseña debe tener al menos 6 caracteres','auth/invalid-email':'Email inválido'};
      return{ok:false,error:msgs[e.code]||e.message};
    }
  },
  async logout(){
    if(demoMode){ localStorage.removeItem('maleki_user'); }
    else if(firebaseAuth){ await firebaseAuth.signOut(); }
    window.location.href='index.html';
  },
  async getCurrentUser(){
    if(demoMode) return getDemoUser();
    return new Promise(resolve=>{
      if(!firebaseAuth){resolve(null);return;}
      const unsub=firebaseAuth.onAuthStateChanged(u=>{unsub();resolve(u);});
    });
  },
  async requireAuth(){
    const u=await this.getCurrentUser();
    if(!u){ window.location.href='index.html'; return null; }
    return u;
  }
};

// ── DATABASE ──────────────────────────────────────────────────────────────────
window.MalekiDB={
  async getProgress(uid){
    if(!uid) return{level:1,completedUnits:[],completedLevels:[],examScores:{},discordId:null,discordRole:null};
    if(demoMode) return getDemoProgress(uid);
    try{
      const snapshot = await firebaseDB.ref('users/' + uid).once('value');
      return snapshot.exists() ? snapshot.val() : {level:1,completedUnits:[],completedLevels:[],examScores:{}};
    }catch(e){
      console.error('Error fetching progress', e);
      return getDemoProgress(uid);
    }
  },
  async completeUnit(uid,unitId){
    const p=await this.getProgress(uid);
    if(!p.completedUnits) p.completedUnits=[];
    if(!p.completedUnits.includes(unitId)) p.completedUnits.push(unitId);
    
    if(demoMode){setDemoProgress(uid,p);return;}
    await firebaseDB.ref('users/' + uid).update({completedUnits:p.completedUnits});
  },
  async completeExam(uid,level,score){
    const p=await this.getProgress(uid);
    if(!p.examScores) p.examScores={};
    p.examScores[level]=score;
    
    if(!p.completedLevels) p.completedLevels=[];
    if(!p.completedLevels.includes(level)) p.completedLevels.push(level);
    
    if(level>=p.level) p.level=level+1;
    const roleNames={1:'Iniciado',2:'Erudito',3:'Maestro Maleki'};
    p.discordRole=roleNames[level];
    
    if(demoMode){setDemoProgress(uid,p);return;}
    
    await firebaseDB.ref('users/' + uid).update({
      examScores:p.examScores,
      completedLevels:p.completedLevels,
      level:p.level,
      discordRole:p.discordRole
    });
    
    // Guardar registro de examen
    await firebaseDB.ref('examResults').push({
      uid,
      level,
      score,
      date:new Date().toISOString(),
      passed:score>=80
    });
  },
  async linkDiscord(uid,discordData){
    const update={
      discordId:discordData.id,
      discordUsername:discordData.username + (discordData.discriminator !== '0' ? '#' + discordData.discriminator : '')
    };
    if(demoMode){
      const p={...getDemoProgress(uid),...update};
      setDemoProgress(uid,p);
      const u={...getDemoUser(),...update};
      setDemoUser(u);
      return;
    }
    await firebaseDB.ref('users/' + uid).update(update);
  }
};

// ── UI HELPERS ────────────────────────────────────────────────────────────────
window.MalekiUI={
  toast(msg,type=''){
    const t=document.getElementById('toast');
    const icon=document.getElementById('toast-icon');
    const m=document.getElementById('toast-msg');
    if(!t||!m) return;
    t.className='toast'+(type?' toast-'+type:'');
    icon.textContent=type==='success'?'✓':type==='error'?'✗':'ℹ';
    m.textContent=msg;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'),4000);
  }
};

// ── TTS (Pronunciación) ───────────────────────────────────────────────────────
window.MalekiVoice = {
  speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Buscamos una voz que suene bien (preferencia español por la fonética similar)
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('es')) || voices[0];
    if (voice) utterance.voice = voice;
    
    utterance.rate = 0.85; // Un poco más lento para que se entienda la fonética
    utterance.pitch = 0.9; // Un tono más bajo para sonar más solemne
    window.speechSynthesis.speak(utterance);
  }
};

// Init on load
initFirebase();

// Auto-redirect if already logged in (on login page)
if(window.location.pathname.endsWith('index.html')||window.location.pathname==='/'){
  (async()=>{
    const u=await window.MalekiAuth.getCurrentUser();
    if(u) window.location.href='dashboard.html';
  })();
}
})();
