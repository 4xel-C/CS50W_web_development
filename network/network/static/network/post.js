import { fetchPosts, follow, isAuthenticated, like, postNewPost, showAlert } from './api.js';

// ----------------------------------------Builder functions--------------------------------------------------

// Create a new element and his listener containing all the informations from a post.
function createPostElement(post){
    // Create the new element
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
                    <button class="btn p-1 btn-outline-primary follow-button ${post.followed? 'active' : ''}">${post.followed? 'Unfollow' : 'Follow'}</button>
                </div>
            </div>
            <div class="card-footer text-body-secondary">
                <div class="d-flex justify-content-between">
                    <button class="btn p-0 like-button ${post.liked? 'text-danger' : ''}"><i class="fa fa-heart postHeart"></i> <span class="postLikes">${post.likes}<span></button>
                    <a href="/detail/${post.id}"><button class="btn p-0 postComments">${post.comments} Comments</button></a>
                    <div>${post.created}</div>
                </div>
            </div>
        </div>
        `;
    
    // Event listeners
    const likeButton =  newPost.querySelector('.like-button');
    const followButton = newPost.querySelector('.follow-button');

    // deactivate the follow button if the user is the author of the post
    if (post.is_author){
        followButton.disabled = true;
    }


    // Add the event listener to the like button
    likeButton.addEventListener('click', async () => {
        if (await isAuthenticated()){
            try {
                const data = await like(post.id);

                // if the post is liked, update the class and the count accordingly:
                likeButton.querySelector('.postLikes').textContent = data.likesCount;
                if (data.action === 'like'){
                    likeButton.classList.add('text-danger');
                } else if (data.action === 'unlike'){
                    likeButton.classList.remove('text-danger');
                }
            } catch (error) {
                console.error('Error while liking the post: ', error.message);
                showAlert('Error while liking the post', 'danger');
            }
        } else {
            showAlert('You must be authenticated to like a post', 'danger');
        }
    });
        

    // add the event listener to the follow button
    followButton.addEventListener('click', async () => {
        if (await isAuthenticated()){
            try {
                const data = await follow(post.userId);
                
                // if the post is unfollowed in the following menu, reload the first page
                if (data.action === 'unfollow') {
                    showAlert(`You are not following ${post.user} anymore!`, 'warning');
                } else {
                    showAlert(`You are following ${post.user}!`, 'success');

                }
                update_page(1);
                
            } catch (error) {
                console.error('Error while following the post: ', error.message);
                showAlert(`${error.message}`, 'danger');
            }
        } else {
            showAlert('You must be authenticated to follow a post', 'danger');
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
            pagebutton?.classList.add('active')
        } else {
            pagebutton?.classList.remove('active')
        }
    }

    // Remove the pagination buttons exceeding the total pages
    let excess_counter = 1;
    let excess_page = document.querySelector(`#page-${total_pages + excess_counter}`);
    while (excess_page !== null) {
        excess_page.remove();
        excess_counter++;
        excess_page = document.querySelector(`#page-${total_pages + excess_counter}`);
}
}

// update the page by displaying the new posts and pagination
async function update_page(page){

    const data = await fetchPosts(page);
    console.log(data);
    // Check if there are no posts to display
    if (data.posts.length === 0){
        postContainer.innerHTML = `<div class="alert alert-info text-center" role="alert">No posts to display</div>`;
        updatePaginationButtons(data.page, data.total_pages);
        return;
    }

    // Remove all posts from the page
    postContainer.innerHTML='';

    // load the new posts
    data.posts.forEach((post) => {
        postContainer.appendChild(createPostElement(post));
    });

    // create pagination buttons
    for (let i = 1; i <= data.total_pages; i++){
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
    const nextButton = document.querySelector('#next-page');
    const previousButton = document.querySelector('#previous-page');

    // POST new post => create an Event Listener to the post button to post new posts on main menu if the button exists
    if (window.location.pathname === '/' && postButton) {
        postButton.addEventListener('click', async () => {

            // Get the post content
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