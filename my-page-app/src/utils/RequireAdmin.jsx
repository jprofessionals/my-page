function RequireAdmin({ user, children }) {
  if (user && user.admin){
    return children;
  } else {
    return "";
  }
}

export default RequireAdmin;