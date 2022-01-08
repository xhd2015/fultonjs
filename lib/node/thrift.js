const path = require("path")
const {mkdir_p,escape, removeSuffix,exec,cat,touch} = require("./shell")
const axios  = require("axios")
// suppose thriftFile = base.thrift
// -out DIR
// final file = DIR/base.json
function genThriftToJSON(thriftFile,jsonFile){
	if(!thriftFile.endsWith(".thrift")){
		throw new Error("thrift file must end witH .thrift:" + thriftFile)
	}
	if(!jsonFile.endsWith(".json")){
		throw new Error("json file must end witH .json:" + jsonFile)
	}

	let jsonDir = path.dirname(jsonFile)
	mkdir_p(jsonDir)

	let thriftBase = path.basename(thriftFile)
	let jsonBase = path.basename(jsonFile)

	let thriftName = removeSuffix(thriftBase,".thrift")
	let jsonName = removeSuffix(jsonBase,".json")

	let cmd
	if(thriftName === jsonName){
		cmd = exec(`thrift -gen json -out ${escape(jsonDir)} ${escape(thriftFile)}`)
	}else{
		cmd = exec(`thrift -gen json -out ${escape(jsonDir)} ${escape(thriftFile)} && mv ${escape(jsonDir)}/${escape(thriftName)}.json ${escape(jsonDir)}/${escape(jsonName)}.json`)
	}
	if(cmd.errcode){
		throw cmd
	}
}

// generate to each  base.{method}.req.json  base.${method}.resp.json
function genMethodsSchema(jsonFile){
	let dir = path.dirname(jsonFile)
	let base = removeSuffix(jsonFile,".json")
	let content = cat(jsonFile)

	let definition = JSON.parse(content)
	let services = definition.services

	if(!services || services.length === 0){
		return
	}
	let service = services[0]
	let functions = service.functions || []
	for(let fun of functions){
		let method = fun.name
		let respType = fun.returnType
		let reqType = (fun.arguments||[])[0].type
		if(!respType || !reqType){
			throw new Error(`method:${method} lacks respType or reqType`)
		}
		let reqFile = `${base}.${method}.req.json`
		let respFile = `${base}.${method}.resp.json`
		let cmd = exec(`thrift2json -req -compress ${escape(jsonFile)} ${escape(reqType)}`,{env: { "RESULT_FILE": reqFile}, shell:"bash"})
		if(cmd.errcode){
			throw cmd
		}
		cmd = exec(`thrift2json -resp -compress ${escape(jsonFile)} ${escape(respType)}`,{env: { "RESULT_FILE": respFile}, shell:"bash"})
		if(cmd.errcode){
			throw cmd
		}
	}
	// change readable
	exec(`sudo chmod -R 666 ${escape(dir)}/*`)
}

// generate all method request and response schemas
function genThriftMethodsSchema(thriftFile,dir){
	let jsonFile = path.join(dir,removeSuffix(path.basename(thriftFile),".thrift") + ".json")
	genThriftToJSON(thriftFile,jsonFile)
	genMethodsSchema(jsonFile)
}

// CALLER=thriftcaller
//  settings: requestJsonSchema
//            responseJsonSchema
//            timeout
//            addr
//  example:
//  callThrift("project.service.admin", "List", {}, {
//       requestJsonSchema: cat("some.req.json"),
//       responseJsonSchema: cat("some.resp.json"),
//  })
async function callThrift(psm,method,args,settings){
	let arg = {psm, method, args:[{Req: args}], settings}

	let resp = await axios.post("http://127.0.0.1:8012/",arg)
	if(!resp.data){
		return resp
	}
	if(resp.data.code !== 0){
		return resp.data
	}
	let rpcData = resp.data.data
	if(rpcData.Success != null){
		rpcData = rpcData.Success
	}
	return rpcData
}

async function callThriftByFile(psm,method,args,base,options){
	let reqFile = `${base}.${method}.req.json`
	let respFile = `${base}.${method}.resp.json`

	let requestJsonSchema = JSON.parse(cat(reqFile))
	let responseJsonSchema = JSON.parse(cat(respFile))

	return await callThrift(psm,method,args,{requestJsonSchema,responseJsonSchema, ...options})
}

module.exports = {
	genThriftToJSON,
	genMethodsSchema,
	genThriftMethodsSchema,
	callThrift,
	callThriftByFile,
}
