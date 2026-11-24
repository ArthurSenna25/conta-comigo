# lib/supabase
**Dono:** Arthur
**Regra:** Pasta reservada, SEM código. Os clientes Supabase ficam em `lib/db` (`cliente-servidor.ts`, `sessao-proxy.ts`, `cookies.ts`). Não há client de navegador: login e cadastro vão por server action. A secret key não é usada em `lib/db` nem no proxy; só Storage, `auth.admin` e `registrar_uso_ia` (ver CLAUDE.md).
