import { networkInterfaces } from 'os';
import { execFileProbe } from './exec-file-probe.js';

// Route tools may take their full deadline under load. Keep synchronous callers
// on the last usable reading (or interface heuristic), with one bounded refresh.
let routeCache: { ip: string | null; at: number } | null = null;
let routeRefreshInFlight = false;
function defaultRouteIp(): string | null {
  const now = Date.now();
  const usable = (ip: string | null) => ip && Object.values(networkInterfaces()).some(entries =>
    entries?.some(net => net.family === 'IPv4' && !net.internal && net.address === ip)) ? ip : null;
  if (routeCache && now - routeCache.at < 3000) return usable(routeCache.ip);
  if (!routeRefreshInFlight) {
    const platform = process.platform;
    const command = platform === 'linux' ? 'ip' : 'route';
    const args = platform === 'darwin' ? ['-n', 'get', 'default']
      : platform === 'linux' ? ['route', 'get', '1.1.1.1']
      : platform === 'win32' ? ['print', '-4', '0.0.0.0'] : null;
    if (!args) { routeCache = { ip: null, at: now }; return null; }
    routeRefreshInFlight = true;
    const complete = (error: unknown, out = '') => {
      let ip = usable(routeCache?.ip ?? null);
      if (!error) {
        const iface = platform === 'darwin' ? out.match(/interface:\s*(\S+)/)?.[1]
          : platform === 'linux' ? out.match(/\bdev\s+(\S+)/)?.[1] : undefined;
        ip = null;
        if (platform === 'win32') {
          let bestMetric = Infinity;
          for (const line of out.split('\n')) {
            const match = line.trim().match(/^0\.0\.0\.0\s+0\.0\.0\.0\s+\S+\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+)/);
            if (!match || match[1] === '0.0.0.0' || match[1].startsWith('169.254.')) continue;
            const metric = Number(match[2]);
            if (metric < bestMetric) { bestMetric = metric; ip = match[1]; }
          }
        } else if (iface) {
          ip = networkInterfaces()[iface]?.find(net => net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.'))?.address ?? null;
        }
      }
      routeCache = { ip, at: Date.now() };
      routeRefreshInFlight = false;
    };
    void execFileProbe(command, args, { timeout: 1000 })
      .then(out => complete(null, out), error => complete(error));
  }
  return usable(routeCache?.ip ?? null);
}

/** Return the last usable default-route IPv4 (refreshed asynchronously), else the first non-internal IPv4
 * LAN address, or '127.0.0.1' as fallback. */
export function getLanIp(): string {
  const primary = defaultRouteIp();
  if (primary) return primary;

  const nets = networkInterfaces();

  // Sort interfaces: physical wired (en1, en2...) first, then en0, then other non-virtual, then virtual.
  const sortedNames = Object.keys(nets).sort((a, b) => {
    const isPhysA = /^(en|eth|wlan)\d+/i.test(a);
    const isPhysB = /^(en|eth|wlan)\d+/i.test(b);

    if (isPhysA && !isPhysB) return -1;
    if (!isPhysA && isPhysB) return 1;

    if (isPhysA && isPhysB) {
      // Prioritize en1, en2... over en0 for wired-first setups
      if (a === 'en0' && b !== 'en0') return 1;
      if (b === 'en0' && a !== 'en0') return -1;
      return a.localeCompare(b);
    }

    const isVirtA = /^(utun|bridge|vboxnet|docker|lo|gif|stf|awdl|llw|ap)\d*/i.test(a);
    const isVirtB = /^(utun|bridge|vboxnet|docker|lo|gif|stf|awdl|llw|ap)\d*/i.test(b);

    if (!isVirtA && isVirtB) return -1;
    if (isVirtA && !isVirtB) return 1;

    return a.localeCompare(b);
  });

  for (const name of sortedNames) {
    for (const net of nets[name] ?? []) {
      if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254.')) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}
