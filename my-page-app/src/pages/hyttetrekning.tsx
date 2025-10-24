// pages/hyttetrekning.tsx
import UserWishForm from '@/components/hyttetrekning/UserWishForm'

export default function Hyttetrekning() {
  // TODO: Re-enable auth for production
  // For local development without auth, render directly
  return <UserWishForm />

  // return (
  //   <RequireAuth>
  //     <UserWishForm />
  //   </RequireAuth>
  // )
}
