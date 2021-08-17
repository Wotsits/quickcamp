/////////File defines helper functions used globally and imported.

export function rfc3339(d) {
    
    function pad(n) {
        return n < 10 ? "0" + n : n;
    }

    function timezoneOffset(offset) {
        let sign;
        if (offset === 0) {
            return "Z";
        }
        sign = (offset > 0) ? "-" : "+";
        offset = Math.abs(offset);
        return sign + pad(Math.floor(offset / 60)) + ":" + pad(offset % 60);
    }

    return d.getFullYear() + "-" +
        pad(d.getMonth() + 1) + "-" +
        pad(d.getDate()) + "T" +
        pad(d.getHours()) + ":" +
        pad(d.getMinutes()) + ":" +
        pad(d.getSeconds()) + 
        timezoneOffset(d.getTimezoneOffset());
}

export function createNewElementCustom(type, className="", id="") {
    const element = document.createElement(type)
    if (!(className === "")) {
        element.className = className
    }
    if (!(id === 0)){
        element.id = id
    }
    return (element)
}
