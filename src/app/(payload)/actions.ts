'use server'

import { handleServerFunctions as payloadHandleServerFunctions } from '@payloadcms/next/layouts'

// 封装为 Server Action，解决 "Functions cannot be passed directly to Client Components" 错误
export async function handleServerFunctions(args: any) {
  return payloadHandleServerFunctions(args)
}
