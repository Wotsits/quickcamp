from json import encoder
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.contrib.auth import default_app_config, logout, login, authenticate
from django.http import JsonResponse, HttpResponse
from django.forms.models import model_to_dict
from django.core import serializers as core_serializers
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.templatetags.static import static
from django.db.models import Q
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework import filters
from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta, date
from dateutil import parser
import json
import matplotlib.pyplot as plt
import numpy
from . import helpers

from .forms import *
from .models import *
from .serializers import *



#This function is used in shell to update payments in the booking record as a batch process when my testing has made a mess of things. 

def paymentsupdate():
    bookings = Booking.objects.all()
    payments = Payment.objects.all()

    for booking in bookings:
        paymentsforbooking = payments.filter(booking=booking)
        balance = booking.bookingrate
        totalpaymentvalue = sum([payment.value for payment in paymentsforbooking])
        for payment in paymentsforbooking:
            balance = balance - payment.value
        booking.totalpayments = totalpaymentvalue
        booking.balance = balance
        booking.save()
    return 1


#This function is used in shell to update party members and vehicles to match their host booking as a batch process when my testing has made a mess of things. 

def partymembercorrection():
    allbookings = Booking.objects.all()

    for booking in allbookings: 
        partymembers = PartyMember.objects.filter(booking=booking)
        for partymember in partymembers:
            partymember.start = booking.start
            partymember.end = booking.end
            partymember.save()
        partvehicles = PartyVehicle.objects.filter(booking=booking)
        for vehicle in partvehicles:
            vehicle.start = booking.start
            vehicle.end = booking.end
            vehicle.save()
    
    return 1
    


##################################################
############# LOG IN / LOG OUT VIEWS #############
##################################################

def login_view(request):
    if request.method == "GET":
        return render(request, "accounts/login.html", {})
    else:
        print("post request detected")
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            print("user logged in")
            return redirect(reverse("calendar"))
        else: 
            print("incorrect credentials")
            return redirect(reverse("login"))


def logout_view(request):
    logout(request)
    return redirect(reverse("login"))

##################################################
##################################################
##################################################



##################################################
############# Route rendering views ##############
##################################################


# renders the calendar template when called.
@login_required
def calendar(request):
    return render(request, "bookingsbackend/calendar.html")



# renders the dashboard template when called and populates it.  This view presents a summary of the day's activity 
@login_required
def dashboard(request):

    # obtain the dataset once at the beginning of the flow
    arrivals = Booking.objects.filter(start=date.today())
        
    ######## DASHBOARD ELEMENT 1 ########
    # presents a visual summary of forecast arrival times
    
    # initialize a list of time strings.
    arrivaltimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    # initialize a list to hold counts against each time string
    arrivalscountbytime = []

    # for each string in arrivaltimes, check for that string in arrivals queryset->ETA and append the count to the count list
    for time in arrivaltimes:
        arrivalscountbytime.append(arrivals.filter(eta=time).count())
    
    # get the highest count in the list
    highestcount = max(arrivalscountbytime)
    # use that highestcount to determine the ylim value for the graph. 
    if highestcount <= 5:
        ylim = 5
    elif highestcount > 5 and highestcount <= 25:
        ylim = 25
    elif highestcount > 25 and highestcount <= 50:
        ylim = 50
    elif highestcount > 50 and highestcount <= 100:
        ylim = 100
    elif highestcount > 100:
        ylim = highestcount+20

    # plot the graph using matplotlib syntax
    plt.figure(figsize=(8, 4))
    plt.plot(arrivaltimes, arrivalscountbytime)
    plt.xlabel("Time")
    plt.ylabel("Arrival Count")
    plt.ylim([0, ylim])
    plt.tight_layout()
    plt.fill_between(arrivaltimes, arrivalscountbytime, facecolor='#2A9382')
    # save the graph - TODO as path needs to not be hardcoded
    savepath = '/Users/admin/Documents/SimonsProjects/CS50W/QuickCamp/quickcamp/bookingsbackend/static/images/arrivalsbytime.png'
    plt.savefig(savepath)
    

    ######## DASHBOARD ELEMENT 2 ########
    # presents a visual summary of due vs checked-in

    # obtain a count of all today's arrivals.
    arrivalscount = arrivals.count()
    # obtain a count of all checked-in arrivals. 
    checkedincount = arrivals.filter(checkedin=True).count()
    # calculate due arrivals
    duecount = (arrivalscount - checkedincount) 
    # set value of y for plotting
    y = [0]

    # plot using matplotlib syntax
    plt.figure(figsize=(4,1))
    plt.barh(y, duecount, height=1, color='#2A9382')
    plt.barh(y, checkedincount, height=1, color='#15FFFD', left=duecount)

    # labels
    # decide distribution of labels
    if arrivalscount < 25:
        ticksdistribution = 1
    elif arrivalscount < 100:
        ticksdistribution = 5
    else:
        ticksdistribution = 10
    
    plt.xticks(numpy.arange(0, arrivalscount+1, ticksdistribution))
    y_labels = ['Today']
    plt.yticks(y, y_labels)
    
    # set grid
    plt.grid(axis='x')

    # save - TODO as path needs to not be hardcoded
    plt.tight_layout()
    savepath = '/Users/admin/Documents/SimonsProjects/CS50W/QuickCamp/quickcamp/bookingsbackend/static/images/arrivals.png'
    plt.savefig(savepath)

    ######## DASHBOARD ELEMENT 3 ########
    # presents a summary of payments received today

    # obtain dataset of payments made today.
    payments = Payment.objects.filter(creationdate=date.today())
    # create a list to store the payment values
    paymentsvalue = []
    # populate that list
    for payment in payments:
        paymentsvalue.append(payment.value)
    
    # sum the values in the list and present to 2dp float.
    paymentsvalue = sum(paymentsvalue)
    paymentsvalue = '%.2f' % paymentsvalue

    # render page
    return render(request, "bookingsbackend/dashboard.html", {
        'paymentsvalue': paymentsvalue,
    })




# renders the arrivals template when called and populates it.  This view presents the daily arrivals list.
@login_required
def oldarrivalsfunction(request):

    try: 
        arrivaldate = request.GET['arrivaldate']
    except:
        arrivaldate = date.today()
    
    # grab all the arrivals due today
    allarrivals = Booking.objects.filter(start=arrivaldate)
    
    # filter for due and checked-in and order each by guest surname.
    duearrivals = allarrivals.filter(checkedin=False).order_by("guest__surname")
    checkedinarrivals = allarrivals.filter(checkedin=True).order_by("guest__surname")
    
    # render the page. 
    return render(request, "bookingsbackend/arrivals.html", {
        "duearrivals": duearrivals,
        "checkedinarrivals": checkedinarrivals
    })


@login_required
def arrivals(request):

    try: 
        arrivaldate = request.GET['arrivaldate']
    except:
        arrivaldate = date.today()
    
    # grab all the arrivals due today
    allarrivals = Booking.objects.filter(bookingparty__in = PartyMember.objects.filter(start=arrivaldate)).distinct()
    
    # filter for due and checked-in and order each by guest surname.
    duearrivals = allarrivals.filter(checkedin=False).order_by("guest__surname")
    checkedinarrivals = allarrivals.filter(checkedin=True).order_by("guest__surname")
    
    # render the page. 
    return render(request, "bookingsbackend/arrivals.html", {
        "duearrivals": duearrivals,
    })
    
##################################################
##################################################
##################################################



##################################################
################# API ENDPOINTS ##################
##################################################

################# Class-based views ##############

# CBV serves pitch list
# This view serves the pitches to render in the calendar view.
# Customer get_queryset method filters pitch list by site. 
class apiservepitchlist(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        site = self.request.user.site
        return Pitch.objects.filter(site=site)

# CBV serves pitch list
# This view serves the pitches to render in the calendar view.
# Customer get_queryset method filters pitch list by site. 
class apiservepitchtypelist(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        site = self.request.user.site
        return PitchType.objects.filter(site=site)
        
# CBV serves bookings list
# This view serves a list of bookings to render in the calendar view.  
# Custom get_queryset method filters bookings to show those starting, ending or crossing the calendar date range.
class apiservebookingslist(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    

    def get_queryset(self):
        site = self.request.user.site
        start = parser.parse(self.request.GET['start'])
        end = parser.parse(self.request.GET['end'])
        bookingsforsite = Booking.objects.filter(pitch__site=site)
        queryset1 = bookingsforsite.filter(start__range=[start, end-timedelta(1)])
        queryset2 = bookingsforsite.filter(end__range=[start+timedelta(1), end])
        queryset3 = bookingsforsite.filter(start__range=["2001-01-01", start], end__range=[end, "2100-12-31"])
        return queryset1 | queryset2 | queryset3


# CBV create view.  
# Used for simple create actions.
class apicreate(CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]




# CBV list view.
# Used for guest search functionality. 
class apiguestsearch(ListAPIView):
    search_fields = []


# CBV list view. 
# Custom get_queryset method to serve payments associated with specific booking. 
class apiservepaymentlist(ListAPIView):
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        bookingid = self.kwargs['pk']
        return Payment.objects.filter(booking=Booking.objects.get(id=bookingid))


# CBV retrieve view.
# Used for simple retrieve actions including serving booking model instance.
class apiservedetail(RetrieveAPIView):
    pass



########## Function-based Views ############

# helper function
def updateBookingIfAllIn(booking):
    '''
    This function is called after a member of the party is checked in or out.  
    If all members are checked in, the checked in status of the booking is updated
    If all members are checked in and then one is checked out, 
    the checked in status of the booking is reverted to false
    '''

    # Queryset called which presents any party members not checked in.  
    guests = PartyMember.objects.filter(booking=booking, checkedin=False)

    # If the length of the queryset is 0, this means that there are no uncheckedin party members.  
    if len(guests) == 0:
        # therefore the booking can be checked in.  
        booking.checkedin = True
        booking.save()
    else:
        # else, the booking is not complete and checkedin flag is false. 
        booking.checkedin = False
        booking.save()

    return booking


# FBV to check-in a guest
def checkinguest(request):
    # unpackage payload
    payload = json.loads(request.body)
    pk = payload['pk']
    checkedin = payload['checkedin']

    # get the partymember being checked in on frontend and update checkedin boolean
    guest = PartyMember.objects.get(pk=pk)
    guest.checkedin = checkedin
    guest.save()
    # get the related booking and pass into the helper function above. 
    booking = guest.booking
    booking = updateBookingIfAllIn(booking)

    # return the booking
    data = core_serializers.serialize('json', [booking, ])                                                       #serialize availablepitches
    return HttpResponse(data, status=200, content_type='application/json') 
    

# FBV to check-in a vehicle TODO this can be condensed with check-in guest as same flow/logic
def checkinvehicle(request):
    payload = json.loads(request.body)
    pk = payload['pk']
    checkedin = payload['checkedin']

    vehicle = PartyVehicle.objects.get(pk=pk)
    vehicle.checkedin = checkedin
    vehicle.save()
    booking = vehicle.booking
    booking = updateBookingIfAllIn(booking)
    
    data = core_serializers.serialize('json', [booking, ])                                                       #serialize availablepitches
    return HttpResponse(data, status=200, content_type='application/json')
    

# FBV to amend payment instance
def apiamendpayment(request):
    
    # unpack payload.
    payload = json.loads(request.body)
    pk = payload['pk']
    creationdate = payload['creationdate']
    value = payload['value']
    method = payload['method']
    
    # get target payment instance.
    payment = Payment.objects.get(pk=pk)

    # obtains original state for payment log entry later.
    originalstate = f'CreationDate = {payment.creationdate}, value = {payment.value}, method = {payment.method}'
    
    # update the instance fields.
    payment.creationdate = creationdate
    payment.value = value
    payment.method = method
    payment.save()

    # set new state description for addition to log.
    newstate = f'CreationDate = {payment.creationdate}, value = {payment.value}, method = {payment.method}'

    # sum value of payments and update the booking instance.
    # get the booking assocated with the payment.
    booking = payment.booking
    # get all payments associated with that booking
    payments = Payment.objects.filter(booking=booking)
    # initialise a variable to store the sum of payments.
    sum = 0
    # loop payments that add to sum
    for payment in payments:
        sum = sum + payment.value
    # update the booking instance 
    booking.totalpayments = sum
    booking.balance = booking.bookingrate - booking.totalpayments
    booking.save()

    # create paymentlog entry
    paymentlogcomment = f'Original State [{originalstate}] /nNew State [{newstate}'
    entry = PaymentChange(payment=payment.id, comment=paymentlogcomment, user=request.user)
    entry.save()

    # return the payment data.  
    paymentdata = PaymentSerializer(payment)
    return HttpResponse(paymentdata, status=200, content_type='application/json')
   

# FBV to delete payment instance.
@login_required
def apideletepayment(request, pk):
    
    # get the payment instance.
    payment = Payment.objects.get(pk=pk)

    # create paymentlog entry
    paymentlogcomment = f'Deleted payment {pk}'
    entry = PaymentChange(payment=payment.id, comment=paymentlogcomment, user=request.user)
    entry.save()

    # delete the payment    
    payment.delete()

    # sum value of payments - TODO factor out to helper function as used twice.
    booking = payment.booking
    payments = Payment.objects.filter(booking=booking)
    sum = 0
    for payment in payments:
        sum = sum + payment.value
    booking.totalpayments = sum
    booking.balance = booking.bookingrate - booking.totalpayments
    booking.save()

    # return 200
    data = core_serializers.serialize('json', [payment, ])  
    return HttpResponse(data, status=202, content_type='application/json')
   

# FBV to serve rates to front end
@login_required
def apiserverate(request):
    # parse params from GET request
    rateid = int(request.GET['ratetype'])
    start = date.fromisoformat(request.GET['start'])
    end = date.fromisoformat(request.GET['end'])

    ratetype = RateType.objects.get(id=rateid)
    # collate the applicable rates
    queryset = Rate.objects.filter(ratetype=ratetype)
    queryset1 = queryset.filter(start__range=[start, end-timedelta(1)])
    queryset2 = queryset.filter(end__range=[start+timedelta(1), end])
    queryset3 = queryset.filter(start__range=["2001-01-01", start], end__range=[end, "2100-12-31"])
    rates = queryset1 | queryset2 | queryset3

    # return the applicable rates
    data = core_serializers.serialize("json", rates)                                                          #serialize availablepitches
    return HttpResponse(data, content_type='application/json')  


# FBV to serve list of extras - TODO change to CBV.
@login_required
def apiserveextras(request):
    availableextras = Extra.objects.filter(site=request.user.site)
    data = core_serializers.serialize("json", availableextras)
    return HttpResponse(data, content_type='application/json')


# FBV to create new booking.
@login_required
def apicreatenewbooking(request):

    # unpack payload
    if request.method == "POST":
        payload = json.loads(request.body)
        guestid = payload['guestid']
        arrival = payload['arrival']
        departure = payload['departure']
        pitchid = payload['pitchid']
        adultno = payload['adultno']
        childno = payload['childno']
        infantno = payload['infantno']
        petno = payload['petno']
        vehicleno = payload['vehicleno']
        bookingratetypeid = int(payload['bookingratetype'])
        bookingrate = float(payload['bookingrate'])
        bookingpaid = float(payload['bookingpaid'])
        balance = bookingrate - bookingpaid
        paymentmethod = payload['paymentmethod']

    # get the guest and pitch instances associated with the ids sent from frontend.
    guest = Guest.objects.get(id=guestid)
    pitch = Pitch.objects.get(id=pitchid)
    bookingratetype = RateType.objects.get(id=bookingratetypeid)

    # catch circumstances where booking made which fouls this booking
    duplicate = False
    try: 
        # TODO - this needs work as it doesn't do what I need it to do.  Only catches exact matches, not bookings that straddle dates.
        Booking.objects.filter(pitch=pitch, arrival=arrival, departure=departure)
        duplicate = True
    except: 
        duplicate = False
    
    if duplicate == True:
        return 0
    
    #############################

    else: 
        # make new booking instance.
        newbooking = Booking(
            pitch           =pitch, 
            guest           =guest, 
            start           =arrival, 
            end             =departure, 
            adultno         =adultno, 
            childno         =childno, 
            infantno        =infantno,
            petno           =petno,
            vehicleno       =vehicleno,
            bookingratetype =bookingratetype,
            bookingrate     =bookingrate,
            totalpayments   =bookingpaid,
            balance         =balance
            )
        newbooking.save()

        # record a new payment
        payment = Payment(
            value=bookingpaid,
            method=paymentmethod,
            booking=newbooking,
        )
        payment.save()

        # count the total number of guests in the party.
        guestnumber = int(adultno) + int(childno) + int(infantno)
        partycomposition = ["Adult" for x in range(int(adultno))] + ["Child" for x in range(int(childno))] + ["Infant" for x in range(int(infantno))]

        # create a blank party member record for each member of the party to updated later. Names to be updated later by guest in public facing app.
        for i in range(guestnumber):
            partymember = PartyMember(
                firstname="",
                surname="",
                booking=newbooking, 
                start=newbooking.start,
                end=newbooking.end,
                type=partycomposition[i]
            )
            partymember.save()
        for i in range(int(vehicleno)):
            partyvehicle = PartyVehicle(
                vehiclereg="",
                booking=newbooking,
                start=newbooking.start,
                end=newbooking.end,
            )
            partyvehicle.save()
        for i in range(int(petno)):
            partypet = PartyPet(
                name="",
                booking=newbooking,
                start=newbooking.start,
                end=newbooking.end,
            )
            partypet.save()

    #return the booking.
    data = BookingSerializer(newbooking)
    return HttpResponse(data, content_type='application/json')


# FBV to serve available pitches (used by JS createnewbooking pane).
@login_required
def apiserveavailablepitchlist(request):
    
    #TODO - this FBV needs work as inefficient.  Some early work here!
 
    # obtains the iso format date from the GET params and converts to Date object
    start = date.fromisoformat(request.GET['start'])
    end = date.fromisoformat(request.GET['end'])
    unit = request.GET['unit']
    size = request.GET['size']
    ehu = request.GET['ehu']
    awning = request.GET['awning']

    # get all bookings within the date range
    bookingsstart = Booking.objects.filter(start__range=[start, end-timedelta(1)])                                  #extract all bookings where start date is within requested date range
    bookingsend = Booking.objects.filter(end__range=[start+timedelta(1), end])                                      #extract all bookings where end date is within requested date range
    bookingsacross = Booking.objects.filter(start__range=["2001-01-01", start], end__range=[end, "2100-12-31"])     #extract all bookings where dates straddle requested date range
    bookings = bookingsstart | bookingsend | bookingsacross                                                         #combine those lists

    # initialize variable to contain list of unavailable pitches.
    unavailablepitches = []                                                                                         #instantiate list variable to store unavailable pitches
    # append each pitch in bookings to that list
    for item in bookings:                                                                                           #extracts the pitch objects from those bookings and adds them to the unavailable pitches list. 
        unavailablepitches.append(item.pitch)
           
    # get all pitches associated with the user's site 
    allpitches = Pitch.objects.filter(site=request.user.site)                                                                                #extract a queryset of all pitches on site.
    
    # intialize an empty dataset
    availablepitches = Pitch.objects.none()                                                                         #instatiates list viariable to store available pitches
    # loop through all pitches and if pitch does't appear in unavailable pitches, add the pitch instance.
    for pitch in allpitches:                                                                                        #check whether each item in allpitches is in unavailablepitches.  If not, add to availablepitches
        if pitch not in unavailablepitches:
            availablepitches |= Pitch.objects.filter(pk=pitch.pk)
    
    # unit type filter logic
    if unit == 'van':
        availablepitches = availablepitches.filter(acceptsvan=True)
            
    elif unit == 'trailertent':
        availablepitches = availablepitches.filter(acceptstrailertent=True)

    elif unit == 'caravan':
        availablepitches = availablepitches.filter(acceptscaravan=True)
    
    elif unit == 'tent':
        availablepitches = availablepitches.filter(acceptstent=True)
    
    else:
        print('Unit type is not defined in backend logic')
    
    # ehu filter logic
    if ehu == "true":
        availablepitches = availablepitches.filter(haselec=True)
    
    # awning filter logic
    if awning == "true":
        availablepitches = availablepitches.filter(takesawning=True)


    #return the available pitches
    data = core_serializers.serialize("json", availablepitches)                                                          #serialize availablepitches
    return HttpResponse(data, content_type='application/json')                                                      #return json obj
   

# FBV to create new payment.
@login_required
def apicreatenewpayment(request): 
    if request.method == "POST":
        # unpack payload
        payload = json.loads(request.body)
        bookingid = payload['bookingid']
        date = payload['date']
        value = payload['value']
        method = payload['method']
        booking = Booking.objects.get(pk=int(bookingid))

        # create new payment instance.
        payment = Payment(
            creationdate=date,
            value=value,
            method=method,
            booking=booking
        )
        payment.save()
        
        # recalculate helper function for booking instance here.
        allbookingpayments = Payment.objects.filter(booking=booking)
        paymentssum = 0
        for payment in allbookingpayments:
            paymentssum = paymentssum + payment.value
        booking.totalpayments = paymentssum
        # recalculate the rates based on new booking attributes
        booking.bookingrate = helpers.recalculaterates(booking, booking.bookingparty, booking.bookingpets, booking.bookingvehicles)
        booking.balance     = booking.bookingrate - booking.totalpayments

        booking.save()

        # return the payment
        data = PaymentSerializer(payment)
        return HttpResponse(data, content_type='application/json')


# FBV create comment view.  
# Used to create new comment.
def apicreatecomment(request):
    payload = json.loads(request.body)
    bookingid = payload['bookingid']
    comment = payload['comment']
    important = payload['important']
    booking = get_object_or_404(Booking, pk=bookingid)
    comment = Comment(
        booking = booking,
        comment = comment,
        important = important
    )
    comment.save()
    
    data = core_serializers.serialize('json', [comment, ])  
    return HttpResponse(data, status=202, content_type='application/json')


def apiaddpartyitem(request):
    
    # unpack payload
    payload = json.loads(request.body)
    bookingid = payload['bookingid']
    itemtype = payload['itemtype']

    booking = Booking.objects.get(id=bookingid)

    if itemtype == "member":
        newitem = PartyMember(
            firstname = "",
            surname = "",
            type = "Adult",
        )
    elif itemtype == "pet":
        newitem = PartyPet(
            name = ""
        )
    elif itemtype == "vehicle":
        newitem = PartyVehicle(
            vehiclereg = ""
        )
    
    newitem.checkedin = False
    newitem.noshow = False
    newitem.booking = booking
    newitem.start = booking.start
    newitem.end = booking.end
    newitem.save()

    helpers.updatebooking("add", newitem, booking)

    data = core_serializers.serialize('json', [newitem, ])  
    return HttpResponse(data, status=202, content_type='application/json')

# FBV delete party member view.  
# Used to delete party member after reduction of party numbers.
def apideletepartyitem(request):
    payload = json.loads(request.body)
    itemid = payload['itemid']
    itemtype = payload['itemtype']

    if itemtype == "member":
        target = get_object_or_404(PartyMember, pk=itemid)
    elif itemtype == "vehicle":
        target = get_object_or_404(PartyVehicle, pk=itemid)
    elif itemtype == "pet":
        target = get_object_or_404(PartyPet, pk=itemid)

    booking = target.booking
    target.delete()

    helpers.updatebooking("delete", target, booking)
    
    data = core_serializers.serialize('json', [booking, ])  
    return HttpResponse(data, status=200, content_type='application/json')


# FBV update party item view.
# Used to update party members and vehicles.
def apiupdatepartyitem(request):

    # get the payload from the incoming AJAX PATCH request
    payload = json.loads(request.body)
    
    # get the booking to which this request relates.  
    booking = Booking.objects.get(id=payload['bookingid'])
    
    # get the item id and type which is being updated 
    itemid = payload['itemid']
    itemtype = payload['itemtype']
    
    # get the item attribute which is being updates and the new value for that attribute.
    itemattribute = payload['itemattribute']
    newvalue = payload['newvalue']

    # get the item being updated
    if itemtype == "member":
        target = PartyMember.objects.get(id=itemid)
    elif itemtype == "pet":
        target = PartyPet.objects.get(id=itemid)
    elif itemtype == "vehicle":
        target = PartyVehicle.objects.get(id=itemid)
    
    # if the attribute being updated is a start or end date, we need to check that the change is possible.  
    if itemattribute == "start" or itemattribute == "end":
        newvalue = date.fromisoformat(newvalue)
        setattr(target, itemattribute, newvalue)
        amendmentpossible = helpers.checkamendmentpossible(target, booking)
        if not amendmentpossible:
            return HttpResponse(status=400)
    
    # otherwise, just update the attribute and...
    else:
        setattr(target, itemattribute, newvalue)

    # save the new state of the target instance.
    target.save()

    # then update the host booking. 
    helpers.updatebooking("amend", target, booking)
    
    data = core_serializers.serialize('json', [target, ])  
    return HttpResponse(data, status=200, content_type='application/json')


def apimovebooking(request, bookingid):
    
    # grab the target booking.
    target = Booking.objects.get(id=bookingid)
    
    # unpack payload
    payload = json.loads(request.body)
    newstartdate = date.fromtimestamp(int(payload['newstart'])/1000) # converts the epoch to date object.
    newpitch = int(payload['newpitch'])
    
    bookinglength = target.end - target.start
    
    # obtain all the partyitems
    partymembers = PartyMember.objects.filter(booking=target)
    partypets = PartyPet.objects.filter(booking=target)
    partyvehicles = PartyVehicle.objects.filter(booking=target)
    
    # itialize variable to store date offsets
    partymembersoffsetstoragedict = []
    partypetsoffsetstoragedict = []
    partyvehiclesoffsetstoragedict = []

    # ascertain the existing offsets for each item.
    for i in range(len(partymembers)):
        storagedict = {
            'offsetfromstart': partymembers[i].start - target.start,
            'lengthofstay': partymembers[i].end - partymembers[i].start
        }
        partymembersoffsetstoragedict.append(storagedict) 
    
    for i in range(len(partypets)):
        storagedict = {
            'offsetfromstart': partypets[i].start - target.start,
            'lengthofstay': partypets[i].end - partypets[i].start
        }
        partypetsoffsetstoragedict.append(storagedict)

    for i in range(len(partyvehicles)):
        storagedict = {
            'offsetfromstart': partyvehicles[i].start - target.start,
            'lengthofstay': partyvehicles[i].end - partyvehicles[i].start
        }
        partyvehiclesoffsetstoragedict.append(storagedict)
    
    # update the target booking with the new start date and pitch.
    target.start = newstartdate
    target.end = target.start + bookinglength    
    target.pitch = Pitch.objects.get(id=newpitch)

    # TODO need logic here to check the move is possible

    for i in range(len(partymembers)):
        partymembers[i].start = target.start + partymembersoffsetstoragedict[i]["offsetfromstart"]
        partymembers[i].end = partymembers[i].start + partymembersoffsetstoragedict[i]["lengthofstay"]
        partymembers[i].save()

    for i in range(len(partypets)):
        partypets[i].start = target.start + partypetsoffsetstoragedict[i]["offsetfromstart"]
        partypets[i].end = partypets[i].start + partypetsoffsetstoragedict[i]["lengthofstay"]
        partypets[i].save()

    for i in range(len(partyvehicles)):
        partyvehicles[i].start = target.start + partyvehiclesoffsetstoragedict[i]["offsetfromstart"]
        partyvehicles[i].end = partyvehicles[i].start + partyvehiclesoffsetstoragedict[i]["lengthofstay"]
        partyvehicles[i].save()

    target.save()

    helpers.updatebooking("delete", PartyMember(), target)

    data = core_serializers.serialize('json', [target, ])  
    return HttpResponse(data, status=200, content_type='application/json')

# CBV list view. 
# Custom get_queryset method to serve payments associated with specific booking. 
class apiserveratetypes(ListAPIView):
    queryset = RateType.objects.all()
    serializer_class = RateTypeSerializer
    
    


'''
 if request.method == "PATCH":
        # unpack payload
        payload = json.loads(request.body)
        # get the target booking instance
        booking = Booking.objects.get(pk=pk)
        
        #the following logic detects the type of booking amendment being sent and implements change accordingly
        #checks is it is a new lead guest amendment
        if 'newguestid' in payload:
            # unpack
            newguestid = payload['newguestid']
            # update instance
            booking.guest = Guest.objects.get(pk=newguestid)
            booking.save()
'''