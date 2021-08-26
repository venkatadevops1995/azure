export const getFormDataFromObject = (obj)=>{
    let fd = new FormData()
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const data = obj[key];
            fd.append(key,data)
        }
    }
}