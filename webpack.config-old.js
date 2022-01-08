const path = require("path")

module.exports = {
entry: "./thrift-default",
	target:"es5",
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: './[name].js',
  library: '[name]',
 // libraryExport: 'default',
  // libraryTarget: 'es5', // you can use libraries everywhere, e.g requirejs, node 
  umdNamedDefine: true,
}
}
