/*
JS for arrivals.html
*/

//////////////////////// HELPER FUNCTION

function rfc3339(d) {
    
  function pad(n) {
      return n < 10 ? "0" + n : n;
  }

  function timezoneOffset(offset) {
      var sign;
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

// grab the queryString from the url
const queryString = window.location.search
// grab the searchparams from the querystring
const urlParams = new URLSearchParams(queryString)
// set today variable to either today or the startdate url get param. 
if (urlParams.get("startdate")) {
    today = new Date(urlParams.get("startdate"))
} else {
    today = new Date(Date.now())
}

// set the date input to the value of startdate variable.
document.querySelector('#arrivaldate').value = rfc3339(today).slice(0, 10)  //this grabs the first 10chars from the ISO string



//grabs the filter input field for use later. 
const arrivalsfilterinput = document.querySelector('#arrivalssearch')
//grabs each <tr> element inside the body of the arrivals table.  These are identified with 'arrival' class.
let arrivaltableentries = document.querySelectorAll('.arrival')


//function activated by upkey on filter input field
function arrivalsfilter() {

  //grab the current value of the arrivals filter input
  contentofarrivalsfilter = arrivalsfilterinput.value.toLowerCase()

  //if the field is empty...
  if (contentofarrivalsfilter === "") {
    //reset the display property for each <tr> to null
    for (i=0; i<arrivaltableentries.length; i++) {
      arrivaltableentries[i].style.display = null   
    }
  }

  //if the field is not empty...
  else {
    //check the data-surname attribute against the content of the filter input field and hide any that don't match
    for (i=0; i<arrivaltableentries.length; i++) {
      if (!(arrivaltableentries[i].dataset.surname.toLowerCase().includes(contentofarrivalsfilter))) {
        arrivaltableentries[i].style.display = "None"
      }
      //and display any that do match.
      else {
        arrivaltableentries[i].style.display = null
      }
    }
  }
}


//fires onclick of arrival <tr> element and passes in booking id.
function displaycheckinpane(bookingid) {
  
  //go to server to get booking details.  
  //(THERE IS A MORE EFFICIENT WAY! Page already has the booking details! TODO)
  fetch(`booking/${bookingid}`)
  .then(response => {
    if (!response.status === 400) {
        alert("Check-in/reverse action unsuccessful.  Please refresh page and try again")
        return
    }
    else {
        return response.json()
    }
  })
  .then(data => {
    // setup the checkin pane which includes a wrapper and the pane itself.
    checkinpanewrapper = document.createElement("div")
    checkinpanewrapper.id = "bookingpanewrapper"
    checkinpanewrapper.className = "panewrapper"
    body.append(checkinpanewrapper)
    checkinpane = document.createElement("div")
    checkinpane.id = "checkinpane"
    
    checkinpane.innerHTML = `
        <p class="closebutton"><i class="far fa-times-circle" onclick=closepane(bookingpanewrapper)></i></p>
        <div id="vehiclesdiv"></div>
        <div id="partydiv"></div>
    `
    checkinpanewrapper.append(checkinpane)

    //populate the vehicles div
    vehiclesdiv = document.querySelector("#vehiclesdiv")
    
    //for each vehicle...
    for (i = 0; i < data.bookingvehicles.length; i++) {
      
      //check if the vehicle is due to arrive today before displaying it.
      if (new Date(data.bookingvehicles[i].start).toDateString() === today.toDateString()) {
        vehiclebutton = document.createElement("button")
        vehiclebutton.innerHTML = `${data.bookingvehicles[i].vehiclereg}`
        vehiclebutton.type = "button"
        vehiclebutton.setAttribute("onClick", "checkin(this)")
        vehiclebutton.setAttribute("data-id", `${data.bookingvehicles[i].id}`)
        vehiclebutton.setAttribute("data-type", "vehicle")
        
        //if checkin flag is true...
        if (data.bookingvehicles[i].checkedin) {
          //set the button green and change the data-instruction attribute. 
          vehiclebutton.className = "btn btn-success btn-lg"
          vehiclebutton.setAttribute("data-instruction", "checkout")
        }
        else {
          vehiclebutton.className = "btn btn-secondary btn-lg"
          vehiclebutton.setAttribute("data-instruction", "checkin")
        }
        vehiclesdiv.append(vehiclebutton)
      }
    }

    //populate the party member div.
    partydiv = document.querySelector("#partydiv")
    //for each party member...
    for (i = 0; i < data.bookingparty.length; i++) {

      //check if the vehicle is due to arrive today before displaying it.
      if (new Date(data.bookingparty[i].start).toDateString() === today.toDateString()) {
        memberbutton = document.createElement("button")
        memberbutton.innerHTML = `${data.bookingparty[i].firstname} ${data.bookingparty[i].surname} - ${data.bookingparty[i].type}`
        memberbutton.type = "button"
        memberbutton.setAttribute("onClick", "checkin(this)")
        memberbutton.setAttribute("data-id", `${data.bookingparty[i].id}`)
        memberbutton.setAttribute("data-type", "member")
        //if the checkin flag is true...
        if (data.bookingparty[i].checkedin) {
            memberbutton.className = "btn btn-success btn-lg"
            memberbutton.setAttribute("data-instruction", "checkout")
        }
        else {
            memberbutton.className = "btn btn-secondary btn-lg"
            memberbutton.setAttribute("data-instruction", "checkin")
        }
        partydiv.append(memberbutton)
      }
    }
  })
}

//function checks in the object represented by the booking
function checkin(button) {

  //get the if of the thing being checked in.
  pk = button.dataset.id
    
  //this line ascertains whether it is a vehicle or a person that is being checked in by the function.  
  type = button.dataset.type
  
  //this conditional sets the url to be used by the fetch request based on vehicle or person. 
  if (type === "member") {
    url = 'checkinguest'
  }
  else {
    url = 'checkinvehicle'
  }
  
  //get the checkin/reverse instruction.
  instruction = button.dataset.instruction

  // ascertains whether it is a check-in or reverse and sets the instruction accordingly.
  if (instruction === "checkin") {
    instruction = true
  } 
  else {
    instruction = false
  }

  //payload for the PATCH request.
  payload = {
    "pk": pk,
    "checkedin": instruction
  }
  //implements PATCH request
  fetch(url, {
    method: "PATCH",
    headers: {
        "X-CSRFToken": csrftoken,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    //checks that request was successful.
    if (!response.status === 200) {
      alert("Check-in/reverse action unsuccessful.  Please refresh page and try again")
      return
    }
    else {
      return response.json()
    }
  })
  .then(data => {
    //if the check-in instruction was sent.
    if (instruction === true) {
      //green button
      button.className = "btn btn-success btn-lg"
      button.dataset.instruction = "reverse"
    }
    //if the reverse instruction was sent.
    else {
      //grey button
      button.className = "btn btn-secondary btn-lg"
      button.dataset.instruction = "checkin"
    }
    
    //in the background, the due/arrived tables are being updated.  
    //grab the arrival row being amended. 
    targetarrival = document.querySelector(`#arrival-${data[0].pk}`)

    //this logic finds the member/vehicle in the arrivals lists and sets text color to green (via class)
    if (type === "member") {
      if (instruction === true) {
        targetarrival.querySelector(`#guest-${pk}`).className = "person checkedin"
      }
      else {
        targetarrival.querySelector(`#guest-${pk}`).className = "person"
      }
    }
    else {
      if (instruction === true) {
        targetarrival.querySelector(`#vehicle-${pk}`).className = "vehicle checkedin"
      }
      else {
        targetarrival.querySelector(`#vehicle-${pk}`).className = "vehicle"
      }
    }

    checkifallin(targetarrival)
    populatearrivalsummary()
       
  })
}

function checkifallin(element) {
  let partylist = element.querySelector(".partylist")
  let partymembers = partylist.children
  let checkedin = true
  for (let i = 0; i < partymembers.length; i++) {
    if (!(partymembers[i].classList.contains("checkedin"))) {
      checkedin = false
    }
  }
  if (checkedin === true) {
    element.className = "table-success"
  }
  else {
    element.className = ""
  }
  
}


function choosearrivalday(element) {
  element.form.submit()
}

function checktableonload() {
  duetable = document.querySelector("#duetable")
  arrivals = duetable.children
  for (let i = 0; i < arrivals.length; i++) {
    checkifallin(arrivals[i])
  }
}

function populatearrivalsummary() {
  
  checkedinvehiclecount = 0
  checkedinpersoncount = 0

  allduevehicles = document.querySelectorAll(".vehicle")
  console.log(allduevehicles)
  allduepeople = document.querySelectorAll(".person")
  console.log(allduepeople)


  allduevehiclescount = allduevehicles.length
  allduepeoplecount = allduepeople.length
  
  allduevehicles.forEach((vehicle) => {
    if (vehicle.classList.contains("checkedin")) {
      checkedinvehiclecount++
    }
  })

  allduepeople.forEach((person) => {
    if (person.classList.contains("checkedin")) {
      checkedinpersoncount++
    }
  })

  console.log(checkedinvehiclecount)
  console.log(checkedinpersoncount)

  document.querySelector("#totalvehiclecount").textContent = allduevehiclescount
  document.querySelector("#invehiclecount").textContent = checkedinvehiclecount
  document.querySelector("#duevehiclecount").textContent = allduevehiclescount - checkedinvehiclecount
  document.querySelector("#totalpersoncount").textContent = allduepeoplecount
  document.querySelector("#inpersoncount").textContent = checkedinpersoncount
  document.querySelector("#duepersoncount").textContent = allduepeoplecount - checkedinpersoncount

}

function loadfunction() {
  checktableonload()
  populatearrivalsummary()
}

document.addEventListener("DOMContentLoaded", loadfunction) 

