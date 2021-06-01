# Screencap Lambda

## What is it?

Screencap lambda is a very simple javascript lambda that wraps puppeteer to
convert urls into PNGs.

## Why do you want it?

This replaces cutycapt http://cutycapt.sourceforge.net/ , which has two
problems:
* It was last updated in 2013, which means it fails to render modern webpages
  very well
* It runs standalone on the server with your application which means it has
  access to private network resources

The screencap lambda runs outside any VPC with an extremely limited IAM role
(write-only access to cloudwatch logs), so it doesn't have access to anything
sensitive.

## Deploying

The lambda is deployable as a terraform module:
```
module "screencap" {
  source = "path/to/screencap"

  name            = "screencap-prod"
  # Optional
  #certificate_arn = "acm-cert-arn"
  #domain_name     = "screencap.my.domain"

  env = {
    # If you want to conect it to sentry
    #SENTRY_DSN = "https://secret@sentry.io/1234"
  }

  tags = {
    Project     = "Screencap"
    Environment = "Production"
  }

  providers = {
    aws = aws
  }
}

output "base_url" {
  value = module.screencap.base_url
}

output "api_keys" {
  value = module.screencap.api_keys
}
```

If you are using this with canvas, add the following to your dynamic_settings.yml:
```
private:
    canvas:
      cutycapt.yml: |
        screencap_service:
          url: {base_url}/capture
          key: {api_key.canvas}
```

## Calling the API

The api has one GET endpoint: `${base_url}/capture?url={the_url}`. Authorization
is through the `X-API-Key` header, which should be set to an api key from the
terraform output.  On success, the api will return a PNG of the webpage with a
200 http response code.  On failure it will return a 5xx code and a body of 
```
{"message": "Internal server error"}
```

## Developing

In the `code` directory, run `npm install`.  Tests can be run with `npm run test`.
You can take screenshots locally with `bin/local_run`:
```
bin/local_run http://canvas.instructure.com test.png
```