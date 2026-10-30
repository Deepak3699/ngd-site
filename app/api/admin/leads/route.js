import handler from '@/server/api/admin/leads.js';
import { runHandler } from '@/lib/server/next-handler.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = (request) => runHandler(handler, request);
export const PATCH = (request) => runHandler(handler, request);
export const PUT = (request) => runHandler(handler, request);
export const DELETE = (request) => runHandler(handler, request);
