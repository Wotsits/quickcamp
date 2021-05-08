function fetchbookings() {
    fetch("servebookings", {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        
        for (let i = 0; i < data.length; i++) {
            bookingstart = Date.parse(data[i].start)
            bookingend = Date.parse(data[i].end)
            console.log(bookingstart)
            console.log(bookingend)
            bookingpitch = data[i].pitch.toString()
            calendarcomponentarray = document.querySelectorAll(".calendaritem")
            calendarcomponentarray.forEach(function(element) {
                elementdate = element.getAttribute("data-date")
                pitch = element.getAttribute("data-pitch")
                if (parseInt(elementdate) >= bookingstart && parseInt(elementdate) < bookingend && pitch === bookingpitch) {
                    element.style.backgroundColor = "red"
                }
            })
        }   
    })
}


function setupcalendarheader() {
    calendarheader = document.createElement('div')
    calendarheader.className = "calendarrow"
    calendarheader.setAttribute('id', `maincalendarheader`)

    for (let j = 0; j < datearray.length; j++) {
        headerday = document.createElement('div')
        headerday.className = "calendaritem"
        headerday.innerHTML = `<p>${datearray[j].toDateString()}</p>`
        calendarheader.append(headerday)
    }
    calendar.append(calendarheader)
}

async function setupcalendarbody() {
    let response = await fetch("servepitches", {
        method: "GET"
    })
    data = await response.json()

    for (let i = 0; i < data.length; i++) {
        pitcharray.push(data[i].name)
    }

    for (let i = 0; i < pitcharray.length; i++) {
        pitch = document.createElement('div')
        pitch.className = "calendarrow"
        pitch.setAttribute('id', `${pitcharray[i]}`)

        for (let j = 0; j < datearray.length; j++) {
            day = document.createElement('div')
            day.className = "calendaritem"
            day.innerHTML = "<p></p>"
            day.setAttribute("data-pitch", pitcharray[i])
            day.setAttribute("data-date", Date.parse(datearray[j]))
            pitch.append(day)
        }
        calendar.append(pitch)
    }
}






const today = Date.now()
let correcteddate = new Date(today)
correcteddate.setHours(0, 0, 0, 0)
correcteddate = Date.parse(correcteddate)

let millisecondsinaday = 86400000
let datearray = []

// populate the datearray
datearray.push(new Date(correcteddate))
for (let i = 1; i < 14; i++) {
    datearray.push(new Date(correcteddate+(i*millisecondsinaday)))
}

let pitcharray = []
const calendar = document.querySelector('#calendar')

document.addEventListener("DOMContentLoaded", () => {
    
    setupcalendarheader()
    setupcalendarbody()
    fetchbookings()

})

