#!/usr/bin/env node
"use strict";

const dns = require("dns-socket");
const async = require("async");
const ptr = require("ip-ptr");
const socket = dns({timeout: 5000});

function queryFactory(ip, blacklist) {
  return function query() {
    return new Promise(function(resolve) {
      socket.query({
        questions: [{
          type: "A",
          name: ptr(ip, {suffix: false}) + "." + blacklist,
        }]
      }, 53, "208.67.220.220", function(_err, res) {
        resolve(Boolean(res.answers.length));
      });
    });
  };
}

module.exports.lookup = function lookup(addr, blacklist) {
  return queryFactory(addr, blacklist)();
};

module.exports.batch = function batch(addrs, lists) {
  return new Promise(function(resolve) {
    var todo = [];
    (Array.isArray(addrs)  ? addrs  : [addrs]).forEach(function(address) {
      (Array.isArray(lists) ? lists : [lists]).forEach(function(blacklist) {
        todo.push({
          blacklist: blacklist,
          address: address,
          query: queryFactory(address, blacklist)
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
      resolve(results);
    });
  });
};
