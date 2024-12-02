from django import forms
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
import markdown2

from . import util


# create new text form for the new page form
class NewPageForm(forms.Form):
    title = forms.CharField(label="title")
    content = forms.CharField(label="content",
                              widget=forms.Textarea(attrs={
                                'placeholder': 'Write your entry here',
                                'class': 'form-control',
                                'rows': 10,
                                'style': 'width: 50%'
                              }))

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def entry(request, title):
    # get the content of the page in an entry variable
    entry = util.get_entry(title)

    # if no entry, render the error page
    if not entry:
        return render(request, "encyclopedia/error.html", {
            "message": f"The page '{title}' you are looking for does not exist"
        })

    # if entry, parse the entry content into html and render the page to the page
    entry = markdown2.markdown(entry)
    return render(request, "encyclopedia/entry.html", {
        "title": title,
        "entry": entry
    })
    
def search(request):
    # create variable to get all page of the wiki
    entries = util.list_entries()

    # Check GET method
    query = request.GET.get('q')
    
    if query:
        
        # clean the query to make it case unsensitive and ignore additional spaces
        query = query.lower().strip()
        
        # if exact search:
        if query in [entry.lower() for entry in entries]:
            return HttpResponseRedirect(reverse('entry', args=[query]))
        
        # If substring of many entries:
        match = []
        for entry in entries:
            if query in entry.lower():
                match.append(entry)
        
        return render(request, "encyclopedia/search.html", {
            "entries": match,
            "query": query
        })
            
    # If research form sends empty request, redirect to index to see all entries
    else:
        return HttpResponseRedirect(reverse('index'))

def new_page(request):
    
    # create variable to get all page of the wiki
    entries = util.list_entries()

    # check if method == POST
    if request.method == "POST":
        
        # save the data in form
        form = NewPageForm(request.POST)

        # check form validation
        if form.is_valid():
            print(entries)

            # recuperate the datas in variables
            title = form.cleaned_data['title']
            content = form.cleaned_data['content']

            # if page already exists, display an error message
            if title.lower() in [entry.lower() for entry in entries]:
                return render(request, "encyclopedia/error.html", {
            "message": f"The page '{title}' already exist!"
            })

            else:
                util.save_entry(title, content)
                return HttpResponseRedirect(reverse('entry', args=[title]))

    return render(request, "encyclopedia/new_page.html", {
        "form": NewPageForm()
    })