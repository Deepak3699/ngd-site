/**
 * Adapt the existing, tested Vercel-style enquiry handlers to Next.js Route
 * Handlers. Business logic stays in server/api; this file only translates
 * Fetch API Request/Response objects.
 */
export async function runHandler(handler, request) {
  const headers = {};
  request.headers.forEach((value, key) => { headers[key.toLowerCase()] = value; });

  const method = request.method || 'GET';
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.text();
  if (body && Buffer.byteLength(body, 'utf8') > 128 * 1024) {
    return Response.json(
      { ok: false, error: { code: 'payload_too_large', message: 'The request is too large.' } },
      { status: 413, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } },
    );
  }
  const req = {
    method,
    url: request.url,
    headers,
    body,
    socket: { remoteAddress: headers['x-real-ip'] || '' },
  };

  const responseHeaders = new Headers();
  let responseBody = '';
  let ended = false;
  const res = {
    statusCode: 200,
    setHeader(name, value) { responseHeaders.set(name, String(value)); },
    getHeader(name) { return responseHeaders.get(name); },
    end(chunk = '') {
      if (ended) return;
      ended = true;
      responseBody = chunk instanceof Uint8Array ? chunk : String(chunk);
    },
  };

  try {
    await handler(req, res);
    if (!ended) res.end('');
    return new Response(responseBody, { status: res.statusCode, headers: responseHeaders });
  } catch (error) {
    console.error('[next-api-adapter]', error);
    return Response.json(
      { ok: false, error: { code: 'server_error', message: 'The request could not be completed. Please try again.' } },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
