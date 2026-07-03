from io import BytesIO
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer


def _texto(valor, defecto='—'):
    """Evita que None/'' rompan el PDF; útil para descripcion/solucion_aplicada."""
    if valor is None or str(valor).strip() == '':
        return defecto
    return str(valor)


def generar_pdf_historial_equipo(equipo, mantenimientos):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=2*cm, bottomMargin=2*cm,
                             leftMargin=2*cm, rightMargin=2*cm)
    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle('Titulo', parent=styles['Heading1'], fontSize=16)
    subtitulo_style = ParagraphStyle('Subtitulo', parent=styles['Heading3'], fontSize=11,
                                      spaceBefore=10, spaceAfter=4, textColor=colors.HexColor('#1F2937'))
    etiqueta_style = ParagraphStyle('Etiqueta', parent=styles['Normal'], fontSize=8,
                                     textColor=colors.HexColor('#6B7280'))
    cuerpo_style = ParagraphStyle('Cuerpo', parent=styles['Normal'], fontSize=9, leading=12)
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

    # --- Detalle de diagnóstico, solución y costos por mantenimiento ---
    if mantenimientos:
        elementos.append(Spacer(1, 18))
        elementos.append(Paragraph('Detalle de diagnósticos y soluciones', styles['Heading2']))

        for m in mantenimientos:
            encabezado = f'{m.fecha_programada.strftime("%d/%m/%Y")} · {m.titulo} — {m.get_estado_display()}'
            elementos.append(Paragraph(encabezado, subtitulo_style))

            elementos.append(Paragraph('Diagnóstico', etiqueta_style))
            elementos.append(Paragraph(_texto(getattr(m, 'descripcion', None)), cuerpo_style))
            elementos.append(Spacer(1, 4))

            elementos.append(Paragraph('Solución aplicada', etiqueta_style))
            elementos.append(Paragraph(_texto(getattr(m, 'solucion_aplicada', None)), cuerpo_style))
            elementos.append(Spacer(1, 6))

            costos = [
                ['Repuestos', 'Mano de obra', 'Total'],
                [
                    f'${getattr(m, "costo_repuestos", 0):,.0f}',
                    f'${getattr(m, "costo_mano_obra", 0):,.0f}',
                    f'${m.costo_total:,.0f}',
                ],
            ]
            tabla_costos = Table(costos, colWidths=[5.6*cm, 5.6*cm, 5.6*cm])
            tabla_costos.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E5E7EB')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
                ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ]))
            elementos.append(tabla_costos)
            elementos.append(Spacer(1, 14))

    doc.build(elementos)
    buffer.seek(0)
    return buffer


def generar_pdf_reporte_general(mantenimientos, filtros=None):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), topMargin=1.5*cm, bottomMargin=1.5*cm,
                             leftMargin=1.5*cm, rightMargin=1.5*cm)
    styles = getSampleStyleSheet()
    titulo_style = ParagraphStyle('Titulo', parent=styles['Heading1'], fontSize=16)
    celda_style = ParagraphStyle('Celda', parent=styles['Normal'], fontSize=7.5, leading=9.5)
    elementos = []

    elementos.append(Paragraph('Reporte General de Mantenimientos', titulo_style))
    pie = f' — Filtros: {filtros}' if filtros else ''
    elementos.append(Paragraph(f'Generado el {date.today():%d/%m/%Y}{pie}', styles['Normal']))
    elementos.append(Spacer(1, 12))

    total = len(mantenimientos)
    finalizados = sum(1 for m in mantenimientos if m.estado == 'FINALIZADO')
    costo_repuestos_total = sum(getattr(m, 'costo_repuestos', 0) or 0 for m in mantenimientos)
    costo_mano_obra_total = sum(getattr(m, 'costo_mano_obra', 0) or 0 for m in mantenimientos)
    costo_total = sum(m.costo_total for m in mantenimientos)

    resumen = [
        ['Total de mantenimientos', str(total)],
        ['Finalizados', str(finalizados)],
        ['Costo repuestos acumulado', f'${costo_repuestos_total:,.0f}'],
        ['Costo mano de obra acumulado', f'${costo_mano_obra_total:,.0f}'],
        ['Costo total acumulado', f'${costo_total:,.0f}'],
    ]
    tabla_resumen = Table(resumen, colWidths=[9*cm, 9*cm])
    tabla_resumen.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#E5E7EB')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
    ]))
    elementos.append(tabla_resumen)
    elementos.append(Spacer(1, 16))

    filas = [['Equipo', 'Tipo', 'Estado', 'Técnico', 'Fecha', 'Diagnóstico', 'Solución', 'Repuestos', 'M. obra', 'Total']]
    for m in mantenimientos:
        tecnico = m.tecnico_asignado.get_full_name() if m.tecnico_asignado else 'Sin asignar'
        filas.append([
            m.equipo.codigo_interno,
            m.get_tipo_display(),
            m.get_estado_display(),
            tecnico,
            m.fecha_programada.strftime('%d/%m/%Y'),
            Paragraph(_texto(getattr(m, 'descripcion', None)), celda_style),
            Paragraph(_texto(getattr(m, 'solucion_aplicada', None)), celda_style),
            f'${getattr(m, "costo_repuestos", 0):,.0f}',
            f'${getattr(m, "costo_mano_obra", 0):,.0f}',
            f'${m.costo_total:,.0f}',
        ])

    tabla = Table(
        filas,
        colWidths=[2.3*cm, 1.8*cm, 1.8*cm, 2.6*cm, 1.7*cm, 4.2*cm, 4.2*cm, 1.7*cm, 1.7*cm, 1.9*cm],
        repeatRows=1,
    )
    tabla.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F2937')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
    ]))
    elementos.append(tabla)

    doc.build(elementos)
    buffer.seek(0)
    return buffer