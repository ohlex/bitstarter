var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var async = require('async');

var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1);
    }
    return instr;
};

var doChecks = function (checksfile, $, callback) {
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    callback(out);
};

var cheerioUrl = function(url, checksfile, callback) {
    restler.get(url).on('complete', function(data) {
        doChecks(checksfile, cheerio.load(data), callback);
    });
};

var cheerioHtmlFile = function(htmlfile, checksfile, callback) {
    doChecks(checksfile, cheerio.load(fs.readFileSync(htmlfile)), callback);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(url, htmlfile, checksfile, callback) {
    if (url != null && url.length > 0) {
        cheerioUrl(url, checksfile, callback);
    }
    else {
        cheerioHtmlFile(htmlfile, checksfile, callback);
    }
}

var clone = function(fn) {
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to index.html')
        .parse(process.argv);
    var checkJson = checkHtmlFile(program.url, program.file, program.checks, function(checkJson) {
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    });
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
