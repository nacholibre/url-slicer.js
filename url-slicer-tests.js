(function() {
    'use strict';

    var assert = require('assert');
    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
    var should = chai.should();
    var expect = chai.expect;
    chai.use(chaiAsPromised);

    var Promise = require('bluebird');

    var urlSlicer = require('./url-slicer.js');

    describe.skip('Suffix list download/load', function() {
        this.timeout(15000); //15 seconds timeout because download can be slow

        it('should download mozilla tlds file', function() {
            return urlSlicer.downloadSuffixList().then(function() {
                return urlSlicer.loadSuffixList();
            }).then(function() {
                var suffixData = urlSlicer._getSuffixData();
                assert('com' in suffixData);
                assert('bg' in suffixData);
                assert('national.museum' in suffixData);
                assert('台湾' in suffixData);
            });
        });

        it('should download and load suffix list on init method', function() {
            urlSlicer.removeLocalSuffixList();
            return urlSlicer.init().then(function() {
                var suffixData = urlSlicer._getSuffixData();
                assert('com' in suffixData);
            });
        });

        it('should load suffix list, without downloading it', function() {
            return urlSlicer.init().then(function() {
                var suffixData = urlSlicer._getSuffixData();
                assert('com' in suffixData);
            });
        });
    });

    describe('Extract', function() {
        //urlSlicer.init().then(done);

        //it('should work with promisify', function(done) {
        //    //var func = Promise.promisify(urlSlicer.slice);

        //    var sliced = urlSlicer.slice('dir.com');

        //    sliced.domain.should.equal('dir');
        //    sliced.tld.should.equal('com');
        //    sliced.subdomains.should.have.length(0);
        //    done();
        //});

        it('should slice simple com domain url', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('dir.com');
                sliced.domain.should.equal('dir');
                sliced.tld.should.equal('com');
                sliced.subdomains.should.have.length(0);
                //assert(err === null);
                done();
            });
        });

        it('should slice url with query string', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('http://dnes.dir.bg/news/volen-siderov-Сergey-Нarishkin-16638984?nt=4');

                sliced.domain.should.equal('dir');
                sliced.tld.should.equal('bg');
                sliced.subdomains.should.include('dnes');
                done();
            });
        });

        it('should slice punycode url and return punycode result', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('xn--1000-y73c3e2qiaj0aap13b4cqa7f9ri047bwba340a13r6gmmv3dcm1i.net');

                sliced.domain.should.equal('xn--1000-y73c3e2qiaj0aap13b4cqa7f9ri047bwba340a13r6gmmv3dcm1i');
                sliced.tld.should.equal('net');
                done();
            });
        });

        it('should slice domain with exclusion', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('blah.some.ck');

                sliced.domain.should.equal('blah');
                sliced.tld.should.equal('some.ck');
                done();
            });
        });


        it('should slice domain with exclusion 2', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('www.ck');
                sliced.domain.should.equal('www');
                sliced.tld.should.equal('ck');
                done();
            });
        });

        it('should return not valid domain', function(done) {
            urlSlicer.init().then(function() {
                try {
                    var sliced = urlSlicer.slice('kobe.jp');
                } catch(SliceException) {
                    done();
                }
            });
        });

        it('should detect www as subdomain', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('www.google.com');

                sliced.domain.should.equal('google');
                sliced.tld.should.equal('com');
                sliced.subdomains.should.include('www');
                done();
            });
        });

        it('should slice 3 dotted jp tld domain', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('test.ide.kyoto.jp');

                sliced.domain.should.equal('test');
                sliced.tld.should.equal('ide.kyoto.jp');
                done();
            });
        });

        it('should slice utf url', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('www.食狮.公司.cn');

                sliced.domain.should.equal('食狮');
                sliced.tld.should.equal('公司.cn');
                sliced.subdomains.should.include('www');
                done();
            });
        });

        it('should slice 3 dotted punycode url', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('xn--85x722f.xn--85x722f.xn--55qx5d.cn');

                sliced.domain.should.equal('xn--85x722f');
                sliced.tld.should.equal('xn--55qx5d.cn');
                sliced.subdomains.should.include('xn--85x722f');
                done();
            });
        });

        it('should return not valid cn', function(done) {
            urlSlicer.init().then(function() {
                try {
                    var sliced = urlSlicer.slice('公司.cn');
                } catch(SliceException) {
                    done();
                }
            });
        });

        it('should return not valid ak.us', function(done) {
            urlSlicer.init().then(function() {
                try {
                    var sliced = urlSlicer.slice('k12.ak.us');
                } catch(SliceException) {
                    done();
                }
            });
        });

        it('should return slice https domain', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('https://dir.bg');

                sliced.domain.should.equal('dir');
                sliced.tld.should.equal('bg');
                done();
            });
        });

        it('should return not valid when whitespace is in url', function(done) {
            urlSlicer.init().then(function() {
                try {
                    var sliced = urlSlicer.slice('https://di r.bg');
                } catch(SliceException) {
                    done();
                }
            });
        });

        it('should trim whitespace and be valid', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice(' https://dir.bg ');

                sliced.domain.should.equal('dir');
                sliced.tld.should.equal('bg');
                done();
            });
        });

        it('should slice parliament domain', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('blah.parliament.uk');

                sliced.domain.should.equal('parliament');
                sliced.tld.should.equal('uk');
                sliced.subdomains.should.include('blah');
                done();
            });
        });

        it('should slice co.uk domain', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('blah.parliament.uk');

                sliced.domain.should.equal('parliament');
                sliced.tld.should.equal('uk');
                done();
            });
        });

        it('should slice ca domain', function(done) {
            urlSlicer.init().then(function() {
                var sliced = urlSlicer.slice('slam.canoe.ca');

                sliced.domain.should.equal('canoe');
                sliced.tld.should.equal('ca');
                sliced.subdomains.should.include('slam');
                done();
            });
        });

        //it('should slice national.museum', function(done) {
        //    urlSlicer.slice('www.sub.national.museum', function(err, sliced) {
        //        sliced.domain.should.equal('sub');
        //        sliced.tld.should.equal('national.museum');
        //        sliced.subdomains.should.include('www');
        //        assert(err === null);
        //        done();
        //    });
        //});

        //it('should slice domain with utf tld', function(done) {
        //    urlSlicer.slice('www.президент.рф', function(err, sliced) {
        //        sliced.domain.should.equal('президент');
        //        sliced.tld.should.equal('рф');
        //        sliced.subdomains.should.include('www');
        //        assert(err === null);
        //        done();
        //    });
        //});

        //it('very long domain should not be valid', function(done) {
        //    var longDomain = null;

        //    for(var i = 0; i<= 20; i++) {
        //        longDomain += 'asdd';
        //    }

        //    urlSlicer.slice('www.' + longDomain + '.com', function(err, sliced) {
        //        assert(err !== null);
        //        done();
        //    });
        //});

        //it('domain with not existant tld shount be invalid', function(done) {
        //    urlSlicer.slice('www.blah.xczxczxczxc', function(err, sliced) {
        //        assert(err !== null);
        //        done();
        //    });
        //});

        //it('only tld should not be valid domain', function(done) {
        //    urlSlicer.slice('net', function(err, sliced) {
        //        assert(err !== null);
        //        done();
        //    });
        //});

        //it('empty url should not be valid', function(done) {
        //    urlSlicer.slice('', function(err, sliced) {
        //        assert(err !== null);
        //        done();
        //    });
        //});
    });
})();
