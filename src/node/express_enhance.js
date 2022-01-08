function isAsyncFuntion(f) {
	if (f === undefined) return false
	return Object.getPrototypeOf(async function () { }) === Object.getPrototypeOf(f)
}

function callHandler(handler, method, app, ...args) {
	if (!isAsyncFuntion(handler)) {
		method.call(app, ...args, handler)
	} else {
		// handle error to next
		method.call(app, ...args, function (req, res, next) {
			// handler is Promise
			handler(req, res, next).catch(next) // this is confirmed, will go here
		})
	}
}

function injectAsyncMethods(app) {
	app.getAsync = function (path, handler) {
		callHandler(handler, app.get, app, path)
	}
	app.postAsync = function (path, handler) {
		callHandler(handler, app.post, app, path)
	}
	app.useAsync = function (handler) {
		callHandler(handler, app.use, app)
	}
}

function callHandlerWithErrHandler(handler, errHandler,method, app, ...args) {
	if (!isAsyncFuntion(handler)) {
		try{
		  method.call(app, ...args, handler)
		}catch(err){
		  errHandler(err,req,res)
		}
	} else {
		// handle error to next
		method.call(app, ...args, function (req, res, next) {
			// handler is Promise
			handler(req, res, next).catch(err => errHandler(err,req,res)) // this is confirmed, will go here
		})
	}
}
// errHandler(err,req,res)
function injectAsyncMethodsWithErrorHandler(app, errHandler) {
	app.getAsync = function (path, handler) {
		callHandlerWithErrHandler(handler,errHandler, app.get, app, path)
	}
	app.postAsync = function (path, handler) {
		callHandlerWithErrHandler(handler, errHandler,app.post, app, path)
	}
	app.useAsync = function (handler) {
		callHandlerWithErrHandler(handler, errHandler,app.use, app)
	}
}

function requestLog(req, res, next) {
	console.log(`request received >>>> ${req.originalUrl}`)
	let start = Date.now()
	next()
	console.log(`request response <<<< ${req.originalUrl}, cost:${Date.now() - start}ms`)
}

module.exports = {
	injectAsyncMethods,
	injectAsyncMethodsWithErrorHandler,
	requestLog,
}
