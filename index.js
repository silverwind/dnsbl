#!/usr/bin/env node
"use strict";

const dns = require("dns-socket");
const async = require("async");
const ptr = require("ip-ptr");

const defaults = {
  timeout: 10000,
  server: "208.67.220.220",
  port: 53,
};

function queryFactory(ip, blacklist, socket, opts) {
  return function query() {
    return new Promise(function(resolve, reject) {
      socket.on("error", e => {
        reject(e);
      });
      socket.query({
        questions: [{
          type: "A",
          name: ptr(ip, {suffix: false}) + "." + blacklist,
        }]
      }, opts.port, opts.server, function(err, res) {
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

  return new Promise(resolve => {
    const todo = [];
    (Array.isArray(addrs) ? addrs : [addrs]).forEach(address => {
      (Array.isArray(lists) ? lists : [lists]).forEach(blacklist => {
        todo.push({
          blacklist: blacklist,
          address: address,
          query: queryFactory(address, blacklist, socket, opts)
        });
      });
    });
    async.map(todo, (item, cb) => {
      item.query().then(listed => {
        item.listed = listed;
        delete item.query;
        cb(null, item);
      });
    }, (_, results) => {
      socket.destroy();
      resolve(results);
    });
  });
};
