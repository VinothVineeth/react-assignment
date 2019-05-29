
import * as AWS from 'aws-sdk/global';
import * as S3 from 'aws-sdk/clients/s3';
import { log } from 'util';


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
export const uploadImageToCloud = (file=null) => {

  const bucket = new S3(
    {
      accessKeyId: 'AKIASDAYNLW5SZR6BPXM',
      secretAccessKey: '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',
      region: 'ap-south-1'
    }
  );

  const params = {
    Bucket: 'test-doodle',
    Key: 'test-doodle/test/' + 'file.png',
    Body: file
  };

  bucket.upload(params).on('httpUploadProgress', function(evt) {
    let progress = evt.loaded / evt.total * 100;
    let progressvalue = Math.round(progress);
    console.log('progressvalue', progressvalue)
    
  }).send(function(err, data) {
    console.log('uploaded to s3', data);
    
 
  return true;
  });


  return new Promise((resolve, reject) => {

    bucket.upload(params).on('httpUploadProgress', function(evt) {
      let progress = evt.loaded / evt.total * 100;
      let progressvalue = Math.round(progress);
      console.log('progressvalue', progressvalue)
      
    }).send(function(err, data) {
      console.log('uploaded to s3', data, err);
      resolve(data)
      
   
    return true;
    });
  
  })

}
export const postSubmit = (req) => {

  return new Promise((resolve, reject) => {

    fetch('https://webhook.site/6f8814d1-6aeb-4130-a7bb-153b345b7c58', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin':'*'
      },
      body: JSON.stringify(req)
    }).then(response => {
      return response.json();
    }).then(res => {

      resolve(res)

    }).catch(err => {

      resolve(err) // since there is no legit api - NEED TO RESOLVE

    });

  })

}