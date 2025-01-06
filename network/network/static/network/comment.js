import { fetchComments, follow, postNewComment, showAlert } from './api.js';

// -------------------------------------builder functions
// create a new comment element
function createCommentElement(comment) {

    // Create the comment element
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    commentElement.innerHTML = `
        <div class="card-container mb-2">
            <div class="card">
                <div class="card-header justify-content-between d-flex">
                    ${comment.user} <span>on ${comment.date}</span>
                </div>
                <div class="card-body">
                    <p class="card-text">${comment.content}</p>
                </div>
            </div>
        <div class="card-container">
    `;
    return commentElement;
}

// fetch the comments and append them to the comments container
async function loadComments() {

    // Fetch the comments and increase the pageCounter
    const response = await fetchComments(postId, pageCounter);
    pageCounter++;
    for (let comment of response.comments) {
        let commentElement = createCommentElement(comment);
        commentsContainer.append(commentElement);
    }

} 

// -------------------------------------main function

// pagCounter for paginated comments (loading comments by scrolling defined in backend)
let pageCounter = 1;

// assign the queryselectors and get the id of the post
const postContainer = document.querySelector('#postContainer');
const postAuthor = document.querySelector('#postAuthor');
const submitButton = document.querySelector('#submitComment');
const commentInput = document.querySelector('#commentInput');
const commentForm = document.querySelector('#commentForm');
const commentsContainer = document.querySelector('#commentsContainer');
const followButton = document.querySelector('#followButton');

// extract the id from the datasets
const postId = postContainer.dataset.postid;
const userId = postAuthor.dataset.userid;

document.addEventListener('DOMContentLoaded', async () => {

    // Follow buton
    followButton.addEventListener('click', async () => {
        try {

            const response = await follow(userId);

            // update the follow button
            if (response.action == 'follow') {
                showAlert('You are now following this user', 'success');
                followButton.innerHTML = 'Unfollow';
            } else if (response.action == 'unfollow') {
                followButton.innerHTML = 'Follow';
                showAlert('You are not following this user anymore', 'warning');
            }
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
    });
    
    // Comment form submission
    commentForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const body = commentInput.value;

        // show an aler if the body is empty
        !body? showAlert('Comment cannot be empty', 'danger') : null; 
        
        // post the new comment and fetch the new data
        const response = await postNewComment(postId, body);

        // Create and prepend the new comment to the comments container
        let newComment = createCommentElement(response.comment);
        commentsContainer.prepend(newComment);
        showAlert('Comment added successfully', 'success');
    });
    
    // enable / disable the submit button
    commentInput?.addEventListener('input', () => {
        if (commentInput.value) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    });

    // Load the first 10 comments
    loadComments();

    // Load more comments when the user scrolls to the bottom of the page
    window.addEventListener('scroll', async () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
            loadComments();
        }
    });

});