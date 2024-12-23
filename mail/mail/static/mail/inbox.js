document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

// ----------------------------------------------------Email composition
function compose_email(answerData) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  
  // Clear out composition fields if new mail
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // prefill the form if the function loaded from a 'reply' button
  if (answerData !== undefined) {
    document.querySelector('#compose-recipients').value = answerData.sender;
    document.querySelector('#compose-subject').value = answerData.subject;
    document.querySelector('#compose-body').value = answerData.body;
  }

  // Post the form content if submit button is pressed
  
  document.querySelector('#compose-form').onsubmit = (event) => {

    // prevent the default submission (stay on the Compose page if an error response is returned from the api)
    event.preventDefault();

    // prepare the datas
    const data = {
      recipients: document.getElementById('compose-recipients').value,
      subject: document.getElementById('compose-subject').value,
      body: document.getElementById('compose-body').value
        }
  
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {

      // Print result
      console.log(result);

      if (result.error){
        // display the error if response 400 fro the API
        alert('Error: ' + result.error);
      } else {
        // load inbox if the message if succesfully sent
        load_mailbox('inbox');  
      }
    });
  }
}

// ----------------------------------------------------Details of one email
function load_detail(id, mailbox) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-detail').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  
  // extract datas
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

    // Print email
    console.log(email);

    // Inject the information into the html
    document.querySelector('#detail-sender').innerHTML = `${email.sender}`;
    document.querySelector('#detail-recipients').innerHTML = `${email.recipients}`;
    document.querySelector('#detail-subject').innerHTML = `${email.subject}`;
    document.querySelector('#detail-body').innerHTML = `${email.body}`;
    document.querySelector('#detail-timestamp').innerHTML = `${email.timestamp}`;

    // if mailbox !== sent => make the Archive / unarchive button appear
    const buttonsContainer = document.querySelector('#buttons');

    if (mailbox !== 'sent'){
      buttonsContainer.innerHTML = `<button class="btn btn-primary mt-3" id="detail-replyButton">Reply</button>
                                   <button class="btn btn-primary mt-3 ms-3" id="detail-archButton">${email.archived ? 'Unarchive' : 'Archive'}</button>`
      
      // Add an event listener to the archive button if created to archive/unarchive the mail and reload the inbox menu  
      const archiveButton = buttonsContainer.querySelector('#detail-archButton');
      archiveButton.addEventListener('click', () => {
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
          })
        })
        .then( () => {
          load_mailbox('inbox');
        })
      })
                                   
    } else {
      buttonsContainer.innerHTML = `<button class="btn btn-primary mt-3" id="detail-replyButton">Reply</button>`
    }

    // Prepare the data to answer the mail in another to object to make sur the previous eventListener work with the original datas
    const answerData = {
      timestamp: email.timestamp,
      sender: email.sender,
      subject: email.subject,
      body: email.body
    }

    // Prepare the subject: adds 'Re: ' to the subject of the email to show an answer if not already in the subject
    if (answerData.subject.indexOf('Re: ') !== 0) {
      answerData.subject = 'Re: ' + answerData.subject;
    }

    // Prepare the body: provides some infos concerning the answered mail
    const prepend = `On ${answerData.timestamp} ${answerData.sender} wrote:\n\n`;
    answerData.body = prepend + answerData.body;

    // Add an event listener to the 'Reply' button to load the pre-completed form with the correct informations
    const replyButton = buttonsContainer.querySelector('#detail-replyButton');
    replyButton.addEventListener('click', () => {
      compose_email(answerData);
    });
  });
};

// ----------------------------------------------------Mail box displaying
function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#emails-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name (adding the header table)
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>
                                                      <table class="table table-sm table-hover table-bordered border-dark align-middle">
                                                          <thead>
                                                              <tr>
                                                                  <th scope="col">From</th>
                                                                  <th scope="col">Subject</th>
                                                                  <th scope="col">Timestamp</th>
                                                                  ${mailbox === 'sent'? '' : '<th scope="col">Actions</th>'}
                                                              </tr>
                                                          </thead>
                                                          <tbody id="emails-table">
                                                          </tbody>
                                                      </table>`;

  // fetch the corresponding mails from the API
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(data => {
    console.log(data);
    data.forEach(mail => add_mail(mail, mailbox));
  });
}


// ----------------------------------------------------Function to add an email to the mails table
function add_mail(mail, mailbox){

  // getting the data of the mail
  const sender = mail.sender;
  const subject = mail.subject;
  const timestamp = mail.timestamp;
  const id = mail.id;
  const read = mail.read;
  const archived = mail.archived;

  // creating the row
  const row = document.createElement('tr');

  if (mailbox !== 'sent') {
  row.innerHTML = `<td>${sender}</td>
                  <td>${subject}</td>
                  <td>${timestamp}</td>
                  <td>
                    <div class="d-flex justify-content-evenly">
                      ${archived ? '<button class="btn btn-primary archive">Unarchive</button>' : '<button class="btn btn-primary archive">Archive</button>'}
                    </div>
                  </td>`;
  } else {
    row.innerHTML = `<td>${sender}</td>
                  <td>${subject}</td>
                  <td>${timestamp}</td>`;
  }
  
  // If the email is not read, highlight the row
  if (read) {
  row.classList.add("table-active");
  };

  // event listerner to make GET request when clicking on a mail and access the detail view
  row.addEventListener('click', () => {
    if (!read){
      fetch(`/emails/${mail.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
    load_detail(id, mailbox);
  });

  // Event listener to archive the mail using the 'archive' button
  const archiveButton = row.querySelector('.archive');
  if (archiveButton){
  archiveButton.addEventListener('click', (event) =>  {

    // Stop the click event from propagating to the row and prevent entering mail details
    event.stopPropagation();

    // Post action to archive or unarchive the email depending if the mail is already archived
    fetch(`/emails/${id}`, { 
      method: 'PUT',
      body: JSON.stringify({
          archived: !archived
      })
    })
    .then(response => {
      if (response.ok) {

        // remove the row if sent to archive, or dearchived
        row.remove();
      }
    });
  });
  }

  // append the row to the table
  document.querySelector("#emails-table").append(row);
}