
//////////////////////// GLOBAL VARIABLE INITIALISATION

csrftoken = document.getElementsByName('csrfmiddlewaretoken')[0].value
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
const body = document.querySelector("body")




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
        pitch.setAttribute('id', `${pitcharray[i]}`)

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
    fetch("servebookings", {
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
            let calendarcomponentarray = document.querySelectorAll(".calendaritem")
            let balance = data[i].balance
            let checkedin = data[i].checkedin
            let locked = data[i].locked
            console.log(locked)

            calendarcomponentarray.forEach(function(element) {
                let elementdate = element.getAttribute("data-date")
                let pitch = element.getAttribute("data-pitch")
                if (parseInt(elementdate) >= bookingstart && parseInt(elementdate) < bookingend && pitch === bookingpitch) {
                    if (balance !== 0.00) {
                        element.style.backgroundColor = "red"
                    }
                    else if (checkedin) {
                        element.style.backgroundColor = "#15FFFD"
                    }
                    else {
                        element.style.backgroundColor = "rgb(42, 147, 130)"
                    }
                    element.setAttribute("data-bookingid", bookingid)
                                        
                    element.setAttribute("onclick", `displaybookingpane(${data[i].id})`)
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
    fetchbookings()
    loadbackward()
    calendarinfinitescroll()

})





////////////////////////// LOAD BACKWARD DATES

function loadbackward() {
    firstDateRendered = datearray[0]
    firstDateRendered.setUTCHours(0, 0, 0, 0)
    let forwardDates = []
    for (i=-7; i<0; i++) {
        forwardDates.push(new Date(Date.parse(firstDateRendered)+(i*millisecondsinaday)))
    }
    console.log(forwardDates)
    
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
        const pitchid = element.getAttribute('id')
        
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

    //fetch the bookings update
    fetchbookings()

    //add the forwardDates array to the beginning of the datearray
    let newdatearray = forwardDates.concat(datearray)
    datearray = newdatearray
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
        pitchid = element.getAttribute('id')
        
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

    //fetch the bookings update
    fetchbookings()

    //add the forwardDates array to the beginning of the datearray
    let newdatearray = datearray.concat(forwardDates)
    datearray = newdatearray
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
    bookingpanewrapper.setAttribute('id', 'bookingpanewrapper')
    let bookingpane = document.createElement('div')
    bookingpane.setAttribute('id', 'bookingpane')

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
        
        
        
        bookingpane.innerHTML = `
            <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(bookingpanewrapper)></i></p>
            <h3>Booking ${bookingid}</h3>
            <div id="importantbookingcomments"></div>
            <strong>Pitch: </strong><p>${pitch}</p>
            <strong>Guest Name: </strong><p>${guestname}</p>
            <strong>Arriving: </strong><p>${arrival}</p>
            <strong>Departing: </strong><p>${departure}</p>
            <p class="partydetail"><i class="fas fa-male"></i> - ${adults} |
            <i class="fas fa-child"></i> - ${children} |
            <i class="fas fa-baby"></i> - ${infants}</p>
            <div class="financesummary">
                <fieldset>
                    <legend>Finance Summary</legend>
                    <p>Total Cost: £${bookingrate}</p>
                    <p>Total Payments: £${payments}</p>
                    <p>Balance: £${balance}</p>
                </fieldset>
            </div>
            <div class="controlbuttons">
                <button class="btn btn-secondary" onclick="location.href='viewbooking/${bookingid}';"">View/Edit Full Booking</button>    
                <button class="btn btn-secondary" onclick=loadpaymentdetail(${bookingid})>View Payments Detail</button>
            </div>
            `

        // check whether any of the booking comments are flagged as important
        
        
        
        bookingpanewrapper.append(bookingpane)
        body.append(bookingpanewrapper)
        
        for (i=0; i<comments.length; i++) {
            if (comments[i].important) {
                comment = document.createElement("p")
                comment.textContent = `${comments[i].comment}`
                comment.className = "alert alert-danger"
                document.querySelector("#importantbookingcomments").append(comment)
            }
        }
        
    })
}

///////////////////////// CLOSES PANE 

function closepane(elementname) {
    elementname.remove()
}
















///////////////////////// NEW BOOKING CREATION

let availablepitches = ""

function launchcreatenewbooking(element) {
    let pitch = element.getAttribute("data-pitch")
    let start = element.getAttribute("data-date")

    let bookingpanewrapper = document.createElement('div')
    bookingpanewrapper.setAttribute('id', 'bookingpanewrapper')
    let bookingpane = document.createElement('div')
    bookingpane.setAttribute('id', 'bookingpane')

    bookingpane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(bookingpanewrapper)></i></p>
        <h3>New Booking</h3>
        <form autocomplete="off">
            
            <div id='guestsearch'>
                <label for="searchparam">Email Address:</label>
                <input type="text" id="searchparam" onkeyup=guestsearch(this) autocomplete="off">
            </div>
            <div id="guestselect">
                <fieldset>
                    <legend>Existing Guests</legend>
                    <div id="searchresultsdiv"></div>
                </fieldset>
            </div>
            
            <label for="arrival">Arrival Date: </label>
            <input type="date" id="arrival" onchange=recalculate() onblur=resetavailablepitches(${pitch}) placeholder="Arrival Date">
            <label for="arrival">Departure Date: </label>
            <input type="date" id="departure" onchange=recalculate() onblur=resetavailablepitches(${pitch}) placeholder="Departure Date">
            <label for="arrival">Pitch: </label>
            <select name="pitch" id="pitchselect">
                <!-- options populate here -->
            </select>
            <fieldset>
                <legend>Party Details</legend>
                <input onchange=recalculate() type="text" id="adultno" placeholder="Adults">
                <input onchange=recalculate() type="text" id="childno" placeholder="Children">
                <input onchange=recalculate() type="text" id="infantno" placeholder="Infants">
            </fieldset>
            <h3>Fee: </h3>
            <p style="display: inline-block">£</p><p style="display: inline-block" id="rate">-</p>
            <label for="paid"> Paid: £</label>
            <input type=number step="0.01" min=0 id="paid" placeholder="0">
            <label for="paymentmethod"> Payment Method: </label>
            <select name="paymentmethod" id="paymentmethod">
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="BACS">BACS</option>
            </select>
            <button onclick=createnewbooking()>Submit</button>
        </form>`
    
    bookingpanewrapper.append(bookingpane)
    body.append(bookingpanewrapper)
}

function guestsearch(element) {
    searchresultsdiv = document.querySelector('#searchresultsdiv')
    searchresultsdiv.innerHTML = ""
    searchparam = element.value
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

function resetavailablepitches(pitch) {
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
        paymentdetailslayer.setAttribute("id", "paymentdetailswrapper")

        paymentdetails = document.createElement("div")
        paymentdetails.className = "paymentdetails"
        paymentdetails.innerHTML = `<p class="closebutton" ><i class="far fa-times-circle" onclick=closepane(paymentdetailswrapper)></i></p><h2>Payment Details</h2>`
        
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

////////////////////////

function sortTable(table) {
    switching = true
    while (switching) {
        switching = false
        rows = table.rows
        for (i=0; i<(rows.length-1); i++) {
            shouldswitch = false
            x = rows[i].getElementsByTagName("TD")[0].textContent.toLowerCase()
            y = rows[i+1].getElementsByTagName("TD")[0].textContent.toLowerCase()
            if (x > y) {
                shouldswitch = true
                break
            }
        }
        if (shouldswitch) {
            rows[i].parentNode.insertBefore(rows[i+1], rows[i])
            switching = true
        }

    }
}

function checkin(button) {    
    pk = button.dataset.bookingid
    instruction = button.dataset.instruction
    
    if (instruction === "checkin") {
        instruction = true
        //displays the booking pane for review as the guest is checked in. 
        displaybookingpane(pk)
    } else {
        instruction = false
    }

    payload = {
        "pk": pk,
        "checkedin": instruction
    }
    
    fetch('checkinapi', {
        method: "PATCH",
        headers: {
            "X-CSRFToken": csrftoken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.status === 200) {
            response = response.json()
        }
        else {
            alert("Check-in unsuccessful.  Please try again")
        }
    })
    .then(data => {
        tablerow = button.parentElement.parentElement
        if (instruction === true) {
            arrivedtablebody = document.querySelector("#arrivedtable")
            tablerow.style.animationPlayState = "running"
            arrivedtablebody.appendChild(tablerow)
            tablerow.className = ""
            button.setAttribute("data-instruction", "reverse")
            button.className = "btn btn-warning"
            button.textContent = "Reverse Check-in"
            sortTable(tablerow.parentElement) 
            
            
        } else {
            duetablebody = document.querySelector("#duetable")
            tablerow.className = "disolve"
            duetablebody.appendChild(tablerow)
            tablerow.className = ""
            button.setAttribute("data-instruction", "checkin")
            button.className = "btn btn-success"
            button.textContent = "Check-in"
            sortTable(tablerow.parentElement) 
        }
        
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
