from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.urls import reverse

def logout_view(request):
    logout(request)
    return redirect(reverse("login"))

def login_view(request):
    if request.method == "GET":
        return render(request, "project/login.html", {})
    else:
        username = request.POST['username']
        password = request.POST['password']
        user =authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect(reverse("calendar"))
        else: 
            return redirect(reverse("login"))