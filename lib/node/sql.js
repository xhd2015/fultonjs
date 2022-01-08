

function splitConditions(conds){
    let where = []
    let args = []
    conds.filter(e =>  e).forEach(e =>  {where.push(e[0]);  if(e.length>=2)args.push(e[1])})
    return {where,args}
}

function splitValues(conds){
    let columns = []
    let placeholders = []
    let args = []
    conds.filter(e =>  e).forEach(e =>  {columns.push(e[0]); placeholders.push("?");if(e.length>=2)args.push(e[1])})
    columns = columns.map(e => "`" + e + "`").join(",")
    placeholders = placeholders.join(",")
    return {columns,placeholders,args}
}

module.exports = {
    splitConditions,
    splitValues
}