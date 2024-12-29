from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    content = models.TextField(max_length=500)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name="liked_post", blank=True)
    follows = models.ManyToManyField(User, related_name="followed_post", blank=True)

    def __str__(self):
        return f"Post by {self.user.username}"  

    # count the number of like of a post
    def like_count(self):
        return self.likes.count()

    # return True if the user has liked the post
    def is_liked(self, user):
        if user is None:
            return False
        else:
            return self.likes.filter(id=user.id).exists()

    # count the number of comments of a post
    def comments_count(self):
        return self.comments.count()

    # return True if the user has followed the post
    def is_followed(self, user):
        if user is None:
            return False
        else:
            return self.follows.filter(id=user.id).exists()
    
    # serialize the post
    def serialize(self, user):
        """Serialize a Post as a Json Format.

        Args:
            user (str): User connected to the session to keep track of followed/liked posts

        Returns:
            Dict: Json format of the datas of 1 post.
        """
        return {
            "id": self.id,
            "user": self.user.username,
            "content": self.content,
            "created": self.created.strftime("%b %d %Y, %I:%M %p"),
            "updated": self.updated.strftime("%b %d %Y, %I:%M %p"),
            "likes": self.like_count(),
            "comments": self.comments_count(),
            "followed": self.is_followed(user) if user else False,
            "liked": self.is_liked(user) if user else False,
        }
    


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField(max_length=500)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on post {self.post.id}"
