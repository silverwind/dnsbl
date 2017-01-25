# dnsbl
[![](https://img.shields.io/npm/v/dnsbl.svg?style=flat)](https://www.npmjs.org/package/dnsbl) [![](https://img.shields.io/npm/dm/dnsbl.svg)](https://www.npmjs.org/package/dnsbl) [![](https://api.travis-ci.org/silverwind/dnsbl.svg?style=flat)](https://travis-ci.org/silverwind/dnsbl)
> Query DNS-based blackhole lists

## Installation
```bash
npm install --save dnsbl
```

## Usage
### Single Query
```js
var dnsbl = require("dnsbl");

dnsbl.lookup("1.2.3.4", "dnsbl.somelist.net", function(err, listed) {
    console.log(listed);
    // -> true / false
});
```
### Batch Query
```js
var ips   = ["1.2.3.4", "5.6.7.8"];
var lists = ["dnsbl-1.somelist.net", "dnsbl-2.somelist.net"];

dnsbl.batch(ips, lists, function(err, results) {
    console.log(results);
    // -> [
    // ->     { blacklist: "dnsbl-1.somelist.net", address: "1.2.3.4", listed: true  },
    // ->     { blacklist: "dnsbl-2.somelist.net", address: "5.6.7.8", listed: false }
    // -> ]
});
```

## API
### dnsbl.lookup(address, blacklist, callback)
- `address`: *string* an IPv4 address to lookup.
- `blacklist`: *string* an DNSBL address to use.
- `callback`: *function* receives `err` and `listed`, a boolean value indicating if the address is listed on the blacklist.

### dnsbl.batch(addresses, blacklists, callback)
- `addresses`: *string* or *array* one or more IPv4 addresses to lookup.
- `blacklists`: *string* or *array* one or more DNSBL addresses to use.
- `callback`: *function* receives `err` *Error* (*null* if none) and an `results` *object*.

### results object
The results object is an array of objects with these properies:
- `address`: *string* the IPv4 address looked up.
- `blacklist`: *string* the DNSBL address looked up.
- `listed`: *boolean* a boolean indicating if the address is listed on the blacklist.

© 2014-2015 [silverwind](https://github.com/silverwind), distributed under BSD licence
