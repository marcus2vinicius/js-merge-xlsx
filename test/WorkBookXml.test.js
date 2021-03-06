'use strict';

var Promise = require('bluebird');
var _ = require('underscore');
var fs = Promise.promisifyAll(require('fs'));
var WorkBookXml = require('../lib/WorkBookXml');
require('../lib/underscore');
var assert = require('chai').assert;
var config = require('../lib/Config');
var xml2js = require('xml2js');
var parseString = Promise.promisify(xml2js.parseString);

var readFile = function readFile(xmlFile) {
    return fs.readFileAsync('' + config.TEST_DIRS.XML + xmlFile, 'utf8').then(function (workBookXml) {
        return parseString(workBookXml);
    });
};

describe('WorkBookXml.js', function () {
    describe('constructor', function () {
        it('should set each member from parameter', function () {
            return readFile('workbook.xml').then(function (workBookXml) {
                var workBookXmlObj = new WorkBookXml(workBookXml);
                assert.isOk(_.consistOf(workBookXmlObj, [{ workBookXml: { workbook: ['$', 'fileVersion', 'workbookPr', 'bookViews', 'sheets', 'definedNames', 'calcPr', 'extLst'] }
                }, { sheetDefinitions: { $: ['name', 'sheetId', 'r:id'] }
                }]));
            })['catch'](function (err) {
                console.log(err);
                assert.isOk(false);
            });
        });
        it('should have the same number of sheet-definitions', function () {
            return readFile('workbookHaving2Sheet.xml').then(function (workBookXml) {
                var workBookXmlObj = new WorkBookXml(workBookXml);
                assert.strictEqual(workBookXmlObj.sheetDefinitions.length, 2);
            })['catch'](function (err) {
                console.log(err);
                assert.isOk(false);
            });
        });
    });

    describe('add()', function () {
        it('should add element formatted as {name, sheetId, r:id}', function () {
            return readFile('workbook.xml').then(function (workBookXml) {
                var workBookXmlObj = new WorkBookXml(workBookXml);
                workBookXmlObj.add('addedSheetName', 'addedSheetId');
                assert.strictEqual(workBookXmlObj.sheetDefinitions.length, 2);
                assert.strictEqual(workBookXmlObj.sheetDefinitions[1]['$'].name, 'addedSheetName');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[1]['$'].sheetId, 'addedSheetId');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[1]['$']['r:id'], 'addedSheetId');
            });
        });
    });

    describe('delete()', function () {
        it('should delete correct sheet by name', function () {
            return readFile('workbookHaving2Sheet.xml').then(function (workBookXml) {
                var workBookXmlObj = new WorkBookXml(workBookXml);
                workBookXmlObj['delete']('Sheet2');
                assert.strictEqual(workBookXmlObj.sheetDefinitions.length, 1);
                assert.strictEqual(workBookXmlObj.sheetDefinitions[0]['$'].name, 'Sheet1');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[0]['$'].sheetId, '1');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[0]['$']['r:id'], 'rId1');
            });
        });

        it('should do nothing with invalid sheet name', function () {
            return readFile('workbookHaving2Sheet.xml').then(function (workBookXml) {
                var workBookXmlObj = new WorkBookXml(workBookXml);
                workBookXmlObj['delete']('invalid-sheet-name');
                assert.strictEqual(workBookXmlObj.sheetDefinitions.length, 2);
                assert.strictEqual(workBookXmlObj.sheetDefinitions[0]['$'].name, 'Sheet1');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[0]['$'].sheetId, '1');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[0]['$']['r:id'], 'rId1');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[1]['$'].name, 'Sheet2');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[1]['$'].sheetId, '2');
                assert.strictEqual(workBookXmlObj.sheetDefinitions[1]['$']['r:id'], 'rId2');
            });
        });
    });

    describe('findSheetId()', function () {
        it('should return null if invalid sheet name', function () {
            return readFile('workbookHaving2Sheet.xml').then(function (workBookXml) {
                var sheetId = new WorkBookXml(workBookXml).findSheetId('invalid-sheet-name');
                assert.strictEqual(sheetId, null);
            });
        });

        it('should return correct sheet data by name', function () {
            return readFile('workbookHaving2Sheet.xml').then(function (workBookXml) {
                var sheetId = new WorkBookXml(workBookXml).findSheetId('Sheet1');
                assert.notStrictEqual(sheetId, null);
                assert.strictEqual(sheetId, 'rId1');
            });
        });
    });

    describe('firstSheetName()', function () {
        it('should return name of the first sheet', function () {
            return readFile('workbookHaving2Sheet.xml').then(function (workBookXml) {
                var firstSheetName = new WorkBookXml(workBookXml).firstSheetName();
                assert.strictEqual(firstSheetName, 'Sheet1');
            });
        });
    });

    describe('value()', function () {
        it('should retrieve the latest value', function () {
            return readFile('workbook.xml').then(function (workBookXml) {
                var sheets = new WorkBookXml(workBookXml).add('addedSheetName', 'addedSheetId').value().workbook.sheets[0].sheet;
                assert.strictEqual(sheets.length, 2);
                assert.strictEqual(sheets[0]['$'].name, 'Sheet1');
                assert.strictEqual(sheets[0]['$'].sheetId, '1');
                assert.strictEqual(sheets[0]['$']['r:id'], 'rId1');
                assert.strictEqual(sheets[1]['$'].name, 'addedSheetName');
                assert.strictEqual(sheets[1]['$'].sheetId, 'addedSheetId');
                assert.strictEqual(sheets[1]['$']['r:id'], 'addedSheetId');
            });
        });
    });
});