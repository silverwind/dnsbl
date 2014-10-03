#!/usr/bin/env node
"use strict";

var dnsbl = {},
    dns   = require("dns"),
    async = require("async");

function query(address, blacklist) {
    return function isListed(cb) {
        dns.resolve(address.split(".").reverse().join(".") + "." + blacklist, "A", function(err) {
            cb(null, err ? false : true);
        });
    };
}

dnsbl.lookup = function lookup(address, blacklist, callback) {
    query(address, blacklist)(callback);
}

dnsbl.batch = function batch(addresses, blacklists, callback) {
    var todo = [];

    addresses  = Array.isArray(addresses)  ? addresses  : [addresses];
    blacklists = Array.isArray(blacklists) ? blacklists : [blacklists];

    addresses.forEach(function (address) {
        blacklists.forEach(function (blacklist) {
            todo.push({
                blacklist : blacklist,
                address   : address,
                query     : query(address, blacklist)
            });
        });
    });

    async.map(todo, function(item, cb) {
        item.query(function (err, listed) {
            item.listed = listed;
            delete item.query;
            cb(null, item);
        });
    }, function(err, results) {
        callback(null, results);
    });
};

module.exports = dnsbl;
