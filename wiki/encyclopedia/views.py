from django.shortcuts import render
from django.urls import reverse
from django.http import HttpResponseRedirect
import markdown2

from . import util

# create global variable to get all entries
entries = util.list_entries()

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
            "title": title
        })

    # if entry, parse the entry content into html and render the page to the page
    entry = markdown2.markdown(entry)
    return render(request, "encyclopedia/entry.html", {
        "title": title,
        "entry": entry
    }
    )
    
def search(request):
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
        }
        )
            
    # If research form sends empty request, redirect to index to see all entries
    else:
        return HttpResponseRedirect(reverse('index'))