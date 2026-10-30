import handler from '@/server/api/admin/logout.js';
import { runHandler } from '@/lib/server/next-handler.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = (request) => runHandler(handler, request);
