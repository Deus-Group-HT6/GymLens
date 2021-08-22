const defaultWidth = 640;
const defaultHeight = 480;

let nn = new NeuralNetwork(34, 64, 2);

let jsonFile = "";

if (location.pathname.includes("legs")) {
  jsonFile = "squats.json";
} else if (location.pathname.includes("chest")) {
  jsonFile = "benchpress.json";
} else if (location.pathname.includes("arms")) {
  jsonFile = "pushups.json";
} else {
  jsonFile = "jumpingjacks.json";
}

console.log(jsonFile);

// LOAD NEURAL NETWORK

$.getJSON("../models/" + jsonFile, function(json) {
  nn = NeuralNetwork.deserialize(json)
});

let training = false;
let state = 'waiting';

setTimeout(function () {
  function update(stream) {
    document.querySelector('video').src = stream.url;
  }

  if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
      startPosing();
    })
    .catch(function (err0r) {
      console.log("Something went wrong!");
    });
  }
}, 1000)

let currPoseData = [];
let poseData = [];
let firstPose, secondPose;

let counter = 0;
let lastPose = undefined;
let lastRep = Date.now();
let halfRep = false;

function startTraining() {
  console.log("Get ready for posing in 5 seconds")
  setTimeout(function () {
    poseData = [];
    console.log("Start Posing")
    state = 'collecting';

    setTimeout(function() {
      console.log("Done Posing");
      state = 'done';

      firstPose = JSON.parse(JSON.stringify(poseData));

      console.log("Get ready for posing in 5 seconds")

      // TRAIN SECOND POSE
      setTimeout(function () {
          poseData = [];
          console.log("Start Posing")
          state = 'collecting';

          setTimeout(function() {
            console.log("Done Posing");
            state = 'done';

            secondPose = JSON.parse(JSON.stringify(poseData));

            console.log("Start Training")

            console.log(firstPose);
            console.log(secondPose);

            for (let i = 0; i < 500; i++) {
              let randomTarget = Math.floor(Math.random() * 2);

              if (randomTarget) {
                let input = firstPose[Math.floor(Math.random() * firstPose.length)]
                let target = [1, 0];
                nn.train(input, target);
              } else {
                let input = secondPose[Math.floor(Math.random() * secondPose.length)]
                let target = [0, 1];
                nn.train(input, target);
              }

            }

            console.log("Done Training");

            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(nn.serialize());
            var dlAnchorElem = document.getElementById('downloadAnchorElem');
            dlAnchorElem.setAttribute("href",     dataStr     );
            dlAnchorElem.setAttribute("download", "scene.json");
            dlAnchorElem.click();

          }, 10000)

        }, 5000)

    }, 10000)

  }, 5000)
}

async function startPosing() {

  if (training) {
    startTraining();
  }

  const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
  const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

  canvas.width = $("#video").innerWidth();
  canvas.height = $("#video").innerHeight();

 /* function countReps() {
    let lag = 5;
    let threshold = 3.5;
    let influence = 0.5;
    let signals = new Array(neckArray.length).fill(0);
    let filteredY = [...Array(lag + 1).keys()];
    let avgFilter = null;
    let stdFilter = null;
  }*/

  let r2 = Ola(0);
  let joints = {};

  // Update function
  async function update () {

    let videoElement = document.getElementById('video');
    let poses = await detector.estimatePoses(videoElement);

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!poses[0]) return;

    let points = poses[0].keypoints;
    let body = {};

    // Convert points to body joints

    currPoseData = [];
    for (let p of points) {
      currPoseData.push(p.x/defaultWidth);
      currPoseData.push(p.y/defaultHeight);

      p.x = (canvas.width-p.x - (canvas.width-defaultWidth)) * (canvas.width/defaultWidth);
      p.y = p.y * (canvas.height/defaultHeight)
      body[p.name] = p;
    }

    if (state == 'collecting')
      poseData.push(currPoseData);

    // Joints
    for (let id of Object.keys(body)) {
      if (joints[id]) {
        joints[id].x = body[id].x;
        joints[id].y = body[id].y;
      } else {
        joints[id] = Ola({x: body[id].x, y: body[id].y}, 50);
      }
    }

    // Feedforward

    let result = nn.feedForward(currPoseData);
    let poseIndex = result.indexOf(Math.max(...result))

    if (lastPose != poseIndex && Date.now()-lastRep > 400) {
      halfRep = !halfRep;

      if (!halfRep)
        counter++;

      lastRep = Date.now();
    }


    lastPose = poseIndex;

    drawText("Predicted Pose: " + poseIndex, 20, 50, "20px Arial", "red", "left", "top");
    drawText("# of Reps: " + counter, 20, 80, "20px Arial", "red", "left", "top");

  // SKELETON

    let nose = {
      x: body["nose"].x,
      y: body["nose"].y
    }

    let neck = {
      x: (body["left_shoulder"].x + body["right_shoulder"].x) / 2,
      y: (body["left_shoulder"].y + body["right_shoulder"].y) / 2
    }
    neckArray.push(neck.y);

    let dick = {
      x: (body["left_hip"].x + body["right_hip"].x) / 2,
      y: (body["left_hip"].y + body["right_hip"].y) / 2
    }

    let knee = {
      x: (body["left_knee"].x + body["right_knee"].x) / 2,
      y: (body["left_knee"].y + body["right_knee"].y) / 2
    }

    let foot = {
      x: (body["left_ankle"].x + body["right_ankle"].x) / 2,
      y: (body["left_ankle"].y + body["right_ankle"].y) / 2
    }

    // Plank / Pushup

    let xSpine = [body["left_shoulder"].x, body["left_hip"].x, body["left_knee"].x, body["left_ankle"].x];
    let ySpine = [body["left_shoulder"].y, body["left_hip"].y, body["left_knee"].y, body["left_ankle"].y];

    r2.set(linearRegression(xSpine, ySpine)["r2"]);

    //drawRectangle(0, 0, r2.value*canvas.width, 50, "green");

    drawText("R2 value: " + r2.value.toFixed(2), 20, 20, "20px Arial", "red", "left", "top")

    let text, color;
    if (r2.value > 0.7) {
      text = "Good Posture";
      color = "green";
    } else if (r2.value > 0.5) {
      text = "Straighten Your Back";
      color = "orange";
    } else {
      text = "Incorrect Posture";
      color = "red";
    }

    if (location.pathname.includes("arms"))
      drawText(text, canvas.width/2, canvas.height/2, "80px Arial", color, "center", "middle")

    // Draw the skeleton
    drawLine(joints["left_ear"].x, joints["left_ear"].y, joints["left_eye"].x, joints["left_eye"].y, "lime", 4)
    drawLine(joints["left_eye"].x, joints["left_eye"].y, joints["nose"].x, joints["nose"].y, "lime", 4)
    drawLine(joints["nose"].x, joints["nose"].y, joints["right_eye"].x, joints["right_eye"].y, "lime", 4)
    drawLine(joints["right_eye"].x, joints["right_eye"].y, joints["right_ear"].x, joints["right_ear"].y, "lime", 4)

    drawLine(joints["left_wrist"].x, joints["left_wrist"].y, joints["left_elbow"].x, joints["left_elbow"].y, "lime", 4)
    drawLine(joints["left_elbow"].x, joints["left_elbow"].y, joints["left_shoulder"].x, joints["left_shoulder"].y, "lime", 4)

    drawLine(joints["right_wrist"].x, joints["right_wrist"].y, joints["right_elbow"].x, joints["right_elbow"].y, "lime", 4)
    drawLine(joints["right_elbow"].x, joints["right_elbow"].y, joints["right_shoulder"].x, joints["right_shoulder"].y, "lime", 4)

    drawLine(joints["left_shoulder"].x, joints["left_shoulder"].y, joints["right_shoulder"].x, joints["right_shoulder"].y, "lime", 4)
    drawLine(joints["left_hip"].x, joints["left_hip"].y, joints["right_hip"].x, joints["right_hip"].y, "lime", 4)

    drawLine(joints["left_shoulder"].x, joints["left_shoulder"].y, joints["left_hip"].x, joints["left_hip"].y, "lime", 4)
    drawLine(joints["right_shoulder"].x, joints["right_shoulder"].y, joints["right_hip"].x, joints["right_hip"].y, "lime", 4)

    drawLine(joints["left_knee"].x, joints["left_knee"].y, joints["left_hip"].x, joints["left_hip"].y, "lime", 4)
    drawLine(joints["right_knee"].x, joints["right_knee"].y, joints["right_hip"].x, joints["right_hip"].y, "lime", 4)

    drawLine(joints["left_knee"].x, joints["left_knee"].y, joints["left_ankle"].x, joints["left_ankle"].y, "lime", 4)
    drawLine(joints["right_knee"].x, joints["right_knee"].y, joints["right_ankle"].x, joints["right_ankle"].y, "lime", 4)

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

        update();
    }
  }
  loop();

}
