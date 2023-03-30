export default function authHeader() {
  const user_token = localStorage.getItem('user_token')
  if (user_token) {
    return { Authorization: 'Bearer ' + user_token }
  } else {
    return {}
  }
}
