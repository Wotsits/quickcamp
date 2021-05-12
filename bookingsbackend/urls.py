from django.contrib import admin
from django.urls import path
from . import views
from rest_framework import filters
from .models import Booking, Pitch, Guest, Payment
from .serializers import BookingSerializer, PitchSerializer, GuestSerializer, PaymentSerializer


urlpatterns = [
    path("", views.calendar, name="calendar"),
    path("servebookings", views.apiservebookingslist.as_view(queryset=Booking.objects.all(), serializer_class=BookingSerializer), name="apiservebookings"),
    path("servepitches", views.apiservepitchlist.as_view(queryset=Pitch.objects.all(), serializer_class=PitchSerializer), name="apiservepitches"),
    path("booking/<int:pk>", views.apiservedetail.as_view(queryset=Booking.objects.all(), serializer_class=BookingSerializer), name="apiservebookingdetail"),
    path("guestsearch", views.apiguestsearch.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer, filter_backends=[filters.SearchFilter], search_fields=['^email']), name="apiguestsearch"),
    path("guest/<int:pk>", views.apiservedetail.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer), name="apiserveguestdetail"),
    path("serveavailablepitchlist", views.apiserveavailablepitchlist, name="apiserveavailablepitches"),
    path("createnewbooking", views.apicreatenewbooking, name="createnewbooking"),
    path("fetchrate", views.apiserverate, name="apiserverate"),
    path("servepaymentinfo/<int:pk>", views.apiservepaymentlist.as_view(), name="apiservepayments"),
    path("createnewguest", views.apicreate.as_view(queryset=Guest.objects.all(), serializer_class=GuestSerializer), name="apicreateview"),
    path("dashboard", views.dashboard, name="dashboard"),
    path("arrivals", views.arrivals, name="arrivals"),
    path("checkinapi", views.apicheckinbooking.as_view(), name="apicheckinbooking"),
    path("viewbooking/<int:pk>", views.viewbooking, name="viewbooking"),
    path("amendpayment", views.apiamendpayment, name="amendpayment"),
    path("deletepayment/<int:pk>", views.apideletepayment, name="deletepayment"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),

]
