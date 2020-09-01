const chromium = require('chrome-aws-lambda');

const pupetteerLaunch = async function() {
    return await chromium.puppeteer.launch({
    args: chromium.args,
    // TODO what should this be?
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
}()

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`takeScrenshot only accept GET method, you tried: ${event.httpMethod}`);
    }
    const url = event.queryStringParameters.url;
    if(!url) {
        throw new Error('URL cannot be empty')
    }
    console.log("Screenshotting: " + url);

    const browser = await pupetteerLaunch;
    const page = await browser.newPage();

    let body = '';
    try {
        await page.goto(url);
        body = await page.screenshot({
            encoding: 'base64',
            fullPage: true
        });
    } finally {
        page.close();
    }


    const response = {
        statusCode: 200,
        body: body,
        isBase64Encoded: true,
        headers: {"Content-Type": "image/png"},
    };
    return response;
}
