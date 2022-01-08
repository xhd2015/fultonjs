const axios = require("axios")

async function genid(){
	let psmAddr = await axios.get("http://127.0.0.1:8000/fetch/get-psm-addr?_=project.webarch.idgenerator_proxy")
	let addr
	if(psmAddr.data && psmAddr.data.length > 0 && psmAddr.data[0].addr){
		addr = psmAddr.data[0].addr
	}
	if(!addr){
		throw new Error("cannot get proxy address")
	}
	let ID
	await axios.get("http://" + addr + "/gen?ns=global&cs=default",{ transformResponse(data){
		ID = data
	}})
	return ID
}


module.exports = {
	genid,
}

