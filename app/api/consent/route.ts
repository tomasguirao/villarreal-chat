import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export const TEXTO_CONSENTIMIENTO =
  'Autorizo al Villarreal CF a consultar mis datos de abonado (número de abonado y situación de asiento) con el fin exclusivo de informarme sobre la campaña de abonos 2025/26, conforme al Reglamento (UE) 2016/679 (RGPD).'

export async function POST(req: Request) {
  const { numeroAbonado, aceptado } = await req.json()

  if (!numeroAbonado) {
    return Response.json({ error: 'Número de abonado requerido' }, { status: 400 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'desconocida'

  const { error } = await supabase.from('consentimientos').insert({
    numero_abonado: numeroAbonado,
    aceptado,
    texto_consentimiento: TEXTO_CONSENTIMIENTO,
    ip,
  })

  if (error) {
    console.error('Error guardando consentimiento:', error)
    return Response.json({ error: 'Error al guardar consentimiento' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
