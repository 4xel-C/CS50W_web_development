// -----------------API request functions--------------------------------------------------

function postNewPost(content) {
    return new Promise((resolve, reject) => {
        
        // get the csrf token
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        $.ajax({
            url: 'posts',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 'content': content }),
            beforeSend: function(xhr) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            },
            success: (result) => {
                console.log(result);
                resolve(result); 
            },
            error: (error) => {
                console.error(error);
                reject(error);
            }
        });
    });
}


// -----------------Helper functions--------------------------------------------------

function loadPostPage(following=false){
    /*
    Load the post page with the all the posts by defaut or only fetching user's following posts.
    */ 

    // Clean the page
    $('#postContainer').empty();

    // Get the correct posts
    $.ajax({
        url: `${following? 'posts/following' : 'posts'}`,
        method: 'GET',
        success: (result) => {
            console.log(result);
            result.posts.forEach(post => {
                const postElement = createPostElement(post);
                $('#postContainer').append(postElement);
            });
        },
        error: (error) => {
            console.log(error);
        }
    });
}

function createPostElement(post){
    /*
    Create a new post element with his listener.
    */
    // Create the NewPost
    var NewPost = $("<div class='col-lg-7'></div>");
    NewPost.html(`
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
    `);

// TODO => PARAMETER LISTENER

    return NewPost;
 }


// -----------------Main fonction--------------------------------------------------
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