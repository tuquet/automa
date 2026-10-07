import http from 'node:http';

export const E2E_PORT = 8766;
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

export async function isDaemonOnline(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`${E2E_BASE_URL}/api/health`, { timeout: 1500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

