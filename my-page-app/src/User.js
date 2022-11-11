export class User {
  constructor(name, email, givenName, familyName, icon, startDate, admin, loaded) {
    this.name = name;
    this.email = email;
    this.givenName = givenName;
    this.familyName = familyName;
    this.icon = icon;
    this.startDate = startDate;
    this.admin = admin;
    this.loaded = loaded;
  }
}
