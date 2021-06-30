from .models import Rate, Booking, PartyMember, PartyVehicle, PartyPet
from datetime import timedelta, date


def recalculaterates(booking, partymembers, partypets, partyvehicles):

    allrates = Rate.objects.all()
    ratesdict = {}
    targetdate = booking.start
    while targetdate < booking.end:
        relevantrate = allrates.filter(start__range = ["1901-01-01", targetdate], end__range = [targetdate, "2099-12-31"])
        ratesdict[targetdate.strftime('%d/%m/%Y')] = {
            'adult': relevantrate[0].adult,
            'child': relevantrate[0].child,
            'infant': relevantrate[0].infant,
            'pet': relevantrate[0].pet,
            'vehicle': relevantrate[0].vehicle
        }
        targetdate += timedelta(days=1)
    
    ratessum = 0.00
    targetdate = booking.start

    while targetdate < booking.end:
        adultfeeforday = (ratesdict[targetdate.strftime('%d/%m/%Y')]['adult'] * partymembers.filter(type="Adult", start__range=[booking.start, targetdate], end__range=[targetdate, booking.end]).count()) 
        childfeeforday = (ratesdict[targetdate.strftime('%d/%m/%Y')]['child'] * partymembers.filter(type="Child", start__range=[booking.start, targetdate], end__range=[targetdate, booking.end]).count()) 
        infantfeeforday = (ratesdict[targetdate.strftime('%d/%m/%Y')]['infant'] * partymembers.filter(type="Infant", start__range=[booking.start, targetdate], end__range=[targetdate, booking.end]).count())
        petfeeforday = (ratesdict[targetdate.strftime('%d/%m/%Y')]['pet'] * partypets.filter(start__range=[booking.start, targetdate], end__range=[targetdate, booking.end]).count())
        vehiclefeeforday = (ratesdict[targetdate.strftime('%d/%m/%Y')]['vehicle'] * partyvehicles.filter(start__range=[booking.start, targetdate], end__range=[targetdate, booking.end]).count()) 
        ratessum = ratessum + adultfeeforday + childfeeforday + infantfeeforday + petfeeforday + vehiclefeeforday
        targetdate = targetdate + timedelta(1)
    
    return ratessum


def checkamendmentpossible(target, booking):

    correctedbookingstart   = booking.start
    correctedbookingend     = booking.end
    extension = False

    if target.start < correctedbookingstart:
        correctedbookingstart = target.start
        extension = True
    if target.end > correctedbookingend:
        correctedbookingend = target.end
        extension = True

    if extension:
        # if this is an extension, this checks if there is already a booking which fouls this amendment and if not, updates the booking start/end dates.
        bookingsonpitch = Booking.objects.filter(pitch=booking.pitch)
        bookingsstartinginrange = bookingsonpitch.filter(start__range=[correctedbookingstart, correctedbookingend-timedelta(1)])
        bookingsendinginrange = bookingsonpitch.filter(end__range=[correctedbookingstart+timedelta(1), correctedbookingend])
        bookingscrossingrange = bookingsonpitch.filter(start__range=["1901-01-01", correctedbookingstart], end__range=[correctedbookingend, '2099-12-31'])
        bookingsimpactingrange = bookingsstartinginrange | bookingsendinginrange | bookingscrossingrange
        for item in bookingsimpactingrange:
            if not item == booking:
                return False
            else:
                pass
        return True
    else:
        return True

def updatebooking(event, target, booking):
    
    partymembers    = PartyMember.objects.filter(booking=booking)
    partyvehicles   = PartyVehicle.objects.filter(booking=booking)
    partypets       = PartyPet.objects.filter(booking=booking)

    if event == "amend": 
        # if amendment extends booking, set the booking start/end to match the target start/end
        if target.start < booking.start:
            booking.start = target.start 
        if target.end > booking.end:
            booking.end = target.end

        # if the target dates are a reduction, script checks if the overall length of the booking needs to shorten
        if target.start > booking.start or target.end < booking.end:
            earlieststartdate   = target.start
            latestenddate       = target.end

            for person in partymembers:

                if person.start < earlieststartdate:
                    earlieststartdate   = person.start

                if person.end > latestenddate:
                    latestenddate       = person.end

            for vehicle in partyvehicles:

                if vehicle.start < earlieststartdate:
                    earlieststartdate   = vehicle.start

                if vehicle.end > latestenddate:
                    latestenddate       = vehicle.end        
            
            if earlieststartdate > booking.start:
                booking.start   = earlieststartdate

            if latestenddate < booking.end:
                booking.end     = latestenddate

    if event == "delete":

        earlieststartdate = date(2099, 12, 31)
        latestenddate = date(2001, 1, 1)

        for person in partymembers:

            if person.start < earlieststartdate:
                earlieststartdate   = person.start

            if person.end > latestenddate:
                latestenddate       = person.end

        for vehicle in partyvehicles:

            if vehicle.start < earlieststartdate:
                earlieststartdate   = vehicle.start

            if vehicle.end > latestenddate:
                latestenddate       = vehicle.end        
            
        if earlieststartdate > booking.start:
            booking.start   = earlieststartdate

        if latestenddate < booking.end:
            booking.end     = latestenddate


    # reset the adultno, childno, infantno, vehicleno values
    adultno     = partymembers.filter(type="Adult").count()
    childno     = partymembers.filter(type="Child").count()
    infantno    = partymembers.filter(type="Infant").count()
    petno      = partypets.count()
    vehicleno   = partyvehicles.count()

    booking.adultno     = adultno
    booking.childno     = childno
    booking.infantno    = infantno
    booking.petno       = petno
    booking.vehicleno   = vehicleno

    # recalculate the rates based on new booking attributes
    booking.bookingrate = recalculaterates(booking, partymembers, partypets, partyvehicles)
    booking.balance     = booking.bookingrate - booking.totalpayments

    booking.save()
    
    return True