from django.shortcuts import render
import markdown2

from . import util


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

    # if entry, redirect to the page
    entry = markdown2.markdown(entry)
    return render(request, "encyclopedia/entry.html", {
        "title": title,
        "entry": entry
    }
    )