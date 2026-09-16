import { prisma } from "@/server/db";

// Sem cache em nenhuma camada (Next, CDN da Vercel, navegador): um health check
// guardado em cache diria "ok" mesmo com o banco fora do ar.
const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { headers: noStore });
  } catch (error) {
    // O detalhe vai só para o log do servidor. A resposta é pública e uma mensagem
    // de erro do banco pode revelar host, usuário ou estrutura interna.
    console.error("[health] database check failed", error);
    return Response.json(
      { status: "error" },
      { status: 503, headers: noStore },
    );
  }
}
