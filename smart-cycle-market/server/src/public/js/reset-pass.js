const form = document.getElementById('form');
const messageTag = document.getElementById('message');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirm-password');
const notification = document.getElementById('notification');
const submitBtn = document.getElementById('submit');

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

form.style.display = 'none';

let token, id;

// eventlistner for window -> event 'DOMContentLoaded'
window.addEventListener('DOMContentLoaded', async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });

  token = params.token;
  id = params.id;

  const response = await fetch('/auth/verify-password-reset-token', {
    method: 'POST',
    body: JSON.stringify({ token, id }),
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
  });
  if (!response.ok) {
    const { message } = await response.json();
    messageTag.innerText = message;
    messageTag.classList.add('error');
    return;
  }

  messageTag.style.display = 'none';
  form.style.display = 'block';
});

const displayNotification = (message, type) => {
  notification.style.display = 'block';
  notification.innerText = message;
  // class defined in ../style/index.css
  notification.classList.add(type);
};

const handleSubmit = async (event) => {
  event.preventDefault();

  if (!passwordRegex.test(password.value)) {
    return displayNotification(
      'Password is too simple, needs atleast one digit and one capital letter.',
      'error'
    );
  }

  if (!password.value.trim()) {
    return displayNotification('Password is missing.', 'error');
  }
  if (password.value !== confirmPassword.value) {
    return displayNotification('Passwords do not match.', 'error');
  }
  // disable btn
  submitBtn.disabled = true;
  submitBtn.innerText = 'Please wait...';
  // fetch
  const res = await fetch('/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
    body: JSON.stringify({ id, token, password: password.value }),
  });

  submitBtn.disabled = false;
  submitBtn.innerText = 'Update Password';

  // check response
  if (!res.ok) {
    const { message } = await res.json();
    return displayNotification(message, 'error');
  }
  messageTag.style.display = 'block';
  messageTag.innerText = 'Password updated succesfully';
  form.style.display = 'none';
};

form.addEventListener('submit', handleSubmit);
