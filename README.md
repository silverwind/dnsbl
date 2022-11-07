# dnsbl
[![](https://img.shields.io/npm/v/dnsbl.svg?style=flat)](https://www.npmjs.org/package/dnsbl) [![](https://img.shields.io/npm/dm/dnsbl.svg)](https://www.npmjs.org/package/dnsbl) [![](https://packagephobia.com/badge?p=dnsbl)](https://packagephobia.com/result?p=dnsbl)
> Query DNS-based blackhole lists

Support both IPv4 and IPv6 queries.

## Installation
```sh
$ npm i dnsbl
```

## Usage
```js
import {lookup, batch} from 'dnsbl';

await lookup('127.0.0.2', 'zen.spamhaus.org');
// true

await lookup('127.0.0.2', 'zen.spamhaus.org', {includeTxt: true});
// {
//   listed: true,
//   txt: [['some txt'], ['another txt']]
// }

await batch(['1.2.3.4', '5.6.7.8'], ['dnsbl.somelist.net', 'dnsbl.someotherlist.net']);
// [
//   { blacklist: 'dnsbl.somelist.net', address: '1.2.3.4', listed: true },
//   { blacklist: 'dnsbl.somelist.net', address: '5.6.7.8', listed: false },
//   { blacklist: 'dnsbl.someotherlist.net', address: '1.2.3.4', listed: true },
//   { blacklist: 'dnsbl.someotherlist.net', address: '5.6.7.8', listed: false }
// ]
```

## API
### lookup(address, blacklist, [options])
- `address`: *string* an IP address.
- `blacklist`: *string* the hostname of the blacklist to query.

Returns a `Promise` that resolves to `true` or `false`, indicating if the address is listed (e.g. the DNS query returned a non-empty result). Will reject on error.

If the `includeTxt` option is set, it will return an `Object` with these properties:
- `listed` *boolean* - a boolean indicating if the address is listed on the blacklist.
- `txt` *string[]* - an array of resolved TXT records for the address.

### batch(addresses, blacklists, [options])
- `addresses` *string* or *Array* - one or more IP addresses.
- `blacklists` *string* or *Array* - one or more blacklist hostnames.

Returns a `Promise` that resolve to a `results` object (see below).

### `options` object
- `servers` *string* or *Array* - DNS servers to use. Default: `['208.67.220.220', '208.67.222.222', '2620:119:35::35', '2620:119:53::53']`.
- `timeout` *number* - timout in milliseconds. Default: `5000`.
- `concurrency` *number* - number of concurrent queries. Default: `64`.
- `includeTxt` *boolean* - include txt records if IP is blacklisted. Default: `false`.

### `results` object
The `results` object is an array of objects with these properies:
- `address` *string* - the IP address.
- `blacklist` *string* - the blacklist hostname.
- `listed` *boolean* - a boolean indicating if the address is listed on the blacklist.
- `txt` *string[]* - an array of resolved TXT records for the address.

© [silverwind](https://github.com/silverwind), distributed under BSD licence
