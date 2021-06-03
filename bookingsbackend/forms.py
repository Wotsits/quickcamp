from django.forms import ModelForm
from .models import Booking

class BookingForm(ModelForm):
    class Meta:
        model = Booking
        fields = ["guest", "start", "end", "adultno", "childno", "infantno"]