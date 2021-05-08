from django.contrib import admin
from django.urls import path
from . import views
from rest_framework import filters
from .views import apiservelist, apiservedetail, apiguestsearch, apiservepaymentlist, apicreate, apicheckinbooking
from .models import Booking, Pitch, Guest, Payment
from .serializers import BookingSerializer, PitchSerializer, GuestSerializer, PaymentSerializer


urlpatterns = [
    path("", views.calendar, name="calendar"),
    path("servebookings", apiservelist.as_view(queryset=Booking.objects.all(), serializer_class=BookingSerializer), name="apiservebookings"),
    path("servepitches", apiservelist.as_view(queryset=Pitch.objects.all(), serializer_class=PitchSerializer), name="apiservepitches"),
    path("booking/<int:pk>", apiservedetail.as_view(queryset=Booking.objects.all(), serializer_class=BookingSerializer), name="apiservebookingdetail"),
    path("guestsearch", apiguestsearch.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer, filter_backends=[filters.SearchFilter], search_fields=['^email']), name="apiguestsearch"),
    path("guest/<int:pk>", apiservedetail.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer), name="apiserveguestdetail"),
    path("serveavailablepitchlist", views.apiserveavailablepitchlist, name="apiserveavailablepitches"),
    path("createnewbooking", views.apicreatenewbooking, name="createnewbooking"),
    path("fetchrate", views.apiserverate, name="apiserverate"),
    path("servepaymentinfo/<int:pk>", apiservepaymentlist.as_view(), name="apiservepayments"),
    path("createnewguest", apicreate.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer), name="apicreateview"),
    path("dashboard", views.dashboard, name="dashboard"),
    path("arrivals", views.arrivals, name="arrivals"),
    path("checkinapi", apicheckinbooking.as_view(), name="apicheckinbooking"),
    path("checkin/<int:pk>", views.checkinbyqr, name="checkinbyqr"),
    path("viewbooking/<int:pk>", views.viewbooking, name="viewbooking"),
]
