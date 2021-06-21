from .models import Rate
from datetime import timedelta

def recalculaterates(booking):

    allrates = Rate.objects.all()
    ratesdict = {}
    targetdate = booking.start
    while targetdate < booking.end:
        relevantrate = allrates.filter(start__range = ["1901-01-01", targetdate], end__range = [targetdate, "2099-12-31"])
        assert len(relevantrate) == 1, "Conflicting rates or no rates were returned."
        ratesdict[targetdate.strftime('%d/%m/%Y')] = {
            'adult': relevantrate[0].adult,
            'child': relevantrate[0].child,
            'infant': relevantrate[0].infant
        }
        targetdate += timedelta(days=1)
    
    ratessum = 0.00
    targetdate = booking.start
    while targetdate < booking.end:
        adultfeeforday = (ratesdict[targetdate.strftime('%d/%m/%Y')]['adult'] * booking.adultno) 
        childfeeforday = (ratesdict[targetdate.strftime('%d/%m/%Y')]['child'] * booking.childno) 
        infantfeeforday = (ratesdict[targetdate.strftime('%d/%m/%Y')]['infant'] * booking.infantno) 
        ratessum = ratessum + adultfeeforday + childfeeforday + infantfeeforday
        targetdate = targetdate + timedelta(1)
    
    return ratessum