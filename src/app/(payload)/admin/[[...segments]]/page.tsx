import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import type { Metadata } from 'next'
import config from '@/payload.config'
import { importMap } from '../importMap'
import { handleServerFunctions } from '../../actions'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = async ({ params, searchParams }: Args) => {
  return RootPage({ 
    config, 
    params, 
    searchParams, 
    importMap, 
    serverFunction: handleServerFunctions 
  })
}

export default Page