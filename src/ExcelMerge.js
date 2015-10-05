/**
 * * ExcelMerge
 * * @author Satoshi Haga
 * * @date 2015/09/30
 **/

import Mustache from 'mustache'
import Promise from 'bluebird'
import _ from 'underscore'
import JSZip from 'jszip'
import SpreadSheet from './lib/spreadsheet'
import isNode from 'detect-node'
const output_buffer = {type: (isNode?'nodebuffer':'blob'), compression:"DEFLATE"};

class ExcelMerge{

    /** member variables */
    //spreadsheet : {Object} SpreadSheet instance

    /**
     * * constructor
     * *
     **/
    constructor(){
        this.spreadsheet = new SpreadSheet();
    }

    /**
     * * load
     * * @param {Object} excel JsZip object including MS-Excel file
     * * @return {Promise} Promise instance including this
     **/
    load(excel){
        return this.spreadsheet.load(excel).then(()=>this);
    }

    /**
     * * render
     * * @param {Object} bind_data binding data
     * * @returns {Object} rendered MS-Excel data. data-format is determined by jszip_option
     **/
    render(bind_data){
        return this.spreadsheet.simple_render(bind_data);
    }

    /**
     * * bulk_render_multi_file
     * * @param {Array} bind_data_array including data{name: file's name, data: binding-data}
     * * @returns {Object} rendered MS-Excel data.
     **/
    bulk_render_multi_file(bind_data_array){
        return this.spreadsheet.bulk_render_multi_file(bind_data_array);
    }

    /**
     * * 3_bulk_render_multi_sheet
     * * @param {Array} bind_data_array including data{name: file's name, data: binding-data}
     * * @param {Object} output_option JsZip#generate() option.
     * * @returns {Object} rendered MS-Excel data. data-format is determined by jszip_option
     **/
    bulk_render_multi_sheet(bind_data_array){
        return bind_data_array.reduce(
            (promise, bind_data)=>
                promise.then((prior)=>{
                    return this.spreadsheet.add_sheet_binding_data(bind_data.name,bind_data.data);
                })
            ,
            Promise.resolve()
        ).then(()=>{
            return this.spreadsheet.generate(output_buffer);
        }).catch((err)=>{
            console.error(new Error(err).stack);
            Promise.reject();
        });
    }

}

//Exports
module.exports = ExcelMerge;