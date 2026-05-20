import {Resolver} from "node:dns/promises";
import ipPtr from "ip-ptr";
import pMap from "p-map";

/** Options for `lookup` and `batch`. */
export type Opts = {
  /** DNS servers to use. Pass a falsy value to use the system resolvers. Default: OpenDNS servers. */
  servers?: string | Array<string>,
  /** Timeout in milliseconds. Default: `5000`. */
  timeout?: number,
  /** Number of concurrent queries. Default: `64`. */
  concurrency?: number,
  /** Include TXT records if the address is blacklisted. Default: `false`. */
  includeTxt?: boolean,
  /** Custom resolver to use instead of creating one per query. Reused across all `batch` queries when set. */
  resolver?: Resolver,
  /** Accepted for backwards compatibility, currently unused. */
  port?: number,
};

/** Result of `lookup` when `includeTxt` is set. */
export type TxtResult = {
  /** Whether the address is listed on the blacklist. */
  listed: boolean,
  /** Resolved TXT records for the address. */
  txt: Array<Array<string>>,
};

/** A `batch` result entry. */
export type BatchResult = {
  /** The IP address. */
  address: string,
  /** The blacklist hostname. */
  blacklist: string,
  /** Whether the address is listed on the blacklist. */
  listed: boolean,
};

/** A `batch` result entry when `includeTxt` is set. */
export type BatchTxtResult = BatchResult & {
  /** Resolved TXT records for the address. */
  txt: Array<Array<string>>,
};

// using OpenDNS because popular resolvers could be rate-limited by the
// blacklist providers, spamhaus being the prime example.
const defaults = {
  timeout: 5000,
  servers: [
    "208.67.220.220",
    "208.67.222.222",
    "2620:119:35::35",
    "2620:119:53::53",
  ],
  concurrency: 64,
  includeTxt: false,
} satisfies Opts;

function toArray<T>(value: T | Array<T>): Array<T> {
  return Array.isArray(value) ? value : [value];
}

// without an injected resolver, use a fresh one per query so a timeout's cancel() aborts only that query, not its siblings.
function getResolver(opts: Opts): Resolver {
  if (opts.resolver) return opts.resolver;
  const resolver = new Resolver();
  if (opts.servers) resolver.setServers(toArray(opts.servers));
  return resolver;
}

async function query(addr: string, blacklist: string, opts: Opts): Promise<boolean | TxtResult> {
  // ipPtr appends .in-addr.arpa / .ip6.arpa, strip it to get the DNSBL query label
  const name = `${ipPtr(addr).replace(/\.i.+/, "")}.${blacklist}`;
  const resolver = getResolver(opts);
  const timeout = setTimeout(() => resolver.cancel(), opts.timeout);

  try {
    const [addrs, txt] = await Promise.all([
      resolver.resolve4(name),
      opts.includeTxt ? resolver.resolveTxt(name) : Promise.resolve<Array<Array<string>>>([]),
    ]);
    const listed = Boolean(addrs.length);
    return opts.includeTxt ? {listed, txt} : listed;
  } catch {
    return opts.includeTxt ? {listed: false, txt: []} : false;
  } finally {
    clearTimeout(timeout);
  }
}

export function lookup(addr: string, blacklist: string, opts?: Opts & {includeTxt?: false}): Promise<boolean>;
export function lookup(addr: string, blacklist: string, opts: Opts & {includeTxt: true}): Promise<TxtResult>;
export async function lookup(addr: string, blacklist: string, opts: Opts = {}): Promise<boolean | TxtResult> {
  return query(addr, blacklist, {...defaults, ...opts});
}

export function batch(addrs: string | Array<string>, lists: string | Array<string>, opts?: Opts & {includeTxt?: false}): Promise<Array<BatchResult>>;
export function batch(addrs: string | Array<string>, lists: string | Array<string>, opts: Opts & {includeTxt: true}): Promise<Array<BatchTxtResult>>;
export async function batch(addrs: string | Array<string>, lists: string | Array<string>, opts: Opts = {}): Promise<Array<BatchResult | BatchTxtResult>> {
  const merged = {...defaults, ...opts};

  const items: Array<{address: string, blacklist: string}> = [];
  const addresses = toArray(addrs);
  const blacklists = toArray(lists);
  for (const address of addresses) {
    for (const blacklist of blacklists) {
      items.push({address, blacklist});
    }
  }

  const results = await pMap(items, item => query(item.address, item.blacklist, merged), {concurrency: merged.concurrency});

  return items.map(({address, blacklist}, i) => {
    const result = results[i];
    if (merged.includeTxt) {
      const {listed, txt} = result as TxtResult;
      return {address, blacklist, listed, txt};
    }
    return {address, blacklist, listed: result as boolean};
  });
}
