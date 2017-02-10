import test from "ava";
import m from ".";

test("query spamhaus negative with timeout", async function(t) {
  t.deepEqual(await m.lookup("127.0.0.1", "zen.spamhaus.org", {timeout: 5000}), false);
});
test("query spamhaus positive with timeout", async function(t) {
  t.deepEqual(await m.lookup("127.0.0.2", "zen.spamhaus.org", {timeout: 5000}), true);
});
test("server/port option", async function(t) {
  t.deepEqual(await m.lookup("127.0.0.1", "zen.spamhaus.org", {
    timeout: 5000,
    server: "8.8.8.8",
    port: 53
  }), false);
});
test("batch spamhaus negative", async function(t) {
  const result = await m.batch(["127.0.0.1"], "zen.spamhaus.org");
  t.deepEqual(result[0].address, "127.0.0.1");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, false);
});
test("batch spamhaus positive", async function(t) {
  const result = await m.batch(["127.0.0.2"], "zen.spamhaus.org");
  t.deepEqual(result[0].address, "127.0.0.2");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, true);
});
test("batch multiple", async function(t) {
  const result = await m.batch(["127.0.0.1", "127.0.0.2"], ["zen.spamhaus.org"]);
  t.deepEqual(result[0].address, "127.0.0.1");
  t.deepEqual(result[0].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[0].listed, false);
  t.deepEqual(result[1].address, "127.0.0.2");
  t.deepEqual(result[1].blacklist, "zen.spamhaus.org");
  t.deepEqual(result[1].listed, true);
});
