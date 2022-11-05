import test from "ava";
import m from "../src/index.mjs";

test("[mjs] query spamhaus negative with timeout", async t => {
  t.deepEqual(await m.lookup("127.0.0.1", "zen.spamhaus.org", {timeout: 5000}), false);
});
test("[mjs] query spamhaus positive with timeout", async t => {
  t.deepEqual(await m.lookup("127.0.0.2", "zen.spamhaus.org", {timeout: 5000}), true);
});
test("[mjs] query spamhaus positive with timeout and TXT", async t => {
  const q = await m.lookup("127.0.0.2", "zen.spamhaus.org", {timeout: 5000, includeTxt: true});
  t.deepEqual(q, {
    listed: true,
    txt: [
      ["https://www.spamhaus.org/sbl/query/SBL2"],
      ["https://www.spamhaus.org/query/ip/127.0.0.2"]
    ],
  });
});
test("[mjs] query ipv6 positive", async t => {
  t.deepEqual(await m.lookup("::1", "v6.fullbogons.cymru.com"), true);
});
test("[mjs] query ipv6 negative", async t => {
  // need a valid fqdn ?
  t.deepEqual(await m.lookup("2001:db8::", "v6.fullbogons.cymru.com"), false);
});
test("[mjs] query server/port option", async t => {
  t.deepEqual(await m.lookup("127.0.0.1", "zen.spamhaus.org", {
    timeout: 5000,
    servers: ["8.8.8.8","1.1.1.1"],
    port: 53
  }), false);
});
test("[mjs] batch spamhaus negative", async t => {
  const result = await m.batch(["127.0.0.1"], "zen.spamhaus.org");
  t.deepEqual(result[0].address, "127.0.0.1");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, false);
});
test("[mjs] batch spamhaus positive", async t => {
  const result = await m.batch(["127.0.0.2"], "zen.spamhaus.org");
  t.deepEqual(result[0].address, "127.0.0.2");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, true);
});
test("[mjs] batch spamhaus positive with txt", async t => {
  const result = await m.batch(["127.0.0.2"], "zen.spamhaus.org", {includeTxt: true});
  t.deepEqual(result[0].address, "127.0.0.2");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, true);
  t.deepEqual(result[0].txt, [
    ["https://www.spamhaus.org/sbl/query/SBL2"],
    ["https://www.spamhaus.org/query/ip/127.0.0.2"]
  ]);
});
test("[mjs] batch multiple", async t => {
  const result = await m.batch(["127.0.0.1", "127.0.0.2"], ["zen.spamhaus.org"]);
  t.deepEqual(result[0].address, "127.0.0.1");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, false);
  t.deepEqual(result[1].address, "127.0.0.2");
  t.deepEqual(result[1].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[1].listed, true);
});
