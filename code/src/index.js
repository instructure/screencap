const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const Sentry = require("@sentry/serverless");

if (process.env.SENTRY_DSN) {
  Sentry.AWSLambda.init({
    dsn: process.env.SENTRY_DSN,
  });
}

chromium.setHeadlessMode = true;

const puppeteerLaunch = async function () {
  if (global.localChromium) {
    return await puppeteer.launch({
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
      channel: "chrome",
      ignoreHTTPSErrors: true,
      headless: "new",
    });
  } else {
    const customArgs = Array.from(chromium.args);
    customArgs.push("--disable-gpu");
    customArgs.push("--disk-cache-size=0");
    customArgs.push("--media-cache-size=0");
    return await puppeteer.launch({
      args: customArgs,
      defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreDefaultArgs: ["--disk-cache-size", "--in-process-gpu"],
      ignoreHTTPSErrors: true,
    });
  }
};

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

  const browser = await puppeteerLaunch();
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
    console.log("Screenshotting Done! " + url);
  } finally {
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

  const response = {
    statusCode: 200,
    body: body,
    isBase64Encoded: true,
    headers: { "Content-Type": "image/png" },
  };
  return response;
};

exports.handler = Sentry.AWSLambda.wrapHandler(exports.rawHandler);
