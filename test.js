import test from "ava";
import m from ".";

test("query spamhaus negative with timeout", async t => {
  t.deepEqual(await m.lookup("127.0.0.1", "zen.spamhaus.org", {timeout: 5000}), false);
});
test("query spamhaus positive with timeout", async t => {
  t.deepEqual(await m.lookup("127.0.0.2", "zen.spamhaus.org", {timeout: 5000}), true);
});
test("query spamhaus positive with timeout and TXT", async t => {
  const q = await m.lookup("127.0.0.2", "zen.spamhaus.org", {timeout: 5000, includeTxt: true});
  t.deepEqual(q, {
    result: true,
    txt: [
      ["https://www.spamhaus.org/sbl/query/SBL2"],
      ["https://www.spamhaus.org/query/ip/127.0.0.2"]
    ],
  });
});
test("query ipv6 positive", async t => {
  t.deepEqual(await m.lookup("::1", "v6.fullbogons.cymru.com"), true);
});
test("query ipv6 negative", async t => {
  t.deepEqual(await m.lookup("2001:db8::", "v6.fullbogons.cymru.com"), false);
});
test("server/port option", async t => {
  t.deepEqual(await m.lookup("127.0.0.1", "zen.spamhaus.org", {
    timeout: 5000,
    servers: ["8.8.8.8"],
    port: 53
  }), false);
});
test("batch spamhaus negative", async t => {
  const result = await m.batch(["127.0.0.1"], "zen.spamhaus.org");
  t.deepEqual(result[0].address, "127.0.0.1");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, false);
});
test("batch spamhaus positive", async t => {
  const result = await m.batch(["127.0.0.2"], "zen.spamhaus.org");
  t.deepEqual(result[0].address, "127.0.0.2");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, true);
});
test("batch multiple", async t => {
  const result = await m.batch(["127.0.0.1", "127.0.0.2"], ["zen.spamhaus.org"]);
  t.deepEqual(result[0].address, "127.0.0.1");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, false);
  t.deepEqual(result[1].address, "127.0.0.2");
  t.deepEqual(result[1].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[1].listed, true);
});
