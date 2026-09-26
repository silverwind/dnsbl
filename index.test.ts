import {lookup, batch, type BatchTxtResult} from "./index.ts";
import ipPtr from "ip-ptr";
import type {Resolver} from "node:dns/promises";

const qname = (addr: string, blacklist: string) => `${ipPtr(addr).replace(/\.i.+/, "")}.${blacklist}`;

const spamhausTxt = [
  ["Listed by SBL, see https://check.spamhaus.org/sbl/query/SBL2"],
  ["Listed by PBL, see https://check.spamhaus.org/query/ip/127.0.0.2"],
  ["Listed by XBL, see https://check.spamhaus.org/query/ip/127.0.0.2"],
];

const zone: Record<string, Array<Array<string>>> = {
  [qname("127.0.0.2", "zen.spamhaus.org")]: spamhausTxt,
  [qname("::1", "v6.fullbogons.cymru.com")]: [],
};

const resolver = {
  cancel() {},
  resolve4(name: string) {
    if (name in zone) return Promise.resolve(["127.0.0.2"]);
    return Promise.reject(new Error(`ENOTFOUND ${name}`));
  },
  resolveTxt(name: string) {
    if (zone[name]?.length) return Promise.resolve(zone[name]);
    return Promise.reject(new Error(`ENODATA ${name}`));
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

test("query ipv6 positive without TXT records", async () => {
  expect(await lookup("::1", "v6.fullbogons.cymru.com", {resolver})).toEqual(true);
  expect(await lookup("::1", "v6.fullbogons.cymru.com", {resolver, includeTxt: true})).toEqual({listed: true, txt: []});
});

test("query ipv6 negative", async () => {
  expect(await lookup("2002:db8::", "v6.fullbogons.cymru.com", {resolver})).toEqual(false);
});

test("server option", async () => {
  expect(await lookup("127.0.0.1", "zen.spamhaus.org", {resolver, servers: ["8.8.8.8"]})).toEqual(false);
});

test("batch spamhaus negative", async () => {
  expect(await batch(["127.0.0.1"], "zen.spamhaus.org", {resolver})).toEqual([
    {address: "127.0.0.1", blacklist: "zen.spamhaus.org", listed: false},
  ]);
});

test("batch spamhaus positive", async () => {
  expect(await batch(["127.0.0.2"], "zen.spamhaus.org", {resolver})).toEqual([
    {address: "127.0.0.2", blacklist: "zen.spamhaus.org", listed: true},
  ]);
});

test("batch spamhaus positive with txt", async () => {
  const result: Array<BatchTxtResult> = await batch(["127.0.0.2"], "zen.spamhaus.org", {resolver, includeTxt: true});
  expect(result).toEqual([
    {address: "127.0.0.2", blacklist: "zen.spamhaus.org", listed: true, txt: spamhausTxt},
  ]);
});

test("batch multiple", async () => {
  expect(await batch(["127.0.0.1", "127.0.0.2"], ["zen.spamhaus.org"], {resolver})).toEqual([
    {address: "127.0.0.1", blacklist: "zen.spamhaus.org", listed: false},
    {address: "127.0.0.2", blacklist: "zen.spamhaus.org", listed: true},
  ]);
});
