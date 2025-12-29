import config from '@/payload.config'
import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import '@payloadcms/next/css'
import { importMap } from './admin/importMap'
import { handleServerFunctions } from './actions'

type Args = {
  children: React.ReactNode
}

const Layout = ({ children }: Args) => (
  <RootLayout 
    config={config} 
    importMap={importMap} 
    serverFunction={handleServerFunctions}
  >
    {children}
  </RootLayout>
)

export default Layout