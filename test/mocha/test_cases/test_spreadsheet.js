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
var SpreadSheet = require(cwd + '/lib/sheetHelper');
require(cwd + '/lib/underscore_mixin');
var Promise = require('bluebird');
var readYamlAsync = Promise.promisify(require('read-yaml'));
var fs = Promise.promisifyAll(require('fs'));
var _ = require('underscore');
var isNode = require('detect-node');
var output_buffer = { type: isNode ? 'nodebuffer' : 'blob', compression: "DEFLATE" };

module.exports = {

    checkLoadShouldReturnThisInstance: function checkLoadShouldReturnThisInstance() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new SpreadSheet().load(new Excel(validTemplate));
        }).then(function (spreadsheet) {
            assert(spreadsheet instanceof SpreadSheet, 'SpreadSheet#load() should return this instance');
        });
    },

    checkTemplateVariablesWorkCorrectly: function checkTemplateVariablesWorkCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new SpreadSheet().load(new Excel(validTemplate));
        }).then(function (spreadsheet) {
            var variables = ['AccountName__c', 'StartDateFormat__c', 'EndDateFormat__c', 'Address__c', 'JobDescription__c', 'StartTime__c', 'EndTime__c', 'hasOverTime__c', 'HoliDayType__c', 'Salary__c', 'DueDate__c', 'SalaryDate__c', 'AccountName__c', 'AccountAddress__c'];
            var parsedVariables = spreadsheet.excel.variables();
            _.each(variables, function (e) {
                assert(_.contains(parsedVariables, e), e + ' is not parsed correctly by variables()');
            });
        });
    },

    checkIfSimpleMergeRendersCorrectly: function checkIfSimpleMergeRendersCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new SpreadSheet().load(new Excel(validTemplate));
        }).then(function (spreadsheet) {
            return spreadsheet.simpleMerge({ AccountName__c: 'hoge account', AccountAddress__c: 'hoge street' });
        }).then(function (excelData) {
            return new SpreadSheet().load(new Excel(excelData));
        }).then(function (spreadsheet) {
            assert(spreadsheet.excel.variables().length === 0, "SpreadSheet#simpleMerge() doesn't work correctly");
            assert(spreadsheet.excel.hasAsSharedString('hoge account'), "'hoge account' is not rendered by SpreadSheet#simpleMerge()");
            assert(spreadsheet.excel.hasAsSharedString('hoge street'), "'hoge street' is not rendered by SpreadSheet#simpleMerge()");
        });
    },

    checkIfBulkMergeMultiFileRendersCorrectly: function checkIfBulkMergeMultiFileRendersCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new SpreadSheet().load(new Excel(validTemplate));
        }).then(function (spreadsheet) {
            return spreadsheet.bulkMergeMultiFile([{ name: 'file1.xlsx', data: { AccountName__c: 'hoge account1', AccountAddress__c: 'hoge street1' } }, { name: 'file2.xlsx', data: { AccountName__c: 'hoge account2', AccountAddress__c: 'hoge street2' } }, { name: 'file3.xlsx', data: { AccountName__c: 'hoge account3', AccountAddress__c: 'hoge street3' } }]);
        }).then(function (zipData) {
            var zip = new Excel(zipData);
            var excel1 = zip.file('file1.xlsx').asArrayBuffer();
            var excel2 = zip.file('file2.xlsx').asArrayBuffer();
            var excel3 = zip.file('file3.xlsx').asArrayBuffer();
            return Promise.props({
                sp1: new SpreadSheet().load(new Excel(excel1)),
                sp2: new SpreadSheet().load(new Excel(excel2)),
                sp3: new SpreadSheet().load(new Excel(excel3))
            }).then(function (_ref) {
                var sp1 = _ref.sp1;
                var sp2 = _ref.sp2;
                var sp3 = _ref.sp3;

                assert(sp1.excel.hasAsSharedString('hoge account1'), "'hoge account1' is missing in excel file");
                assert(sp1.excel.hasAsSharedString('hoge street1'), "'hoge street1' is missing in excel file");
                assert(sp2.excel.hasAsSharedString('hoge account2'), "'hoge account2' is missing in excel file");
                assert(sp2.excel.hasAsSharedString('hoge street2'), "'hoge street2' is missing in excel file");
                assert(sp3.excel.hasAsSharedString('hoge account3'), "'hoge account3' is missing in excel file");
                assert(sp3.excel.hasAsSharedString('hoge street3'), "'hoge street3' is missing in excel file");
            });
        });
    },

    checkIfBulkMergeMultiSheetRendersCorrectly: function checkIfBulkMergeMultiSheetRendersCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new SpreadSheet().load(new Excel(validTemplate));
        }).then(function (spreadsheet) {
            return spreadsheet.bulkMergeMultiSheet([{ name: 'sheet1', data: { AccountName__c: 'hoge account1', AccountAddress__c: 'hoge street1' } }, { name: 'sheet2', data: { AccountName__c: 'hoge account2', AccountAddress__c: 'hoge street2' } }, { name: 'sheet3', data: { AccountName__c: 'hoge account3', AccountAddress__c: 'hoge street3' } }]);
        }).then(function (excelData) {
            return new SpreadSheet().load(new Excel(excelData));
        }).then(function (spreadsheet) {
            assert(spreadsheet.excel.hasAsSharedString('hoge account1'), "'hoge account1' is missing in excel file");
            assert(spreadsheet.excel.hasAsSharedString('hoge street1'), "'hoge street1' is missing in excel file");
            assert(spreadsheet.excel.hasAsSharedString('hoge account2'), "'hoge account2' is missing in excel file");
            assert(spreadsheet.excel.hasAsSharedString('hoge street2'), "'hoge street2' is missing in excel file");
            assert(spreadsheet.excel.hasAsSharedString('hoge account3'), "'hoge account3' is missing in excel file");
            assert(spreadsheet.excel.hasAsSharedString('hoge street3'), "'hoge street3' is missing in excel file");
        });
    },

    checkIfAddSheetBindingDataCorrectly: function checkIfAddSheetBindingDataCorrectly() {
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx').then(function (validTemplate) {
            return new SpreadSheet().load(new Excel(validTemplate));
        }).then(function (spreadsheet) {
            return spreadsheet.addSheetBindingData('sample', { AccountName__c: 'hoge account1', AccountAddress__c: 'hoge street1' }).generate(output_buffer);
        }).then(function (excelData) {
            return new SpreadSheet().load(new Excel(excelData));
        }).then(function (spreadsheet) {
            assert(spreadsheet.excel.hasAsSharedString('hoge account1'), "'hoge account1' is missing in excel file");
            assert(spreadsheet.excel.hasAsSharedString('hoge street1'), "'hoge street1' is missing in excel file");
        });
    }
};