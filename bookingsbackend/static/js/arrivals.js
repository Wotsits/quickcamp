/*
JS for arrivals.html
*/

//////////////////////// GLOBAL VARIABLE INITIALISATION

const arrivalsfilterinput = document.querySelector('#arrivalssearch')
const duetableentries = document.querySelector('#duetable').childNodes
const arrivedtableentries = document.querySelector('#arrivedtable').childNodes

function arrivalsfilter() {
  contentofarrivalsfilter = arrivalsfilterinput.value
  if (contentofarrivalsfilter === "") {
      for (i=0; i<duetableentries.length; i++) {
          try {
              duetableentries[i].style.display = null
          } 
          catch(err){
              console.log(err.message)
          }
      }
      for (i=0; i<arrivedtableentries.length; i++) {
          try {
              arrivedtableentries[i].style.display = null
          }
          catch(err){
              console.log(err.message)
          }
          
      }

  }

  for (i=0; i<duetableentries.length; i++) {
      try{
          if (!(duetableentries[i].dataset.surname.includes(contentofarrivalsfilter))) {
              duetableentries[i].style.display = "None"
          }
          else {
              duetableentries[i].style.display = null
          }
      }
      catch(err){
          console.log(err.message)
      }
          
  }
  for (i=0; i<arrivedtableentries.length; i++) {
      try {  
          if (!(arrivedtableentries[i].dataset.surname.includes(contentofarrivalsfilter))) {
              arrivedtableentries[i].style.display = "None"
          }
          else {
              duetableentries[i].style.display = null
          }
      }
      catch(err){
          console.log(err.message)
      }
  }
}