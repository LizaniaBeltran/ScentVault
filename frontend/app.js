const API_URL = 'https://scentvault-backend-4tvs.onrender.com/api';

const state = {
    token: localStorage.getItem('scentvault_token') || localStorage.getItem('token'),
    usuario: JSON.parse(localStorage.getItem('scentvault_usuario') || localStorage.getItem('usuario') || 'null'),
    rol: JSON.parse(localStorage.getItem('scentvault_usuario') || localStorage.getItem('usuario') || 'null')?.rol || localStorage.getItem('rol') || null,
    perfumes: [],
    clientes: [],
    clientesAll: [],
    ventas: [],
    reportCharts: {},
    saleItems: []
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    updateDateChip();
    setInterval(updateDateChip, 60000);
    if (state.token) { showApp(); loadAll(); }
});

function updateDateChip() {
    const el = $('#date-chip');
    if (el) el.textContent = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
}

function bindEvents() {
    $('#login-form').addEventListener('submit', handleLogin);
    $('#logout-button').addEventListener('click', logout);
    $('#refresh-dashboard').addEventListener('click', loadDashboard);
    $('#reload-perfumes').addEventListener('click', loadPerfumes);
    $('#reload-clientes').addEventListener('click', loadClientes);
    $('#reload-ventas').addEventListener('click', loadVentas);
    $('#reload-inventario')?.addEventListener('click', loadInventario);
    $('#reload-usuarios')?.addEventListener('click', loadUsuarios);
    $('#sidebar-toggle').addEventListener('click', () => {
        const app = $('#app-view');
        if (window.matchMedia('(max-width: 900px)').matches) app.classList.toggle('sidebar-open');
        else app.classList.toggle('sidebar-collapsed');
    });
    $('#sidebar-overlay')?.addEventListener('click', () => $('#app-view').classList.remove('sidebar-open'));
    $('#cliente-search').addEventListener('input', renderClientes);
    $('#perfumes-search')?.addEventListener('input', renderPerfumes);
    $('#perfumes-filter')?.addEventListener('change', loadPerfumes);
    $('#perfumes-family-filter')?.addEventListener('change', renderPerfumes);
    $('#perfumes-brand-filter')?.addEventListener('change', renderPerfumes);
    $('#show-perfume-form')?.addEventListener('click', () => {
        $('#perfume-form-panel')?.classList.toggle('is-hidden');
        $('#perfume-form-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#clientes-filter')?.addEventListener('change', loadClientes);
    $('#inventario-search')?.addEventListener('input', renderInventario);
    $('#inventario-filter')?.addEventListener('change', loadInventario);
    $('#inventario-marca')?.addEventListener('change', renderInventario);
    $('#inventario-orden')?.addEventListener('change', loadInventario);
    $('#perfume-form').addEventListener('submit', savePerfume);
    $('#cliente-form').addEventListener('submit', saveCliente);
    $('#venta-form').addEventListener('submit', saveVenta);
    $('#usuario-form')?.addEventListener('submit', saveUsuario);
    $('#profile-form')?.addEventListener('submit', saveProfile);
    $('#security-form')?.addEventListener('submit', changePassword);
    $('#cancel-perfume-edit').addEventListener('click', resetPerfumeForm);
    $('#cancel-cliente-edit').addEventListener('click', resetClienteForm);
    $('#cancel-usuario-edit')?.addEventListener('click', resetUsuarioForm);
    $('#empty-cart-button')?.addEventListener('click', emptyCart);
    $('#clear-cart-button')?.addEventListener('click', emptyCart);
    $('#export-pdf')?.addEventListener('click', exportPDF);
    $('#export-excel')?.addEventListener('click', exportExcel);
    $('#apply-report-range')?.addEventListener('click', loadReportes);
    $('#clear-report-range')?.addEventListener('click', clearReportRange);
    $('#report-fecha-inicio')?.addEventListener('change', updateReportRangeLabel);
    $('#report-fecha-fin')?.addEventListener('change', updateReportRangeLabel);
    $('.clientes-insight-card [data-view]')?.addEventListener('click', (e) => switchView(e.currentTarget.dataset.view));
    $$('#dashboard-section [data-view]').forEach((button) => {
        button.addEventListener('click', () => switchView(button.dataset.view));
    });
    $('#modal-close').addEventListener('click', closeModal);
    $('#confirm-no').addEventListener('click', closeConfirm);
    $('#modal-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
    $('#confirm-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeConfirm(); });

    $('#perfume-imagen')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const preview = $('#imagen-preview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { preview.innerHTML = `<img src="${event.target.result}" alt="Vista previa"><p>${file.name}</p>`; };
            reader.readAsDataURL(file);
        } else { preview.innerHTML = ''; }
    });

    $('#venta-buscar')?.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        renderSaleProductGrid();
        if (q.length < 2) { $('#venta-resultados').classList.remove('is-visible'); return; }
        buscarPerfumesVenta(q);
    });

    $$('#venta-categorias [data-sale-family]').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('#venta-categorias [data-sale-family]').forEach(b => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            renderSaleProductGrid();
        });
    });

    document.addEventListener('click', (e) => {
        const busqueda = $('#venta-resultados');
        if (busqueda && !e.target.closest('.buscador-perfumes')) busqueda.classList.remove('is-visible');
    });

    $$('.nav-link').forEach((button) => {
        button.addEventListener('click', () => {
            switchView(button.dataset.view);
            $('#app-view').classList.remove('sidebar-open');
        });
    });
}

async function handleLogin(event) {
    event.preventDefault();
    const message = $('#login-message');
    const formData = new FormData(event.currentTarget);
    message.textContent = '';
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(formData.entries()))
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(readApiError(data));
        state.token = data.token;
        state.usuario = data.usuario;
        state.rol = data.usuario?.rol || null;
        localStorage.setItem('scentvault_token', data.token);
        localStorage.setItem('scentvault_usuario', JSON.stringify(data.usuario));
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
        localStorage.setItem('rol', data.usuario?.rol || '');
        showApp();
        await loadAll();
        toast('Sesion iniciada correctamente', 'success');
    } catch (error) { message.textContent = error.message; }
}

function showApp() {
    $('#login-view').classList.add('is-hidden');
    $('#app-view').classList.remove('is-hidden');
    const nombre = state.usuario?.nombre || 'Usuario';
    const correo = state.usuario?.correo || '';
    const rol = state.usuario?.rol || state.rol || 'vendedor';
    state.rol = rol;
    localStorage.setItem('rol', rol);
    $('#user-name').textContent = nombre;
    $('#user-role').textContent = rol;
    $('#profile-nombre').textContent = nombre;
    $('#profile-email').textContent = correo;
    $('#profile-avatar-initial').textContent = nombre.charAt(0).toUpperCase();
    applyRolePermissions();
}

function applyRolePermissions() {
    const rol = state.usuario?.rol || state.rol || localStorage.getItem('rol') || 'vendedor';
    const isAdmin = rol === 'admin';
    const currentView = $$('.view-section').find(s => !s.classList.contains('is-hidden'))?.id?.replace('-section', '');
    $$('.admin-only').forEach(el => { el.style.display = isAdmin ? '' : 'none'; });
    document.body.dataset.role = rol;
    if (!isAdmin && currentView && ['inventario', 'reportes', 'configuracion', 'usuarios'].includes(currentView)) {
        switchView('dashboard');
    }
}

function logout() {
    localStorage.removeItem('scentvault_token');
    localStorage.removeItem('scentvault_usuario');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rol');
    state.token = null;
    state.usuario = null;
    state.rol = null;
    state.saleItems = [];
    $('#app-view').classList.add('is-hidden');
    $('#login-view').classList.remove('is-hidden');
    $('#login-form').reset();
}

function switchView(view) {
    const isAdmin = (state.usuario?.rol || state.rol) === 'admin';
    const adminOnlyViews = ['inventario', 'reportes', 'configuracion', 'usuarios'];
    if (!isAdmin && adminOnlyViews.includes(view)) {
        toast('No tienes permisos', 'error');
        view = 'dashboard';
    }

    $$('.nav-link').forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
    $$('.view-section').forEach(s => s.classList.add('is-hidden'));
    const section = $(`#${view}-section`);
    if (section) section.classList.remove('is-hidden');

    const titles = {
        dashboard: '', perfumes: 'Catalogo de Perfumes', clientes: 'Gestion de Clientes',
        ventas: 'Punto de Venta', inventario: 'Control de Inventario', reportes: 'Reportes y Analisis',
        configuracion: 'Configuracion del Sistema', usuarios: 'Gestion de Usuarios'
    };
    const subs = {
        dashboard: 'Panel de administracion de ScentVault', perfumes: 'Administra tu catalogo de fragancias',
        clientes: 'Gestiona tus clientes y preferencias', ventas: 'Punto de venta y transacciones',
        inventario: 'Control de stock y alertas', reportes: 'Analisis y estadisticas del negocio',
        configuracion: 'Administra tu perfil y preferencias', usuarios: 'Gestiona usuarios del sistema'
    };

    if (view === 'dashboard') $('#view-title').textContent = `¡Bienvenida, ${isAdmin ? 'Administrador' : (state.usuario?.nombre || 'Usuario')}! 👋`;
    else $('#view-title').textContent = titles[view] || view;

    $('#view-subtitle').textContent = subs[view] || '';

    if (view === 'dashboard') loadDashboard();
    if (view === 'ventas') { loadClientes(); loadPerfumes(); hydrateSaleSelects(); }
    if (view === 'inventario') loadInventario();
    if (view === 'reportes') loadReportes();
    if (view === 'configuracion') loadConfig();
    applyRolePermissions();
}

async function loadAll() {
    await Promise.all([loadPerfumes(), loadClientes(), loadVentas()]);
    await loadDashboard();
}

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${state.token}`,
            ...(options.headers || {})
        }
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { logout(); throw new Error('Sesion expirada'); }
    if (!response.ok || data.ok === false) throw new Error(readApiError(data));
    return data;
}

// ============== DASHBOARD ==============

async function loadDashboard() {
    try {
        const data = await apiRequest('/dashboard/resumen');
        const r = data.data || data;
        renderStats({
            ventas_dia: r.ventas_dia || 0,
            ventas_mes: r.ventas_mes || r.totalVentasMes || 0,
            clientes: r.clientes || r.total_clientes || 0,
            perfumes: r.perfumes || r.total_perfumes || 0,
            agotados: r.agotados || state.perfumes.filter(p => Number(p.stock) === 0).length,
            inventario: r.valor_inventario || r.valorInventario || 0
        });
        renderRecentActivity(r.ultimos_clientes || [], r.ultimos_perfumes || []);
        renderRecentSales(r.ultimas_ventas || state.ventas);
        renderLowStock();
        renderDashboardVisuals();
    } catch {
        const p = state.perfumes.filter(x => x.activo !== false);
        renderStats({
            ventas_dia: 0, ventas_mes: sumSales(),
            clientes: state.clientes.filter(c => c.activo !== false).length,
            perfumes: p.length,
            agotados: p.filter(x => Number(x.stock) === 0).length,
            inventario: inventoryValue()
        });
        renderRecentSales(state.ventas);
        renderLowStock();
        renderDashboardVisuals();
    }
}

function renderStats(stats) {
    applyDashboardRoleLabels();
    $('#stat-ingresos').textContent = currency.format(Number(stats.ventas_dia || 0));
    const mes = $('#stat-mes');
    if (mes) mes.textContent = currency.format(Number(stats.ventas_mes || 0));
    $('#stat-clientes').textContent = stats.clientes || 0;
    $('#stat-perfumes').textContent = stats.perfumes || 0;
    const agot = $('#stat-agotados');
    if (agot) agot.textContent = stats.agotados || 0;
    const inv = $('#stat-inventario');
    if (inv) inv.textContent = currency.format(Number(stats.inventario || 0));
}

function applyDashboardRoleLabels() {
    const isAdmin = (state.rol || state.usuario?.rol) === 'admin';
    const clientesCard = $('#stat-clientes')?.closest('.stat-card');
    const perfumesCard = $('#stat-perfumes')?.closest('.stat-card');
    if (clientesCard) {
        clientesCard.querySelector('span').textContent = isAdmin ? 'Clientes activos' : 'Clientes atendidos';
        clientesCard.querySelector('small').textContent = isAdmin ? 'Registrados' : 'Este mes';
    }
    if (perfumesCard) {
        perfumesCard.querySelector('span').textContent = isAdmin ? 'Perfumes activos' : 'Perfumes disponibles';
        perfumesCard.querySelector('small').textContent = isAdmin ? 'En inventario' : 'Con stock disponible';
    }
}

function renderRecentActivity(clientes, perfumes) {
    const container = $('#recent-activity');
    if (!container) return;
    let html = '';
    if (clientes && clientes.length) {
        html += clientes.map(c => `<div class="timeline-item"><strong>Cliente: ${escapeHtml(c.nombre)}</strong><p>${escapeHtml(c.correo || '')} - Registrado ${formatDate(c.createdAt)}</p></div>`).join('');
    }
    if (perfumes && perfumes.length) {
        html += perfumes.map(p => `<div class="timeline-item"><strong>Perfume: ${escapeHtml(p.nombre)}</strong><p>${escapeHtml(p.marca)} - $${(p.precio || 0).toFixed(2)} - Stock ${p.stock}</p></div>`).join('');
    }
    if (!html) { container.innerHTML = emptyState('No hay actividad reciente.'); return; }
    container.innerHTML = html;
}

function renderRecentSales(ventas) {
    const container = $('#recent-sales');
    if (!ventas || !ventas.length) { container.innerHTML = emptyState('Aun no hay ventas.'); return; }
    container.innerHTML = ventas.slice(0, 5).map(v => {
        const nom = v.cliente && typeof v.cliente === 'object' ? v.cliente.nombre : (v.cliente || v.cliente_nombre || 'Mostrador');
        const cant = (v.productos || []).length;
        return `<div class="timeline-item"><strong>${escapeHtml(nom)}</strong><p>${cant} producto${cant !== 1 ? 's' : ''} - ${currency.format(Number(v.total || 0))} - ${escapeHtml(v.metodo_pago || '')} - ${formatDate(v.fecha_venta)}</p></div>`;
    }).join('');
}

function renderLowStock() {
    const container = $('#low-stock');
    const items = state.perfumes.filter(p => Number(p.stock) <= 5 && Number(p.stock) > 0 && p.activo !== false).slice(0, 6);
    if (!container) return;
    const agotados = state.perfumes.filter(p => p.activo !== false && Number(p.stock) === 0).length;
    const bajo = state.perfumes.filter(p => p.activo !== false && Number(p.stock) > 0 && Number(p.stock) <= 5).length;
    container.innerHTML = `
        <div class="dashboard-alert is-danger"><span>△</span><div><strong>${agotados} producto${agotados !== 1 ? 's' : ''} agotado${agotados !== 1 ? 's' : ''}</strong><p>Requieren reorden urgente</p></div><b>→</b></div>
        <div class="dashboard-alert is-warning"><span>!</span><div><strong>${bajo} producto${bajo !== 1 ? 's' : ''} con bajo stock</strong><p>${items.length ? items.map(p => escapeHtml(p.nombre)).slice(0, 2).join(', ') : 'Sin alertas de bajo stock'}</p></div><b>→</b></div>
        <div class="dashboard-alert is-success"><span>✓</span><div><strong>${agotados || bajo ? 'Inventario por revisar' : 'Todo en orden'}</strong><p>${agotados || bajo ? 'Atiende alertas pendientes' : 'Inventario saludable'}</p></div><b>→</b></div>
    `;
}

function renderDashboardVisuals() {
    renderDashboardSalesChart();
    renderDashboardCategoryChart();
    renderDashboardTopProducts();
    renderDashboardActivityColumns();
    renderDashboardBottomMetrics();
}

function renderDashboardSalesChart() {
    const box = $('#dashboard-sales-chart');
    if (!box) return;
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
        const total = state.ventas
            .filter(v => new Date(v.fecha_venta).toISOString().slice(0, 10) === key)
            .reduce((t, v) => t + Number(v.total || 0), 0);
        return { label, total };
    });
    const max = Math.max(...days.map(d => d.total), 1);
    const width = 720;
    const height = 260;
    const points = days.map((d, i) => {
        const x = 42 + i * ((width - 84) / 6);
        const y = 210 - (d.total / max) * 155;
        return { ...d, x, y };
    });
    const path = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area = `${path} L${points[points.length - 1].x.toFixed(1)} 228 L${points[0].x.toFixed(1)} 228 Z`;
    const grid = [0, 0.25, 0.5, 0.75, 1].map(r => {
        const y = 210 - r * 155;
        return `<line x1="42" y1="${y}" x2="680" y2="${y}"/><text x="8" y="${y + 4}">${currency.format(max * r).replace('.00', '')}</text>`;
    }).join('');
    box.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Ventas últimos 7 días">
        <defs><linearGradient id="dashboardWineFade" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#8B0F2F" stop-opacity="0.20"/><stop offset="1" stop-color="#8B0F2F" stop-opacity="0"/></linearGradient></defs>
        <g class="chart-grid">${grid}</g>
        <path class="chart-area" d="${area}"/><path class="chart-line" d="${path}"/>
        <g>${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="5"><title>${p.label}: ${currency.format(p.total)}</title></circle>`).join('')}</g>
        <g class="chart-labels-svg">${points.map(p => `<text x="${p.x}" y="248" text-anchor="middle">${p.label}</text>`).join('')}</g>
    </svg>`;
}

function renderDashboardCategoryChart() {
    const box = $('#dashboard-category-chart');
    if (!box) return;
    const totals = {};
    state.ventas.forEach(v => {
        (v.productos || []).forEach(item => {
            const perfumeId = typeof item.perfume === 'object' ? (item.perfume?._id || item.perfume?.id) : item.perfume;
            const perfume = state.perfumes.find(p => String(p._id || p.id) === String(perfumeId));
            const familia = perfume?.familia_olfativa || 'Sin categoría';
            totals[familia] = (totals[familia] || 0) + Number(item.cantidad || 1);
        });
    });
    const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const data = rows.length ? rows : [['Sin ventas', 1]];
    const total = data.reduce((t, r) => t + r[1], 0);
    const colors = ['#8B0F2F', '#C9A227', '#D9789A', '#D9B985'];
    let start = 0;
    const gradient = data.map((row, i) => {
        const pct = row[1] / total * 100;
        const end = start + pct;
        const part = `${colors[i]} ${start}% ${end}%`;
        start = end;
        return part;
    }).join(', ');
    box.innerHTML = `<div class="dashboard-donut" style="background: conic-gradient(${gradient});"><span></span></div>
        <div class="dashboard-category-legend">${data.map((row, i) => `<div><span style="background:${colors[i]}"></span><b>${escapeHtml(row[0])}</b><em>${Math.round(row[1] / total * 100)}%</em></div>`).join('')}</div>`;
}

function renderDashboardTopProducts() {
    const box = $('#dashboard-top-products');
    if (!box) return;
    const sales = {};
    state.ventas.forEach(v => {
        (v.productos || []).forEach(item => {
            const name = item.nombre || item.perfume?.nombre || 'Perfume';
            if (!sales[name]) sales[name] = { nombre: name, vendidos: 0, imagen_url: item.imagen_url || '', marca: '' };
            sales[name].vendidos += Number(item.cantidad || 1);
        });
    });
    Object.values(sales).forEach(row => {
        const p = state.perfumes.find(perfume => perfume.nombre === row.nombre);
        if (p) { row.imagen_url = row.imagen_url || p.imagen_url; row.marca = p.marca || ''; }
    });
    const items = Object.values(sales).sort((a, b) => b.vendidos - a.vendidos).slice(0, 5);
    const fallback = state.perfumes.filter(p => p.activo !== false).slice(0, 5).map(p => ({ nombre: p.nombre, marca: p.marca, imagen_url: p.imagen_url, vendidos: 0 }));
    const rows = items.length ? items : fallback;
    if (!rows.length) { box.innerHTML = emptyState('Aún no hay perfumes para mostrar.'); return; }
    box.innerHTML = rows.map(p => `<article class="dashboard-top-product"><img src="${p.imagen_url || 'assets/img/perfume.png'}" alt="${escapeHtml(p.nombre)}"><div><strong>${escapeHtml(p.nombre)}</strong><small>${escapeHtml(p.marca || '')}</small></div><b>${p.vendidos}<span> vendidos</span></b></article>`).join('') + '<button class="primary-button dashboard-catalog-button" type="button" data-view="perfumes">Ver catálogo completo →</button>';
    $('#dashboard-top-products [data-view]')?.addEventListener('click', (e) => switchView(e.currentTarget.dataset.view));
}

function renderDashboardActivityColumns() {
    const clients = $('#dashboard-activity-clients');
    const perfumes = $('#dashboard-activity-perfumes');
    if (clients) {
        const rows = state.clientes.slice(0, 3);
        clients.innerHTML = rows.length ? rows.map(c => `<div class="dash-activity-row"><span>♙</span><div><strong>${escapeHtml(c.nombre)}</strong><small>${formatDate(c.createdAt)}</small></div></div>`).join('') : emptyState('Sin clientes recientes.');
    }
    if (perfumes) {
        const rows = state.perfumes.filter(p => p.activo !== false).slice(0, 3);
        perfumes.innerHTML = rows.length ? rows.map(p => `<div class="dash-activity-row"><span>♢</span><div><strong>${escapeHtml(p.nombre)}</strong><small>${escapeHtml(p.marca || '')}</small></div></div>`).join('') : emptyState('Sin perfumes recientes.');
    }
}

function renderDashboardBottomMetrics() {
    const box = $('#dashboard-bottom-metrics');
    if (!box) return;
    const total = state.ventas.reduce((t, v) => t + Number(v.total || 0), 0);
    const ventas = state.ventas.length;
    const productos = state.ventas.reduce((t, v) => t + (v.productos || []).reduce((s, p) => s + Number(p.cantidad || 1), 0), 0);
    const ticket = ventas ? total / ventas : 0;
    const margen = total ? Math.round(((total - total / 1.16) / total) * 100) : 0;
    box.innerHTML = `
        <article><span>▥</span><div><small>Ticket promedio</small><strong>${currency.format(ticket)}</strong></div></article>
        <article><span>▦</span><div><small>Ventas realizadas</small><strong>${ventas}</strong></div></article>
        <article><span>▣</span><div><small>Productos vendidos</small><strong>${productos}</strong></div></article>
        <article><span>◔</span><div><small>Margen bruto</small><strong>${margen}%</strong></div></article>
    `;
}

// ============== PERFUMES ==============

async function loadPerfumes() {
    try {
        const filter = $('#perfumes-filter')?.value || 'activos';
        let data;
        if (filter === 'inactivos') data = await apiRequest('/perfumes/inactivos');
        else if (filter === 'todos') {
            const [a, i] = await Promise.all([apiRequest('/perfumes'), apiRequest('/perfumes/inactivos')]);
            state.perfumes = [...(a.data || []), ...(i.data || [])];
            hydratePerfumeFilters(); renderPerfumes(); renderSaleProductGrid(); hydrateSaleSelects(); return;
        } else {
            data = await apiRequest('/perfumes');
        }
        state.perfumes = data.data || [];
        hydratePerfumeFilters();
        renderPerfumes();
        renderSaleProductGrid();
        hydrateSaleSelects();
    } catch (error) { toast(error.message, 'error'); }
}

function renderPerfumes() {
    const container = $('#perfumes-list');
    const search = ($('#perfumes-search')?.value || '').trim().toLowerCase();
    const family = $('#perfumes-family-filter')?.value || '';
    const brand = $('#perfumes-brand-filter')?.value || '';
    let items = state.perfumes;
    if (search) items = items.filter(p => (p.nombre + ' ' + p.marca).toLowerCase().includes(search));
    if (family) items = items.filter(p => (p.familia_olfativa || '') === family);
    if (brand) items = items.filter(p => (p.marca || '') === brand);
    renderPerfumeKPIs(items);
    const countLabel = $('#perfumes-count-label');
    if (countLabel) countLabel.textContent = `Mostrando ${Math.min(items.length, 10)} de ${items.length} perfumes`;

    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">&#x1F9F4;</div><h4>No hay perfumes</h4><p>${search ? 'Ningun perfume coincide.' : 'Agrega tu primer perfume al catalogo.'}</p></div>`;
        return;
    }

    const isAdmin = (state.rol || state.usuario?.rol) === 'admin';
    container.innerHTML = items.map(p => {
        const activo = p.activo !== false;
        const stock = Number(p.stock);
        let badge = '';
        if (!activo) badge = '<span class="badge badge-inactive">Inactivo</span>';
        else if (stock === 0) badge = '<span class="badge badge-out">Agotado</span>';
        else if (stock <= 5) badge = '<span class="badge badge-low">Stock bajo</span>';
        else badge = '<span class="badge badge-available">Disponible</span>';
        const id = p._id || p.id;

        return `<div class="premium-card perfume-catalog-card">
            <img class="premium-card-img" src="${p.imagen_url || 'assets/img/perfume.png'}" alt="${escapeHtml(p.nombre)}" loading="lazy">
            <div class="premium-card-body">
                <div class="perfume-card-head"><h4>${escapeHtml(p.nombre)}</h4>${badge}</div>
                <p class="card-marca">${escapeHtml(p.marca)}</p>
                <div class="perfume-card-meta"><span>Stock: ${stock}</span><strong>${currency.format(Number(p.precio))}</strong></div>
                <div class="premium-card-actions">
                    <button class="mini-button" data-ver-perfume="${id}" title="Ver">👁</button>
                    ${isAdmin ? `<button class="mini-button" data-edit-perfume="${id}" title="Editar">✎</button>` : ''}
                    ${isAdmin && activo
                        ? `<button class="mini-button danger" data-baja-perfume="${id}" title="Dar de baja">⋮</button>`
                        : isAdmin ? `<button class="mini-button success" data-reactivar-perfume="${id}" title="Reactivar">↻</button>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');

    $$('[data-ver-perfume]').forEach(b => b.addEventListener('click', () => showPerfumeDetail(b.dataset.verPerfume)));
    $$('[data-edit-perfume]').forEach(b => b.addEventListener('click', () => editPerfume(b.dataset.editPerfume)));
    $$('[data-baja-perfume]').forEach(b => b.addEventListener('click', () => confirmBaja('perfume', b.dataset.bajaPerfume)));
    $$('[data-reactivar-perfume]').forEach(b => b.addEventListener('click', () => reactivarPerfume(b.dataset.reactivarPerfume)));
}

function hydratePerfumeFilters() {
    const familySelect = $('#perfumes-family-filter');
    const brandSelect = $('#perfumes-brand-filter');
    if (familySelect) {
        const current = familySelect.value;
        const families = [...new Set(state.perfumes.map(p => p.familia_olfativa).filter(Boolean))].sort();
        familySelect.innerHTML = '<option value="">Familia olfativa: Todas</option>' + families.map(f => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join('');
        familySelect.value = current;
    }
    if (brandSelect) {
        const current = brandSelect.value;
        const brands = [...new Set(state.perfumes.map(p => p.marca).filter(Boolean))].sort();
        brandSelect.innerHTML = '<option value="">Marca: Todas</option>' + brands.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join('');
        brandSelect.value = current;
    }
}

function renderPerfumeKPIs(items) {
    const container = $('#perfumes-kpis');
    if (!container) return;
    const all = state.perfumes;
    const active = all.filter(p => p.activo !== false).length;
    const agotados = all.filter(p => p.activo !== false && Number(p.stock) === 0).length;
    const bajo = all.filter(p => p.activo !== false && Number(p.stock) > 0 && Number(p.stock) <= 5).length;
    const valor = all.filter(p => p.activo !== false).reduce((t, p) => t + Number(p.precio || 0) * Number(p.stock || 0), 0);
    container.innerHTML = `
        <article><span>▢</span><strong>${active}</strong><small>Perfumes activos</small></article>
        <article><span>▯</span><strong>${agotados}</strong><small>Agotados</small></article>
        <article><span>△</span><strong>${bajo}</strong><small>Bajo stock</small></article>
        <article><span>⬡</span><strong>${currency.format(valor)}</strong><small>Valor total inventario</small></article>
    `;
}

function showPerfumeDetail(id) {
    const p = state.perfumes.find(x => (x._id || x.id) === id);
    if (!p) return;
    const body = $('#modal-body');
    body.innerHTML = `<div class="detalle-perfume">
        <img src="${p.imagen_url || 'assets/img/perfume.png'}" alt="${escapeHtml(p.nombre)}">
        <h4 style="font-family:'Playfair Display',serif;font-size:1.6rem;margin:0">${escapeHtml(p.nombre)}</h4>
        <p style="color:#6F6864;margin:0">${escapeHtml(p.marca)}</p>
        <div class="dp-grid">
            <div><span>Familia olfativa</span><strong>${escapeHtml(p.familia_olfativa || '-')}</strong></div>
            <div><span>Precio</span><strong>${currency.format(Number(p.precio))}</strong></div>
            <div><span>Stock</span><strong>${p.stock}</strong></div>
            <div><span>Duracion</span><strong>${p.duracion_horas ? p.duracion_horas + 'h' : '-'}</strong></div>
            ${p.temporada ? `<div><span>Temporada</span><strong>${escapeHtml(p.temporada)}</strong></div>` : ''}
            <div><span>Estado</span><strong>${p.activo !== false ? 'Activo' : 'Inactivo'}</strong></div>
        </div>
        ${p.notas_salida ? `<div class="dp-notas"><strong>Notas de salida:</strong> ${escapeHtml(p.notas_salida)}</div>` : ''}
        ${p.notas_medias ? `<div class="dp-notas"><strong>Notas medias:</strong> ${escapeHtml(p.notas_medias)}</div>` : ''}
        ${p.notas_fondo ? `<div class="dp-notas"><strong>Notas de fondo:</strong> ${escapeHtml(p.notas_fondo)}</div>` : ''}
        ${p.descripcion ? `<div class="dp-notas">${escapeHtml(p.descripcion)}</div>` : ''}
    </div>`;
    $('#modal-title').textContent = p.nombre;
    openModal();
}

async function savePerfume(event) {
    event.preventDefault();
    if ((state.rol || state.usuario?.rol) !== 'admin') { toast('No tienes permisos para guardar perfumes', 'error'); return; }
    const form = event.currentTarget;
    const id = form.querySelector('input[name="id"]').value;
    const fileInput = form.querySelector('input[name="imagen"]');
    const tieneArchivo = fileInput?.files?.length > 0;

    if (tieneArchivo) {
        const formData = new FormData(form);
        formData.set('precio', Number(formData.get('precio') || 0));
        formData.set('stock', Number(formData.get('stock') || 0));
        if (formData.get('duracion_horas')) formData.set('duracion_horas', Number(formData.get('duracion_horas')));
        formData.delete('id');
        try {
            const response = await fetch(`${API_URL}${id ? `/perfumes/${id}` : '/perfumes'}`, {
                method: id ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${state.token}` },
                body: formData
            });
            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error(readApiError(data));
            resetPerfumeForm(); await loadPerfumes(); await loadDashboard();
            toast('Perfume guardado correctamente', 'success');
        } catch (error) { toast(error.message, 'error'); }
    } else {
        const payload = formPayload(form);
        const idVal = payload.id;
        delete payload.id;
        try {
            await apiRequest(idVal ? `/perfumes/${idVal}` : '/perfumes', {
                method: idVal ? 'PUT' : 'POST', body: JSON.stringify(payload)
            });
            resetPerfumeForm(); await loadPerfumes(); await loadDashboard();
            toast('Perfume guardado correctamente', 'success');
        } catch (error) { toast(error.message, 'error'); }
    }
}

function editPerfume(id) {
    const p = state.perfumes.find(x => (x._id || x.id) === id);
    if (!p) return;
    fillForm('#perfume-form', p);
    $('#perfume-form-title').textContent = 'Editar perfume';
    $('#perfume-form-panel')?.classList.remove('is-hidden');
    $('#perfume-form').scrollIntoView({ behavior: 'smooth' });
}

function resetPerfumeForm() {
    $('#perfume-form').reset();
    $('#perfume-form [name="id"]').value = '';
    $('#perfume-form-title').textContent = 'Nuevo perfume';
    $('#imagen-preview').innerHTML = '';
}

async function reactivarPerfume(id) {
    try {
        await apiRequest(`/perfumes/${id}/reactivar`, { method: 'PATCH' });
        await loadPerfumes(); await loadDashboard();
        toast('Perfume reactivado correctamente', 'success');
    } catch (error) { toast(error.message, 'error'); }
}

// ============== CLIENTES ==============

async function loadClientes() {
    try {
        const isAdmin = state.usuario?.rol === 'admin';
        const filterEl = $('#clientes-filter');
        let filter = filterEl?.value || 'activos';
        if (!isAdmin && filter === 'inactivos') {
            filter = 'activos';
            if (filterEl) filterEl.value = 'activos';
        }
        const [activos, inactivos] = await Promise.all([
            apiRequest('/clientes'),
            isAdmin ? apiRequest('/clientes/inactivos') : Promise.resolve({ data: [] })
        ]);
        const activosData = activos.data || [];
        const inactivosData = inactivos.data || [];
        state.clientesAll = [...activosData, ...inactivosData];
        state.clientes = filter === 'inactivos' ? inactivosData : activosData;
        renderClientes();
        hydrateSaleSelects();
    } catch (error) { toast(error.message, 'error'); }
}

function renderClientes() {
    const tbody = $('#clientes-table');
    if (!tbody) return;
    const search = ($('#cliente-search')?.value || '').trim().toLowerCase();
    let items = state.clientes;
    if (search) items = items.filter(c => [c.nombre, c.telefono, c.correo, c.preferencia_olfativa].join(' ').toLowerCase().includes(search));
    renderClientesKPIs(items);

    const countLabel = $('#clientes-count-label');
    if (countLabel) countLabel.textContent = `Mostrando ${items.length ? 1 : 0} a ${Math.min(items.length, 5)} de ${items.length} clientes`;

    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>${search ? 'Ningun cliente coincide.' : 'No hay clientes registrados.'}</p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = items.slice(0, 5).map(c => {
        const id = c._id || c.id;
        const stats = getClienteVentaStats(id);
        const activo = c.activo !== false;
        const pref = c.preferencia_olfativa || 'Sin preferencia';
        const canManageStatus = state.usuario?.rol === 'admin';
        return `<tr>
            <td><div class="cliente-cell"><span class="cliente-avatar" style="--avatar-color:${getAvatarColor(c.nombre)}">${getInitials(c.nombre)}</span><div><strong>${escapeHtml(c.nombre)}</strong><small class="cliente-status ${activo ? 'is-active' : 'is-inactive'}">${activo ? 'Activo' : 'Inactivo'}</small></div></div></td>
            <td>${escapeHtml(c.telefono || '')}</td>
            <td>${escapeHtml(c.correo || '')}</td>
            <td><span class="cliente-pref-pill">${escapeHtml(pref)}</span></td>
            <td><strong>${stats.compras}</strong></td>
            <td>${currency.format(stats.total)}</td>
            <td><div class="clientes-actions">
                <button class="mini-button" data-edit-cliente="${id}" title="Editar">✎</button>
                <button class="mini-button" data-historial-cliente="${id}" title="Historial">◎</button>
                ${canManageStatus && c.activo !== false
                    ? `<button class="mini-button danger" data-baja-cliente="${id}" title="Dar de baja">⌫</button>`
                    : canManageStatus ? `<button class="mini-button success" data-reactivar-cliente="${id}" title="Reactivar">↻</button>` : ''}
            </div></td>
        </tr>`;
    }).join('');

    $$('[data-edit-cliente]').forEach(b => b.addEventListener('click', () => editCliente(b.dataset.editCliente)));
    $$('[data-historial-cliente]').forEach(b => b.addEventListener('click', () => showHistorial(b.dataset.historialCliente)));
    $$('[data-baja-cliente]').forEach(b => b.addEventListener('click', () => confirmBaja('cliente', b.dataset.bajaCliente)));
    $$('[data-reactivar-cliente]').forEach(b => b.addEventListener('click', () => reactivarCliente(b.dataset.reactivarCliente)));
}

function renderClientesKPIs(items) {
    const container = $('#clientes-kpis');
    if (!container) return;
    const all = state.clientesAll.length ? state.clientesAll : state.clientes;
    const activos = all.filter(c => c.activo !== false).length;
    const ventasConCliente = state.ventas.filter(v => v.cliente_id);
    const statsByClient = all.map(c => getClienteVentaStats(c._id || c.id));
    const frecuentes = statsByClient.filter(s => s.compras >= 2).length;
    const totalVentasClientes = ventasConCliente.reduce((t, v) => t + Number(v.total || 0), 0);
    const ticket = ventasConCliente.length ? totalVentasClientes / ventasConCliente.length : 0;
    container.innerHTML = `
        <article><span class="cliente-kpi-icon is-pink">♙</span><div><small>Clientes totales</small><strong>${all.length}</strong><em>Registrados en el sistema</em></div></article>
        <article><span class="cliente-kpi-icon is-green">♧</span><div><small>Clientes activos</small><strong>${activos}</strong><em>Activos actualmente</em></div></article>
        <article><span class="cliente-kpi-icon is-gold">☆</span><div><small>Clientes frecuentes</small><strong>${frecuentes}</strong><em>Con compras recurrentes</em></div></article>
        <article><span class="cliente-kpi-icon is-purple">▢</span><div><small>Ticket promedio</small><strong>${currency.format(ticket)}</strong><em>Por venta con cliente</em></div></article>
    `;
    const insight = $('#clientes-insight-text');
    if (insight) {
        const pct = ventasConCliente.length && state.ventas.length ? Math.round((ventasConCliente.length / state.ventas.length) * 100) : 0;
        insight.textContent = `${frecuentes} clientes realizan compras recurrentes y las ventas asociadas a clientes representan el ${pct}% de tus ventas registradas.`;
    }
}

function getClienteVentaStats(id) {
    const ventas = state.ventas.filter(v => String(v.cliente_id || '') === String(id));
    return { compras: ventas.length, total: ventas.reduce((t, v) => t + Number(v.total || 0), 0) };
}

function getInitials(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    return (parts[0]?.[0] || 'C').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
}

function getAvatarColor(name = '') {
    const colors = ['#B20F45', '#8E63C7', '#2E8F3C', '#6EA55A', '#C47D16', '#4767B8'];
    const index = String(name).split('').reduce((t, ch) => t + ch.charCodeAt(0), 0) % colors.length;
    return colors[index];
}

async function saveCliente(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formPayload(form);
    const id = payload.id;
    delete payload.id;
    try {
        await apiRequest(id ? `/clientes/${id}` : '/clientes', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        resetClienteForm(); await loadClientes(); await loadDashboard();
        toast('Cliente guardado correctamente', 'success');
    } catch (error) { toast(error.message, 'error'); }
}

function editCliente(id) {
    const c = state.clientes.find(x => (x._id || x.id) === id);
    if (!c) return;
    fillForm('#cliente-form', c);
    $('#cliente-form-title').textContent = 'Editar cliente';
    $('#cliente-form').scrollIntoView({ behavior: 'smooth' });
}

function resetClienteForm() {
    $('#cliente-form').reset();
    $('#cliente-form [name="id"]').value = '';
    $('#cliente-form-title').textContent = 'Nuevo cliente';
}

async function reactivarCliente(id) {
    try {
        await apiRequest(`/clientes/${id}/reactivar`, { method: 'PATCH' });
        await loadClientes(); toast('Cliente reactivado correctamente', 'success');
    } catch (error) { toast(error.message, 'error'); }
}

async function showHistorial(id) {
    try {
        const data = await apiRequest(`/clientes/${id}/historial`);
        const ventas = data.data || [];
        const c = state.clientes.find(x => (x._id || x.id) === id);
        const body = $('#modal-body');
        if (!ventas.length) {
            body.innerHTML = `<div class="historial-vacio">${escapeHtml(c?.nombre || 'El cliente')} no tiene compras registradas.</div>`;
        } else {
            body.innerHTML = ventas.map(v => `<div class="historial-item">
                <div class="hi-header">
                    <strong>${currency.format(Number(v.total))}</strong>
                    <small>${formatDate(v.fecha_venta)}</small>
                </div>
                <div class="hi-prods">${(v.productos || []).map(p => `${escapeHtml(p.nombre)} x${p.cantidad} - ${currency.format(Number(p.subtotal))}`).join('<br>')}</div>
                <div style="font-size:0.78rem;color:#6F6864;margin-top:4px">${escapeHtml(v.metodo_pago || '')} · Vendedor: ${escapeHtml(v.vendedor?.nombre || '')}</div>
            </div>`).join('');
        }
        $('#modal-title').textContent = `Historial de ${c?.nombre || 'Cliente'}`;
        openModal();
    } catch (error) { toast(error.message, 'error'); }
}

// ============== VENTAS ==============

async function loadVentas() {
    try {
        const data = await apiRequest('/ventas');
        state.ventas = data.data || [];
        renderVentas();
        renderClientes();
    } catch (error) { toast(error.message, 'error'); }
}

function renderVentas() {
    const tbody = $('#ventas-table');
    if (!state.ventas.length) {
        tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>No hay ventas registradas.</p></div></td></tr>`;
        return;
    }
    tbody.innerHTML = state.ventas.slice(0, 6).map(v => {
        const id = v.id || v._id;
        const productos = (v.productos || []).length || v.total_productos || 1;
        return `<tr>
            <td>#VTA-${id ? id.toString().slice(-5).toUpperCase() : '-----'}</td>
            <td>${escapeHtml(v.cliente || 'Mostrador')}</td>
            <td>${escapeHtml(v.vendedor || '')}</td>
            <td>${productos} producto${productos !== 1 ? 's' : ''}</td>
            <td>${currency.format(Number(v.total || 0))}</td>
            <td>${escapeHtml(v.metodo_pago || '')}</td>
            <td>${formatDate(v.fecha_venta)}</td>
            <td><button class="mini-button pos-action-eye" data-ver-ticket="${id}">Ver</button></td>
        </tr>`;
    }).join('');
    $$('[data-ver-ticket]').forEach(b => b.addEventListener('click', () => showTicket(b.dataset.verTicket)));
}

function renderSaleProductGrid() {
    const container = $('#venta-productos-grid');
    if (!container) return;
    const q = ($('#venta-buscar')?.value || '').trim().toLowerCase();
    const family = $('#venta-categorias .is-active')?.dataset.saleFamily || '';
    let items = state.perfumes.filter(p => p.activo !== false && Number(p.stock) > 0);
    if (q) items = items.filter(p => `${p.nombre} ${p.marca}`.toLowerCase().includes(q));
    if (family) items = items.filter(p => (p.familia_olfativa || '').toLowerCase().includes(family.toLowerCase()));
    items = items.slice(0, 8);

    if (!items.length) {
        container.innerHTML = `<div class="empty-state"><p>No hay perfumes disponibles para la venta.</p></div>`;
        return;
    }

    container.innerHTML = items.map(p => {
        const id = p._id || p.id;
        return `<article class="venta-product-card">
            <img src="${p.imagen_url || 'assets/img/perfume.png'}" alt="${escapeHtml(p.nombre)}">
            <div>
                <h4>${escapeHtml(p.nombre)}</h4>
                <p>${escapeHtml(p.marca || '')}</p>
                <strong>${currency.format(Number(p.precio || 0))}</strong>
                <span>Stock: ${p.stock}</span>
            </div>
            <button type="button" data-sale-add="${id}" aria-label="Agregar ${escapeHtml(p.nombre)}">+</button>
        </article>`;
    }).join('');

    $$('[data-sale-add]').forEach(btn => {
        btn.addEventListener('click', () => {
            const perfume = state.perfumes.find(p => (p._id || p.id) === btn.dataset.saleAdd);
            if (perfume) addToCart(perfume);
        });
    });
}

function emptyCart() {
    if (!state.saleItems.length) return;
    state.saleItems = [];
    renderSaleItems();
    toast('Carrito vaciado', 'success');
}

async function saveVenta(event) {
    event.preventDefault();
    if (!state.saleItems.length) { toast('Agrega al menos un producto.', 'error'); return; }
    const formData = new FormData(event.currentTarget);
    const payload = {
        cliente: formData.get('cliente_id') || null,
        metodo_pago: formData.get('metodo_pago'),
        productos: state.saleItems.map(item => ({ perfume: item.id, cantidad: item.cantidad }))
    };
    try {
        const data = await apiRequest('/ventas', { method: 'POST', body: JSON.stringify(payload) });
        state.saleItems = [];
        $('#venta-form').reset();
        $('#venta-buscar').value = '';
        renderSaleItems();
        await loadAll();
        toast('Venta registrada correctamente', 'success');
        if (data.data?.id) setTimeout(() => showTicket(data.data.id), 500);
    } catch (error) { toast(error.message, 'error'); }
}

async function buscarPerfumesVenta(q) {
    try {
        const data = await apiRequest(`/ventas/buscar-perfumes?q=${encodeURIComponent(q)}`);
        const resultados = data.data || [];
        const container = $('#venta-resultados');
        if (!resultados.length) { container.classList.remove('is-visible'); return; }
        container.innerHTML = resultados.map(p => {
            const id = p._id || p.id;
            return `<div class="resultado-item" data-agregar-perfume="${id}">
                <img src="${p.imagen_url || 'assets/img/perfume.png'}" alt="${escapeHtml(p.nombre)}">
                <div class="res-info">
                    <strong>${escapeHtml(p.nombre)}</strong>
                    <span>${escapeHtml(p.marca)} · Stock: ${p.stock}</span>
                </div>
                <div class="res-precio">${currency.format(Number(p.precio))}</div>
            </div>`;
        }).join('');
        container.classList.add('is-visible');
        $$('[data-agregar-perfume]').forEach(el => el.addEventListener('click', () => {
            const pid = el.dataset.agregarPerfume;
            const perfume = resultados.find(x => (x._id || x.id) === pid);
            if (perfume) addToCart(perfume);
            container.classList.remove('is-visible');
            $('#venta-buscar').value = '';
        }));
    } catch { /* ignore */ }
}

function addToCart(perfume) {
    const id = perfume._id || perfume.id;
    const existing = state.saleItems.find(item => item.id === id);
    if (existing) {
        if (existing.cantidad < perfume.stock) existing.cantidad++;
        else { toast('No hay mas stock disponible', 'error'); return; }
    } else {
        state.saleItems.push({ id, nombre: perfume.nombre, marca: perfume.marca, precio: Number(perfume.precio), stock: perfume.stock, cantidad: 1, imagen: perfume.imagen_url });
    }
    renderSaleItems();
    toast(`${perfume.nombre} agregado al carrito`, 'success');
}

function renderSaleItems() {
    const container = $('#sale-items');
    const resumen = $('#cart-resumen');
    if (!state.saleItems.length) {
        container.innerHTML = '<div class="cart-empty">Busca y agrega perfumes al carrito.</div>';
        resumen?.classList.add('is-hidden');
        return;
    }

    let subtotal = 0;
    container.innerHTML = state.saleItems.map((item, i) => {
        const sub = item.precio * item.cantidad;
        subtotal += sub;
        return `<div class="cart-item">
            <img src="${item.imagen || 'assets/img/perfume.png'}" alt="${escapeHtml(item.nombre)}">
            <div class="ci-info">
                <strong>${escapeHtml(item.nombre)}</strong>
                <span>${escapeHtml(item.marca)} · ${currency.format(item.precio)} c/u</span>
            </div>
            <div class="ci-cantidad">
                <button class="mini-button" data-cart-dec="${i}">-</button>
                <input type="number" value="${item.cantidad}" min="1" max="${item.stock}" data-cart-qty="${i}">
                <button class="mini-button" data-cart-inc="${i}">+</button>
            </div>
            <div class="ci-subtotal">${currency.format(sub)}</div>
            <button class="ci-remove" data-cart-remove="${i}">&times;</button>
        </div>`;
    }).join('');

    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    if (resumen) {
        resumen.classList.remove('is-hidden');
        $('#cart-subtotal').textContent = currency.format(subtotal);
        $('#cart-iva').textContent = currency.format(iva);
        $('#cart-total').textContent = currency.format(total);
    }

    $$('[data-cart-dec]').forEach(b => {
        b.addEventListener('click', () => { const i = Number(b.dataset.cartDec); if (state.saleItems[i].cantidad > 1) state.saleItems[i].cantidad--; renderSaleItems(); });
    });
    $$('[data-cart-inc]').forEach(b => {
        b.addEventListener('click', () => { const i = Number(b.dataset.cartInc); if (state.saleItems[i].cantidad < state.saleItems[i].stock) state.saleItems[i].cantidad++; else toast('Stock maximo alcanzado', 'error'); renderSaleItems(); });
    });
    $$('[data-cart-qty]').forEach(input => {
        input.addEventListener('change', () => { const i = Number(input.dataset.cartQty); let v = Number(input.value); if (v < 1) v = 1; if (v > state.saleItems[i].stock) v = state.saleItems[i].stock; state.saleItems[i].cantidad = v; renderSaleItems(); });
    });
    $$('[data-cart-remove]').forEach(b => {
        b.addEventListener('click', () => { state.saleItems.splice(Number(b.dataset.cartRemove), 1); renderSaleItems(); });
    });
}

async function showTicket(id) {
    try {
        const data = await apiRequest(`/ventas/${id}`);
        const v = data.data;
        const body = $('#modal-body');
        body.innerHTML = `<div class="ticket">
            <div class="ticket-header">
                <h3>SCENTVAULT</h3>
                <small>${formatDate(v.fecha_venta)}</small>
            </div>
            <div style="font-size:0.82rem;margin-bottom:8px">
                <div>Cliente: ${escapeHtml(v.cliente || 'Mostrador')}</div>
                <div>Vendedor: ${escapeHtml(v.vendedor || '')}</div>
                <div>Metodo: ${escapeHtml(v.metodo_pago || '')}</div>
            </div>
            <div class="ticket-items">
                ${(v.productos || []).map(p => `<div class="ticket-item"><span>${escapeHtml(p.nombre)} x${p.cantidad}</span><span>${currency.format(Number(p.subtotal))}</span></div>`).join('')}
            </div>
            <div class="ticket-totals">
                <div><span>Subtotal</span><span>${currency.format(Number(v.subtotal))}</span></div>
                <div><span>IVA (16%)</span><span>${currency.format(Number(v.iva))}</span></div>
                <div class="ticket-grand"><span>TOTAL</span><span>${currency.format(Number(v.total))}</span></div>
            </div>
            <div class="ticket-footer">!Gracias por su preferencia!</div>
        </div>`;
        $('#modal-title').textContent = `Ticket #${id.toString().slice(-6)}`;
        openModal();
    } catch (error) { toast(error.message, 'error'); }
}

function hydrateSaleSelects() {
    const select = $('#venta-cliente');
    if (select) {
        const clientes = state.clientesAll.length ? state.clientesAll : state.clientes;
        select.innerHTML = '<option value="">Cliente mostrador</option>' +
            clientes.filter(c => c.activo !== false).map(c => `<option value="${c._id || c.id}">${escapeHtml(c.nombre)}</option>`).join('');
    }
}

// ============== INVENTARIO ==============

async function loadInventario() {
    try {
        const estado = $('#inventario-filter')?.value || '';
        const orden = $('#inventario-orden')?.value || '';
        const params = new URLSearchParams();
        if (estado) params.set('estado', estado);
        if (orden) params.set('orden', orden);
        const data = await apiRequest(`/inventario?${params.toString()}`);
        state.perfumes = data.data || [];
        hydrateInventarioMarca();
        renderInventarioResumen(data.resumen);
        renderInventario();
    } catch {
        renderInventario();
    }
}

function renderInventarioResumen(resumen) {
    const container = $('#inventario-resumen');
    if (!container || !resumen) return;
    container.innerHTML = `
        <article><span>▯</span><div><small>Productos activos</small><strong>${resumen.total_activos}</strong><em>En catálogo</em></div></article>
        <article><span>△</span><div><small>Bajo stock</small><strong>${resumen.bajo_stock}</strong><em>Requieren atención</em></div></article>
        <article><span>⬡</span><div><small>Agotados</small><strong>${resumen.agotados}</strong><em>Sin existencias</em></div></article>
        <article><span>◍</span><div><small>Valor total inventario</small><strong>${currency.format(resumen.valor_inventario)}</strong><em>Valor en MXN</em></div></article>
        <article><span>▢</span><div><small>Unidades totales</small><strong>${resumen.stock_total}</strong><em>En inventario</em></div></article>
    `;
}

function renderInventario() {
    const tbody = $('#inventario-table');
    const cards = $('#inventario-cards');
    const search = ($('#inventario-search')?.value || '').trim().toLowerCase();
    const marca = $('#inventario-marca')?.value || '';
    let items = state.perfumes;
    if (search) items = items.filter(p => (p.nombre + ' ' + p.marca).toLowerCase().includes(search));
    if (marca) items = items.filter(p => (p.marca || '') === marca);
    renderInventarioCharts(items);
    renderInventarioAlertas(items);
    const countLabel = $('#inventario-count-label');
    if (countLabel) countLabel.textContent = `Mostrando 1 a ${Math.min(items.length, 8)} de ${items.length} productos`;

    if (!items.length) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No hay perfumes que coincidan.</p></div></td></tr>`;
        if (cards) cards.innerHTML = `<div class="empty-state"><p>No hay perfumes que coincidan.</p></div>`;
        return;
    }

    const rows = items.map(p => {
        const stock = Number(p.stock);
        const activo = p.activo !== false;
        let badge, icon;
        if (!activo) { badge = 'badge-inactive'; icon = '&#x26AA;'; }
        else if (stock === 0) { badge = 'badge-out'; icon = '&#x1F534;'; }
        else if (stock <= 5) { badge = 'badge-low'; icon = '&#x1F7E1;'; }
        else { badge = 'badge-available'; icon = '&#x1F7E2;'; }

        return `<tr>
            <td><div style="display:flex;align-items:center;gap:10px"><img src="${p.imagen_url || 'assets/img/perfume.png'}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;background:#f0ece6"> ${escapeHtml(p.nombre)}</div></td>
            <td>${escapeHtml(p.marca)}</td>
            <td><strong>${stock}</strong></td>
            <td>${currency.format(Number(p.precio))}</td>
            <td>${currency.format(Number(p.precio) * stock)}</td>
            <td><span class="badge ${badge}">${icon} ${!activo ? 'Inactivo' : stock === 0 ? 'Agotado' : stock <= 5 ? 'Stock bajo' : 'Disponible'}</span></td>
        </tr>`;
    }).join('');
    if (tbody) tbody.innerHTML = rows;

    if (cards) {
        cards.innerHTML = items.slice(0, 8).map(p => {
            const stock = Number(p.stock);
            const activo = p.activo !== false;
            const estado = !activo ? 'Inactivo' : stock === 0 ? 'Agotado' : stock <= 5 ? 'Bajo stock' : 'Disponible';
            const badge = !activo ? 'badge-inactive' : stock === 0 ? 'badge-out' : stock <= 5 ? 'badge-low' : 'badge-available';
            const id = p._id || p.id;
            return `<article class="inventario-card">
                <img src="${p.imagen_url || 'assets/img/perfume.png'}" alt="${escapeHtml(p.nombre)}">
                <div class="inventario-card-head"><h4>${escapeHtml(p.nombre)}</h4><span class="badge ${badge}">${estado}</span></div>
                <p>${escapeHtml(p.marca || '')}</p>
                <div class="inventario-card-data"><span>Stock:</span><strong>${stock}</strong></div>
                <div class="inventario-card-data"><span>Precio:</span><strong>${currency.format(Number(p.precio || 0))}</strong></div>
                <div class="inventario-card-data"><span>Valor:</span><strong>${currency.format(Number(p.precio || 0) * stock)}</strong></div>
                <div class="inventario-card-actions"><button data-ver-perfume="${id}">👁</button><button data-edit-perfume="${id}">✎</button><button data-baja-perfume="${id}">⋮</button></div>
            </article>`;
        }).join('');
        $$('[data-ver-perfume]').forEach(b => b.addEventListener('click', () => showPerfumeDetail(b.dataset.verPerfume)));
        $$('[data-edit-perfume]').forEach(b => b.addEventListener('click', () => editPerfume(b.dataset.editPerfume)));
        $$('[data-baja-perfume]').forEach(b => b.addEventListener('click', () => confirmBaja('perfume', b.dataset.bajaPerfume)));
    }
}

function hydrateInventarioMarca() {
    const select = $('#inventario-marca');
    if (!select) return;
    const current = select.value;
    const marcas = [...new Set(state.perfumes.map(p => p.marca).filter(Boolean))].sort();
    select.innerHTML = '<option value="">Todas las marcas</option>' + marcas.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join('');
    select.value = current;
}

function renderInventarioCharts(items) {
    const disponibles = items.filter(p => p.activo !== false && Number(p.stock) > 5).length;
    const bajo = items.filter(p => p.activo !== false && Number(p.stock) > 0 && Number(p.stock) <= 5).length;
    const agotados = items.filter(p => p.activo !== false && Number(p.stock) === 0).length;
    const total = Math.max(disponibles + bajo + agotados, 1);
    const donut = $('#inventario-donut');
    if (donut) {
        const a = Math.round(disponibles / total * 100);
        const b = Math.round(bajo / total * 100);
        donut.innerHTML = `<div class="donut" style="--a:${a};--b:${b}"></div><div class="donut-legend"><span><i class="ok"></i>Disponible ${a}% (${disponibles})</span><span><i class="warn"></i>Bajo stock ${b}% (${bajo})</span><span><i class="bad"></i>Agotado ${100 - a - b}% (${agotados})</span></div>`;
    }
    const chart = $('#inventario-brand-chart');
    if (chart) {
        const byMarca = {};
        items.forEach(p => { byMarca[p.marca || 'Otros'] = (byMarca[p.marca || 'Otros'] || 0) + Number(p.precio || 0) * Number(p.stock || 0); });
        const arr = Object.entries(byMarca).sort((a, b) => b[1] - a[1]).slice(0, 6);
        const max = Math.max(...arr.map(x => x[1]), 1);
        chart.innerHTML = arr.map(([marca, valor]) => `<div><span>${escapeHtml(marca)}</span><b style="height:${Math.max(8, valor / max * 110)}px"></b><small>${currency.format(valor)}</small></div>`).join('');
    }
}

function renderInventarioAlertas(items) {
    const box = $('#inventario-alertas');
    if (!box) return;
    const alerts = items.filter(p => p.activo !== false && Number(p.stock) <= 5).sort((a, b) => Number(a.stock) - Number(b.stock)).slice(0, 4);
    if (!alerts.length) { box.innerHTML = emptyState('Inventario saludable.'); return; }
    box.innerHTML = alerts.map(p => `<div class="inventario-alert ${Number(p.stock) === 0 ? 'is-danger' : ''}"><span>${Number(p.stock) === 0 ? '×' : '!'}</span><div><strong>${escapeHtml(p.nombre)}</strong><p>${Number(p.stock) === 0 ? 'Agotado' : `Stock: ${p.stock} unidad${Number(p.stock) !== 1 ? 'es' : ''}`}</p></div><button data-ver-perfume="${p._id || p.id}">Ver</button></div>`).join('') + '<button class="secondary-button inventario-alert-all" type="button">Ver todos los productos</button>';
    $$('[data-ver-perfume]').forEach(b => b.addEventListener('click', () => showPerfumeDetail(b.dataset.verPerfume)));
}

// ============== REPORTES ==============

async function loadReportes() {
    try {
        if ((state.usuario?.rol || state.rol) !== 'admin') {
            switchView('dashboard');
            toast('Reportes solo está disponible para administradores', 'error');
            return;
        }
        setDefaultReportRange();
        const data = await apiRequest(`/reportes${getReportRangeQuery()}`);
        const r = data.data;
        renderReportesKPIs(r);
        renderReportesCharts(r);
        renderReportesAlertas(r);
    } catch (error) { console.error('Error al cargar reportes:', error); toast(error.message || 'Error al cargar reportes', 'error'); }
}

let _reportRangeInitialized = false;
function setDefaultReportRange() {
    const inicio = $('#report-fecha-inicio');
    const fin = $('#report-fecha-fin');
    if (!inicio || !fin) return;
    if (!_reportRangeInitialized) {
        if (!fin.value) fin.value = new Date().toISOString().slice(0, 10);
        if (!inicio.value) inicio.value = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
        _reportRangeInitialized = true;
    }
    updateReportRangeLabel();
}

function clearReportRange() {
    const inicio = $('#report-fecha-inicio');
    const fin = $('#report-fecha-fin');
    if (inicio) inicio.value = '';
    if (fin) fin.value = '';
    $('#report-date-range').textContent = 'Todo el historial';
    _reportRangeInitialized = true;
    loadReportes();
}

function getReportRangeQuery() {
    const inicio = $('#report-fecha-inicio')?.value;
    const fin = $('#report-fecha-fin')?.value;
    const params = new URLSearchParams();
    if (inicio) params.set('fecha_inicio', inicio);
    if (fin) params.set('fecha_fin', fin);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

function updateReportRangeLabel() {
    const label = $('#report-date-range');
    const inicio = $('#report-fecha-inicio')?.value;
    const fin = $('#report-fecha-fin')?.value;
    if (label && inicio && fin) label.textContent = `${inicio} - ${fin}`;
}

function renderReportesKPIs(r) {
    const container = $('#reportes-kpis');
    if (!container) return;
    const unidades = (r.bajo_stock || []).reduce((t, p) => t + Number(p.stock || 0), 0) + (r.agotados || []).reduce((t, p) => t + Number(p.stock || 0), 0) + state.perfumes.reduce((t, p) => t + Number(p.stock || 0), 0);
    container.innerHTML = `
        <article><span>▢</span><div><small>Ventas del día</small><strong>${currency.format(r.ventas_dia?.total || 0)}</strong><em>${r.ventas_dia?.cantidad || 0} transacciones</em></div></article>
        <article><span>▣</span><div><small>Ventas del mes</small><strong>${currency.format(r.ventas_mes?.total || 0)}</strong><em>${r.ventas_mes?.cantidad || 0} transacciones</em></div></article>
        <article><span>↗</span><div><small>Total vendido</small><strong>${currency.format(r.total_vendido?.total || 0)}</strong><em>${r.total_vendido?.cantidad || 0} ventas totales</em></div></article>
        <article><span>⬡</span><div><small>Valor inventario</small><strong>${currency.format(r.valor_inventario || 0)}</strong><em>${unidades} unidades</em></div></article>
    `;
}

function renderReportesCharts(r) {
    if (typeof Chart !== 'undefined') {
        const ventasCanvas = $('#ventasChartCanvas');
        if (ventasCanvas) {
            state.reportCharts.ventas?.destroy();
            const ctx = ventasCanvas.getContext('2d');
            state.reportCharts.ventas = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: (r.ventas_por_dia || []).map(v => v._id?.slice(5)),
                    datasets: [{
                        label: 'Ventas ($)',
                        data: (r.ventas_por_dia || []).map(v => v.total),
                        borderColor: '#8B1538',
                        backgroundColor: 'rgba(139,21,56,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#C9A227'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { callback: v => currency.format(v) } } }
                }
            });
            setTimeout(() => state.reportCharts.ventas?.resize(), 0);
        }

        const topCanvas = $('#topChartCanvas');
        if (topCanvas) {
            state.reportCharts.top?.destroy();
            const ctx = topCanvas.getContext('2d');
            const top = (r.mas_vendidos || []).slice(0, 8);
            state.reportCharts.top = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: top.map(v => v._id),
                    datasets: [{
                        label: 'Unidades vendidas',
                        data: top.map(v => v.cantidad),
                        backgroundColor: 'rgba(139,21,56,0.7)',
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
            setTimeout(() => state.reportCharts.top?.resize(), 0);
        }
    }

    const clientesContainer = $('#clientes-frecuentes-table');
    if (clientesContainer && r.clientes_frecuentes?.length) {
        clientesContainer.innerHTML = r.clientes_frecuentes.slice(0, 8).map(c => `<tr><td>${escapeHtml(c.nombre || 'Desconocido')}</td><td>${c.total_compras}</td><td>${currency.format(c.total_gastado)}</td></tr>`).join('');
    }
    renderReportCategoryChart(r);
    renderTopPerfumesReport(r);
    renderReportVentasTable();
    renderReportInventorySummary(r);
    renderReportInsights(r);
}

function renderReportCategoryChart(r) {
    const el = $('#report-category-chart');
    if (!el) return;
    const perfumesByName = new Map(state.perfumes.map(p => [p.nombre, p]));
    const totals = {};
    (r.mas_vendidos || []).forEach(item => {
        const p = perfumesByName.get(item._id);
        const fam = p?.familia_olfativa || 'Otros';
        totals[fam] = (totals[fam] || 0) + Number(item.cantidad || 0);
    });
    let arr = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (!arr.length) arr = [['Amaderadas', 40], ['Cítricas', 25], ['Dulces', 20], ['Aromáticas', 15]];
    const sum = arr.reduce((t, x) => t + x[1], 0) || 1;
    const colors = ['#a20f3d', '#e3a313', '#d96f8a', '#c9a27a'];
    const stops = arr.reduce((acc, item, i) => {
        const start = acc.total;
        const pct = item[1] / sum * 100;
        acc.parts.push(`${colors[i]} ${start}% ${start + pct}%`);
        acc.total += pct;
        return acc;
    }, { total: 0, parts: [] });
    el.innerHTML = `<div class="report-donut" style="background:conic-gradient(${stops.parts.join(',')})"></div><div class="report-category-legend">${arr.map(([name, val], i) => `<span><i style="background:${colors[i]}"></i>${escapeHtml(name)} <b>${Math.round(val / sum * 100)}%</b></span>`).join('')}</div>`;
}

function renderTopPerfumesReport(r) {
    const el = $('#top-perfumes-report');
    if (!el) return;
    const top = (r.mas_vendidos || []).slice(0, 5);
    if (!top.length) { el.innerHTML = emptyState('Sin ventas suficientes.'); return; }
    const max = Math.max(...top.map(x => Number(x.cantidad || 0)), 1);
    el.innerHTML = top.map((item, i) => {
        const p = state.perfumes.find(x => x.nombre === item._id);
        return `<div class="report-top-row"><span>${i + 1}</span><img src="${p?.imagen_url || 'assets/img/perfume.png'}" alt="${escapeHtml(item._id)}"><strong>${escapeHtml(item._id || 'Perfume')}</strong><b style="width:${Math.max(12, item.cantidad / max * 100)}%"></b><em>${item.cantidad}</em></div>`;
    }).join('');
}

function renderReportVentasTable() {
    const body = $('#report-ventas-table');
    if (!body) return;
    const ventas = state.ventas.slice(0, 5);
    if (!ventas.length) { body.innerHTML = `<tr><td colspan="7">Sin ventas recientes</td></tr>`; return; }
    body.innerHTML = ventas.map(v => {
        const id = v.id || v._id;
        const prods = (v.productos || []).length || v.total_productos || 1;
        return `<tr><td>${id ? id.toString().slice(-7) : '-'}</td><td>${formatDate(v.fecha_venta).split(',')[0]}</td><td>${escapeHtml(v.cliente || 'Mostrador')}</td><td>${prods} producto${prods !== 1 ? 's' : ''}</td><td>${escapeHtml(v.metodo_pago || '')}</td><td>${currency.format(Number(v.total || 0))}</td><td><button class="mini-button" data-ver-ticket="${id}">Ver</button></td></tr>`;
    }).join('');
    $$('[data-ver-ticket]').forEach(b => b.addEventListener('click', () => showTicket(b.dataset.verTicket)));
}

function renderReportInventorySummary(r) {
    const el = $('#report-inventory-summary');
    if (!el) return;
    const active = state.perfumes.filter(p => p.activo !== false).length;
    const bajo = (r.bajo_stock || []).length;
    const agot = (r.agotados || []).length;
    const units = state.perfumes.reduce((t, p) => t + Number(p.stock || 0), 0);
    const marcas = new Set(state.perfumes.map(p => p.marca).filter(Boolean)).size;
    const total = Math.max(active, 1);
    const disp = Math.max(active - bajo - agot, 0);
    const a = Math.round(disp / total * 100);
    const b = Math.round(bajo / total * 100);
    el.innerHTML = `<div class="report-inventory-list"><p><span>Productos activos</span><strong>${active}</strong></p><p><span>Bajo stock</span><strong>${bajo}</strong></p><p><span>Agotados</span><strong>${agot}</strong></p><p><span>Unidades totales</span><strong>${units}</strong></p><p><span>Marcas registradas</span><strong>${marcas}</strong></p></div><div class="donut" style="--a:${a};--b:${b}"></div><div class="donut-legend"><span><i class="ok"></i>Disponible ${a}% (${disp})</span><span><i class="warn"></i>Bajo stock ${b}% (${bajo})</span><span><i class="bad"></i>Agotado ${100 - a - b}% (${agot})</span></div>`;
}

function renderReportInsights(r) {
    const insight = $('#report-insight');
    const metrics = $('#report-mini-metrics');
    const top = r.mas_vendidos?.[0]?._id || 'sin datos';
    if (insight) insight.innerHTML = `<span>★</span><div><strong>Insights importantes</strong><p>Tu perfume más vendido es <b>${escapeHtml(top)}</b>. Revisa stock bajo para evitar pérdidas de venta.</p></div><button type="button">×</button>`;
    if (metrics) {
        const ventas = Number(r.total_vendido?.cantidad || 0);
        const total = Number(r.total_vendido?.total || 0);
        const ticket = ventas ? total / ventas : 0;
        const productosVendidos = (r.mas_vendidos || []).reduce((t, p) => t + Number(p.cantidad || 0), 0);
        metrics.innerHTML = `<div><span>↗</span><small>Ticket promedio</small><strong>${currency.format(ticket)}</strong></div><div><span>▣</span><small>Ventas por día</small><strong>${currency.format(Number(r.ventas_dia?.total || 0))}</strong></div><div><span>▢</span><small>Productos vendidos</small><strong>${productosVendidos}</strong></div><div><span>◔</span><small>Margen bruto</small><strong>45%</strong></div>`;
    }
}

function renderReportesAlertas(r) {
    const container = $('#alertas-inventario');
    if (!container) return;
    const alerts = [];
    (r.bajo_stock || []).forEach(p => alerts.push(`<div class="list-item" style="border-left:3px solid #C9A227"><strong>${escapeHtml(p.nombre)}</strong><p>Stock bajo: ${p.stock} unidades - ${currency.format(p.precio * p.stock)} en inventario</p></div>`));
    (r.agotados || []).forEach(p => alerts.push(`<div class="list-item" style="border-left:3px solid #cb2431"><strong>${escapeHtml(p.nombre)}</strong><p>Producto agotado - requiere reorden</p></div>`));
    container.innerHTML = alerts.length ? alerts.join('') : emptyState('No hay alertas de inventario.');
}

// ============== CONFIGURACION ==============

async function loadConfig() {
    try {
        const data = await apiRequest('/configuracion/perfil');
        const u = data.data;
        if (u) {
            $('#setting-nombre').value = u.nombre || '';
            $('#setting-correo').value = u.correo || '';
        }
    } catch { /* ignore */ }
}

async function saveProfile(event) {
    event.preventDefault();
    const nombre = $('#setting-nombre').value;
    const correo = $('#setting-correo').value;
    try {
        await apiRequest('/configuracion/perfil', { method: 'PUT', body: JSON.stringify({ nombre, correo }) });
        toast('Perfil actualizado correctamente', 'success');
    } catch (error) { toast(error.message, 'error'); }
}

async function changePassword(event) {
    event.preventDefault();
    const password_actual = $('#current-password').value;
    const password_nuevo = $('#new-password').value;
    const confirm = $('#confirm-password').value;
    if (password_nuevo !== confirm) { toast('Las contrasenas no coinciden', 'error'); return; }
    if (password_nuevo.length < 6) { toast('La contrasena debe tener al menos 6 caracteres', 'error'); return; }
    try {
        await apiRequest('/configuracion/password', { method: 'PUT', body: JSON.stringify({ password_actual, password_nuevo }) });
        $('#security-form').reset();
        toast('Contrasena actualizada correctamente', 'success');
    } catch (error) { toast(error.message, 'error'); }
}

// ============== USUARIOS ==============

async function loadUsuarios() {
    try {
        const data = await apiRequest('/usuarios');
        const usuarios = data.data || [];
        renderUsuarios(usuarios);
    } catch (error) { toast(error.message, 'error'); }
}

function renderUsuarios(usuarios) {
    const tbody = $('#usuarios-table');
    if (!usuarios?.length) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><p>No hay usuarios registrados.</p></div></td></tr>`;
        return;
    }
    tbody.innerHTML = usuarios.map(u => {
        const id = u._id || u.id;
        const rolNombre = u.rol?.nombre || u.rol || '';
        return `<tr>
            <td>${escapeHtml(u.nombre)}</td>
            <td>${escapeHtml(u.correo)}</td>
            <td><span class="role-badge">${escapeHtml(rolNombre)}</span></td>
            <td>${u.activo !== false ? '<span class="status-active"> Activo</span>' : '<span class="status-inactive"> Inactivo</span>'}</td>
            <td><div class="action-buttons">
                <button class="mini-button" data-edit-usuario="${id}">Editar</button>
                ${u.activo !== false
                    ? `<button class="mini-button danger" data-baja-usuario="${id}">Baja</button>`
                    : `<button class="mini-button success" data-reactivar-usuario="${id}">Reactivar</button>`}
            </div></td>
        </tr>`;
    }).join('');

    $$('[data-edit-usuario]').forEach(b => b.addEventListener('click', () => editUsuario(b.dataset.editUsuario, usuarios)));
    $$('[data-baja-usuario]').forEach(b => b.addEventListener('click', () => confirmBaja('usuario', b.dataset.bajaUsuario)));
    $$('[data-reactivar-usuario]').forEach(b => b.addEventListener('click', () => reactivarUsuario(b.dataset.reactivarUsuario)));
}

async function saveUsuario(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formPayload(form);
    const id = payload.id;
    delete payload.id;
    try {
        await apiRequest(id ? `/usuarios/${id}` : '/usuarios', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        resetUsuarioForm(); await loadUsuarios();
        toast('Usuario guardado correctamente', 'success');
    } catch (error) { toast(error.message, 'error'); }
}

function editUsuario(id, usuarios) {
    const u = usuarios?.find ? usuarios.find(x => (x._id || x.id) === id) : state.usuarios?.find(x => (x._id || x.id) === id);
    if (!u) return;
    fillForm('#usuario-form', u);
    $('#usuario-form [name="id"]').value = u._id || u.id;
    $('#usuario-form [name="rol"]').value = u.rol?.nombre || u.rol || '';
    const pw = $('#usuario-password');
    pw.required = false;
    pw.placeholder = 'Dejar vacio para mantener';
    $('#usuario-form-title').textContent = 'Editar usuario';
    $('#usuario-form').scrollIntoView({ behavior: 'smooth' });
}

function resetUsuarioForm() {
    $('#usuario-form').reset();
    $('#usuario-form [name="id"]').value = '';
    const pw = $('#usuario-password');
    pw.required = true;
    pw.placeholder = '';
    $('#usuario-form-title').textContent = 'Nuevo usuario';
}

async function reactivarUsuario(id) {
    try {
        await apiRequest(`/usuarios/${id}/reactivar`, { method: 'PATCH' });
        await loadUsuarios(); toast('Usuario reactivado correctamente', 'success');
    } catch (error) { toast(error.message, 'error'); }
}

// ============== CONFIRM & MODAL ==============

function openModal() { $('#modal-overlay').classList.remove('is-hidden'); }
function closeModal() { $('#modal-overlay').classList.add('is-hidden'); }
function closeConfirm() { $('#confirm-overlay').classList.add('is-hidden'); }

function confirmBaja(tipo, id) {
    const labels = { perfume: 'perfume', cliente: 'cliente', usuario: 'usuario' };
    $('#confirm-title').textContent = `Dar de baja ${labels[tipo] || tipo}`;
    $('#confirm-message').textContent = `Estas seguro de dar de baja este ${labels[tipo] || tipo}? Podras reactivarlo despues.`;
    $('#confirm-overlay').classList.remove('is-hidden');
    const btn = $('#confirm-yes');
    btn.onclick = async () => {
        try {
            await apiRequest(`/${tipo}s/${id}/baja`, { method: 'PATCH' });
            if (tipo === 'perfume') await loadPerfumes();
            else if (tipo === 'cliente') await loadClientes();
            else if (tipo === 'usuario') await loadUsuarios();
            await loadDashboard();
            toast(`${labels[tipo] || tipo} dado de baja correctamente`, 'success');
        } catch (error) { toast(error.message, 'error'); }
        closeConfirm();
    };
}

// ============== HELPERS ==============

function fillForm(selector, data) {
    const form = $(selector);
    Object.entries(data).forEach(([key, value]) => {
        const field = form.elements[key];
        if (field) field.value = value ?? '';
    });
}

function formPayload(form) {
    return Object.fromEntries(Array.from(new FormData(form).entries()).map(([key, value]) => [
        key, typeof value === 'string' && value.trim() === '' ? null : value
    ]));
}

function sumSales() { return state.ventas.reduce((t, v) => t + Number(v.total || 0), 0); }
function inventoryValue() { return state.perfumes.reduce((t, p) => t + Number(p.precio || 0) * Number(p.stock || 0), 0); }

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}

function readApiError(data) {
    if (data?.errores?.length) return data.errores.map(e => e.msg).join('. ');
    return data?.error || data?.message || 'Error desconocido';
}

function emptyState(text) {
    return `<div style="text-align:center;padding:24px;color:#6F6864;font-size:0.9rem">${escapeHtml(text)}</div>`;
}

function exportPDF() {
    setDefaultReportRange();
    toast('Generando PDF...', 'info');
    const link = document.createElement('a');
    const url = `${API_URL}/export/pdf${getReportRangeQuery()}`;
    link.href = url;
    link.download = 'ScentVault_Reporte.pdf';
    fetch(url, { headers: { Authorization: `Bearer ${state.token}` } })
        .then(r => { if (!r.ok) throw new Error('Error al generar PDF'); return r.blob(); })
        .then(blob => { link.href = URL.createObjectURL(blob); link.click(); URL.revokeObjectURL(link.href); toast('PDF descargado', 'success'); })
        .catch(e => toast(e.message, 'error'));
}

function exportExcel() {
    setDefaultReportRange();
    toast('Generando Excel...', 'info');
    const link = document.createElement('a');
    const url = `${API_URL}/export/excel${getReportRangeQuery()}`;
    link.href = url;
    link.download = 'ScentVault_Reporte.xlsx';
    fetch(url, { headers: { Authorization: `Bearer ${state.token}` } })
        .then(r => { if (!r.ok) throw new Error('Error al generar Excel'); return r.blob(); })
        .then(blob => { link.href = URL.createObjectURL(blob); link.click(); URL.revokeObjectURL(link.href); toast('Excel descargado', 'success'); })
        .catch(e => toast(e.message, 'error'));
}

function toast(message, type = 'success') {
    const el = $('#toast');
    el.textContent = message;
    el.className = `toast ${type} is-visible`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
