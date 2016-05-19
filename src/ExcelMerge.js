/**
 * ExcelMerge
 * @author Satoshi Haga
 * @date 2016/03/27
 */

const Promise = require('bluebird');
const _ = require('underscore');
const JSZip = require('jszip');
const Mustache = require('mustache');
require('./lib/underscore_mixin');

const Excel = require('./lib/Excel');
const WorkBookXml = require('./lib/WorkBookXml');
const WorkBookRels = require('./lib/WorkBookRels');
const SheetXmls = require('./lib/SheetXmls');
const SharedStrings = require('./lib/SharedStrings');
const config = require('./lib/Config');

const merge = (template, data, oututType = config.JSZIP_OPTION.BUFFER_TYPE_OUTPUT) => {
    let templateObj = new JSZip(template);
    return templateObj.file(
        config.EXCEL_FILES.FILE_SHARED_STRINGS,
        Mustache.render(templateObj.file(config.EXCEL_FILES.FILE_SHARED_STRINGS).asText(), data)
    )
    .generate({type: oututType, compression: config.JSZIP_OPTION.COMPLESSION});
};

const bulkMergeToFiles = (template, arrayObj) => {
    return _.reduce(arrayObj, (zip, {name, data}) => {
        zip.file(name, merge(template, data, config.JSZIP_OPTION.buffer_type_jszip));
        return zip;
    }, new JSZip())
    .generate({
        type:        config.JSZIP_OPTION.BUFFER_TYPE_OUTPUT,
        compression: config.JSZIP_OPTION.COMPLESSION
    });
};

const bulkMergeToSheets = (template, arrayObj) => {
    return parse(template)
    .then((templateObj) => {
        let excelObj = new Merge(templateObj)
            .addMergedSheets(arrayObj)
            //TODO Should delete template sheet.
            //.deleteTemplateSheet()
            .value();
        return new Excel(template).generateWithData(excelObj);
    });
};

const parse = (template) => {
    return new Excel(template).setTemplateSheetRel()
        .then((templateObj) => {
            return Promise.props({
                sharedstrings:   templateObj.parseSharedStrings(),
                workbookxmlRels: templateObj.parseWorkbookRels(),
                workbookxml:     templateObj.parseWorkbook(),
                sheetXmls:       templateObj.parseWorksheetsDir()
            })
        }).then(({sharedstrings, workbookxmlRels, workbookxml, sheetXmls}) => {
            let sheetXmlObjs = new SheetXmls(sheetXmls);
            return {
                relationship:       new WorkBookRels(workbookxmlRels),
                workbookxml:        new WorkBookXml(workbookxml),
                sheetXmls:          sheetXmlObjs,
                templateSheetModel: sheetXmlObjs.getTemplateSheetModel(),
                sharedstrings:      new SharedStrings(
                    sharedstrings, sheetXmlObjs.templateSheetData()
                )
            };
        });
};

class Merge {

    constructor(templateObj) {
        this.excelObj = templateObj;
    }

    addMergedSheets(dataArray) {
        _.each(dataArray, ({name, data}) => this.addMergedSheet(name, data));
        return this;
    }

    addMergedSheet(newSheetName, mergeData) {
        let nextId = this.excelObj.relationship.nextRelationshipId();
        this.excelObj.relationship.add(nextId);
        this.excelObj.workbookxml.add(newSheetName, nextId);
        this.excelObj.sheetXmls.add(
            `sheet${nextId}.xml`,
            this.excelObj.templateSheetModel.cloneWithMergedString(
                this.excelObj.sharedstrings.addMergedStrings(mergeData)
            )
        );
    };

    deleteTemplateSheet() {
        let sheetname = this.excelObj.workbookxml.firstSheetName();
        let targetSheet = this.findSheetByName(sheetname);
        this.excelObj.relationship.delete(targetSheet.path);
        this.excelObj.workbookxml.delete(sheetname);
        return this;
    }

    findSheetByName(sheetname) {
        let sheetid = this.excelObj.workbookxml.findSheetId(sheetname);
        if(!sheetid) {
            return null;
        }
        let targetFilePath = this.excelObj.relationship.findSheetPath(sheetid);
        let targetFileName = _.last(targetFilePath.split('/'));
        return {path: targetFilePath, value: this.excelObj.sheetXmls.find(targetFileName)};
    }

    value() {
        return this.excelObj;
    }
}

module.exports = {merge, bulkMergeToFiles, bulkMergeToSheets};
