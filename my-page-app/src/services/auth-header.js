export default function authHeader() {
    const user_token = JSON.parse(localStorage.getItem('user_token'));
    if (user_token && user_token.id_token) {
      return { Authorization: 'Bearer ' + user_token.id_token };
    } else {
      return {};
    }
  }