/**
 * test_spreadsheet.js
 * Test code for spreadsheet
 * @author Satoshi Haga
 * @date 2015/10/10
 */

const path = require('path');
const cwd = path.resolve('');
const assert = require('assert');
const Excel = require(cwd + '/lib/Excel');
const ExcelMerge = require(cwd + '/excelmerge');
require(cwd + '/lib/underscore_mixin');
const Promise = require('bluebird');
const readYamlAsync = Promise.promisify(require('read-yaml'));
const fs = Promise.promisifyAll(require('fs'));
const _ = require('underscore');

const SINGLE_DATA = 'SINGLE_DATA';
const MULTI_FILE = 'MULTI_FILE';
const MULTI_SHEET = 'MULTI_SHEET';

module.exports = {
    checkLoadShouldReturnThisInstance: ()=>{
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx')
            .then((validTemplate)=>{
                return new ExcelMerge().load(new Excel(validTemplate));
            }).then((excelMerge)=>{
                assert(excelMerge instanceof ExcelMerge, 'ExcelMerge#load() should return this instance');
            });
    },

    checkVariablesWorkCorrectly: ()=>{
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx')
            .then((validTemplate)=>{
                return new ExcelMerge().load(new Excel(validTemplate));
            }).then((excelMerge)=>{
                let variables = [
                    'AccountName__c', 'StartDateFormat__c', 'EndDateFormat__c', 'Address__c', 'JobDescription__c', 'StartTime__c', 'EndTime__c',
                    'hasOverTime__c', 'HoliDayType__c', 'Salary__c', 'DueDate__c', 'SalaryDate__c', 'AccountName__c', 'AccountAddress__c'
                ];
                let parsedVariables = excelMerge.variables();
                _.each(variables, (e)=>{
                    assert(_.contains(parsedVariables,e), `${e} is not parsed correctly by variables()`);
                });
            });
    },

    checkIfBulkMergeMultiSheetRendersCorrectly: ()=>{
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx')
            .then((validTemplate)=>{
                return new ExcelMerge().load(new Excel(validTemplate));
            }).then((excelMerge)=>{
                return excelMerge.bulkMergeMultiSheet([
                    { name: 'sheet1', data: { AccountName__c: 'hoge account1', AccountAddress__c: 'hoge street1' } },
                    { name: 'sheet2', data: { AccountName__c: 'hoge account2', AccountAddress__c: 'hoge street2' } },
                    { name: 'sheet3', data: { AccountName__c: 'hoge account3', AccountAddress__c: 'hoge street3' } }
                ]);
            }).then((excelData)=>{
                return new ExcelMerge().load(new Excel(excelData));
            }).then((excelMerge)=>{
                assert(excelMerge.excel.hasAsSharedString('hoge account1'), "'hoge account1' is missing in excel file");
                assert(excelMerge.excel.hasAsSharedString('hoge street1'), "'hoge street1' is missing in excel file");
                assert(excelMerge.excel.hasAsSharedString('hoge account2'), "'hoge account2' is missing in excel file");
                assert(excelMerge.excel.hasAsSharedString('hoge street2'), "'hoge street2' is missing in excel file");
                assert(excelMerge.excel.hasAsSharedString('hoge account3'), "'hoge account3' is missing in excel file");
                assert(excelMerge.excel.hasAsSharedString('hoge street3'), "'hoge street3' is missing in excel file");
            });
    },

    checkIfMergeRendersCorrectly: ()=>{
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx')
            .then((validTemplate)=>{
                return new ExcelMerge().load(new Excel(validTemplate));
            }).then((excelMerge)=>{
                return excelMerge.merge({ AccountName__c: 'hoge account', AccountAddress__c: 'hoge street' });
            }).then((excelData)=>{
                return new ExcelMerge().load(new Excel(excelData));
            }).then(function (excelMerge) {
                assert(excelMerge.excel.variables().length === 0, "ExcelMerge#merge() doesn't work correctly");
                assert(excelMerge.excel.hasAsSharedString('hoge account'), "'hoge account' is not rendered by ExcelMerge#simpleMerge()");
                assert(excelMerge.excel.hasAsSharedString('hoge street'), "'hoge street' is not rendered by ExcelMerge#simpleMerge()");
            });
    },

    checkIfBulkMergeMultiFileRendersCorrectly: ()=>{
        return fs.readFileAsync(__dirname + '/../templates/Template.xlsx')
            .then((validTemplate)=>{
                return new ExcelMerge().load(new Excel(validTemplate));
            }).then((excelMerge)=>{
                return excelMerge.bulkMergeMultiFile([
                    { name: 'file1.xlsx', data: { AccountName__c: 'hoge account1', AccountAddress__c: 'hoge street1' } },
                    { name: 'file2.xlsx', data: { AccountName__c: 'hoge account2', AccountAddress__c: 'hoge street2' } },
                    { name: 'file3.xlsx', data: { AccountName__c: 'hoge account3', AccountAddress__c: 'hoge street3' } }
                ]);
            }).then((zipData)=>{
                var zip = new Excel(zipData);
                var excel1 = zip.file('file1.xlsx').asArrayBuffer();
                var excel2 = zip.file('file2.xlsx').asArrayBuffer();
                var excel3 = zip.file('file3.xlsx').asArrayBuffer();
                return Promise.props({
                    excelMerge1: new ExcelMerge().load(new Excel(excel1)),
                    excelMerge2: new ExcelMerge().load(new Excel(excel2)),
                    excelMerge3: new ExcelMerge().load(new Excel(excel3))
                }).then(({excelMerge1,excelMerge2,excelMerge3})=>{

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