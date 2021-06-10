
//////////////////////// GLOBAL VARIABLE INITIALISATION

const body = document.querySelector("body")
csrftoken = document.getElementsByName('csrfmiddlewaretoken')[0].value

///////////////////////// CLOSES PANE 

function closepane(elementname) {
    elementname.remove()
}