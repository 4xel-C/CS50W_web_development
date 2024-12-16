from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.db.models import Count, Q
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from .models import User, Auction, Comment, Watchlist, Bid, Category
from .forms import AuctionForm


def index(request):

    auctions = Auction.objects.filter(active=True)
    return render(request, "auctions/index.html", {
        "auctions": auctions
    })

def closed(request):

    # fetch all closed auctions
    auctions = Auction.objects.filter(active=False)
    return render(request, "auctions/closed.html", {
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
        elif not username or not email or not password:
            return render(request, "auctions/register.html", {
                "message": "Missing informations!"
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

def error(request):
    return render(request, "auctions/error.html")

# if someone try to access /listing/ url without providing IDs
def no_id(request):
    return HttpResponseRedirect(reverse("index"))

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
        watchlist_entry = Watchlist.objects.filter(user=request.user, auction=listing).first()
    except Auction.DoesNotExist:
        return HttpResponseRedirect(reverse("error"))
    
    # if a POST request is detected and the id exists
    if request.method == "POST" and listing:
        text_comment = request.POST["text"]
        
        # creating a new comment in the database only if a text is entered
        if text_comment:
            comment = Comment(
                writer = request.user,
                auction = listing,
                text = text_comment
            )
            comment.save()
            messages.success(request, "Commentary successfully added!")

        # generate an error message if the text input is posted empty
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
        if not auction.active:
            messages.error(request, "The bid is already closed!")
        elif request.user != auction.seller: 
            messages.error(request, "You do not own the auction!")
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
        if not auction.active:
            messages.error(request, "This auction is closed and cannot be added to your watch list!")
        elif not created:
            print(created)
            messages.error(request, "This auction is already in your watch list!")
        elif created:
            messages.success(request, "This auction was added to your watchlist")
            
    return HttpResponseRedirect(reverse("listing", args=[id]))

@login_required
def remove_watchlist(request, id):
    try:
        auction = Auction.objects.get(id=id)
    except Auction.DoesNotExist:
        messages.error(request, "The auction you tried to remove from your watchlist does not exist!")
        return HttpResponseRedirect(reverse("index"))
    
    if request.method == "POST":
        
        # check if the watchlist already created, create it if not
        entry = Watchlist.objects.filter(user=request.user, auction=auction).first()
        if not entry:
            messages.error(request, "This auction is not in your watchlist")
        else:
            entry.delete()
            messages.info(request, "The auction was removed from your watchlist.")

    return HttpResponseRedirect(reverse("listing", args=[id]))

@login_required
def bid(request, id):
    try:
        auction = Auction.objects.get(id=id)
    except Auction.DoesNotExist:
        messages.error(request, "The auction you tried to bid on does not exist!")
        return HttpResponseRedirect(reverse("index"))
    
    if request.method == "POST":

        # ensure 2 decimal numbers
        amount = round(float(request.POST.get("bid_amount")), 2)
        print(amount)
        
        if amount < auction.price:
            messages.error(request, "The amount you want to bid should be higher than the initial price!")
            return HttpResponseRedirect(reverse("listing", args=[id]))
        
        elif auction.proposed_price:
            if amount < auction.proposed_price:
                messages.error(request, "The amount you want to bid should be higher than the current bid!")
                return HttpResponseRedirect(reverse("listing", args=[id]))
        
        
        # update the value of the auction and update the potential winner of the auction
        auction.proposed_price = amount
        auction.winner = request.user
        auction.save()
        
        # create the bid history to keep track of who bid on which auction
        Bid.objects.create(
        bidder=request.user,
        auction=auction,
        offer=amount
        )
        messages.success(request, "Your bid was placed on the auction")
        return HttpResponseRedirect(reverse("listing", args=[id]))
    
    # return to index if no post request
    return HttpResponseRedirect(reverse("index"))

# display the categories
def categories(request):

    # annotate the categories to get the count of active auctions
    categories = Category.objects.annotate(
        auction_count=Count('sorted_auctions', filter=Q(sorted_auctions__active=True))
        )
    
    return render(request, 'auctions/categories.html', {
        "categories": categories,
    })

# display the auctions by categories
def auctions_by_category(request, category):
    auctions = Auction.objects.filter(category__name__iexact=category, active=True)

    if not auctions:
        messages.info(request, "No auctions found in the selected category")
        return HttpResponseRedirect(reverse('categories'))

    return render(request, "auctions/auctions_cat.html", {
        "category": category,
        "auctions": auctions
    })

# search bar result
def search(request):
    query = request.GET.get('q')

    if query:
        auctions = Auction.objects.filter(item__icontains=query, active=True)

        if not auctions:
            messages.info(request, f"No auctions containing the keyword '{query}' was found")

        return render(request, 'auctions/search.html', {
            "auctions": auctions, 
            "query": query
        })
    
    return HttpResponseRedirect(reverse('index'))

# watchlist
@login_required
def watchlist(request):

    # get the auctions of the corresponding watchlist.
    items = Watchlist.objects.filter(user=request.user)
    auctions = [item.auction for item in items]
    return render(request, "auctions/watchlist.html", {
        "auctions": auctions
    })

@login_required
def myauctions(request):
    auctions = Auction.objects.filter(seller=request.user)
    return render(request, "auctions/myauctions.html", {
        "auctions": auctions
    })
