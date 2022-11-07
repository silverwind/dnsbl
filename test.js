import {lookup, batch} from "./index.js";

test("query spamhaus negative with timeout", async () => {
  expect(await lookup("127.0.0.1", "zen.spamhaus.org", {timeout: 5000})).toEqual(false);
});

test("query spamhaus positive with timeout", async () => {
  expect(await lookup("127.0.0.2", "zen.spamhaus.org", {timeout: 5000})).toEqual(true);
});

test("query spamhaus positive with timeout and TXT", async () => {
  const q = await lookup("127.0.0.2", "zen.spamhaus.org", {timeout: 5000, includeTxt: true});
  expect(q, {
    listed: true,
    txt: [
      ["https://www.spamhaus.org/sbl/query/SBL2"],
      ["https://www.spamhaus.org/query/ip/127.0.0.2"]
    ],
  });
});

test("query ipv6 positive", async () => {
  expect(await lookup("::1", "v6.fullbogons.cymru.com")).toEqual(true);
});

test("query ipv6 negative", async () => {
  expect(await lookup("2002:db8::", "v6.fullbogons.cymru.com")).toEqual(false);
});

test("server/port option", async () => {
  expect(await lookup("127.0.0.1", "zen.spamhaus.org", {
    timeout: 5000,
    servers: ["8.8.8.8"],
    port: 53
  })).toEqual(false);
});

test("batch spamhaus negative", async () => {
  const result = await batch(["127.0.0.1"], "zen.spamhaus.org");
  expect(result[0].address, "127.0.0.1");
  expect(result[0].blacklist, "zen.spamhaus.org");
  expect(result[0].listed).toEqual(false);
});

test("batch spamhaus positive", async () => {
  const result = await batch(["127.0.0.2"], "zen.spamhaus.org");
  expect(result[0].address, "127.0.0.2");
  expect(result[0].blacklist, "zen.spamhaus.org");
  expect(result[0].listed).toEqual(true);
});

test("batch spamhaus positive with txt", async () => {
  const result = await batch(["127.0.0.2"], "zen.spamhaus.org", {includeTxt: true});
  expect(result[0].address, "127.0.0.2");
  expect(result[0].blacklist, "zen.spamhaus.org");
  expect(result[0].listed).toEqual(true);
  expect(result[0].txt, [
    ["https://www.spamhaus.org/sbl/query/SBL2"],
    ["https://www.spamhaus.org/query/ip/127.0.0.2"]
  ]);
});

test("batch multiple", async () => {
  const result = await batch(["127.0.0.1", "127.0.0.2"], ["zen.spamhaus.org"]);
  expect(result[0].address, "127.0.0.1");
  expect(result[0].blacklist, "zen.spamhaus.org");
  expect(result[0].listed).toEqual(false);
  expect(result[1].address, "127.0.0.2");
  expect(result[1].blacklist, "zen.spamhaus.org");
  expect(result[1].listed).toEqual(true);
});
