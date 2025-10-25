export class AppFetchError extends Error {
  public res: Response;
  constructor(res: Response) {
    super(res.statusText);
    this.res = res;
  }
}

export const appHeaders = new Headers()

type ExtendedRequestInit = Omit<RequestInit, 'body'> & {
  body?: BodyInit | Record<string, any> | null;
};

function parseFetchInit(init: ExtendedRequestInit): RequestInit {
  // headers
  const headers = new Headers(appHeaders);
  if (init.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers.set(key, value);
      });
    } else if (typeof init.headers === 'object') {
      Object.entries(init.headers).forEach(([key, value]) => {
        if (value !== undefined) headers.set(key, String(value));
      });
    }
  }

  // body
  if (init.body && typeof init.body === 'object' && !(init.body instanceof FormData)) {
    init.body = JSON.stringify(init.body);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  return { ...init, headers } as RequestInit;
}

function fetchHandle(res: Response) {
  if (!res.ok) throw new AppFetchError(res);
  return res;
}

export async function appFetch(
  input: string | URL | globalThis.Request,
  init?: ExtendedRequestInit,
): Promise<Response> {
  if (init) {
    const _init = parseFetchInit(init)
    return fetch(input, _init).then(fetchHandle);
  }
  return fetch(input, {
    headers: appHeaders,
  }).then(fetchHandle)
}

export async function appFetchJson<T = any>(
  input: string | URL | globalThis.Request,
  init?: ExtendedRequestInit,
): Promise<T> {
  return appFetch(input, init).then((res) => res.json());
}

export async function appFetchText(
  input: string | URL | globalThis.Request,
  init?: ExtendedRequestInit,
): Promise<string> {
  return appFetch(input, init).then((res) => res.text());
}