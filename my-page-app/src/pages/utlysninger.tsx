import dynamic from "next/dynamic";

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function utlysninger() {
  return (
    <RequireAuth>
      <></>
    </RequireAuth>
  )
}