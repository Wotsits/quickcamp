from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth import logout
from django.http import JsonResponse, HttpResponse
from django.forms.models import model_to_dict
from django.core import serializers
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.templatetags.static import static
from django.db.models import Q
from rest_framework.generics import ListAPIView, RetrieveAPIView, CreateAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework import filters
import datedelta
from datetime import datetime, timedelta, date
import json
import matplotlib.pyplot as plt
import numpy

from .forms import BookingForm
from .models import Booking, Pitch, Guest, Vehicle, Rate, Payment
from .serializers import BookingSerializer, GuestSerializer, PitchSerializer, RateSerializer, PaymentSerializer

''' 

#This function is used to update payments in the booking record. 

def paymentsupdate(request):
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
    return redirect(reverse('calendar'))

'''


def calendar(request):
    return render(request, "bookingsbackend/calendar.html")


def dashboard(request):
    ###### presents a summary of the day's activity ######
    arrivals = Booking.objects.filter(start=date.today())
        
    #presents a visual summary of forecast arrival times
    arrivaltimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
    arrivalscountbytime = []

    for time in arrivaltimes:
        arrivalscountbytime.append(arrivals.filter(eta=time).count())
    
    highestcount = max(arrivalscountbytime)
    if highestcount <= 5:
        ylim = 5
    elif highestcount > 5 and highestcount <= 25:
        ylim = 25
    elif highestcount > 25 and highestcount <= 50:
        ylim = 50
    elif highestcount > 50 and highestcount <= 100:
        ylim = 100
    elif highestcount > 100:
        ylim = 200

    plt.figure(figsize=(8, 4))
    plt.plot(arrivaltimes, arrivalscountbytime)
    plt.xlabel("Time")
    plt.ylabel("Arrival Count")
    plt.ylim([0, ylim])
    plt.tight_layout()
    plt.fill_between(arrivaltimes, arrivalscountbytime, facecolor='#2A9382')
    savepath = '/Users/admin/Documents/SimonsProjects/CS50W/QuickCamp/quickcamp/bookingsbackend/static/images/arrivalsbytime.png'
    plt.savefig(savepath)
    
    #presents a visual summary of due vs checked-in
    #data
    arrivalscount = arrivals.count()
    checkedincount = [arrivals.filter(checkedin=True).count()]
    duecount=[arrivals.filter(checkedin=False).count()]
    y = [0]

    #plot
    plt.figure(figsize=(4,1))
    plt.barh(y, duecount, height=1, color='#2A9382')
    plt.barh(y, checkedincount, height=1, color='#15FFFD', left=duecount)

    #labels
    #decide distribution
    if arrivalscount < 25:
        ticksdistribution = 1
    elif arrivalscount < 100:
        ticksdistribution = 5
    else:
        ticksdistribution = 10
    plt.xticks(numpy.arange(0, arrivalscount+1, ticksdistribution))
    y_labels = ['Today']
    plt.yticks(y, y_labels)
    
    #grid
    plt.grid(axis='x')

    #save
    plt.tight_layout()
    savepath = '/Users/admin/Documents/SimonsProjects/CS50W/QuickCamp/quickcamp/bookingsbackend/static/images/arrivals.png'
    plt.savefig(savepath)

    #presents a summary of payments received today
    payments = Payment.objects.filter(creationdate=date.today())
    paymentsvalue = []
    for payment in payments:
        paymentsvalue.append(payment.value)
        
    paymentsvalue = sum(paymentsvalue)
    paymentsvalue = '%.2f' % paymentsvalue

    #presents a summary of payments received today
    editedpayments = Payment.objects.filter(lasteditdate__range=[date.today(), date.today() - datedelta.WEEK])
    if len(editedpayments) == 0:
        editedpayments = "Relax, everything's fine"

    return render(request, "bookingsbackend/dashboard.html", {
        'paymentsvalue': paymentsvalue,
        'editedpayments': editedpayments
    })



def arrivals(request):

    allarrivals = Booking.objects.filter(start=date.today())
    duearrivals = allarrivals.filter(checkedin=False).order_by("guest__surname")
    checkedinarrivals = allarrivals.filter(checkedin=True).order_by("guest__surname")

    return render(request, "bookingsbackend/arrivals.html", {
        "duearrivals": duearrivals,
        "checkedinarrivals": checkedinarrivals
    })


def checkinbyqr(request, pk):
    booking = Booking.objects.get(pk=pk)
    booking.checkedin = True
    booking.save()
    return redirect('viewbooking', pk=booking.id)


def viewbooking(request, pk):
    booking = Booking.objects.get(pk=pk)
    return render(request, 'bookingsbackend/bookingdetail.html', {
        "booking": booking
    })
    
######### API END POINTS ###########

class apiservelist(ListAPIView):
    pass

class apicreate(CreateAPIView):
    pass

class apiguestsearch(ListAPIView):
    search_fields = []

class apiservepaymentlist(ListAPIView):
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        bookingid = self.kwargs['pk']
        return Payment.objects.filter(booking=Booking.objects.get(id=bookingid))


class apiservedetail(RetrieveAPIView):
    pass

class apicheckinbooking(UpdateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    
    def get_object(self):
        payload = json.loads(self.request.body)
        pk = payload['pk']
        queryset = self.filter_queryset(self.get_queryset())
        obj = queryset.get(pk=pk)
        return obj

def apiserverate(request):
    start = date.fromisoformat(request.GET['start'])
    end = date.fromisoformat(request.GET['end'])

    #collate the applicable rates
    queryset1 = Rate.objects.filter(start__range=[start, end-timedelta(1)])
    queryset2 = Rate.objects.filter(end__range=[start+timedelta(1), end])
    queryset3 = Rate.objects.filter(start__range=["2001-01-01", start], end__range=[end, "2100-12-31"])
    rates = queryset1 | queryset2 | queryset3

    data = serializers.serialize("json", rates)                                                          #serialize availablepitches
    return HttpResponse(data, content_type='application/json')  




@csrf_exempt
def apicreatenewbooking(request):
    if request.method == "POST":
        payload = json.loads(request.body)
        guestid = payload['guestid']
        arrival = payload['arrival']
        departure = payload['departure']
        pitchid = payload['pitchid']
        adultno = payload['adultno']
        childno = payload['childno']
        infantno = payload['infantno']
        bookingrate = float(payload['bookingrate'])
        bookingpaid = float(payload['bookingpaid'])
        balance = bookingrate - bookingpaid
        paymentmethod = payload['paymentmethod']

    guest = Guest.objects.get(id=guestid)
    pitch = Pitch.objects.get(id=pitchid)
    vehreg = Vehicle.objects.get(vehiclereg="NONE")

    # catch circumstances where booking made which fouls this booking
    duplicate = False
    try: 
        Booking.objects.filter(pitch=pitch, arrival=arrival, departure=departure)
        duplicate = True
    except: 
        duplicate = False
    
    if duplicate == True:
        return 0
    
    #############################

    else: 
        newbooking = Booking(
            pitch=pitch, 
            guest=guest, 
            start=arrival, 
            end=departure, 
            adultno=adultno, 
            childno=childno, 
            infantno=infantno,
            bookingrate=bookingrate,
            totalpayments=bookingpaid,
            balance=balance
            )
        newbooking.save()
        newbooking.vehiclereg.add(vehreg)

        payment = Payment(
            value=bookingpaid,
            method=paymentmethod,
            booking=newbooking,
            status="Created"
        )
        payment.save()

    data = BookingSerializer(newbooking)
    return HttpResponse(data, content_type='application/json')

def apiserveavailablepitchlist(request):
    
    # obtains the iso format date from the GET params and converts to Date object
    start = date.fromisoformat(request.GET['start'])
    end = date.fromisoformat(request.GET['end'])

    bookingsstart = Booking.objects.filter(start__range=[start, end-timedelta(1)])                                  #extract all bookings where start date is within requested date range
    bookingsend = Booking.objects.filter(end__range=[start+timedelta(1), end])                                      #extract all bookings where end date is within requested date range
    bookingsacross = Booking.objects.filter(start__range=["2001-01-01", start], end__range=[end, "2100-12-31"])     #extract all bookings where dates straddle requested date range
    bookings = bookingsstart | bookingsend | bookingsacross                                                         #combine those lists

    unavailablepitches = []                                                                                         #instantiate list variable to store unavailable pitches
    for item in bookings:                                                                                           #extracts the pitch objects from those bookings and adds them to the unavailable pitches list. 
        unavailablepitches.append(item.pitch)
           
    allpitches = Pitch.objects.all()                                                                                #extract a queryset of all pitches on site.
    
    availablepitches = Pitch.objects.none()                                                                         #instatiates list viariable to store available pitches
    for pitch in allpitches:                                                                                        #check whether each item in allpitches is in unavailablepitches.  If not, add to availablepitches
        if pitch not in unavailablepitches:
            availablepitches |= Pitch.objects.filter(pk=pitch.pk)
    
    data = serializers.serialize("json", availablepitches)                                                          #serialize availablepitches
    return HttpResponse(data, content_type='application/json')                                                      #return json obj
   
####################################

