const firebaseConfig = {
  apiKey: "AIzaSyCk-mHqIOutr6fi8OFyUT6ep6zSGG4mcQ4",
  authDomain: "recibos-app-e56b6.firebaseapp.com",
  projectId: "recibos-app-e56b6",
  storageBucket: "recibos-app-e56b6.firebasestorage.app",
  messagingSenderId: "958562033309",
  appId: "1:958562033309:web:2e12a46a39a403f4043e74"
};
firebase.initializeApp(firebaseConfig);
const DB = firebase.firestore();

async function addUsuario(usuario) {
  const ref = await DB.collection('usuarios').add(usuario);
  return ref.id;
}

async function updateUsuario(usuario) {
  const { id, ...data } = usuario;
  await DB.collection('usuarios').doc(id).set(data, { merge: true });
}

async function deleteUsuario(id) {
  await DB.collection('usuarios').doc(id).delete();
}

async function getAllUsuarios() {
  const snap = await DB.collection('usuarios').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

async function getUsuario(id) {
  const doc = await DB.collection('usuarios').doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function guardarPago(pago) {
  const snap = await DB.collection('pagos').get();
  const existente = snap.docs.find(d => {
    const data = d.data();
    return data.userId === pago.userId && data.anio === pago.anio && data.mes === pago.mes;
  });
  if (existente) {
    await existente.ref.update(pago);
    return existente.id;
  }
  const ref = await DB.collection('pagos').add(pago);
  return ref.id;
}

async function eliminarPago(id) {
  await DB.collection('pagos').doc(id).delete();
}

async function getPagosPorMes(anio, mes) {
  const snap = await DB.collection('pagos').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(p => p.anio === anio && p.mes === mes);
}

async function getAllPagos() {
  const snap = await DB.collection('pagos').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.anio - a.anio || b.mes - a.mes);
}
