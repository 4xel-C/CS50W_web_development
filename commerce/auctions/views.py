from django import forms
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Auction, Comment, Watchlist
from .forms import AuctionForm


def index(request):
    auctions = Auction.objects.all()
    return render(request, "auctions/index.html", {
        "auctions": auctions
    })

def login_view(request):
    # get the value of the next url
    next = request.GET.get('next', '/')
    if request.method == "POST":
        next_url = request.POST["next"]
        
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(next_url) 
        else:
            return render(request, "auctions/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        # pass the next url into the form as an hidden attribute to redirect on the correct page the user wanted
        return render(request, "auctions/login.html", {
            'next': next
        })


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "auctions/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "auctions/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "auctions/register.html")

@login_required
def create_listing(request):
    if request.method == "POST":
        form = AuctionForm(request.POST)

        if form.is_valid() and form.cleaned_data.get('price') > 0:
            auction = form.save(commit=False)
            auction.seller = request.user
            auction.save()
            messages.success(request, "New auction successfully created!")
            return(HttpResponseRedirect(reverse("index")))
        
        else:
            messages.error(request, "Please enter a correct price")
    
    form = AuctionForm()
    return render(request, "auctions/create.html", {
        "form": form
    })

@login_required
def listing(request, id):  
    
    # Fetch the listing of the correct id and all the related comments.
    try:
        listing = Auction.objects.get(id=id)
        comments = listing.comments.all()
        watchlist_entry = Watchlist.objects.filter(user=request.user, id=id)
    except Auction.DoesNotExist:
        listing = None
    
    # if a POST request is detected and the id exists
    if request.method == "POST" and listing:
        text_comment = request.POST["text"]
        
        # creating a new comment in the database
        if text_comment:
            comment = Comment(
                writer = request.user,
                auction = listing,
                text = text_comment
            )
            comment.save()
            messages.success(request, "Commentary successfully added!")
        else:
            messages.error(request, "You cannot submit an empty comment!")
    
    return render(request, "auctions/listing.html", {
        "listing": listing,
        "comments": comments,
        "id": id,
        "watchlist_entry": watchlist_entry 
    })
    
@login_required
def close_auction(request, id):
    try:
        auction = Auction.objects.get(id=id)
    except Auction.DoesNotExist:
        messages.error(request, "The auction you tried to close does not exist")
        return HttpResponseRedirect(reverse("index"))
        
    if request.method == "POST":
        if auction.active == False:
            messages.error(request, "The bid is already closed!.")
        else: 
            auction.active = False
            auction.save()
            messages.success(request, "The bid has been closed.")
    
    return HttpResponseRedirect(reverse("listing", args=[id]))

@login_required
def add_watchlist(request, id):
    try:
        auction = Auction.objects.get(id=id)
    except Auction.DoesNotExist:
        messages.error(request, "The auction you tried to add to your watchlist does not exist!")
        return HttpResponseRedirect(reverse("index"))
    
    if request.method == "POST":
        
        # check if the watchlist already created, create it if not
        watchlist, created = Watchlist.objects.get_or_create(user=request.user, auction=auction)
        
        if created:
            messages.success(request, "This auction was added to your watchlist")
        else: 
            messages.error(request, "This auction is already in your watch list!")
            
    return HttpResponseRedirect(reverse("listing", args=[id]))

        
        
        
    