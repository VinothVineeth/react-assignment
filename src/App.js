import React, {
  Component
} from 'react'

import {  getConfiguration, uploadImageToCloud, postSubmit } from "./services/api"


//Import face-api - which is written on top of tensorflow js
const faceapi = require('face-api.js')



var video;
var webcamStream;
var canvas, ctx, imgElement;

const SSD_MOBILENETV1 = 'ssd_mobilenetv1'
const TINY_FACE_DETECTOR = 'tiny_face_detector'
const MTCNN = 'mtcnn'


let selectedFaceDetector = SSD_MOBILENETV1
// ssd_mobilenetv1 options
let minConfidence = 0.5
// tiny_face_detector options
let inputSize = 512
let scoreThreshold = 0.5
//mtcnn options
let minFaceSize = 20


function getCurrentFaceDetectionNet() {
  if (selectedFaceDetector === SSD_MOBILENETV1) {
    console.log('instance----', faceapi.nets.ssdMobilenetv1)
    return faceapi.nets.ssdMobilenetv1
  }
  if (selectedFaceDetector === TINY_FACE_DETECTOR) {
    console.log('instance----', faceapi.nets.tinyFaceDetector)
    return faceapi.nets.tinyFaceDetector
  }
  if (selectedFaceDetector === MTCNN) {
    console.log('instance----', faceapi.nets.mtcnn)
    return faceapi.nets.mtcnn
  }
}


function getFaceDetectorOptions() {

  return selectedFaceDetector === SSD_MOBILENETV1
    ? new faceapi.SsdMobilenetv1Options({ minConfidence })
    : (
      selectedFaceDetector === TINY_FACE_DETECTOR
        ? new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
        : new faceapi.MtcnnOptions({ minFaceSize })
    )
}

export default class App extends Component {

  state = {
    config: {},
    selectedOption: {},
    showCameraPreview: false,
    showCameraRoll: false,
    capturedImage: null
    
  }

  componentDidMount() {

    console.log(faceapi.nets)

    this.initModels() // init shrad model weights

    this.initCanvas() // init canvas variables

    this.initUserMedia() // assign navigator.usermedia

    this.getConfiguration() // api call to get configration
    

  }

  getConfiguration() {

    getConfiguration().then((config)=>{
      
      this.setState({
        config
      })

    })

  }

  async initModels() {
    await getCurrentFaceDetectionNet().load('/weights/')

    await faceapi.nets.faceLandmark68Net.load('/weights/')
    await faceapi.nets.faceLandmark68TinyNet.load('/weights/')
    await faceapi.nets.faceRecognitionNet.load('/weights/')
  }


  handleBtnClick = (config) => {
    console.log(config);
    this.setState({
      selectedOption:config
    },()=>{

      console.log('selectedOption', this.state.selectedOption);
      this.startWebcam()
    })
    
  }

  handleCaptureClick = () => {
    this.snapshot()
  }

  handleCancelUpload = () => {
    this.setState({
      showCameraPreview: false,
      showCameraRoll: false
    })
  }

  uploadImg() {
    console.log('uploading img');

    uploadImageToCloud(this.state.capturedImage).then((data)=>{

      this.setState({
        showCameraPreview: false
      })

      let Obj = {
        public_id: this.state.config.public_id,
        action: "initiate_check",
        s3_url: data.Location
      }

      postSubmit(Obj).then( (res) =>{
        console.log('res', res);
        
      } )
    })

  }

  initCanvas() {
    // Get the canvas and obtain a context for
    // drawing in it
    canvas = document.getElementById("myCanvas");
    ctx = canvas.getContext('2d');
    
    imgElement = document.getElementById("imgElm");
  }

  initUserMedia = () => {
    navigator.getUserMedia = ( navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia);

  }

  startWebcam() {
    if (navigator.getUserMedia) {

      this.setState({
        showCameraPreview: false,
        showCameraRoll: true
      })

      const videoConstraints = {};
      if (this.state.selectedOption.document_type == 'selfie') {
        videoConstraints.facingMode = 'user';
      } else {
        videoConstraints.facingMode = 'environment';
      }
      console.log('videoConstraints', videoConstraints, this.state.selectedOption);
      
      const constraints = {
        video: videoConstraints,
        audio: false
      };
    
    

       navigator.getUserMedia (

          // constraints
          constraints,

          // successCallback
          function(localMediaStream) {
            console.log('local stream', localMediaStream);
            
              video = document.querySelector('video');
             video.srcObject = localMediaStream;//window.URL.createObjectURL(localMediaStream);
             webcamStream = localMediaStream;
          },

          // errorCallback
          function(err) {
             console.log("The following error occured: " + err);
          }
       );
    } else {
       console.log("getUserMedia not supported");
    }  
  }

  stopWebcam() {
      webcamStream.stop();
  }


  snapshot() {

    this.setState({
      showCameraPreview: true,
      showCameraRoll: false,
    })

    let { selectedOption:{ document_type } } = this.state

    // Draws current image from the video element into the canvas
   ctx.drawImage(video, 0,0, canvas.width, canvas.height);

   let captureFrame = document.getElementById('captureFrameDiv');
   let captureFrameWidth = captureFrame.clientWidth
   let captureFrameHeight = captureFrame.clientHeight
   let captureFramePosX = 0
   let captureFramePosY = captureFrame.offsetTop - 100

   console.log('frame data', captureFramePosX, captureFramePosY, captureFrameWidth, captureFrameHeight);
   
  if(document_type !== 'selfie') {
    var imageData = ctx.getImageData(captureFramePosX, captureFramePosY, captureFrameWidth, captureFrameHeight);
    console.log('imageData----', imageData);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0)
  }

  if(document_type == 'selfie') {
    // ctx.globalCompositeOperation='destination-in';
    // ctx.beginPath();
    // ctx.arc(captureFrameWidth/2,captureFrameHeight/2,captureFrameHeight/2,captureFramePosY,Math.PI*2);
    // ctx.closePath();
    // ctx.fill();    
  }


   var image = canvas.toDataURL("image/png")
  // console.log(image);

   canvas.toBlob((blob) => {
    console.log('blob--', blob);
    imgElement.src = image

    this.setState({
      capturedImage: blob
    },()=>{

      console.log('captured image---', this.state.capturedImage);
    })



    if(document_type=='selfie'){

      this.uploadRefImage(blob)
    }
    
   })
   
  }


  async uploadRefImage(blob) {
    const img = await faceapi.bufferToImage(blob)
    console.log('faceapi img', img.src);

    this.updateReferenceImageResults()
    
  }

  
  async updateReferenceImageResults() {

      const inputImgEl = imgElement

      const fullFaceDescriptions = await faceapi
        .detectAllFaces(inputImgEl, getFaceDetectorOptions())
        // .detectAllFaces(inputImgEl, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors()

        console.log('fullFaceDescriptions', fullFaceDescriptions);
        

      if (!fullFaceDescriptions.length) {
        alert('No face found. Please try again')
        this.startWebcam()
        return
      }

      // create FaceMatcher with automatically assigned labels
      // from the detection results for the reference image
      const faceMatcher = new faceapi.FaceMatcher(fullFaceDescriptions)

      faceapi.matchDimensions(ctx, inputImgEl)
      // resize detection and landmarks in case displayed image is smaller than
      // original size
      const resizedResults = faceapi.resizeResults(fullFaceDescriptions, inputImgEl)
      // draw boxes with the corresponding label as text
      const labels = faceMatcher.labeledDescriptors
        .map(ld => ld.label)
      resizedResults.forEach(({ detection, descriptor }) => {
        const label = faceMatcher.findBestMatch(descriptor).toString()
        const options = { label }
        const drawBox = new faceapi.draw.DrawBox(detection.box, options)
        drawBox.draw(ctx)
      })
  }



  render() {

    let { 
          config: { capture_configuration = [] },
          showCameraRoll,
          showCameraPreview,
          selectedOption
        } = this.state

    return (
      <>
        <header>
          Attachment Uploader
        </header>


        <main>


          {capture_configuration.map((config, i) =>
            (
              <div className="d-flex" key={i} >
                <button className="btn btn-primary" onClick={e => this.handleBtnClick(config)} >
                  Upload {config.document_type}
                </button>
              </div>
            )
          )}


          <img id="imgElm" />
      
          <div className={`camera-preview ${  showCameraPreview ? 'd-block' : 'd-none'  } `} >
            <canvas  id="myCanvas" width="400" height="350"></canvas>
            <button className="btn btn-primary" onClick={e => this.startWebcam()}>Re-capture</button>
            <button className="btn btn-primary" onClick={e => this.uploadImg()}>Upload</button>
          </div>
      

          <div className={`camera-roll ${  showCameraRoll ? 'd-block' : 'd-none'  } `}>
            <video onClick={e => this.snapshot(this)} width="400" height="400" id="video" autoPlay></video>
            <div id="captureFrame"><div id="captureFrameDiv" className={`${  selectedOption.overlay_type=='oval' ? 'oval' : 'rectangle'  } `} ></div></div>
            <button className="btn btn-primary" onClick={e => this.handleCancelUpload()}>Cancel</button>
            <button className="btn btn-primary" onClick={e => this.handleCaptureClick()}>Capture</button>
          </div>
      

          </main>

      </>
    )
  }
}