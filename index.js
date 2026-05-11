import {Resolver} from "node:dns/promises";
import ipPtr from "ip-ptr";
import pMap from "p-map";

// using dns.opendns.com because popuplar resolvers could be rate-limited by the
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
};

export async function query(addr, blacklist, resolver, opts = {}) {
  const name = `${ipPtr(addr).replace(/\.i.+/, "")}.${blacklist}`;

  const timeout = setTimeout(() => {
    resolver.cancel();
    return opts.includeTxt ? {listed: false, txt: []} : false;
  }, opts.timeout);

  try {
    const [addrs, txt] = await Promise.all([
      resolver.resolve4(name),
      opts.includeTxt && resolver.resolveTxt(name),
    ]);

    clearTimeout(timeout);

    const listed = Boolean(addrs.length);
    return opts.includeTxt ? {listed, txt} : listed;
  } catch {
    return opts.includeTxt ? {listed: false, txt: []} : false;
  }
}

export async function lookup(addr, blacklist, opts = {}) {
  opts = {...defaults, ...opts};
  const resolver = new Resolver();
  if (opts.servers) {
    resolver.setServers(Array.isArray(opts.servers) ? opts.servers : [opts.servers]);
  }
  return query(addr, blacklist, resolver, opts);
}

export async function batch(addrs, lists, opts = {}) {
  opts = {...defaults, ...opts};

  const resolver = new Resolver();
  if (opts.servers) {
    resolver.setServers(Array.isArray(opts.servers) ? opts.servers : [opts.servers]);
  }

  const items = [];
  for (const address of (Array.isArray(addrs) ? addrs : [addrs])) {
    for (const blacklist of (Array.isArray(lists) ? lists : [lists])) {
      items.push({blacklist, address, resolver});
    }
  }

  const results = await pMap(items, item => {
    return query(item.address, item.blacklist, item.resolver, opts);
  }, {concurrency: opts.concurrency});

  return items.map((item, i) => {
    if (opts.includeTxt) {
      item.listed = results[i].listed;
      item.txt = results[i].txt;
    } else {
      item.listed = results[i];
    }
    delete item.resolver;
    return item;
  });
}
