# Generated by Django 5.1.3 on 2024-12-11 17:03

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('auctions', '0007_alter_auction_active'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Watch_auction',
            new_name='Watchlist',
        ),
    ]
