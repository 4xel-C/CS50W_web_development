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
    
    #  specify if the post was created by a followed user
    def is_followed(self, user):
        if not user.is_authenticated or self.user is None:
            return False
        return Follower.objects.filter(user=user, followed=self.user).exists()
    
    # Return True if the current user is the author of the post
    def is_author(self, user):
        return self.user == user

    # serialize the post
    def serialize(self, user):
        """Serialize a post as a JSON format.

        Args:
            user (User): User connected to the session to keep track of followed/liked posts

        Returns:
            Dict: Json format of the datas of 1 post.
        """
        return {
            "id": self.id,
            "user": self.user.username,
            "userId": self.user.id,
            "content": self.content,
            "created": self.created.strftime("%b %d %Y, %I:%M %p"),
            "updated": self.updated.strftime("%b %d %Y, %I:%M %p"),
            "likes": self.like_count(),
            "comments": self.comments_count(),
            "liked": self.is_liked(user),
            "followed": self.is_followed(user),
            "is_author": self.is_author(user)
        }


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField(max_length=500)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on post {self.post.id}"

    def serialize(self):
        return {
            "user": self.user.username,
            "postId": self.post.id,
            "content": self.content,
            "date": self.created.strftime("%b %d %Y, %I:%M %p"),
        }

class Follower(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="following")
    followed = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followers")

    def __str__(self):
        return f"{self.user.username} -> {self.followed.username}"

    @staticmethod
    def is_followed(user, followed):
        """Check if an user is followed by the current user."""
        if user is None or followed is None:
            return False
        return Follower.objects.filter(user=user, followed=followed).exists()
    
    # Add a unique constraint to avoid duplicate following
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'followed'], name='unique_user_followed')
        ]