import json
import os
from groq import Groq, GroqError
from django.conf import settings

PROMPT_SISTEMA = """
Eres TecnoCare AI, asistente especializado en mantenimiento de equipos en Colombia.

Áreas:
- Computadores, laptops, servidores, impresoras
- Redes (routers, switches, AP, cableado)
- Equipos electrónicos
- Maquinaria industrial y electromecánica

Tu función es analizar síntomas, identificar fallas probables y sugerir soluciones técnicas realistas.

Si la consulta NO está relacionada con mantenimiento, diagnóstico, reparación o soporte técnico, responde solo:

{
  "error": "Consulta fuera del alcance",
  "mensaje": "Soy TecnoCare AI y solo respondo consultas de mantenimiento y diagnóstico técnico."
}

Para consultas válidas responde ÚNICAMENTE JSON válido:

{
  "diagnosticos_probables": [
    {
      "diagnostico": "string",
      "probabilidad": "ALTA | MEDIA | BAJA"
    }
  ],
  "diagnostico_principal": "string",
  "solucion_sugerida": [
    "paso 1",
    "paso 2",
    "paso 3"
  ],
  "prioridad_sugerida": "BAJA | MEDIA | ALTA | CRITICA",
  "tipo_sugerido": "PREVENTIVO | CORRECTIVO | PREDICTIVO",
  "costo_repuestos_estimado": numero,
  "costo_mano_obra_estimado": numero,
  "tiempo_estimado_horas": numero,
  "justificacion": "string"
}

Reglas:
- 
- Usa diagnósticos técnicos específicos.
Ejemplos válidos:
- Fuente de alimentación defectuosa
- Sobrecalentamiento por polvo
- SSD con sectores dañados

Prioridad:
- CRITICA: fuera de servicio o riesgo
- ALTA: afecta operación importante
- MEDIA: falla parcial
- BAJA: mantenimiento preventivo

Costos en COP:
- Diagnóstico básico: 50000
- Preventivo: 80000-150000
- Reparación media: 150000-300000
- Compleja: 300000+

Repuestos ejemplo:
- Pasta térmica: 30000
- SSD: 180000-350000
- RAM: 120000-400000
- Fuente: 150000-350000

Usa solo enteros, sin puntos ni comas.
Sin markdown.
Sin texto fuera del JSON.
"""

def obtener_sugerencia_ia(descripcion, categoria_equipo=None, marca=None, modelo=None):
    api_key = getattr(settings, 'GROQ_API_KEY', None) or os.getenv('GROQ_API_KEY')
    if not api_key:
        raise ValueError('GROQ_API_KEY no está configurada.')

    cliente = Groq(api_key=api_key)

    contexto = ''
    if categoria_equipo:
        contexto += f'Categoría del equipo: {categoria_equipo}. '
    if marca:
        contexto += f'Marca: {marca}. '
    if modelo:
        contexto += f'Modelo: {modelo}. '

    mensaje_usuario = f"{contexto}\nDescripción del problema: {descripcion}"

    try:
        respuesta = cliente.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": PROMPT_SISTEMA},
                {"role": "user", "content": mensaje_usuario},
            ],
            temperature=0.3,
            # gpt-oss-20b gasta tokens "razonando" antes de escribir la
            # respuesta, y ese razonamiento cuenta dentro de max_completion_tokens.
            # Con un límite bajo (500), el modelo se queda sin tokens antes de
            # llegar a escribir el JSON y devuelve contenido vacío.
            max_completion_tokens=12000,
            # No necesitamos razonamiento profundo para esta tarea estructurada;
            # "low" deja más presupuesto de tokens disponible para el JSON final.
            reasoning_effort="low",
            response_format={"type": "json_object"},
        )
    except GroqError as exc:
        # Errores de la API de Groq (auth, rate limit, modelo no disponible, etc.)
        raise ValueError('No es posible contestar en este momento. Intenta de nuevo en unos minutos.') from exc

    texto = (respuesta.choices[0].message.content or '').strip()
    texto = texto.replace('```json', '').replace('```', '').strip()

    if not texto:
        # El modelo no devolvió contenido (por ejemplo, se quedó sin tokens
        # razonando). No es un error del usuario, así que no exponemos detalles
        # internos, solo un mensaje claro.
        raise ValueError('No es posible contestar en este momento. Intenta de nuevo en unos minutos.')

    try:
        return json.loads(texto)
    except json.JSONDecodeError as exc:
        raise ValueError('No es posible contestar en este momento. Intenta de nuevo en unos minutos.') from exc
