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

    describe('Extract', function(done) {
        urlSlicer.init().then(done);

        it('should slice simple com domain url', function() {
            var sliced = urlSlicer.slice('dir.com');
            sliced.domain.should.equal('dir');
            sliced.tld.should.equal('com');
            sliced.subdomains.should.have.length(0);
            sliced.valid.should.equal(true);
        });

        it('should slice url with query string', function() {
            var sliced = urlSlicer.slice('http://dnes.dir.bg/news/volen-siderov-Сergey-Нarishkin-16638984?nt=4');
            sliced.domain.should.equal('dir');
            sliced.tld.should.equal('bg');
            sliced.subdomains.should.include('dnes');
            sliced.valid.should.equal(true);
        });

        it('should slice punycode url and return punycode result', function() {
            var sliced = urlSlicer.slice('xn--1000-y73c3e2qiaj0aap13b4cqa7f9ri047bwba340a13r6gmmv3dcm1i.net');
            sliced.domain.should.equal('xn--1000-y73c3e2qiaj0aap13b4cqa7f9ri047bwba340a13r6gmmv3dcm1i');
            sliced.tld.should.equal('net');
            sliced.valid.should.equal(true);
        });

        it('should slice domain with exclusion', function() {
            var sliced = urlSlicer.slice('blah.some.ck');
            sliced.domain.should.equal('blah');
            sliced.tld.should.equal('some.ck');
            sliced.valid.should.equal(true);
        });


        it('should slice domain with exclusion 2', function() {
            var sliced = urlSlicer.slice('www.ck');
            sliced.domain.should.equal('www');
            sliced.tld.should.equal('ck');
            sliced.valid.should.equal(true);
        });

        it('should return not valid domain', function() {
            var sliced = urlSlicer.slice('kobe.jp');
            sliced.valid.should.equal(false);
        });

        it('should detect www as subdomain', function() {
            var sliced = urlSlicer.slice('www.google.com');
            sliced.domain.should.equal('google');
            sliced.tld.should.equal('com');
            sliced.subdomains.should.include('www');
            sliced.valid.should.equal(true);
        });

        it('should slice 3 dotted jp tld domain', function() {
            var sliced = urlSlicer.slice('test.ide.kyoto.jp');
            sliced.domain.should.equal('test');
            sliced.tld.should.equal('ide.kyoto.jp');
            sliced.valid.should.equal(true);
        });

        it('should slice utf url', function() {
            var sliced = urlSlicer.slice('www.食狮.公司.cn');
            sliced.domain.should.equal('食狮');
            sliced.tld.should.equal('公司.cn');
            sliced.subdomains.should.include('www');
            sliced.valid.should.equal(true);
        });

        it('should slice 3 dotted punycode url', function() {
            var sliced = urlSlicer.slice('xn--85x722f.xn--85x722f.xn--55qx5d.cn');
            sliced.domain.should.equal('xn--85x722f');
            sliced.tld.should.equal('xn--55qx5d.cn');
            sliced.subdomains.should.include('xn--85x722f');
            sliced.valid.should.equal(true);
        });

        it('should return not valid cn', function() {
            var sliced = urlSlicer.slice('公司.cn');
            sliced.valid.should.equal(false);
        });

        it('should return not valid ak.us', function() {
            var sliced = urlSlicer.slice('k12.ak.us');
            sliced.valid.should.equal(false);
        });

        it('should return slice https domain', function() {
            var sliced = urlSlicer.slice('https://dir.bg');
            sliced.domain.should.equal('dir');
            sliced.tld.should.equal('bg');
            sliced.valid.should.equal(true);
        });

        it('should return not valid when whitespace is in url', function() {
            var sliced = urlSlicer.slice('https://di r.bg');
            expect(sliced.domain).to.be.null;
            expect(sliced.tld).to.be.null;
            sliced.valid.should.equal(false);
        });

        it('should trim whitespace and be valid', function() {
            var sliced = urlSlicer.slice(' https://dir.bg ');
            sliced.domain.should.equal('dir');
            sliced.tld.should.equal('bg');
            sliced.valid.should.equal(true);
        });

        it('should slice parliament domain', function() {
            var sliced = urlSlicer.slice('blah.parliament.uk');
            sliced.domain.should.equal('parliament');
            sliced.tld.should.equal('uk');
            sliced.subdomains.should.include('blah');
            sliced.valid.should.equal(true);
        });

        it('should slice co.uk domain', function() {
            var sliced = urlSlicer.slice('blah.co.uk');
            sliced.domain.should.equal('blah');
            sliced.tld.should.equal('co.uk');
            sliced.valid.should.equal(true);
        });

        it('should slice national.museum', function() {
            var sliced = urlSlicer.slice('www.sub.national.museum');
            sliced.domain.should.equal('sub');
            sliced.tld.should.equal('national.museum');
            sliced.subdomains.should.include('www');
            sliced.valid.should.equal(true);
        });

        it('should slice domain with utf tld', function() {
            var sliced = urlSlicer.slice('www.президент.рф');
            sliced.domain.should.equal('президент');
            sliced.tld.should.equal('рф');
            sliced.subdomains.should.include('www');
            sliced.valid.should.equal(true);
        });

        it('very long domain should not be valid', function() {
            var longDomain = null;
            for(var i = 0; i<= 20; i++) {
                longDomain += 'asdd';
            }
            var sliced = urlSlicer.slice('www.' + longDomain + '.com');
            sliced.valid.should.equal(false);
        });

        it('domain with not existant tld shount be invalid', function() {
            var sliced = urlSlicer.slice('www.blah.xczxczxczxc');
            sliced.valid.should.equal(false);
        });

        it('only tld should not be valid domain', function() {
            var sliced = urlSlicer.slice('net');
            sliced.valid.should.equal(false);
        });

        it('empty url should not be valid', function() {
            var sliced = urlSlicer.slice('');
            sliced.valid.should.equal(false);
        });
    });
})();
