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
  try {
    const credential = await context.authModule.signInWithPopup(context.auth, provider);
    return credential.user;
  } catch (error) {
    // Navegadores que bloqueiam janelas (comum no celular): login por redirecionamento.
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
      await context.authModule.signInWithRedirect(context.auth, provider);
      return null;
    }
    throw error;
  }
}

/**
 * Convidado vira conta de verdade sem trocar de id: as carreiras salvas
 * continuam no mesmo lugar.
 */
export async function upgradeGuestWithEmail(email, password) {
  const context = await initFirebase();
  const credential = context.authModule.EmailAuthProvider.credential(email, password);
  const result = await context.authModule.linkWithCredential(context.auth.currentUser, credential);
  return result.user;
}

export async function upgradeGuestWithGoogle() {
  const context = await initFirebase();
  const provider = new context.authModule.GoogleAuthProvider();
  try {
    const result = await context.authModule.linkWithPopup(context.auth.currentUser, provider);
    return result.user;
  } catch (error) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
      await context.authModule.linkWithRedirect(context.auth.currentUser, provider);
      return null;
    }
    throw error;
  }
}

export async function signOutUser() {
  const context = await initFirebase().catch(() => null);
  if (!context) return;
  await context.authModule.signOut(context.auth);
}

export const currentUser = () => auth?.currentUser ?? null;

// --------------------------------------------------------------- carreiras
// Cada conta guarda várias carreiras em users/{uid}/careers/{careerId}.
// O documento leva a ficha (para listar sem abrir) e o estado completo.

function careersCollection(context, uid) {
  return context.storeModule.collection(context.db, 'users', uid, 'careers');
}

/** Salva uma carreira na nuvem. */
export async function saveCareerToCloud(uid, careerId, state, meta) {
  const context = await initFirebase();
  const { storeModule } = context;
  const reference = storeModule.doc(careersCollection(context, uid), careerId);
  await storeModule.setDoc(reference, {
    meta,
    state: JSON.stringify(state),
    clientUpdatedAt: meta.updatedAt,
    updatedAt: storeModule.serverTimestamp(),
  });
}

/** Lista as fichas das carreiras da conta, sem desempacotar os estados. */
export async function listCloudCareers(uid) {
  const context = await initFirebase();
  const snapshot = await context.storeModule.getDocs(careersCollection(context, uid));
  return snapshot.docs.map((item) => ({ ...(item.data().meta ?? {}), id: item.id, updatedAt: item.data().clientUpdatedAt ?? 0 }));
}

/** Lê o estado completo de uma carreira. Retorna null se não existir. */
export async function loadCareerFromCloud(uid, careerId) {
  const context = await initFirebase();
  const { storeModule } = context;
  const snapshot = await storeModule.getDoc(storeModule.doc(careersCollection(context, uid), careerId));
  if (!snapshot.exists()) return null;
  try {
    const data = snapshot.data();
    return typeof data.state === 'string' ? JSON.parse(data.state) : (data.state ?? null);
  } catch (error) {
    console.warn('[firebase] save corrompido na nuvem:', error);
    return null;
  }
}

/** Apaga uma carreira da nuvem. */
export async function deleteCareerFromCloud(uid, careerId) {
  const context = await initFirebase();
  const { storeModule } = context;
  await storeModule.deleteDoc(storeModule.doc(careersCollection(context, uid), careerId));
}

/**
 * Save do formato antigo (uma carreira por conta, em careers/{uid}).
 * Lido uma vez para migrar e depois apagado.
 */
export async function takeLegacyCloudSave(uid) {
  const context = await initFirebase();
  const { storeModule } = context;
  const reference = storeModule.doc(context.db, 'careers', uid);
  const snapshot = await storeModule.getDoc(reference);
  if (!snapshot.exists()) return null;
  let state = null;
  try {
    const data = snapshot.data();
    state = typeof data.state === 'string' ? JSON.parse(data.state) : (data.state ?? null);
  } catch {
    state = null;
  }
  return { state, discard: () => storeModule.deleteDoc(reference) };
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
    'auth/credential-already-in-use': 'Essa conta Google já existe. Saia do convidado e entre com ela (as carreiras do convidado não passam para ela).',
    'auth/provider-already-linked': 'Esta conta já está ligada a esse login.',
    'auth/requires-recent-login': 'Por segurança, entre de novo e tente outra vez.',
    'auth/network-request-failed': 'Sem conexão com o Firebase.',
    'auth/unauthorized-domain': 'Este endereço não está autorizado no Firebase. Adicione o domínio em Authentication > Settings > Authorized domains.',
    'auth/configuration-not-found': 'O login ainda não foi ativado no Firebase (Authentication > Sign-in method).',
    'auth/invalid-api-key': 'A apiKey em src/firebase/config.js está errada.',
    'permission-denied': 'O Firestore recusou o acesso. Publique as regras de firestore.rules no console do Firebase.',
    unavailable: 'Firestore fora do ar ou sem internet. A carreira continua salva no navegador.',
  };
  return messages[code] ?? error?.message ?? 'Não foi possível completar a ação.';
}
