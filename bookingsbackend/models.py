from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models.deletion import PROTECT
from django.db.models.enums import Choices
from django.db.models.fields import CharField
from django.db.models.fields.related import ManyToManyField
from datetime import date

class Site(models.Model):
    name = models.CharField(max_length=255)
    address1 = models.CharField(max_length=20, default="Address1")
    address2 = models.CharField(max_length=20, default="Address2")
    towncity = models.CharField(max_length=20, default="Town/City")
    county = models.CharField(max_length=20, default="County")
    postcode = models.CharField(max_length=20, default="AA1 1AA")
    vatregno = models.CharField(max_length=20, default="GB 00000000")
    telephone = models.CharField(max_length=20, default="01111 111111")
    email = models.CharField(max_length=20, default="site@site.com")

    def __str__(self):
        return f'{self.name}'

class User(AbstractUser):
    site = models.ForeignKey(Site, on_delete=models.CASCADE)

class Pitch(models.Model):
    name = models.CharField(max_length=255)
    site = models.ForeignKey(Site, null=True, on_delete=models.CASCADE)

    def __str__(self):
        return f'Pitch No {self.name} at {self.site.name}'

class Guest(models.Model):
    firstname = models.CharField(max_length=255)
    surname = models.CharField(max_length=255)
    email = models.CharField(max_length=255)
    telephone = models.CharField(max_length=255)

    def __str__(self):
        return f'Guest No {self.id} - {self.firstname} {self.surname}'

class Vehicle(models.Model):
    vehiclereg = CharField(max_length=7)

    def __str__(self):
        return f'{self.vehiclereg}'


class Booking(models.Model):
    pitch = models.ForeignKey(Pitch, on_delete=models.PROTECT, related_name="bookingsbypitch")
    guest = models.ForeignKey(Guest, on_delete=models.PROTECT)
    start = models.DateField()
    end = models.DateField()
    adultno = models.PositiveSmallIntegerField()
    childno = models.PositiveSmallIntegerField()
    infantno = models.PositiveSmallIntegerField()
    vehiclereg = models.ManyToManyField(Vehicle)
    bookingrate = models.FloatField()
    totalpayments = models.FloatField()
    balance = models.FloatField()
    checkedin = models.BooleanField(default=False)
    eta = models.TimeField(blank=True, null=True)
    locked = models.BooleanField(default=False)

    def __str__(self):
        return f'Booking {self.id} on {self.pitch} from {self.start} to {self.end}'

class PartyMember(models.Model):
    firstname = models.CharField(max_length=255, blank=True, null=True)
    surname = models.CharField(max_length=255, blank=True, null=True)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE)
    checkedin = models.BooleanField(default=False)
    noshow = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.firstname} {self.surname} on Booking {self.booking.id}'

class Rate(models.Model):
    start = models.DateField()
    end = models.DateField()
    adult = models.FloatField()
    child = models.FloatField()
    infant = models.FloatField()

    def __str__(self):
        return f'Rate {self.id} from {self.start} to {self.end}'

class Payment(models.Model):
    creationdate = models.DateField(auto_now_add=True)
    lasteditdate = models.DateField(auto_now=True)
    value = models.FloatField()
    method = models.CharField(max_length=20, choices={
        ('Card', 'Card'),
        ('Cash', 'Cash'),
        ('BACS', 'BACS')
    })
    booking = models.ForeignKey(Booking, on_delete=models.PROTECT, related_name="paymentsbybooking")
    
    def __str__(self):
        return f'Payment {self.id} against booking {self.booking.id}'

class Comment(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="commentsbybooking")
    important = models.BooleanField()
    comment = models.TextField()

class PaymentChange(models.Model):
    datestamp = models.DateField(auto_now_add=True)
    payment = models.IntegerField()
    comment = models.TextField()
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    def __str__(self):
        return f'Payment {self.payment} was altered by user {self.user.username} on {self.datestamp}'

class Extra(models.Model):
    name = models.CharField(max_length=100)
    rate = models.FloatField()
    rateapplication = models.CharField(max_length=20, choices={
        ('per night', 'per night'), 
        ('per booking', 'per booking')
    })
    mandatorypublic = models.BooleanField()
    mandatoryall = models.BooleanField()
    site = models.ForeignKey(Site, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.name}'