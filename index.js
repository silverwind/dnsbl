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
      }, opts.port, opts.server, function(_err, res) {
        if (_err) return reject(_err);
        if (!res) return resolve(false);
        resolve(Boolean(res.answers.length));
      });
    });
  };
}

module.exports.lookup = function lookup(addr, blacklist, opts) {
  opts = Object.assign({}, defaults, opts);
  const socket = dns({timeout: opts.timeout});

  return queryFactory(addr, blacklist, socket, opts)().then(function(result) {
    socket.destroy();
    return result;
  });
};

module.exports.batch = function batch(addrs, lists, opts) {
  opts = Object.assign({}, defaults, opts);
  const socket = dns({timeout: opts.timeout});

  return new Promise(function(resolve) {
    const todo = [];
    (Array.isArray(addrs) ? addrs : [addrs]).forEach(function(address) {
      (Array.isArray(lists) ? lists : [lists]).forEach(function(blacklist) {
        todo.push({
          blacklist: blacklist,
          address: address,
          query: queryFactory(address, blacklist, socket, opts)
        });
      });
    });
    async.map(todo, function(item, cb) {
      item.query().then(function(listed) {
        item.listed = listed;
        delete item.query;
        cb(null, item);
      });
    }, function(_, results) {
      socket.destroy();
      resolve(results);
    });
  });
};
