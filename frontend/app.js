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
    if (state.token) {
        showApp();
        loadAll();
    }
});

function bindEvents() {
    $('#login-form').addEventListener('submit', handleLogin);
    $('#logout-button').addEventListener('click', logout);
    $('#refresh-dashboard').addEventListener('click', loadDashboard);
    $('#reload-perfumes').addEventListener('click', loadPerfumes);
    $('#reload-clientes').addEventListener('click', loadClientes);
    $('#reload-ventas').addEventListener('click', loadVentas);
    $('#perfume-form').addEventListener('submit', savePerfume);
    $('#cliente-form').addEventListener('submit', saveCliente);
    $('#venta-form').addEventListener('submit', saveVenta);
    $('#add-product').addEventListener('click', addSaleItem);
    $('#cancel-perfume-edit').addEventListener('click', resetPerfumeForm);
    $('#cancel-cliente-edit').addEventListener('click', resetClienteForm);

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
        toast('Sesion iniciada correctamente', 'success');
    } catch (error) {
        message.textContent = error.message;
    }
}

function showApp() {
    $('#login-view').classList.add('is-hidden');
    $('#app-view').classList.remove('is-hidden');
    $('#user-name').textContent = state.usuario?.nombre || 'Usuario';
    $('#user-role').textContent = state.usuario?.rol || 'Rol';
}

function logout() {
    localStorage.removeItem('scentvault_token');
    localStorage.removeItem('scentvault_usuario');
    state.token = null;
    state.usuario = null;
    $('#app-view').classList.add('is-hidden');
    $('#login-view').classList.remove('is-hidden');
    $('#login-form').reset();
}

function switchView(view) {
    $$('.nav-link').forEach((button) => button.classList.toggle('is-active', button.dataset.view === view));
    $$('.view-section').forEach((section) => section.classList.add('is-hidden'));
    $(`#${view}-section`).classList.remove('is-hidden');
    $('#view-title').textContent = view.charAt(0).toUpperCase() + view.slice(1);

    if (view === 'dashboard') loadDashboard();
    if (view === 'ventas') hydrateSaleSelects();
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
        throw new Error('Sesion expirada. Inicia sesion nuevamente.');
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
            ingresos: resumen.ingresos || resumen.total_ingresos || sumSales()
        });
    } catch (error) {
        renderStats({
            perfumes: state.perfumes.length,
            clientes: state.clientes.length,
            ventas: state.ventas.length,
            ingresos: sumSales()
        });
    }
    renderRecentSales();
    renderLowStock();
}

function renderStats(stats) {
    $('#stat-perfumes').textContent = stats.perfumes;
    $('#stat-clientes').textContent = stats.clientes;
    $('#stat-ventas').textContent = stats.ventas;
    $('#stat-ingresos').textContent = currency.format(Number(stats.ingresos || 0));
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
                <p>${currency.format(Number(perfume.precio))} - Stock ${perfume.stock}</p>
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
    if (!state.clientes.length) {
        tbody.innerHTML = `<tr><td colspan="5">No hay clientes registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.clientes.map((cliente) => `
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
    const payload = formPayload(form);
    const id = payload.id;
    delete payload.id;

    payload.precio = Number(payload.precio);
    payload.stock = Number(payload.stock);
    payload.duracion_horas = payload.duracion_horas ? Number(payload.duracion_horas) : undefined;

    try {
        await apiRequest(id ? `/perfumes/${id}` : '/perfumes', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(payload)
        });
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
        toast('Selecciona un perfume y una cantidad valida.', 'error');
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

    container.innerHTML = state.saleItems.map((item, index) => `
        <div class="sale-row">
            <div>
                <strong>${escapeHtml(item.nombre)}</strong>
                <p>${item.cantidad} x ${currency.format(item.precio)} = ${currency.format(item.precio * item.cantidad)}</p>
            </div>
            <button class="mini-button" type="button" data-remove-sale-item="${index}">Quitar</button>
        </div>
    `).join('');

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
        container.innerHTML = emptyState('Aun no hay ventas.');
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

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}

function readApiError(data) {
    if (data?.errores?.length) return data.errores.map((error) => error.msg).join('. ');
    return data?.error || data?.message || 'No se pudo completar la operacion.';
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
