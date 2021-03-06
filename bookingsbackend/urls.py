from django.contrib import admin
from django.urls import path
from . import views
from rest_framework import filters
from .models import *
from .serializers import *


urlpatterns = [
    # Page render routes
    path("", views.calendar, name="calendar"),
    path("arrivals", views.arrivals, name="arrivals"),
    path("dashboard", views.dashboard, name="dashboard"),

    # login/logout routes
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),

    # API routes
    path("servebookings", views.apiservebookingslist.as_view(queryset=Booking.objects.all(), serializer_class=BookingSerializer), name="apiservebookings"),
    path("servepitches", views.apiservepitchlist.as_view(queryset=Pitch.objects.all(), serializer_class=PitchSerializer), name="apiservepitches"),
    path("servepitchtypes", views.apiservepitchtypelist.as_view(queryset=PitchType.objects.all(), serializer_class=PitchTypeSerializer), name="apiservepitchtype"),
    path("booking/<int:pk>", views.apiservedetail.as_view(queryset=Booking.objects.all(), serializer_class=BookingSerializer), name="apiservebookingdetail"),
    path("guestsearch", views.apiguestsearch.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer, filter_backends=[filters.SearchFilter], search_fields=['^email']), name="apiguestsearch"),
    path("guest/<int:pk>", views.apiservedetail.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer), name="apiserveguestdetail"),
    path("serveavailablepitchlist", views.apiserveavailablepitchlist, name="apiserveavailablepitches"),
    path("createnewbooking", views.apicreatenewbooking, name="createnewbooking"),
    path("fetchratetypes", views.apiserveratetypes.as_view(), name="apiserveratetypes"),
    path("fetchrate", views.apiserverate, name="apiserverate"),
    path("servepaymentinfo/<int:pk>", views.apiservepaymentlist.as_view(), name="apiservepayments"),
    path("createnewguest", views.apicreate.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer), name="apicreateview"),
    path("checkinguest", views.checkinguest, name="apicheckinbooking"),
    path("checkinvehicle", views.checkinvehicle, name="apicheckinbooking"),
    path("amendpayment", views.apiamendpayment, name="amendpayment"),
    path("deletepayment/<int:pk>", views.apideletepayment, name="deletepayment"),
    path("createnewpayment", views.apicreatenewpayment, name="createpayment"),
    path("serveextras", views.apiserveextras, name="apiserveextras"),
    path("createnewcomment", views.apicreatecomment, name="apicreatenewcomment"),
    path("addpartyitem", views.apiaddpartyitem, name="apiaddpartyitem"),
    path("deletepartyitem", views.apideletepartyitem, name="apideletepartyitem"),
    path("updatepartyitem", views.apiupdatepartyitem, name="apiupdatepartyitem"),
    path("movebooking/<int:bookingid>", views.apimovebooking, name="apimovebooking")
]
