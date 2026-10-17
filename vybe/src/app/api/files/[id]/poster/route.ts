import { serveAsset } from '@/features/uploads/serve';

export const runtime = 'nodejs';

export async function GET(request: Request, ctx: RouteContext<'/api/files/[id]/poster'>) {
  const { id } = await ctx.params;
  return serveAsset(request, id, 'poster');
}
