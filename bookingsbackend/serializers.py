from rest_framework import serializers

from .models import *


class PitchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pitch
        fields = ['id', 'name']

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ['id', 'firstname', 'surname', 'email', 'telephone']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'creationdate', 'lasteditdate', 'value', 'method', 'booking']

class CommentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['important', 'comment']

class PartyMemberSerializer(serializers.ModelSerializer):
    class Meta: 
        model = PartyMember
        fields = ['id', 'firstname', 'surname', 'checkedin', 'noshow']

class PartyVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartyVehicle
        fields = ['id', 'vehiclereg', 'checkedin']

class BookingSerializer(serializers.ModelSerializer):
    guest = GuestSerializer(many=False, read_only=True)
    paymentsbybooking = PaymentSerializer(many=True, read_only=True)
    commentsbybooking = CommentsSerializer(many=True, read_only=True)
    bookingparty = PartyMemberSerializer(many=True, read_only=True)
    bookingvehicles = PartyVehicleSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'pitch', 'guest', 'start', 'end', 'adultno', 'childno', 'infantno', 'bookingrate', 'totalpayments', 'balance', 'paymentsbybooking', 'commentsbybooking', 'checkedin', 'locked', 'bookingparty', 'bookingvehicles'] 

class RateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rate
        fields = ['id', 'start', 'end', 'adult', 'child', 'infant']

class ExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Extra
        fields = ['name', 'rate', 'rateapplication', 'mandatorypublic', 'mandatoryall']