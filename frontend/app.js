const API_BASE = 'http://localhost:3000/api';

const state = {
    token: localStorage.getItem('scentvault_token'),
    usuario: JSON.parse(localStorage.getItem('scentvault_usuario') || 'null'),
    perfumes: [],
    clientes: [],
    ventas: [],
    saleItems: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const currency = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
});

const dateFormat = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short'
});

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    updateDateChip();
    setInterval(updateDateChip, 60000); // Actualizar cada minuto
    if (state.token) {
        showApp();
        loadAll();
    }
});

function updateDateChip() {
    const dateChip = $('#date-chip');
    if (dateChip) {
        dateChip.textContent = new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }).format(new Date());
    }
}

function bindEvents() {
     $('#login-form').addEventListener('submit', handleLogin);
      const logoutBtn = $('#logout-button');
      if (logoutBtn) {
          logoutBtn.addEventListener('click', logout);
          console.log('Logout button event listener attached successfully');
      } else {
          console.error('Logout button not found in DOM');
      }
    $('#refresh-dashboard').addEventListener('click', loadDashboard);
    $('#reload-perfumes').addEventListener('click', loadPerfumes);
    $('#reload-clientes').addEventListener('click', loadClientes);
    $('#reload-ventas').addEventListener('click', loadVentas);
    $('#reload-inventario')?.addEventListener('click', loadInventario);
    $('#reload-usuarios')?.addEventListener('click', loadUsuarios);
    $('#sidebar-toggle').addEventListener('click', () => $('#app-view').classList.toggle('sidebar-collapsed'));
    $('#cliente-search').addEventListener('input', renderClientes);
    $('#inventario-search')?.addEventListener('input', renderInventario);
    $('#inventario-filter')?.addEventListener('change', renderInventario);
    $('#perfume-form').addEventListener('submit', savePerfume);
    $('#cliente-form').addEventListener('submit', saveCliente);
    $('#venta-form').addEventListener('submit', saveVenta);
    $('#usuario-form')?.addEventListener('submit', saveUsuario);
    $('#profile-form')?.addEventListener('submit', saveProfile);
    $('#security-form')?.addEventListener('submit', changePassword);
    $('#add-product').addEventListener('click', addSaleItem);
    $('#cancel-perfume-edit').addEventListener('click', resetPerfumeForm);
    $('#cancel-cliente-edit').addEventListener('click', resetClienteForm);
    $('#cancel-usuario-edit')?.addEventListener('click', resetUsuarioForm);
    $('#export-pdf')?.addEventListener('click', exportReportPDF);
    $('#export-excel')?.addEventListener('click', exportReportExcel);
    
    // Preview de imagen para perfumes
    $('#perfume-imagen')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = $('#imagen-preview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.innerHTML = `<img src="${event.target.result}" alt="Vista previa"><p>${file.name}</p>`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    });

    $$('.nav-link').forEach((button) => {
        button.addEventListener('click', () => switchView(button.dataset.view));
    });
}

async function handleLogin(event) {
    event.preventDefault();
    const message = $('#login-message');
    const formData = new FormData(event.currentTarget);
    message.textContent = '';

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(readApiError(data));

        state.token = data.token;
        state.usuario = data.usuario;
        localStorage.setItem('scentvault_token', data.token);
        localStorage.setItem('scentvault_usuario', JSON.stringify(data.usuario));
        showApp();
        await loadAll();
        toast('Sesión iniciada correctamente', 'success');
    } catch (error) {
        message.textContent = error.message;
    }
}

function showApp() {
    $('#login-view').classList.add('is-hidden');
    $('#app-view').classList.remove('is-hidden');
    
    // Actualizar información del usuario
    const nombre = state.usuario?.nombre || 'Usuario';
    const correo = state.usuario?.correo || 'usuario@scentvault.com';
    const rol = state.usuario?.rol || 'vendedor';
    
    $('#user-name').textContent = nombre;
    $('#user-role').textContent = rol;
    $('#profile-nombre').textContent = nombre;
    $('#profile-email').textContent = correo;
    $('#profile-avatar-initial').textContent = nombre.charAt(0).toUpperCase();
    
    // Aplicar controles de acceso basados en rol
    applyRoleBasedAccess(rol);
}

function applyRoleBasedAccess(rol) {
    const isAdmin = rol === 'admin';
    
    // Mostrar/ocultar botones de navegación
    $$('.admin-only').forEach((element) => {
        if (isAdmin) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    });
    
    // Mostrar/ocultar secciones admin
    $$('.admin-only[class*="section"]').forEach((element) => {
        element.style.display = 'none';
    });
}

function logout() {
     console.log('Logout function called');
     localStorage.removeItem('scentvault_token');
     localStorage.removeItem('scentvault_usuario');
     state.token = null;
     state.usuario = null;
     $('#app-view').classList.add('is-hidden');
     $('#login-view').classList.remove('is-hidden');
     $('#login-form').reset();
     console.log('Logout completed successfully');
}

function switchView(view) {
    // Verificar acceso basado en rol
    const isAdmin = state.usuario?.rol === 'admin';
    const adminOnlyViews = ['reportes', 'configuracion', 'usuarios'];
    
    if (!isAdmin && adminOnlyViews.includes(view)) {
        toast('No tienes permisos para acceder a esta sección', 'error');
        return;
    }
    
    $$('.nav-link').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
    $$('.view-section').forEach((section) => section.classList.add('is-hidden'));
    $(`#${view}-section`).classList.remove('is-hidden');
    
    // Actualizar título y subtítulo de la vista
    const titles = {
        'dashboard': '¡Bienvenido!' ,
        'perfumes': 'Catálogo de Perfumes',
        'clientes': 'Gestión de Clientes',
        'ventas': 'Punto de Venta',
        'inventario': 'Control de Inventario',
        'reportes': 'Reportes y Análisis',
        'configuracion': 'Configuración del Sistema',
        'usuarios': 'Gestión de Usuarios'
    };
    
    const subtitles = {
        'dashboard': 'Resumen general de tu perfumería',
        'perfumes': 'Administra tu catálogo de fragancias',
        'clientes': 'Gestiona tus clientes y preferencias',
        'ventas': 'Punto de venta y transacciones',
        'inventario': 'Control de stock y alertas',
        'reportes': 'Análisis y estadísticas del negocio',
        'configuracion': 'Administra tu perfil y preferencias',
        'usuarios': 'Gestiona usuarios del sistema'
    };
    
    const nombre = state.usuario?.nombre || 'Usuario';
    if (view === 'dashboard') {
        $('#view-title').textContent = `¡Bienvenido, ${nombre}!`;
    } else {
        $('#view-title').textContent = titles[view] || view.charAt(0).toUpperCase() + view.slice(1);
    }
    
    $('#view-subtitle').textContent = subtitles[view] || '';
    
    // Cargar datos específicos de la vista
    if (view === 'dashboard') loadDashboard();
    if (view === 'ventas') hydrateSaleSelects();
    if (view === 'inventario') loadInventario();
    if (view === 'reportes') loadReportes();
}

async function loadAll() {
    await Promise.all([loadPerfumes(), loadClientes(), loadVentas()]);
    await loadDashboard();
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.token}`,
            ...(options.headers || {})
        }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
        logout();
        throw new Error('Sesión expirada. Inicia sesión nuevamente.');
    }
    if (!response.ok || data.ok === false) throw new Error(readApiError(data));
    return data;
}

async function loadDashboard() {
    try {
        const data = await apiRequest('/dashboard/resumen');
        const resumen = data.data || data.resumen || data;
        renderStats({
            perfumes: resumen.perfumes || resumen.total_perfumes || state.perfumes.length,
            clientes: resumen.clientes || resumen.total_clientes || state.clientes.length,
            ventas: resumen.ventas || resumen.total_ventas || state.ventas.length,
            ingresos: resumen.ingresos || resumen.total_ingresos || sumSales(),
            inventario: resumen.valor_inventario || resumen.total_inventario || inventoryValue()
        });
    } catch (error) {
        renderStats({
            perfumes: state.perfumes.length,
            clientes: state.clientes.length,
            ventas: state.ventas.length,
            ingresos: sumSales(),
            inventario: inventoryValue()
        });
    }
    renderRecentSales();
    renderLowStock();
}

function renderStats(stats) {
    $('#stat-perfumes').textContent = stats.perfumes;
    $('#stat-clientes').textContent = stats.clientes;
    $('#stat-ingresos').textContent = currency.format(Number(stats.ingresos || 0));
    const inventario = $('#stat-inventario');
    if (inventario) inventario.textContent = currency.format(Number(stats.inventario || 0));
    const ventas = $('#stat-ventas');
    if (ventas) ventas.textContent = stats.ventas;
    
    // Nuevos KPIs
    const mesStat = $('#stat-mes');
    if (mesStat) mesStat.textContent = currency.format(Number(stats.mes || stats.ingresos || 0));
    
    const agotadosStat = $('#stat-agotados');
    if (agotadosStat) {
        const agotados = state.perfumes.filter((p) => Number(p.stock) === 0).length;
        agotadosStat.textContent = agotados;
    }
}

async function loadPerfumes() {
    try {
        const data = await apiRequest('/perfumes');
        state.perfumes = data.data || [];
        renderPerfumes();
        hydrateSaleSelects();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function loadClientes() {
    try {
        const data = await apiRequest('/clientes');
        state.clientes = data.data || [];
        renderClientes();
        hydrateSaleSelects();
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function loadVentas() {
    try {
        const data = await apiRequest('/ventas');
        state.ventas = data.data || [];
        renderVentas();
    } catch (error) {
        toast(error.message, 'error');
    }
}

function renderPerfumes() {
    const container = $('#perfumes-list');
    if (!state.perfumes.length) {
        container.innerHTML = emptyState('No hay perfumes registrados.');
        return;
    }

    container.innerHTML = state.perfumes.map((perfume) => `
        <article class="perfume-card">
            ${perfume.imagen_url ? `<img class="perfume-thumb" src="${escapeHtml(perfume.imagen_url)}" alt="${escapeHtml(perfume.nombre)}">` : '<div class="perfume-thumb"></div>'}
            <div>
                <h4>${escapeHtml(perfume.nombre)}</h4>
                <p>${escapeHtml(perfume.marca)} - ${escapeHtml(perfume.familia_olfativa)}</p>
                <p>${escapeHtml(perfume.temporada || 'Coleccion privada')}</p>
            </div>
            <div class="perfume-meta">
                <span>${currency.format(Number(perfume.precio))}</span>
                <span>Stock ${perfume.stock}</span>
            </div>
            <button class="mini-button" type="button" data-edit-perfume="${perfume.id}">Editar</button>
        </article>
    `).join('');

    $$('[data-edit-perfume]').forEach((button) => {
        button.addEventListener('click', () => editPerfume(Number(button.dataset.editPerfume)));
    });
}

function renderClientes() {
    const tbody = $('#clientes-table');
    const search = ($('#cliente-search')?.value || '').trim().toLowerCase();
    const clientes = state.clientes.filter((cliente) => [
        cliente.nombre,
        cliente.telefono,
        cliente.correo,
        cliente.preferencia_olfativa
    ].join(' ').toLowerCase().includes(search));

    if (!clientes.length) {
        tbody.innerHTML = `<tr><td colspan="5">No hay clientes registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = clientes.map((cliente) => `
        <tr>
            <td>${escapeHtml(cliente.nombre)}</td>
            <td>${escapeHtml(cliente.telefono || '')}</td>
            <td>${escapeHtml(cliente.correo || '')}</td>
            <td>${escapeHtml(cliente.preferencia_olfativa || '')}</td>
            <td><button class="mini-button" type="button" data-edit-cliente="${cliente.id}">Editar</button></td>
        </tr>
    `).join('');

    $$('[data-edit-cliente]').forEach((button) => {
        button.addEventListener('click', () => editCliente(Number(button.dataset.editCliente)));
    });
}

function renderVentas() {
    const tbody = $('#ventas-table');
    if (!state.ventas.length) {
        tbody.innerHTML = `<tr><td colspan="6">No hay ventas registradas.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.ventas.map((venta) => `
        <tr>
            <td>#${venta.id}</td>
            <td>${escapeHtml(venta.cliente || 'Cliente mostrador')}</td>
            <td>${escapeHtml(venta.vendedor || '')}</td>
            <td>${escapeHtml(venta.metodo_pago || '')}</td>
            <td>${currency.format(Number(venta.total || 0))}</td>
            <td>${formatDate(venta.fecha_venta)}</td>
        </tr>
    `).join('');
}

async function savePerfume(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const id = form.querySelector('input[name="id"]').value;
    
    // Crear FormData en lugar de JSON
    const formData = new FormData(form);
    
    // Convertir datos numéricos
    const precio = formData.get('precio');
    const stock = formData.get('stock');
    const duracion_horas = formData.get('duracion_horas');
    
    if (precio) formData.set('precio', Number(precio));
    if (stock) formData.set('stock', Number(stock));
    if (duracion_horas) formData.set('duracion_horas', Number(duracion_horas));
    
    // Remover el campo id de FormData (va en la URL)
    formData.delete('id');
    
    try {
        const response = await fetch(`${API_BASE}${id ? `/perfumes/${id}` : '/perfumes'}`, {
            method: id ? 'PUT' : 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });
        
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(readApiError(data));
        
        resetPerfumeForm();
        await loadPerfumes();
        await loadDashboard();
        toast('Perfume guardado correctamente', 'success');
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function saveCliente(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formPayload(form);
    const id = payload.id;
    delete payload.id;

    try {
        await apiRequest(id ? `/clientes/${id}` : '/clientes', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
        resetClienteForm();
        await loadClientes();
        await loadDashboard();
        toast('Cliente guardado correctamente', 'success');
    } catch (error) {
        toast(error.message, 'error');
    }
}

async function saveVenta(event) {
    event.preventDefault();
    if (!state.saleItems.length) {
        toast('Agrega al menos un producto.', 'error');
        return;
    }

    const formData = new FormData(event.currentTarget);
    const clienteId = formData.get('cliente_id');
    const payload = {
        cliente_id: clienteId ? Number(clienteId) : null,
        metodo_pago: formData.get('metodo_pago'),
        productos: state.saleItems.map((item) => ({
            perfume_id: item.perfume_id,
            cantidad: item.cantidad
        }))
    };

    try {
        await apiRequest('/ventas', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        state.saleItems = [];
        $('#venta-form').reset();
        renderSaleItems();
        await loadAll();
        toast('Venta registrada correctamente', 'success');
    } catch (error) {
        toast(error.message, 'error');
    }
}

function addSaleItem() {
    const perfumeId = Number($('#venta-perfume').value);
    const cantidad = Number($('#venta-cantidad').value);
    const perfume = state.perfumes.find((item) => item.id === perfumeId);

    if (!perfume || cantidad < 1) {
        toast('Selecciona un perfume y una cantidad válida.', 'error');
        return;
    }

    const existing = state.saleItems.find((item) => item.perfume_id === perfumeId);
    if (existing) {
        existing.cantidad += cantidad;
    } else {
        state.saleItems.push({
            perfume_id: perfumeId,
            nombre: perfume.nombre,
            precio: Number(perfume.precio),
            cantidad
        });
    }
    renderSaleItems();
}

function renderSaleItems() {
    const container = $('#sale-items');
    if (!state.saleItems.length) {
        container.innerHTML = emptyState('Agrega productos a la venta.');
        return;
    }

    const total = state.saleItems.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

    container.innerHTML = state.saleItems.map((item, index) => `
        <div class="sale-row">
            <div>
                <strong>${escapeHtml(item.nombre)}</strong>
                <p>${item.cantidad} x ${currency.format(item.precio)} = ${currency.format(item.precio * item.cantidad)}</p>
            </div>
            <button class="mini-button" type="button" data-remove-sale-item="${index}">Quitar</button>
        </div>
    `).join('') + `
        <div class="sale-row sale-total">
            <div>
                <strong>Total estimado</strong>
                <p>Confirmacion visual antes de registrar la venta.</p>
            </div>
            <strong>${currency.format(total)}</strong>
        </div>
    `;

    $$('[data-remove-sale-item]').forEach((button) => {
        button.addEventListener('click', () => {
            state.saleItems.splice(Number(button.dataset.removeSaleItem), 1);
            renderSaleItems();
        });
    });
}

function hydrateSaleSelects() {
    $('#venta-cliente').innerHTML = '<option value="">Cliente mostrador</option>' + state.clientes.map((cliente) => (
        `<option value="${cliente.id}">${escapeHtml(cliente.nombre)}</option>`
    )).join('');

    $('#venta-perfume').innerHTML = state.perfumes.map((perfume) => (
        `<option value="${perfume.id}">${escapeHtml(perfume.nombre)} - ${currency.format(Number(perfume.precio))}</option>`
    )).join('');

    renderSaleItems();
}

function editPerfume(id) {
    const perfume = state.perfumes.find((item) => item.id === id);
    if (!perfume) return;
    fillForm('#perfume-form', perfume);
    $('#perfume-form-title').textContent = 'Editar perfume';
    $('#perfume-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function editCliente(id) {
    const cliente = state.clientes.find((item) => item.id === id);
    if (!cliente) return;
    fillForm('#cliente-form', cliente);
    $('#cliente-form-title').textContent = 'Editar cliente';
    $('#cliente-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetPerfumeForm() {
    $('#perfume-form').reset();
    $('#perfume-form [name="id"]').value = '';
    $('#perfume-form-title').textContent = 'Nuevo perfume';
    $('#imagen-preview').innerHTML = '';
}

function resetClienteForm() {
    $('#cliente-form').reset();
    $('#cliente-form [name="id"]').value = '';
    $('#cliente-form-title').textContent = 'Nuevo cliente';
}

function fillForm(selector, data) {
    const form = $(selector);
    Object.entries(data).forEach(([key, value]) => {
        const field = form.elements[key];
        if (field) field.value = value ?? '';
    });
}

function formPayload(form) {
    return Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value]) => [
        key,
        typeof value === 'string' && value.trim() === '' ? null : value
    ]));
}

function renderRecentSales() {
    const container = $('#recent-sales');
    const recent = state.ventas.slice(0, 5);
    if (!recent.length) {
        container.innerHTML = emptyState('Aún no hay ventas.');
        return;
    }

    container.innerHTML = recent.map((venta) => `
        <div class="timeline-item">
            <strong>${escapeHtml(venta.cliente || 'Cliente mostrador')}</strong>
            <p>${currency.format(Number(venta.total || 0))} - ${escapeHtml(venta.metodo_pago || '')} - ${formatDate(venta.fecha_venta)}</p>
        </div>
    `).join('');
}

function renderLowStock() {
    const container = $('#low-stock');
    const items = state.perfumes
        .filter((perfume) => Number(perfume.stock) <= 5)
        .slice(0, 6);

    if (!items.length) {
        container.innerHTML = emptyState('Inventario saludable.');
        return;
    }

    container.innerHTML = items.map((perfume) => `
        <div class="list-item">
            <strong>${escapeHtml(perfume.nombre)}</strong>
            <p>${escapeHtml(perfume.marca)} - Stock ${perfume.stock}</p>
        </div>
    `).join('');
}

function sumSales() {
    return state.ventas.reduce((total, venta) => total + Number(venta.total || 0), 0);
}

function inventoryValue() {
    return state.perfumes.reduce((total, perfume) => {
        return total + Number(perfume.precio || 0) * Number(perfume.stock || 0);
    }, 0);
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}

function readApiError(data) {
    if (data?.errores?.length) return data.errores.map((error) => error.msg).join('. ');
    return data?.error || data?.message || 'No se pudo completar la operación.';
}

function emptyState(text) {
    return `<div class="list-item"><p>${escapeHtml(text)}</p></div>`;
}

function toast(message, type = 'success') {
    const element = $('#toast');
    element.textContent = message;
    element.className = `toast ${type} is-visible`;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => element.classList.remove('is-visible'), 3200);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[char]));
}

// ============== INVENTARIO ==============
async function loadInventario() {
    try {
        // Cargar desde API o usar estado existente
        renderInventario();
    } catch (error) {
        console.error('Error cargando inventario:', error);
        toast('Error cargando inventario', 'error');
    }
}

function renderInventario() {
    const container = $('#inventario-table');
    const search = $('#inventario-search')?.value || '';
    const filter = $('#inventario-filter')?.value || '';

    let items = state.perfumes;

    // Aplicar búsqueda
    if (search) {
        items = items.filter((p) =>
            p.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            p.marca?.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Aplicar filtro de estado
    if (filter === 'disponible') items = items.filter((p) => Number(p.stock) > 5);
    if (filter === 'bajo') items = items.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= 5);
    if (filter === 'agotado') items = items.filter((p) => Number(p.stock) === 0);

    if (!items.length) {
        container.innerHTML = '<tr><td colspan="5">' + emptyState('No hay perfumes') + '</td></tr>';
        return;
    }

    container.innerHTML = items.map((perfume) => {
        const stock = Number(perfume.stock);
        let estado, icono;

        if (stock === 0) {
            estado = 'Agotado';
            icono = '🔴';
        } else if (stock <= 5) {
            estado = 'Bajo';
            icono = '🟡';
        } else {
            estado = 'Disponible';
            icono = '🟢';
        }

        return `
            <tr>
                <td>${escapeHtml(perfume.nombre)}</td>
                <td>${escapeHtml(perfume.marca)}</td>
                <td>${stock}</td>
                <td>5</td>
                <td><span class="status-badge">${icono} ${estado}</span></td>
            </tr>
        `;
    }).join('');
}

// ============== REPORTES ==============
async function loadReportes() {
    try {
        // Cargar datos de reportes desde API
        renderReportes();
    } catch (error) {
        console.error('Error cargando reportes:', error);
        toast('Error cargando reportes', 'error');
    }
}

function renderReportes() {
    const container = $('#reports-summary');
    const totalSales = sumSales();
    const totalInventory = inventoryValue();
    const totalPerfumes = state.perfumes.length;
    const totalClientes = state.clientes.length;

    container.innerHTML = `
        <article class="stat-card">
            <span>Total de ventas</span>
            <strong>${currency.format(totalSales)}</strong>
            <small>Todos los tiempos</small>
        </article>
        <article class="stat-card">
            <span>Valor inventario</span>
            <strong>${currency.format(totalInventory)}</strong>
            <small>Valor actual</small>
        </article>
        <article class="stat-card">
            <span>Perfumes agotados</span>
            <strong>${state.perfumes.filter((p) => Number(p.stock) === 0).length}</strong>
            <small>Requieren reorden</small>
        </article>
        <article class="stat-card">
            <span>Cliente frecuente</span>
            <strong>${totalClientes}</strong>
            <small>Registrados</small>
        </article>
    `;
}

function exportReportPDF() {
    toast('Exportación PDF en desarrollo', 'info');
    // TODO: Implementar exportación a PDF
}

function exportReportExcel() {
    toast('Exportación Excel en desarrollo', 'info');
    // TODO: Implementar exportación a Excel
}

// ============== CONFIGURACIÓN ==============
async function saveProfile(event) {
    event.preventDefault();
    toast('Configuración de perfil en desarrollo', 'info');
    // TODO: Implementar actualización de perfil
}

async function changePassword(event) {
    event.preventDefault();
    toast('Cambio de contraseña en desarrollo', 'info');
    // TODO: Implementar cambio de contraseña
}

// ============== USUARIOS ==============
async function loadUsuarios() {
    try {
        // Cargar usuarios desde API
        renderUsuarios();
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        toast('Error cargando usuarios', 'error');
    }
}

function renderUsuarios() {
    const container = $('#usuarios-table');
    // TODO: Cargar usuarios desde API
    container.innerHTML = emptyState('Cargando usuarios...');
}

async function saveUsuario(event) {
    event.preventDefault();
    toast('Gestión de usuarios en desarrollo', 'info');
    // TODO: Implementar CRUD de usuarios
}

function resetUsuarioForm() {
    $('#usuario-form').reset();
    $('#usuario-form').querySelector('input[name="id"]').value = '';
    $('#usuario-password').disabled = false;
    $('#usuario-form-title').textContent = 'Nuevo usuario';
}
