
//////////////////////// GLOBAL VARIABLE INITIALISATION

const body = document.querySelector("body")
csrftoken = document.getElementsByName('csrfmiddlewaretoken')[0].value

///////////////////////// CLOSES PANE 

function closepane(elementname) {
    elementname.remove()
}

function closepaneandreloadbookingpane(bookingid) {
    
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

function startloadspinner() {
    loadspinnerwrapper = document.createElement("div")
    loadspinnerwrapper.className = "panewrapper"
    loadspinnerwrapper.id = "loadspinnerwrapper"
    loadspinner = document.createElement("div")
    loadspinner.innerHTML = '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>'
    body.append(loadspinnerwrapper)
    loadspinnerwrapper.append(loadspinner)
}

function endloadspinner() {
    document.querySelector("#loadspinnerwrapper").remove()
}

