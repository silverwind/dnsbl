# dnsbl
[![](https://img.shields.io/npm/v/dnsbl.svg?style=flat)](https://www.npmjs.org/package/dnsbl) [![](https://img.shields.io/npm/dm/dnsbl.svg)](https://www.npmjs.org/package/dnsbl) [![](https://api.travis-ci.org/silverwind/dnsbl.svg?style=flat)](https://travis-ci.org/silverwind/dnsbl)
> Query DNS-based blacklists

Support both IPv4 and IPv6 queries.

## Installation
```sh
$ npm install --save dnsbl
```

## Usage
```js
const dnsbl = require('dnsbl');

dnsbl.lookup('127.0.0.2', 'zen.spamhaus.org').then(function(listed) {
  console.log(listed);
  //=> true
});

dnsbl.batch(
  ['1.2.3.4', '5.6.7.8']
  ['dnsbl.somelist.net', 'dnsbl.someotherlist.net']
).then(function(err, results) {
  console.log(results);
  //=> [
  //=>   { blacklist: 'dnsbl.somelist.net', address: '1.2.3.4', listed: true  },
  //=>   { blacklist: 'dnsbl.somelist.net', address: '5.6.7.8', listed: false },
  //=>   { blacklist: 'dnsbl.someotherlist.net', address: '1.2.3.4', listed: true  },
  //=>   { blacklist: 'dnsbl.someotherlist.net', address: '5.6.7.8', listed: false }
  //=> ]
});
```

## API
### dnsbl.lookup(address, blacklist, [options])
- `address`: *string* an IP address.
- `blacklist`: *string* the hostname of the blacklist to query.

Returns a `Promise` that resolves to `true` or `false`, indicating if the address is listed (e.g. the DNS query returned a non-empty result). Will reject on error.

### dnsbl.batch(addresses, blacklists, [options])
- `addresses` *string* or *Array* - one or more IP addresses.
- `blacklists` *string* or *Array* - one or more blacklist hostnames.

Returns a `Promise` that resolve to a `results` object (see below).

### `options` object
- `server` *string* - the DNS server to use. Default: `'208.67.220.220'`.
- `port` *number* - the port to use. Default: `53`.
- `timeout` *number* - timout in milliseconds. Default: `10000`.

### `results` object
The results` object is an array of objects with these properies:
- `address` *string* - the IP address.
- `blacklist` *string* - the blacklist hostname.
- `listed` *boolean* - a boolean indicating if the address is listed on the blacklist.

© [silverwind](https://github.com/silverwind), distributed under BSD licence
