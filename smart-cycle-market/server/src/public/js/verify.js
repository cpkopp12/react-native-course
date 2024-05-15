// update message el
const messageTag = document.getElementById('message');

// eventlistner for window -> event 'DOMContentLoaded'
window.addEventListener('DOMContentLoaded', async () => {
  // use PROXY to retrieve URLSearchParams
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });

  const token = params.token;
  const id = params.id;

  // fetch verify
  const response = await fetch('/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token, id }),
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
  });
  // validate response, show error message
  if (!response.ok) {
    const { message } = await response.json();
    messageTag.innerText = message;
    messageTag.classList.add('error');
    return;
  }

  // if response is ok
  const { message } = await response.json();
  messageTag.innerText = message;
});
