import Art from "../../design/Art";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { PhoneFrame, ScreenHeader, ScanFrame, ScanStatus, ScanControls, Shutter, Button } from "../../design/components";

const UploadPrescription = ({ onComplete, onBack }) => {
  const [image, setImage] = useState(null);
  const [cameraState, setCameraState] = useState("requesting");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [camToast, setCamToast] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const dragRef = useRef({ startX: 0, dx: 0, dragging: false });
  const [dragX, setDragX] = useState(0);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unavailable");
      return;
    }
    setCameraState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.();
      setTorchSupported(!!caps?.torch);
      setTorchOn(false);
      setCameraState("streaming");
    } catch (err) {
      setCameraState(err?.name === "NotAllowedError" ? "denied" : "unavailable");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const request = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        setTorchSupported(!!track?.getCapabilities?.()?.torch);
        setTorchOn(false);
        setCameraState("streaming");
      } catch (err) {
        if (cancelled) return;
        setCameraState(err?.name === "NotAllowedError" ? "denied" : "unavailable");
      }
    };
    request();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  const camToastVisible = camToast && (cameraState === "denied" || cameraState === "unavailable");

  useEffect(() => {
    if (!camToastVisible) {
      setCamToast(false);
      return;
    }
    setCamToast(true);
    setDragX(0);
    dragRef.current = { startX: 0, dx: 0, dragging: false };
    const t = setTimeout(() => setCamToast(false), 6000);
    return () => clearTimeout(t);
  }, [camToastVisible]);

  const onToastPointerDown = (e) => {
    dragRef.current = { startX: e.clientX, dx: 0, dragging: true };
    setDragX(0);
  };
  const onToastPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dx = e.clientX - dragRef.current.startX;
    setDragX(dragRef.current.dx);
  };
  const onToastPointerUp = () => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (Math.abs(dragRef.current.dx) > 70) {
      setCamToast(false);
    } else {
      setDragX(0);
    }
  };

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const MAX_W = 1280;
    const scale = Math.min(1, MAX_W / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL("image/jpeg", 0.85));
    stopStream();
    setCameraState("captured");
  }, [stopStream]);

  const retake = useCallback(async () => {
    setImage(null);
    await startCamera();
  }, [startCamera]);

  const openGallery = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result);
        stopStream();
        setCameraState("captured");
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [stopStream]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      alert("Flash not supported on this device");
    }
  }, [torchOn]);

  const handleUpload = async () => {
    if (!image) {
      alert("Please capture or upload a prescription image first.");
      return;
    }
    setUploading(true);
    try {
      localStorage.setItem("hera_prescription_image", image); // full data URL, mime type included
      if (onComplete) onComplete();
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const streaming = cameraState === "streaming";

  return (
    <PhoneFrame tone="plain">
      <div className="h-screen">
        <ScreenHeader title="Scan Prescription" onBack={onBack || null} />
        <div className="h-scanmain">
          <ScanFrame className={streaming || image ? "h-scanframe-fill" : undefined}>
            {!image && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-camfill"
                style={{ display: streaming ? "block" : "none" }}
              />
            )}
            {image && (
              <img src={image} alt="Prescription" className="h-camfill" />
            )}
            {!streaming && !image && (
              <div className="h-artbg">
                <Art scene="scan" />
              </div>
            )}
            {cameraState === "requesting" && (
              <div className="h-ovl h-ovl-blur">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>
                <b>Requesting camera access…</b>
                <small>Allow camera permission to scan</small>
              </div>
            )}
            {camToastVisible && (
              <div className="h-toastwrap">
                <div
                  className={`h-toast ${dragX !== 0 ? "is-drag" : ""}`}
                  style={{ transform: `translateX(${dragX}px)` }}
                  onPointerDown={onToastPointerDown}
                  onPointerMove={onToastPointerMove}
                  onPointerUp={onToastPointerUp}
                  onPointerCancel={onToastPointerUp}
                >
                  <div className="h-toast-ico">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="m3 3 18 18"/></svg>
                  </div>
                  <div>
                    <p>Camera unavailable</p>
                    <small>{cameraState === "denied" ? "Access was blocked in browser settings." : "No camera detected on this device."}</small>
                  </div>
                  <button className="tbtn" onClick={openGallery}>Use Gallery</button>
                  <div className="h-swipehint">
                    <i>«</i>
                    <span>SWIPE</span>
                  </div>
                </div>
              </div>
            )}
            {streaming && (
              <>
                <i className="h-scanline" />
                <div className="h-hint">
                  <span>Point at your prescription</span>
                </div>
              </>
            )}
          </ScanFrame>
          <ScanStatus>
            {streaming
              ? "Hold steady — align the prescription inside the frame"
              : image
              ? "Looking good — ready to scan"
              : cameraState === "denied" || cameraState === "unavailable"
              ? "Camera is off — use the gallery option below"
              : ""}
          </ScanStatus>
          <ScanControls
            left="image"
            right="zap"
            onLeft={openGallery}
            onRight={streaming && torchSupported ? toggleTorch : undefined}
          >
            <Shutter state={image ? "done" : "idle"} onClick={streaming ? captureFrame : undefined} />
          </ScanControls>
          <div className="h-scanbtns">
            <Button variant="outline" size="md" fit onClick={openGallery}>Gallery</Button>
            <Button variant="outline" size="md" fit onClick={retake} disabled={!image}>Retake</Button>
          </div>
        </div>
        {image && (
          <div className="h-screen-cta">
            <Button onClick={handleUpload} disabled={!image || uploading}>
              {uploading ? "Processing…" : "Continue to Extraction"}
            </Button>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
};

export default UploadPrescription;
