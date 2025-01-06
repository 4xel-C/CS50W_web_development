from django.urls import path

from . import views

urlpatterns = [
    # diplay routes
    path("", views.index, name="index"),
    path("following", views.index, name="following"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("detail/<int:id>", views.detail, name="detail"),
    path("profile/<int:id>", views.profile, name="profile"),

    # API routes
    path("auth", views.is_authenticated, name='is_authenticated'),
    path("posts", views.posts, name="all_posts"),
    path("posts/filter/<str:filter>", views.posts, name="filtered_post"),
    path("posts/user/<int:user_id>", views.posts, name="user_post"),
    path("posts/<int:id>", views.post_id, name="post_id"),
    path("posts/<int:id>/like", views.like, name="like"),
    path("posts/<int:id>/comments", views.comments, name="comments"),
    path("user/<int:id>/follow", views.follow_user, name="follow_post"),
]
