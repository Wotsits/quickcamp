/* 
JS for calendar.html
*/

//////////////////////// GLOBAL VARIABLE INITIALISATION

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
if (urlParams.get("startdate")) {
    today = new Date(urlParams.get("startdate"))
} else {
    today = new Date(Date.now())
}

document.querySelector('#startdate').value = today.toISOString().slice(0, 10)

// initialises date array using today as reference
let correcteddate = new Date(today)
correcteddate.setUTCHours(0, 0, 0, 0)
correcteddate = Date.parse(correcteddate)
let millisecondsinaday = 86400000

// creates populate the datearray
let datearray = []
datearray.push(new Date(correcteddate))
for (let i = 1; i < 14; i++) {
    datearray.push(new Date(correcteddate+(i*millisecondsinaday)))
}

// initializes pitch array populated later
let pitcharray = []

// initializes consts for calendar div and calendar body, used later.
const calendar = document.querySelector('#calendar')
const calendarbody = document.createElement('div')
calendarbody.className = "calendarbody"

/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */
/* ---------------------- START OF LOAD FLOW -------------------- */
/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */

////////////////////////// CALLED FIRST, SETS UP LEFT HAND COLUMN OF CALENDAR


// get list of pitches from server
async function fetchpitches() {
    let response = await fetch("servepitches", {
        method: "GET"
    })
    let pitches = await response.json()
    return pitches
}

async function setupcalendarrowtitles() {
    let data = await fetchpitches()
    // add pitch name to pitcharray[]
    for (let i = 0; i < data.length; i++) {
        pitcharray.push(data[i].name)
    }

    // create div pitchcolumn
    let pitchtitlecolumn = document.createElement('div')
    pitchtitlecolumn.className = "calendarcolumn"
    pitchtitlecolumn.setAttribute("id", "calendarrowtitles")
    
    // creates a date div at the top of the pitchtitlecolumn
    let pitchtitlecolumnheader = document.createElement('div')
    pitchtitlecolumnheader.className = "pitchtitle pitchtitleheader calendaritem"
    pitchtitlecolumn.append(pitchtitlecolumnheader)

    // then adds a row header for each date in the pitcharray
    for (let i = 0; i < pitcharray.length; i++) {
        let pitchtitle = document.createElement("div")
        pitchtitle.className = "pitchtitle calendaritem"
        pitchtitle.innerHTML = `Pitch ${pitcharray[i]}`
        pitchtitlecolumn.append(pitchtitle)
    }

    // adds the pitchtitlecolumn to the calendar div
    calendar.append(pitchtitlecolumn)
    
}

/////////////////////////// CALLED SECOND, SETS UP COLUMN HEADER ROW OF CALENDAR

function setupcalendarheader() {
    let calendarheader = document.createElement('div')
    calendarheader.className = "calendarrow"
    calendarheader.setAttribute('id', `maincalendarheader`)

    for (let j = 0; j < datearray.length; j++) {
        let headerday = document.createElement('div')
        headerday.className = "calendaritem"
        headerday.innerHTML = `<p>${datearray[j].toDateString()}</p>`
        calendarheader.append(headerday)
    }
    calendarbody.append(calendarheader)
}

////////////////////// CALLED THIRD, SETS UP CALENDAR BODY

function setupcalendarbody() {

    for (let i = 0; i < pitcharray.length; i++) {
        let pitch = document.createElement('div')
        pitch.className = "calendarrow"
        pitch.setAttribute('id', `pitchrow-${pitcharray[i]}`)
        pitch.dataset.pitch = pitcharray[i]

        for (let j = 0; j < datearray.length; j++) {
            let day = document.createElement('div')
            day.className = "calendaritem"
            day.innerHTML = "<p></p>"
            day.setAttribute("data-pitch", pitcharray[i])
            day.setAttribute("data-date", Date.parse(datearray[j]))
            day.setAttribute("onclick", "launchcreatenewbooking(this)")
            pitch.append(day)
        }

        calendarbody.append(pitch)
    }
}

//////////////////////// CALLED LAST, FETCHES BOOKINGS AND POPULATES CALENDAR WITH THOSE BOOKINGS

function fetchbookings() {
    
    //fetch call to servebookings to get all bookings
    fetch(`servebookings?start=${datearray[0].toISOString()}&end=${datearray[datearray.length - 1].toISOString()}`, {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        
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

            calendarcomponentarray.forEach(function(element) {
                let elementdate = element.getAttribute("data-date")
                if (parseInt(elementdate) >= bookingstart && parseInt(elementdate) < bookingend) {
                    if (balance !== 0.00) {
                        element.classList.add("balancedue")
                    }
                    else if (checkedin) {
                        element.classList.add("bookingcheckedin")
                    }
                    else {
                        element.classList.add("bookingnotcheckedin")
                    }

                    element.setAttribute("data-bookingid", bookingid)

                    element.setAttribute("data-originalcolor", element.style.backgroundColor)
                                        
                    element.setAttribute("onclick", `selectbooking(${data[i].id})`)

                    if (parseInt(elementdate) == bookingstart) {
                        if (locked) {
                            element.innerHTML = `<p><i class="fas fa-lock"></i> ${data[i].guest.surname}</p>`
                        } else {
                            element.innerHTML = `<p>${data[i].guest.surname}</p>`
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
    
    await setupcalendarrowtitles()
    calendar.append(calendarbody)
    setupcalendarheader()
    setupcalendarbody()
    loadbackward()
    calendarinfinitescroll()

})

/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */
/* --------------------- END OF LOAD FLOW ----------------------- */
/* -------------------------------------------------------------- */
/* -------------------------------------------------------------- */





////////////////////////// SELECT BOOKING FUNCTIONALITY
let selectedbooking = ""
let selectstate = false
const displaybutton = document.querySelector("#displaybutton")
const movebutton = document.querySelector("#movebutton")
const fulleditbutton = document.querySelector("#fulleditbutton")
const controlpanel = document.querySelector("#controlpanel")

function selectbooking(bookingid) {
    
    // grabs each pitch-day from calendar
    bookingblocksoncalendar = document.querySelectorAll(".calendaritem")

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
        fulleditbutton.removeAttribute("onclick")
        fulleditbutton.setAttribute("disabled", true)

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
        fulleditbutton.setAttribute("onclick", `editbookingpane(${bookingid})`)
        fulleditbutton.removeAttribute("disabled")
    } 
    else {
        displaybutton.removeAttribute("onclick")
        displaybutton.setAttribute("disabled", true)
        movebutton.removeAttribute("onclick")
        movebutton.setAttribute("disabled", true)
        fulleditbutton.removeAttribute("onclick")
        fulleditbutton.setAttribute("disabled", true)
    }
}

////////////////////////// MOVE BOOKING FUNCTIONALITY

function movebooking(bookingid) {
    message = document.createElement("div")
    message.innerHTML = '<p class="message">Booking move in progress.  Select new start location</p>'
    controlpanel.append(message)
    bookingblocksoncalendar = document.querySelectorAll(".calendaritem")
    bookingblocksoncalendar.forEach((element) => {
        // commit the existing onclick attribute to a dataset entry
        element.dataset.onclickattribute = element.getAttribute("onclick")
        // remove the existing onclick attribute
        element.removeAttribute("onclick")
        // add a new onclick event listener
        element.addEventListener("click", () => {
            payload = {
                newstart: element.dataset.date,
                newpitch: element.dataset.pitch
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
                    return alert("Booking move unsuccessful.  Please reload the page and try again")
                }
                else {
                    return response.json()
                }
            })    
            .then(data => {
                document.location.reload()
            })
        })
    })
}

////////////////////////// LOAD BACKWARD DATES

function loadbackward() {
    firstDateRendered = datearray[0]
    firstDateRendered.setUTCHours(0, 0, 0, 0)
    let forwardDates = []
    for (i=-7; i<0; i++) {
        forwardDates.push(new Date(Date.parse(firstDateRendered)+(i*millisecondsinaday)))
    }
    
    //grab the calendar header
    let calendarheader = document.querySelector('#maincalendarheader')

    //grab the width of the calandar header row before addition to facilitate the reset of the scroll position later in this script
    const calendarbody = document.querySelector(".calendarbody")
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
        if (element.getAttribute("id") == "maincalendarheader") {
            //create the divs and populate with the date string
            for (j=6; j>=0; j--) {
                let calendaritem = document.createElement('div')
                calendaritem.className = "calendaritem"
                calendaritem.innerHTML = `<p>${forwardDates[j].toDateString()}</p>`
                element.prepend(calendaritem)
            }
        }

        //if not the header row...
        else {
            //create the divs and set the pitch, date and onclick attributes
            for (j=6; j>=0; j--) {
                let calendaritem = document.createElement('div')
                calendaritem.className = "calendaritem"
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


function loadforward() {
    lastDateRendered = datearray[datearray.length - 1]
    lastDateRendered.setUTCHours(0, 0, 0, 0)
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
        if (element.getAttribute("id") == "maincalendarheader") {
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
                calendaritem.className = "calendaritem"
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

function calendarinfinitescroll() {  
    const calendarbodydiv = document.querySelector('.calendarbody')
    const calendarbodydivwidth = calendarbodydiv.offsetWidth
    calendarbodydiv.addEventListener('scroll', () => {
        if (calendarbodydiv.scrollLeft === (calendarbodydiv.scrollWidth - calendarbodydivwidth)) {
            loadforward()
        }
        else if (calendarbodydiv.scrollLeft === 0) {
            loadbackward()
        }
    })
}














/////////////////////////// DISPLAYS BOOKING SUMMARY PANEL WHEN BOOKING IS CLICKED ON

function displaybookingpane(bookingid) {
    let bookingpanewrapper = document.createElement('div')
    bookingpanewrapper.className = "panewrapper"
    bookingpanewrapper.id = "bookingpanewrapper"

    let bookingpane = document.createElement('div')
    bookingpane.id = 'bookingpane'
    bookingpane.className = "pane"

    fetch(`booking/${bookingid}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        let bookingid = data.id
        let pitch = data.pitch
        let guestname = `${data.guest.firstname} ${data.guest.surname}`
        let arrival = data.start
        let departure = data.end
        let adults = data.adultno
        let children = data.childno
        let infants = data.infantno
        let bookingrate = data.bookingrate
        let payments = data.totalpayments
        let balance = bookingrate - payments
        let comments = data.commentsbybooking
        let bookingparty = data.bookingparty
        let bookingvehicles = data.bookingvehicles
        let locked = data.locked
        let checkedin = data.checkedin

        
        bookingpane.innerHTML = `
            <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(bookingpanewrapper)></i></p>
            <h3 id="bookingpanetitle">Booking ${bookingid}</h3>
            <div id="importantbookingcomments"></div>
            <div class="basicbookinginfo"> 
                <div><p><strong>Pitch: </strong></p><p> ${pitch}</p></div>
                <div><p><strong>Guest Name: </strong></p><p> ${guestname}</p></div>
                <div><p><strong>Arriving: </strong></p><p> ${arrival}</p></div>
                <div><p><strong>Departing: </strong></p><p> ${departure}</p></div>
            </div>
            <hr>
            <div class="panepartydetail">
                <p class="partydetail"><i class="fas fa-male"></i> ${adults} |
                <i class="fas fa-child"></i> ${children} |
                <i class="fas fa-baby"></i> ${infants}</p>
            </div>
            <hr/>
            <div class="financesummary">
                <fieldset>
                    <legend>Finance Summary</legend>
                    <table class="table">
                        <thead>
                            <th>Cost</th>
                            <th>Payments</th>
                            <th>Balance</th>
                        </thead>
                        <tbody>
                            <td>£${bookingrate}</td>
                            <td>£${payments}</td>
                            <td>£${balance}</td>
                        </tbody>
                    </table>
                </fieldset>
            </div>
            <div class="controlbuttons">
                <button id="loadeditmenubutton" class="btn btn-secondary")>View/Edit Full Booking</button>    
                <button class="btn btn-secondary" onclick=loadpaymentdetail(${bookingid})>View Payments Detail</button>
                <button id="loadcommentsbutton" class="btn btn-secondary">View Comments</button>
                <button id="loadpartybutton" class="btn btn-secondary">View Party</button>
            </div>
            `
        //build the display
        bookingpanewrapper.append(bookingpane)
        body.append(bookingpanewrapper)

        //add event listener to load comments button and pass in the comments. 
        loadeditmenubutton = document.querySelector("#loadeditmenubutton")
        loadeditmenubutton.addEventListener("click", () => {
            loadeditmenu(data)
        })

        //add event listener to load comments button and pass in the comments. 
        loadcommentsbutton = document.querySelector("#loadcommentsbutton")
        loadcommentsbutton.addEventListener("click", () => {
            loadcomments(comments)
        })

        //add event listener to load party button and pass in the party details.         
        loadpartybutton = document.querySelector("#loadpartybutton")
        loadpartybutton.addEventListener("click", () => {
            loadparty(bookingparty, bookingvehicles)
        })
        
        //visual indication in booking pane that booking is checked in.
        if (data.checkedin){
            document.querySelector("#bookingpanetitle").className = "checkedin"
            document.querySelector(".panepartydetail").classList.add("checkedin")
        }

        importantbookingcommentsdiv = document.querySelector("#importantbookingcomments")
        // check whether any of the booking comments are flagged as important
        for (i=0; i<comments.length; i++) {
            if (comments[i].important) {
                comment = document.createElement("p")
                comment.textContent = `${comments[i].comment}`
                comment.className = "alert alert-danger"
                importantbookingcommentsdiv.append(comment)
            }
        }
    })
}


function loadcomments(comments) {
    const commentspanewrapper = document.createElement("div");
    commentspanewrapper.className = "panewrapper";
    commentspanewrapper.id = "commentspanewrapper";

    const commentspane = document.createElement("div");
    commentspane.id = "commentspane";
    commentspane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(commentspanewrapper)></i></p>
        <h3>Booking Comments</h3>
        `

    body.append(commentspanewrapper);
    commentspanewrapper.append(commentspane);

    if (comments.length === 0) {
        commentitem = document.createElement("div");
        commentitem.textContent = "There are no comments associated with this booking."
        commentspane.append(commentitem);
    }
    else {
        for (i=0; i<comments.length; i++) {
            commentitem = document.createElement("div");
            commentitem.textContent = `${comments[i].comment}`;
            commentitem.setAttribute("role", "alert");
            if (comments[i].important) {
                commentitem.className = "alert alert-danger";
            }
            else {
                commentitem.className = "alert alert-secondary";
            }
            commentspane.append(commentitem);
        }
    }
}

function loadparty(bookingparty, bookingvehicles) {
    const partypanewrapper = document.createElement("div");
    partypanewrapper.className = "panewrapper";
    partypanewrapper.id = "partypanewrapper";

    const partypane = document.createElement("div");
    partypane.id = "partypane";
    partypane.className = ""
    partypane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(partypanewrapper)></i></p>
        <h3>Party Details</h3>
        <div id="partydetails"></div>
        <div id="partyvehicles"></div>
        `

    body.append(partypanewrapper);
    partypanewrapper.append(partypane);

    const partydiv = document.querySelector("#partydetails")

    if (bookingparty.length === 0) {
        let partyitem = document.createElement("div");
        partyitem.textContent = "There are no party members associated with this booking."
        partydiv.append(partyitem);
    }
    else {
        for (i=0; i<bookingparty.length; i++) {
            let partyitem = document.createElement("div");
            partyitem.textContent = `${bookingparty[i].firstname}, ${bookingparty[i].surname}`;
            partyitem.setAttribute("role", "alert");
            if (bookingparty[i].checkedin) {
                partyitem.className = "alert alert-success";
            }
            else {
                partyitem.className = "alert alert-secondary";

            }
            
            partydiv.append(partyitem)
        }
    }

    const vehiclesdiv = document.createElement("div")
   
    if (bookingvehicles.length === 0) {
        partyitem = document.createElement("div");
        partyitem.textContent = "There are no party vehicles associated with this booking."
        vehiclesdiv.append(partyitem);
    }
    else {
        for (i=0; i<bookingparty.length; i++) {
            partyitem = document.createElement("div");
            partyitem.textContent = `${bookingvehicles[i].vehreg}`;
            partyitem.setAttribute("role", "alert");
            if (bookingvehicles[i].checkedin) {
                partyitem.className = "alert alert-success";
            }
            else {
                partyitem.className = "alert alert-secondary";

            }
            
            vehiclesdiv.append(partyitem);
        }
    }
    partydiv.append(vehiclesdiv)
    partypane.append(partydiv);

}

function loadeditmenu(bookingdata) {
    const editpanewrapper = document.createElement("div");
    editpanewrapper.className = "panewrapper";
    editpanewrapper.id = "editpanewrapper";

    const editpane = document.createElement("div");
    editpane.className = "pane"
    editpane.id = "editpane"
    editpane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(editpanewrapper)></i></p>
        <h3>Booking Edit Menu</h3>
        <div id="editbuttons">
            <button type="button" class="btn btn-secondary" onclick='editleadguest(${bookingdata.id}, ${bookingdata.guest.id})'>Edit Lead Guest</button>
            <button type="button" class="btn btn-secondary" onclick='editpartynumbers(${bookingdata.id}, ${bookingdata.adultno}, ${bookingdata.childno}, ${bookingdata.infantno})'>Edit Party Numbers</button>
            <button type="button" class="btn btn-secondary" onclick='editstayduration(${bookingdata.id}, "${bookingdata.start}", "${bookingdata.end}")'>Edit Stay Duration</button>
        </div>
        <div id="editactionpanel"></div>
        `

    body.append(editpanewrapper);
    editpanewrapper.append(editpane);

}

function editleadguest(bookingid, leadguest) {
    editactionpanel = document.querySelector("#editactionpanel")
    editactionpanel.innerHTML = `
        <h3>Search for New Lead Guest</h3>
        <input type="text" autofocus onKeyUp=guestsearch(this) id="guestsearch" class="form-control" placeholder="Email">
        <div id="guestselect">
            <fieldset>
                <legend>Existing Guests</legend>
                <div id="searchresultsdiv"></div>
            </fieldset>
        </div>
        <button type="button" class="btn btn-secondary" onclick=updateGuest(${bookingid})>Update Lead Guest</button>
    `  

}

function editpartynumbers(bookingid, adults, children, infants) {
    editactionpanel = document.querySelector("#editactionpanel")
    editactionpanel.innerHTML = `
        <h3>Edit Party Numbers</h3>
        
        <div class="form-floating mb-3">
            <input id="newdaultno" type="number" class="form-control" step=1 value="${adults}"></input>
            <label for="adults">Adults</label>
        </div>
        <div class="form-floating mb-3">
            <input id="newchildno" type="number" class="form-control" step=1 value="${children}"></input>
            <label for="adults">Children</label>
        </div>
        <div class="form-floating mb-3">
            <input id="newinfantno" type="number" class="form-control" step=1 value="${infants}"></input>
            <label for="adults">Infants</label>
        </div>
        <button type="button" class="btn btn-secondary" onclick=updatePartyNumbers(${bookingid})>Update Party Numbers</button>
    `
}

function updatePartyNumbers(bookingid) {
    newadultno = document.querySelector("#newadultno").value
    newchildno = document.querySelector("#newchildno").value
    newinfantno = document.querySelector("#newinfantno").value

    
    payload = {
        "newadultno": newadultno,
        "newchildno": newchildno,
        "newinfantno": newinfantno
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
            return alert("Party number update unsuccessful.  Please reload the page and try again")
        }
        else {
            return response.json()
        }
    })    
    .then(data => {
        alert("Party numbers updated")
        closepane(bookingpanewrapper)
        displaybookingpane(bookingid)
    })
}

function editstayduration(bookingid, bookingstart, bookingend) {
    console.log(bookingstart, bookingend)
}

function updateGuest(bookingid) {
    guestid = document.querySelector("#guestid").textContent
    
    payload = {
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


///////////////////////// NEW BOOKING CREATION

// variable to hold array of available pitches
let availablepitches = ""
// instantiate variable to hold preferred pitch which controls the create booking pane default pitch option
let preferredpitch = 0

function launchcreatenewbooking(element) {
    
    preferredpitch = element.getAttribute("data-pitch")
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
        <form autocomplete="off">
            <div class="form-group">
                <div id='guestsearch' class="form-floating mb-3">
                    <input type="text" autofocus id="searchparam" class="form-control" onkeyup=guestsearch(this) autocomplete="off" placeholder="Email Address">
                    <label for="searchparam">Email Address</label>
                </div>
                <div id="guestselect">
                    <fieldset>
                        <legend>Existing Guests</legend>
                        <div id="searchresultsdiv"></div>
                    </fieldset>
                </div>
            </div>
            <hr>
            
            <div class="form-group">
                <div class="form-floating mb-3">
                    <input type="date" class="form-control" id="arrival" onchange=recalculate() onblur=resetavailablepitches(${preferredpitch}) placeholder="Arrival Date" value="${start}">
                    <label for="arrival">Arrival Date: </label>
                </div>
                <div class="form-floating mb-3">
                    <input type="date" class="form-control" id="departure" onchange=recalculate() onblur=resetavailablepitches(${preferredpitch}) placeholder="Departure Date">
                    <label for="departure">Departure Date: </label>
                </div>
                <div class="form-floating mb-3">
                    <select name="pitch" class="form-control" id="pitchselect">
                        <!-- options populate here -->
                    </select>
                    <label for="arrival">Pitch: </label>
                </div>
            </div>
            <hr>
            <div class="form-group">
                <fieldset>
                    <legend>Party Details</legend>
                    <div class="form-floating mb-3">
                        <input onchange=recalculate() class="form-control" type="text" id="adultno" placeholder="Adults">
                        <label for="adultno">Adults</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input onchange=recalculate() class="form-control" type="text" id="childno" placeholder="Children">
                        <label for="childno">Children</label>
                    </div>
                    <div class="form-floating mb-3">
                        <input onchange=recalculate() class="form-control" type="text" id="infantno" placeholder="Infants">
                        <label for="infantno">Infants</label>
                    </div>
                </fieldset>

                <p onclick=addextra()>Add extra</p>
                <div id="extras">
                    <table id="extratable">
                    </table>
                </div>
            </div>
            
            <hr>

            <div class="form-group">
                <h3>Fee: </h3>
                <p style="display: inline-block">£</p><p style="display: inline-block" id="rate">-</p>
                <div class="form-floating mb-3">
                    <input type=number class="form-control" step="0.01" min=0 id="paid" placeholder="Paid">
                    <label for="paid"> Paid £</label>
                </div>
                <div class="form-floating mb-3">
                    <select name="paymentmethod" class="form-control" id="paymentmethod">
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="BACS">BACS</option>
                    </select>
                    <label for="paymentmethod"> Payment Method</label>
                </div>
            </div>
            <button onclick=createnewbooking()>Submit</button>
        </form>`
    
    bookingpanewrapper.append(bookingpane)
    body.append(bookingpanewrapper)
}

function guestsearch(element) {
    searchresultsdiv = document.querySelector('#searchresultsdiv')
    searchresultsdiv.innerHTML = ""
    searchparam = element.value
    console.log(searchparam)
    if (searchparam.length == 0) {
        return
    }
    fetch(`guestsearch?search=${searchparam}`)
    .then(response => response.json())
    .then(data => {
        if (data.length > 0) {
            for (i=0; i < data.length; i++) {
                result = document.createElement('div')
                result.innerHTML = `<p data-id="${data[i].id}" onclick=selectguest(this)>${data[i].firstname} ${data[i].surname} - ${data[i].email}</p>`
                searchresultsdiv.append(result)
            }
        }
        else {
            result = document.createElement('div')
            result.innerHTML = `<p onclick=createnewguestform()>No existing guests found.  Click here to create one.</p>`
            searchresultsdiv.append(result)
        }
        
    })

}

function selectguest(element) {
    customerid = element.getAttribute("data-id")
    guestdetails = document.querySelector('#guestselect')
    guestdetails.innerHTML = ""

    fetch(`guest/${customerid}`)
    .then(response => response.json())
    .then(data => {
        guestdetails.innerHTML = `
            <h4>${data.firstname} ${data.surname}</h4>
            <p id="guestid" style="display: none;">${data.id}<p>
            <p><strong>Email: </strong>${data.email}</p>
            <p><strong>Telephone: </strong>${data.telephone}</p>
            `
        document.querySelector('#guestsearch').remove()
    })
}


//launches and populates the create new guest element of the form
function createnewguestform() {
    guestemail = document.querySelector('#searchparam').value
    guestdetails = document.querySelector('#guestselect')
    guestdetails.innerHTML = `
        <fieldset>
            <legend>Create New Guest</legend>
            <input type="text" id="firstname" placeholder="First name">
            <input type="text" id="surname" placeholder="Surname">
            <input type="text" id="telephone" placeholder="Telephone">
            <input type="email" id="email" value="${guestemail}">
        </fieldset>
        <button type="button" onclick=createguest()>Create</button>
        `
    document.querySelector('#guestsearch').remove()
}

//sends the new guest creation POST request to the server
function createguest() {
    firstname = document.querySelector('#firstname').value
    surname = document.querySelector('#surname').value
    telephone = document.querySelector('#telephone').value
    email = document.querySelector('#email').value

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
    availablepitches = ""
    start = document.querySelector('#arrival').value
    end = document.querySelector('#departure').value
    fetch(`serveavailablepitchlist?start=${start}&&end=${end}`)
    .then(response => response.json())
    .then(data => {
        for (let i=0; i < data.length; i++) {
            availablepitches += `<option value=${data[i].pk}>${data[i].fields.name}</option>`
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
    bookingstart        = document.querySelector("#arrival").value
    bookingend          = document.querySelector("#departure").value
    adultno             = document.querySelector("#adultno").value
    childno             = document.querySelector("#childno").value
    infantno            = document.querySelector("#infantno").value
    
    // wait until all the required info is present before presenting to the server for rate.
    if (bookingstart && bookingend && adultno && childno && infantno) {
        fetch(`fetchrate?start=${bookingstart}&end=${bookingend}`, {
            method: "GET",
        })

        .then(response => response.json())
        .then(data => {
            
            //initialize a new variable to hold the rates array for the dates selected (dict type)
            let rates = {}
            
            //data returned from server may include more than one rate record, therefore the following is done for each rate record returned, effectively merging the returned rates into one data structure 
            for (let i=0; i < data.length; i++) {
                //get the start of the rates period
                ratestartdate = new Date(data[i].fields.start)
                //get the end of the rates period
                rateenddate = new Date(data[i].fields.end)
                //get the adult, child and infant rates for that period.
                adultrate = data[i].fields.adult
                childrate = data[i].fields.child
                infantrate = data[i].fields.infant
                
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
                    formatteddate = date.toDateString()
                    rates[formatteddate] = {
                        "adult": adultrate,
                        "child": childrate,
                        "infant": infantrate
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
        paymentdetailslayer = document.createElement("div")
        paymentdetailslayer.className = "panewrapper"
        paymentdetailslayer.id = "paymentdetailswrapper"

        paymentdetails = document.createElement("div")
        paymentdetails.className = "paymentdetails"
        paymentdetails.innerHTML = `<p class="closebutton" ><i class="far fa-times-circle" onclick=closepane(paymentdetailswrapper)></i></p><h2>Payment Details</h2><i onclick=addpayment(${bookingid}) class="fas fa-plus-circle"></i>`
        
        paymentdetailstable = document.createElement("table")
        paymentdetailstable.className = "table table-striped"
        paymentdetailstableheader = document.createElement("thead")
        paymentdetailstableheader.innerHTML = `
            <th>Payment Date</th>
            <th>Payment ID</th>
            <th>Payment Value</th>
            <th>Payment Method</th>
            <th>Delete or Edit Payment</th>
            `
        
        paymentdetailstablebody = document.createElement("tbody")
        paymentdetailstablebody.id = "paymenttablebody"
        for (i=0; i<data.length; i++) {
            payment = document.createElement("tr")
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
    payment = document.querySelector(`#payment-${paymentid}`)
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
    editedpaymentdate = document.querySelector("#editedpaymentdate").value
    editedpaymentvalue = document.querySelector("#editedpaymentvalue").value
    editedpaymentmethod = document.querySelector("#editedpaymentmethod").value
    
    payload = {
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
        if (response.status === 200) {
            document.querySelector("#paymentdetailswrapper").remove()
            document.querySelector("#bookingpanewrapper").remove()
            displaybookingpane(bookingid)
        }    
    })
}

function addpayment(bookingid) {
    newpaymentline = document.createElement("tr")
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
    table = document.querySelector("#paymenttablebody")
    table.append(newpaymentline)
    document.querySelector("#newpaymentdate").valueAsDate = new Date() 
}

function savenewpayment(bookingid) {
    newpaymentdate = document.querySelector("#newpaymentdate").value
    newpaymentvalue = document.querySelector("#newpaymentvalue").value
    newpaymentmethod = document.querySelector("#newpaymentmethod").value
    
    payload = {
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
        console.log(data)
    })

}

function addextra(extras) {
    fetch('serveextras', {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        //when the button is pressed, add a row to the extras table.
        extrarow = document.createElement('tr')
        extrarow.setAttribute("id", "live")
        extrasoptions = document.createElement("select")
        for (i = 0; i < data.length; i++) {
            option = document.createElement("option")
            option.innerHTML = data[i].fields.name
            option.value = data[i].fields.pk
            extrasoptions.append(option)
        }
        // add a 'placeholder' into the select options inviting the user to select an extra from the list. 
        option = document.createElement("option")
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
        extratable = document.querySelector("#extratable")
        extratable.append(extrarow)
        livetr = document.querySelector("#live")
        livetr.setAttribute("id", "")
        livetr.querySelector('.extraname').append(extrasoptions)

    })
}

function repositioncalendar() {
    repositiondate = document.querySelector('#startdate').value
    window.location.href=`?startdate=${repositiondate}`
}