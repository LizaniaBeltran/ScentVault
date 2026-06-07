const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const Perfume = require('../models/perfumeModel');
const Cliente = require('../models/clienteModel');
const Venta = require('../models/ventaModel');

const WINE = '#8B1538';
const GOLD = '#C9A227';
const DARK = '#111111';
const GRAY = '#666666';
const CREAM = '#F8F6F2';
const LINE = '#E8E1D6';
const SOFT_WINE = '#F4E9ED';
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 45;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TEST_PRODUCT_NAMES = ['test', 'test1', 'test2', 'test3', 'testpng', 'prueba', 'aa', 'editado'];

function isTestProductName(name = '') {
    return TEST_PRODUCT_NAMES.includes(String(name).trim().toLowerCase());
}

function money(value) {
    return `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getDateRange(query) {
    const ahora = new Date();
    const defaultStart = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
    const inicio = query.fecha_inicio ? new Date(`${query.fecha_inicio}T00:00:00`) : defaultStart;
    const fin = query.fecha_fin ? new Date(`${query.fecha_fin}T23:59:59.999`) : ahora;
    return {
        inicio: Number.isNaN(inicio.getTime()) ? defaultStart : inicio,
        fin: Number.isNaN(fin.getTime()) ? ahora : fin
    };
}

function drawHeader(doc, logo, page, generatedAt = new Date()) {
    const previousY = doc.y;
    doc.rect(0, 0, PAGE_W, 54).fillColor('#FFFFFF').fill();
    doc.rect(0, 53, PAGE_W, 1).fillColor(LINE).fill();
    doc.rect(MARGIN, 20, 7, 7).fillColor(GOLD).fill();
    doc.fontSize(8).font('Helvetica-Bold').fillColor(WINE).text('SCENTVAULT', MARGIN + 14, 15, { width: 120 });
    doc.fontSize(6.5).font('Helvetica').fillColor(GRAY).text('Reporte Ejecutivo', MARGIN + 14, 27, { width: 190 });
    doc.fontSize(6.2).font('Helvetica').fillColor(GRAY).text(generatedAt.toLocaleDateString('es-MX'), MARGIN + 14, 37, { width: 190 });
    if (logo) doc.image(logo, PAGE_W - MARGIN - 78, 9, { width: 76 });
    doc.moveTo(MARGIN, 52).lineTo(PAGE_W - MARGIN, 52).strokeColor(GOLD).lineWidth(0.7).stroke();
    doc.lineWidth(1);
    doc.y = previousY;
}

function drawFooter(doc, page, totalPages, generatedAt = new Date()) {
    const previousY = doc.y;
    doc.moveTo(MARGIN, PAGE_H - 38).lineTo(PAGE_W - MARGIN, PAGE_H - 38).strokeColor(LINE).lineWidth(0.4).stroke();
    doc.fontSize(6.5).font('Helvetica').fillColor(GRAY);
    doc.text(`Generado autom\u00e1ticamente por ScentVault | ${generatedAt.toLocaleString('es-MX')}`, MARGIN, PAGE_H - 29, { width: 330 });
    doc.fillColor(WINE).text(`P\u00e1gina ${page} de ${totalPages}`, PAGE_W - MARGIN - 100, PAGE_H - 29, { width: 100, align: 'right' });
    doc.lineWidth(1);
    doc.y = previousY;
}

function addSectionTitle(doc, title, y) {
    doc.rect(MARGIN, y - 2, 4, 20).fillColor(GOLD).fill();
    doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK).text(title.toUpperCase(), MARGIN + 12, y, { width: CONTENT_W - 12 });
    doc.moveTo(MARGIN + 12, y + 20).lineTo(MARGIN + 105, y + 20).strokeColor(WINE).lineWidth(0.8).stroke();
    doc.moveDown(0.5);
    doc.lineWidth(1);
}

function drawKPIBox(doc, x, y, w, h, label, value, color) {
    const accent = color || WINE;
    doc.roundedRect(x + 2, y + 3, w, h, 12).fillColor('#EDE8E2').fillOpacity(0.45).fill().fillOpacity(1);
    doc.roundedRect(x, y, w, h, 12).fillColor('#FFFFFF').fill();
    doc.roundedRect(x, y, w, h, 12).lineWidth(0.6).strokeColor(LINE).stroke();
    doc.roundedRect(x + 12, y + 12, 26, 26, 8).fillColor(accent).fillOpacity(0.12).fill().fillOpacity(1);
    doc.circle(x + 25, y + 25, 4).fillColor(accent).fill();
    doc.fillColor(GRAY).fontSize(7.5).font('Helvetica-Bold').text(label.toUpperCase(), x + 48, y + 13, { width: w - 58 });
    doc.fillColor(accent).fontSize(15).font('Helvetica-Bold').text(String(value), x + 48, y + 31, { width: w - 58 });
}

function drawBarChart(doc, x, y, w, h, data, labelKey, valueKey, color, maxVal) {
    doc.roundedRect(x, y - 18, w, h + 26, 12).fillColor('#FFFFFF').fill();
    doc.roundedRect(x, y - 18, w, h + 26, 12).lineWidth(0.5).strokeColor(LINE).stroke();
    if (!data || !data.length) {
        doc.fillColor(GRAY).fontSize(8).font('Helvetica').text('Sin datos suficientes para graficar.', x + 16, y + 35, { width: w - 32, align: 'center' });
        doc.y = y + h + 18;
        return y + h + 18;
    }
    const max = maxVal || Math.max(...data.map(d => Number(d[valueKey] || 0)), 1);
    const innerX = x + 18;
    const innerW = w - 36;
    const gap = Math.max(4, Math.min(8, 80 / data.length));
    const barW = Math.max(8, Math.min(24, (innerW - 20 - gap * (data.length - 1)) / data.length));
    const chartH = h - 40;
    doc.fillColor(GRAY).fontSize(6).font('Helvetica').text(`Max: ${Math.round(max)}`, innerX, y - 12, { width: 90 });
    doc.fillColor('#F3F0EA').rect(innerX, y, innerW, 1).fill();
    doc.fillColor('#F3F0EA').rect(innerX, y + chartH / 2, innerW, 1).fill();
    doc.fillColor('#F3F0EA').rect(innerX, y + chartH, innerW, 1).fill();
    data.forEach((d, i) => {
        const val = Number(d[valueKey] || 0);
        const bH = (val / max) * chartH;
        const bx = innerX + 10 + i * (barW + gap);
        const by = y + chartH - bH;
        doc.roundedRect(bx, by, barW, Math.max(bH, 1), 5).fillColor(color || WINE).fill();
        if (val > 0) {
            doc.fillColor(DARK).fontSize(6).font('Helvetica-Bold').text(String(Math.round(val)), bx - 4, by - 10, { width: barW + 8, align: 'center' });
        }
        const rawLabel = String(d[labelKey] || '');
        const label = rawLabel.includes('-') ? rawLabel.slice(5) : rawLabel.slice(0, 8);
        doc.fillColor(GRAY).fontSize(5.2).font('Helvetica').text(label, bx - 8, y + chartH + 5, { width: barW + 16, align: 'center' });
    });
    doc.y = y + h + 18;
    return y + h + 18;
}

function drawHorizontalBarChart(doc, x, y, w, h, data, labelKey, valueKey, color) {
    doc.roundedRect(x, y - 18, w, h + 26, 12).fillColor('#FFFFFF').fill();
    doc.roundedRect(x, y - 18, w, h + 26, 12).lineWidth(0.5).strokeColor(LINE).stroke();
    if (!data || !data.length) {
        doc.fillColor(GRAY).fontSize(8).font('Helvetica').text('Sin datos suficientes para graficar.', x + 16, y + 35, { width: w - 32, align: 'center' });
        doc.y = y + h + 18;
        return y + h + 18;
    }
    const max = Math.max(...data.map(d => Number(d[valueKey] || 0)), 1);
    const rowH = Math.min(18, (h - 10) / data.length);
    const labelW = 145;
    const barMaxW = w - labelW - 55;
    data.forEach((d, i) => {
        const val = Number(d[valueKey] || 0);
        const by = y + i * rowH;
        const label = String(d[labelKey] || '').slice(0, 26);
        const bw = Math.max(2, (val / max) * barMaxW);
        doc.fillColor(DARK).fontSize(6.5).font('Helvetica').text(label, x + 16, by + 4, { width: labelW });
        doc.roundedRect(x + 16 + labelW, by + 3, barMaxW, 8, 4).fillColor('#F1ECE6').fill();
        doc.roundedRect(x + 16 + labelW, by + 3, bw, 8, 4).fillColor(color || GOLD).fill();
        doc.fillColor(WINE).fontSize(6.5).font('Helvetica-Bold').text(String(val), x + 22 + labelW + barMaxW, by + 2, { width: 25, align: 'right' });
    });
    doc.y = y + h + 18;
    return y + h + 18;
}


function drawTable(doc, x, y, headers, rows, colWidths, maxRows) {
    const rw = 18;
    const h = rw;
    const totalW = colWidths.reduce((t, w) => t + w, 0);
    const startX = x || MARGIN;

    if (y + (Math.min(rows.length, maxRows || rows.length) + 1) * rw > PAGE_H - 58) return y;

    doc.roundedRect(startX, y - 4, totalW, (Math.min(rows.length, maxRows || rows.length) + 1) * rw + 8, 10).fillColor('#FFFFFF').fill();
    doc.roundedRect(startX, y - 4, totalW, (Math.min(rows.length, maxRows || rows.length) + 1) * rw + 8, 10).lineWidth(0.4).strokeColor(LINE).stroke();
    doc.rect(startX, y, totalW, h).fillColor(WINE).fill();
    headers.forEach((hdr, i) => {
        const cx = startX + colWidths.slice(0, i).reduce((t, w) => t + w, 0);
        doc.fillColor('#FFF').fontSize(6.8).font('Helvetica-Bold').text(hdr, cx + 4, y + 5, { width: colWidths[i] - 8, height: 8, align: 'left' });
    });

    const slice = rows.slice(0, maxRows || rows.length);
    slice.forEach((row, ri) => {
        const ry = y + (ri + 1) * rw;
        if (ry + rw > PAGE_H - 50) { return; }
        doc.fillColor(ri % 2 === 0 ? '#FFFFFF' : CREAM).rect(startX, ry, totalW, rw).fill();
        doc.moveTo(startX, ry + rw).lineTo(startX + totalW, ry + rw).strokeColor(LINE).lineWidth(0.25).stroke();
        row.forEach((cell, ci) => {
            const cx = startX + colWidths.slice(0, ci).reduce((t, w) => t + w, 0);
            const value = String(cell ?? '-');
            const maxChars = Math.max(6, Math.floor((colWidths[ci] - 8) / 3.6));
            const clipped = value.length > maxChars ? value.slice(0, maxChars - 1) + '…' : value;
            doc.fillColor(DARK).fontSize(6.2).font('Helvetica').text(clipped, cx + 4, ry + 5, { width: colWidths[ci] - 8, height: 8 });
        });
    });
    return y + (Math.min(rows.length, maxRows || rows.length) + 1) * rw + 15;
}

function drawInventoryThumbnails(doc, y, perfumes, maxRows = 10) {
    const rows = perfumes.slice(0, maxRows);
    const rowH = 46;
    const x = MARGIN;
    const widths = [52, 120, 78, 48, 68, 78];
    const headers = ['Img', 'Perfume', 'Marca', 'Stock', 'Precio', 'Valor'];
    const totalW = widths.reduce((t, w) => t + w, 0);
    doc.roundedRect(x, y - 4, totalW, (rows.length + 1) * rowH + 8, 12).fillColor('#FFFFFF').fill();
    doc.roundedRect(x, y - 4, totalW, (rows.length + 1) * rowH + 8, 12).strokeColor(LINE).lineWidth(0.5).stroke();
    doc.rect(x, y, totalW, 22).fillColor(WINE).fill();
    headers.forEach((h, i) => {
        const cx = x + widths.slice(0, i).reduce((t, w) => t + w, 0);
        doc.fillColor('#FFF').fontSize(6.8).font('Helvetica-Bold').text(h, cx + 5, y + 7, { width: widths[i] - 10 });
    });
    rows.forEach((p, ri) => {
        const ry = y + 22 + ri * rowH;
        doc.fillColor(ri % 2 === 0 ? '#FFFFFF' : CREAM).rect(x, ry, totalW, rowH).fill();
        let cx = x;
        if (p.imagen_url) {
            try { doc.image(p.imagen_url, cx + 8, ry + 5, { width: 28, height: 36, fit: [28, 36] }); } catch { doc.roundedRect(cx + 10, ry + 8, 24, 28, 5).fillColor(CREAM).fill(); }
        } else doc.roundedRect(cx + 10, ry + 8, 24, 28, 5).fillColor(CREAM).fill();
        cx += widths[0];
        const values = [p.nombre, p.marca, p.stock, money(p.precio), money(Number(p.precio || 0) * Number(p.stock || 0))];
        values.forEach((v, i) => {
            const w = widths[i + 1];
            const text = String(v || '-');
            const clipped = text.length > 22 ? text.slice(0, 21) + '…' : text;
            doc.fillColor(DARK).fontSize(6.5).font(i >= 2 ? 'Helvetica-Bold' : 'Helvetica').text(clipped, cx + 5, ry + 16, { width: w - 10, height: 10 });
            cx += w;
        });
        doc.moveTo(x, ry + rowH).lineTo(x + totalW, ry + rowH).strokeColor(LINE).lineWidth(0.25).stroke();
    });
    return y + 22 + rows.length * rowH + 18;
}

const exportPDF = async (req, res) => {
    try {
        const generatedAt = new Date();
        const { inicio, fin } = getDateRange(req.query);
        const rangoVentas = { fecha_venta: { $gte: inicio, $lte: fin } };

        const [perfumesRaw, clientes, ventas, ventasPorDia, masVendidosRaw, metodoPago, topClientes] = await Promise.all([
            Perfume.find({ activo: true }).sort({ nombre: 1 }),
            Cliente.find({ activo: true }).sort({ nombre: 1 }),
            Venta.find(rangoVentas).sort({ fecha_venta: -1 }).limit(50).populate('cliente', 'nombre'),
            Venta.aggregate([
                { $match: rangoVentas },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha_venta' } }, total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
                { $sort: { _id: 1 } },
                { $limit: 15 }
            ]),
            Venta.aggregate([
                { $match: rangoVentas },
                { $unwind: '$productos' },
                { $group: { _id: '$productos.nombre', cantidad: { $sum: '$productos.cantidad' }, total: { $sum: '$productos.subtotal' } } },
                { $sort: { cantidad: -1 } },
                { $limit: 8 }
            ]),
            Venta.aggregate([
                { $match: rangoVentas },
                { $group: { _id: '$metodo_pago', total: { $sum: '$total' }, cantidad: { $sum: 1 } } },
                { $sort: { total: -1 } }
            ]),
            Venta.aggregate([
                { $match: { ...rangoVentas, cliente: { $ne: null } } },
                { $group: { _id: '$cliente', compras: { $sum: 1 }, total: { $sum: '$total' } } },
                { $sort: { total: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'clientes', localField: '_id', foreignField: '_id', as: 'cliente' } },
                { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
                { $project: { nombre: '$cliente.nombre', compras: 1, total: 1 } }
            ])
        ]);

        const perfumes = perfumesRaw
            .filter(p => !isTestProductName(p.nombre))
            .sort((a, b) => (Number(b.precio || 0) * Number(b.stock || 0)) - (Number(a.precio || 0) * Number(a.stock || 0)));
        const masVendidos = masVendidosRaw.filter(p => !isTestProductName(p._id)).slice(0, 8);

        const valorInv = perfumes.reduce((t, p) => t + (p.precio * p.stock), 0);
        const totalVentas = ventas.reduce((t, v) => t + (v.total || 0), 0);
        const agotados = perfumes.filter(p => p.stock === 0).length;
        const bajoStock = perfumes.filter(p => p.stock > 0 && p.stock <= 5).length;
        const disponibles = perfumes.filter(p => p.stock > 5).length;
        const logoPath = path.join(__dirname, '..', '..', 'assets', 'img', 'logo.png');
        const perfumeDecorPath = path.join(__dirname, '..', '..', '..', 'frontend', 'assets', 'img', 'perfume.png');
        const logo = fs.existsSync(logoPath) ? logoPath : null;
        const perfumeDecor = fs.existsSync(perfumeDecorPath) ? perfumeDecorPath : null;

        const doc = new PDFDocument({ margin: MARGIN, size: 'A4', bufferPages: true });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=ScentVault_Reporte.pdf');
        doc.pipe(res);
        let page = 1;

        function addPageWithDecorations() {
            doc.addPage();
            page++;
            doc.y = 70;
        }
        doc.y = 70;

        // ============== PORTADA ==============
        doc.rect(0, 0, PAGE_W, PAGE_H).fillColor('#FFFFFF').fill();
        doc.circle(42, 92, 160).fillColor(SOFT_WINE).fill();
        doc.circle(PAGE_W - 34, PAGE_H - 74, 210).fillColor(CREAM).fill();
        doc.rect(MARGIN, 98, 5, 160).fillColor(GOLD).fill();
        doc.fillColor(WINE).fontSize(9).font('Helvetica-Bold')
            .text('REPORTE EJECUTIVO', MARGIN + 20, 112, { characterSpacing: 1.8 });
        doc.fillColor(DARK).fontSize(38).font('Helvetica-Bold')
            .text('Reporte General', MARGIN + 20, 138, { width: CONTENT_W - 40 });
        doc.fillColor(WINE).fontSize(24).font('Helvetica-Bold')
            .text('ScentVault', MARGIN + 20, 184, { width: CONTENT_W - 40 });
        doc.moveTo(MARGIN + 20, 230).lineTo(MARGIN + 180, 230).strokeColor(GOLD).lineWidth(2.2).stroke();
        doc.lineWidth(1);
        doc.fillColor(GRAY).fontSize(10.5).font('Helvetica')
            .text('Sistema de Gesti\u00f3n de Perfumer\u00eda de Lujo', MARGIN + 20, 248, { width: 300 });

        if (logo) {
            doc.image(logo, PAGE_W - MARGIN - 150, 95, { width: 130 });
        }
        if (perfumeDecor) {
            doc.image(perfumeDecor, PAGE_W - MARGIN - 150, 470, { width: 125, opacity: 0.14 });
        }

        doc.fillColor(DARK).fontSize(11).font('Helvetica')
            .text(`${inicio.toLocaleDateString('es-MX')} - ${fin.toLocaleDateString('es-MX')}`, MARGIN + 20, 315, { width: 360 });

        doc.roundedRect(MARGIN + 20, 360, CONTENT_W - 40, 105, 16).fillColor('#FFFFFF').fill();
        doc.roundedRect(MARGIN + 20, 360, CONTENT_W - 40, 105, 16).lineWidth(0.6).strokeColor(LINE).stroke();
        doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text('Contenido del reporte', MARGIN + 40, 382);
        doc.fillColor(GRAY).fontSize(9).font('Helvetica')
            .text('Resumen ejecutivo, KPIs, gr\u00e1ficas de ventas, perfumes m\u00e1s vendidos, estado del inventario y tablas operativas con datos reales de MongoDB.', MARGIN + 40, 404, { width: CONTENT_W - 80, lineGap: 3 });
        doc.fillColor(WINE).fontSize(8).font('Helvetica-Bold').text('SCENTVAULT ADMINISTRACI\u00d3N', MARGIN + 40, 442, { characterSpacing: 1.1 });

        doc.roundedRect(MARGIN + 20, 500, CONTENT_W - 190, 92, 16).fillColor('#FFFFFF').fill();
        doc.roundedRect(MARGIN + 20, 500, CONTENT_W - 190, 92, 16).lineWidth(0.6).strokeColor(LINE).stroke();
        doc.fillColor(WINE).fontSize(11).font('Helvetica-Bold').text('Resumen ejecutivo autom\u00e1tico', MARGIN + 40, 520);
        doc.fillColor(DARK).fontSize(9).font('Helvetica')
            .text(`Durante el periodo analizado se registraron ${ventas.length} ventas, ${clientes.length} clientes activos y un valor de inventario de ${money(valorInv)}.`, MARGIN + 40, 542, { width: CONTENT_W - 230, lineGap: 3 });
        doc.y = 500;

        // ============== PÁGINA 2: RESUMEN + KPIs ==============
        addPageWithDecorations();
        addSectionTitle(doc, 'Resumen General', 70);

        const kpiY = 100;
        const kpiW = (CONTENT_W - 24) / 3;
        drawKPIBox(doc, MARGIN, kpiY, kpiW, 58, 'Perfumes activos', perfumes.length, WINE);
        drawKPIBox(doc, MARGIN + kpiW + 12, kpiY, kpiW, 58, 'Clientes registrados', clientes.length, GOLD);
        drawKPIBox(doc, MARGIN + 2 * (kpiW + 12), kpiY, kpiW, 58, 'Ventas realizadas', ventas.length, WINE);

        const kpiY2 = kpiY + 72;
        drawKPIBox(doc, MARGIN, kpiY2, kpiW, 58, 'Valor inventario', `$${valorInv.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`, GOLD);
        drawKPIBox(doc, MARGIN + kpiW + 12, kpiY2, kpiW, 58, 'Total ventas', `$${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`, WINE);
        drawKPIBox(doc, MARGIN + 2 * (kpiW + 12), kpiY2, kpiW, 58, 'Productos agotados', agotados, '#cb2431');

        // ============== GRÁFICA VENTAS POR DÍA ==============
        addSectionTitle(doc, 'Ventas por d\u00eda', kpiY2 + 85);
        const chartY = kpiY2 + 105;
        const chartW = CONTENT_W;
        doc.fontSize(7).fillColor(GRAY).font('Helvetica').text('\u00daltimos 15 d\u00edas con ventas', MARGIN, chartY - 12);
        let currentY = drawBarChart(doc, MARGIN, chartY, chartW, 120, ventasPorDia, '_id', 'total', WINE);

        // ============== GRÁFICA PERFUMES MÁS VENDIDOS ==============
        if (currentY > PAGE_H - 190) { addPageWithDecorations(); currentY = 80; }
        addSectionTitle(doc, 'Perfumes m\u00e1s vendidos', currentY + 10);
        const topY = currentY + 40;
        currentY = drawHorizontalBarChart(doc, MARGIN, topY, chartW, 140, masVendidos, '_id', 'cantidad', GOLD);

        // ============== GRÁFICA INVENTARIO POR ESTADO ==============
        if (currentY > PAGE_H - 170) { addPageWithDecorations(); currentY = 80; }
        addSectionTitle(doc, 'Inventario por estado', currentY + 12);
        const pieY = currentY + 45;
        const pieTotal = disponibles + bajoStock + agotados || 1;
        const barMaxW = CONTENT_W - 120;
        const colors = ['#22863a', '#C9A227', '#cb2431'];
        const labels = ['Disponible', 'Bajo stock', 'Agotado'];
        const vals = [disponibles, bajoStock, agotados];
        doc.fontSize(8).font('Helvetica');
        vals.forEach((val, i) => {
            const pct = Math.round(val / pieTotal * 100);
            const bw = (val / pieTotal) * barMaxW;
            const by = pieY + i * 30;
            doc.fillColor(colors[i]).rect(MARGIN + 100, by, Math.max(bw, 1), 18).fill();
            doc.fillColor(DARK).text(`${labels[i]} (${val})`, MARGIN, by + 3, { width: 90 });
            doc.fillColor(GRAY).text(`${pct}%`, MARGIN + 105 + Math.max(bw, 1) + 4, by + 3);
        });

        currentY = pieY + 115;
        if (currentY > PAGE_H - 210) { addPageWithDecorations(); currentY = 80; }
        addSectionTitle(doc, 'Ventas por m\u00e9todo de pago', currentY);
        currentY = drawHorizontalBarChart(doc, MARGIN, currentY + 35, CONTENT_W, 115, metodoPago, '_id', 'total', WINE);

        if (currentY > PAGE_H - 190) { addPageWithDecorations(); currentY = 80; }
        addSectionTitle(doc, 'Top 5 clientes', currentY + 6);
        drawTable(doc, MARGIN, currentY + 36, ['Cliente', 'Compras', 'Total gastado'], topClientes.map(c => [c.nombre || 'Cliente', c.compras, money(c.total)]), [180, 70, 110], 5);
        currentY += 165;

        if (currentY > PAGE_H - 170) { addPageWithDecorations(); currentY = 80; }
        const lowStockRows = perfumes.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).slice(0, 6).map(p => [p.nombre, p.marca, p.stock, money(Number(p.precio || 0) * Number(p.stock || 0))]);
        if (lowStockRows.length) {
            addSectionTitle(doc, 'Alertas de stock bajo', currentY + 8);
            drawTable(doc, MARGIN, currentY + 38, ['Perfume', 'Marca', 'Stock', 'Valor'], lowStockRows, [130, 90, 55, 85], 6);
        }
        doc.y = currentY + 175;

        // ============== INVENTARIO ==============
        addPageWithDecorations();
        const invY = 78;
        addSectionTitle(doc, 'Inventario de perfumes', invY);
        const nextY = drawInventoryThumbnails(doc, doc.y + 5, perfumes, 10);

        // ============== CLIENTES ==============
        const cliY = Math.max(nextY + 18, doc.y + 18);
        addSectionTitle(doc, 'Clientes registrados', cliY);
        const cliHeaders = ['Nombre', 'Correo', 'Tel\u00e9fono', 'Preferencia', 'Registro'];
        const cliCols = [80, 95, 65, 60, 55];
        const cliRows = clientes.slice(0, 10).map(c => [
            c.nombre, c.correo || '-', c.telefono || '-', c.preferencia_olfativa || '-',
            c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-MX') : '-'
        ]);
        const nextY2 = drawTable(doc, MARGIN, doc.y + 5, cliHeaders, cliRows, cliCols, 10);

        // ============== VENTAS ==============
        addPageWithDecorations();
        const venY = 78;
        addSectionTitle(doc, '\u00daltimas ventas', venY);
        const venHeaders = ['ID', 'Cliente', 'Productos', 'Total', 'M\u00e9todo', 'Fecha'];
        const venCols = [60, 80, 50, 55, 55, 55];
        const venRows = ventas.slice(0, 15).map(v => {
            const nom = v.cliente && typeof v.cliente === 'object' ? v.cliente.nombre : (v.cliente_nombre || 'Mostrador');
            return [
                String(v._id).slice(-8), nom, (v.productos || []).length + ' prod.',
                `$${(v.total || 0).toFixed(2)}`, v.metodo_pago || '-',
                v.fecha_venta ? new Date(v.fecha_venta).toLocaleDateString('es-MX') : '-'
            ];
        });
        drawTable(doc, MARGIN, doc.y + 5, venHeaders, venRows, venCols, 15);

        addPageWithDecorations();
        addSectionTitle(doc, 'Conclusiones autom\u00e1ticas', 78);
        const topProducto = masVendidos[0]?._id || 'sin producto destacado';
        const topMetodo = metodoPago[0]?._id || 'sin m\u00e9todo dominante';
        const conclusionLines = [
            `El periodo analizado acumul\u00f3 ${ventas.length} ventas por un total de ${money(totalVentas)}.`,
            `El producto con mayor rotaci\u00f3n fue ${topProducto}.`,
            `El m\u00e9todo de pago m\u00e1s relevante fue ${topMetodo}.`,
            bajoStock > 0 ? `Hay ${bajoStock} productos con stock bajo; se recomienda reabastecerlos para evitar quiebres de inventario.` : 'El inventario no presenta alertas cr\u00edticas de stock bajo.',
            agotados > 0 ? `Existen ${agotados} productos agotados que requieren atenci\u00f3n inmediata.` : 'No se detectaron productos agotados en el inventario activo.'
        ];
        doc.roundedRect(MARGIN, 120, CONTENT_W, 230, 16).fillColor('#FFFFFF').fill();
        doc.roundedRect(MARGIN, 120, CONTENT_W, 230, 16).strokeColor(LINE).lineWidth(0.6).stroke();
        conclusionLines.forEach((line, i) => {
            const y = 145 + i * 36;
            doc.circle(MARGIN + 18, y + 4, 4).fillColor(i % 2 ? GOLD : WINE).fill();
            doc.fillColor(DARK).fontSize(9).font('Helvetica').text(line, MARGIN + 34, y, { width: CONTENT_W - 58, lineGap: 2 });
        });

        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
            doc.switchToPage(i);
            drawHeader(doc, logo, i + 1, generatedAt);
            drawFooter(doc, i + 1, range.count, generatedAt);
        }

        doc.end();
    } catch (e) {
        console.error('Error PDF:', e);
        res.status(500).json({ ok: false, error: 'Error al generar PDF' });
    }
};

const exportExcel = async (req, res) => {
    try {
        const { inicio, fin } = getDateRange(req.query);
        const rangoVentas = { fecha_venta: { $gte: inicio, $lte: fin } };
        const [perfumesRaw, clientes, ventas] = await Promise.all([
            Perfume.find({ activo: true }).sort({ nombre: 1 }),
            Cliente.find({ activo: true }).sort({ nombre: 1 }),
            Venta.find(rangoVentas).sort({ fecha_venta: -1 }).limit(100).populate('cliente', 'nombre')
        ]);
        const perfumes = perfumesRaw
            .filter(p => !isTestProductName(p.nombre))
            .sort((a, b) => (Number(b.precio || 0) * Number(b.stock || 0)) - (Number(a.precio || 0) * Number(a.stock || 0)));
        const valorInventario = perfumes.reduce((t, p) => t + Number(p.precio || 0) * Number(p.stock || 0), 0);
        const totalVentas = ventas.reduce((t, v) => t + Number(v.total || 0), 0);
        const logoPath = path.join(__dirname, '..', '..', 'assets', 'img', 'logo.png');

        const wb = new ExcelJS.Workbook();
        wb.creator = 'ScentVault';
        wb.created = new Date();

        const addHeader = (ws, title) => {
            ws.mergeCells('A1:F1');
            const cell = ws.getCell('A1');
            cell.value = title;
            cell.font = { name: 'Arial', size: 14, bold: true, color: { argb: '8B1538' } };
            cell.alignment = { horizontal: 'center' };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F6F2' } };
        };

        const addColHeaders = (ws, headers, row = 2) => {
            const hRow = ws.getRow(row);
            headers.forEach((h, i) => {
                const cell = hRow.getCell(i + 1);
                cell.value = h;
                cell.font = { bold: true, color: { argb: 'FFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B1538' } };
                cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
            });
        };

        if (fs.existsSync(logoPath)) {
            const imageId = wb.addImage({ filename: logoPath, extension: 'png' });
            const wsResumen = wb.addWorksheet('Resumen');
            wsResumen.addImage(imageId, { tl: { col: 0.2, row: 0.2 }, ext: { width: 120, height: 70 } });
            wsResumen.mergeCells('C1:H1');
            wsResumen.getCell('C1').value = 'Reporte Ejecutivo ScentVault';
            wsResumen.getCell('C1').font = { bold: true, size: 18, color: { argb: '8B1538' } };
            wsResumen.getCell('C2').value = `${inicio.toLocaleDateString('es-MX')} - ${fin.toLocaleDateString('es-MX')}`;
            wsResumen.getCell('C2').font = { color: { argb: '666666' } };
            const summaryRows = [
                ['Métrica', 'Valor'],
                ['Ventas del periodo', ventas.length],
                ['Total vendido', totalVentas],
                ['Clientes activos', clientes.length],
                ['Perfumes activos', perfumes.length],
                ['Valor inventario', valorInventario]
            ];
            summaryRows.forEach((row, i) => { wsResumen.getRow(i + 5).values = row; });
            addColHeaders(wsResumen, ['Métrica', 'Valor'], 5);
            wsResumen.columns = [{ width: 28 }, { width: 20 }, { width: 24 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }, { width: 20 }];
            wsResumen.getColumn(2).numFmt = '$#,##0.00';
        } else {
            const wsResumen = wb.addWorksheet('Resumen');
            addHeader(wsResumen, 'Reporte Ejecutivo ScentVault');
        }

        const wsPerfumes = wb.addWorksheet('Inventario');
        addHeader(wsPerfumes, 'Inventario - Perfumes Activos');
        addColHeaders(wsPerfumes, ['Nombre', 'Marca', 'Familia', 'Stock', 'Precio', 'Valor']);
        perfumes.forEach((p, i) => {
            const r = wsPerfumes.getRow(i + 3);
            r.values = [p.nombre, p.marca, p.familia_olfativa || '', p.stock, p.precio || 0, (p.precio || 0) * (p.stock || 0)];
            r.eachCell(c => { c.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }; });
        });
        wsPerfumes.columns.forEach(c => { c.width = 22; });

        const wsClientes = wb.addWorksheet('Clientes');
        addHeader(wsClientes, 'Clientes Registrados');
        addColHeaders(wsClientes, ['Nombre', 'Correo', 'Telefono', 'Preferencia', 'Registro']);
        clientes.forEach((c, i) => {
            const r = wsClientes.getRow(i + 3);
            r.values = [c.nombre, c.correo || '', c.telefono || '', c.preferencia_olfativa || '', c.createdAt ? c.createdAt.toISOString().split('T')[0] : ''];
            r.eachCell(cell => { cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }; });
        });
        wsClientes.columns.forEach(c => { c.width = 24; });

        const wsVentas = wb.addWorksheet('Ventas');
        addHeader(wsVentas, 'Ventas Recientes');
        addColHeaders(wsVentas, ['ID', 'Cliente', 'Productos', 'Total', 'Metodo', 'Fecha']);
        ventas.forEach((v, i) => {
            const r = wsVentas.getRow(i + 3);
            const nomCliente = v.cliente && typeof v.cliente === 'object' ? v.cliente.nombre : (v.cliente_nombre || 'Mostrador');
            r.values = [v._id.toString().slice(-8), nomCliente, (v.productos || []).length, v.total || 0, v.metodo_pago || '', v.fecha_venta ? new Date(v.fecha_venta).toISOString().split('T')[0] : ''];
            r.eachCell(cell => { cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } }; });
        });
        wsVentas.columns.forEach(c => { c.width = 22; });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ScentVault_Reporte.xlsx');
        await wb.xlsx.write(res);
        res.end();
    } catch (e) {
        console.error('Error Excel:', e);
        res.status(500).json({ ok: false, error: 'Error al generar Excel' });
    }
};

module.exports = { exportPDF, exportExcel };
