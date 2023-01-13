/**
 * @jest-environment node
 */

// require the raw source files to avoid getting the built files - otherwise
// we'd need to rebuild these packages to see any changes reflected in this file
const Bugsnag = require('../../node/src/notifier')
const BugsnagPluginAwsLambda = require('../../plugin-aws-lambda/src/index')
const BugsnagPluginExpress = require('../../plugin-express/src/express')
const serverlessExpress = require('@vendia/serverless-express')
const express = require('express')

let sentEvents
let sentSessions

describe('serverless express', function () {
  beforeEach(function () {
    sentEvents = []
    sentSessions = []
  })

  it('sets the correct request data for each request', async function () {
    const client = makeClient()
    const lambdaHandler = makeLambdaHandler(client)
    const lambdaEvent = makeAwsLambdaEvent('/abc?a=b&c=d&e=f')
    const lambdaContext = makeAwsLambdaContext()

    const response = await lambdaHandler(lambdaEvent, lambdaContext)

    expect(response.body).toEqual('abc')
    expect(response.statusCode).toEqual(200)

    expect(sentEvents).toHaveLength(1)
    expect(sentSessions).toHaveLength(1)
    expect(sentEvents[0].events).toHaveLength(1)

    const event = sentEvents[0].events[0]
    expect(event.errors).toHaveLength(1)
    expect(event.errors[0].errorMessage).toEqual('abc')
    expect(event._metadata.request.path).toEqual('/abc')
    expect(event._metadata.request.query).toEqual({ a: 'b', c: 'd', e: 'f' })
    expect(event.request).toEqual({
      body: undefined,
      clientIp: '127.0.0.1',
      headers: {
        accept: '*/*',
        host: 'localhost:3000',
        'user-agent': 'bugsnag aws lambda test',
        'x-forwarded-port': '3000',
        'x-forwarded-proto': 'http'
      },
      httpMethod: 'GET',
      url: 'https://localhost/abc?a=b&c=d&e=f',
      referer: undefined
    })

    expect(event._session.toJSON()).toEqual({
      events: {
        handled: 1,
        unhandled: 0
      },
      id: expect.any(String),
      startedAt: expect.any(Date)
    })

    const lambdaEvent2 = makeAwsLambdaEvent('/xyz?x=a&y=b&z=c')
    const response2 = await lambdaHandler(lambdaEvent2, lambdaContext)

    expect(response2.body).toEqual('xyz')
    expect(response2.statusCode).toEqual(200)

    expect(sentEvents).toHaveLength(2)
    expect(sentSessions).toHaveLength(2)
    expect(sentEvents[1].events).toHaveLength(1)

    const event2 = sentEvents[1].events[0]
    expect(event2.errors).toHaveLength(1)
    expect(event2.errors[0].errorMessage).toEqual('xyz')
    expect(event2._metadata.request.path).toEqual('/xyz')
    expect(event2._metadata.request.query).toEqual({ x: 'a', y: 'b', z: 'c' })
    expect(event2.request).toEqual({
      body: undefined,
      clientIp: '127.0.0.1',
      headers: {
        accept: '*/*',
        host: 'localhost:3000',
        'user-agent': 'bugsnag aws lambda test',
        'x-forwarded-port': '3000',
        'x-forwarded-proto': 'http'
      },
      httpMethod: 'GET',
      url: 'https://localhost/xyz?x=a&y=b&z=c',
      referer: undefined
    })

    expect(event2._session.toJSON()).toEqual({
      events: {
        handled: 1,
        unhandled: 0
      },
      id: expect.any(String),
      startedAt: expect.any(Date)
    })

    const lambdaEvent3 = makeAwsLambdaEvent('/aaa?a=1&z=2')
    const response3 = await lambdaHandler(lambdaEvent3, lambdaContext)

    expect(response3.body).toEqual(':^)')
    expect(response3.statusCode).toEqual(200)

    expect(sentEvents).toHaveLength(3)
    expect(sentSessions).toHaveLength(3)
    expect(sentEvents[2].events).toHaveLength(1)

    const event3 = sentEvents[2].events[0]
    expect(event3.errors).toHaveLength(1)
    expect(event3.errors[0].errorMessage).toEqual('aaa')
    expect(event3._metadata.request.path).toEqual('/aaa')
    expect(event3._metadata.request.query).toEqual({ a: '1', z: '2' })
    expect(event3.request).toEqual({
      body: undefined,
      clientIp: '127.0.0.1',
      headers: {
        accept: '*/*',
        host: 'localhost:3000',
        'user-agent': 'bugsnag aws lambda test',
        'x-forwarded-port': '3000',
        'x-forwarded-proto': 'http'
      },
      httpMethod: 'GET',
      url: 'https://localhost/aaa?a=1&z=2',
      referer: undefined
    })

    expect(event3._session.toJSON()).toEqual({
      events: {
        handled: 1,
        unhandled: 0
      },
      id: expect.any(String),
      startedAt: expect.any(Date)
    })
  })
})

function makeClient () {
  const client = Bugsnag.createClient({
    apiKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    plugins: [BugsnagPluginAwsLambda, BugsnagPluginExpress]
  })

  client._setDelivery(() => ({
    sendEvent (payload, callback = () => {}) {
      sentEvents.push(payload)
      callback()
    },
    sendSession (payload, callback = () => {}) {
      sentSessions.push(payload)
      callback()
    }
  }))

  return client
}

function makeExpressApp (client) {
  const app = express()
  const middleware = client.getPlugin('express')

  app.use(middleware.requestHandler)

  app.get('/', function (req, res) {
    throw new Error('oh no')
  })

  app.get('/abc', function (req, res) {
    req.bugsnag.notify(new Error('abc'))

    res.send('abc')
  })

  app.get('/xyz', function (req, res) {
    req.bugsnag.notify(new Error('xyz'))

    res.send('xyz')
  })

  app.get('/aaa', function (req, res) {
    req.bugsnag.notify(new Error('aaa'))

    res.send(':^)')
  })

  app.use(middleware.errorHandler)

  return app
}

function makeLambdaHandler (client) {
  const app = makeExpressApp(client)
  const bugsnagHandler = client.getPlugin('awsLambda').createHandler()

  return bugsnagHandler(serverlessExpress({ app }))
}

function makeAwsLambdaEvent (path = '/') {
  const url = new URL(path, 'http://localhost:3000')

  const queryStringParameters = {}
  const multiValueQueryStringParameters = {}

  for (const name of url.searchParams.keys()) {
    queryStringParameters[name] = url.searchParams.get(name)
    multiValueQueryStringParameters[name] = url.searchParams.getAll(name)
  }

  return {
    body: null,
    headers: {
      Accept: '*/*',
      Host: url.host,
      'User-Agent': 'bugsnag aws lambda test',
      'X-Forwarded-Port': url.port,
      'X-Forwarded-Proto': 'http'
    },
    httpMethod: 'GET',
    isBase64Encoded: true,
    multiValueHeaders: {
      Accept: ['*/*'],
      Host: [url.host],
      'User-Agent': ['bugsnag aws lambda test'],
      'X-Forwarded-Port': [url.port],
      'X-Forwarded-Proto': ['http']
    },
    multiValueQueryStringParameters,
    path: url.pathname,
    pathParameters: {
      proxy: url.pathname.replace(/^\//, '')
    },
    queryStringParameters,
    requestContext: {
      accountId: '123456789012',
      apiId: '1234567890',
      domainName: url.host,
      extendedRequestId: null,
      httpMethod: 'GET',
      identity: {
        accountId: null,
        apiKey: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityPoolId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'Custom User Agent String',
        userArn: null
      },
      path: '/{proxy+}',
      protocol: 'HTTP/1.1',
      requestId: '96b29547-f073-41b7-98f0-96040733b229',
      requestTime: '01/Dec/2022:08:55:43 +0000',
      requestTimeEpoch: 1669884943,
      resourceId: '123456',
      resourcePath: '/{proxy+}',
      stage: 'prod'
    },
    resource: '/{proxy+}',
    stageVariables: null,
    version: 1.0
  }
}

function makeAwsLambdaContext () {
  return {
    awsRequestId: 'f0d6ee94-8baa-46bc-a4fe-22bf52a1fb28',
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'ExpressFunction',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:012345678912:function:ExpressFunction',
    logGroupName: 'aws/lambda/ExpressFunction',
    logStreamName: '$LATEST',
    memoryLimitInMB: 128
  }
}
