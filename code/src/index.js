const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const Sentry = require("@sentry/serverless");

if (process.env.SENTRY_DSN) {
  Sentry.AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
  });
}

chromium.setHeadlessMode = true;

const puppeteerLaunch = (async function () {
  if (global.localChromium) {
    return await puppeteer.launch({
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
      channel: "chrome",
      ignoreHTTPSErrors: true,
      headless: "new",
    });
  } else {
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }
})();

exports.rawHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `takeScreenshot only accepts GET method, you tried: ${event.httpMethod}`,
    );
  }
  const url = event.queryStringParameters.url;
  if (!url) {
    throw new Error("URL cannot be empty");
  }
  console.log("Screenshotting: " + url);

  const browser = await puppeteerLaunch;
  globalThis.browser = browser;
  const page = await browser.newPage();

  let body = "";
  try {
    await page.goto(url, { waitUntil: ["domcontentloaded"] });
    // wait for 2 seconds
    await new Promise((r) => setTimeout(r, 2000));
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
  const browser = globalThis.browser;
  if (browser) {
    const pages = await browser.pages();
    for (let i = 0; i < pages.length; i++) {
      try {
        await pages[i].close();
      } catch (e) {
        console.log("Error closing page: " + e);
      }
    }
    await browser.close();
  }
};
