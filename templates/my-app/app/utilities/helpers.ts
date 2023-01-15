export const Fetch = (url: string, requestOptions: object | undefined) => (fetch(url, requestOptions)
  .then(async response => {
    if (response.ok) {
      return response.json();
    }
    if (response.status === 401) {
      console.warn('401');
    }

    return false;
  })
  .catch(() => false)
);
