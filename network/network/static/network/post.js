import { createPageItem, createPostElement, updatePaginationButtons, update_page } from './builder.js';
import { editPost, fetchPosts, follow, isAuthenticated, like, postNewPost, showAlert } from './api.js';

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