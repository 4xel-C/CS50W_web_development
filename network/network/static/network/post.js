// -----------------API request functions--------------------------------------------------

// Post a new post o the API to save it to the data base and return the newly created post.
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
            throw new Error(`HTTP error : ${response.status}, Message : ${errorData.error || 'Unknown Error'}`)
        }

        const data = await response.json()
        return data;

    } catch (error) {
        console.error('Problem occured while fetching datas: ', error);
        throw error;
    }
}

/*
Fetch data for posts from API and return them as a Json; Accept a scpecific post ID or a filter (eg: 'tracked'
to fetch all followed posts)
*/
async function fetchPosts(page=1){

    // declare possible URLs to add urls if needed
    const possibleUrl = ['tracked']
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
            response = await fetch(`/posts/${filter}/?page=${page}`);
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

// Create a new element containing all the informations from a post.
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
                    <button class="btn p-0"><i class="fa fa-heart postHeart"></i> <span class="postLikes">${post.likes}<span></button>
                    <button class="btn p-0 postComments">${post.comments} Comments</button>
                    <div>${post.created}</div>
                </div>
            </div>
        </div>
        `;
     return newPost;
}

// Create a pagination button corresponding to the desired page number and add the corresponding event listener
function createPageItem(pageNumber){
    
    // Select the post container
    const postContainer = document.querySelector('#postContainer')

    // Get the pagination element, the 'next button' and create the new page
    const pagination = document.querySelector('#pagination');
    const nextButton = document.querySelector('#next-page');

    const newPage = document.createElement('li');
    newPage.classList.add('page-item');
    newPage.innerHTML = `<a class="page-link" id="page-${pageNumber}">${pageNumber}</a>`

    // Append the new page number to the pagination before the 'next' button
    pagination.insertBefore(newPage, nextButton)

    // create the event listener
    newPage.addEventListener('click', async () => {
        try {
            data = await fetchPosts(pageNumber);
        } catch(error) {
            console.error('Problem occured while fetching datas: ', error);
            return;
        }

        // Remove all posts from the page
        postContainer.innerHTML='';

        // load the new posts
        data.posts.forEach((post) => {
            postContainer.appendChild(createPostElement(post));
        });

        updatePaginationButtons(data.page, data.total_pages);
    })
    }

// Update pagination boutton Previous and Next (disable or active) and page number
function updatePaginationButtons(page, total_pages){
    const nextButton = document.querySelector('#next-page');
    const previousButton = document.querySelector('#previous-page');

    // refresh previous / next button
    if (page === 1){
        previousButton.classList.add('disabled');
    } else {
        previousButton.classList.remove('disabled'); 
    }

    if (page < total_pages) {
        nextButton.classList.remove('disabled');
    } else {
        nextButton.classList.add('disabled');
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

// -----------------Main logic--------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {

    // declare the querySelectors
    const postButton = document.querySelector('#postButton');
    const postContent = document.querySelector('#postContent');
    const postContainer = document.querySelector('#postContainer');

    // Create an Event Listener to the post button to post new posts
    postButton.addEventListener('click', async () => {
        let newPost;
        let content = postContent.value;

        if (!content){
            console.error('Post content is empty!')
            showAlert('Post content is empty!', 'danger');
            return;
        }

        // Post the new post and recuperate the new created post
        newPost = await postNewPost(content);
        let newPostElement = createPostElement(newPost.post);

        // Clear the post form content
        postContent.value = '';

        // Add the new post to the top of the list
        postContainer.prepend(newPostElement);
        showAlert('Post created successfully!', 'success');

        // Check the number of postCards and delete the lasts if the numbers > 10
        const postCards = postContainer.querySelectorAll('.postCard');
        let numPosts = postCards.length;

        while (numPosts > 10){
            postCards[numPosts - 1].remove();
            numPosts--;
        }
    });

    // Create event listener to previous / Next button
    postButton.addEventListener('click', async () => {
        let newPost;
        let content = postContent.value;

        if (!content){
            console.error('Post content is empty!')
            showAlert('Post content is empty!', 'danger');
            return;
        }

        // Post the new post and recuperate the new created post
        newPost = await postNewPost(content);
        let newPostElement = createPostElement(newPost.post);

        // Clear the post form content
        postContent.value = '';

        // Add the new post to the top of the list
        postContainer.prepend(newPostElement);
        showAlert('Post created successfully!', 'success');

        // Check the number of postCards and delete the lasts if the numbers > 10
        const postCards = postContainer.querySelectorAll('.postCard');
        let numPosts = postCards.length;

        while (numPosts > 10){
            postCards[numPosts - 1].remove();
            numPosts--;
        }
    });

    // Fetch post data
    let data;
    data = await fetchPosts();

    // create post element
    data.posts.forEach((post) => {
        postContainer.appendChild(createPostElement(post));
    });

    // create pagination button
    const pages = data.total_pages;

    for (i = 1; i <= pages; i++){
        createPageItem(i);
    }

    // activate / deactivate previous button
    updatePaginationButtons(data.page, data.total_pages);

});