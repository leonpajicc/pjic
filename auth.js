import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ✅ Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCmD8303tX80O8ZQfJkQmlZ8z_bMAoajJo",
  authDomain: "pjic-9ed7c.firebaseapp.com",
  projectId: "pjic-9ed7c",
  storageBucket: "pjic-9ed7c.firebasestorage.app",
  messagingSenderId: "443451394264",
  appId: "1:443451394264:web:c8159e12565853d3e0efad",
  measurementId: "G-YX3LB4GJ0Y"
};

// Init
initializeApp(firebaseConfig);
const auth = getAuth();

/* --- DOM refs --- */
const btnLogin = document.getElementById('btnLogin');
const btnSignup = document.getElementById('btnSignup');
const accountWrap = document.getElementById('accountWrap');
const btnAccount = document.getElementById('btnAccount');
const accountMenu = document.getElementById('accountMenu');
const accountEmail = document.getElementById('accountEmail');
const btnSignOut = document.getElementById('btnSignOut');

const mask = document.getElementById('authMask');
const authClose = document.getElementById('authClose');
const formLogin = document.getElementById('formLogin');
const formSignup = document.getElementById('formSignup');
const loginEmail = document.getElementById('loginEmail');
const loginPass = document.getElementById('loginPass');
const suName = document.getElementById('suName');
const suEmail = document.getElementById('suEmail');
const suPass = document.getElementById('suPass');
const msg = document.getElementById('authMsg');

/* --- helpers --- */
const show = el => el && (el.style.display = '');
const hide = el => el && (el.style.display = 'none');
const setText = (el, t='') => el && (el.textContent = t);

/* --- open/close mask --- */
document.querySelectorAll('[data-open-auth]').forEach(el=>{
  el.addEventListener('click', e=>{
    e.preventDefault();
    show(mask);
    if(el.dataset.openAuth==='signup'){ show(formSignup); hide(formLogin); }
    else{ show(formLogin); hide(formSignup); }
  });
});
authClose?.addEventListener('click', ()=>hide(mask));
mask?.addEventListener('click', e=>{ if(e.target===mask) hide(mask); });

/* --- login --- */
formLogin?.addEventListener('submit', async e=>{
  e.preventDefault();
  setText(msg,'Logging in…');
  try{
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPass.value);
    hide(mask);
  }catch(err){ setText(msg, err.message); }
});

/* --- signup --- */
formSignup?.addEventListener('submit', async e=>{
  e.preventDefault();
  setText(msg,'Creating account…');
  try{
    const { user } = await createUserWithEmailAndPassword(auth, suEmail.value, suPass.value);
    await updateProfile(user, { displayName: suName.value });
    hide(mask);
  }catch(err){ setText(msg, err.message); }
});

/* --- auth state --- */
onAuthStateChanged(auth, user=>{
  if(user){
    hide(btnLogin); hide(btnSignup); show(accountWrap);
    btnAccount.textContent = `Account (${user.displayName || user.email.split('@')[0]})`;
    accountEmail.textContent = user.email;
  }else{
    show(btnLogin); show(btnSignup); hide(accountWrap); hide(accountMenu);
  }
});

/* --- account menu --- */
btnAccount?.addEventListener('click', ()=>{
  accountMenu.style.display = accountMenu.style.display==='none' ? '' : 'none';
});
btnSignOut?.addEventListener('click', ()=> signOut(auth));
