from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.core.paginator import Paginator, EmptyPage
from django.db import IntegrityError
from django.http import HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json

from .models import User, Post, Comment, Follower


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
    is_followed = Follower.is_followed(request.user, post.user) if request.user.is_authenticated else False
    
    return render(request, "network/detail.html", {
        'post': post,
        'isFollowed': is_followed,
        'is_author': post.is_author(request.user)
    })


# --------------------------------------------------------API routes----------------------------------------------------------------
def is_authenticated(request):
    """
    API call to check if user is authenticated or not
    """
    return JsonResponse({'is_authenticated': request.user.is_authenticated})

def posts(request, filter=None):
    """
    Request the API to POST a new post:
    url: /posts
    method: POST
    parameter: content

    Request the API for all the posts available in the database and return a paginated response depending on which page is clicked
    Accept a 'filter' url which can be 'tracked' to only fetch for the followed posts.
    url: /posts/<filter>
    method: GET
    parameter: page (page number)
    """

    # recuperate user
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
        response_data = {"message": "Post created successfully"}
        return JsonResponse(response_data, status=201)

    # GET request to get all posts or favorites posts
    elif request.method == "GET":

        # query for the correct posts
        if not filter:
            posts = Post.objects.all().order_by('-created')
        elif not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required.'}, status=401)
        elif filter == 'tracked' and user.is_authenticated:

            # Get the posts of the users followed by the current user
            followed_users = user.following.all().values_list('followed', flat=True)
            posts = Post.objects.filter(user__in=followed_users).order_by('-created')
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
            return JsonResponse({'error': 'Page not found'}, status=404)
            
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
    Method: GET: Request the data base to get one specific post form his id.
    Method: POST: Edit the content of an existing post.
    """

    # Check the id sent to the api
    try:
        if not isinstance(id, int):
            raise ValueError
    except ValueError:
        return JsonResponse({'error': 'Invalid post ID format'}, status=400)

    # GET Method to fetch 1 specific post
    if request.method == 'GET':
        try:
            post = Post.objects.get(id=id)
        except ObjectDoesNotExist:
            return JsonResponse({'error': 'Post does not exist.'}, status=404)
        
        return JsonResponse({'post': post.serialize(request.user)}, status=200)
    
    # POST method to edit 1 specific post.
    elif request.method == 'POST':
        content = json.loads(request.body.decode('utf-8'))

        if not content:
            return JsonResponse({"error": "Post content is required"}, status=400)
        
        # get the post
        try:
            post = Post.objects.get(id=id)
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post does not exist.'}, status=404)

        # update the content of the post and save
        post.content = content
        post.save()

        return JsonResponse({'message': 'Post successfully updated'}, status=200)

        


def like(request, id):
    """
    Like a post based on it's id. If user already like the post, unlike it.
    """
    user = request.user

    if not user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)
    
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
        

def follow_user(request, id):
    """
    Follow a user based on his id. If user already follow the user, unfollow him.
    """
    user = request.user
    
    # get the user to follow
    try:
        followed_user = User.objects.get(id=id)
    except User.DoesNotExist:
        return JsonResponse({'error': f'User {id} not found'}, status=404)

    if not user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)
    elif user.id == id:
        return JsonResponse({'error': 'You cannot follow yourself'}, status=400)
    
    if request.method == 'POST':
        is_followed = Follower.is_followed(user, followed_user)
        
        # Check if user already follow, and if so, unfollow
        if is_followed:
            Follower.objects.filter(user=user, followed=followed_user).delete()
            return JsonResponse({'message': f'User {followed_user.id} unfollowed successfully', 'action': 'unfollow'})
        
        # else make the user follow the post
        else:
            Follower.objects.create(user=user, followed=followed_user)
            return JsonResponse({'message': f'Following user {followed_user.id}', 'action': 'follow'})

def comments(request, id):
    """
    Request the API to POST a new comment:
    url: /posts/<id>/comments
    method: POST
    parameter: content

    Request the API for all the comments of a post based on his id.
    url: /posts/<id>/comments
    method: GET
    parameter: id (id of the post)

    """

    # If get request, return all comments of a post
    if request.method == 'GET':

        # define the page size and get the page number
        page_size = 10
        try:
            page = int(request.GET.get('page', None))
        except ValueError:
            return JsonResponse({'error': 'Page not found'}, status=404)

        # get the comments depending if a page is requested or not
        try:
            if page:
                comments = Comment.objects.filter(post=id).all()[(page - 1) * page_size : page * page_size]
            else:
                comments = Comment.objects.filter(post=id).all()
            return JsonResponse({'comments': [comment.serialize() for comment in comments]}, status=200)
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Comments for this Post not found'}, status=404)
    
    # If post request, create a new comment
    elif request.method == 'POST':
        user = request.user
        if not user.is_authenticated:
            return JsonResponse({'error': 'Authentication required.'}, status=401)
        
        # get the content of the comment
        content = json.loads(request.body.decode('utf-8'))
        if not content:
            return JsonResponse({"error": "Comment content is required"}, status=400)

        # create the comment
        try:
            post = Post.objects.get(id=id)
            comment = Comment(user=user, post=post, content=content)
            comment.save()
            response_data = {"message": "Comment created successfully", 
                             "comment": comment.serialize()}
            return JsonResponse(response_data, status=201)
        
        # if post does not exist
        except Post.DoesNotExist:
            return JsonResponse({'error': 'Post does not exist'}, status=404)