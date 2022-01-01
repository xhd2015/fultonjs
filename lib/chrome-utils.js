"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimerTask = void 0;
exports.hide = hide;
exports.hideSelector = hideSelector;
exports.nothing = nothing;
exports.querySelector = querySelector;
exports.querySelectorAll = querySelectorAll;
exports.querySelectorAllOn = querySelectorAllOn;
exports.querySelectorOn = querySelectorOn;
exports.sleep = sleep;
exports.until = until;

var objpath = _interopRequireWildcard(require("./objpath"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

console.log("Load ChromeUtils");

// example:
//  new TimerTask(100/*ms*/, 600, ()=>..., 'removeTask').start()
class TimerTask {
  constructor(interval, limit, action, taskName) {
    this.limit = limit;
    this.interval = interval;
    this.taskID = undefined;
    this.action = action;
    this.taskName = taskName || action.name; // function name

    this.finished = false;
  }

  start() {
    if (this.taskID) {
      throw new Error(`timer action ${this.taskName} running, cannot start another task`);
    }

    this.taskID = setInterval(() => {
      if (this.finished) {
        console.log(`timer action ${this.taskName} finished, clearning task`);

        this._clearTask();

        return;
      }

      if (this.times >= this.limit) {
        console.log(`timer action ${this.taskName} failed, reached limit:${this.limit}`);

        this._clearTask();

        return;
      }

      console.log(`timmer action ${this.taskName} running for no. ${this.times} times`);
      this.finished = this.action();
      this.times++;
    }, this.interval);
    return this;
  }

  _clearTask() {
    if (this.taskID) {
      clearInterval(this.taskID);
      this.taskID = undefined;
      return true;
    }

    return false;
  }

  stop() {
    return this._clearTask();
  }

}

exports.TimerTask = TimerTask;

function hideSelector(selector) {
  const el = document.querySelector(selector);

  if (el) {
    el.style.display = "none";
    return true;
  }

  return false;
}

function hide(el) {
  if (typeof el === 'string') {
    el = document.querySelector(el);
  }

  if (el) {
    el.style.display = "none";
    return true;
  }

  return false;
}

function toElementList(e) {
  if (e instanceof NodeList || Array.isArray(e)) {
    return e;
  }

  if (!e) return [];
  return [e];
}

function testMatch(query, key, predictValue) {
  if (predictValue == null) {
    predictValue = "";
  }

  for (let predict in query[key]) {
    const cond = query[key][predict];
    let match = true;

    if (predict === 'contains') {
      match = predictValue.includes(cond);
    } else if (predict === 'eq') {
      match = predictValue == cond;
    } else if (predict === 'startsWith') {
      match = predictValue.startsWith(cond);
    } else if (predict === 'endsWith') {
      match = predictValue.endsWith(cond);
    }

    if (!match) {
      return false;
    }
  }

  return true;
}

function testElementMatch(queryObject, e) {
  for (let key in queryObject) {
    let prop = objpath.get(e, key);

    if (prop == null && key === 'class') {
      prop = e.attributes?.class?.value;
    }

    if (typeof prop === 'function') {
      prop = prop();
    }

    if (!testMatch(queryObject, key, prop)) {
      return false;
    }
  }

  return true;
}

function matchParentUp(e, fn) {
  let el = e?.parentNode;

  while (el) {
    if (fn(el)) {
      return el;
    }

    el = el.parentNode;
  }

  return null;
}

function wrapArray(e) {
  return e ? [e] : [];
} // query:
//   string => selector
//   


function queryMiscAll(anchor, query) {
  anchor = toElementList(anchor);
  if (!query) return anchor;
  let mapper;

  if (typeof query === 'string') {
    mapper = e => e.querySelectorAll(query);
  } else if (typeof query === 'object') {
    // {"property":{"contains":"A", "eq":"", "startsWith":"", "endsWith":""}}
    // {"$parent":{....}} // find one of its parent
    const parentQuery = query["$parent"];

    if (parentQuery) {
      if (typeof parentQuery === 'string') {
        mapper = e => wrapArray(matchParentUp(e, el => el.matches && el.matches(parentQuery))); // when el == document, document has no matches method

      } else if (typeof parentQuery === 'object') {
        mapper = e => wrapArray(matchParentUp(e, el => testElementMatch(parentQuery, el)));
      } else {
        throw new Error("unknown type of $parent query:" + typeof parentQuery + ":" + JSON.stringify(parentQuery));
      }
    } else {
      mapper = e => testElementMatch(query, e) ? [e] : [];
    }
  } else {
    throw new Error("unknonw query:" + query);
  }

  let flatten = [];
  let result = anchor.map(mapper).filter(e => e != null);
  result.forEach(e => flatten.push(...e));
  return flatten;
}

function querySelectorAll(...queries) {
  return querySelectorAllOn(document, ...queries);
}

function querySelector(...queries) {
  return querySelectorOn(document, ...queries);
}

function querySelectorAllOn(el, ...queries) {
  if (queries.length === 0) {
    return undefined;
  }

  for (let query of queries) {
    el = queryMiscAll(el, query);
  }

  return el;
}

function querySelectorOn(el, ...queries) {
  return querySelectorAllOn(el, ...queries)?.[0];
}

function nothing() {}

async function sleep(n) {
  return new Promise(resolve => {
    setTimeout(resolve, n);
  });
} // total time: 1h


async function until(fn, limit, interval = 1000) {
  if (interval <= 0) {
    throw new Error("interval should be positive:" + interval);
  } // const limit = 60*60*1000 / interval


  let res = fn();

  if (res != null) {
    return res;
  }

  let times = 0;
  return new Promise((resolve, reject) => {
    let taskID;
    taskID = setInterval(() => {
      res = fn();

      if (res != null) {
        clearInterval(taskID);

        try {
          resolve(res);
        } catch (e) {
          reject(e);
        }

        return;
      }

      times++;

      if (times >= limit) {
        clearInterval(taskID);
        reject(new Error("cannot get result after " + times + " times, interval:" + intervalF));
      }
    }, interval);
  });
}