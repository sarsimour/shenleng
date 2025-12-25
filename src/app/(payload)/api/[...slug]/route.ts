import { REST_DELETE, REST_GET, REST_OPTIONS, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import config from '@/payload.config'
import { NextRequest } from 'next/server'

const wrap = (handler: any) => async (req: NextRequest, { params }: { params: Promise<any> }) => {
  const resolvedParams = await params
  return handler(config)(req, { params: resolvedParams })
}

export const GET = wrap(REST_GET)
export const POST = wrap(REST_POST)
export const DELETE = wrap(REST_DELETE)
export const PATCH = wrap(REST_PATCH)
export const OPTIONS = wrap(REST_OPTIONS)
