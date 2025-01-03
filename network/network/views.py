from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json

from .models import User, Post


# --------------------------------------------------------VIEWS--------------------------------------------------------------------
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

@login_required
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

def detail(request, id):
    # render the detail page of a post passing the post as context for displaying details.
    post = Post.objects.get(id=id)
    
    return render(request, "network/detail.html", {
        'post': post
    })


# --------------------------------------------------------API routes----------------------------------------------------------------
def posts(request, filter=None):
    """
    Request the API to POST a new post and return the id of the newly created post:
    url: /posts
    method: POST
    parameter: content

    Request the API for all the posts available in the database and return a paginated response depending on which page is clicked
    Accept a 'filter' url which can be 'tracked' to only fetch for the followed posts.
    url: /posts/<filter>
    method: GET
    parameter: page (page number)
    """

    # recuperate user if authenticated
    user = request.user

    # POST request to create a new post
    if request.method == "POST":
        # check if user is authenticated
        if not user.is_authenticated:
            return JsonResponse({"error": "User not authenticated"}, status=401)

        # get the content of the post
        content = json.loads(request.body.decode('utf-8'))
        if not content:
            return JsonResponse({"error": "Post content is required"}, status=400)

        # create the post
        post = Post(user=user, content=content)
        post.save()
        response_data = {"message": "Post created successfully",
                         "post": post.serialize(user)}
        return JsonResponse(response_data, status=201)

    # GET request to get all posts or favorites posts
    elif request.method == "GET":

        # query for the correct posts
        if not filter:
            posts = Post.objects.all().order_by('-created')
        elif not user:
            return JsonResponse({'error': 'Authentication required.'}, status=401)
        elif filter == 'tracked' and user:
            posts = Post.objects.filter(follows=user).order_by('-created')
        else:
            return JsonResponse({'error': 'Page not found'}, status=404)        


        # Get the page number if clicked on the application of give 1 by default
        try:
            page = int(request.GET.get("page", 1))
        except ValueError:
            page = 1

        # create pagination with a page size of 10 posts
        paginator = Paginator(posts, 10)

        # Extract the requested page by GET
        page_obj = paginator.page(page)
            
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

def post_id(request, id):
    """
    Request the data base to get one specific post form his id.
    """
    try:
        post = Post.objects.get(id=id)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Object does not exist.'}, status=404)
    
    return JsonResponse({'post': post.serialize(request.user)}, status=200)
        

@login_required
def like(request, id):
    """
    Like a post based on it's id. If user already like the post, unlike it.
    """
    user = request.user
    
    if request.method == 'POST':
        try:
            post = Post.objects.get(id=id)
            
            # Check if user already liked the post and unlike the post if so
            if user in post.likes.all():
                post.likes.remove(user)
                return JsonResponse({'message': 'Post unliked successfully', 'likesCount': post.likes.count(), 'action': 'unlike'})
            
            # else add the user to the likes of the post
            else:
                post.likes.add(user)
                return JsonResponse({'message': 'Post liked successfully', 'likesCount': post.likes.count(), 'action': 'like'})

        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)
        
@login_required
def follow_post(request, id):
    """
    Follow a post based on his id. If user already follow the post, unfollowit.
    """
    user = request.user
    
    if request.method == 'POST':
        try:
            post = Post.objects.get(id=id)
            
            # Check if user already follow the post, and if so, unfollow
            if user in post.follows.all():
                post.follows.remove(user)
                return JsonResponse({'message': 'Post unfollowed successfully', 'action': 'unfollow'})
            
            # else make the user follow the post
            else:
                post.follows.add(user)
                return JsonResponse({'message': 'Post followed successfullly', 'action': 'follow'})

        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)
