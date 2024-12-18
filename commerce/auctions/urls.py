from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create", views.create_listing, name="create"),
    path("error", views.error, name="error"),
    path("listing/", views.no_id, name="no-id"),
    path("listing/<int:id>", views.listing, name="listing"),
    path("listing/<int:id>/close", views.close_auction, name="close_auction"),
    path("listing/<int:id>/watch", views.add_watchlist, name="add_watchlist"),
    path("listing/<int:id>/remwatch", views.remove_watchlist, name="remove_watchlist"),
    path("listing/<int:id>/bid", views.bid, name="bid"),
    path("categories", views.categories, name="categories"),
    path("categories/<str:category>/", views.auctions_by_category, name="auctions_categorized"),
    path("closed", views.closed, name="closed"),
    path("search", views.search, name="search"),
    path("watchlist", views.watchlist, name="watchlist"),
    path("myauctions", views.myauctions, name="myauctions")
]
