from django.contrib import admin
from django.utils.translation import TranslatorCommentWarning
from .models import *

# Register your models here.

admin.site.register(User)
admin.site.register(Booking)
admin.site.register(Pitch)
admin.site.register(Guest)
admin.site.register(PartyVehicle)
admin.site.register(Rate)
admin.site.register(Payment)
admin.site.register(Comment)
admin.site.register(Site)
admin.site.register(PaymentChange)
admin.site.register(Extra)
admin.site.register(PartyMember)
admin.site.register(PitchType)

