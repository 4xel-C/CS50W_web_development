from django import forms
from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse
import markdown2
import random

from . import util


# create new text form for the new page form
class NewPageForm(forms.Form):
    title = forms.CharField(label="Title",
                            widget=forms.TextInput(attrs={
                            'class': 'form-control', 
                            'style': 'width: 100%;',  
                        })
                    )
    content = forms.CharField(label='', widget=forms.Textarea(attrs={
                                'placeholder': 'Write your new entry here',
                                'class': 'form-control mt-4',
                                'rows': 20,
                                'style': 'width: 100%',
                              }))

class EditPageForm(forms.Form):
    content = forms.CharField(label="", widget=forms.Textarea(attrs={
                                'class': 'form-control',
                                'rows': 20,
                                'style': 'width: 100%',
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

def edit(request, title):
    if request.method == "POST":
        form = EditPageForm(request.POST)
        
        if form.is_valid():
            # recuperate the new content from the form
            content = form.cleaned_data["content"]

            # update the entry with the new value
            util.save_entry(title, content)

            # redirect to the modified page
            return HttpResponseRedirect(reverse('entry', args=[title]))

    # recuperate the entry and parse it
    entry = util.get_entry(title)
    # Prepare the form and insert then default value of it's content to the entry content.
    form = EditPageForm(initial={'content': entry})
    
    return render(request, "encyclopedia/edit.html", {
        "title": title,
        "entry": entry, 
        "form": form
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

# generate a random page
def random_page(request):
    entries = util.list_entries()
    choice = random.choice(entries)
    return HttpResponseRedirect(reverse('entry', args=[choice]))