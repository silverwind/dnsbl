import {lookup, batch, type BatchTxtResult} from "./index.ts";
import type {Resolver} from "node:dns/promises";

const zen = "zen.spamhaus.org";
const v6 = "v6.fullbogons.cymru.com";

const spamhausTxt = [
  ["Listed by SBL, see https://check.spamhaus.org/sbl/query/SBL2"],
  ["Listed by PBL, see https://check.spamhaus.org/query/ip/127.0.0.2"],
  ["Listed by XBL, see https://check.spamhaus.org/query/ip/127.0.0.2"],
];

const zone: Record<string, Array<Array<string>>> = {
  [`2.0.0.127.${zen}`]: spamhausTxt,
  [`1${".0".repeat(31)}.${v6}`]: [],
};

const resolver = {
  cancel() {},
  resolve4: async (name: string) => name in zone ? ["127.0.0.2"] : Promise.reject(new Error(`ENOTFOUND ${name}`)),
  resolveTxt: async (name: string) => zone[name]?.length ? zone[name] : Promise.reject(new Error(`ENODATA ${name}`)),
} as unknown as Resolver;

test.each([
  ["127.0.0.1", zen, {}, false],
  ["127.0.0.2", zen, {}, true],
  ["127.0.0.2", zen, {includeTxt: true}, {listed: true, txt: spamhausTxt}],
  ["::1", v6, {}, true],
  ["::1", v6, {includeTxt: true}, {listed: true, txt: []}],
  ["2002:db8::", v6, {}, false],
  ["127.0.0.1", zen, {servers: ["8.8.8.8"]}, false],
])("lookup %s on %s with %j", async (addr, blacklist, opts, expected) => {
  expect(await lookup(addr, blacklist, {resolver, ...opts})).toEqual(expected);
});

test.each([
  [["127.0.0.1"], zen, [{address: "127.0.0.1", blacklist: zen, listed: false}]],
  [["127.0.0.2"], zen, [{address: "127.0.0.2", blacklist: zen, listed: true}]],
  [["127.0.0.1", "127.0.0.2"], [zen], [
    {address: "127.0.0.1", blacklist: zen, listed: false},
    {address: "127.0.0.2", blacklist: zen, listed: true},
  ]],
])("batch %j on %j", async (addrs, lists, expected) => {
  expect(await batch(addrs, lists, {resolver})).toEqual(expected);
});

test("batch with txt", async () => {
  expect(await batch(["127.0.0.2"], zen, {resolver, includeTxt: true}) satisfies Array<BatchTxtResult>).toEqual([
    {address: "127.0.0.2", blacklist: zen, listed: true, txt: spamhausTxt},
  ]);
});
