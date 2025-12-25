import { handleServerFunctions } from '@payloadcms/next/routes'

export const importMap = {
  "handle-server-functions": handleServerFunctions,
  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": () => import('@payloadcms/richtext-lexical/rsc').then(m => m.RscEntryLexicalCell),
  // ... 其他映射保持最小化，优先保证核心功能
}