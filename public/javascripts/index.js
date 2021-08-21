const defaultWidth = 640;
const defaultHeight = 480;
let poseNet, brain, pose;

let state = 'waiting';
let targetLabel;

let options = {
  inputs: 34,
  outputs: 4,
  task: 'classification',
  debug: true
}

const modelInfo = {
  model: '../models/model.json',
  metadata: '../models/model_meta.json',
  weights: '../models/model.weights.bin',
};

let videoElement = document.getElementById('video');

brain = ml5.neuralNetwork(options);
brain.load(modelInfo, brainLoaded);

function brainLoaded() {
  console.log('pose classification ready!');
}

function modelLoaded() {
  console.log('poseNet ready');
}

let posesPos = [];

function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    posesPos = poses[0].pose.keypoints;
    if (state == 'collecting') {
      let inputs = [];
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      let target = [targetLabel];
      brain.addData(inputs, target);
    }
  }
}

/*
function gotPoses(poses) {
  if (poses.length > 0) {
    let pose = poses[0].keypoints;
    if (state == 'collecting') {
      let inputs = [];
      for (let i = 0; i < pose.length; i++) {
        let x = pose[i].x;
        let y = poses[i].y;
        inputs.push(x);
        inputs.push(y);
      }
      let target = [targetLabel];
      console.log(inputs);
      brain.addData(inputs, target);
    }
  }
}*/



let inputs = [];

function classifyPose(pose) {
  if (pose) {
    let inputs = [];
    for (let p of pose) {
      let x = p.x;
      let y = p.y;
      inputs.push(x);
      inputs.push(y);
    }
    //brain.classify(inputs, gotResult);
  }
}
function gotResult(error, results) {
  if(error){
      console.error(error);
      return;
    }
  //console.log(results);
  if (results[0].confidence > 0.75) {
    poseLabel = results[0].label.toUpperCase();
    //console.log(poseLabel);
  }
  classifyPose();
}

function startPosing() {

  // Set up detector
  /*const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
  const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);*/



  poseNet = ml5.poseNet(vid, modelLoaded);
  poseNet.on('pose', gotPoses);

  canvas.width = 1000;
  canvas.height = canvas.width*0.75;

  // Count
  function countReps() {
    let lag = 5;
    let threshold = 3.5;
    let influence = 0.5;
    let signals = new Array(neckArray.length).fill(0);
    let filteredY = [...Array(lag + 1).keys()];
    let avgFilter = neckArray.slice(0, );
    let stdFilter = null;

  }

  let r2 = Ola(0);
  let joints = {};

  // Update function
  async function update () {

    //let poses = []//await detector.estimatePoses(videoElement);

    /*if (posesPos.length > 0){
      pose = poses[0].keypoints;
    }*/

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    //if (!poses[0]) return;

    //let points = poses[0].keypoints;


    let points = posesPos;

    let body = {}

    inputs = [];


    classifyPose(points)
    // Convert points to body joints
    for (let pos of points) {
      let p = {
        x: pos.position.x,
        y: pos.position.y
      }

      inputs.push(p.x);
      inputs.push(p.y);

      p.x = (canvas.width-p.x - (canvas.width-defaultWidth)) * (canvas.width/defaultWidth);
      p.y = p.y * (canvas.height/defaultHeight)
      body[pos.part] = p;
    }

    // Joints
    for (let id of Object.keys(body)) {
    	if (joints[id]) {
    		joints[id].x = body[id].x;
    		joints[id].y = body[id].y;
    	} else {
    		joints[id] = Ola({x: body[id].x, y: body[id].y}, 50);
    	}
    }

    if (!Object.keys(body).length) return;

    let nose = {
    	x: body["nose"].x,
    	y: body["nose"].y
    }

    let neck = {
    	x: (body["leftShoulder"].x + body["rightShoulder"].x) / 2,
    	y: (body["leftShoulder"].y + body["rightShoulder"].y) / 2
    }
    neckArray.push(neck.y);
    //console.log(countReps());
    let dick = {
    	x: (body["leftHip"].x + body["rightHip"].x) / 2,
    	y: (body["leftHip"].y + body["rightHip"].y) / 2
    }

    let knee = {
    	x: (body["leftKnee"].x + body["rightKnee"].x) / 2,
    	y: (body["leftKnee"].y + body["rightKnee"].y) / 2
    }

    let foot = {
    	x: (body["leftAnkle"].x + body["rightAnkle"].x) / 2,
    	y: (body["leftAnkle"].y + body["rightAnkle"].y) / 2
    }

    // Plank / Pushup

    let xSpine = [body["leftShoulder"].x, body["leftHip"].x, body["leftKnee"].x, body["leftAnkle"].x];
    let ySpine = [body["leftShoulder"].y, body["leftHip"].y, body["leftKnee"].y, body["leftAnkle"].y];

    r2.set(linearRegression(xSpine, ySpine)["r2"]);

    drawRectangle(0, 0, r2.value*canvas.width, 50, "green");

    drawText("R2 value: " + r2.value.toFixed(2), 20, 80)

    let text, color;
    if (r2.value > 0.7) {
    	text = "Good Posture";
    	color = "green";
    } else if (r2.value > 0.2) {
    	text = "Straighten Your Back";
    	color = "orange";
    } else {
    	text = "WTF ARE YOU DOING";
    	color = "red";
    }

    drawText(text, canvas.width/2, canvas.height/2, "100px Arial", color, "center", "middle")

    drawSkeleton(joints);

    // Draw the joints
    for (let id of Object.keys(joints)) {
    	let p = joints[id];
      drawCircle(p.x, p.y, 5);
      body[p.name] = p
    }

    drawCircle(neck.x, neck.y, 5);
    drawCircle(dick.x, dick.y, 5);
    drawCircle(knee.x, knee.y, 5);
    drawCircle(foot.x, foot.y, 5);

    drawLine(nose.x, nose.y, neck.x, neck.y, "white", 8);
    drawLine(neck.x, neck.y, dick.x, dick.y, "white", 8);
    drawLine(dick.x, dick.y, knee.x, knee.y, "white", 8);
    drawLine(knee.x, knee.y, foot.x, foot.y, "white", 8);

  }

  // Video loop
  var fps = 1000;
  var now;
  var then = Date.now();
  var interval = 1000/fps;
  window.delta = 0;

  let neckArray = [];

  function loop() {
    requestAnimationFrame(loop);

    now = Date.now();
    delta = now - then;

    if (delta > interval) {
        then = now - (delta % interval);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        update();
    }
  }
  loop();
}


function drawSkeleton(joints) {
  // Draw the skeleton
  drawLine(joints["leftEar"].x, joints["leftEar"].y, joints["leftEye"].x, joints["leftEye"].y, "lime", 4)
  drawLine(joints["leftEye"].x, joints["leftEye"].y, joints["nose"].x, joints["nose"].y, "lime", 4)
  drawLine(joints["nose"].x, joints["nose"].y, joints["rightEye"].x, joints["rightEye"].y, "lime", 4)
  drawLine(joints["rightEye"].x, joints["rightEye"].y, joints["rightEar"].x, joints["rightEar"].y, "lime", 4)

  drawLine(joints["leftWrist"].x, joints["leftWrist"].y, joints["leftElbow"].x, joints["leftElbow"].y, "lime", 4)
  drawLine(joints["leftElbow"].x, joints["leftElbow"].y, joints["leftShoulder"].x, joints["leftShoulder"].y, "lime", 4)

  drawLine(joints["rightWrist"].x, joints["rightWrist"].y, joints["rightElbow"].x, joints["rightElbow"].y, "lime", 4)
  drawLine(joints["rightElbow"].x, joints["rightElbow"].y, joints["rightShoulder"].x, joints["rightShoulder"].y, "lime", 4)

  drawLine(joints["leftShoulder"].x, joints["leftShoulder"].y, joints["rightShoulder"].x, joints["rightShoulder"].y, "lime", 4)
  drawLine(joints["leftHip"].x, joints["leftHip"].y, joints["rightHip"].x, joints["rightHip"].y, "lime", 4)

  drawLine(joints["leftShoulder"].x, joints["leftShoulder"].y, joints["leftHip"].x, joints["leftHip"].y, "lime", 4)
  drawLine(joints["rightShoulder"].x, joints["rightShoulder"].y, joints["rightHip"].x, joints["rightHip"].y, "lime", 4)

  drawLine(joints["leftKnee"].x, joints["leftKnee"].y, joints["leftHip"].x, joints["leftHip"].y, "lime", 4)
  drawLine(joints["rightKnee"].x, joints["rightKnee"].y, joints["rightHip"].x, joints["rightHip"].y, "lime", 4)

  drawLine(joints["leftKnee"].x, joints["leftKnee"].y, joints["leftAnkle"].x, joints["leftAnkle"].y, "lime", 4)
  drawLine(joints["rightKnee"].x, joints["rightKnee"].y, joints["rightAnkle"].x, joints["rightAnkle"].y, "lime", 4)
}

setTimeout(function () {
  function update(stream) {
    document.querySelector('video').src = stream.url;
  }

  if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
      startPosing(); // START POSING
    })
    .catch(function (err0r) {
      console.log("Something went wrong!");
    });
  }
}, 1000)
