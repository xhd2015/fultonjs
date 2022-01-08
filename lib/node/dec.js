const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const base64url = require('base64url')

function hash(data,code){
	let _hash = crypto.createHash(code)
	_hash.update(data)
	return _hash.digest('hex')
}

function hashsha256(data){
	return hash(data,'sha256')
}
function randomNumber(){
	return (Math.random()*10000000 + 1000).toFixed()
}
function randomString(){
	return hashsha256(String(randomNumber()))
}

function randomShortString(){
	return hashsha256(String(randomNumber())).slice(0,16)
}

// payload can have exp:Math.floor(Date.now() / 1000) + (60 * 60), to expire in
// an hour
function signJWT(payload,secret){
     return jwt.sign(payload,secret);
}

function validateJWT(token,secret){
     return jwt.verify(token,secret)
}

function base64DecodeUrlsafe(s){
	return base64url.decode(s)
}
function base64EncodeUrlSafe(s){
	return base64url(s)
}
function decodeJWTPayload(token){
	let fragments = token.split(".")
	if(fragments.length!=3){
		throw "invalid jwt token:" + token
	}
	return JSON.parse(base64DecodeUrlsafe(fragments[1]))
}

module.exports = {
	hash,
	hashsha256,
	randomNumber,
	randomString,
	randomShortString,
	signJWT,
	validateJWT,
	base64DecodeUrlsafe,
	base64EncodeUrlSafe,
	decodeJWTPayload,
}
