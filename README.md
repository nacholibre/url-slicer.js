[![Build Status](https://travis-ci.org/nacholibre/url-slicer.js.svg?branch=master)](https://travis-ci.org/nacholibre/url-slicer.js)

#url-slicer.js

Slice URLs into logical parts - domain, tld or subdomains for node.js

###Installation
Install by running `npm install url-slicer`

###Usage
```javascript
var urlSlicer = require('url-slicer');

urlSlicer.slice('http://dir.com', function(sliced) {
    console.log(sliced);
});
```
Output:
```javascript
{ domain: 'dir',
  tld: 'com',
  query: undefined,
  valid: true,
  subdomains: [] }
```

Url Slicer is using the public suffix list which can be found here https://publicsuffix.org/list/.

More examples
```javascript
//http://police.uk
{ domain: null,
  tld: null,
  query: null,
  valid: false,
  subdomains: [] }

```
```javascript
//http://www.police.uk
{ domain: 'www',
  tld: 'police.uk',
  query: undefined,
  valid: true,
  subdomains: [] }
```
```javascript
//my.agriculture.museum
{ domain: 'my',
  tld: 'agriculture.museum',
  query: undefined,
  valid: true,
  subdomains: [] }

```

##API
###urlSlicer.init()
Returns promise when publix suffix list is downloaded and loaded.

###urlSlicer.slice(url, callback)
The `callback` is called with one parameter which is the result object.
```javascript
{ domain: 'google',
  tld: 'com',
  query: undefined,
  valid: true,
  subdomains: [] }
```
