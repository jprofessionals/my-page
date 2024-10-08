import dynamic from "next/dynamic";

const RequireAuth = dynamic(() => import('@/components/auth/RequireAuth'), {
  ssr: false,
})

export default function utlysninger() {
  return (
    <RequireAuth>
      <h1>Utlysninger</h1>
      <ul>
        <li>Utlysning 1</li>
        <li>Utlysning 2</li>
        <li>Utlysning 3</li>
      </ul>
    </RequireAuth>
  )
}