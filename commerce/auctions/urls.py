from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create", views.create_listing, name="create"),
    path("listing/<int:id>", views.listing, name="listing"),
    path("listing/", views.no_id, name="no-id"),
    path("error", views.error, name="error"),
    path("listing/<int:id>/close", views.close_auction, name="close_auction"),
    path("listing/<int:id>/watch", views.add_watchlist, name="add_watchlist"),
    path("listing/<int:id>/remwatch", views.remove_watchlist, name="remove_watchlist"),
    path("closed", views.closed, name="closed"),
    path("listing/<int:id>/bid", views.bid, name="bid"),
    path("categories", views.categories, name="categories")
]
