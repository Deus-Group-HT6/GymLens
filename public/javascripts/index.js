
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

async function startPosing() {

  const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
  const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);

  canvas.width = $("#video").innerWidth();
  canvas.height = $("#video").innerHeight();


  // Video loop
  var fps = 1000;
  var now;
  var then = Date.now();
  var interval = 1000/fps;
  window.delta = 0;
  var fpsArray = [];
  var maxFpsArray = [];
  window.averageFps = 0;
  window.maxFps = 0;

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

  function countReps() {
    
  }

  // Update function
  async function update () {

    let poses = await detector.estimatePoses(video);



    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (!poses[0]) return;

    let points = poses[0].keypoints;

    let body = {}

    for (let p of points) {
      p.x = canvas.width-p.x;
      body[p.name] = p
    }

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

    let r2 = linearRegression(xSpine, ySpine)["r2"];

    drawText(r2, 100, 100)

    // Draw the skeleton
    drawLine(body["left_ear"].x, body["left_ear"].y, body["left_eye"].x, body["left_eye"].y, "lime", 4)
    drawLine(body["left_eye"].x, body["left_eye"].y, body["nose"].x, body["nose"].y, "lime", 4)
    drawLine(body["nose"].x, body["nose"].y, body["right_eye"].x, body["right_eye"].y, "lime", 4)
    drawLine(body["right_eye"].x, body["right_eye"].y, body["right_ear"].x, body["right_ear"].y, "lime", 4)

    drawLine(body["left_wrist"].x, body["left_wrist"].y, body["left_elbow"].x, body["left_elbow"].y, "lime", 4)
    drawLine(body["left_elbow"].x, body["left_elbow"].y, body["left_shoulder"].x, body["left_shoulder"].y, "lime", 4)

    drawLine(body["right_wrist"].x, body["right_wrist"].y, body["right_elbow"].x, body["right_elbow"].y, "lime", 4)
    drawLine(body["right_elbow"].x, body["right_elbow"].y, body["right_shoulder"].x, body["right_shoulder"].y, "lime", 4)

    drawLine(body["left_shoulder"].x, body["left_shoulder"].y, body["right_shoulder"].x, body["right_shoulder"].y, "lime", 4)
    drawLine(body["left_hip"].x, body["left_hip"].y, body["right_hip"].x, body["right_hip"].y, "lime", 4)

    drawLine(body["left_shoulder"].x, body["left_shoulder"].y, body["left_hip"].x, body["left_hip"].y, "lime", 4)
    drawLine(body["right_shoulder"].x, body["right_shoulder"].y, body["right_hip"].x, body["right_hip"].y, "lime", 4)

    drawLine(body["left_knee"].x, body["left_knee"].y, body["left_hip"].x, body["left_hip"].y, "lime", 4)
    drawLine(body["right_knee"].x, body["right_knee"].y, body["right_hip"].x, body["right_hip"].y, "lime", 4)

    drawLine(body["left_knee"].x, body["left_knee"].y, body["left_ankle"].x, body["left_ankle"].y, "lime", 4)
    drawLine(body["right_knee"].x, body["right_knee"].y, body["right_ankle"].x, body["right_ankle"].y, "lime", 4)

    // Draw the joints
    for (let p of points) {
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

}
