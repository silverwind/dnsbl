"use strict";

const dns = require("dns-socket");
const ptr = require("ip-ptr");

const defaults = {
  timeout: 1000,
  server: "208.67.220.220",
  port: 53,
};

function queryFactory(ip, blacklist, socket, opts) {
  return function query() {
    return new Promise((resolve, reject) => {
      socket.on("error", e => {
        reject(e);
      });
      socket.query({
        questions: [{
          type: "A",
          name: ptr(ip, {suffix: false}) + "." + blacklist,
        }]
      }, opts.port, opts.server, (err, res) => {
        if (err) return reject(err);
        if (!res) return resolve(false);
        resolve(Boolean(res.answers.length));
      });
    });
  };
}

module.exports.lookup = (addr, blacklist, opts) => {
  opts = Object.assign({}, defaults, opts);
  const socket = dns({timeout: opts.timeout});

  return queryFactory(addr, blacklist, socket, opts)().then(result => {
    socket.destroy();
    return result;
  });
};

module.exports.batch = (addrs, lists, opts) => {
  opts = Object.assign({}, defaults, opts);
  const socket = dns({timeout: opts.timeout});
  const items = [];

  (Array.isArray(addrs) ? addrs : [addrs]).forEach(address => {
    (Array.isArray(lists) ? lists : [lists]).forEach(blacklist => {
      items.push({
        blacklist: blacklist,
        address: address,
        query: queryFactory(address, blacklist, socket, opts)
      });
    });
  });

  return Promise.all(items.map(item => item.query())).then(results => {
    socket.destroy();
    return items.map((item, i) => {
      item.listed = results[i];
      delete item.query;
      return item;
    });
  });
};
