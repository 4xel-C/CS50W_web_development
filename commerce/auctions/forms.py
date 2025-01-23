from django import forms
from .models import Auction

class AuctionForm(forms.ModelForm):
    class Meta:
        model = Auction
        fields = ['item', 'description', 'price', 'image', 'category']
        
        widgets = {
            'item': forms.TextInput(attrs={'class': 'form-control mb-2 mt-1'}),
            'description': forms.Textarea(attrs={'class': 'form-control mb-2 mt-1'}),
            'image': forms.URLInput(attrs={'class': 'form-control mb-2 mt-1'}),
            'price': forms.NumberInput(attrs={'class': 'form-control mb-2 mt-1'}),
            'category': forms.Select(attrs={'class': 'form-control mb-2 mt-1'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        # no requiered categories, automaticly set up to "Other" if no specified.
        self.fields['category'].required = False

