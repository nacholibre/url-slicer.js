'use strict';

var urlSlicer = require('./url-slicer.js');
var lineByLine = require('n-readlines');
var async = require('async');
var liner = new lineByLine('./files/domains_100k.lst');

var resolved = 0;

async.whilst(function() {
    return resolved < 100000;
}, function(cb) {
    var domain = liner.next().toString('ascii');

    urlSlicer.slice(domain, function(err, data) {
        cb();
    });

    resolved++;
}, function(err) {
});
