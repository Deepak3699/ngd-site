import handler from '@/server/api/leads.js';
import { runHandler } from '@/lib/server/next-handler.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = (request) => runHandler(handler, request);
export const OPTIONS = (request) => runHandler(handler, request);
