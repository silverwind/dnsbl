"use strict";

const {Resolver} = require("dns");
const ipPtr = require("ip-ptr");
const {promisify} = require("util");
const pMap = require("p-map");

const defaults = {
  timeout: 5000,
  servers: ["208.67.220.220"],
  concurrency: 64,
  includeTxt: false,
};

async function query(addr, blacklist, resolver, opts = {}) {
  const resolve4 = promisify(resolver.resolve4.bind(resolver));
  const resolveTxt = promisify(resolver.resolveTxt.bind(resolver));
  const name = ipPtr(addr).replace(/\.i.+/, "") + "." + blacklist;

  const timeout = setTimeout(() => {
    resolver.cancel();
    return opts.includeTxt ? {listed: false, txt: []} : false;
  }, opts.timeout);

  try {
    const [addrs, txt] = await Promise.all([
      resolve4(name),
      opts.includeTxt && resolveTxt(name),
    ]);

    clearTimeout(timeout);

    const listed = Boolean(addrs.length);
    return opts.includeTxt ? {listed, txt} : listed;
  } catch (err) {
    return opts.includeTxt ? {listed: false, txt: []} : false;
  }
}

module.exports.lookup = async (addr, blacklist, opts = {}) => {
  opts = Object.assign({}, defaults, opts);
  const resolver = new Resolver();
  resolver.setServers(Array.isArray(opts.servers) ? opts.servers : [opts.servers]);

  const result = await query(addr, blacklist, resolver, opts);
  return result;
};

module.exports.batch = async (addrs, lists, opts = {}) => {
  opts = Object.assign({}, defaults, opts);

  const items = [];
  (Array.isArray(addrs) ? addrs : [addrs]).forEach(address => {
    (Array.isArray(lists) ? lists : [lists]).forEach(blacklist => {
      const resolver = new Resolver();
      resolver.setServers(Array.isArray(opts.servers) ? opts.servers : [opts.servers]);
      items.push({blacklist, address, resolver});
    });
  });

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
};
