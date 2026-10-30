import handler from '@/server/api/admin/activity.js';
import { runHandler } from '@/lib/server/next-handler.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = (request) => runHandler(handler, request);
