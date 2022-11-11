import "./Admin.scss";

function Admin() {
  return (
    <div className="admin-container">
      <h3>Administrasjon</h3>
      <a href={"/api/swagger-ui/index.html"}>Swagger-ui</a>
    </div>
  );
}

export default Admin;