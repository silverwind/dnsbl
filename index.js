"use strict";

const {Resolver} = require("dns");
const ptr = require("ip-ptr");
const util = require("util");

const defaults = {
  timeout: 10000,
  servers: ["208.67.220.220"],
};

async function query(addr, blacklist, resolver, opts) {
  const resolve4 = util.promisify(resolver.resolve4.bind(resolver));
  const name = ptr(addr, {suffix: false}) + "." + blacklist;

  const timeout = setTimeout(() => {
    resolver.cancel();
    return false;
  }, opts.timeout);

  try {
    const addrs = await resolve4(name);
    clearTimeout(timeout);
    return Boolean(addrs.length);
  } catch (err) {
    return false;
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

  const results = await Promise.all(items.map(item => query(item.address, item.blacklist, item.resolver, opts)));

  return items.map((item, i) => {
    item.listed = results[i];
    delete item.resolver;
    return item;
  });
};
