
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCmD8303tX80O8ZQfJkQmlZ8z_bMAoajJo",
  authDomain: "pjic-9ed7c.firebaseapp.com",
  projectId: "pjic-9ed7c",
  storageBucket: "pjic-9ed7c.firebasestorage.app",
  messagingSenderId: "443451394264",
  appId: "1:443451394264:web:c8159e12565853d3e0efad",
  measurementId: "G-YX3LB4GJ0Y"
};

initializeApp(firebaseConfig);
const auth = getAuth();

/* DOM refs */
const btnLogin = document.getElementById('btnLogin');
const btnSignup = document.getElementById('btnSignup');
const accountWrap= document.getElementById('accountWrap');
const btnAccount= document.getElementById('btnAccount');
const accountMenu= document.getElementById('accountMenu');
const accountEmail= document.getElementById('accountEmail');
const btnSignOut= document.getElementById('btnSignOut');

const mask = document.getElementById('authMask');
const authClose = document.getElementById('authClose');
const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const authTitle = document.getElementById('authTitle');
const formLogin = document.getElementById('formLogin');
const formSignup= document.getElementById('formSignup');
const loginEmail= document.getElementById('loginEmail');
const loginPass = document.getElementById('loginPass');
const suName= document.getElementById('suName');
const suEmail= document.getElementById('suEmail');
const suPass = document.getElementById('suPass');
const msg = document.getElementById('authMsg');

/* Helpers */
const show = el => el && (el.style.display = '');
const hide = el => el && (el.style.display = 'none');
const setText = (el, t='') => el && (el.textContent = t);

/* Tabs + modal */
function toLogin(){ if(authTitle) authTitle.textContent='Login'; show(formLogin); hide(formSignup); }
function toSignup(){ if(authTitle) authTitle.textContent='Sign up'; show(formSignup); hide(formLogin); }

function openMask(which='login'){
  if(!mask){ console.warn('[auth] #authMask not found'); return; }
  show(mask);
  setText(msg, '');
  which==='signup' ? toSignup() : toLogin();
}

function closeMask(){ hide(mask); setText(msg,''); }

/* Robust open handlers */
// 1) Generic data attribute (works for any element you add later)
document.querySelectorAll('[data-open-auth]').forEach(el=>{
  el.addEventListener('click', e=>{
    e.preventDefault();
    openMask(el.getAttribute('data-open-auth') || 'login');
  });
});
// 2) Explicit by ID (fixes cases where data attribute is missing)
btnLogin?.addEventListener('click', e=>{ e.preventDefault(); openMask('login'); });
btnSignup?.addEventListener('click', e=>{ e.preventDefault(); openMask('signup'); });

/* Close + backdrop */
authClose?.addEventListener('click', closeMask);
mask?.addEventListener('click', e=>{ if(e.target===mask) closeMask(); });
tabLogin?.addEventListener('click', toLogin);
tabSignup?.addEventListener('click', toSignup);

/* Login */
formLogin?.addEventListener('submit', async e=>{
  e.preventDefault();
  setText(msg, 'Logging in…');
  try{
    await signInWithEmailAndPassword(auth, (loginEmail?.value||'').trim(), loginPass?.value||'');
    closeMask();
  }catch(err){ setText(msg, prettify(err)); }
});

/* Sign up */
formSignup?.addEventListener('submit', async e=>{
  e.preventDefault();
  setText(msg,'Creating account…');
  try{
    const { user } = await createUserWithEmailAndPassword(auth, (suEmail?.value||'').trim(), suPass?.value||'');
    const name = (suName?.value||'').trim();
    if(name){ await updateProfile(user, { displayName: name }); }
    closeMask();
  }catch(err){ setText(msg, prettify(err)); }
});

/* Session state */
onAuthStateChanged(auth, user=>{
  if(user){
    hide(btnLogin); hide(btnSignup); show(accountWrap);
    const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Account');
    if(btnAccount) btnAccount.textContent = `Account (${name})`;
    if(accountEmail) accountEmail.textContent = user.email || '';
  }else{
    show(btnLogin); show(btnSignup); hide(accountWrap); hide(accountMenu);
  }
});

/* Account dropdown + sign out */
btnAccount?.addEventListener('click', ()=>{
  const open = accountMenu && accountMenu.style.display !== 'none';
  if(accountMenu){
    accountMenu.style.display = open ? 'none' : '';
    btnAccount?.setAttribute('aria-expanded', String(!open));
  }
});
btnSignOut?.addEventListener('click', async ()=>{
  await signOut(auth);
  if(accountMenu) accountMenu.style.display = 'none';
});

/* Error prettifier */
function prettify(err){
  const code = (err?.code||'').replace('auth/','');
  const map = {
    'invalid-email': 'Email address looks wrong.',
    'user-not-found': 'No account with that email.',
    'wrong-password': 'Incorrect password.',
    'weak-password': 'Password must be at least 6 characters.',
    'email-already-in-use': 'That email is already registered.',
    'too-many-requests': 'Too many attempts. Try again later.'
  };
  return map[code] || err?.message || 'Something went wrong.';
}
