from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create", views.create_listing, name="create"),
<<<<<<< HEAD
    path("listing/<int:id>", views.listing, name="listing"),
    path("listing/", views.no_id, name="no-id"),
    path("error", views.error, name="error")
=======
    path("listing/<int:id>", views.listing, name="listing"), 
    path("listing/<int:id>/close", views.close_auction, name="close_auction"),
    path("listing/<int:id>/watch", views.add_watchlist, name="add_watchlist")
>>>>>>> c3c26a8ef5b68bfe7cd9dca9b8fccaff22321589
]
