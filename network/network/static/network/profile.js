import { createPageItem, createPostElement, updateFollowButton, updatePaginationButtons, update_page } from './builder.js';
import { editPost, fetchPosts, follow, isAuthenticated, like, postNewPost, showAlert } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    await update_page(1);
    
    // declare the query selectors
    const totalFollowers = document.querySelector('.total-followers');
    const followProfile = document.querySelector('#followProfile');
    const nextButton = document.querySelector('#next-page');
    const previousButton = document.querySelector('#previous-page');

    // Get the id of the visited user and the number of followers
    const userId = document.querySelector('#userId').dataset.id;
    let total_follows = parseInt(totalFollowers.innerHTML);

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
            updateFollowButton(response, followProfile);
            if (response.action == 'follow') {
                totalFollowers.innerHTML = total_follows + 1;
            } else if (response.action == 'unfollow') {
                totalFollowers.innerHTML -= 1;
            }
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    })
});