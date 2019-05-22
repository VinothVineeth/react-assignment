export const getConfiguration = () => {

  return new Promise((resolve, reject) => {

    fetch('/services/get_configuration.json').then(response => {
      return response.json();
    }).then(config => {

      resolve(config)

    }).catch(err => {

      reject(err)

    });

  })

}
export const uploadImageToCloud = () => {

  return new Promise((resolve, reject) => {

    fetch('/services/get_configuration.json', {
      method: 'PUT',
    }).then(response => {
      return response.json();
    }).then(config => {

      resolve(config)

    }).catch(err => {

      resolve(err) // since there is no legit api - NEED TO RESOLVE

    });

  })

}
export const postSubmit = () => {

  return new Promise((resolve, reject) => {

    fetch('/services/get_configuration.json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    }).then(response => {
      return response.json();
    }).then(config => {

      resolve(config)

    }).catch(err => {

      resolve(err) // since there is no legit api - NEED TO RESOLVE

    });

  })

}