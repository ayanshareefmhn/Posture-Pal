// src/PostureTracker.jsx
import React, { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";
import { useAuth, useUser } from "@clerk/clerk-react";
import "./PostureTracker.css";

const MIN_CONFIDENCE = 0.2;

// ML Python API
const ML_API_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_ML_API_URL) ||
  "http://127.0.0.1:5000/api/posture/predict";

// Camera size
const CAMERA_WIDTH = 640;
const CAMERA_HEIGHT = 480;

export default function PostureTracker({ pushAlert }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastSentRef = useRef(0);
  const lastGoodRef = useRef(0);

  const [status, setStatus] = useState("Initializing posture tracker…");
  const [postureLabel, setPostureLabel] = useState("Detecting posture…");
  const [suggestion, setSuggestion] = useState("");
  const [backAngle, setBackAngle] = useState(null);
  const [shoulderTiltDeg, setShoulderTiltDeg] = useState(null);
  const [headForwardScore, setHeadForwardScore] = useState(null);

  // Clerk auth
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser(); // frontend display only

  // ----------------------------------------
  // SEND FEATURES TO PYTHON ML API
  // ----------------------------------------
  async function sendToML(features) {
    try {
      const resp = await fetch(ML_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(features),
      });

      const raw = await resp.text();
      console.log("Python RAW:", raw);

      const json = JSON.parse(raw);
      return json;
    } catch (err) {
      console.error("ML API Error:", err);
      return { error: true };
    }
  }

  // ----------------------------------------
  // SAVE GOOD POSTURE ALERT
  // ----------------------------------------
  async function pushGoodAlertBackendAndLocal(canvasEl) {
    const now = Date.now();
    if (now - lastGoodRef.current < 8000) return;
    lastGoodRef.current = now;

    const screenshot = canvasEl ? canvasEl.toDataURL("image/png") : null;

    // Create local UI alert
    const alertObj = {
      id: now,
      title: "Great Posture!",
      body: "You maintained good posture.",
      time: new Date().toLocaleTimeString(),
      read: false,
      image: screenshot,
    };

    // Push to local UI
    if (pushAlert) {
      pushAlert((prev) => [alertObj, ...(Array.isArray(prev) ? prev : [])]);
    }

    // Push to backend if logged in
    try {
      if (!isSignedIn) {
        console.log("Not logged in → alert NOT saved to backend.");
        return;
      }

      const token = await getToken({ template: "integration" });
      if (!token) {
        console.log("No Clerk token found.");
        return;
      }

      const res = await fetch("http://localhost:5000/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // backend extracts userId from JWT
        },
        body: JSON.stringify({
          title: alertObj.title,
          body: alertObj.body,
          image: alertObj.image,
        }),
      });

      const saved = await res.json();
      console.log("✔ Saved alert to MongoDB:", saved);
    } catch (err) {
      console.error("Failed saving alert:", err);
    }
  }

  // ----------------------------------------
  // POSTURE CALCULATION + ML CALL
  // ----------------------------------------
  useEffect(() => {
    let isCancelled = false;
    let animationId = null;
    let stream = null;
    let net = null;

    async function setupCamera() {
      const video = videoRef.current;
      const constraints = {
        video: {
          width: CAMERA_WIDTH,
          height: CAMERA_HEIGHT,
          facingMode: "user",
        },
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      video.width = CAMERA_WIDTH;
      video.height = CAMERA_HEIGHT;

      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
    }

    function drawPose(pose) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");

      const w = (canvas.width = video.videoWidth || CAMERA_WIDTH);
      const h = (canvas.height = video.videoHeight || CAMERA_HEIGHT);

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(video, 0, 0, w, h);

      if (!pose) return;

      pose.keypoints.forEach((kp) => {
        if (kp.score < MIN_CONFIDENCE) return;
        ctx.beginPath();
        ctx.arc(kp.position.x, kp.position.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "lime";
        ctx.fill();
      });
    }

    function norm(pos, vw, vh) {
      return { x: pos.x / vw, y: pos.y / vh };
    }

    function angleBetween(u, v) {
      const dot = u.x * v.x + u.y * v.y;
      const n1 = Math.hypot(u.x, u.y) || 1e-8;
      const n2 = Math.hypot(v.x, v.y) || 1e-8;
      return (Math.acos(dot / (n1 * n2)) * 180) / Math.PI;
    }

    async function evaluatePose(pose) {
      if (!pose) return;

      const get = (name) => pose.keypoints.find((k) => k.part === name);

      const video = videoRef.current;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      const LS = get("leftShoulder");
      const RS = get("rightShoulder");
      const LH = get("leftHip");
      const RH = get("rightHip");
      const nose = get("nose");

      if (!LS || !RS) return;

      const LSH = norm(LS.position, vw, vh);
      const RSH = norm(RS.position, vw, vh);

      const mid_sh = { x: (LSH.x + RSH.x) / 2, y: (LSH.y + RSH.y) / 2 };
      let mid_hip = null;

      if (LH && RH) {
        const LHP = norm(LH.position, vw, vh);
        const RHP = norm(RH.position, vw, vh);
        mid_hip = { x: (LHP.x + RHP.x) / 2, y: (LHP.y + RHP.y) / 2 };
      }

      const torso_vec = mid_hip
        ? { x: mid_sh.x - mid_hip.x, y: mid_sh.y - mid_hip.y }
        : null;

      const noseN = nose ? norm(nose.position, vw, vh) : null;
      const head_vec = noseN
        ? { x: noseN.x - mid_sh.x, y: noseN.y - mid_sh.y }
        : null;

      let torso_angle = torso_vec
        ? Math.abs(Math.atan2(torso_vec.x, -torso_vec.y))
        : 0;

      setBackAngle(((torso_angle * 180) / Math.PI).toFixed(1));

      let neck_angle = torso_vec && head_vec ? angleBetween(torso_vec, head_vec) : 0;

      const shoulder_tilt = LSH.y - RSH.y;
      setShoulderTiltDeg((Math.abs(shoulder_tilt) * 100).toFixed(2));

      const hip_tilt = mid_hip ? mid_hip.y - mid_sh.y : 0;

      let head_to_shoulder = 0;
      if (noseN && mid_hip) {
        const dx = noseN.x - mid_sh.x;
        const dy = noseN.y - mid_sh.y;
        const torso_len = Math.hypot(mid_sh.x - mid_hip.x, mid_sh.y - mid_hip.y);
        head_to_shoulder = Math.hypot(dx, dy) / torso_len;
        setHeadForwardScore(head_to_shoulder.toFixed(3));
      }

      const features = {
        torso_angle,
        neck_angle,
        shoulder_tilt,
        hip_tilt,
        head_forward_z: 0,
        head_to_shoulder,
      };

      const now = Date.now();
      if (now - lastSentRef.current < 1000) return;
      lastSentRef.current = now;

      const res = await sendToML(features);
      if (!res || res.error) return;

      const label = res.label ?? res.class_id ?? "Unknown";
      const confidence = res.confidence ?? 0;

      setPostureLabel(`ML: ${label}`);
      setSuggestion(`Confidence: ${(confidence * 100).toFixed(1)}%`);

      if (label.toLowerCase() === "good") {
        await pushGoodAlertBackendAndLocal(canvasRef.current);
      }
    }

    async function init() {
      try {
        await tf.ready();
        net = await posenet.load({
          architecture: "MobileNetV1",
          outputStride: 16,
          inputResolution: { width: CAMERA_WIDTH, height: CAMERA_HEIGHT },
          multiplier: 0.75,
        });

        await setupCamera();
        setStatus("Tracking posture…");

        async function loop() {
          if (isCancelled) return;
          const pose = await net.estimateSinglePose(videoRef.current, { flipHorizontal: true });
          drawPose(pose);
          await evaluatePose(pose);
          animationId = requestAnimationFrame(loop);
        }
        loop();
      } catch (err) {
        console.error(err);
        setStatus("Error starting tracker.");
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [pushAlert, getToken, isSignedIn]);

  return (
    <div className="pp-tracker-container">
      <div className="pp-tracker-main">
        <h1 className="pp-tracker-title">PosturePal Live Tracker</h1>
        <p className="pp-tracker-status">{status}</p>

        <div className="pp-video-wrapper">
          <video ref={videoRef} className="pp-video" playsInline muted />
          <canvas ref={canvasRef} className="pp-canvas" />
        </div>

        <div className="pp-metrics">
          <div className="pp-metric-card">
            <span>Back Angle</span>
            <span>{backAngle ?? "--"}°</span>
          </div>

          <div className="pp-metric-card">
            <span>Shoulder Tilt</span>
            <span>{shoulderTiltDeg ?? "--"}</span>
          </div>

          <div className="pp-metric-card">
            <span>Head Forward</span>
            <span>{headForwardScore ?? "--"}</span>
          </div>

          <div className="pp-metric-card pp-metric-wide">
            <span>Posture Status</span>
            <span>{postureLabel}</span>
            <span className="pp-metric-sub">{suggestion}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
