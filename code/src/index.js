const chromium = require("chrome-aws-lambda");
const Sentry = require("@sentry/serverless");

if (process.env.SENTRY_DSN) {
  Sentry.AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
  });
}

const puppeteerLaunch = (async function () {
  return await chromium.puppeteer.launch({
    args: chromium.args,
    // TODO what should this be?
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
})();

exports.rawHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `takeScreenshot only accepts GET method, you tried: ${event.httpMethod}`
    );
  }
  const url = event.queryStringParameters.url;
  if (!url) {
    throw new Error("URL cannot be empty");
  }
  console.log("Screenshotting: " + url);

  const browser = await puppeteerLaunch;
  const page = await browser.newPage();

  let body = "";
  try {
    await page.goto(url);
    body = await page.screenshot({
      encoding: "base64",
      fullPage: true,
    });
  } finally {
    page.close();
  }

  const response = {
    statusCode: 200,
    body: body,
    isBase64Encoded: true,
    headers: { "Content-Type": "image/png" },
  };
  return response;
};

exports.handler = Sentry.AWSLambda.wrapHandler(exports.rawHandler);

// For tests only to ensure we clean up cleanly
exports.shutdown = async () => {
  const browser = await puppeteerLaunch;
  await browser.close();
};
