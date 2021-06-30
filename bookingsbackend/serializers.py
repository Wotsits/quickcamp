from rest_framework import serializers

from .models import *

class PitchTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PitchType
        fields = ['id', 'name', 'description', 'ehu', 'mindimensions']

class PitchSerializer(serializers.ModelSerializer):
    type = PitchTypeSerializer(many=False, read_only=True)
    class Meta:
        model = Pitch
        fields = ['id', 'name', 'type']

class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ['id', 'firstname', 'surname', 'email', 'telephone']

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'creationdate', 'lasteditdate', 'value', 'method', 'booking']

class PartyMemberSerializer(serializers.ModelSerializer):
    class Meta: 
        model = PartyMember
        fields = ['id', 'firstname', 'surname', 'start', 'end', 'type', 'checkedin', 'noshow']

class PartyVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartyVehicle
        fields = ['id', 'vehiclereg', 'checkedin', 'start', 'end']

class PartyPetSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartyPet
        fields = ['id', 'name', 'checkedin', 'start', 'end']

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['booking', 'important', 'comment']

class BookingSerializer(serializers.ModelSerializer):
    guest = GuestSerializer(many=False, read_only=True)
    paymentsbybooking = PaymentSerializer(many=True, read_only=True)
    commentsbybooking = CommentSerializer(many=True, read_only=True)
    bookingparty = PartyMemberSerializer(many=True, read_only=True)
    bookingvehicles = PartyVehicleSerializer(many=True, read_only=True)
    bookingpets = PartyPetSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'pitch', 'guest', 'start', 'end', 'adultno', 'childno', 'infantno', 'petno', 'vehicleno', 'bookingrate', 'totalpayments', 'balance', 'paymentsbybooking', 'commentsbybooking', 'checkedin', 'locked', 'bookingparty', 'bookingvehicles', 'bookingpets'] 

class RateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rate
        fields = ['id', 'start', 'end', 'adult', 'child', 'infant']

class ExtraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Extra
        fields = ['name', 'rate', 'rateapplication', 'mandatorypublic', 'mandatoryall']