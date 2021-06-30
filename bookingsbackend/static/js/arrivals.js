/*
JS for arrivals.html
*/

//////////////////////// GLOBAL VARIABLE INITIALISATION

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

//Function sorts arrivals table when elements are moved between due and arrived.  Called by checkin(). 
//Passed in table is the table into which the new entry has been placed.
function sortTable(table) {
  
  //set flag to true
  switching = true

  while (switching) {
    //set flag to false
    switching = false

    //grabs the rows of the table.
    rows = table.rows

    //for each row
    for (i=0; i<(rows.length-1); i++) {
      //set shouldswitch flag to false
      shouldswitch = false
      //grab the text content of the first field of row i and row i+1
      x = rows[i].getElementsByTagName("TD")[0].textContent.toLowerCase()
      y = rows[i+1].getElementsByTagName("TD")[0].textContent.toLowerCase()
      //compare them and if i is greater than i+1, change flag to should switch and break out of loop.
      if (x > y) {
        shouldswitch = true
        break
      }
    }

    //if shouldswitch flag true, switch position.
    if (shouldswitch) {
      rows[i].parentNode.insertBefore(rows[i+1], rows[i])
      switching = true
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

    //populate the party member div.
    partydiv = document.querySelector("#partydiv")
    //for each party member...
    for (i = 0; i < data.bookingparty.length; i++) {
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
    
    //in the background, the due/arrived tables are being reorganised.  
    //grab the arrival row being amended. 
    targetarrival = document.querySelector(`#arrival-${data[0].pk}`)

    //grab the duetablebody
    duetablebody = document.querySelector("#duetable")

    //grab the arrived table body. 
    arrivedtablebody = document.querySelector("#arrivedtable")
        
    //look at the checkin status of the booking to see if it is now completely checked in.
    if (data[0].fields.checkedin) {
      //if it is checked in, we need to move the booking from due to arrived table.  
      arrivedtablebody.append(targetarrival)                
    }
    else {
      //else, put it in the due table if not already there
      if (targetarrival.parentNode !== duetablebody) {
        duetablebody.append(targetarrival)
      }
    }

    //this logic finds the member/vehicle in the arrivals lists and sets text color to green (via class)
    if (type === "member") {
      if (instruction === true) {
        document.querySelector(`#guest-${pk}`).className = "checkedin"
      }
      else {
        document.querySelector(`#guest-${pk}`).className = ""
      }
    }
    else {
      if (instruction === true) {
        document.querySelector(`#vehicle-${pk}`).className = "checkedin"
      }
      else {
        document.querySelector(`#vehicle-${pk}`).className = ""
      }
    }

    //and then, finally, sort the table.
    sortTable(targetarrival.parentNode)
          
  })
}
