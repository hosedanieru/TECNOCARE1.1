import json
from google import genai
from django.conf import settings

PROMPT_SISTEMA = """Eres un asistente técnico especializado en mantenimiento de equipos
(cómputo, redes, maquinaria industrial) en Colombia. A partir de la descripción de una
falla o solicitud, responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional,
sin marcas de markdown, con esta estructura exacta:

{
  "diagnostico_sugerido": "string breve con el diagnóstico técnico más probable",
  "solucion_sugerida": "string con los pasos recomendados para solucionarlo",
  "prioridad_sugerida": "BAJA" | "MEDIA" | "ALTA" | "CRITICA",
  "tipo_sugerido": "PREVENTIVO" | "CORRECTIVO" | "PREDICTIVO",
  "costo_repuestos_estimado": número en pesos colombianos (solo el número, sin signos),
  "costo_mano_obra_estimado": número en pesos colombianos (solo el número, sin signos),
  "justificacion": "string breve explicando la prioridad y los costos estimados"
}

Reglas para la prioridad:
- CRITICA: el equipo está totalmente fuera de servicio o representa riesgo de seguridad.
- ALTA: el equipo funciona parcialmente y afecta operaciones importantes.
- MEDIA: hay una falla pero el equipo sigue operativo.
- BAJA: mantenimiento de rutina o mejora preventiva, sin urgencia.

Reglas para los costos (en pesos colombianos):
- Estima costos realistas para Colombia.
- Repuestos: costo de partes/materiales necesarios.
- Mano de obra: costo del tiempo del técnico (aprox $50.000/hora en Colombia).
- Si no se necesitan repuestos, pon 0.

Responde SOLO con el JSON, sin explicaciones adicionales."""


def obtener_sugerencia_ia(descripcion, categoria_equipo=None, marca=None, modelo=None):
    cliente = genai.Client(api_key=settings.GEMINI_API_KEY)

    contexto = ""
    if categoria_equipo:
        contexto += f"Categoría del equipo: {categoria_equipo}. "
    if marca:
        contexto += f"Marca: {marca}. "
    if modelo:
        contexto += f"Modelo: {modelo}. "

    prompt = f"{PROMPT_SISTEMA}\n\n{contexto}\nDescripción del problema: {descripcion}"

    respuesta = cliente.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt,
    )

    texto = respuesta.text.strip()
    texto = texto.replace('```json', '').replace('```', '').strip()

    return json.loads(texto)
