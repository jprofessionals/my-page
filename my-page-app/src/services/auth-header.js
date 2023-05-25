export default function authHeader() {
  const user_token = JSON.parse(sessionStorage.getItem('user_token'))
  if (user_token) {
    return { Authorization: 'Bearer ' + user_token }
  } else {
    return {}
  }
}
