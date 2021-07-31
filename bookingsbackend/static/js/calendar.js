/* 
JS for calendar.html
*/

//////////////////////// HELPER FUNCTION

"use strict"

function rfc3339(d) {
    
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

//////////////////////// GLOBAL VARIABLE INITIALISATION


// Global variable initialisation for selectbooking() function
let selectedbooking = ""
let selectstate = false

/////// WHAT IS TODAY IN THE EYES OF THE CALENDAR

// grab the queryString from the url
const queryString = window.location.search
// grab the searchparams from the querystring
const urlParams = new URLSearchParams(queryString)
// set today variable to either today or the startdate url get param. 
let today
if (urlParams.get("startdate")) {
    today = new Date(urlParams.get("startdate"))
} else {
    today = new Date(Date.now())
}

// set the date input to the value of startdate variable.
document.querySelector('#startdate').value = rfc3339(today).slice(0, 10)  //this grabs the first 10chars from the ISO string

// set default for activerate variable in createnewbooking form
let activerate = 1


//////// DATE ARRAY INITIALISATION 

// create a new JS date object for now.
let correcteddate = new Date(today)
// set it to midnight. 
correcteddate.setUTCHours(0, 0, 0, 0)
// create an epoch of that date
correcteddate = Date.parse(correcteddate)
// create a variable representing a day in milliseconds.
let millisecondsinaday = 86400000

// create and populate the datearray
let datearray = []
datearray.push(new Date(correcteddate))
for (let i = 1; i < 14; i++) {
    datearray.push(new Date(correcteddate+(i*millisecondsinaday)))
}

// initializes pitch array populated later
let pitcharray = []

// initializes consts for calendar div and calendar body, used later.
const calendar = document.querySelector('#calendar')

const calendarleft = document.createElement('div')
calendarleft.className = "calendarleft"
calendarleft.id = "calendarleft"

const calendarright = document.createElement('div')
calendarright.className = "calendarright"
calendarright.id = "calendarright"

const calendarheaderleft = document.createElement('div')
calendarheaderleft.className = "calendarheaderleft"
calendarheaderleft.id = "calendarheaderleft"

const calendarheaderright = document.createElement('div')
calendarheaderright.className = "calendarheaderright calendarrow"
calendarheaderright.id = "calendarheaderright"

const calendarbodyleft = document.createElement('div')
calendarbodyleft.className = "calendarbodyleft"
calendarbodyleft.id = "calendarbodyleft"

const calendarbodyright = document.createElement('div')
calendarbodyright.className = "calendarbodyright"
calendarbodyright.id = "calendarbodyright"

calendar.append(calendarleft)
calendar.append(calendarright)
calendarleft.append(calendarheaderleft)
calendarright.append(calendarheaderright)
calendarleft.append(calendarbodyleft)
calendarright.append(calendarbodyright)


/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */
/* ---------------------- START OF LOAD FLOW -------------------- */
/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */

////////////////////////// CALLED FIRST, SETS UP LEFT HAND COLUMN OF CALENDAR

// creates a date div at the top of the pitchtitlecolumn
let pitchtitlecolumnheader = document.createElement('div')
pitchtitlecolumnheader.className = "pitchtitle pitchtitleheader calendaritem"
calendarheaderleft.append(pitchtitlecolumnheader)

// get list of pitch types from server
async function fetchpitchtypes() {
    let response = await fetch("servepitchtypes", {
        method: "GET"
    })
    let pitchtypes = await response.json()
    return pitchtypes
}

// get list of pitches from server
async function fetchpitches() {
    let response = await fetch("servepitches", {
        method: "GET"
    })
    let pitches = await response.json()
    return pitches
}

async function setupcalendarrowtitles() {
    let pitchtypes = await fetchpitchtypes()
    let pitches = await fetchpitches()

    // add the pitches to the pitcharray[]
    for (let i = 0; i < pitches.length; i++) {
        let pitch = {
            "name": pitches[i].name,
            "type": pitches[i].type.id
        }
        pitcharray.push(pitch)
    }

    

    // add a div of rows to left & right of calendar for each pitchtype
    for (let i = 0; i < pitchtypes.length; i++) {
        let pitchtyperowheaderdiv = document.createElement("div")
        pitchtyperowheaderdiv.className = "pitchtyperowheaderdiv"
        pitchtyperowheaderdiv.id = `pitchtyperowheader-${pitchtypes[i].id}`
        pitchtyperowheaderdiv.innerHTML = `<p data-id="${pitchtypes[i].id}" class="pitchtyperowheadertitle">${pitchtypes[i].name}</p>`
        calendarbodyleft.append(pitchtyperowheaderdiv)

        // create a div to hold the pitches independent of the pitch type title.
        let pitchrowtitleholder = document.createElement("div")
        pitchrowtitleholder.className = "pitchrowtitleholder"
        pitchrowtitleholder.id = `pitchrowtitleholder-${pitchtypes[i].id}`
        pitchrowtitleholder.dataset.id = pitchtypes[i].id
        pitchtyperowheaderdiv.append(pitchrowtitleholder)

        let pitchrowholder = document.createElement("div")
        pitchrowholder.className = "pitchrowholder"
        pitchrowholder.id = `pitchrowholder-${pitchtypes[i].id}`
        pitchrowholder.dataset.id = pitchtypes[i].id
        pitchrowholder.innerHTML = `<p data-id="${pitchtypes[i].id}" class="pitchdivspacer"></p>`
        calendarbodyright.append(pitchrowholder)
    }
    
    // grab the pitchtypedivs
    let pitchholders = document.querySelectorAll('.pitchrowtitleholder')

    // then adds a row header for each pitch in the pitcharray
    for (let i = 0; i < pitcharray.length; i++) {
        let pitchtitle = document.createElement("div")
        pitchtitle.className = "pitchtitle calendaritem"
        pitchtitle.innerHTML = `Pitch ${pitcharray[i].name}`

        //find the target div
        let targetdiv = null 
        while (targetdiv === null) {  //whilst we've not already got the target div
            pitchholders.forEach((element) => { //check each pitchtypediv
                if (parseInt(element.dataset.id) === pitcharray[i].type) { ///for a match with the pitch.type
                    targetdiv = element //if a match is found set the targetdiv to that element which stops the loop
                }
            
            })
        }

        targetdiv.append(pitchtitle)
        //reset the target div to null
        targetdiv = null
    }

    
    
}

/////////////////////////// CALLED SECOND, SETS UP COLUMN HEADER ROW OF CALENDAR

function setupcalendarheader() {
    
    // for each day in the datearray...
    for (let j = 0; j < datearray.length; j++) {
        // create a column header
        let headerday = document.createElement('div')
        headerday.className = "calendaritem"
        headerday.innerHTML = `<p>${datearray[j].toDateString()}</p>`
        calendarheaderright.append(headerday)
    }
}

////////////////////// CALLED THIRD, SETS UP CALENDAR BODY

function setupcalendarbody() {

    // grab the pitchtypedivs
    let pitchholders = document.querySelectorAll('.pitchrowholder')

    // for each pitch in the pitch array, create the pitch row element...
    for (let i = 0; i < pitcharray.length; i++) {
        let pitch = document.createElement("div")
        pitch.className = "calendarrow"
        pitch.id = `pitchrow-${pitcharray[i].name}`
        pitch.dataset.pitch = pitcharray[i].name

        // then populate that element with date elements for each date in the date array...
        for (let j = 0; j < datearray.length; j++) {
            let day = document.createElement('div')
            day.className = "calendaritem calendarbodyitem"
            day.innerHTML = "<p></p>"
            day.setAttribute("data-pitch", pitcharray[i].name)
            day.setAttribute("data-date", Date.parse(datearray[j]))
            day.setAttribute("onclick", "launchcreatenewbooking(this)")
            pitch.append(day)
        }

        //find the target div
        let targetdiv = null 
        while (targetdiv === null) {  //whilst we've not already got the target div
            pitchholders.forEach((element) => { //check each pitchtypediv
                if (parseInt(element.dataset.id) === pitcharray[i].type) { ///for a match with the pitch.type
                    targetdiv = element //if a match is found set the targetdiv to that element which stops the loop
                }
            })
        }

        targetdiv.append(pitch)
        //reset the target div to null
        targetdiv = null
    }
}





//////////////////////// CALLED LAST, FETCHES BOOKINGS AND POPULATES CALENDAR WITH THOSE BOOKINGS

function fetchbookings() {
    
    // fetch call to servebookings to get a list of all bookings in the shown date range.
    fetch(`servebookings?start=${datearray[0].toISOString()}&end=${datearray[datearray.length - 1].toISOString()}`, {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        
        // TODO - this process can be optimized by getting all pitch divs first and only once, 
        // then checking the pitch list for the pitch div, then checking the pitch div for the calendar item.

        // for each booking...
        for (let i = 0; i < data.length; i++) {
            let bookingid = data[i].id
            let bookingstart = Date.parse(data[i].start)
            let bookingend = Date.parse(data[i].end)
            let bookingpitch = data[i].pitch.toString()
            // search the calendar for the pitch row div 
            let targetcalendarrow = document.querySelector(`#pitchrow-${bookingpitch}`)
            // get the calendar elements from that pitch row.
            let calendarcomponentarray = targetcalendarrow.querySelectorAll(".calendaritem")
            let balance = data[i].balance
            let checkedin = data[i].checkedin
            let locked = data[i].locked

            // for each calendar element in the target row.
            calendarcomponentarray.forEach(function(element) {
                let elementdate = parseInt(element.getAttribute("data-date"))
                // if the elementdate is within the booking range
                if (elementdate >= bookingstart && elementdate < bookingend) {
 
                    // style the booking alerts into the calendar
                    if (balance > 0.00) {
                        element.classList.add("balancedue")
                    }
                    else if (checkedin) {
                        element.classList.add("bookingcheckedin")
                    }
                    else {
                        element.classList.add("bookingnotcheckedin")
                    }

                    // give the elements some data attributes that are used later. 
                    element.setAttribute("data-bookingid", bookingid)

                    element.setAttribute("data-originalcolor", element.style.backgroundColor)
                                        
                    element.setAttribute("onclick", `selectbooking(${data[i].id})`)

                
                    // check if the booking is selected
                    if (selectstate === true && bookingid === selectedbooking) {
                        element.style.backgroundColor = "yellow"
                        element.dataset.state = "selected"
                    }
                    
                    // special logic for the first day of booking calendar render, e.g. booking surname and attribute graphic representation such as 'locked' padlock
                    if (elementdate == bookingstart) {
                        if (locked) {
                            element.innerHTML = `<p><i class="fas fa-lock"></i> ${data[i].guest.surname}</p>`
                        } else {
                            element.innerHTML = `${data[i].guest.surname}</p>`
                        }
                    }
                    element.classList.add('clickable')
                }
                
            })
        }   
    })
}

/////////////////////////// MAIN LOAD FLOW - calls the functions defined above in order.

document.addEventListener("DOMContentLoaded", async () => {
    startloadspinner()
    await setupcalendarrowtitles()
    setupcalendarheader()
    setupcalendarbody()
    //pre-loads one backward step 
    loadbackward()
    calendarinfinitescroll()
    endloadspinner()
    

})

/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */
/* --------------------- END OF LOAD FLOW ----------------------- */
/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */





////////////////////////// SELECT BOOKING FUNCTIONALITY

// variable initialization for select booking functionality.

const displaybutton = document.querySelector("#displaybutton")
const movebutton = document.querySelector("#movebutton")
const controlpanel = document.querySelector("#controlpanel")

function selectbooking(bookingid) {
    
    // grabs each pitch-day from calendar
    let bookingblocksoncalendar = document.querySelectorAll(".calendarbodyitem")

    // conditional first checks if a different booking is already selected
    if ((!(selectedbooking === bookingid)) && selectstate === true) {
                
        // checks each pitch-day to see if they are the selected booking and if so resets them
        bookingblocksoncalendar.forEach((element) => {
            if (element.dataset.bookingid === selectedbooking.toString()) {
                element.removeAttribute('data-state')
                element.style.backgroundColor = element.dataset.originalcolor
            }
        })
        
        // resets the controlpanel buttons (poss not necessary)
        displaybutton.removeAttribute("onclick")
        displaybutton.setAttribute("disabled", true)
        movebutton.removeAttribute("onclick")
        movebutton.setAttribute("disabled", true)

        // resets the selectstate to false
        selectstate = false
    }

    // sets the value of the selected booking var to match the clicked booking
    selectedbooking = bookingid
   
    // checks each pitch-day to see if they are the selected booking and if update their state & colour
    bookingblocksoncalendar.forEach((element) => {
        if (element.dataset.bookingid === selectedbooking.toString()) {
            if (element.dataset.state === "selected") {
                element.removeAttribute('data-state')
                element.style.backgroundColor = element.dataset.originalcolor
                selectstate = false
            }
            else {
                element.style.backgroundColor = "yellow"
                element.dataset.state = "selected"
                selectstate = true
            }
        }
    })

    // edit button components dependant on state.
    if (selectstate) {
        displaybutton.setAttribute("onclick", `displaybookingpane(${bookingid})`)
        displaybutton.removeAttribute("disabled")
        movebutton.setAttribute("onclick", `movebooking(${bookingid})`)
        movebutton.removeAttribute("disabled")
    } 
    else {
        displaybutton.removeAttribute("onclick")
        displaybutton.setAttribute("disabled", true)
        movebutton.removeAttribute("onclick")
        movebutton.setAttribute("disabled", true)
    }
}

////////////////////////// MOVE BOOKING FUNCTIONALITY

function movebooking(bookingid) {
    message = document.createElement("div")
    message.innerHTML = '<p class="message">Booking move in progress.  Select new start location</p>'
    controlpanel.append(message)
    // grab all the calendar day blocks and attach an event listener to each of them which will 
    // receive a click and indicate the desire start date.
    bookingblocksoncalendar = document.querySelectorAll(".calendaritem")
    bookingblocksoncalendar.forEach((element) => {
        // commit the existing onclick attribute to a dataset entry
        element.dataset.onclickattribute = element.getAttribute("onclick")
        // remove the existing onclick attribute
        element.removeAttribute("onclick")
        // add a new onclick event listener
        element.addEventListener("click", () => {
            // compile PATCH payload
            payload = {
                // from the clicked element, grab its date and pitch.
                newstart: element.dataset.date,
                newpitch: element.dataset.pitch
            }
            // submit the requested start date and pitch number to the server as PATCH
            fetch(`movebooking/${bookingid}`, {
                method: "PATCH",
                headers: {
                    "X-CSRFToken": csrftoken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then((response) => {
                // catch anything other than status 200 and error. 
                if (!(response.status === 200)) {
                    return alert("Booking move unsuccessful.  Please reload the page and try again")
                }
                else {
                    return response.json()
                }
            })    
            .then(data => {
                // reload the page
                document.location.reload()
            })
        })
    })
}

////////////////////////// LOAD BACKWARD DATES

// this function loads earlier dates. Called by infinite scroll functionality.
function loadbackward() {
    // grabs the first date in the datearray
    let firstDateRendered = datearray[0]
    // sets it to midnight.
    firstDateRendered.setUTCHours(0, 0, 0, 0)
    // initialises an array to store the forward dates and populates it.  
    let forwardDates = []
    for (let i = -7; i < 0; i++) {
        forwardDates.push(new Date(Date.parse(firstDateRendered)+(i*millisecondsinaday)))
    }
    
    //grab the calendar header
    let calendarheader = document.querySelector('#maincalendarheader')

    //grab the width of the calandar header row before addition to facilitate the reset of the scroll position later in this script
    const calendarbody = document.querySelector(".calendarright")
    const originalbodywidth = calendarbody.scrollWidth
    //grab the current scroll position before addition for later scroll position reset calculation.
    const originalscrollposition = calendarbody.scrollLeft
    
    //grab the calendar body
    let calendarrows = document.querySelectorAll('.calendarrow')
    
    calendarrows.forEach(function(element) {
        //extract pitch ID from row
        const pitchid = element.dataset.pitch
        
        //render the additions to each calendar row
        //if header row...
        if (element.getAttribute("id") == "calendarheaderright") {
            //create the divs and populate with the date string
            for (let j = 6; j >= 0; j--) {
                let calendaritem = document.createElement('div')
                calendaritem.className = "calendaritem"
                calendaritem.innerHTML = `<p>${forwardDates[j].toDateString()}</p>`
                element.prepend(calendaritem)
            }
        }

        //if not the header row...
        else {
            //create the divs and set the pitch, date and onclick attributes
            for (let j = 6; j >= 0; j--) {
                let calendaritem = document.createElement('div')
                calendaritem.className = "calendaritem calendarbodyitem"
                calendaritem.setAttribute("data-pitch", pitchid)
                calendaritem.setAttribute("data-date", Date.parse(forwardDates[j]))
                calendaritem.setAttribute("onclick", "launchcreatenewbooking(this)")
                element.prepend(calendaritem)
            }
        }

        //calculate the reset scroll position to ensure that the load doesn't cause the calendar to jump backwards
        const newcalendarbodywidth = calendarbody.scrollWidth
        //reset position
        calendarbody.scrollLeft = newcalendarbodywidth - originalbodywidth + originalscrollposition

    })

    //add the forwardDates array to the beginning of the datearray
    let newdatearray = forwardDates.concat(datearray)
    datearray = newdatearray
    
    //fetch the bookings update
    fetchbookings()

    
}

// this function loads later dates. Called by infinite scroll functionality.
function loadforward() {
    // grabs the last date in the datearray
    lastDateRendered = datearray[datearray.length - 1]
    // sets it to midnight.
    lastDateRendered.setUTCHours(0, 0, 0, 0)
    // initialises an array to store the forward dates and populates it.  
    let forwardDates = []
    for (i=1; i<8; i++) {
        forwardDates.push(new Date(Date.parse(lastDateRendered)+(i*millisecondsinaday)))
    }
    
    //grab the calendar header
    let calendarheader = document.querySelector('#maincalendarheader')

    //grab the calendar body
    let calendarrows = document.querySelectorAll('.calendarrow')
    calendarrows.forEach(function(element) {
        //extract pitch ID from row
        pitchid = element.dataset.pitch
        
        //render the additions to each calendar row
        //if header row...
        if (element.getAttribute("id") == "calendarheaderright") {
            //create the divs and populate with the date string
            for (j=0; j<7; j++) {
                let calendaritem = document.createElement('div')
                calendaritem.className = "calendaritem"
                calendaritem.innerHTML = `<p>${forwardDates[j].toDateString()}</p>`
                element.append(calendaritem)
            }
        }

        //if not the header row...
        else {
            //create the divs and set the pitch, date and onclick attributes
            for (j=0; j<7; j++) {
                let calendaritem = document.createElement('div')
                calendaritem.className = "calendaritem calendarbodyitem"
                calendaritem.setAttribute("data-pitch", pitchid)
                calendaritem.setAttribute("data-date", Date.parse(forwardDates[j]))
                calendaritem.setAttribute("onclick", "launchcreatenewbooking(this)")
                element.append(calendaritem)
            }
        }
    })

    //add the forwardDates array to the beginning of the datearray
    let newdatearray = datearray.concat(forwardDates)
    datearray = newdatearray
    
    //fetch the bookings update
    fetchbookings()

    
}




/////////// INFINITE HORIZONTAL SCROLL OF CALENDAR

// adds event listener to calendarbody to detect scroll to either edge of div.  
function calendarinfinitescroll() {  
    const calendarbodydiv = document.querySelector('.calendarright')
    const calendarbodydivwidth = calendarbodydiv.offsetWidth
    calendarbodydiv.addEventListener('scroll', () => {
        // if right edge...
        if (calendarbodydiv.scrollLeft === (calendarbodydiv.scrollWidth - calendarbodydivwidth)) {
            loadforward()
        }
        // if left edge...
        else if (calendarbodydiv.scrollLeft === 0) {
            loadbackward()
        }
    })
}














/////////////////////////// DISPLAYS BOOKING SUMMARY PANEL WHEN BOOKING IS CLICKED ON

function displaybookingpane(bookingid) {
    // build the booking pane wrapper and element.
    let bookingpanewrapper = document.createElement('div')
    bookingpanewrapper.className = "panewrapper"
    bookingpanewrapper.id = "bookingpanewrapper"

    let bookingpane = document.createElement('div')
    bookingpane.id = 'bookingpane'
    bookingpane.className = "pane"

    // fetch the booking details from the server.
    fetch(`booking/${bookingid}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        let bookingid = data.id
        let pitch = data.pitch
        let guestname = `${data.guest.firstname} ${data.guest.surname}`
        let arrival = new Date(data.start).toDateString()
        let departure = new Date(data.end).toDateString()
        let adults = data.adultno
        let children = data.childno
        let infants = data.infantno
        let pets = data.petno
        let vehicles = data.vehicleno
        let bookingrate = data.bookingrate
        let payments = data.totalpayments
        let balance = data.balance
        let comments = data.commentsbybooking
        let bookingparty = data.bookingparty
        let bookingvehicles = data.bookingvehicles
        let bookingpets = data.bookingpets
        let locked = data.locked
        let checkedin = data.checkedin

        // build the booking pane content.
        bookingpane.innerHTML = `
            <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(bookingpanewrapper)></i></p>
            <h3 id="bookingpanetitle">Booking ${bookingid}</h3>
            <div id="message" class="messagediv"></div>
            <div id="importantbookingcomments" class="messagediv"></div>
            <div class="basicbookinginfo"> 
                <div><p><strong>Lead Guest Name: </strong></p><p> ${guestname}</p></div>
                <div><p><strong>Pitch: </strong></p><p> ${pitch}</p></div>
                <div><p><strong>Arriving: </strong></p><p> ${arrival}</p></div>
                <div><p><strong>Departing: </strong></p><p> ${departure}</p></div>
            </div>
            <hr>
            <div id="loadpartybutton" class="panepartydetail clickable">
                <p class="partydetail"><i class="fas fa-male"></i> ${adults} |
                <i class="fas fa-child"></i> ${children} |
                <i class="fas fa-baby"></i> ${infants} | 
                <i class="fas fa-dog"></i> ${pets} |
                <i class="fas fa-car"></i> ${vehicles}</p>
            </div>
            <hr/>
            <div class="financesummary">
                <fieldset>
                    <legend>Finance Summary</legend>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <th>Cost</th>
                                <th>Payments</th>
                                <th>Balance</th>
                            </thead>
                            <tbody>
                                <td>£${bookingrate}</td>
                                <td>£${payments}</td>
                                <td id="balance">£${balance}</td>
                            </tbody>
                        </table>
                    </div>
                </fieldset>
            </div>
            <div class="controlbuttons">
                <button class="btn btn-secondary" onclick=loadpaymentdetail(${bookingid})>View Payments Detail</button>
                <button id="loadcommentsbutton" class="btn btn-secondary">View Comments</button>
            </div>
            `
        // compile the display
        bookingpanewrapper.append(bookingpane)
        body.append(bookingpanewrapper)

        // if balance is not zero, style accordingly.
        if (balance > 0) {
            document.querySelector("#balance").classList.add("overdue")
            document.querySelector("#message").innerHTML = `
                <div class="alert alert-danger" role="alert">
                There is an uninvoiced balance on this booking!
                </div>
            `
        }

        // add event listener to load comments button and pass in the comments. 
        let loadcommentsbutton = document.querySelector("#loadcommentsbutton")
        loadcommentsbutton.addEventListener("click", () => {
            loadcomments(bookingid, comments)
        })

        // add event listener to load party button and pass in the party details.         
        let loadpartybutton = document.querySelector("#loadpartybutton")
        loadpartybutton.addEventListener("click", () => {
            loadparty(arrival, departure, bookingparty, bookingpets, bookingvehicles, bookingid)
        })
        
        // visual indication in booking pane that booking is checked in.
        if (checkedin) {
            document.querySelector("#bookingpanetitle").className = "checkedin"
            document.querySelector(".panepartydetail").classList.add("checkedin")
        }

        let bookingpanetitle = document.querySelector("#bookingpanetitle")
        if (locked) {
            bookingpanetitle.innerHTML = bookingpanetitle.innerHTML + ` <i onclick="unlock(${bookingid})" class='fas fa-lock'></i>`
        }
        else {
            bookingpanetitle.innerHTML = bookingpanetitle.innerHTML + ` <i onclick="lock(${bookingid})" class='fas fa-lock-open'></i>`
        }

        // grab the comments div in the booking pane for update.
        let importantbookingcommentsdiv = document.querySelector("#importantbookingcomments")
        // check whether any of the booking comments are flagged as important
        for (let i=0; i<comments.length; i++) {
            if (comments[i].important) {
                let comment = document.createElement("p")
                comment.textContent = `${comments[i].comment}`
                comment.className = "alert alert-danger"
                importantbookingcommentsdiv.append(comment)
            }
        }
    })
}

// called when View Comments button pressed in booking pane. 
function loadcomments(bookingid, comments) {
    // build the comments pane wrapper and element
    const commentspanewrapper = document.createElement("div")
    commentspanewrapper.className = "panewrapper"
    commentspanewrapper.id = "commentspanewrapper"

    const commentspane = document.createElement("div")
    commentspane.id = "commentspane"
    commentspane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(commentspanewrapper)></i></p>
        <h3>Booking Comments <i onclick=addcomment(${bookingid}) class="fas fa-plus-circle"></i></h3>
        `
    // compile it on screen
    body.append(commentspanewrapper)
    commentspanewrapper.append(commentspane)

    // catch situations with no comments...
    if (comments.length === 0) {
        commentitem = document.createElement("div")
        commentitem.textContent = "There are no comments associated with this booking."
        commentspane.append(commentitem)
    }
    // otherwise, populate with the booking comments. 
    else {
        for (let i=0; i<comments.length; i++) {
            let commentitem = document.createElement("div")
            commentitem.textContent = `${comments[i].comment}`
            commentitem.setAttribute("role", "alert")
            if (comments[i].important) {
                commentitem.className = "alert alert-danger"
            }
            else {
                commentitem.className = "alert alert-secondary"
            }
            commentspane.append(commentitem)
        }
    }
}

function addcomment(bookingid, comments) {
    const newcommentpanewrapper = document.createElement("div")
    newcommentpanewrapper.className = "panewrapper";
    newcommentpanewrapper.id = "newcommentpanewrapper";

    const newcommentpane = document.createElement("div");
    newcommentpane.id = "commentspane";
    newcommentpane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(newcommentpanewrapper)></i></p>
        <h3>Add a New Comment</h3>
        <textarea id="newcommenttextarea" class="form-control" rows="3"></textarea>
        <div class="form-check">
            <input class="form-check-input" type="checkbox" value="" id="importantstatus">
            <label class="form-check-label" for="importantstatus">
                Important
            </label>
        </div>
        <button type="button" class="btn btn-secondary" onclick=createnewcomment(${bookingid})>Submit New Comment</button>
        `
    
    body.append(newcommentpanewrapper);
    newcommentpanewrapper.append(newcommentpane);
}

function createnewcomment(bookingid) {
    let newcomment = document.querySelector("#newcommenttextarea").value
    let importantstatus = document.querySelector("#importantstatus").checked
    
    let payload = {
        "bookingid": bookingid,
        "comment": newcomment,
        "important": importantstatus
    }

    fetch('createnewcomment', {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((response) => {
        // error check for unsuccessful status code. 
        if (!(response.status === 200)) {
            return alert("New comment addition unsuccessful.  Please reload the page and try again")
        }
        else {
            return response.json()
        }
    })    
    .then(data => {
        alert("New comment posted to booking.")
        // reload the booking pane which should show new party numbers. 
        closepane(bookingpanewrapper)
        displaybookingpane(bookingid)
    })
}

// called when Load Party button pressed in booking pane.
function loadparty(bookingstart, bookingend, bookingparty, bookingpets, bookingvehicles, bookingid) {
    // build the party pane wrapper and element. 
    const partypanewrapper = document.createElement("div")
    partypanewrapper.className = "panewrapper"
    partypanewrapper.id = "partypanewrapper"

    const partypane = document.createElement("div")
    partypane.id = "partypane"
    partypane.className = "pane"
    partypane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepaneandreloadbookingpane(${bookingid})></i></p>
        <h3>Party Details</h3>
        <div id="messagediv"></div>
        <div id="partydetails">
            <h4>People <i onclick="addpartyitem(this, ${bookingid})" data-type="member" class="fas fa-plus-circle"></i></h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <th>First Name</th>
                        <th>Surname</th>
                        <th>Arrival Date</th>
                        <th>Departure Date</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </thead>
                    <tbody id="partydetailstablebody">
                    </tbody>
                </table>
            </div>
        </div>
        <div id="partypets">
            <h4>Pets <i onclick="addpartyitem(this, ${bookingid})" data-type="pet" class="fas fa-plus-circle"></i></h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <th>Name</th>
                        <th>Arrival Date</th>
                        <th>Departure Date</th>
                        <th>Actions</th>
                    </thead>
                    <tbody id="partypetsdetailstablebody">
                    </tbody>
                </table>
            </div>
        </div>
        <div id="partyvehicles">
            <h4>Vehicles <i onclick="addpartyitem(this, ${bookingid})" data-type="vehicle" class="fas fa-plus-circle"></i></h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <th>Vehicle Registration</th>
                        <th>Arrival Date</th>
                        <th>Departure Date</th>
                        <th>Actions</th>
                    </thead>
                    <tbody id="partyvehiclesdetailstablebody">
                    </tbody>
                </table>
            </div>
        </div>
        `

    //comile them on the screen
    body.append(partypanewrapper)
    partypanewrapper.append(partypane)

    const partydetailstablebody = document.querySelector("#partydetailstablebody")

    // catch booking with no party members
    if (bookingparty.length === 0) {
        let partyitem = document.createElement("div")
        partyitem.textContent = "There are no party members associated with this booking."
        partydetailstablebody.append(partyitem)
    }

    // populate the pane with party members. 
    else {
        // for each person in the booking party, create a table row.
        for (let i=0; i<bookingparty.length; i++) {
            let partyitem = document.createElement("tr")
            // populate that row with <td> fields showing the party member details.  
            partyitem.innerHTML = `
                <td><input data-id="${bookingparty[i].id}" data-type="member" data-attribute="firstname" type="text" class="form-control" value="${bookingparty[i].firstname}"/>
                <td><input data-id="${bookingparty[i].id}" data-type="member" data-attribute="surname" type="text" class="form-control" value="${bookingparty[i].surname}"/></td>
                <td><input data-id="${bookingparty[i].id}" data-type="member" data-attribute="start" type="date" class="form-control" value="${bookingparty[i].start}"/></td>
                <td><input data-id="${bookingparty[i].id}" data-type="member" data-attribute="end" type="date" class="form-control" value="${bookingparty[i].end}"/></td>
                <td>
                    <select id="typeselect" data-id="${bookingparty[i].id}" data-type="member" data-attribute="type" type="text" class="form-control" value="${bookingparty[i].type}">
                        <option>Adult</option>
                        <option>Child</option>
                        <option>Infant</option>
                    </select>
                </td>
                <td><i data-id="${bookingparty[i].id}" data-type="member" class="fas fa-trash-alt deleteitem"></i></td>
            `
            // set the row id
            partyitem.id = `partymember-${bookingparty[i].id}`

            //set the rowclass
            partyitem.classList.add("partymember")

            // set a data attribute on the row
            partyitem.dataset.id = `${bookingparty[i].id}`
            
            // if the person is checked-in, style the row accordingly.  
            if (bookingparty[i].checkedin) {
                partyitem.className = "table-success"
            }
            
            // append the row to the table.
            partydetailstablebody.append(partyitem)

            // get the type select dropdown from the row
            let typeselect = partyitem.querySelector("#typeselect")
            
            // for each item in the typeselect options (3), check whether the textContent attribute matches the bookingparty.type and if so, set to selected
            for (let j=0; j<typeselect.length; j++) {
                if (typeselect.options[j].textContent === `${bookingparty[i].type}`) {
                    typeselect.options[j].setAttribute("selected", true)
                }
            }
        }
    }

    const petsdetailstablebody = document.querySelector("#partypetsdetailstablebody")
    
    // catch booking with no party vehicles
    if (bookingpets.length === 0) {
        let partyitem = document.createElement("tr")
        partyitem.textContent = "There are no pets associated with this booking."
        petsdetailstablebody.append(partyitem)
    }

    // populate pane with party pets
    else {
        for (let i=0; i<bookingpets.length; i++) {
            let partyitem = document.createElement("tr")
            partyitem.innerHTML = `
                <td><input data-id="${bookingpets[i].id}" data-type="pet" data-attribute="name" type="text" class="form-control" value="${bookingpets[i].name}"/></td>
                <td><input data-id="${bookingpets[i].id}" data-type="pet" data-attribute="start" type="date" class="form-control" value="${bookingpets[i].start}"/></td>
                <td><input data-id="${bookingpets[i].id}" data-type="pet" data-attribute="end" type="date" class="form-control" value="${bookingpets[i].end}"/></td>
                <td><i data-id="${bookingpets[i].id}" data-type="pet" class="fas fa-trash-alt deleteitem"></i></td>
            `
            if (bookingpets[i].checkedin) {
                partyitem.className = "table-success"
            }
            
            petsdetailstablebody.append(partyitem)
        }
    }

    const vehiclesdetailstablebody = document.querySelector("#partyvehiclesdetailstablebody")
    
    // catch booking with no party vehicles
    if (bookingvehicles.length === 0) {
        let partyitem = document.createElement("tr")
        partyitem.textContent = "There are no party vehicles associated with this booking."
        vehiclesdetailstablebody.append(partyitem)
    }

    // populate pane with party vehicles
    else {
        for (let i=0; i<bookingvehicles.length; i++) {
            let partyitem = document.createElement("tr")
            partyitem.innerHTML = `
                <td><input data-id="${bookingvehicles[i].id}" data-type="vehicle" data-attribute="vehiclereg" type="text" class="form-control" value="${bookingvehicles[i].vehiclereg}"/></td>
                <td><input data-id="${bookingvehicles[i].id}" data-type="vehicle" data-attribute="start" type="date" class="form-control" value="${bookingvehicles[i].start}"/></td>
                <td><input data-id="${bookingvehicles[i].id}" data-type="vehicle" data-attribute="end" type="date" class="form-control" value="${bookingvehicles[i].end}"/></td>
                <td><i data-id="${bookingvehicles[i].id}" data-type="vehicle" class="fas fa-trash-alt deleteitem"></i></td>
            `
            if (bookingvehicles[i].checkedin) {
                partyitem.className = "table-success"
            }
            
            vehiclesdetailstablebody.append(partyitem)
        }
    }
    //add update party item event listener to each input field in the party pane.  
    partypane.querySelectorAll("input").forEach(element => {
        element.addEventListener("change", () => {
            updatepartyitem(element, bookingid)
        })
    })
    partypane.querySelectorAll("select").forEach(element => {
        element.addEventListener("change", () => {
            updatepartyitem(element, bookingid)
        })
    })

    //add delete party item event listener to each input field in the party pane.       
    partypane.querySelectorAll(".deleteitem").forEach(element => {
        element.addEventListener("click", () => {
            deletepartyitem(element)
        })
    })
}




function addpartyitem(element, bookingid) {
    
    startloadspinner()
    
    let itemtypetobeadded = element.dataset.type

    let payload = {
        "bookingid"       : bookingid,
        "itemtype"        : itemtypetobeadded,
    }
    
    fetch("addpartyitem", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    .then((response) => {
        // error check for unsuccessful status code. 
        if (!(response.status === 202)) {
            alert("Party item addition unsuccessful.  Please reload the page and try again")
            return response.json()
        }
        else {
            return response.json()
        }
    })

    .then(data => {
        
        let bookingstart = data[0].fields.start
        let bookingend = data[0].fields.end

        let newrow = document.querySelector("tr")
        let targetdiv = ""
        if (itemtypetobeadded === "member") {
            targetdiv = document.querySelector("#partydetailstablebody")
            newrow.innerHTML = `
                <td><input data-id="${data[0].pk}" data-type="member" data-attribute="firstname" type="text" class="form-control"/>
                <td><input data-id="${data[0].pk}" data-type="member" data-attribute="surname" type="text" class="form-control"/></td>
                <td><input data-id="${data[0].pk}" data-type="member" data-attribute="start" type="date" class="form-control" value="${bookingstart}"/></td>
                <td><input data-id="${data[0].pk}" data-type="member" data-attribute="end" type="date" class="form-control" value="${bookingend}"/></td>
                <td>
                    <select id="typeselect" data-id="${data[0].pk}" data-type="member" data-attribute="type" type="text" class="form-control">
                        <option>Adult</option>
                        <option>Child</option>
                        <option>Infant</option>
                    </select>
                </td>
                <td><i data-id="${data[0].pk}" data-type="member" class="fas fa-trash-alt deleteitem"></i></td>
                `
        }
        else if (itemtypetobeadded === "pet") {
            targetdiv = document.querySelector("#partypetsdetailstablebody")
            newrow.innerHTML = `
                <td><input data-id="${data[0].pk}" data-type="pet" data-attribute="name" type="text" class="form-control"/></td>
                <td><input data-id="${data[0].pk}" data-type="pet" data-attribute="start" type="date" class="form-control" value="${bookingstart}"/></td>
                <td><input data-id="${data[0].pk}" data-type="pet" data-attribute="end" type="date" class="form-control" value="${bookingend}"/></td>
                <td><i data-id="${data[0].pk}" data-type="pet" class="fas fa-trash-alt deleteitem"></i></td>
        
                `
        }
        else {
            targetdiv = document.querySelector("#partyvehiclesdetailstablebody")
            newrow.innerHTML = `
                <td><input data-id="${data[0].pk}" data-type="vehicle" data-attribute="vehiclereg" type="text" class="form-control"/></td>
                <td><input data-id="${data[0].pk}" data-type="vehicle" data-attribute="start" type="date" class="form-control" value="${bookingstart}"/></td>
                <td><input data-id="${data[0].pk}" data-type="vehicle" data-attribute="end" type="date" class="form-control" value="${bookingend}"/></td>
                <td><i data-id="${data[0].pk}" data-type="vehicle" class="fas fa-trash-alt deleteitem"></i></td>
                `
        }
        targetdiv.append(newrow)
        
        //add update party item event listener to each input field in the party pane.  
        newrow.querySelectorAll("input").forEach(element => {
            element.addEventListener("change", () => {
                updatepartyitem(element, bookingid)
            })
        })
        newrow.querySelectorAll("select").forEach(element => {
            element.addEventListener("change", () => {
                updatepartyitem(element, bookingid)
            })
        })

        //add delete party item event listener to each input field in the party pane.       
        newrow.querySelectorAll(".deleteitem").forEach(element => {
            element.addEventListener("click", () => {
                deletepartyitem(element)
            })
        })
        endloadspinner()
    })
}   


// called when focus is removed from a input field in the party detail pane.  
function updatepartyitem(element, bookingid) {
    
    let payload = {
        "bookingid"       : bookingid,
        "itemid"          : element.dataset.id,
        "itemtype"        : element.dataset.type,
        "itemattribute"   : element.dataset.attribute,
        "newvalue"        : element.value,
    }
    
    startloadspinner()

    fetch("updatepartyitem", {
        method: "PATCH",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((response) => {
        // error check for unsuccessful status code. 
        if (!(response.status === 200)) {
            alert("Party update unsuccessful.  Please reload the page and try again")
            return response.json()
        }
        else {
            return response.json()
        }
    })
    .then(data => {
        endloadspinner()
    })
}

function deletepartyitem(element) {

    startloadspinner()

    let itemid = element.dataset.id
    let itemtype = element.dataset.type

    let payload = {
        "itemid": itemid,
        "itemtype": itemtype
    }

    fetch("deletepartyitem", {
        method: "DELETE",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((response) => {
        // error check for unsuccessful status code. 
        if (!(response.status === 200)) {
            alert("Party update unsuccessful.  Please reload the page and try again")
            return response.json()
        }
        else {
            element.parentElement.parentElement.remove()
            return response.json()
        }
    })
    .then(data => {
        endloadspinner()
    })
    }



function deletepartymember(element) {

    let payload = {
        "partymemberid": element.dataset.id
    }

    fetch("deletepartymember", {
        method: "DELETE",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((response) => {
        if (response.status === 200) {
            return response.json()
        }
        else {
            return 0
        }
    })
    .then(data => {
        element.remove()
    })
}


function updateGuest(bookingid) {
    let guestid = document.querySelector("#guestid").textContent
    
    let payload = {
        "newguestid": guestid
    }
    
    fetch(`amendbooking/${bookingid}`, {
        method: "PATCH",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((response) => {
        if (!(response.status === 200)) {
            return alert("Lead guest update unsuccessful.  Please reload the page and try again")
        }
        else {
            return response.json()
        }
    })    
    .then(data => {
        alert("Lead guest updated")
        closepane(bookingpanewrapper)
        displaybookingpane(bookingid)
    })
}

function updateStayDuration(bookingid) {
    let requestedduration = document.querySelector("#stayduration").value
    
    let payload = {
        "newduration": parseInt(requestedduration)
    }
    
    fetch(`amendbooking/${bookingid}`, {
        method: "PATCH",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then((response) => {
        if (!(response.status === 200)) {
            return alert("Duration amendment unsuccessful.  Are those nights available on this pitch?")
        }
        else {
            return response.json()
        }
    })    
    .then(data => {
        alert("Duration amendment successful.")
        closepane(bookingpanewrapper)
        displaybookingpane(bookingid)
    })
}   


///////////////////////// NEW BOOKING CREATION

// variable to hold array of available pitches
let availablepitches = ""
// instantiate variable to hold preferred pitch which controls the create booking pane default pitch option
let preferredpitch = 0

function launchcreatenewbooking(element) {
    
    let preferredpitch = element.getAttribute("data-pitch")
    let start = element.getAttribute("data-date")
    start = new Date(parseInt(start))
    start = start.toISOString().substring(0, 10)
    
    let bookingpanewrapper = document.createElement('div')
    bookingpanewrapper.className = "panewrapper"
    bookingpanewrapper.id = "bookingpanewrapper"

    let bookingpane = document.createElement('div')
    bookingpane.id = 'bookingpane'
    bookingpane.className = "pane"


    bookingpane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(bookingpanewrapper)></i></p>
        <h3>New Booking</h3>
        <hr>
        <div id="rateselectdiv" class="btn-group" role="group" aria-label="Select rate group"></div>
        
        <form autocomplete="off">
            <h5>Lead Guest</h5>
            <div id='guestsearch' class="form-floating mb-3">
                <input type="text" autocomplete="chrome-off" autofocus id="searchparam" class="form-control" onkeyup=guestsearch(this) autocomplete="off" placeholder="Email Address">
                <label for="searchparam">Email Address</label>
            </div>
            <div id="guestselect">
                <h9>Select Existing Guest</h9>
                <div id="searchresultsdiv"></div>
            </div>
            
            <hr>

            <h5>Unit</h5>
            <div id="unitselect" class="optionselect">
                
                <input type="radio" class="btn-check" name="unit-select" id="van" autocomplete="off" value="van" onchange=resetavailablepitches(${preferredpitch}) required>
                <label class="btn btn-outline-success unitselectbutton" for="van"><i class="fas fa-shuttle-van large"></i></label>

                <input type="radio" class="btn-check" name="unit-select" id="caravan" autocomplete="off" value="caravan" onchange=resetavailablepitches(${preferredpitch})>
                <label class="btn btn-outline-success unitselectbutton" for="caravan"><i class="fas fa-caravan large"></i></label>

                <input type="radio" class="btn-check" name="unit-select" id="trailertent" autocomplete="off" value="trailertent" onchange=resetavailablepitches(${preferredpitch})>
                <label class="btn btn-outline-success unitselectbutton" for="trailertent"><i class="fas fa-trailer large"></i></label>

                <input type="radio" class="btn-check" name="unit-select" id="tent" autocomplete="off" value="tent" onchange=resetavailablepitches(${preferredpitch})>
                <label class="btn btn-outline-success unitselectbutton" for="tent"><i class="fas fa-campground large"></i></label>

            </div>

            <div id="sizeselect" class="optionselect">
            
                <input type="radio" class="btn-check" name="size-select" id="large" autocomplete="off" value="large" onchange=resetavailablepitches(${preferredpitch}) required>
                <label class="btn btn-outline-secondary unitselectbutton" for="large">Large</label>

                <input type="radio" class="btn-check" name="size-select" id="small" autocomplete="off" value="small" onchange=resetavailablepitches(${preferredpitch})>
                <label class="btn btn-outline-secondary unitselectbutton" for="small">Small</label>
            </div>

            <div id="extraselect" class="optionselect">
            
                <input type="checkbox" class="btn-check" id="elec-select" autocomplete="off">
                <label class="btn btn-outline-secondary unitselectbutton" for="elec-select"><i class="fas fa-bolt large"></i></label>

                <input type="checkbox" class="btn-check" id="awning-select" autocomplete="off">
                <label class="btn btn-outline-secondary unitselectbutton" for="awning-select"><i class="fas fa-angle-up large"></i></label>

            </div>

            <hr>

            <h5>Stay Duration</h5>
            <div class="row">
                <div class="col">
                    <div class="form-floating mb-3">
                        <input type="date" class="form-control" id="arrival" onchange=recalculate() onblur=resetavailablepitches(${preferredpitch}) placeholder="Arrival Date" value="${start}" required>
                        <label for="arrival">Arrival Date: </label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating mb-3">
                        <input type="date" class="form-control" id="departure" onchange=recalculate() onblur=resetavailablepitches(${preferredpitch}) placeholder="Departure Date" required>
                        <label for="departure">Departure Date: </label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating mb-3">
                        <select name="pitch" class="form-control" id="pitchselect" required>
                            <!-- options populate here -->
                        </select>
                        <label for="arrival">Pitch: </label>
                    </div>
                </div>   
            </div>

            <hr>
            
            <h5>Party Details</h5>
            <div class="row">
                <div class="col">
                    <div class="form-floating mb-3">
                        <input onchange=recalculate() class="form-control" type="text" id="adultno" placeholder="Adults" required>
                        <label for="adultno">Adults</label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating mb-3">
                        <input onchange=recalculate() class="form-control" type="text" id="childno" placeholder="Children" required>
                        <label for="childno">Children</label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating mb-3">
                        <input onchange=recalculate() class="form-control" type="text" id="infantno" placeholder="Infants" required>
                        <label for="infantno">Infants</label>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col">
                    <div class="form-floating mb-3">
                        <input onchange=recalculate() class="form-control" type="text" id="petno" placeholder="Pets" required>
                        <label for="petno">Pets</label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating mb-3">
                        <input onchange=recalculate() class="form-control" type="text" id="vehicleno" placeholder="vehicle" required>
                        <label for="vehicleno">Vehicles</label>
                    </div>
                </div>
            </div>

            <hr>

            <div id="newbookingextrasdiv">
                <p onclick=addextra()>Add extra</p>
                <div id="extras">
                    <table id="extratable">
                    </table>
                </div>
            </div>
            
            <hr>

            <h5>Fee: </h5>
            <p style="display: inline-block">£</p><p style="display: inline-block" id="rate">-</p>

            <div class="row">
                <div class="col">
                    <div class="form-floating mb-3">
                        <input type=number class="form-control" step="0.01" min=0 id="paid" placeholder="Paid" required>
                        <label for="paid"> Paid £</label>
                    </div>
                </div>
                <div class="col">
                    <div class="form-floating mb-3">
                        <select name="paymentmethod" class="form-control" id="paymentmethod">
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="BACS">BACS</option>
                        </select>
                        <label for="paymentmethod"> Payment Method</label>
                    </div>
                </div>
            </div>

            <button id="submitnewbookingbutton" class="btn btn-secondary" onclick=createnewbooking() disabled>Submit</button>
        
        </form>
        `
    
    bookingpanewrapper.append(bookingpane)
    body.append(bookingpanewrapper)
    let rateselectdiv = document.querySelector("#rateselectdiv")

    //grab the available rate types.
    fetch('fetchratetypes', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        
        for (let i=0; i<data.length; i++) {
            let rateoptionbutton = document.createElement("input")
            rateoptionbutton.type = "radio"
            rateoptionbutton.className = "btn-check"
            rateoptionbutton.name = "rate-options"
            rateoptionbutton.id = `${data[i].name}`
            rateoptionbutton.setAttribute("autocomplete", "off")
            rateoptionbutton.value = `${data[i].name}`
            rateoptionbutton.dataset.id = `${data[i].id}`
            rateoptionbutton.setAttribute("onClick", "setrate(this)")
            
            if (i === 0) {
                rateoptionbutton.checked = true
            }
            
            let rateoptionbuttonlabel = document.createElement("label")
            rateoptionbuttonlabel.className = "btn btn-outline-success" 
            rateoptionbuttonlabel.htmlFor = `${data[i].name}`
            rateoptionbuttonlabel.textContent = `${data[i].name}`

            rateselectdiv.append(rateoptionbutton)
            rateselectdiv.append(rateoptionbuttonlabel)
        }
    })
}

function setrate(button) {
    activerate = button.dataset.id
    recalculate()
}

function guestsearch(element) {
    let searchresultsdiv = document.querySelector('#searchresultsdiv')
    searchresultsdiv.innerHTML = ""
    let searchparam = element.value
    if (searchparam.length == 0) {
        return
    }

    fetch(`guestsearch?search=${searchparam}`)
    .then(response => response.json())
    .then(data => {
        if (data.length > 0) {
            for (let i=0; i < data.length; i++) {
                let result = document.createElement('div')
                result.innerHTML = `<p data-id="${data[i].id}" onclick=selectguest(this)>${data[i].firstname} ${data[i].surname} - ${data[i].email}</p>`
                searchresultsdiv.append(result)
            }
        }
        else {
            let result = document.createElement('div')
            result.innerHTML = `<p onclick=createnewguestform()>No existing guests found.  Click here to create one.</p>`
            searchresultsdiv.append(result)
        }
        
    })

}

function selectguest(element) {
    let customerid = element.getAttribute("data-id")
    let guestdetails = document.querySelector('#guestselect')
    guestdetails.innerHTML = ""

    fetch(`guest/${customerid}`)
    .then(response => response.json())
    .then(data => {
        guestdetails.innerHTML = `
            <div class="row">
                <div class="col">
                    <p><strong>Name: </strong>${data.firstname} ${data.surname}</h4><p id="guestid" style="display: none;">${data.id}<p>
                </div>
                <div class="col">
                    <p><strong>Email: </strong>${data.email}</p>
                </div>
                <div class="col">
                    <p><strong>Telephone: </strong>${data.telephone}</p>
                </div>
            </div>
            `
        document.querySelector('#guestsearch').remove()
        document.querySelector('#submitnewbookingbutton').removeAttribute("disabled")
    })
}


//launches and populates the create new guest element of the form
function createnewguestform() {
    let guestemail = document.querySelector('#searchparam').value
    let guestdetails = document.querySelector('#guestselect')
    guestdetails.innerHTML = `
        <h8>Create New Lead Guest</h8>
        <div class="row">
            <div class="col">
                <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="firstname" placeholder="First name">
                    <label for="firstname">First name</label>
                </div>
            </div>
            <div class="col">
                <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="surname" placeholder="Surname">
                    <label for="surname">Surname</label>
                </div>
            </div>
            <div class="col">
                <div class="form-floating mb-3">
                    <input type="text" class="form-control" id="telephone" placeholder="Telephone">
                    <label for="telephone">Telephone</label>
                </div>
            </div>
            <div class="col">
                <div class="form-floating mb-3">
                    <input type="email" class="form-control" id="email" value="${guestemail}">
                    <label for="email">Email</label>
                </div>
            </div>
            
            <button type="button" class="btn btn-secondary" onclick=createguest()>Create New Lead Guest</button>


        `
    document.querySelector('#guestsearch').remove()
}

//sends the new guest creation POST request to the server
function createguest() {
    let firstname = document.querySelector('#firstname').value
    let surname = document.querySelector('#surname').value
    let telephone = document.querySelector('#telephone').value
    let email = document.querySelector('#email').value

    const payload = {
        'firstname': firstname,
        'surname': surname,
        'email': email,
        'telephone': telephone
    }

    fetch("createnewguest", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        guestdetails.innerHTML = `
            <h4>${data.firstname} ${data.surname}</h4>
            <p id="guestid" style="display: none;">${data.id}<p>
            <p><strong>Email: </strong>${data.email}</p>
            <p><strong>Telephone: </strong>${data.telephone}</p>
        `
    })
}

function resetavailablepitches(preferredpitch) {

    let availablepitches = ""
    let start   = document.querySelector('#arrival').value
    let end     = document.querySelector('#departure').value
    let unit    = null
    let unitoptions = document.getElementsByName("unit-select")
    
    unitoptions.forEach((option) => {
        if (option.checked) {
            unit = option.value
        }
    })
    
    let size    = null
    let sizeoptions = document.getElementsByName("size-select")

    sizeoptions.forEach((option) => {
        if (option.checked) {
            size = option.value
        }
    })
    
    let ehu     = document.querySelector('#elec-select').checked
    let awning  = document.querySelector('#awning-select').checked
    
    fetch(`serveavailablepitchlist?start=${start}&&end=${end}&&unit=${unit}&&size=${size}&&ehu=${ehu}&&awning=${awning}`)
    .then(response => response.json())
    .then(data => {
        if (data.length === 0) {
            availablepitches += `<option value="0">No availability</option>`
        }
        else {
            for (let i=0; i < data.length; i++) {
                availablepitches += `<option value=${data[i].pk}>${data[i].fields.name}</option>`
            }
        }
        document.querySelector('#pitchselect').innerHTML = availablepitches
        if (availablepitches.includes(preferredpitch)) {
            document.querySelector('#pitchselect').value = preferredpitch
        }
        
    })
}

function createnewbooking() {
    //extract values from booking form
    const guestid = document.querySelector("#guestid").textContent
    const arrival = document.querySelector("#arrival").value
    const departure = document.querySelector("#departure").value
    const pitchid = document.querySelector("#pitchselect").value
    const adultno = document.querySelector("#adultno").value
    const childno = document.querySelector("#childno").value
    const infantno = document.querySelector("#infantno").value
    const petno = document.querySelector("#petno").value
    const vehicleno = document.querySelector("#vehicleno").value
    const bookingratetype = activerate
    const bookingrate = document.querySelector("#rate").innerHTML
    const bookingpaid = document.querySelector("#paid").value
    const paymentmethod = document.querySelector("#paymentmethod").value

    //compile post payload
    const payload = {
        guestid: guestid,
        arrival: arrival,
        departure: departure,
        pitchid: pitchid,
        adultno: adultno,
        childno: childno,
        infantno: infantno,
        petno: petno,
        vehicleno: vehicleno,
        bookingratetype: bookingratetype,
        bookingrate: bookingrate,
        bookingpaid: bookingpaid,
        paymentmethod: paymentmethod
    }

    //fetch request to api endpoint
    fetch("createnewbooking", {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => console.log(data))
}

function recalculate() {

    //obtain the necessary info from new booking form for rates query
    let bookingstart        = document.querySelector("#arrival").value
    let bookingend          = document.querySelector("#departure").value
    let adultno             = document.querySelector("#adultno").value
    let childno             = document.querySelector("#childno").value
    let infantno            = document.querySelector("#infantno").value
    let petno               = document.querySelector("#petno").value
    let vehicleno           = document.querySelector("#vehicleno").value
    
    // wait until all the required info is present before presenting to the server for rate.
    if (bookingstart && bookingend && adultno && childno && infantno && petno && vehicleno) {
        fetch(`fetchrate?ratetype=${activerate}&start=${bookingstart}&end=${bookingend}`, {
            method: "GET",
        })

        .then(response => response.json())
        .then(data => {
            
            //initialize a new variable to hold the rates array for the dates selected (dict type)
            let rates = {}
            
            //data returned from server may include more than one rate record, therefore the following is done for each rate record returned, effectively merging the returned rates into one data structure 
            for (let i=0; i < data.length; i++) {
                //get the start of the rates period
                let ratestartdate = new Date(data[i].fields.start)
                //get the end of the rates period
                let rateenddate = new Date(data[i].fields.end)
                //get the pax rates for that period.
                let adultrate = data[i].fields.adult
                let childrate = data[i].fields.child
                let infantrate = data[i].fields.infant
                let petrate = data[i].fields.pet
                let vehiclerate = data[i].fields.vehicle
                
                /*
                the following loop creates a JS object in the form of a Dict.  Structure is as follows:
                day 1 in period : 
                    adult : adultRateInt
                    child : childRateInt
                    infant: infantRateInt
                day 2 in period :
                    ...
                    ...
                    ...
                */
                for (let date=ratestartdate; date<rateenddate; date.setDate(date.getDate() + 1)) { //the incrementer increases the date by one
                    let formatteddate = date.toDateString()
                    rates[formatteddate] = {
                        "adult": adultrate,
                        "child": childrate,
                        "infant": infantrate,
                        "pet": petrate,
                        "vehicle": vehiclerate
                    }
                }
            }
            //initialize var to hold calculated price.
            let price = 0

            //for loop calculates value of booking. 
            //takes start date uses that as iterable for loop adding one day until end date
            for (let date = new Date(bookingstart); date < new Date(bookingend); date.setDate(date.getDate() + 1)) {
                //multiples number of adults by int in rates array for date and adds to price var.
                price = price + rates[date.toDateString()].adult * Number(adultno)
                //multiples number of children by int in rates array for date and adds to price var.
                price = price + rates[date.toDateString()].child * Number(childno)
                //multiples number of infants by int in rates array for date and adds to price var.
                price = price + rates[date.toDateString()].infant * Number(infantno)
                //multiples number of pets by int in rates array for date and adds to price var.
                price = price + rates[date.toDateString()].pet * Number(petno)
                //multiples number of vehicles by int in rates array for date and adds to price var.
                price = price + rates[date.toDateString()].vehicle * Number(vehicleno)
            }
            
            //updates the final price into the rate div in booking form.  
            document.querySelector("#rate").innerHTML = `${price}`


        })
    }
}

/////////////////////////////////////////////


function loadpaymentdetail(bookingid) {
    fetch(`servepaymentinfo/${bookingid}`)
    .then(response => response.json())
    .then(data => {
        let paymentdetailslayer = document.createElement("div")
        paymentdetailslayer.className = "panewrapper"
        paymentdetailslayer.id = "paymentdetailswrapper"

        let paymentdetails = document.createElement("div")
        paymentdetails.className = "paymentdetails"
        paymentdetails.innerHTML = `<p class="closebutton" ><i class="far fa-times-circle" onclick=closepane(paymentdetailswrapper)></i></p><h2>Payment Details</h2><i onclick=addpayment(${bookingid}) class="fas fa-plus-circle"></i>`
        
        let paymentdetailstable = document.createElement("table")
        paymentdetailstable.className = "table table-striped"
        let paymentdetailstableheader = document.createElement("thead")
        paymentdetailstableheader.innerHTML = `
            <th>Payment Date</th>
            <th>Payment ID</th>
            <th>Payment Value</th>
            <th>Payment Method</th>
            <th>Delete or Edit Payment</th>
            `
        
        let paymentdetailstablebody = document.createElement("tbody")
        paymentdetailstablebody.id = "paymenttablebody"
        
        for (let i=0; i<data.length; i++) {
            let payment = document.createElement("tr")
            payment.setAttribute("id", `payment-${data[i].id}`)
            payment.className = "individualpayment"
            paymentcreationdate = new Date(data[i].creationdate)
            payment.innerHTML = `
                <td>${paymentcreationdate.toDateString()}</td>
                <td>${data[i].id}</td>
                <td>£${data[i].value}</td>
                <td>${data[i].method}</td>
                <td><i onclick='editpayment("${paymentcreationdate.toISOString().substring(0, 10)}", ${data[i].id}, ${data[i].value}, "${data[i].method}", ${bookingid})' class="fas fa-edit"></i> <i onclick='deletepayment(${data[i].id}, ${bookingid})' class="fas fa-trash-alt"></i></td>
            `
            paymentdetailstablebody.append(payment)
            }

        paymentdetailslayer.append(paymentdetails)
        paymentdetails.append(paymentdetailstable)
        paymentdetailstable.append(paymentdetailstableheader)
        paymentdetailstable.append(paymentdetailstablebody)
        body.append(paymentdetailslayer)

    })
}

function editpayment(paymentcreationdate, paymentid, paymentvalue, paymentmethod, bookingid) {
    let payment = document.querySelector(`#payment-${paymentid}`)
    payment.innerHTML = `
        <td><input type="date" name="paymentdate" id="editedpaymentdate" value=${paymentcreationdate}></input></td>
        <td>${paymentid}</td>
        <td>£<input type="number" step=0.01 id="editedpaymentvalue" value=${paymentvalue}></input></td>
        <td>
            <select name="method" id="editedpaymentmethod" value=${paymentmethod}>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
                <option value="BACS">BACS</option>
            </select>
        </td>
        <td><i onclick='savepayment(${paymentid}, ${bookingid})' class="fas fa-save"></i>Click to save changes</td>
        `
}

function savepayment(paymentid, bookingid) {
    let editedpaymentdate = document.querySelector("#editedpaymentdate").value
    let editedpaymentvalue = document.querySelector("#editedpaymentvalue").value
    let editedpaymentmethod = document.querySelector("#editedpaymentmethod").value
    
    let payload = {
        "pk": paymentid,
        "creationdate": editedpaymentdate,
        "value": editedpaymentvalue,
        "method": editedpaymentmethod
    }

    fetch('amendpayment', {
        method: "PATCH",
        headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        response.json()
        if (response.status === 200) {
            document.querySelector("#paymentdetailswrapper").remove()
            document.querySelector("#bookingpanewrapper").remove()
            displaybookingpane(bookingid)
        }
        
    })
}

function deletepayment(paymentid, bookingid) {
    fetch(`deletepayment/${paymentid}`, {
        method: "DELETE",
        headers: {
            "X-CSRFToken": csrftoken
        }
    })
    .then (response => {
        if (response.status === 202) {
            return response.json()
        }    
    })
    .then(data => {
        document.querySelector("#paymentdetailswrapper").remove()
        document.querySelector("#bookingpanewrapper").remove()
        displaybookingpane(bookingid)
    })
}

function addpayment(bookingid) {
    let newpaymentline = document.createElement("tr")
    newpaymentline.setAttribute("id", "newpaymentline")
    newpaymentline.innerHTML = `
        <td><input type="date" id="newpaymentdate"></input></td>
        <td>New</td>
        <td>£<input type="number" id="newpaymentvalue" step="0.01" placeholder="0.00"</td>
        <td>
            <select name="method" id="newpaymentmethod">
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="BACS">BACS</option>
            </select>
        </td>
        <td><i onclick=savenewpayment(${bookingid}) class="fas fa-save"></i> Click here to save payment</td>
        `
    let table = document.querySelector("#paymenttablebody")
    table.append(newpaymentline)
    document.querySelector("#newpaymentdate").valueAsDate = new Date() 
}

function savenewpayment(bookingid) {
    let newpaymentdate = document.querySelector("#newpaymentdate").value
    let newpaymentvalue = document.querySelector("#newpaymentvalue").value
    let newpaymentmethod = document.querySelector("#newpaymentmethod").value
    
    let payload = {
        "bookingid": bookingid,
        "date": newpaymentdate,
        "value": newpaymentvalue,
        "method": newpaymentmethod
    }

    fetch('createnewpayment', {
        method: "POST",
        headers: {
            "X-CSRFToken": csrftoken,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        response.json()
        if (response.status !== 200) {
            alert("payment registration unsuccessful")
        }
    })
    .then(data => {
        closepaneandreloadbookingpane(bookingid)
    })

}

function addextra(extras) {
    fetch('serveextras', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        //when the button is pressed, add a row to the extras table.
        let extrarow = document.createElement('tr')
        extrarow.setAttribute("id", "live")
        let extrasoptions = document.createElement("select")
        for (let i = 0; i < data.length; i++) {
            let option = document.createElement("option")
            option.innerHTML = data[i].fields.name
            option.value = data[i].fields.pk
            extrasoptions.append(option)
        }
        // add a 'placeholder' into the select options inviting the user to select an extra from the list. 
        let option = document.createElement("option")
        option.innerHTML = "Select an extra"
        option.setAttribute("hidden", true)
        option.setAttribute("selected", true)
        extrasoptions.append(option)
        
        extrarow.innerHTML = `
            <td class='extraname'></td>
            <td class='extraquantity'>Quantity</td>
            <td class='extracost'>Cost</td>
            <td class='extracostbasis'>Cost Basis</td>
            <td class='extratotal'>Total</td>
        `
        let extratable = document.querySelector("#extratable")
        extratable.append(extrarow)
        let livetr = document.querySelector("#live")
        livetr.setAttribute("id", "")
        livetr.querySelector('.extraname').append(extrasoptions)

    })
}

function repositioncalendar() {
    let repositiondate = document.querySelector('#startdate').value
    window.location.href = `?startdate=${repositiondate}`
}

//this function reloads the whole calendar render when things have changed.  
function reloadwholecalendar() {
    startloadspinner()
    //reset the whole calandar to blank
    document.querySelectorAll(".calendarbodyitem").forEach((element) => {
        element.innerHTML = ""
        element.className = "calendaritem calendarbodyitem"
        element.setAttribute("onclick", "launchcreatenewbooking(this)")
        element.removeAttribute("data-bookingid")
        element.removeAttribute("data-originalcolor")
        element.removeAttribute("style")
        element.removeAttribute("data-state")
    })
    fetchbookings()
    selectbooking(selectedbooking)
    endloadspinner()

}