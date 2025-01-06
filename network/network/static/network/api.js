// ---------------------------------API request functions--------------------------------------------------

// Create a bootstrap alert and append it to the alert container
export function showAlert(message, type="success") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible text-center position-fixed top-0 start-50 translate-middle-x w-100`;
    alert.role = "alert";
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Display the alert in front of all the other elements
    alert.style.zIndex = '9999';

    // Delete the previous alert and Add the alert to the container
    const alertContainer = document.getElementById("alertContainer");
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);

    // Remove the alert after 5 seconds
    setTimeout(() => {
        alert.classList.remove("show");
        alert.classList.add("fade");
        setTimeout(() => alert.remove(), 500);
    }, 3000);
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

// Post a new post to the API to save it to the data base and return the newly created post.
export async function postNewPost(content) {
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

// Send a POST request to the API to edit an existing post
export async function editPost(content, postId) {
    let response;
    try {
        // get the CSRF token
        const csrfToken = getCookie('csrftoken');

        response = await fetch(`/posts/${postId}`, {
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
export async function fetchPosts(page=1){

    // declare possible URLs to add urls if needed
    const url = window.location.pathname;
    let filter = null;
    let account_id = null;
    
    // Check URL to get the correct fetch
    if (url === '/following') {
        filter = 'tracked';
    } else if (url.includes('profile')) {
        account_id = url.split('/').pop();
    }

    let response;
    try {

        // Get the post depending of the filter: if no filter specified, fetch all posts
        if (!filter && !account_id) {
            response = await fetch(`/posts?page=${page}`);
        }

        // if filter specified fetch the corresponding post(s)
        else if (filter === 'tracked'){
            response = await fetch(`/posts/filter/${filter}?page=${page}`);
        
        // if and account_id is detecte din the url, fetch the corresponding posts
        } else if (account_id) { 
            response = await fetch(`/posts/user/${account_id}?page=${page}`);
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
export async function like(id) {
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

// Follow a user by sending a post request to the API
export async function follow(id) {
    let response;
    try {
        // get the CSRF token
        const csrfToken = getCookie('csrftoken');

        // POST the like
        response = await fetch(`/user/${id}/follow`, {

            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            }
        })

        // Fetching error handling
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error: ${response.status}, ${errorData.error}`)
        }

        // Return the data response
        const data = await response.json()
        return data;

    } catch (error) {
        throw error;
    }
}

// function to test authentification of the user
export async function isAuthenticated(){
    const response = await fetch('/auth')
    const data = await response.json()
        if(data.is_authenticated){
            return true
        } else {
            return false
        }
}

// Function to get the comments of a specific post (paginated comments)
export async function fetchComments(postId, page=1) {
    let response;

    // Fetch the data depending if the start and end are specified
    try {
        response = await fetch(`/posts/${postId}/comments?page=${page}`);

        // error handling
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error : ${response.status}, Message : ${errorData.error || 'Unknown Error'}`)
        }

        const data = await response.json()
        return data;

    } catch (error) {
        throw error;
    }
}

// Function to post a new comment to the API
export async function postNewComment(postId, content) {
    let response;
    try {
        // get the CSRF token
        const csrfToken = getCookie('csrftoken');

        response = await fetch(`/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(content)
        })

        // error handling
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP error : ${response.status}, Message : ${errorData.error || 'Unknown Error'}`)
        }

        const data = await response.json()
        console.log(data.message)
        return data;

    } catch (error) {
        throw error;
    }
}

