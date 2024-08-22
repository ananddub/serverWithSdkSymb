function verifyObjFilter(obj1: any, obj2: any) {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
    }
    const key1 = Object.keys(obj1)
    const key2 = Object.keys(obj2)
    const min = Math.min(key1.length, key2.length)
    const objwillgo1 = key1.length === min ? obj1 : obj2
    const objwillgo2 = key1.length !== min ? obj1 : obj2
    for (let x of Object.keys(objwillgo1)) {
        if (objwillgo1[x] !== objwillgo2[x]) {
            return false
        }
    }
    return true;
}

