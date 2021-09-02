import {reloadwholecalendar} from '../calendar.js'

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

export function createNewElementCustom(type, className="", id="", name="") {
    const element = document.createElement(type)
    if (!(className === "")) {
        element.className = className
    }
    if (!(id === 0)){
        element.id = id
    }
    if(!(name === "")) {
        element.name = name
    }
    return (element)
}

//////////////////////// GLOBAL VARIABLE INITIALISATION

const body = document.querySelector("body")
const csrftoken = document.getElementsByName('csrfmiddlewaretoken')[0].value

///////////////////////// CLOSES PANE 

export function closepane(elementid) {
    document.querySelector(`#${elementid}`).remove()
}

export function closepaneandreloadbookingpane(bookingid) {
    
    //this function is used by multiple panes so they wont all exist on the page. 
    try {
        document.querySelector('#partypanewrapper').remove()
    }
    catch {}
    
    try {
        document.querySelector('#paymentdetailswrapper').remove()
    }
    catch {}
    
    document.querySelector('#bookingpanewrapper').remove()
    reloadwholecalendar()
    displaybookingpane(bookingid)
}

export function startloadspinner() {
    const loadspinnerwrapper = document.createElement("div")
    loadspinnerwrapper.className = "panewrapper"
    loadspinnerwrapper.id = "loadspinnerwrapper"
    const loadspinner = document.createElement("div")
    loadspinner.innerHTML = '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>'
    body.append(loadspinnerwrapper)
    loadspinnerwrapper.append(loadspinner)
}

export function endloadspinner() {
    document.querySelector("#loadspinnerwrapper").remove()
}


