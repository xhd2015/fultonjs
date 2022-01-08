"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MongoModeller = void 0;

const util = require("util");

const {
  Long
} = require("mongodb");

const regexModes = {
  "$contains": {
    start: "",
    end: ""
  },
  "$startsWith": {
    start: "^",
    end: ""
  },
  "$endsWith": {
    start: "",
    end: "$"
  }
}; // mongo modeller

class MongoModeller {
  constructor() {}
  /**
   * @public
   * @param {*} model 
   */
  // convert filter to 


  modelToFilter(model) {
    for (let key in model) {
      let value = model[key];

      if (!value) {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        if (value instanceof Long) {
          continue;
        } // handle the regex case


        const regexList = this.getRegexList(value);

        if (regexList) {
          this._replaceFilterOrAnd(model, key, regexList);
        }
      }
    }

    return model;
  } // replace filter if conditionList contains single element
  // remove it if it does not contain any element
  // add to $and otherwise,and remove the original key


  _replaceFilterOrAnd(filter, key, conditionList) {
    if (!(conditionList?.length > 0)) {
      delete filter[key];
      return;
    }

    if (conditionList.length === 1) {
      filter[key] = conditionList[0];
    } else {
      // remove the object, replace with $and
      delete filter[key];

      if (!filter.$and) {
        filter.$and = [];
      } else if (!Array.isArray(filter.$and)) {
        throw new Error(util.format("bad $and condition, expecting array: key = %s, filter = %j", key, filter));
      }

      filter.$and.push(...conditionList.map(e => ({
        [key]: e
      })));
    }
  } // get regex list for all supported predicates: $contains, $startsWith,$endsWith


  getRegexList(valueObject) {
    // regex list for this field
    let regexList; // check $contains, $startsWith $endsWith

    for (let op in regexModes) {
      let word = valueObject[op];

      if (word) {
        if (typeof word === 'string') {
          word = [word];
        }

        if (!Array.isArray(word)) {
          throw new Error(util.format("bad mongo %s condition, expecting string or array,found: op = %j,word = %j, key = %s, value = %j", op, word, valueObject));
        }

        const regexMode = regexModes[op];
        const cond = word.filter(e => e != null && e != "").map(e => ({
          $regex: regexMode.start + e + regexMode.end
        }));

        if (!regexList) {
          regexList = [];
        }

        regexList.push(...cond);
      }
    }

    return regexList;
  }

}

exports.MongoModeller = MongoModeller;