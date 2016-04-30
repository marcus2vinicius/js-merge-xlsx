"use strict";function _classCallCheck(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var _createClass=function(){function e(e,t){for(var n=0;n<t.length;n++){var s=t[n];s.enumerable=s.enumerable||!1,s.configurable=!0,"value"in s&&(s.writable=!0),Object.defineProperty(e,s.key,s)}}return function(t,n,s){return n&&e(t.prototype,n),s&&e(t,s),t}}(),_=require("underscore");require("./underscore_mixin");var Mustache=require("mustache"),SharedStrings=function(){function e(t,n){_classCallCheck(this,e),this.rawData=t,this.strings=t.sst.si,this.setUsingCells(this.getOnlyHavingVariable(),n)}return _createClass(e,[{key:"setUsingCells",value:function(e,t){_.each(e,function(e){e.usingCells=[],_.each(t,function(t){_.each(t.c,function(t){"s"===t.$.t&&e.sharedIndex===t.v[0]>>0&&e.usingCells.push(t.$.r)})})})}},{key:"add",value:function(e){var t=this,n=this.strings.length;_.each(e,function(e,s){e.sharedIndex=n+s,t.strings.push(e)})}},{key:"value",value:function(){return this.strings?(this.rawData.sst.si=_.deleteProperties(this.strings,["sharedIndex","usingCells"]),this.rawData.sst.$.uniqueCount=this.strings.length,this.rawData.sst.$.count=this.strings.length,this.rawData):null}},{key:"getOnlyHavingVariable",value:function(){var e=[];return _.each(this.strings,function(t,n){_.stringValue(t.t)&&_.hasVariable(_.stringValue(t.t))&&(t.sharedIndex=n,e.push(t))}),e}},{key:"hasString",value:function(){return!!this.strings}},{key:"buildNewSharedStrings",value:function(e){return _.reduce(_.deepCopy(this.getOnlyHavingVariable()),function(t,n){return n.t[0]=Mustache.render(_.stringValue(n.t),e),t.push(n),t},[])}},{key:"addMergedStrings",value:function(e){this.hasString()&&this.add(this.buildNewSharedStrings(e))}}]),e}();module.exports=SharedStrings;