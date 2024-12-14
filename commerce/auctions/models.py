from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    id = models.AutoField(primary_key=True)

class Category(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name}"

class Auction(models.Model):
    id = models.AutoField(primary_key=True, null=False)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sales", null=False)
    item = models.CharField(max_length=64)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    proposed_price = models.DecimalField(max_digits=10, null=True, decimal_places=2)
    description = models.CharField(max_length=255)
    image = models.URLField(max_length=300, null=True, blank=True, default='https://paytmblogcdn.paytm.com/wp-content/uploads/2024/04/Blog_Generic_Difference-Between-Hallmarked-Gold-KDM-and-916-Gold.jpg')
    creation_date = models.DateTimeField(auto_now_add=True)
    category = models.ForeignKey(Category, null=True, on_delete=models.SET_NULL, related_name="sorted_auctions")
    active = models.BooleanField(default=True)
    winner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="won_auctions", null=True)
    

    # when querying the objects, order the items by creation_date (last created comes first)
    class Meta:
        ordering = ['-creation_date']
    
    def save(self, *args, **kwargs):
        
        # Update the category to "Other" if no categories are selected
        default_category, created = Category.objects.get_or_create(name='Not categorized')
        if not self.category:
            self.category = default_category
        super().save(*args, **kwargs)

class Bid(models.Model):
    id = models.AutoField(primary_key=True)
    bidder = models.ForeignKey(User, on_delete=models.CASCADE)
    auction = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name="bids")
    offer = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)

class Comment(models.Model):
    id = models.AutoField(primary_key=True)
    writer = models.ForeignKey(User, on_delete=models.CASCADE)
    auction = models.ForeignKey(Auction, on_delete=models.CASCADE, related_name="comments")
    text = models.TextField()
    creation_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-creation_date']

class Watchlist(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='watchlists')
    auction = models.ForeignKey(Auction, on_delete=models.CASCADE)
    
    # unique constraint
    class Meta:
        unique_together = ('user', 'auction') 

    
    