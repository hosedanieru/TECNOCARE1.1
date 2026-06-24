from io import BytesIO
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


def generar_pdf_historial_equipo(equipo, mantenimientos):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=2*cm, bottomMargin=2*cm,
                             leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle('Titulo', parent=styles['Heading1'], fontSize=16)
    elementos = []

    elementos.append(Paragraph('Reporte de Historial de Mantenimiento', titulo_style))
    elementos.append(Paragraph(f'Generado el {date.today():%d/%m/%Y}', styles['Normal']))
    elementos.append(Spacer(1, 12))

    datos_equipo = [
        ['Código', equipo.codigo_interno, 'Estado', equipo.get_estado_display()],
        ['Nombre', equipo.nombre, 'Categoría', equipo.categoria.nombre],
        ['Ubicación', equipo.ubicacion, 'N° Serie', equipo.numero_serie or '-'],
    ]
    tabla_equipo = Table(datos_equipo, colWidths=[3*cm, 5.5*cm, 3*cm, 5.5*cm])
    tabla_equipo.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E5E7EB')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#E5E7EB')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    elementos.append(tabla_equipo)
    elementos.append(Spacer(1, 16))

    elementos.append(Paragraph('Historial de Mantenimientos', styles['Heading2']))
    elementos.append(Spacer(1, 6))

    filas = [['Fecha', 'Tipo', 'Estado', 'Técnico', 'Título', 'Costo']]
    for m in mantenimientos:
        tecnico = m.tecnico_asignado.get_full_name() if m.tecnico_asignado else 'Sin asignar'
        filas.append([
            m.fecha_programada.strftime('%d/%m/%Y'),
            m.get_tipo_display(),
            m.get_estado_display(),
            tecnico,
            Paragraph(m.titulo, styles['Normal']),
            f'${m.costo_total:,.0f}',
        ])
    if len(filas) == 1:
        filas.append(['—', '—', '—', '—', 'Sin mantenimientos', '—'])

    tabla = Table(filas, colWidths=[2.2*cm, 2.5*cm, 2.3*cm, 3*cm, 4.5*cm, 2*cm], repeatRows=1)
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F2937')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
    ]))
    elementos.append(tabla)

    doc.build(elementos)
    buffer.seek(0)
    return buffer


def generar_pdf_reporte_general(mantenimientos, filtros=None):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=2*cm, bottomMargin=2*cm,
                             leftMargin=1.5*cm, rightMargin=1.5*cm)
    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle('Titulo', parent=styles['Heading1'], fontSize=16)
    elementos = []

    elementos.append(Paragraph('Reporte General de Mantenimientos', titulo_style))
    pie = f' — Filtros: {filtros}' if filtros else ''
    elementos.append(Paragraph(f'Generado el {date.today():%d/%m/%Y}{pie}', styles['Normal']))
    elementos.append(Spacer(1, 12))

    total = len(mantenimientos)
    finalizados = sum(1 for m in mantenimientos if m.estado == 'FINALIZADO')
    costo_total = sum(m.costo_total for m in mantenimientos)

    resumen = [
        ['Total de mantenimientos', str(total)],
        ['Finalizados', str(finalizados)],
        ['Costo total acumulado', f'${costo_total:,.0f}'],
    ]
    tabla_resumen = Table(resumen, colWidths=[8*cm, 8*cm])
    tabla_resumen.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E5E7EB')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    elementos.append(tabla_resumen)
    elementos.append(Spacer(1, 16))

    filas = [['Equipo', 'Tipo', 'Estado', 'Técnico', 'Fecha', 'Costo']]
    for m in mantenimientos:
        tecnico = m.tecnico_asignado.get_full_name() if m.tecnico_asignado else 'Sin asignar'
        filas.append([
            m.equipo.codigo_interno, m.get_tipo_display(), m.get_estado_display(),
            tecnico, m.fecha_programada.strftime('%d/%m/%Y'), f'${m.costo_total:,.0f}',
        ])

    tabla = Table(filas, colWidths=[3*cm, 2.5*cm, 2.5*cm, 3.5*cm, 2.5*cm, 2.5*cm], repeatRows=1)
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F2937')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
    ]))
    elementos.append(tabla)

    doc.build(elementos)
    buffer.seek(0)
    return buffer
