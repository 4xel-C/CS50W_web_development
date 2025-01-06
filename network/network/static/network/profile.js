import { createPageItem, createPostElement, updatePaginationButtons, update_page } from './builder.js';
import { editPost, fetchPosts, follow, isAuthenticated, like, postNewPost, showAlert } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    await update_page(1);
    
    // declare the query selector follow profile   
    const followProfile = document.querySelector('#followProfile');

    // Get the id of the visited user
    const userId = document.querySelector('#userId').dataset.id;


    // declare the querySelectors
    const nextButton = document.querySelector('#next-page');
    const previousButton = document.querySelector('#previous-page');

    // Next/Previous buttons event listener
    nextButton.addEventListener('click', async () => {
        if (!nextButton.classList.contains('disabled')){
            await update_page(parseInt(nextButton.dataset.page));

        }
    });

    previousButton.addEventListener('click', async () => {
        if (!previousButton.classList.contains('disabled'))
            await update_page(parseInt(previousButton.dataset.page));
    });

    // Follow Button event listener
    followProfile.addEventListener('click', async () => {
        try {
            const response = await follow(userId);

            // update the follow button
            if (response.action == 'follow') {
                showAlert('You are now following this user', 'success');
                followProfile.innerHTML = 'Unfollow';
            } else if (response.action == 'unfollow') {
                followProfile.innerHTML = 'Follow';
                showAlert('You are not following this user anymore', 'warning');
            }
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    })
});