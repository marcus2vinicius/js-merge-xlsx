/**
 * test_spreadsheet.js
 * Test code for spreadsheet
 * @author Satoshi Haga
 * @date 2015/10/10
 */

'use strict';

var path = require('path');
var cwd = path.resolve('');
var assert = require('assert');
var Excel = require(cwd + '/lib/Excel');
var ExcelMerge = require(cwd + '/excelmerge');
require(cwd + '/lib/underscore_mixin');
var Promise = require('bluebird');
var readYamlAsync = Promise.promisify(require('read-yaml'));
var fs = Promise.promisifyAll(require('fs'));
var _ = require('underscore');

var SINGLE_DATA = 'SINGLE_DATA';
var MULTI_FILE = 'MULTI_FILE';
var MULTI_SHEET = 'MULTI_SHEET';

module.exports = {
    checkLoadShouldReturnThisInstance: function checkLoadShouldReturnThisInstance() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new ExcelMerge().load(new Excel(validTemplate));
        }).then(function (excelMerge) {
            assert(excelMerge instanceof ExcelMerge, 'ExcelMerge#load() should return this instance');
        });
    },

    checkVariablesWorkCorrectly: function checkVariablesWorkCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new ExcelMerge().load(new Excel(validTemplate));
        }).then(function (excelMerge) {
            var variables = ['AccountName__c', 'StartDateFormat__c', 'EndDateFormat__c', 'Address__c', 'JobDescription__c', 'StartTime__c', 'EndTime__c', 'hasOverTime__c', 'HoliDayType__c', 'Salary__c', 'DueDate__c', 'SalaryDate__c', 'AccountName__c', 'AccountAddress__c'];
            var parsedVariables = excelMerge.variables();
            _.each(variables, function (e) {
                assert(_.contains(parsedVariables, e), e + ' is not parsed correctly by variables()');
            });
        });
    },

    checkIfBulkMergeMultiSheetRendersCorrectly: function checkIfBulkMergeMultiSheetRendersCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new ExcelMerge().load(new Excel(validTemplate));
        }).then(function (excelMerge) {
            return excelMerge.bulkMergeMultiSheet([{ name: 'sheet1', data: { AccountName__c: 'hoge account1', AccountAddress__c: 'hoge street1' } }, { name: 'sheet2', data: { AccountName__c: 'hoge account2', AccountAddress__c: 'hoge street2' } }, { name: 'sheet3', data: { AccountName__c: 'hoge account3', AccountAddress__c: 'hoge street3' } }]);
        }).then(function (excelData) {
            return new ExcelMerge().load(new Excel(excelData));
        }).then(function (excelMerge) {
            assert(excelMerge.excel.hasAsSharedString('hoge account1'), "'hoge account1' is missing in excel file");
            assert(excelMerge.excel.hasAsSharedString('hoge street1'), "'hoge street1' is missing in excel file");
            assert(excelMerge.excel.hasAsSharedString('hoge account2'), "'hoge account2' is missing in excel file");
            assert(excelMerge.excel.hasAsSharedString('hoge street2'), "'hoge street2' is missing in excel file");
            assert(excelMerge.excel.hasAsSharedString('hoge account3'), "'hoge account3' is missing in excel file");
            assert(excelMerge.excel.hasAsSharedString('hoge street3'), "'hoge street3' is missing in excel file");
        });
    },

    checkIfMergeRendersCorrectly: function checkIfMergeRendersCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new ExcelMerge().load(new Excel(validTemplate));
        }).then(function (excelMerge) {
            return excelMerge.merge({ AccountName__c: 'hoge account', AccountAddress__c: 'hoge street' });
        }).then(function (excelData) {
            return new ExcelMerge().load(new Excel(excelData));
        }).then(function (excelMerge) {
            assert(excelMerge.excel.variables().length === 0, "ExcelMerge#merge() doesn't work correctly");
            assert(excelMerge.excel.hasAsSharedString('hoge account'), "'hoge account' is not rendered by ExcelMerge#simpleMerge()");
            assert(excelMerge.excel.hasAsSharedString('hoge street'), "'hoge street' is not rendered by ExcelMerge#simpleMerge()");
        });
    },

    checkIfBulkMergeMultiFileRendersCorrectly: function checkIfBulkMergeMultiFileRendersCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new ExcelMerge().load(new Excel(validTemplate));
        }).then(function (excelMerge) {
            return excelMerge.bulkMergeMultiFile([{ name: 'file1.xlsx', data: { AccountName__c: 'hoge account1', AccountAddress__c: 'hoge street1' } }, { name: 'file2.xlsx', data: { AccountName__c: 'hoge account2', AccountAddress__c: 'hoge street2' } }, { name: 'file3.xlsx', data: { AccountName__c: 'hoge account3', AccountAddress__c: 'hoge street3' } }]);
        }).then(function (zipData) {
            var zip = new Excel(zipData);
            var excel1 = zip.file('file1.xlsx').asArrayBuffer();
            var excel2 = zip.file('file2.xlsx').asArrayBuffer();
            var excel3 = zip.file('file3.xlsx').asArrayBuffer();
            return Promise.props({
                excelMerge1: new ExcelMerge().load(new Excel(excel1)),
                excelMerge2: new ExcelMerge().load(new Excel(excel2)),
                excelMerge3: new ExcelMerge().load(new Excel(excel3))
            }).then(function (_ref) {
                var excelMerge1 = _ref.excelMerge1;
                var excelMerge2 = _ref.excelMerge2;
                var excelMerge3 = _ref.excelMerge3;

                assert(excelMerge1.excel.hasAsSharedString('hoge account1'), "'hoge account1' is missing in excel file");
                assert(excelMerge1.excel.hasAsSharedString('hoge street1'), "'hoge street1' is missing in excel file");
                assert(excelMerge2.excel.hasAsSharedString('hoge account2'), "'hoge account2' is missing in excel file");
                assert(excelMerge2.excel.hasAsSharedString('hoge street2'), "'hoge street2' is missing in excel file");
                assert(excelMerge3.excel.hasAsSharedString('hoge account3'), "'hoge account3' is missing in excel file");
                assert(excelMerge3.excel.hasAsSharedString('hoge street3'), "'hoge street3' is missing in excel file");
            });
        });
    }
};