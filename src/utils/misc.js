const i18nEn = require("./en.json");

 function all_different(array) {
        var ids = {};
        for (var elem of array) {
            if (ids[elem.key] === undefined) {
                ids[elem.key] = elem;
            } else {
                return false;
            }
        }
        return true;
    }

function pathbuilder( prev,curr){
   return prev ? prev[curr] : null
}

function $t(errorKey, param){
    const value = errorKey.split('.').reduce(pathbuilder, i18nEn)
    if(param){
        const paramName = Object.keys(param)[0]
        if(paramName){
            const re = new RegExp(`\{${paramName}\}`, 'g');
            value = value.replace(re,param[paramName])
        }else{
            throw new Error("Error parameter is not defined")
        }
    }
    return value
}

module.exports ={
    all_different,
    $t
}
