from django.contrib.auth import authenticate, login, logout
from django.core.paginator import Paginator, EmptyPage
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json

from .models import User, Post


# --------------------------------------------------------VIEWS
def index(request):
    return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":
        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(
                request,
                "network/login.html",
                {"message": "Invalid username and/or password."},
            )
    else:
        return render(request, "network/login.html")


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
            return render(
                request, "network/register.html", {"message": "Passwords must match."}
            )

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(
                request, "network/register.html", {"message": "Username already taken."}
            )
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


# --------------------------------------------------------API VIEWS
def posts(request, filt=None):
    """
    Request the API to POST a new post and return the id of the newly created post:
    url: /posts
    method: POST
    parameter: content

    Request the API for all the posts available in the database. return posts paginated 10 by 10.
    url: /posts
    method: GET
    parameter: page (page number)
    """

    # POST request to create a new post
    if request.method == "POST":
        # check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({"error": "User not authenticated"}, status=401)

        # get the content of the post
        content = json.loads(request.body).get("content", None)
        if not content:
            return JsonResponse({"error": "Post content is required"}, status=400)

        # create the post
        post = Post(user=request.user, content=content)
        post.save()
        response_data = {"message": "Post created successfully"}
        return JsonResponse(response_data, status=201)

    # GET request to get all posts or favorites posts
    elif request.method == "GET":
        
        # recuperate user if authenticated
        user = request.user if request.user.is_authenticated else None

        # query for the correct posts
        if not filt:
            posts = Post.objects.all().order_by('-created')
        elif filt == "following":
            posts = Post.objects.filter(follows=user).all().order_by('-created')
        else:
            return JsonResponse({"error": "Invalid filter"}, status=400)

        # Get the page number if clicked on the application of give 1 by default
        try:
            page = int(request.GET.get("page", 1))
        except ValueError:
            page = 1

        # create pagination with a page size of 10 posts
        paginator = Paginator(posts, 10)

        # Extract the requested page by GET
        try:
            page_obj = paginator.page(page)
        except EmptyPage:
            return JsonResponse({"error": "Page not found"}, status=404)

        # generate data response
        response_data = {
            "page": page_obj.number,
            "total_pages": paginator.num_pages,
            "total_posts": paginator.count,
            "next_page": page_obj.next_page_number() if page_obj.has_next() else None,
            "previous_page": page_obj.previous_page_number() if page_obj.has_previous() else None,
            "posts": [
                post.serialize(user)
                for post in page_obj
            ],
        }
        return JsonResponse(response_data)
