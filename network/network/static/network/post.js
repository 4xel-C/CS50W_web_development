// -----------------API request functions--------------------------------------------------

async function postNewPost(content) {
    /*
    Post a new post o the API to save it to the data base and return the ID of the new created post. 
    */

    let response;
    try {
        response = await fetch('/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(content)
        })

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error : ${response.status}, Message : ${errorData.error.message || 'Unknown Error'}`)
        }
        const data = await response.json()
        return data;

    } catch {
        console.error('Problem occured while fetching datas: ', error);
        throw error;
    }


}

async function fetchPosts(filter=undefined){
    /**
     Fetch data for posts from API and return them as a Json;
     */

    let response;
    try {
        // Get the post depending of the filter
        if (!filter) {
            response = await fetch('/posts');
        }
        else if (filter === 'tracked'){
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

function createPostElement(post){
    /*
    Create a new element containing all the informations from a post.
    */

    var newPost = document.createElement('div');
    newPost.className = 'col-lg-7';
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

    // Create an Event Listener to the post button to post new posts
    // document.querySelector('#postButton').addEventListener('click', () => {
    //     pass
    // })

    // Fetch post data and create each post elements
    let data
    const postContainer = document.querySelector('#postContainer')

    if (window.location.pathname === '/') {
        data = await fetchPosts();
    } else if (window.location.pathname === '/following') {
        data = await fetchPosts('tracked');
    }

    data.posts.forEach((post) => {
        postContainer.appendChild(createPostElement(post));
    })

});