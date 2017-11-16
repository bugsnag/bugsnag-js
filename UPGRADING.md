Upgrading
=========


## 3.x to 4.x

*Our JS library has gone through some major improvements, and there are some changes you'll need to make to get onto the new version.*

#### Getting the new notifier

If you're loading Bugsnag from the CDN you may have got used to transparent rolling updates. Since this is a major update with breaking changes, you'll need to update the URL your script tag is pointing to. Be sure to also make changes to your application where it configures and uses the Bugsnag client!

##### Before
```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js" data-apikey="API_KEY"></script>
```

##### After
```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/4.x.x/bugsnag.js"></script>
```

#### npm/yarn

If you're using a package manager, you should run something like

```
npm install --save bugsnag-js@4
# or
yarn add bugsnag-js@4
```

#### Manual startup

Before, the client would simply "exist" already on the page – like a singleton. Now you have to explicitly create your client with some configuration options (or simply an API key).

This might seem like a little more work, but it gives you more granular control:
- Bugsnag won't start until you tell it to.
- It will do exactly as its told based on the config provided. Previously, it would start doing all the default behavior and you'd have to go and switch it all off, which was rather messy.
- There's now no lost-in-translation in the options. The options are declared as JS values rather than being extracted from strings, which should mean fewer surprises.

##### Before
```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/bugsnag-3.min.js" data-apikey="API_KEY"></script>
<script>
  Bugsnag.notify(err)
</script>
```

##### After
```html
<script src="//d2wy8f7a9ursnm.cloudfront.net/4.x.x/bugsnag.js"></script>
<script>
  const client = bugsnag('API_KEY')
  client.notify(err)
</script>
```

#### Configuration

We've changed how our configuration system works.

As mentioned, we've removed the ability to configure the library with HTML attributes. Additionally many of the configuration options have been updated or changed.

#### Dropping support for IE6/7

v1 to 3 of the notifier valiantly supported IE 6 and 7. However, supporting these ~old~ ancient browsers came with some pretty serious caveats. Now that we’ve dropped support, we're able to move the library forward and make our reporting delivery mechanism more robust.

If you’re still supporting users on IE6/7, you can still use v3. We will continue to maintain v2 along side v3. For more information, see the [v3 integration guide](TODOTODOTOD).
