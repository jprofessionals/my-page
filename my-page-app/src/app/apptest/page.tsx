'use client'

import RequireAuth from '@/components/auth/RequireAuth'
import { useAuthContext } from "@/providers/AuthProvider";

export default function AppTest() {

  const {user} = useAuthContext()

  return (
    <>
      <RequireAuth>
        <h1>App test</h1>
        <p>{user?.name}</p>
      </RequireAuth>
    </>
  )
}
