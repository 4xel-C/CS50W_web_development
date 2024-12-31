// -----------------API request functions--------------------------------------------------

async function postNewPost(content) {
    /*
    Post a new post o the API to save it to the data base and return the newly created post.
    */
    let response;
    try {
        // get the CSRF token
        const csrfToken = getCookie('csrftoken');

        response = await fetch('/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(content)
        })

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error : ${response.status}, Message : ${errorData.error || 'Unknown Error'}`)
        }

        const data = await response.json()
        return data;

    } catch (error) {
        console.error('Problem occured while fetching datas: ', error);
        throw error;
    }
}

async function fetchPosts(filter=undefined){
    /**
     Fetch data for posts from API and return them as a Json; Accept a scpecific post ID or a filter (eg: 'tracked'
     to fetch all followed posts)
     */

    // declare possible URLs to add urls if needed
    const possibleUrl = ['tracked']

    let response;
    try {

        // Get the post depending of the filter: if no filter specified, fetch all posts
        if (!filter) {
            response = await fetch('/posts');
        }

        // if filter specified of specific ID is passed, fetch the corresponding post(s)
        else if (filter === 'tracked' || Number.isInteger(filter)){
            response = await fetch(`/posts/${filter}`);
        } else {
            throw new Error('Invalid filter url')
        }

        // Fetching error handling
        if (!response.ok){
            const errorData = await response.json();
            throw new Error(`HTTP error : ${response.status}, Message : ${errorData.error.message || 'Unknown Error'}`);
        }

        const data = await response.json();
        return data

    } catch(error) {
        console.error('Problem occured while fetching datas: ', error);
        throw error;
    }
}

// -----------------Helper functions--------------------------------------------------

function getCookie(name) {
    /* 
    Function to get specific cookies (for csrf validation)
    */
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            
            // Check for the right cookie
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function createPostElement(post){
    /*
    Create a new element containing all the informations from a post.
    */

    var newPost = document.createElement('div');
    newPost.className = 'col-lg-7';
    newPost.classList.add('postCard');
    newPost.innerHTML = `
        <div class="card mb-3">
            <div class="card-header">
                ${post.author}
            </div>
            <div class="card-body">
                <p class="card-text">${post.content}</p>
                <div class="container text-end">
                    <button class="btn p-1 btn-outline-primary followButton">${post.followed? 'Unfollow' : 'Follow'}</button>
                </div>
            </div>
            <div class="card-footer text-body-secondary">
                <div class="d-flex justify-content-between">
                    <button class="btn p-0"><i class="fa fa-heart postHeart"></i> <span class="postLikes">${post.likes}<span></button>
                    <button class="btn p-0 postComments">${post.comments} Comments</button>
                    <div>${post.date}</div>
                </div>
            </div>
        </div>
        `;
     return newPost;
}

// -----------------Main fonction--------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {

    // declare the querySelectors
    const postButton = document.querySelector('#postButton');
    const postContent = document.querySelector('#postContent');
    const postContainer = document.querySelector('#postContainer');


    // Create an Event Listener to the post button to post new posts
    postButton.addEventListener('click', async () => {
        let newPost;
        content = postContent.value;

        if (!content){
            console.error('Post content is empty!')
            alert('The body of your post is empty!')
            return;
        }

        // Post the new post and recuperate the id of the new created post
        newPost = await postNewPost(content);
        newPostElement = createPostElement(newPost.post);

        // Add the new post to the top of the list
        postContainer.prepend(newPostElement);

        // Check the number of postCards and delete the lasts if the numbers > 10
        const postCards = postContainer.querySelectorAll('.postCard');
        let numPosts = postCards.length;

        while (numPosts > 10){
            postCards[numPosts - 1].remove();
            numPosts--;
        }
    });

    // Fetch post data and create each post elements
    let data
    
    if (window.location.pathname === '/') {
        data = await fetchPosts();
    } else if (window.location.pathname === '/following') {
        data = await fetchPosts('tracked');
    }

    data.posts.forEach((post) => {
        postContainer.appendChild(createPostElement(post));
    })

});