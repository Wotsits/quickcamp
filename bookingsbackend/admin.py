from django.contrib import admin
from django.utils.translation import TranslatorCommentWarning
from .models import User, Booking, Pitch, Guest, Vehicle, Rate, Payment, Comment

# Register your models here.

admin.site.register(User)
admin.site.register(Booking)
admin.site.register(Pitch)
admin.site.register(Guest)
admin.site.register(Vehicle)
admin.site.register(Rate)
admin.site.register(Payment)
admin.site.register(Comment)
