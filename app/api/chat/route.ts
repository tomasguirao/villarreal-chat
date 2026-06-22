import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// ── EDITA AQUÍ LAS FECHAS DE LA CAMPAÑA ──────────────────────────────────────
const CAMPAÑA = {
  renovacion: {
    inicio: '1 de julio de 2025',
    fin: '31 de julio de 2025',
    nota: 'Los abonados con asiento afectado por obras serán contactados por el club antes del inicio del periodo.',
  },
  cambioAsiento: {
    inicio: '5 de agosto de 2025',
    fin: '15 de agosto de 2025',
    nota: 'Solo disponible para abonados con cambio de asiento aprobado por el club.',
  },
  altasNuevas: {
    inicio: '20 de agosto de 2025',
    fin: '31 de agosto de 2025',
    nota: 'Sujeto a disponibilidad. Se asignarán por orden de solicitud.',
  },
}

const SOLUCIONES: Record<number, string> = {
  1: 'Tu zona será remodelada. Se te asignará un asiento equivalente en un sector alternativo. El club se pondrá en contacto contigo para confirmar la nueva ubicación antes del inicio del periodo de renovación.',
  2: 'Tu asiento actual desaparece por las reformas. Tienes prioridad para elegir entre las opciones disponibles. Recibirás un correo con el proceso de selección.',
  3: 'Tu acceso al estadio cambia. A partir de la próxima temporada deberás acceder por una entrada diferente. Te informaremos de los detalles por correo.',
  4: 'Tu sector estará cerrado temporalmente durante la primera parte de la temporada. Tendrás un asiento alternativo hasta que finalicen las obras.',
}
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el asistente oficial del Villarreal CF para la campaña de abonos de la temporada 2025/26.

Responde siempre en español, de forma clara y amable. No uses emoticonos ni emojis, excepto en estos dos casos concretos:
- Si el abonado NO está afectado por las obras, empieza tu respuesta con ✅
- Si el abonado SÍ está afectado por las obras (cualquier tipo de problema), empieza tu respuesta con 🔴

INFORMACIÓN DE LA CAMPAÑA:

1. RENOVACIÓN DE ABONOS
   - Periodo: del ${CAMPAÑA.renovacion.inicio} al ${CAMPAÑA.renovacion.fin}
   - ${CAMPAÑA.renovacion.nota}

2. CAMBIO DE ASIENTO
   - Periodo: del ${CAMPAÑA.cambioAsiento.inicio} al ${CAMPAÑA.cambioAsiento.fin}
   - ${CAMPAÑA.cambioAsiento.nota}

3. ALTAS NUEVAS
   - Periodo: del ${CAMPAÑA.altasNuevas.inicio} al ${CAMPAÑA.altasNuevas.fin}
   - ${CAMPAÑA.altasNuevas.nota}

FLUJO PARA RENOVACIÓN:
- Si el usuario pregunta por su renovación o quiere saber si su asiento está afectado por las obras, debes pedirle su número de abonado.
- Cuando pidas el número de abonado, incluye exactamente esta marca al final de tu mensaje (sin nada después): [SOLICITAR_NUMERO]
- Solo incluye [SOLICITAR_NUMERO] la primera vez que pidas el número en la conversación.

INSTRUCCIONES ESTRICTAS:
- Solo responde sobre la campaña de abonos (renovaciones, cambios de asiento, altas nuevas, situación del asiento).
- No inventes información. Solo usa los datos proporcionados.
- Si preguntan algo fuera de la campaña, redirige amablemente a los medios oficiales: villarrealcf.es | Instagram: @villarrealcf | Twitter/X: @VillarrealCF | Facebook: Villarreal CF
- Respuestas cortas y directas.
- Termina siempre cada respuesta con esta frase exacta en una línea aparte: "Este va a ser un gran año groguet! vamos a vivirlo juntos!"`

export async function POST(req: Request) {
  const { messages, numeroAbonado, consentGiven } = await req.json()

  let contextoAbonado = ''

  if (numeroAbonado && consentGiven) {
    const { data, error } = await supabase
      .from('abonados')
      .select('numero_abonado, tipo_problema')
      .eq('numero_abonado', numeroAbonado)
      .single()

    if (error || !data) {
      contextoAbonado = `\n\nDATO VERIFICADO: El número de abonado ${numeroAbonado} no existe en el sistema. Informa al usuario de que verifique su número.`
    } else if (!data.tipo_problema) {
      contextoAbonado = `\n\nDATO VERIFICADO: El abonado ${numeroAbonado} NO está afectado por las obras. Su asiento se mantiene exactamente igual para la próxima temporada. Puede renovar con normalidad en los plazos indicados. Mantente informado por los medios oficiales, página villarrealcf.es y redes sociales oficiales.`
    } else {
      contextoAbonado = `\n\nDATO VERIFICADO: El abonado ${numeroAbonado} tiene el PROBLEMA TIPO ${data.tipo_problema}. Situación: ${SOLUCIONES[data.tipo_problema]}`
    }
  }

  const systemFinal = contextoAbonado
    ? SYSTEM_PROMPT + contextoAbonado
    : SYSTEM_PROMPT

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 512,
    system: systemFinal,
    messages,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  return Response.json({ message: text })
}
