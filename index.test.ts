import {lookup, batch} from "./index.ts";
import ipPtr from "ip-ptr";
import type {Resolver} from "node:dns/promises";

// the reverse-DNS label dnsbl queries: reversed IP + blacklist, sans the .arpa suffix ip-ptr adds.
const qname = (addr: string, blacklist: string) => `${ipPtr(addr).replace(/\.i.+/, "")}.${blacklist}`;

const spamhausTxt = [
  ["Listed by SBL, see https://check.spamhaus.org/sbl/query/SBL2"],
  ["Listed by PBL, see https://check.spamhaus.org/query/ip/127.0.0.2"],
  ["Listed by XBL, see https://check.spamhaus.org/query/ip/127.0.0.2"],
];

// names present here are listed; resolve4 rejects (NXDOMAIN) for anything else.
const zone: Record<string, Array<Array<string>>> = {
  [qname("127.0.0.2", "zen.spamhaus.org")]: spamhausTxt,
  [qname("::1", "v6.fullbogons.cymru.com")]: [],
};

const resolver = {
  cancel() {},
  resolve4(name: string) {
    // any non-empty answer marks the IP listed, content is unused (127.0.0.2 is the DNSBL convention)
    if (name in zone) return Promise.resolve(["127.0.0.2"]);
    return Promise.reject(new Error(`ENOTFOUND ${name}`));
  },
  resolveTxt(name: string) {
    return Promise.resolve(zone[name] ?? []);
  },
} as unknown as Resolver;

test("query spamhaus negative", async () => {
  expect(await lookup("127.0.0.1", "zen.spamhaus.org", {resolver})).toEqual(false);
});

test("query spamhaus positive", async () => {
  expect(await lookup("127.0.0.2", "zen.spamhaus.org", {resolver})).toEqual(true);
});

test("query spamhaus positive with TXT", async () => {
  expect(await lookup("127.0.0.2", "zen.spamhaus.org", {resolver, includeTxt: true})).toEqual({
    listed: true,
    txt: spamhausTxt,
  });
});

test("query ipv6 positive", async () => {
  expect(await lookup("::1", "v6.fullbogons.cymru.com", {resolver})).toEqual(true);
});

test("query ipv6 negative", async () => {
  expect(await lookup("2002:db8::", "v6.fullbogons.cymru.com", {resolver})).toEqual(false);
});

test("server option", async () => {
  expect(await lookup("127.0.0.1", "zen.spamhaus.org", {resolver, servers: ["8.8.8.8"]})).toEqual(false);
});

test("batch spamhaus negative", async () => {
  const result = await batch(["127.0.0.1"], "zen.spamhaus.org", {resolver});
  expect(result[0].address).toEqual("127.0.0.1");
  expect(result[0].blacklist).toEqual("zen.spamhaus.org");
  expect(result[0].listed).toEqual(false);
});

test("batch spamhaus positive", async () => {
  const result = await batch(["127.0.0.2"], "zen.spamhaus.org", {resolver});
  expect(result[0].address).toEqual("127.0.0.2");
  expect(result[0].blacklist).toEqual("zen.spamhaus.org");
  expect(result[0].listed).toEqual(true);
});

test("batch spamhaus positive with txt", async () => {
  const result = await batch(["127.0.0.2"], "zen.spamhaus.org", {resolver, includeTxt: true});
  expect(result[0].address).toEqual("127.0.0.2");
  expect(result[0].blacklist).toEqual("zen.spamhaus.org");
  expect(result[0].listed).toEqual(true);
  expect(result[0].txt).toEqual(spamhausTxt);
});

test("batch multiple", async () => {
  const result = await batch(["127.0.0.1", "127.0.0.2"], ["zen.spamhaus.org"], {resolver});
  expect(result[0].address).toEqual("127.0.0.1");
  expect(result[0].blacklist).toEqual("zen.spamhaus.org");
  expect(result[0].listed).toEqual(false);
  expect(result[1].address).toEqual("127.0.0.2");
  expect(result[1].blacklist).toEqual("zen.spamhaus.org");
  expect(result[1].listed).toEqual(true);
});
