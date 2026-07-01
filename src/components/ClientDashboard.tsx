import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Key, 
  LogOut, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Bookmark, 
  ArrowRight,
  Shield,
  Dna,
  HeartHandshake,
  Camera,
  Upload,
  RefreshCw,
  Scan,
  User,
  Image as ImageIcon,
  Edit3,
  Trash2
} from 'lucide-react';
const app = null; // import guard
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore';
import PostCareInstructions from './PostCareInstructions';

interface PrepaidPackage {
  clientEmail: string;
  clientName: string;
  packageName: string;
  totalSessions: number;
  sessionsUsed: number;
  sessionsRemaining: number;
  lastUpdated: string;
}

interface ClientBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  servicesText: string;
  totalPrice: number;
  date: string;
  time: string;
  ndaSigned: boolean;
  ndaSignature: string;
  isOver18: boolean;
  skincareCheck: boolean;
  status: 'pending' | 'accepted' | 'declined';
  googleEventId?: string;
  clientBirthday?: string;
  clientAddress?: string;
  createdAt: string;
}

interface ClientDashboardProps {
  onClose: () => void;
}

export default function ClientDashboard({ onClose }: ClientDashboardProps) {
  // Login flow states
  const [email, setEmail] = useState('');
  const [magicCode, setMagicCode] = useState('');
  const [loginStep, setLoginStep] = useState<'id-scan' | 'email' | 'code' | 'dashboard'>('id-scan');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);

  // Secure Government ID Login Scanner state and engine variables
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [croppedPhotoId, setCroppedPhotoId] = useState<string | null>(null);
  const [isVerifyingId, setIsVerifyingId] = useState(false);
  const [idVerificationError, setIdVerificationError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isAutoCapture, setIsAutoCapture] = useState(true);
  const [autoCaptureSecs, setAutoCaptureSecs] = useState<number | null>(null);
  const [isLowResScanning, setIsLowResScanning] = useState(false);
  const [isIdDetected, setIsIdDetected] = useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Dashboard synchronized states
  const [loggedInEmail, setLoggedInEmail] = useState('');
  const [packages, setPackages] = useState<PrepaidPackage[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'packages' | 'history' | 'profile' | 'aftercare'>('packages');

  // Client Profile reactive fields
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileBirthday, setProfileBirthday] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [preferredPronouns, setPreferredPronouns] = useState('');
  const [skinSensitivity, setSkinSensitivity] = useState('');
  const [preferredMusic, setPreferredMusic] = useState('');
  const [profileNotes, setProfileNotes] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // States for profile amendment & secure erasure requests
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Verify if there is a session already running in local storage
  useEffect(() => {
    const saved = sessionStorage.getItem('so_client_email');
    if (saved) {
      setLoggedInEmail(saved);
      setLoginStep('dashboard');
      fetchDashboardData(saved);
    }
  }, []);

  // Continuous Auto-Capture Timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCameraActive && isAutoCapture && !photoId && autoCaptureSecs !== null) {
      if (autoCaptureSecs > 0) {
        timer = setTimeout(() => {
          setAutoCaptureSecs(prev => (prev !== null ? prev - 1 : null));
        }, 1000);
      } else if (autoCaptureSecs === 0) {
        capturePhoto();
      }
    }
    return () => clearTimeout(timer);
  }, [isCameraActive, isAutoCapture, photoId, autoCaptureSecs]);

  // Whenever camera states or mode resets, clean up detection timers
  useEffect(() => {
    setIsIdDetected(false);
    setIsLowResScanning(false);
    setAutoCaptureSecs(null);
  }, [isCameraActive, isAutoCapture]);

  // Background interval: Periodically scan for the physical presence of an ID card in the camera frame
  useEffect(() => {
    if (!isCameraActive || !isAutoCapture || photoId) {
      setIsIdDetected(false);
      setAutoCaptureSecs(null);
      return;
    }

    let isFetching = false;

    const intervalId = setInterval(async () => {
      if (isFetching || !videoRef.current || photoId) return;

      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (!ctx || !videoRef.current) return;

      try {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const lowResData = canvas.toDataURL('image/jpeg', 0.45);

        isFetching = true;
        setIsLowResScanning(true);

        const res = await fetch('/api/detect-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId: lowResData })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            const hasId = !!data.hasId;
            setIsIdDetected(hasId);
            if (hasId) {
              // Trigger or keep countdown if ID is recognized!
              setAutoCaptureSecs(prev => (prev === null ? 4 : prev));
            } else {
              // Reset countdown immediately if ID leaves the feed
              setAutoCaptureSecs(null);
            }
          }
        }
      } catch (err) {
        console.warn("Real-time background ID detection failed in dashboard:", err);
      } finally {
        isFetching = false;
        setIsLowResScanning(false);
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [isCameraActive, isAutoCapture, photoId]);

  // Restart camera when facingMode changes
  useEffect(() => {
    if (isCameraActive) {
      startCameraStream();
    }
  }, [facingMode]);

  const startCameraStream = async () => {
    setCameraError(null);
    setPhotoId(null);
    setCroppedPhotoId(null);
    setIdVerificationError(null);
    setIsCameraActive(true);
    setAutoCaptureSecs(null); // Wait for real-time ID recognition!
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Autoplay was blocked or interrupted:", playErr);
        }
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Camera access was rejected or unavailable. Please upload a file manually.");
      setIsCameraActive(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setAutoCaptureSecs(null);
  };

  const cropAndSetPhoto = (originalBase64: string, coordsStr: string) => {
    if (!coordsStr) {
      setCroppedPhotoId(originalBase64);
      return;
    }
    const cleanCoords = coordsStr.replace(/[\[\]]/g, '').split(',');
    if (cleanCoords.length !== 4) {
      setCroppedPhotoId(originalBase64);
      return;
    }
    const ymin = parseFloat(cleanCoords[0].trim());
    const xmin = parseFloat(cleanCoords[1].trim());
    const ymax = parseFloat(cleanCoords[2].trim());
    const xmax = parseFloat(cleanCoords[3].trim());

    const img = new window.Image();
    img.src = originalBase64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      const cropX = (xmin / 1000) * width;
      const cropY = (ymin / 1000) * height;
      const cropW = ((xmax - xmin) / 1000) * width;
      const cropH = ((ymax - ymin) / 1000) * height;

      canvas.width = cropW > 0 ? cropW : width;
      canvas.height = cropH > 0 ? cropH : height;

      const ctx = canvas.getContext('2d');
      if (ctx && cropW > 0 && cropH > 0) {
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
        setCroppedPhotoId(canvas.toDataURL('image/jpeg'));
      } else {
        setCroppedPhotoId(originalBase64);
      }
    };
    img.onerror = () => {
      setCroppedPhotoId(originalBase64);
    };
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg');
          setPhotoId(dataUrl);
          stopCameraStream();
          runIdLoginLookup(dataUrl);
        } catch (err) {
          console.error("Canvas export failed:", err);
          setCameraError("Failed to freeze video frame. Please upload an image file instead.");
        }
      }
    }
  };

  const handlePhotoFile = (file: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/heic'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && fileExt !== 'heic') {
      alert("Please upload a valid PNG, JPG, or HEIC image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        setPhotoId(dataUrl);
        runIdLoginLookup(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const runIdLoginLookup = async (imgData: string) => {
    setIsVerifyingId(true);
    setIdVerificationError(null);
    setCroppedPhotoId(null);
    try {
      const verifyRes = await fetch('/api/verify-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: imgData })
      });
      const data = await verifyRes.json();
      if (!verifyRes.ok || !data.success) {
        throw new Error(data.error || 'Identity transmission timeout.');
      }
      
      const v = data.verification;
      if (v.status === 'ERROR') {
        setIdVerificationError(v.error_reason || 'This document is blurry, skewed, or not an accepted ID format.');
        return;
      }
      
      if (v.is_expired) {
        setIdVerificationError(`This identity card is expired (expiration date: ${v.expiration_date}). Please use a valid, active ID.`);
        return;
      }

      if (v.date_of_birth) {
        const dob = new Date(v.date_of_birth);
        const ageDifMs = Date.now() - dob.getTime();
        const ageDate = new Date(ageDifMs);
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (age < 18) {
          setIdVerificationError(`Legal ID compliance check failed. Extracted age is under 18.`);
          return;
        }
      }

      if (v.cropping_coordinates) {
        cropAndSetPhoto(imgData, v.cropping_coordinates);
      } else {
        setCroppedPhotoId(imgData);
      }

      // 2. Perform name matching lookup
      const lookupRes = await fetch('/api/login/id-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: v.full_name,
          firstName: v.first_name,
          lastName: v.last_name,
          dateOfBirth: v.date_of_birth
        })
      });

      const lookupData = await lookupRes.json();
      if (lookupRes.ok && lookupData.success) {
        sessionStorage.setItem('so_client_email', lookupData.email);
        setLoggedInEmail(lookupData.email);
        setLoginStep('dashboard');
        setSuccessToast(`Identity Unlocked! Welcome back, ${lookupData.name || v.first_name}.`);
        fetchDashboardData(lookupData.email);
        // Clean up camera stream safely
        stopCameraStream();
      } else {
        setIdVerificationError(lookupData.error || `Validated legal credentials, but we could not find an existing reservation under your name '${v.full_name}'. Please log in using the Passwordless Email fallback options below!`);
      }

    } catch (err: any) {
      console.error('ID login verification failed:', err);
      setIdVerificationError(err.message || 'Identity processing was interrupted. Please retry in clean lighting or use email fallback lock.');
    } finally {
      setIsVerifyingId(false);
    }
  };

  const fetchDashboardData = async (clientEmail: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // 1. Fetch package balance
      const packRes = await fetch(`/api/packages/balance?email=${encodeURIComponent(clientEmail)}`);
      // 2. Fetch history
      const bookRes = await fetch(`/api/client/bookings?email=${encodeURIComponent(clientEmail)}`);

      if (packRes.ok) {
        const packData = await packRes.json();
        if (packData.success) {
          setPackages(packData.balance || []);
        } else if (packData.error) {
          console.warn('Backend package fetch warned:', packData.error);
        }
      }

      let loadedBookings: ClientBooking[] = [];
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        if (bookData.success) {
          // Sort by date descending
          const sorted = (bookData.bookings || []).sort((a: any, b: any) => b.date.localeCompare(a.date));
          setBookings(sorted);
          loadedBookings = sorted;
        }
      }

      // 3. Fetch client profile details from Firestore
      try {
        const profileId = clientEmail.toLowerCase().trim();
        const profileRef = doc(db, 'client_profiles', profileId);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const pData = profileSnap.data();
          setProfileName(pData.clientName || '');
          setProfilePhone(pData.clientPhone || '');
          setProfileBirthday(pData.clientBirthday || '');
          setProfileAddress(pData.clientAddress || '');
          setPreferredPronouns(pData.preferredPronouns || '');
          setSkinSensitivity(pData.skinSensitivity || '');
          setPreferredMusic(pData.preferredMusic || '');
          setProfileNotes(pData.notes || pData.profileNotes || '');
        } else {
          // Backward compatibility: pre-fill with latest booking contact details if found!
          const latestBook = loadedBookings[0];
          setProfileName(latestBook?.clientName || '');
          setProfilePhone(latestBook?.clientPhone || '');
          setProfileBirthday(latestBook?.clientBirthday || '');
          setProfileAddress(latestBook?.clientAddress || '');
          setPreferredPronouns('');
          setSkinSensitivity('');
          setPreferredMusic('');
          setProfileNotes('');
        }
      } catch (profileErr) {
        console.warn("Failed to load client profile from Firestore collection:", profileErr);
      }

    } catch (err) {
      console.error('Failed to sync client dashboard resources:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // Direct client-side profile saving is blocked for HIPAA-level record safety.
  };

  const handleSubmitProfileRequest = async (type: 'edit' | 'delete') => {
    if (type === 'edit' && !requestNotes.trim()) {
      setErrorMessage('Please detail the edits you would like Drew to make to your profile.');
      return;
    }
    
    setIsSubmittingRequest(true);
    setErrorMessage('');
    try {
      const sanitizedEmail = loggedInEmail.toLowerCase().trim();
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const payload = {
        clientEmail: sanitizedEmail,
        clientName: profileName || 'Valued Client',
        requestType: type,
        details: type === 'edit' ? requestNotes.trim() : 'Client requested complete profile removal and secure erasure of PII from all active system ledger configurations.',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Write securely to the validated profile_requests collection in Firestore
      await setDoc(doc(db, 'profile_requests', requestId), payload);
      
      setSuccessToast(`Your secure profile ${type === 'edit' ? 'amendment' : 'erasure'} request has been queued for Drew's review!`);
      setTimeout(() => setSuccessToast(''), 6000);
      
      // Clear modals
      setRequestNotes('');
      setShowEditRequestModal(false);
      setShowDeleteRequestModal(false);
    } catch (err: any) {
      console.error("Failed to post profile request to Firestore:", err);
      setErrorMessage(`Failed to transmit request: ${err.message || 'Please check your connection.'}`);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMessage('');
    setSandboxCode(null);

    try {
      const res = await fetch('/api/login/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLoginStep('code');
        if (data.testing && data.code) {
          setSandboxCode(data.code);
          setSuccessToast('Workspace offline sandbox loaded. Code rendered below.');
        } else {
          setSuccessToast('A secure 6-digit access token has been sent to your email.');
        }
      } else {
        setErrorMessage(data.error || 'Failed to dispatch login passcode. Please check email structure.');
      }
    } catch (err) {
      setErrorMessage('Network transmission failure. Drew\'s server may be sleeping.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicCode) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: magicCode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('so_client_email', data.email);
        setLoggedInEmail(data.email);
        setLoginStep('dashboard');
        setSuccessToast('Portal successfully unlocked.');
        fetchDashboardData(data.email);
      } else {
        setErrorMessage(data.error || 'Incorrect code. Please double-check.');
      }
    } catch (err) {
      setErrorMessage('Verification timing error. Please request a new code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('so_client_email');
    setLoggedInEmail('');
    setEmail('');
    setMagicCode('');
    setPackages([]);
    setBookings([]);
    setLoginStep('email');
    setSandboxCode(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      {/* Toast Alert */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#39ff14] text-black font-semibold font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(57,255,20,0.4)] z-55 flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4 text-black" />
            {successToast}
            <button onClick={() => setSuccessToast('')} className="ml-2 font-bold cursor-pointer font-sans text-xs">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ backgroundColor: 'rgba(33, 27, 48, 0.76)' }}
        className="rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden border border-white/30 shadow-[0_0_40px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col relative"
      >
        {/* Header Layout */}
        <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#39ff14] drop-shadow-[0_0_6px_rgba(57,255,20,0.6)]" />
            <span className="font-sans font-black text-white text-xs tracking-wider uppercase">
              {loginStep === 'dashboard' ? 'Private Client Portal' : 'Secure Client Entry'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-3 text-[10px] font-mono tracking-wider font-semibold uppercase bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg border border-white/5 transition cursor-pointer"
          >
            Exit Portal
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 md:p-8 overflow-y-auto grow custom-scrollbar space-y-6">
          
          {/* STEP 0: SECURE GOVERNMENT ID SCANNING LOGIN */}
          {loginStep === 'id-scan' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#D4AF37]/15 border border-[#D4AF37]/35 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(212,175,55,0.25)] animate-pulse">
                  <Scan className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <h2 className="text-lg font-sans font-light text-white tracking-wide">
                  Secure <span className="font-bold text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">Government ID Login</span>
                </h2>
                <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                  Hold the front of your Driver's License or ID card in front of your camera to instantly unlock your secure private vault.
                </p>
              </div>

              {idVerificationError && (
                <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-bold text-red-300 font-mono uppercase tracking-wider">Verification Conflict</span>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-mono pl-6">{idVerificationError}</p>
                </div>
              )}

              {/* Advanced Interactive HTML5 Camera Stream or File Trigger */}
              <div className="space-y-4">
                {isCameraActive ? (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/20 bg-[#07080b] shadow-inner group">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Camera Guidance Rectangular Target Overlay */}
                    <div className="absolute inset-x-8 inset-y-6 border border-dashed border-[#D4AF37]/45 rounded-lg flex items-center justify-center pointer-events-none select-none">
                      <div className="text-[9px] font-mono uppercase tracking-widest text-white/50 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                        Place Card Front Here
                      </div>
                    </div>

                    {/* Pulsing Scan Laser Beam Line Animation */}
                    <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_8px_#D4AF37] top-1/2 animate-[bounce_3s_infinite] pointer-events-none" />

                    {/* Left overlay controls */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                        className="py-1.5 px-2.5 bg-black/60 hover:bg-black/85 text-white border border-white/10 rounded-lg text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition select-none"
                        title="Switch Camera Face (Selfie vs Main Rear)"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {facingMode === 'user' ? 'Rear Cam' : 'Front Cam'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAutoCapture(prev => {
                            if (!prev) setAutoCaptureSecs(4);
                            else setAutoCaptureSecs(null);
                            return !prev;
                          });
                        }}
                        className={`py-1.5 px-2.5 border rounded-lg text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition select-none ${
                          isAutoCapture 
                            ? 'bg-[#39ff14]/20 text-[#39ff14] border-[#39ff14]/30' 
                            : 'bg-black/60 text-white border-white/10'
                        }`}
                      >
                        Auto-Capture: {isAutoCapture ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Real-time Dynamic AI Auto Capture Feedback Badge */}
                    {isAutoCapture && (
                      autoCaptureSecs !== null ? (
                        <div className="absolute top-3 inset-x-3 mx-auto max-w-fit bg-black/90 border border-[#39ff14]/75 shadow-[0_0_12px_rgba(57,255,20,0.5)] py-1.5 px-3 rounded-xl text-[10px] font-mono text-[#39ff14] flex items-center justify-center gap-2 select-none animate-[pulse_1s_infinite]">
                          <Scan className="w-4 h-4 text-[#39ff14] animate-pulse" />
                          <span>ID RECOGNIZED! Capturing in <strong className="text-white text-xs font-sans font-black">{autoCaptureSecs}s</strong>... Keep Still!</span>
                        </div>
                      ) : (
                        <div className="absolute top-3 inset-x-3 mx-auto max-w-fit bg-black/85 border border-[#D4AF37]/35 py-1.5 px-3 rounded-xl text-[10px] font-mono text-white/90 flex items-center justify-center gap-2 select-none shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
                          <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-ping" />
                          <span>ALIGN ID IN FRAME: Scan Active</span>
                        </div>
                      )
                    )}

                    {/* Manual capture layout overlay */}
                    <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                      <button
                        type="button"
                        onClick={stopCameraStream}
                        className="py-1.5 px-2.5 bg-red-650 hover:bg-red-800 text-white border border-red-500/10 rounded-lg text-[9px] font-mono uppercase tracking-wider cursor-pointer transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="py-1.5 px-3 bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-black border border-white/10 rounded-lg text-[9px] font-mono font-black uppercase tracking-widest cursor-pointer transition shadow-md"
                      >
                        Capture Manually
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Visual Launcher Trigger */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={startCameraStream}
                        className="grow py-5 px-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 flex flex-col items-center justify-center gap-2 group transition duration-300 cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.1)] text-center"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform duration-300 border border-[#D4AF37]/10 shadow-[0_0_8px_rgba(212,175,55,0.1)]">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide uppercase">Activate Lens Scanner</span>
                        <p className="text-[10px] text-gray-400 font-mono">Autofocus camera support on mobile / laptop</p>
                      </button>

                      {/* File intake area */}
                      <label className="grow py-5 px-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 flex flex-col items-center justify-center gap-2 group transition duration-300 cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.1)] text-center relative overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handlePhotoFile(e.target.files[0])}
                          className="hidden"
                          id="dashboard-file-upload"
                        />
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] group-hover:scale-105 transition-transform duration-300 border border-[#D4AF37]/10 shadow-[0_0_8px_rgba(212,175,55,0.1)]">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-white tracking-wide uppercase">Upload Photo Card</span>
                        <p className="text-[10px] text-gray-400 font-mono">PNG, Jpeg format up to 10MB</p>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Extraction processing indicator loader overlay */}
              {isVerifyingId && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3.5 shadow-md">
                  <div className="w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  <div className="space-y-0.5 text-left">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-black block animate-pulse">Running AI OCR Deep Extraction</span>
                    <p className="text-[9px] text-gray-400 font-mono">Matching legal details to appointments ledger...</p>
                  </div>
                </div>
              )}

              {/* Fallback code button */}
              <div className="pt-4 border-t border-white/5 text-center space-y-3">
                <span className="text-[10px] font-mono text-gray-400 uppercase block">Alternative Login System:</span>
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setLoginStep('email');
                  }}
                  className="inline-flex items-center gap-2 text-[10px] font-mono text-[#39ff14] hover:text-white uppercase tracking-wider font-semibold transition bg-white/5 hover:bg-[#39ff14]/10 py-2.5 px-4 rounded-xl border border-[#39ff14]/20 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Passwordless Passcode / Email Login
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: REQUEST CODE (EMAIL ONLY) */}
          {loginStep === 'email' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#39ff14]/10 border border-[#39ff14]/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_15px_rgba(57,255,20,0.15)]">
                  <Shield className="w-6 h-6 text-[#39ff14]" />
                </div>
                <h2 className="text-lg font-sans font-light text-white tracking-wide">
                  Passwordless <span className="font-bold text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.3)]">Magic Code Login</span>
                </h2>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Enter your email address below. We'll instantly fetch your ledger or generate a secure 6-digit access code for immediate portal access.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-medium text-red-300 leading-relaxed font-mono">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-[#39ff14] mb-2 block font-semibold">Your Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. client@smoothoperatorsf.com"
                      className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-3 py-3 text-xs font-semibold rounded-xl focus:outline-none focus:border-[#39ff14] focus:ring-1 focus:ring-[#39ff14]/30 focus:bg-white/10 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-[#39ff14] text-black font-mono font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#39ff14]/90 transition duration-300 cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying parameters...' : 'Dispatch Access Code'}
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>

                  <div className="pt-4 border-t border-white/5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('id-scan');
                        startCameraStream();
                      }}
                      className="inline-flex items-center gap-2 text-[10px] font-mono text-[#D4AF37] hover:text-white uppercase tracking-wider font-semibold transition bg-white/5 hover:bg-[#D4AF37]/10 py-2.5 px-4 rounded-xl border border-[#D4AF37]/20 cursor-pointer"
                    >
                      <Scan className="w-3.5 h-3.5" />
                      Scan ID Direct Login (Fastest)
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* STEP 2: VERIFY CODE */}
          {loginStep === 'code' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#39ff14]/10 border border-[#39ff14]/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Key className="w-5 h-5 text-[#39ff14]" />
                </div>
                <h2 className="text-lg font-sans font-light text-white tracking-wide">
                  Enter Your <span className="font-bold text-[#39ff14]">Temporary Passcode</span>
                </h2>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  A high-confidence secure verification code was successfully prepared.
                </p>
                <div className="inline-block px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-mono text-gray-300">
                  Mail directed to: {email}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-medium text-red-300 leading-relaxed font-mono">{errorMessage}</span>
                </div>
              )}

              {sandboxCode && (
                <div className="p-4 bg-[#39ff14]/5 border border-[#39ff14]/20 rounded-xl text-center space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#39ff14] font-semibold block">Testing Sandbox Access Code</span>
                  <div className="text-2xl font-mono text-white tracking-[0.2em] font-bold bg-white/5 rounded-lg p-2.5 inline-block border border-white/5 px-6">
                    {sandboxCode}
                  </div>
                  <p className="text-[9px] text-[#39ff14]/80 font-mono leading-relaxed">
                    Gmail dispatcher is inactive or waiting config. Use this code above to proceed securely!
                  </p>
                </div>
              )}

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase tracking-widest text-[#39ff14] mb-2 block font-semibold">6-Digit Passcode</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={magicCode}
                      onChange={(e) => setMagicCode(e.target.value)}
                      placeholder="e.g. 583921"
                      className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-3 py-3 text-xs font-extrabold rounded-xl focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all font-mono tracking-[0.3em] text-center"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginStep('email')}
                    className="w-1/3 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono font-bold uppercase rounded-xl transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="grow py-3.5 bg-[#39ff14] text-black font-mono font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-white transition duration-300 cursor-pointer flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(57,255,20,0.3)] disabled:opacity-50"
                  >
                    {isLoading ? 'Decrypting entrance...' : 'Unlock Portal'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PRIVATE DASHBOARD INTERFACE */}
          {loginStep === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Profile Header Block */}
              <div className="flex justify-between items-start gap-4 p-4 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
                <div className="space-y-1 select-none">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#39ff14] font-semibold uppercase tracking-widest drop-shadow-[0_0_4px_rgba(57,255,20,0.4)]">
                    <Shield className="w-3.5 h-3.5 text-[#39ff14]" /> verified client portal
                  </div>
                  <h3 className="text-sm font-sans font-bold text-white tracking-tight">{loggedInEmail}</h3>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 bg-red-950/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 rounded-lg border border-red-500/15 text-[10px] font-mono uppercase font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-2 md:flex gap-2 border-b border-white/10 pb-2">
                <button
                  onClick={() => setActiveTab('packages')}
                  className={`py-2 px-1 rounded-xl text-center font-mono uppercase text-[9px] md:text-[10px] tracking-wider transition-all cursor-pointer flex-1 ${
                    activeTab === 'packages'
                      ? 'bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/35 font-bold font-mono shadow-[0_0_10px_rgba(57,255,20,0.15)]'
                      : 'text-gray-400 hover:text-white bg-white/0 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  Your Packages
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2 px-1 rounded-xl text-center font-mono uppercase text-[9px] md:text-[10px] tracking-wider transition-all cursor-pointer flex-1 ${
                    activeTab === 'history'
                      ? 'bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/35 font-bold font-mono shadow-[0_0_10px_rgba(57,255,20,0.15)]'
                      : 'text-gray-400 hover:text-white bg-white/0 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  Appointment History
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-1 rounded-xl text-center font-mono uppercase text-[9px] md:text-[10px] tracking-wider transition-all cursor-pointer flex-1 ${
                    activeTab === 'profile'
                      ? 'bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/35 font-bold font-mono shadow-[0_0_10px_rgba(57,255,20,0.15)]'
                      : 'text-gray-400 hover:text-white bg-white/0 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  My Profile
                </button>
                <button
                  onClick={() => setActiveTab('aftercare')}
                  className={`py-2 px-1 rounded-xl text-center font-mono uppercase text-[9px] md:text-[10px] tracking-wider transition-all cursor-pointer flex-1 ${
                    activeTab === 'aftercare'
                      ? 'bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/35 font-bold font-mono shadow-[0_0_10px_rgba(57,255,20,0.15)]'
                      : 'text-gray-400 hover:text-white bg-white/0 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  Aftercare Guide
                </button>
              </div>

              {/* Loader */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-10 space-y-3 font-mono text-xs text-gray-400">
                  <div className="w-6 h-6 border-2 border-dashed border-[#39ff14] rounded-full animate-spin shadow-[0_0_10px_rgba(57,255,20,0.2)]" />
                  <span>Synchronizing workspace ledgers...</span>
                </div>
              )}

              {/* TAB 1: PREPAID PACKAGES */}
              {!isLoading && activeTab === 'packages' && (
                <div className="space-y-4">
                  {packages.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] p-6 space-y-2">
                      <Bookmark className="w-8 h-8 text-gray-500 mx-auto mb-1 opacity-50" />
                      <span className="text-[11px] font-bold text-white block uppercase tracking-wider">No Active Sessions ledger Found</span>
                      <p className="text-[10px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                        Prepaid packages are managed by Drew via Google Sheets. If you have purchased package credits and they are not displayed, Drew will sync them momentarily!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4.5">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">Your active prepaid balances:</span>
                      {packages.map((pack, idx) => {
                        const percent = (pack.sessionsRemaining / pack.totalSessions) * 100;
                        return (
                          <div 
                            key={idx}
                            className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 hover:border-white/20 transition-all shadow-md relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 p-3 text-[9px] font-mono text-gray-400 uppercase select-none">
                              Sync: {pack.lastUpdated || 'Today'}
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-white tracking-wide uppercase">{pack.packageName}</h4>
                              <p className="text-[10px] text-gray-400">Created for: <span className="font-mono text-white font-semibold">{pack.clientName}</span></p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-3 bg-[#07080b]/40 rounded-xl p-2 text-center border border-white/5">
                              <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">Total Purchased</span>
                                <span className="text-sm font-extrabold text-white font-mono">{pack.totalSessions}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">Sessions Used</span>
                                <span className="text-sm font-extrabold text-[#39ff14] font-mono">{pack.sessionsUsed}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-wider block">Remaining Balance</span>
                                <span className="text-sm font-extrabold text-[#39ff14] font-mono drop-shadow-[0_0_4px_rgba(57,255,20,0.4)]">{pack.sessionsRemaining}</span>
                              </div>
                            </div>

                            {/* Session gauge progress tracker */}
                            <div className="space-y-1.5">
                              <div className="w-full bg-[#07080b] h-2.5 rounded-full overflow-hidden border border-white/5 flex">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ duration: 1, ease: 'easeOut' }}
                                  className="h-full bg-gradient-to-r from-[#39ff14]/80 to-[#39ff14] rounded-full shadow-[0_0_8px_rgba(57,255,20,0.4)]"
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-mono text-gray-400">
                                <span>Completed: {pack.sessionsUsed}</span>
                                <span>Unused: {pack.sessionsRemaining} left</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: APPOINTMENT HISTORY */}
              {!isLoading && activeTab === 'history' && (
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] p-6 space-y-2">
                      <Calendar className="w-8 h-8 text-gray-500 mx-auto mb-1 opacity-50" />
                      <span className="text-[11px] font-bold text-white block uppercase tracking-wider">No Appointments ledger Records found</span>
                      <p className="text-[10px] text-gray-400 max-w-sm mx-auto leading-relaxed font-mono animate-pulse">
                        Ledger searches did not yield matching emails. Book your next premium session using our calendar!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">History of appointment proposals:</span>
                      {bookings.map((book) => {
                        return (
                          <div
                            key={book.id}
                            className="p-4.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.08] transition shadow-md border-l-4 border-l-[#39ff14] shadow-[0_0_12px_rgba(57,255,20,0.08)]"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] uppercase tracking-wider text-gray-400 font-extrabold bg-[#07080b] py-1 px-2.5 rounded-md border border-white/5">
                                  ID: {book.id.toUpperCase()}
                                </span>
                                <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                                  book.status === 'accepted' 
                                    ? 'bg-[#39ff14]/15 text-[#39ff14] border border-[#39ff14]/15 shadow-[0_0_10px_rgba(57,255,20,0.1)]' 
                                    : book.status === 'declined'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/15'
                                      : 'bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/20 animate-pulse'
                                }`}>
                                  ● {book.status}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-white tracking-wide uppercase">{book.servicesText}</p>
                                <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-mono">
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-500" /> {book.date}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-500" /> {book.time}</span>
                                  <span className="text-white font-extrabold font-sans">${book.totalPrice.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Digital agreement status tags in line */}
                            <div className="flex flex-col gap-1 items-start md:items-end md:justify-center border-t md:border-t-0 md:pt-0 pt-2.5 border-white/5 select-none">
                              <div className="flex items-center gap-1 text-[9px] text-[#39ff14] font-mono uppercase bg-[#39ff14]/5 px-2 py-0.5 rounded-md border border-[#39ff14]/5">
                                <Dna className="w-3 h-3" /> NDA Signed & Sealed
                              </div>
                              {book.skincareCheck && (
                                <div className="flex items-center gap-1 text-[9px] text-blue-400 font-mono uppercase bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/5">
                                  <HeartHandshake className="w-3 h-3" /> Skin Safety Validated
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: MY CUSTOM PROFILE */}
              {!isLoading && activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Secure gating warning banner */}
                  <div className="p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-amber-200/90 text-xs flex gap-3.5 items-start leading-relaxed shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                    <Shield className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white uppercase tracking-wider font-mono text-[10px] block mb-1">compliance security restriction</span>
                      Under strict medical intake laws and signed HIPAA-style liability waivers, registered studio profiles and room preferences are locked against direct client modification once processed. To make an amendment or request erasure, please use the secure credentials channels below.
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                        <div className="p-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.15)]">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Studio Profile Ledger</h4>
                          <p className="text-[10px] text-gray-400 font-mono font-semibold uppercase tracking-wide">Secure PII Record Account</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Left Block: Core Contact */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest font-semibold border-l-2 border-l-[#D4AF37] pl-2">
                            Core Account Details
                          </h5>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-semibold">
                              Full Name
                            </label>
                            <input
                              type="text"
                              disabled
                              value={profileName || 'Unspecified'}
                              className="w-full bg-[#07080b]/30 border border-white/5 text-gray-400 px-3.5 py-2.5 text-xs rounded-xl cursor-not-allowed select-all font-mono opacity-80"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-semibold">
                              Gated Email <span className="text-[#D4AF37] font-normal font-mono">(System ID)</span>
                            </label>
                            <div className="relative">
                              <Shield className="absolute right-3.5 top-3 w-4 h-4 text-[#D3AF37]/80" />
                              <input
                                type="email"
                                disabled
                                value={loggedInEmail}
                                className="w-full bg-[#07080b]/30 border border-white/5 text-[#D4AF37] px-3.5 py-2.5 text-xs rounded-xl cursor-not-allowed select-all font-mono opacity-80"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-semibold">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              disabled
                              value={profilePhone || 'Unspecified'}
                              className="w-full bg-[#07080b]/30 border border-white/5 text-gray-400 px-3.5 py-2.5 text-xs rounded-xl cursor-not-allowed select-all font-mono opacity-80"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-semibold">
                                Date of Birth
                              </label>
                              <input
                                type="text"
                                disabled
                                value={profileBirthday || 'Unspecified'}
                                className="w-full bg-[#07080b]/30 border border-white/5 text-gray-400 px-3.5 py-2.5 text-xs rounded-xl cursor-not-allowed select-all font-mono opacity-80 text-left"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-semibold">
                                Preferred Pronouns
                              </label>
                              <input
                                type="text"
                                disabled
                                value={preferredPronouns || 'Unspecified'}
                                className="w-full bg-[#07080b]/30 border border-white/5 text-gray-400 px-3.5 py-2.5 text-xs rounded-xl cursor-not-allowed select-all font-mono opacity-80 text-left"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-semibold">
                              Billing Address
                            </label>
                            <input
                              type="text"
                              disabled
                              value={profileAddress || 'Unspecified'}
                              className="w-full bg-[#07080b]/30 border border-white/5 text-gray-400 px-3.5 py-2.5 text-xs rounded-xl cursor-not-allowed select-all font-mono opacity-80 text-left"
                            />
                          </div>
                        </div>

                        {/* Right Block: Studio Preferences */}
                        <div className="space-y-4">
                          <h5 className="text-[10px] font-mono text-[#D4AF37] uppercase tracking-widest font-semibold border-l-2 border-l-[#D4AF37] pl-2">
                            Studio Customizations
                          </h5>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-semibold">
                              Skin Sensitivity Profile
                            </label>
                            <input
                              type="text"
                              disabled
                              value={skinSensitivity || 'Standard / Resilient'}
                              className="w-full bg-[#07080b]/30 border border-white/5 text-gray-400 px-3.5 py-2.5 text-xs rounded-xl cursor-not-allowed select-all font-mono opacity-80 text-left"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block font-semibold">
                              In-Room Space Soundtrack
                            </label>
                            <input
                              type="text"
                              disabled
                              value={preferredMusic || 'Quiet Zen Room'}
                              className="w-full bg-[#07080b]/30 border border-white/5 text-gray-400 px-3.5 py-2.5 text-xs rounded-xl cursor-not-allowed select-all font-mono opacity-80 text-left"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] block font-bold">
                              Intimate / Waxing Preferential Notes
                            </label>
                            <textarea
                              disabled
                              value={profileNotes || 'No custom preferences recorded. Please request edits to record specific notes.'}
                              rows={4}
                              className="w-full bg-[#07080b]/30 border border-white/5 text-gray-400 p-3 text-xs rounded-xl cursor-not-allowed select-all font-sans resize-none leading-relaxed opacity-80"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Request submission and security info action footer */}
                      <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row gap-4 justify-between items-center bg-black/10 -mx-5 -mb-5 p-5 rounded-b-2xl">
                        <div className="text-[9px] text-gray-500 font-mono text-center sm:text-left">
                          GATED SECURITY KEY: <span className="text-gray-400 select-all">{loggedInEmail}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setRequestNotes('');
                              setShowEditRequestModal(true);
                            }}
                            className="px-5 py-2.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] hover:text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Request Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteRequestModal(true)}
                            className="px-5 py-2.5 bg-red-950/20 hover:bg-red-900/40 border border-red-500/20 text-red-200 hover:text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Request erasure
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* MODAL: REQUEST PROFILE EDIT */}
                  <AnimatePresence>
                    {showEditRequestModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 15 }}
                          className="w-full max-w-md bg-[#0F1015] border border-white/10 p-6 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden"
                        >
                          {/* Top frosted bar */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF37] to-amber-500" />
                          
                          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
                            <Edit3 className="w-5 h-5 text-[#D4AF37]" />
                            <div>
                              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-white">
                                Request Record Edit
                              </h3>
                              <p className="text-[9px] text-gray-500 font-mono">Profile ledger amendment authorization</p>
                            </div>
                          </div>
                          
                          <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                            Briefly outline the parameters (such as contact credentials, Pronouns, skin care warnings, or preferred room soundtracks) you'd like Drew to update in your ledger.
                          </p>

                          <textarea
                            rows={5}
                            value={requestNotes}
                            onChange={(e) => setRequestNotes(e.target.value)}
                            placeholder="e.g. Please update my phone number to (415) 555-0123. Also, let's change my room soundtrack to Lofi Chill Beats."
                            className="w-full bg-black/40 border border-white/10 text-white p-3 text-xs rounded-xl focus:outline-none focus:border-[#D4AF37] resize-none leading-relaxed placeholder:text-gray-600 font-sans"
                          />

                          <div className="flex justify-end gap-3 text-xs pt-2">
                            <button
                              type="button"
                              disabled={isSubmittingRequest}
                              onClick={() => setShowEditRequestModal(false)}
                              className="px-4 py-2 bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-lg transition text-xs font-mono uppercase"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingRequest}
                              onClick={() => handleSubmitProfileRequest('edit')}
                              className="px-4 py-2 bg-[#D4AF37] hover:brightness-110 text-black font-bold font-mono uppercase tracking-wider text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                            >
                              {isSubmittingRequest ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  transmitting...
                                </>
                              ) : (
                                'Submit Request'
                              )}
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* MODAL: REQUEST PII ERASURE */}
                  <AnimatePresence>
                    {showDeleteRequestModal && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 15 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 15 }}
                          className="w-full max-w-md bg-[#0F1015] border border-red-500/20 p-6 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 right-0 h-1 bg-red-650" />
                          
                          <div className="flex items-center gap-2.5 border-b border-red-500/10 pb-3 text-red-400">
                            <Trash2 className="w-5 h-5 animate-pulse" />
                            <div>
                              <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-red-300">
                                Request Record Removal
                              </h3>
                              <p className="text-[9px] text-red-500 font-mono">PII secure erasure verification</p>
                            </div>
                          </div>
                          
                          <p className="text-[11px] text-red-200/80 leading-relaxed font-light">
                            Are you absolutely certain you want to request complete profile removal and secure erasure of personal details from our databases? This processes a compliance request to permanently delete your studio file, signed NDA configurations, and history records. This cannot be undone.
                          </p>

                          <div className="flex justify-end gap-3 text-xs pt-2">
                            <button
                              type="button"
                              disabled={isSubmittingRequest}
                              onClick={() => setShowDeleteRequestModal(false)}
                              className="px-4 py-2 bg-white/5 border border-white/5 text-gray-400 hover:text-white rounded-lg transition text-xs font-mono uppercase"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingRequest}
                              onClick={() => handleSubmitProfileRequest('delete')}
                              className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-bold font-mono uppercase tracking-wider text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                            >
                              {isSubmittingRequest ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  submitting request...
                                </>
                              ) : (
                                'Confirm Erasure Request'
                              )}
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* TAB 3: TREATMENT AFTERCARE */}
              {!isLoading && activeTab === 'aftercare' && (
                <PostCareInstructions />
              )}

            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}
