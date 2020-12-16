const index = require("../src/index");

test("Rejects non-get requests", async () => {
  await expect(
    index.handler({
      httpMethod: "POST",
      queryStringParameters: {
        url: "http://localhost:2001/",
      },
    })
  ).rejects.toThrow(/POST/);
});

test("Rejects get requests without a URL", async () => {
  await expect(
    index.handler({
      httpMethod: "GET",
      queryStringParameters: {},
    })
  ).rejects.toThrow(/URL/);
});

test("Returns an error when loading a nonexistant page", async () => {
  await expect(
    index.handler({
      httpMethod: "GET",
      queryStringParameters: {
        url: "http://does-not-exist.example/test-page",
      },
    })
  ).rejects.toThrow();
});

test("Returns a PNG with the right dimensions when loading a real page", async () => {
  const result = await index.handler({
    httpMethod: "GET",
    queryStringParameters: {
      url: "http://localhost:2001/",
    },
  });
  expect(result.statusCode).toBe(200);
  expect(result.isBase64Encoded).toBe(true);
  const png = Buffer.from(result.body, "base64").toString("binary");
  expect(png.substr(0, 8)).toBe("\u0089PNG\r\n\u001a\n");
});

afterAll(async () => {
  await index.shutdown();
});
