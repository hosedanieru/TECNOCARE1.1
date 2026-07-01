import json
from groq import Groq
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
  "costo_repuestos_estimado": numero en pesos colombianos sin signos ni puntos,
  "costo_mano_obra_estimado": numero en pesos colombianos sin signos ni puntos,
  "justificacion": "string breve explicando la prioridad y los costos estimados"
}

Reglas para la prioridad:
- CRITICA: el equipo está totalmente fuera de servicio o representa riesgo de seguridad.
- ALTA: el equipo funciona parcialmente y afecta operaciones importantes.
- MEDIA: hay una falla pero el equipo sigue operativo.
- BAJA: mantenimiento de rutina o mejora preventiva, sin urgencia.

Reglas para los costos en pesos colombianos:
- Estima costos realistas para Colombia.
- Mano de obra: aproximadamente 50000 por hora de trabajo técnico.
- Si no se necesitan repuestos, pon 0.
- Devuelve solo números enteros, sin puntos ni comas."""


def obtener_sugerencia_ia(descripcion, categoria_equipo=None, marca=None, modelo=None):
    cliente = Groq(api_key=settings.GROQ_API_KEY)

    contexto = ""
    if categoria_equipo:
        contexto += f"Categoría del equipo: {categoria_equipo}. "
    if marca:
        contexto += f"Marca: {marca}. "
    if modelo:
        contexto += f"Modelo: {modelo}. "

    mensaje_usuario = f"{contexto}\nDescripción del problema: {descripcion}"

    respuesta = cliente.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {"role": "system", "content": PROMPT_SISTEMA},
            {"role": "user", "content": mensaje_usuario},
        ],
        temperature=0.3,
        max_tokens=500,
    )

    texto = respuesta.choices[0].message.content.strip()
    texto = texto.replace('```json', '').replace('```', '').strip()

    return json.loads(texto)