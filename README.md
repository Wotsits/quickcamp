# quickcamp
A campsite management system which is built on Python's Django framework.  This project is my CS50Web campstone and is written as a way of exploring many different techniques. 

The back end of this project is built on the Django web framework whilst the front end is written using Vanilla JS.  Sadly, I discovered ReactJS after I'd begun coding this 
project so it's unnecessarily lengthy :-( The database of choice is PostgreSQL which has been chosen due to it's ability to scale and handle race conditions more effectively.

The project was written in a way which explores different tecniques.  The calendar views operate as an SPA, implementing AJAX requests to load data from the backend to the frontend.
The API's that handle these requests are a mix of FBVs and CBVs.  The Django Rest Framework is used in places to simplify the generation of API data. 

This project is a work in progress! :-D At the time of writing, the following implementations are planned:
- User permission setup.
- Securing the API endpoints against unauthorised access. 
- Addition of views to allow user setup and rate setup without using the admin app.
- Public facing front end to allow booking creation and amendments.
- Writing of unit tests.
- Exception handling - e.g. missing rates for dates, not pitches, no pitch types, etc. 

##### Setup of this application on your own machine #####

Setup of this application on your own machine is pretty straightforward.  The only quirk is that in order to create a superuser, a Site instance must first be created via the Shell.  This is 
because each user is related to a Site instance.  Then via the admin app:
- create at least one RateType instance
- create at least one Rate instance which covers this year. 
- create at least one PitchType instance.
- create at least one Pitch.

And away you go!!!
