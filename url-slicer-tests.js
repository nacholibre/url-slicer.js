(function() {
    'use strict';

    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');
    var should = chai.should();
    var expect = chai.expect;
    chai.use(chaiAsPromised);

    var urlSlicer = require('./url-slicer.js');

    describe('Suffix list download/load', function() {
        this.timeout(15000); //15 seconds timeout because download can be slow

        it('should download mozilla tlds file', function() {
            return urlSlicer.downloadSuffixList().then(function() {
                return urlSlicer.loadSuffixList();
            }).then(function() {
                var suffixData = urlSlicer._getSuffixData();
                suffixData.indexOf('com').should.not.equal(-1);
                suffixData.indexOf('bg').should.not.equal(-1);
                suffixData.indexOf('national.museum').should.not.equal(-1);
                suffixData.indexOf('台湾').should.not.equal(-1);
            });
        });

        it('should download and load suffix list on init method', function() {
            urlSlicer.removeLocalSuffixList();
            return urlSlicer.init().then(function() {
                var suffixData = urlSlicer._getSuffixData();
                suffixData.indexOf('com').should.not.equal(-1);
            });
        });

        it('should load suffix list, without downloading it', function() {
            return urlSlicer.init().then(function() {
                var suffixData = urlSlicer._getSuffixData();
                suffixData.indexOf('com').should.not.equal(-1);
            });
        });
    });

    describe('Extract', function() {
        //urlSlicer.init().then(done);

        it('should slice simple com domain url', function(done) {
            urlSlicer.slice('dir.com', function(sliced) {
                sliced.domain.should.equal('dir');
                sliced.tld.should.equal('com');
                sliced.subdomains.should.have.length(0);
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice url with query string', function(done) {
            urlSlicer.slice('http://dnes.dir.bg/news/volen-siderov-Сergey-Нarishkin-16638984?nt=4', function(sliced) {
                sliced.domain.should.equal('dir');
                sliced.tld.should.equal('bg');
                sliced.subdomains.should.include('dnes');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice punycode url and return punycode result', function(done) {
            urlSlicer.slice('xn--1000-y73c3e2qiaj0aap13b4cqa7f9ri047bwba340a13r6gmmv3dcm1i.net', function(sliced) {
                sliced.domain.should.equal('xn--1000-y73c3e2qiaj0aap13b4cqa7f9ri047bwba340a13r6gmmv3dcm1i');
                sliced.tld.should.equal('net');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice domain with exclusion', function(done) {
            urlSlicer.slice('blah.some.ck', function(sliced) {
                sliced.domain.should.equal('blah');
                sliced.tld.should.equal('some.ck');
                sliced.valid.should.equal(true);
                done();
            });
        });


        it('should slice domain with exclusion 2', function(done) {
            urlSlicer.slice('www.ck', function(sliced) {
                sliced.domain.should.equal('www');
                sliced.tld.should.equal('ck');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should return not valid domain', function(done) {
            urlSlicer.slice('kobe.jp', function(sliced) {
                sliced.valid.should.equal(false);
                done();
            });
        });

        it('should detect www as subdomain', function(done) {
            urlSlicer.slice('www.google.com', function(sliced) {
                sliced.domain.should.equal('google');
                sliced.tld.should.equal('com');
                sliced.subdomains.should.include('www');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice 3 dotted jp tld domain', function(done) {
            urlSlicer.slice('test.ide.kyoto.jp', function(sliced) {
                sliced.domain.should.equal('test');
                sliced.tld.should.equal('ide.kyoto.jp');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice utf url', function(done) {
            urlSlicer.slice('www.食狮.公司.cn', function(sliced) {
                sliced.domain.should.equal('食狮');
                sliced.tld.should.equal('公司.cn');
                sliced.subdomains.should.include('www');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice 3 dotted punycode url', function(done) {
            urlSlicer.slice('xn--85x722f.xn--85x722f.xn--55qx5d.cn', function(sliced) {
                sliced.domain.should.equal('xn--85x722f');
                sliced.tld.should.equal('xn--55qx5d.cn');
                sliced.subdomains.should.include('xn--85x722f');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should return not valid cn', function(done) {
            urlSlicer.slice('公司.cn', function(sliced) {
                sliced.valid.should.equal(false);
                done();
            });
        });

        it('should return not valid ak.us', function(done) {
            urlSlicer.slice('k12.ak.us', function(sliced) {
                sliced.valid.should.equal(false);
                done();
            });
        });

        it('should return slice https domain', function(done) {
            urlSlicer.slice('https://dir.bg', function(sliced) {
                sliced.domain.should.equal('dir');
                sliced.tld.should.equal('bg');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should return not valid when whitespace is in url', function(done) {
            urlSlicer.slice('https://di r.bg', function(sliced) {
                expect(sliced.domain).to.be.null;
                expect(sliced.tld).to.be.null;
                sliced.valid.should.equal(false);
                done();
            });
        });

        it('should trim whitespace and be valid', function(done) {
            urlSlicer.slice(' https://dir.bg ', function(sliced) {
                sliced.domain.should.equal('dir');
                sliced.tld.should.equal('bg');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice parliament domain', function(done) {
            urlSlicer.slice('blah.parliament.uk', function(sliced) {
                sliced.domain.should.equal('parliament');
                sliced.tld.should.equal('uk');
                sliced.subdomains.should.include('blah');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice co.uk domain', function(done) {
            urlSlicer.slice('blah.co.uk', function(sliced) {
                sliced.domain.should.equal('blah');
                sliced.tld.should.equal('co.uk');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice national.museum', function(done) {
            urlSlicer.slice('www.sub.national.museum', function(sliced) {
                sliced.domain.should.equal('sub');
                sliced.tld.should.equal('national.museum');
                sliced.subdomains.should.include('www');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('should slice domain with utf tld', function(done) {
            urlSlicer.slice('www.президент.рф', function(sliced) {
                sliced.domain.should.equal('президент');
                sliced.tld.should.equal('рф');
                sliced.subdomains.should.include('www');
                sliced.valid.should.equal(true);
                done();
            });
        });

        it('very long domain should not be valid', function(done) {
            var longDomain = null;

            for(var i = 0; i<= 20; i++) {
                longDomain += 'asdd';
            }

            urlSlicer.slice('www.' + longDomain + '.com', function(sliced) {
                sliced.valid.should.equal(false);
                done();
            });
        });

        it('domain with not existant tld shount be invalid', function(done) {
            urlSlicer.slice('www.blah.xczxczxczxc', function(sliced) {
                sliced.valid.should.equal(false);
                done();
            });
        });

        it('only tld should not be valid domain', function(done) {
            urlSlicer.slice('net', function(sliced) {
                sliced.valid.should.equal(false);
                done();
            });
        });

        it('empty url should not be valid', function(done) {
            urlSlicer.slice('', function(sliced) {
                sliced.valid.should.equal(false);
                done();
            });
        });
    });
})();
