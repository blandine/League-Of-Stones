module.exports ={
    all_different(array) {
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
    
}
