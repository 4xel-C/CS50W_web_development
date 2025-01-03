// ---------------------------------API request functions--------------------------------------------------

// Post a new post to the API to save it to the data base and return the newly created post.
async function postNewPost(content) {
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
            throw new Error(`HTTP error : ${response.status}, Message : ${errorData.error?.message || 'Unknown Error'}`)
        }

        const data = await response.json()
        return data;

    } catch (error) {
        console.error('Problem occured while fetching datas: ', error.message);
        throw error;
    }
}

/*
Fetch data for posts from API and return them as a Json; Accept a specific post ID and read URL to fetch the correct data
*/
async function fetchPosts(page=1){

    // declare possible URLs to add urls if needed
    let filter = null;

    // Check URL to get the correct fetch
    if (window.location.pathname === '/following') {
        filter = 'tracked';
    }

    let response;
    try {

        // Get the post depending of the filter: if no filter specified, fetch all posts
        if (!filter) {
            response = await fetch(`/posts?page=${page}`);
        }

        // if filter specified of specific ID is passed, fetch the corresponding post(s)
        else if (filter === 'tracked' || Number.isInteger(filter)){
            response = await fetch(`/posts/filter/${filter}?page=${page}`);
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
        console.error('Problem occured while fetching datas: ', error.message);
        throw error;
    }
}

// Post a new like to the API
async function like(id) {
    let response;
    try {
        // get the CSRF token
        const csrfToken = getCookie('csrftoken');

        // POST the like
        response = await fetch(`/posts/${id}/like`, {

            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })

        // Fetching error handling
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error : ${response.status}, Message : ${errorData.error}`)
        }

        // Return the data response
        const data = await response.json()
        return data;

    } catch (error) {
        throw error;
    }
}

// ----------------------------------Helper functions--------------------------------------------------

// Create a bootstrap alert and append it to the alert container
function showAlert(message, type="success") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible`;
    alert.role = "alert";
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add the alert to the container
    const alertContainer = document.getElementById("alertContainer");
    alertContainer.appendChild(alert);

    // Remove the alert after 5 seconds
    setTimeout(() => {
        alert.classList.remove("show");
        alert.classList.add("fade");
        setTimeout(() => alert.remove(), 500);
    }, 5000);
}

// Function to get specific cookies (for csrf validation)
function getCookie(name) {
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

// ----------------------------------------Builder functions--------------------------------------------------

// Create a new element and his listener containing all the informations from a post.
function createPostElement(post){
    var newPost = document.createElement('div');
    newPost.className = 'col-lg-7';
    newPost.classList.add('postCard');
    newPost.innerHTML = `
        <div class="card mb-3">
            <div class="card-header fw-bold">
                ${post.user}
            </div>
            <div class="card-body">
                <p class="card-text">${post.content}</p>
                <div class="container text-end">
                    <button class="btn p-1 btn-outline-primary followButton">${post.followed? 'Unfollow' : 'Follow'}</button>
                </div>
            </div>
            <div class="card-footer text-body-secondary">
                <div class="d-flex justify-content-between">
                    <button class="btn p-0 like-button"><i class="fa fa-heart postHeart"></i> <span class="postLikes">${post.likes}<span></button>
                    <button class="btn p-0 postComments">${post.comments} Comments</button>
                    <div>${post.created}</div>
                </div>
            </div>
        </div>
        `;
    
    // check if the post is already liked
    if (post.liked) {
        newPost.querySelector('.like-button').classList.add('text-danger');
    }

    // Add the event listener to the like button
    newPost.querySelector('.like-button').addEventListener('click', async () => {
        try {
            const data = await like(post.id);

            // if the post is liked, update the class and the count accordingly:
            newPost.querySelector('.postLikes').textContent = data.likesCount;
            if (data.action === 'like'){
                newPost.querySelector('.like-button').classList.add('text-danger');
            } else if (data.action === 'unlike'){
                newPost.querySelector('.like-button').classList.remove('text-danger');
            }
        } catch (error) {
            console.error('Error while liking the post: ', error.message);
            showAlert('Error while liking the post', 'danger');
        }
    });

    return newPost;
}

// Create a pagination button corresponding to the desired page number and add the corresponding event listener if not already created
function createPageItem(pageNumber){

    const pagination = document.querySelector('#pagination');

    // Check if the page number already exists
    if (!pagination.querySelector(`#page-${pageNumber}`)) {
        // Get the pagination element, the 'next button' and create the new page
        
        const nextButton = document.querySelector('#next-page');

        const newPage = document.createElement('li');
        newPage.classList.add('page-item');
        newPage.innerHTML = `<a class="page-link" id="page-${pageNumber}">${pageNumber}</a>`

        // Append the new page number to the pagination before the 'next' button
        pagination.insertBefore(newPage, nextButton)

        // create the event listener
        newPage.addEventListener('click', async () => {
            update_page(pageNumber);
        });
    }
}

// Update pagination boutton Previous and Next (disable or active) with data to set-up the next page and page number
function updatePaginationButtons(page, total_pages){
    const nextButton = document.querySelector('#next-page');
    const previousButton = document.querySelector('#previous-page');

    // refresh previous / next button
    if (page === 1){
        previousButton.classList.add('disabled');
        previousButton.dataset.page = page;
    } else {
        previousButton.classList.remove('disabled');
        previousButton.dataset.page = page - 1;
    }

    if (page === total_pages) {
        nextButton.classList.add('disabled');
        nextButton.dataset.page = page;
    } else {
        nextButton.classList.remove('disabled');
        nextButton.dataset.page = page + 1;
    }

    // Make active the current page
    for (var i = 1; i <= total_pages; i++){
        const pagebutton = document.querySelector(`#page-${i}`);
        if (i === page) {
            pagebutton.classList.add('active')
        } else {
            pagebutton.classList.remove('active')
        }
    }
}

// update the page by displaying the new posts and pagination
async function update_page(page){

        data = await fetchPosts(page);
        console.log(data);

        // Check if there are no posts to display
        if (data.posts.length === 0){
            postContainer.innerHTML = `<div class="alert alert-info text-center" role="alert">No Posts followed</div>`;
            return;
        }

    // Remove all posts from the page
    postContainer.innerHTML='';

    // load the new posts
    data.posts.forEach((post) => {
        postContainer.appendChild(createPostElement(post));
    });

    // create pagination buttons
    for (i = 1; i <= data.total_pages; i++){
        createPageItem(i);
    }

    // update pagination buttons diplays
    updatePaginationButtons(data.page, data.total_pages);
}


// ------------------------------------------------------------------------Main logic--------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {

    // update the page with the first page
    update_page(1);

    // declare the querySelectors
    const postButton = document.querySelector('#postButton');
    const postContent = document.querySelector('#postContent');
    const postContainer = document.querySelector('#postContainer');
    const nextButton = document.querySelector('#next-page');
    const previousButton = document.querySelector('#previous-page');

    // POST new post => create an Event Listener to the post button to post new posts on main menu if the button exists
    if (window.location.pathname === '/' && postButton) {
        postButton.addEventListener('click', async () => {
            let newPost;
            let content = postContent.value;

            if (!content){
                console.error('Post content is empty!')
                showAlert('Post content is empty!', 'danger');
                return;
            }

            // Post the new post to the API
            await postNewPost(content);

            // Clear the post form content
            postContent.value = '';

            // Display a success message and reload first page
            showAlert('Post created successfully!', 'success');
            update_page(1);
        });
    }

    // Next/Previous buttons event listener
    nextButton.addEventListener('click', async () => {
        if (!nextButton.classList.contains('disabled')){
            update_page(parseInt(nextButton.dataset.page));
        }
    })

    previousButton.addEventListener('click', async () => {
        if (!previousButton.classList.contains('disabled'))
            update_page(parseInt(previousButton.dataset.page));
    });


});