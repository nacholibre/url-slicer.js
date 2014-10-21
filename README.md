[![Build Status](https://travis-ci.org/nacholibre/url-slicer.js.svg?branch=master)](https://travis-ci.org/nacholibre/url-slicer.js)

#url-slicer.js

Slice URLs into logical parts - domain, tld or subdomains for node.js

###Installation
Install by running `npm install url-slicer`

###Usage
```javascript
var urlSlicer = require('url-slicer');

urlSlicer.init().then(function() {
  urlSlicer.slice('http://dir.com');
});
```
Will return
```javascript
{ domain: 'dir',
  tld: 'com',
  query: undefined,
  valid: true,
  subdomains: [] }
```

Url Slicer is using public suffix list https://publicsuffix.org/list/ for tlds information.

More examples
```javascript
urlSlicer.slice('http://police.uk');
{ domain: null,
  tld: null,
  query: null,
  valid: false,
  subdomains: [] }

```
```javascript
urlSlicer.slice('http://www.police.uk');
{ domain: 'www',
  tld: 'police.uk',
  query: undefined,
  valid: true,
  subdomains: [] }
```
```javascript
urlSlicer.slice('my.agriculture.museum');
{ domain: 'my',
  tld: 'agriculture.museum',
  query: undefined,
  valid: true,
  subdomains: [] }

```

##API
###urlSlicer.init()
Returns promise when publix suffix list is downloaded and loaded. You can use `slice` before init promise is fulfilled.

###urlSlicer.slice(url)
Returns object with these properties
```javascript
{ domain: 'google',
  tld: 'com',
  query: undefined,
  valid: true,
  subdomains: [] }
```
