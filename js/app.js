const USUARIOS_SISTEMA = {
  jesus: 'jesus12345',
  yoel: '#Yoel12345',
  norbey: '#Norbey12345'
};

let usuarios = [];
let mesActual = new Date().getMonth() + 1;
let anioActual = new Date().getFullYear();
let editandoUsuario = null;
let usuarioActivo = null;

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function $(id) { return document.getElementById(id); }
function formatMonto(n) { return Math.round(n).toLocaleString('es-CL'); }
function nextCod() {
  const max = usuarios.reduce((m, u) => Math.max(m, u.cod || 0), 1000);
  return max + 1;
}

function verPassword() {
  const input = $('loginPass');
  const toggle = $('togglePass');
  if (input.type === 'password') {
    input.type = 'text';
    toggle.textContent = '🙈';
  } else {
    input.type = 'password';
    toggle.textContent = '👁️';
  }
}

function init() {
  const recordado = localStorage.getItem('recibos_recordar_user');
  if (recordado) {
    $('loginUser').value = recordado;
    $('loginPass').value = localStorage.getItem('recibos_recordar_pass') || '';
    $('recordar').checked = true;
  }
  document.getElementById('loginUser').addEventListener('keydown', (e) => { if (e.key === 'Enter') iniciarSesion(); });
  document.getElementById('loginPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') iniciarSesion(); });
}

function iniciarSesion() {
  const user = $('loginUser').value.trim().toLowerCase();
  const pass = $('loginPass').value;
  const error = $('loginError');
  if (USUARIOS_SISTEMA[user] && USUARIOS_SISTEMA[user] === pass) {
    usuarioActivo = user;
    if ($('recordar').checked) {
      localStorage.setItem('recibos_recordar_user', user);
      localStorage.setItem('recibos_recordar_pass', pass);
    } else {
      localStorage.removeItem('recibos_recordar_user');
      localStorage.removeItem('recibos_recordar_pass');
    }
    error.style.display = 'none';
    $('loginScreen').style.display = 'none';
    $('appMain').style.display = 'block';
    $('usuarioLogueado').textContent = '👤 ' + user;
    navigator.serviceWorker?.register('sw.js');
    if (user === 'jesus') {
      document.querySelector('[data-seccion="seccionUsuarios"]').style.display = 'none';
      document.querySelector('[data-seccion="seccionRecibos"]').style.display = 'none';
      document.querySelector('[data-seccion="seccionPagos"]').click();
    }
    cargarDatos();
    configurarNavegacion();
    configurarFormularios();
  } else {
    error.textContent = 'Usuario o contraseña incorrectos';
    error.style.display = 'block';
    $('loginPass').value = '';
    $('loginPass').focus();
  }
}

function cerrarSesion() {
  usuarioActivo = null;
  $('appMain').style.display = 'none';
  $('loginScreen').style.display = 'flex';
  $('loginUser').value = '';
  $('loginPass').value = '';
  $('loginError').style.display = 'none';
}

async function cargarDatos() {
  usuarios = await getAllUsuarios();
  if (usuarioActivo === 'jesus') {
    usuarios = usuarios.filter(u => u.vereda && u.vereda.toLowerCase().includes('brisas'));
  }
  renderizarUsuarios();
  if ($('cod')) $('cod').value = nextCod();
  renderizarSelectPago();
  renderizarSelectRecibo();
  initSelectoresRecibo();
  await renderizarListaRecibos();
  actualizarSelectorMes();
  await cargarPagosMes();
  await cargarHistorial();
}

function configurarNavegacion() {
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (usuarioActivo === 'jesus' && (btn.dataset.seccion === 'seccionUsuarios' || btn.dataset.seccion === 'seccionRecibos')) return;
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('activo'));
      document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activo'));
      btn.classList.add('activo');
      $(btn.dataset.seccion).classList.add('activo');
      if (btn.dataset.seccion === 'seccionRecibos') renderizarListaRecibos();
    });
  });
}

function configurarFormularios() {
  $('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      cod: parseInt($('cod').value) || nextCod(),
      nombre: $('nombre').value.trim(),
      telefono: $('telefono').value.trim(),
      vereda: $('vereda').value.trim(),
      monto: parseFloat($('monto').value)
    };
    if (!data.nombre || !data.monto) return;
    if (editandoUsuario) {
      data.id = editandoUsuario;
      await updateUsuario(data);
      editandoUsuario = null;
      $('btnGuardarUsuario').textContent = 'Guardar';
    } else {
      await addUsuario(data);
    }
    $('formUsuario').reset();
    await cargarDatos();
  });

  const formPago = $('formPago');
  if (formPago) {
    formPago.addEventListener('submit', async (e) => {
      e.preventDefault();
      const userId = $('pagoUsuario').value;
      const pago = {
        userId,
        mes: mesActual,
        anio: anioActual,
        monto: parseFloat($('pagoMonto').value),
        fechaPago: new Date().toISOString(),
        status: 'pagado'
      };
      await guardarPago(pago);
      formPago.reset();
      await cargarDatos();
      actualizarSelectorMes();
    });
  }


}

function renderizarUsuarios() {
  const lista = $('listaUsuarios');
  if (usuarios.length === 0) {
    lista.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">No hay usuarios registrados aún</td></tr>';
    return;
  }
  lista.innerHTML = usuarios.map(u => `
    <tr>
      <td>${u.cod || '—'}</td>
      <td>${u.nombre}</td>
      <td>${u.telefono || '—'}</td>
      <td>${u.vereda || '—'}</td>
      <td>$${formatMonto(u.monto)}</td>
      <td>
        <button class="btn btn-secundario btn-small" onclick="editarUsuario('${u.id}')">✏️</button>
        <button class="btn btn-peligro btn-small" onclick="eliminarUsuario('${u.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
  renderizarSelectPago();
}

function renderizarSelectPago() {
  const sel = $('pagoUsuario');
  if (!sel) return;
  sel.innerHTML = '<option value="">Seleccionar usuario</option>' +
    usuarios.map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');
  sel.onchange = () => {
    const u = usuarios.find(x => x.id === sel.value);
    const montoField = $('pagoMonto');
    if (montoField) montoField.value = u ? u.monto : '';
  };
}

function renderizarSelectRecibo() {
  const sel = $('reciboUsuario');
  if (sel) {
    sel.innerHTML = '<option value="">Seleccionar...</option>' +
      usuarios.map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');
  }
}

function initSelectoresRecibo() {
  const selMes = $('reciboMes');
  const selAnio = $('reciboAnio');
  const ahora = new Date();
  if (selMes && selMes.options.length === 0) {
    selMes.innerHTML = meses.map((m, i) => `<option value="${i+1}" ${i === ahora.getMonth() ? 'selected' : ''}>${m}</option>`).join('');
  }
  if (selAnio && !selAnio.value) {
    selAnio.value = ahora.getFullYear();
  }
}

async function renderizarListaRecibos() {
  const div = $('listaRecibos');
  if (!div) return;
  if (usuarios.length === 0) {
    div.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No hay clientes registrados. Ve a la pestaña Usuarios para agregar.</p>';
    return;
  }
  const selMes = $('reciboMes');
  const selAnio = $('reciboAnio');
  let mes, anio;
  if (selMes && selAnio && selMes.options.length > 0) {
    mes = parseInt(selMes.value);
    anio = parseInt(selAnio.value);
  } else {
    const ahora = new Date();
    mes = ahora.getMonth() + 1;
    anio = ahora.getFullYear();
  }
  const pagos = await getPagosPorMes(anio, mes);
  const pagosMap = {};
  pagos.forEach(p => { pagosMap[p.userId] = p; });
  div.innerHTML = usuarios.map(u => {
    const pago = pagosMap[u.id];
    const statusClass = pago ? 'badge-pagado' : 'badge-pendiente';
    const statusText = pago ? 'Pagado' : 'Pendiente';
    return `<div class="usuario-item">
      <div class="usuario-info">
        <div class="usuario-nombre">${u.nombre}</div>
        <div class="usuario-detalle">${u.telefono ? '📞 ' + u.telefono : ''} — $${formatMonto(u.monto)}/mes <span class="${statusClass}">${statusText}</span></div>
      </div>
      <div class="usuario-acciones">
        ${pago ? `<button class="btn btn-primario btn-small" onclick="abrirRecibo('${u.id}', ${mes}, ${anio})">🧾 Recibo</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function consultarRecibos() {
  renderizarListaRecibos();
}

function actualizarSelectorMes() {
  const sel = $('selectorMes');
  sel.innerHTML = meses.map((m, i) => {
    const selected = (i + 1 === mesActual) ? 'selected' : '';
    return `<option value="${i+1}" ${selected}>${m} ${anioActual}</option>`;
  }).join('');
}

function cambiarMes(delta) {
  mesActual += delta;
  if (mesActual > 12) { mesActual = 1; anioActual++; }
  if (mesActual < 1) { mesActual = 12; anioActual--; }
  actualizarSelectorMes();
  cargarPagosMes();
}

async function cargarPagosMes() {
  const pagos = await getPagosPorMes(anioActual, mesActual);
  const pagosMap = {};
  pagos.forEach(p => { pagosMap[p.userId] = p; });

  const tbody = $('tablaPagos');
  if (usuarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;">No hay usuarios registrados</td></tr>';
    return;
  }
  tbody.innerHTML = usuarios.map(u => {
    const pago = pagosMap[u.id];
    const statusClass = pago ? 'badge-pagado' : 'badge-pendiente';
    const statusText = pago ? 'Pagado' : 'Pendiente';
    const fecha = pago ? new Date(pago.fechaPago).toLocaleDateString() : '-';
    return `<tr>
      <td>${u.nombre}</td>
      <td>$${formatMonto(u.monto)}</td>
      <td><span class="${statusClass}">${statusText}</span></td>
      <td>${fecha}</td>
      <td>${pago ? '—' : `<button class="btn btn-exito btn-small" onclick="pagarRapido('${u.id}', ${u.monto})">Pagar ahora</button>`}</td>
      <td>${pago ? `<button class="btn btn-small btn-secundario" onclick="abrirRecibo('${u.id}', ${mesActual}, ${anioActual})">🧾</button>` : '—'}</td>
      <td>${pago && usuarioActivo !== 'jesus' ? `<button class="btn btn-small btn-peligro" onclick="anularPago('${pago.id}')">Anular</button>` : '—'}</td>
    </tr>`;
  }).join('');
}

async function pagarRapido(userId, monto) {
  await guardarPago({
    userId, mes: mesActual, anio: anioActual, monto,
    fechaPago: new Date().toISOString(), status: 'pagado'
  });
  await cargarPagosMes();
}

async function anularPago(id) {
  if (!confirm('¿Anular este pago?')) return;
  await eliminarPago(id);
  await cargarPagosMes();
}

function editarUsuario(id) {
  const u = usuarios.find(x => x.id === id);
  if (!u) return;
  editandoUsuario = id;
  $('cod').value = u.cod || '';
  $('nombre').value = u.nombre;
  $('telefono').value = u.telefono;
  $('vereda').value = u.vereda;
  $('monto').value = u.monto;
  $('btnGuardarUsuario').textContent = 'Actualizar';
  $('formUsuario').scrollIntoView({ behavior: 'smooth' });
}

async function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario? También se eliminarán sus pagos.')) return;
  await deleteUsuario(id);
  const pagos = await getAllPagos();
  for (const p of pagos) {
    if (p.userId === id) await eliminarPago(p.id);
  }
  await cargarDatos();
}

async function cargarHistorial() {
  const div = $('historialPagos');
  const pagos = await getAllPagos();
  if (pagos.length === 0) {
    div.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No hay pagos registrados aún</p>';
    return;
  }
  const resumen = {};
  pagos.forEach(p => {
    const key = `${p.anio}-${String(p.mes).padStart(2,'0')}`;
    if (!resumen[key]) resumen[key] = { anio: p.anio, mes: p.mes, total: 0, count: 0 };
    resumen[key].total += p.monto;
    resumen[key].count++;
  });
  const keys = Object.keys(resumen).sort().reverse();
  div.innerHTML = keys.map(key => {
    const r = resumen[key];
    return `<div class="flex flex-between" style="padding:8px 0;border-bottom:1px solid #eee;">
      <span><strong>${meses[r.mes-1]} ${r.anio}</strong></span>
      <span>${r.count} pago(s) — $${formatMonto(r.total)}</span>
    </div>`;
  }).join('');
}

function cancelarEdicion() {
  editandoUsuario = null;
  $('formUsuario').reset();
  $('cod').value = nextCod();
  $('btnGuardarUsuario').textContent = 'Guardar';
}

function abrirRecibo(userId, mes, anio) {
  const u = usuarios.find(x => x.id === userId);
  if (!u) return;
  const m = mes || mesActual;
  const a = anio || anioActual;
  $('reciboNombre').textContent = u.nombre;
  $('reciboTelefono').textContent = u.telefono || '—';
  $('reciboPeriodo').textContent = `${meses[m - 1]} ${a}`;
  $('reciboMonto').textContent = `$${formatMonto(u.monto)}`;
  $('reciboFecha').textContent = new Date().toLocaleDateString();
  $('reciboId').textContent = `R-${a}-${String(m).padStart(2,'0')}-${String(userId).padStart(3,'0')}`;
  $('modalRecibo').classList.add('activo');
}

function cerrarRecibo() {
  $('modalRecibo').classList.remove('activo');
}

function imprimirRecibo() {
  const contenido = document.querySelector('.recibo').cloneNode(true);
  const ventana = window.open('', '_blank');
  ventana.document.write(`
    <html><head><title>Recibo de Pago</title>
    <style>
      body { font-family: 'Courier New', monospace; padding: 40px; max-width: 400px; margin: 0 auto; }
      .recibo-header { text-align: center; margin-bottom: 20px; }
      .recibo-header h2 { font-size: 22px; }
      .recibo-linea { border-top: 1px dashed #333; margin: 12px 0; }
      .recibo-fila { display: flex; justify-content: space-between; padding: 4px 0; }
      .recibo-total { font-size: 18px; font-weight: bold; margin-top: 8px; }
      .recibo-footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
      @media print { body { padding: 0; } }
    </style>
    </head><body>
    ${contenido.innerHTML}
    <script>window.print();<\/script>
    </body></html>
  `);
  ventana.document.close();
}

function compartirRecibo() {
  const recibo = document.querySelector('.recibo');
  html2canvas(recibo, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => {
    canvas.toBlob(blob => {
      const file = new File([blob], 'recibo.png', { type: 'image/png' });
      try {
        if (navigator.share) {
          navigator.share({ title: 'Recibo de Pago', files: [file] }).catch(() => {
            navigator.share({ title: 'Recibo de Pago', text: '🧾 Recibo de Pago' }).catch(() => {});
          });
          return;
        }
      } catch (e) {}
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recibo.png';
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
