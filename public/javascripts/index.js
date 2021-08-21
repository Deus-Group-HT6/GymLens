
// Create a detector.
const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);

// Pass in a video stream to the model to detect poses.
const video = document.getElementById('video');
const poses = await detector.estimatePoses(video);
console.log(poses[0].keypoints);