import { useState, useRef } from 'react';
import { apiClient } from './config.js';

export function useRecorder(patientId = null) {
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [note, setNote] = useState(null);
  const [noteError, setNoteError] = useState(null);
  const [timer, setTimer] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [recordingId, setRecordingId] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendAudioToBackend(audioBlob);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
      };

      mediaRecorder.start();
      setRecording(true);
      setTimer(0);
      setTranscript('');
      setNote(null);
      setProcessingStep(0);

      timerIntervalRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }

    setRecording(false);
    setLoading(true);
    setProcessingStep(1);
  };

  const sendAudioToBackend = async (audioBlob) => {
    if (audioBlob.size === 0) {
      console.error('Audio blob is empty!');
      alert('No audio was recorded. Please try again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setProcessingStep(1);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      if (patientId) {
        formData.append('patientId', patientId);
      }
      
      const response = await apiClient.post('/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;

      if (data.success) {
        setProcessingStep(2);
        setTranscript(data.transcript);
        setRecordingId(data.recordingId);
        setNoteError(data.noteError || null);
        
        setTimeout(() => {
          setProcessingStep(3);
          setNote(data.note);
          setLoading(false);
        }, 500);
      } else {
        console.error('Backend returned success=false:', data);
        alert('Error: ' + (data.message || 'Unknown error from backend'));
        setLoading(false);
      }
    } catch (err) {
      console.error('Error uploading audio:', err.response?.data || err.message);
      alert('Error: ' + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  return {
    recording,
    loading,
    transcript,
    note,
    noteError,
    timer,
    processingStep,
    recordingId,
    start: startRecording,
    stop: stopRecording,
  };
}
