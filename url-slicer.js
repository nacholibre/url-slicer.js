(function() {
    'use strict';

    var fs = require('fs');
    var https = require('https');
    var q = require('q');
    var punycode = require('punycode');

    var urlSlicer = {};

    var PUBLIC_SUFFIX_LIST_LOCATION = 'https://publicsuffix.org/list/effective_tld_names.dat';
    var PUBLIC_SUFFIX_FILE_LOCATION = '.suffixlist';
    var _suffixData = [];

    var initPromise = false;

    urlSlicer.init = function() {
        if (!initPromise) {
            initPromise = urlSlicer.loadSuffixList().catch(function() {
                return urlSlicer.downloadSuffixList();
            }).finally(function() {
                return urlSlicer.loadSuffixList();
            });
        }

        return initPromise;
    };

    urlSlicer.downloadSuffixList = function(downloadTo) {
        var deferred = q.defer();

        if (!downloadTo) {
            downloadTo = PUBLIC_SUFFIX_FILE_LOCATION;
        }

        var suffixListStream = fs.createWriteStream(downloadTo);

        https.get(PUBLIC_SUFFIX_LIST_LOCATION, function(res) {
            res.pipe(suffixListStream);

            res.on('end', function() {
                deferred.resolve();
            });
        }).on('error', function(err) {
            deferred.reject(err);
        });

        return deferred.promise;
    };

    urlSlicer.loadSuffixList = function() {
        var deferred = q.defer();

        fs.readFile(PUBLIC_SUFFIX_FILE_LOCATION, function(err, data) {
            if (err) {
                deferred.reject(err);
            } else {
                data.toString().split("\n").forEach(function(line) {
                    //skip comment and empty lines
                    if(line.indexOf('//') === -1 && line !== '') {
                        _suffixData.push(line);
                    }
                });
                deferred.resolve();
            }
        });

        return deferred.promise;
    };

    urlSlicer._getSuffixData = function() {
        return _suffixData;
    };

    urlSlicer.removeLocalSuffixList = function() {
        if (fs.exists(PUBLIC_SUFFIX_FILE_LOCATION)) {
            fs.unlink(PUBLIC_SUFFIX_FILE_LOCATION);
        }
    };

    urlSlicer.trimUrl = function(url) {
        url = url.replace('http://', '');
        url = url.replace('https://', '');
        url = url.trim();
        return url;
    };

    urlSlicer.sliceTld = function(domain) {
        var chunks = domain.split('.').reverse();
        var suffixArray = this._getSuffixData();

        var combinations = [];

        var reversed = chunks.reverse();

        for(var i = 0; i < reversed.length; i++) {
            combinations.push('*' + '.' + reversed.slice(i).join('.'));
            combinations.push('!' + reversed.slice(i).join('.'));
            combinations.push(reversed.slice(i).join('.'));
        }

        var foundSuffixes = [];
        combinations.forEach(function(value) {
            if (suffixArray.indexOf(value) !== -1) {
                foundSuffixes.push(value);
            }
        });

        foundSuffixes.splice(1);

        return foundSuffixes.join('.');
    };

    urlSlicer.valid = function(domain, tld, url) {
        var valid = true;

        domain = domain.trim();
        if (domain === '') {
            valid = false;
        }

        tld = tld.trim();
        if (tld === '') {
            valid = false;
        }

        if (url.indexOf('.') === -1) {
            valid = false;
        }

        var hostname = domain + '.' + tld;

        if(hostname.indexOf(' ') !== -1) {
            valid = false;
        }

        hostname.split('.').forEach(function(hname) {
            if (hname.length > 63) {
                valid = false;
            }
        });

        return valid;
    };

    urlSlicer.isPunyEncoded = function(url) {
        var punyEncoded = false;

        if (url.indexOf('xn--') !== -1) {
            punyEncoded = true;
        }

        return punyEncoded;
    };

    urlSlicer.punyToUtf = function(domain) {
        return punycode.toUnicode(domain);
    };

    urlSlicer.slice = function(url, done) {
        urlSlicer.init().then(function() {
            url = urlSlicer.trimUrl(url);
            var splitBySlash = url.split('/');
            var domain = url;
            var query;
            var tld;
            var valid = true;
            var subdomains = [];
            var punyEncoded;
            domain = url;

            if (splitBySlash.length > 1) {
                domain = splitBySlash[0];
                query = splitBySlash.splice(1).join('/');
            }

            punyEncoded = urlSlicer.isPunyEncoded(domain);

            if(punyEncoded) {
                domain = urlSlicer.punyToUtf(domain);
            }

            tld = urlSlicer.sliceTld(domain);
            if (tld === domain) {
                valid = false;
            }
            domain = domain.replace('.' + tld, '');

            if (tld && tld[0] === '*') {
                var dom = domain;
                domain = domain.replace(tld.slice(2), '');
                if (domain === '') {
                    valid = false;
                }
                tld = domain.split('.').reverse()[1] + '.' + tld.slice(2);
                domain = dom.replace('.' + tld, '');
            } else if (tld && tld[0] === '!') {
                var splitByDot = tld.split('.');
                splitByDot = splitByDot.slice(1);
                tld = splitByDot.join('.');
                domain = domain.replace('.' + tld, '');
            }

            if(domain.length > 1) {
                subdomains = domain.split('.');
                domain = subdomains.splice(-1)[0];
            }

            var validUrl = true;
            var validate = urlSlicer.valid(domain, tld, url);
            if (validate === false || valid === false) {
                domain = null;
                tld = null;
                query = null;
                subdomains = [];
                validUrl = false;
            }

            if(punyEncoded) {
                domain = punycode.toASCII(domain);
                tld = punycode.toASCII(tld);
                subdomains = subdomains.map(punycode.toASCII);
            }

            var res = {};
            res.domain = domain;
            res.tld = tld;
            res.query = query;
            res.subdomains = subdomains;

            var error = null;

            if (!validUrl) {
                error = 'Query is not valid domain name.';
            }

            done(error, res);
        });
    };

    module.exports = urlSlicer;
})();
