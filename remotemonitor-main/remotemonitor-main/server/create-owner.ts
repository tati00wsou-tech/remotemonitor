import { upsertUser } from "./db";

upsertUser({
  openId: "seu_openid_de_admin",
  name: "Owner",
  email: "owner@exemplo.com",
  loginMethod: "manual",
  role: "admin"
}).then(() => {
  console.log("Usuário owner criado com sucesso!");
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});