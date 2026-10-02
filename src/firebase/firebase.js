// Integração opcional com Firebase Authentication + Cloud Firestore.
//
// Tudo aqui é carregado sob demanda (import dinâmico via CDN) para que o jogo
// abra instantaneamente e continue funcionando offline se o Firebase não
// estiver configurado.

import { firebaseConfig, isFirebaseConfigured } from './config.js';

const SDK_VERSION = '10.12.2';
const APP_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-app.js`;
const AUTH_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-auth.js`;
const STORE_URL = `https://www.gstatic.com/firebasejs/${SDK_VERSION}/firebase-firestore.js`;

let modules = null;
let app = null;
let auth = null;
let db = null;
let initError = null;

export const firebaseAvailable = () => isFirebaseConfigured();

/** Carrega o SDK e inicializa o app. Retorna null se não configurado. */
export async function initFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (auth && db) return { auth, db, ...modules };
  if (initError) throw initError;

  try {
    const [appModule, authModule, storeModule] = await Promise.all([
      import(/* @vite-ignore */ APP_URL),
      import(/* @vite-ignore */ AUTH_URL),
      import(/* @vite-ignore */ STORE_URL),
    ]);

    modules = { authModule, storeModule };
    app = appModule.getApps?.().length ? appModule.getApp() : appModule.initializeApp(firebaseConfig);
    auth = authModule.getAuth(app);
    db = storeModule.getFirestore(app);
    return { auth, db, ...modules };
  } catch (error) {
    initError = error;
    console.warn('[firebase] não foi possível inicializar:', error);
    throw error;
  }
}

/** Observa o estado de login. Chama o callback com o usuário ou null. */
export async function onAuthChange(callback) {
  const context = await initFirebase().catch(() => null);
  if (!context) {
    callback(null);
    return () => {};
  }
  return context.authModule.onAuthStateChanged(context.auth, callback);
}

export async function signUpWithEmail(email, password) {
  const context = await initFirebase();
  const credential = await context.authModule.createUserWithEmailAndPassword(context.auth, email, password);
  return credential.user;
}

export async function signInWithEmail(email, password) {
  const context = await initFirebase();
  const credential = await context.authModule.signInWithEmailAndPassword(context.auth, email, password);
  return credential.user;
}

export async function signInAsGuest() {
  const context = await initFirebase();
  const credential = await context.authModule.signInAnonymously(context.auth);
  return credential.user;
}

export async function signInWithGoogle() {
  const context = await initFirebase();
  const provider = new context.authModule.GoogleAuthProvider();
  const credential = await context.authModule.signInWithPopup(context.auth, provider);
  return credential.user;
}

export async function signOutUser() {
  const context = await initFirebase().catch(() => null);
  if (!context) return;
  await context.authModule.signOut(context.auth);
}

export const currentUser = () => auth?.currentUser ?? null;

/** Salva o estado da carreira na nuvem. */
export async function saveToCloud(uid, state) {
  const context = await initFirebase();
  const { storeModule } = context;
  const reference = storeModule.doc(context.db, 'careers', uid);
  await storeModule.setDoc(reference, {
    state: JSON.stringify(state),
    updatedAt: storeModule.serverTimestamp(),
    playerName: state?.player ? `${state.player.firstName} ${state.player.lastName}` : null,
    overall: state?.player?.overall ?? null,
    age: state?.player?.age ?? null,
    club: state?.player?.club ?? null,
  });
}

/** Lê o estado salvo na nuvem. Retorna null se não existir. */
export async function loadFromCloud(uid) {
  const context = await initFirebase();
  const { storeModule } = context;
  const reference = storeModule.doc(context.db, 'careers', uid);
  const snapshot = await storeModule.getDoc(reference);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  try {
    return typeof data.state === 'string' ? JSON.parse(data.state) : data.state ?? null;
  } catch (error) {
    console.warn('[firebase] save corrompido na nuvem:', error);
    return null;
  }
}

/** Apaga o save da nuvem. */
export async function deleteCloudSave(uid) {
  const context = await initFirebase();
  const { storeModule } = context;
  await storeModule.deleteDoc(storeModule.doc(context.db, 'careers', uid));
}

/** Mensagens de erro do Firebase em português. */
export function authErrorMessage(error) {
  const code = error?.code ?? '';
  const messages = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/missing-password': 'Digite uma senha.',
    'auth/weak-password': 'A senha precisa de pelo menos 6 caracteres.',
    'auth/email-already-in-use': 'Esse e-mail já está cadastrado. Tente entrar.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/user-not-found': 'Não encontramos uma conta com esse e-mail.',
    'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
    'auth/popup-closed-by-user': 'A janela de login foi fechada.',
    'auth/operation-not-allowed': 'Esse método de login não está habilitado no Firebase.',
    'auth/admin-restricted-operation': 'Login anônimo não está habilitado no Firebase.',
    'auth/network-request-failed': 'Sem conexão com o Firebase.',
  };
  return messages[code] ?? error?.message ?? 'Não foi possível completar a ação.';
}
