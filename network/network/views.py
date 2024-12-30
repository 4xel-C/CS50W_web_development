from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
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


# --------------------------------------------------------API VIEWS
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

    # POST request to create a new post
    if request.method == "POST":
        # check if user is authenticated
        if not request.user.is_authenticated:
            return JsonResponse({"error": "User not authenticated"}, status=401)

        # get the content of the post
        content = json.loads(request.body)
        if not content:
            return JsonResponse({"error": "Post content is required"}, status=400)

        # create the post
        post = Post(user=request.user, content=content)
        post.save()
        response_data = {"message": "Post created successfully",
                         "postId": post.id}
        return JsonResponse(response_data, status=201)

    # GET request to get all posts or favorites posts
    elif request.method == "GET":
        
        # recuperate user if authenticated
        user = request.user if request.user.is_authenticated else None

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

def post_id(request, id):
    """
    Request the data base to get one specific post form his id.
    """
    try:
        post = Post.objects.get(id=id)
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'Object does not exist.'}, status=404)
    
    return JsonResponse({'post': post})
        

@login_required
def like(request, id):
    user = request.user
    
    if request.method == 'POST':
        try:
            post = Post.objects.get(id=id)
            
            # Check if user already liked the post
            if user in post.likes.all():
                return JsonResponse({'error': 'You already like this post'}, status=400)
            
            # add the user to the likes of the post
            post.likes.add(user)
            return JsonResponse({'message': 'Post liked successfully', 'likesCount': post.like_count})

        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post not found'}, status=404)
    

@login_required
def unlike(request, id):
    user = request.user
    
    try:
        post = Post.objects.get(id=id)
        
        # if user does ont like the post
        if user not in post.likes.all():
            return JsonResponse({'error': 'No like for this post'})        
        
        # remove the like 
        post.likes.remove(user)
        return JsonResponse({'message': 'Post unliked successfully'})
        
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post not found'}, status=404)