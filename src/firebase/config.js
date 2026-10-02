// Configuração do Firebase.
//
// O jogo funciona 100% sem Firebase (salva no navegador via localStorage).
// Para habilitar login e save na nuvem:
//   1. Crie um projeto em https://console.firebase.google.com
//   2. Ative Authentication > Sign-in method > E-mail/senha (e Anônimo, se quiser)
//   3. Crie um banco Cloud Firestore em modo de produção
//   4. Em "Configurações do projeto > Seus aplicativos > Web", copie o objeto
//      de configuração e cole abaixo.
//
// A apiKey do Firebase Web é pública por design — ela identifica o projeto e
// não dá acesso aos dados. A proteção real vem das regras do Firestore
// (veja firestore.rules na raiz do repositório).

export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

/** Só tenta conectar quando os campos essenciais estiverem preenchidos. */
export const isFirebaseConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain);
