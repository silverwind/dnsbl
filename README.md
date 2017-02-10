# dnsbl
[![](https://img.shields.io/npm/v/dnsbl.svg?style=flat)](https://www.npmjs.org/package/dnsbl) [![](https://img.shields.io/npm/dm/dnsbl.svg)](https://www.npmjs.org/package/dnsbl) [![](https://api.travis-ci.org/silverwind/dnsbl.svg?style=flat)](https://travis-ci.org/silverwind/dnsbl)
> Query DNS-based blackhole lists

## Installation
```sh
$ npm install --save dnsbl
```

## Usage
### Single Query
```js
var dnsbl = require("dnsbl");

dnsbl.lookup("127.0.0.2", "zen.spamhaus.org").then(function(listed) {
    console.log(listed);
    //=> true
});
```
### Batch Query
```js
var ips   = ["1.2.3.4", "5.6.7.8"];
var lists = ["dnsbl.somelist.net", "dnsbl.someotherlist.net"];

dnsbl.batch(ips, lists).then(function(err, results) {
    console.log(results);
    //=> [
    //=>   { blacklist: "dnsbl-1.somelist.net", address: "1.2.3.4", listed: true  },
    //=>   { blacklist: "dnsbl-2.somelist.net", address: "5.6.7.8", listed: false }
    //=> ]
});
```

## API
### dnsbl.lookup(address, blacklist, options)
- `address`: *string* an IPv4 address to lookup.
- `blacklist`: *string* a DNS suffix to use.

Returns a promise that resolves to `true` or `false`, indicating if the address is listed on the list.

### dnsbl.batch(addresses, blacklists, options)
- `addresses` *string* or *Array* - one or more IPv4 addresses to lookup.
- `blacklists` *string* or *Array* - one or more DNSBL addresses to use.

Returns a promise that resolve to a result object (see below).

### `options` object
- `server` *string* - the DNS server to use. Default: `'208.67.220.220'`.
- `port` *number* - the port to use. Default: `53`.
- `timeout` *number* - timout in milliseconds. Default: `10000`.

### `results` object
The results` object is an array of objects with these properies:
- `address` *string* - the IPv4 address looked up.
- `blacklist` *string* - the DNSBL address looked up.
- `listed` *boolean* -  a boolean indicating if the address is listed on the blacklist.

© [silverwind](https://github.com/silverwind), distributed under BSD licence
