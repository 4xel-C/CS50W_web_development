// -----------------API request functions--------------------------------------------------

async function postNewPost(content) {

    // get the csrf token
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;


}

// fetch datas for posts and return json datas
async function fethPosts(filter=undefined){

    try {
        
        // Get the post depending of the filter
        if (!filter) {
            const response = await fetch('/posts');
        }
        else if (filter === 'tracked'){
            const response = await fetch(`/posts/${filter}`);
        }

        // Fetching error handling
        if (!reponse.ok){
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
    Create a new element containing all the informations for a post.
    */
    var NewPost = document.createElement('div');
    NewPost.className = 'col-lg-7';
    NewPost.innerHTML = `
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
    return NewPost;

    // To Do => Add EventListener on each comments and buttons
}

// -----------------Main fonction--------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

    // Create an Event Listener to the post button to post new posts
    // document.querySelector('#postButton').addEventListener('click', () => {
    //     pass
    // })

    // 
    if (window.location.pathname === '/') {
        loadPostPage();
    } else if (window.location.pathname === '/following') {
        loadPostPage(filter=true);
    }

});


$(document).ready(()=> {

    // Create listener for POST button and reload the post page
    $('#postButton').click(() => {

        // get the value of the body
        const content = $('#formContent').val();
        postNewPost(content)
        .then(() => {

            // reload the page with the new post
            loadPostPage();
        })
        .catch((error) => {
            console.log(error);
        });
    });

    if (window.location.pathname == '/') {
        loadPostPage();
    } else if (window.location.pathname == '/following') {
        loadPostPage(following=true);
    }
});