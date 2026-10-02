import { createAuthClient } from "better-auth/react";

// Cliente do navegador: as chamadas viram `fetch` para `/api/auth/*`, onde valem o rate
// limit e a checagem de origem (ADR 0005). Não importa `src/server/`. Sem `baseURL`: usa a
// origem da página.
export const authClient = createAuthClient();
