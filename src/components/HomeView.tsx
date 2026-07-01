import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, googleSignIn, logout, auth } from '../firebase';
import { initializeWorkspace, getSavedWorkspaceConfig } from '../services/workspace';
import { 
  SERVICES, 
  CATEGORIES 
} from '../services';
import { Service, Booking } from '../types';
import HumanBodyMap from './HumanBodyMap';
import AiIntakeForm from './AiIntakeForm';
import ClientDashboard from './ClientDashboard';
import PostCareInstructions from './PostCareInstructions';
import brandLogo from '../assets/images/SOFavicon.png';
import SparklingLogo from './SparklingLogo';
import { 
  MONTH_NAMES, 
  getDaysInMonth, 
  getFirstDayOfMonth, 
  formatDayString, 
  generateTimeSlots 
} from '../utils/bookingUtils';
import {
  resolveCartOverlaps,
  getSmartRecommendations,
  verifyHygieneSafety,
  calculateTemporalCalculus,
  getAnatomicalDefaultingPrompt
} from '../utils/appointmentManager';
import { 
  Sparkles, 
  ShoppingCart, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Info, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  Heart, 
  Sliders, 
  Grid, 
  UserCheck, 
  CreditCard,
  Droplet,
  ChevronLeft,
  X,
  FileCheck,
  Check,
  Camera,
  Upload,
  Image,
  AlertTriangle,
  AlertCircle,
  Scan,
  Trash2,
  Lock,
  Bell,
  Megaphone,
  RefreshCw,
  MapPin,
  Save,
  ExternalLink
} from 'lucide-react';

interface HomeViewProps {
  onWellnessClick?: () => void;
}

export default function HomeView({ onWellnessClick }: HomeViewProps) {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<'bento' | 'figure' | 'ai'>('figure');
  const [showTermsPdfGate, setShowTermsPdfGate] = useState(false);
  const [aiMatchedWarnings, setAiMatchedWarnings] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Dynamic Google Sheets service menu states
  const [services, setServices] = useState<Service[]>(SERVICES);
  const [servicesSource, setServicesSource] = useState<'local_fallback' | 'google_sheets'>('local_fallback');

  const dynamicCategories = useMemo(() => {
    return [
      {
        name: 'Intimate Waxing',
        description: 'Inclusive, high-precision wax treatments covering pubic, gluteal, and intimate zones with zero judgment.',
        services: services.filter(s => s.category === 'Intimate Waxing')
      },
      {
        name: 'Body Waxing',
        description: 'Complete smooth coverage for torso, back, arms, legs, and underarms, tailored to your body.',
        services: services.filter(s => s.category === 'Body Waxing')
      },
      {
        name: 'Face Waxing',
        description: 'Expert defining and delicate hair clearing to sculpt and brighten your facial contours.',
        services: services.filter(s => s.category === 'Face Waxing')
      },
      {
        name: 'Manscaping',
        description: 'Meticulous trimming to specific uniform lengths to map and showcase muscle definition.',
        services: services.filter(s => s.category === 'Manscaping')
      }
    ];
  }, [services]);

  // Google Workspace sync & Drew's connection status states
  const [showWorkspaceHub, setShowWorkspaceHub] = useState(false);
  const [hubStatus, setHubStatus] = useState<{
    active: boolean;
    spreadsheetId: string | null;
    ndaFolderId: string | null;
    taskListId: string | null;
    stripeHoldUrl?: string | null;
    stripePaymentMode?: 'external' | 'sandbox';
  } | null>(null);
  const [isLinkingWorkspace, setIsLinkingWorkspace] = useState(false);
  const [stripeHoldUrl, setStripeHoldUrl] = useState('https://book.stripe.com/smoothoperatorsf');
  const [stripePaymentMode, setStripePaymentMode] = useState<'external' | 'sandbox'>('external');
  const [isSavingStripeConfig, setIsSavingStripeConfig] = useState(false);

  // Recover active Google Workspace connection details dynamically from Express server settings on load
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const res = await fetch('/api/admin/status');
        if (res.ok) {
          const data = await res.json();
          setHubStatus({
            active: data.active,
            spreadsheetId: data.spreadsheetId,
            ndaFolderId: data.ndaFolderId,
            taskListId: data.taskListId,
            stripeHoldUrl: data.stripeHoldUrl || 'https://book.stripe.com/smoothoperatorsf',
            stripePaymentMode: data.stripePaymentMode || 'external',
          });
          setStripeHoldUrl(data.stripeHoldUrl || 'https://book.stripe.com/smoothoperatorsf');
          setStripePaymentMode(data.stripePaymentMode || 'external');
        }
      } catch (err) {
        console.error("Failed to recover backend Workspace sync status:", err);
      }
    };
    
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.services) {
            setServices(data.services);
            setServicesSource(data.source);
            console.log(`Loaded ${data.services.length} services dynamically from ${data.source}`);
          }
        }
      } catch (err) {
        console.error("Failed to load dynamic services list from API:", err);
      }
    };

    fetchSyncStatus();
    fetchServices();
  }, []);

  const handleSaveStripeConfig = async () => {
    setIsSavingStripeConfig(true);
    try {
      const res = await fetch('/api/admin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeHoldUrl,
          stripePaymentMode
        })
      });
      if (res.ok) {
        alert("Stripe card-hold configurations saved successfully!");
        if (hubStatus) {
          setHubStatus({
            ...hubStatus,
            stripeHoldUrl,
            stripePaymentMode
          });
        }
      } else {
        throw new Error("Server returned an error saving configuration.");
      }
    } catch (err: any) {
      alert("Failed to save stripe config: " + err.message);
    } finally {
      setIsSavingStripeConfig(false);
    }
  };

  const handleLinkWorkspace = async () => {
    setIsLinkingWorkspace(true);
    try {
      // 1. Popup Google Workspace scopes authorization flow
      const result = await googleSignIn();
      if (!result) throw new Error("Google Authorization was not finalized.");

      // 2. Setup standard folder hubs, forms, lists, and spreadsheet ledger structure
      const config = await initializeWorkspace(result.accessToken);

      // 3. Keep backend server credentials perfectly in-sync
      const tokenRes = await fetch('/api/admin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: result.accessToken,
          spreadsheetId: config.spreadsheetId,
          ndaFolderId: config.ndaFolderId,
          taskListId: config.taskListId,
          stripeHoldUrl,
          stripePaymentMode
        })
      });

      if (tokenRes.ok) {
        setHubStatus({
          active: true,
          spreadsheetId: config.spreadsheetId || null,
          ndaFolderId: config.ndaFolderId || null,
          taskListId: config.taskListId || null,
          stripeHoldUrl,
          stripePaymentMode,
        });
        console.log("Secure Google Workspace sync actively logged and listening!");
      } else {
        throw new Error("Failed to register access token on active server.");
      }
    } catch (err: any) {
      console.error("Workspace initial activation failed:", err);
      alert("Failed to initialize Google Workspace: " + (err.message || String(err)));
    } finally {
      setIsLinkingWorkspace(false);
    }
  };

  const handleUnlinkWorkspace = async () => {
    setIsLinkingWorkspace(true);
    try {
      await logout();
      const tokenRes = await fetch('/api/admin/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: '' })
      });
      if (tokenRes.ok) {
        setHubStatus(null);
        console.log("Successfully offline from active Workspace session.");
      }
    } catch (err) {
      console.error("Logout authorization removal failed:", err);
    } finally {
      setIsLinkingWorkspace(false);
    }
  };

  // Advanced styling & optimization states
  const [cartExplanations, setCartExplanations] = useState<string[]>([]);
  const [cartSavings, setCartSavings] = useState<number>(0);
  const [hygieneWarnings, setHygieneWarnings] = useState<string[]>([]);
  const [smartRecommendations, setSmartRecommendations] = useState<any[]>([]);

  // Enforces the core constraints & intimate auto-upgrade rules on any cart update
  const enforceBookingSafetyAndRules = (currentCart: Service[]): Service[] => {
    let updated = [...currentCart];

    const isBrazilianMap = {
      penis: 'intimate-brazilian-penis',
      vagina: 'intimate-brazilian-vagina'
    };
    const isBikiniFullMap = {
      penis: 'intimate-bikini-full-penis',
      vagina: 'intimate-bikini-full-vagina',
      manscaping: 'manscaping-bikini-full'
    };
    const isButtStripId = 'intimate-butt-strip';

    const hasButtStrip = updated.some(s => s.id === isButtStripId);
    const hasBikiniFullVagina = updated.some(s => s.id === isBikiniFullMap.vagina);
    const hasBikiniFullPenis = updated.some(s => s.id === isBikiniFullMap.penis) || updated.some(s => s.id === isBikiniFullMap.manscaping);

    // 1. AUTO UPGRADE RULE: If a client has both Bikini Full and Butt Strip, auto-upgrade to Brazilian
    if (hasButtStrip && (hasBikiniFullVagina || hasBikiniFullPenis)) {
      const resultId = hasBikiniFullVagina ? isBrazilianMap.vagina : isBrazilianMap.penis;
      const brazilianSrv = services.find(s => s.id === resultId);
      
      updated = updated.filter(s => 
        s.id !== isButtStripId && 
        s.id !== isBikiniFullMap.penis && 
        s.id !== isBikiniFullMap.vagina && 
        s.id !== isBikiniFullMap.manscaping
      );
      
      if (brazilianSrv && !updated.some(s => s.id === resultId)) {
        updated.push(brazilianSrv);
      }
    } else {
      // 2. DYNAMIC REGION GRAY OUT: If Brazilian is selected, Butt Strip is removed
      const hasBrazilian = updated.some(s => s.id === isBrazilianMap.penis || s.id === isBrazilianMap.vagina);
      if (hasBrazilian) {
        updated = updated.filter(s => s.id !== isButtStripId);
      }
    }

    // 3. SINGLE INTIMATE SELECTION: Clients can select only one intimate service per appointment from the pool:
    // NOTE: 'intimate-butt-full' (Butt - Full) is explicitly ALLOWED to be paired alongside any bikini service (e.g., Bikini Full).
    // It is deliberately exempt from the INTIMATE_POOL_IDS restriction, ensuring seamless booking of Bikini Full + Butt Full together.
    const INTIMATE_POOL_IDS = [
      'intimate-bikini-full-penis',
      'intimate-bikini-full-vagina',
      'manscaping-bikini-full',
      'intimate-brazilian-penis',
      'intimate-brazilian-vagina',
      'intimate-bikini-line'
    ];

    const selectedIntimateInCart = updated.filter(s => INTIMATE_POOL_IDS.includes(s.id));
    if (selectedIntimateInCart.length > 1) {
      const latestIntimate = selectedIntimateInCart[selectedIntimateInCart.length - 1];
      updated = updated.filter(s => !INTIMATE_POOL_IDS.includes(s.id) || s.id === latestIntimate.id);
    }

    // 4. WAXING VS MANSCAPING MUTUAL EXCLUSION RULES:
    // Ensure that for the same body part, the client cannot select both a wax and a trim (manscaping).
    const EXCLUSION_GROUPS = [
      { name: 'Back', ids: ['body-back-full', 'manscaping-back'] },
      { name: 'Chest', ids: ['body-chest-full', 'manscaping-chest'] },
      { name: 'Stomach', ids: ['body-stomach-full', 'manscaping-stomach'] },
      { name: 'Underarms', ids: ['body-underarm', 'manscaping-underarms'] },
      { name: 'Legs', ids: ['body-legs-full', 'manscaping-legs'] }
    ];

    for (const group of EXCLUSION_GROUPS) {
      const selectedInGroup = updated.filter(s => group.ids.includes(s.id));
      if (selectedInGroup.length > 1) {
        const latestSelected = selectedInGroup[selectedInGroup.length - 1];
        updated = updated.filter(s => !group.ids.includes(s.id) || s.id === latestSelected.id);
      }
    }

    // Apply advanced rules, subset matrices and overlaps from the custom AppointmentManager helper
    const overlapResult = resolveCartOverlaps(updated);
    updated = overlapResult.resolvedCart;
    
    // Set status info states
    setCartExplanations(overlapResult.explanations);
    setCartSavings(overlapResult.totalSavings);

    const hygieneResult = verifyHygieneSafety(updated);
    updated = hygieneResult.autoFixedCart;
    setHygieneWarnings(hygieneResult.warnings);

    const recommendations = getSmartRecommendations(updated);
    setSmartRecommendations(recommendations);

    return updated;
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const isCategoryOpen = (categoryName: string) => expandedCategories.includes(categoryName);
  
  // Date and Time Scheduler selection states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [busyIntervals, setBusyIntervals] = useState<{ start: number; end: number; label: string }[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [showClientPortal, setShowClientPortal] = useState(false);

  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const todayString = new Date().toISOString().split('T')[0];
  
  // Month Calendar helpers & utilities
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handlePrevMonth = () => {
    const rightNow = new Date();
    if (currentYear === rightNow.getFullYear() && currentMonth <= rightNow.getMonth()) {
      return; 
    }
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const isDayDisabled = (year: number, month: number, dayNum: number) => {
    const dayStr = formatDayString(year, month, dayNum);
    if (dayStr < todayString) return true;
    if (blockedDates.includes(dayStr)) return true;
    return false;
  };
  
  // Intake and Booking flows modal states
  const [bookingStep, setBookingStep] = useState<number>(0); 
  // Step 0: Browsing, Step 1: Contact Details & Date, Step 2: NDA & Skincare intake, Step 3: Stripe Hold, Step 4: Success CONFIRMED
  const [scheduleSubStep, setScheduleSubStep] = useState<number>(1);
  // Sub-steps for bookingStep === 1: 1 = Pristine Calendar, 2 = Available Time Bubbles, 3 = Client Info Form, 4 = Photo ID Capture

  // Photo ID Secure storage states and media refs
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  
  const [isAutoCapture, setIsAutoCapture] = useState<boolean>(true);
  const [autoCaptureSecs, setAutoCaptureSecs] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isLowResScanning, setIsLowResScanning] = useState<boolean>(false);
  const [isIdDetected, setIsIdDetected] = useState<boolean>(false);

  // Secure Government ID Verification engine states
  const [isVerifyingId, setIsVerifyingId] = useState<boolean>(false);
  const [idVerificationResult, setIdVerificationResult] = useState<any | null>(null);
  const [isIdVerified, setIsIdVerified] = useState<boolean>(false);
  const [idVerificationError, setIdVerificationError] = useState<string | null>(null);
  const [croppedPhotoId, setCroppedPhotoId] = useState<string | null>(null);
  const [willBringIdInPerson, setWillBringIdInPerson] = useState<boolean>(false);

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

  const runIdVerification = async (imgData: string) => {
    setIsVerifyingId(true);
    setIdVerificationError(null);
    setIdVerificationResult(null);
    setIsIdVerified(false);
    setCroppedPhotoId(null);
    try {
      const response = await fetch('/api/verify-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photoId: imgData })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Identity network transmission timeout.');
      }
      
      const v = data.verification;
      if (v.status === 'ERROR') {
        setIdVerificationError(v.error_reason || 'This document is blurry, skewed, or not an accepted ID format.');
        setIdVerificationResult(v);
        setIsIdVerified(false);
      } else {
        const dobStr = v.date_of_birth;
        if (dobStr) {
          const dob = new Date(dobStr);
          const ageDifMs = Date.now() - dob.getTime();
          const ageDate = new Date(ageDifMs);
          const age = Math.abs(ageDate.getUTCFullYear() - 1970);
          if (age < 18) {
            setIdVerificationError(`Legal ID compliance check failed. Extracted age of ${age} is under 18 years legal requirement.`);
            setIdVerificationResult(v);
            setIsIdVerified(false);
            return;
          }
        } else {
          setIdVerificationError('Date of birth could not be extracted. Please retry with a clearer photo.');
          setIdVerificationResult(v);
          setIsIdVerified(false);
          return;
        }

        if (v.is_expired) {
          setIdVerificationError(`This identity card is expired (expiration date: ${v.expiration_date}). Please use a valid, active ID.`);
          setIdVerificationResult(v);
          setIsIdVerified(false);
          return;
        }

        setIdVerificationResult(v);
        setIsIdVerified(true);
        setIsOver18(true); // Automatically check the age gate declaration checkbox upon verified scan
        
        // Auto prefill extracted identity parameters into client contact profile
        const parsedName = v.full_name || `${v.first_name || ''} ${v.last_name || ''}`.trim();
        if (parsedName) setClientName(parsedName);
        if (v.date_of_birth) setClientBirthday(v.date_of_birth);
        if (v.address) setClientAddress(v.address);

        if (v.cropping_coordinates) {
          cropAndSetPhoto(imgData, v.cropping_coordinates);
        } else {
          setCroppedPhotoId(imgData);
        }

        // Automatic advance to contact profile step (Step 4) if auto-capture is active
        if (isAutoCapture) {
          stopCameraStream();
          setScheduleSubStep(4);
        }
      }
    } catch (err: any) {
      console.error('ID Verification failed:', err);
      setIdVerificationError('Automatic verification failed to reach services. Please retry with a well-lit photo.');
    } finally {
      setIsVerifyingId(false);
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
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
          runIdVerification(dataUrl);
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
        runIdVerification(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

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

  useEffect(() => {
    if (isCameraActive) {
      let activeStream: MediaStream | null = null;
      const start = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode, width: { ideal: 640 }, height: { ideal: 480 } }
          });
          activeStream = stream;
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            try {
              await videoRef.current.play();
            } catch (playErr) {
              console.warn("Video play interrupted:", playErr);
            }
          }
        } catch (err: any) {
          console.error("Camera access error:", err);
          setCameraError("Camera access was rejected or unavailable. Please upload a file via the fallback tab below.");
          setIsCameraActive(false);
        }
      };
      
      const timer = setTimeout(() => {
        start();
      }, 50);
      
      return () => {
        clearTimeout(timer);
        if (activeStream) {
          activeStream.getTracks().forEach(track => track.stop());
        }
      };
    }
  }, [isCameraActive, facingMode]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
        console.warn("Real-time background ID detection failed:", err);
      } finally {
        isFetching = false;
        setIsLowResScanning(false);
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [isCameraActive, isAutoCapture, photoId]);

  // Client info state values
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientBirthday, setClientBirthday] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  // Legal agreements
  const [isOver18, setIsOver18] = useState(false);
  const [ndaAgreed, setNdaAgreed] = useState(false);
  const [ndaSignatureText, setNdaSignatureText] = useState('');
  const [noSkincareContraids, setNoSkincareContraids] = useState(false); // Retin-A, Accutane check
  const [marketingConsent, setMarketingConsent] = useState(true); // Marketing & Reminders consent

  // Stripe hold states
  const [stripeCardholder, setStripeCardholder] = useState('');
  const [stripeCardNum, setStripeCardNum] = useState('');
  const [stripeCardExpiry, setStripeCardExpiry] = useState('');
  const [stripeCardCvc, setStripeCardCvc] = useState('');
  const [hasConfirmedStripeHold, setHasConfirmedStripeHold] = useState(false);

  // Fail-Safe network states
  const [isOfflineSubmissionFailing, setIsOfflineSubmissionFailing] = useState(false);
  const [isClientOffline, setIsClientOffline] = useState(!navigator.onLine);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmation, setBookingConfirmation] = useState<Booking | null>(null);

  // Monitor network state
  useEffect(() => {
    const handleOnline = () => {
      setIsClientOffline(false);
    };
    const handleOffline = () => {
      setIsClientOffline(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Continuous auto-save draft backup
  useEffect(() => {
    try {
      const stateBackup = {
        clientName,
        clientEmail,
        clientPhone,
        clientBirthday,
        clientAddress,
        isOver18,
        ndaAgreed,
        ndaSignatureText,
        noSkincareContraids,
        marketingConsent,
        photoId,
        selectedDate,
        selectedTime,
        selectedServices,
        stripeCardholder,
        bookingStep,
        scheduleSubStep
      };
      localStorage.setItem('smooth_operator_client_draft', JSON.stringify(stateBackup));
    } catch (_) {}
  }, [
    clientName,
    clientEmail,
    clientPhone,
    clientBirthday,
    clientAddress,
    isOver18,
    ndaAgreed,
    ndaSignatureText,
    noSkincareContraids,
    marketingConsent,
    photoId,
    selectedDate,
    selectedTime,
    selectedServices,
    stripeCardholder,
    bookingStep,
    scheduleSubStep
  ]);

  // Restores local booking draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('smooth_operator_client_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.clientName) setClientName(parsed.clientName);
        if (parsed.clientEmail) setClientEmail(parsed.clientEmail);
        if (parsed.clientPhone) setClientPhone(parsed.clientPhone);
        if (parsed.clientBirthday) setClientBirthday(parsed.clientBirthday);
        if (parsed.clientAddress) setClientAddress(parsed.clientAddress);
        if (parsed.isOver18 !== undefined) setIsOver18(parsed.isOver18);
        if (parsed.ndaAgreed !== undefined) setNdaAgreed(parsed.ndaAgreed);
        if (parsed.ndaSignatureText) setNdaSignatureText(parsed.ndaSignatureText);
        if (parsed.noSkincareContraids !== undefined) setNoSkincareContraids(parsed.noSkincareContraids);
        if (parsed.marketingConsent !== undefined) setMarketingConsent(parsed.marketingConsent);
        if (parsed.photoId) setPhotoId(parsed.photoId);
        if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
        if (parsed.selectedTime) setSelectedTime(parsed.selectedTime);
        if (parsed.selectedServices) setSelectedServices(parsed.selectedServices);
        if (parsed.stripeCardholder) setStripeCardholder(parsed.stripeCardholder);
        if (parsed.bookingStep) setBookingStep(parsed.bookingStep);
        if (parsed.scheduleSubStep) setScheduleSubStep(parsed.scheduleSubStep);
      }
    } catch (_) {}
  }, []);

  // Background network-retry trigger helper
  const retryOfflineSubmission = async () => {
    const bookingPath = 'bookings';
    const trackingId = 'so_' + Math.random().toString(36).substring(2, 10);
    try {
      const dataPayload: Omit<Booking, 'id'> = {
        clientName,
        clientEmail,
        clientPhone,
        clientBirthday: clientBirthday || '',
        clientAddress: clientAddress || '',
        services: selectedServices,
        totalPrice,
        totalDuration: totalDurationWithHiddenBuffer,
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        ndaSigned: ndaAgreed,
        ndaSignature: ndaSignatureText,
        isOver18,
        skincareCheck: noSkincareContraids,
        stripeCardHoldToken: 'tok_cardhold_preauth_' + Math.random().toString(36).substring(2, 14),
        photoId: croppedPhotoId || photoId || (willBringIdInPerson ? 'BYPASS_WILL_BRING_PHYSICAL_ID' : ''),
        idBypassedWithPhysicalCheck: willBringIdInPerson,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, bookingPath), dataPayload);

      // Create or update client profile dynamically in Firestore on offline retry success
      try {
        const profileId = clientEmail.toLowerCase().trim();
        const profileRef = doc(db, 'client_profiles', profileId);
        const existingSnap = await getDoc(profileRef);
        
        const profilePayload = {
          clientName: clientName,
          clientEmail: profileId,
          clientPhone: clientPhone,
          clientBirthday: clientBirthday || '',
          clientAddress: clientAddress || '',
          updatedAt: new Date().toISOString()
        };
        
        if (!existingSnap.exists()) {
          await setDoc(profileRef, {
            ...profilePayload,
            preferredPronouns: '',
            skinSensitivity: '',
            preferredMusic: '',
            notes: '',
            createdAt: new Date().toISOString()
          });
        } else {
          await updateDoc(profileRef, profilePayload);
        }
        console.log("Dynamically updated client profile on offline sync restoration:", profileId);
      } catch (profileErr) {
        console.warn("Failed to automatically update client profile card on successful offline retry:", profileErr);
      }

      const confirmedBooking: Booking = { id: trackingId, ...dataPayload };
      setBookingConfirmation(confirmedBooking);
      setIsOfflineSubmissionFailing(false);
      setBookingStep(4); // SUCCESS SCREEN
      setSelectedServices([]);
      try {
        localStorage.removeItem('smooth_operator_client_draft');
      } catch (_) {}
    } catch (_) {
      console.warn("Retrying database sync from fail-safe cache is still failing...");
    }
  };

  // Automated connection restoration polling
  useEffect(() => {
    if (!isOfflineSubmissionFailing) return;
    const interval = setInterval(async () => {
      if (navigator.onLine && isOfflineSubmissionFailing) {
        console.log("Internet link restored, auto-submitting client slots...");
        await retryOfflineSubmission();
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [isOfflineSubmissionFailing, clientName, clientEmail, clientPhone, clientBirthday, clientAddress, selectedDate, selectedTime, selectedServices]);

  // Fetch blockouts so client datepicker skips blocked vacation rest days
  useEffect(() => {
    const fetchBlockouts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'blockouts'));
        const datesList: string[] = [];
        querySnapshot.forEach((docSnap) => {
          datesList.push(docSnap.data().date);
        });
        setBlockedDates(datesList);
      } catch (err) {
        console.warn('Skipping blockout fetch, using zero-blockout state.');
      }
    };
    fetchBlockouts();
  }, []);

  // Fetch actual day busy/availability blocks dynamically from Google Calendar cache and existing studio bookings
  useEffect(() => {
    if (!selectedDate) {
      setBusyIntervals([]);
      return;
    }

    const fetchDayAvailability = async () => {
      setIsLoadingAvailability(true);
      try {
        const intervals: { start: number; end: number; label: string }[] = [];

        // 1. Fetch real-time busy intervals from Google Calendar via server-side proxy API
        try {
          const res = await fetch(`/api/availability?date=${encodeURIComponent(selectedDate)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.intervals) {
              intervals.push(...data.intervals);
            }
          }
        } catch (apiErr) {
          console.warn("Failed to contact server-side availability proxy:", apiErr);
        }

        // 2. Fetch Drew's synced Google Calendar busy slots Firestore collection (as fallback/cache)
        try {
          const calendarQuery = query(
            collection(db, 'drew_calendar_busy_slots'),
            where('date', '==', selectedDate)
          );
          const calendarSnap = await getDocs(calendarQuery);
          calendarSnap.forEach((docSnap) => {
            const data = docSnap.data();
            const startStr = data.start;
            const endStr = data.end;
            
            if (startStr && endStr) {
              if (!startStr.includes('T')) {
                // All day event, Drew is completely unavailable
                intervals.push({ start: 0, end: 1440, label: data.summary || 'Out of Studio' });
              } else {
                const startD = new Date(startStr);
                const endD = new Date(endStr);
                const startMin = startD.getHours() * 60 + startD.getMinutes();
                const endMin = endD.getHours() * 60 + endD.getMinutes();
                intervals.push({ start: startMin, end: endMin, label: data.summary || 'Google Calendar Busy State' });
              }
            }
          });
        } catch (dbErr) {
          console.warn("Skipped Firestore busy slots lookup: unauthenticated or offline.");
        }

        // 3. Fetch approved/pending bookings on the same date strictly if signed-in as Drew (Admin)
        // Since list bookings is restricted to isAdmin() inside firestore.rules, general clients
        // will get PERMISSION_DENIED. We protect them from throwing active loader crashes.
        const isClientAdmin = auth.currentUser?.email === 'drew@smoothoperatorsf.com' || auth.currentUser?.email === 'admin@smoothoperatorsf.com';
        if (isClientAdmin) {
          try {
            const bookingsQuery = query(
              collection(db, 'bookings'),
              where('date', '==', selectedDate)
            );
            const bookingsSnap = await getDocs(bookingsQuery);
            bookingsSnap.forEach((docSnap) => {
              const b = docSnap.data();
              if (b.status !== 'declined' && b.time && b.totalDuration) {
                const [h, m] = b.time.split(':').map(Number);
                const startMin = h * 60 + m;
                const endMin = startMin + b.totalDuration;
                // Only push if not already duplicated by the real-time API interval tracker
                const duplicate = intervals.some(inv => inv.start === startMin && inv.end === endMin);
                if (!duplicate) {
                  intervals.push({ start: startMin, end: endMin, label: `Studio Booking (${b.clientName || 'Reserved'})` });
                }
              }
            });
          } catch (bookingsErr) {
            console.warn("Skipped client-side bookings search: restricted permission gate.");
          }
        }

        setBusyIntervals(intervals);
      } catch (err) {
        console.warn("Failed to load Drew's real-time workspace availability state: " + err);
      } finally {
        setIsLoadingAvailability(false);
      }
    };

    fetchDayAvailability();
  }, [selectedDate]);



  // Sync date selection safety constraints: client cannot choose past dates or blocked dates
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.value;
    if (blockedDates.includes(chosen)) {
      alert("Drew is out of studio for refueling or on vacation on this date. Please select another beautiful day!");
      setSelectedDate('');
    } else {
      setSelectedDate(chosen);
    }
  };

  // Cart operations
  const handleAddService = (service: Service) => {
    if (selectedServices.find(s => s.id === service.id)) return;
    const resolvedCart = enforceBookingSafetyAndRules([...selectedServices, service]);
    setSelectedServices(resolvedCart);
  };

  const handleRemoveService = (serviceId: string) => {
    const resolvedCart = enforceBookingSafetyAndRules(selectedServices.filter(s => s.id !== serviceId));
    setSelectedServices(resolvedCart);
  };

  const getAnatomySwapAlternative = (id: string): { alternativeId: string; label: string } | null => {
    if (id === 'intimate-brazilian-vagina') return { alternativeId: 'intimate-brazilian-penis', label: 'Switch to (Penis)' };
    if (id === 'intimate-brazilian-penis') return { alternativeId: 'intimate-brazilian-vagina', label: 'Switch to (Vagina)' };
    if (id === 'intimate-bikini-full-vagina') return { alternativeId: 'intimate-bikini-full-penis', label: 'Switch to (Penis)' };
    if (id === 'intimate-bikini-full-penis') return { alternativeId: 'intimate-bikini-full-vagina', label: 'Switch to (Vagina)' };
    return null;
  };

  const handleSwapAnatomy = (currentId: string, alternativeId: string) => {
    const updated = selectedServices.map(s => s.id === currentId ? alternativeId : s.id);
    const updatedServices = updated
      .map(id => services.find(s => s.id === id))
      .filter((s): s is Service => !!s);
    const resolvedCart = enforceBookingSafetyAndRules(updatedServices);
    setSelectedServices(resolvedCart);
  };

  const handleApplyAiServices = (services: Service[]) => {
    const resolvedCart = enforceBookingSafetyAndRules(services);
    setSelectedServices(resolvedCart);
  };

  const handleSetAiContraindications = (warnings: string[]) => {
    setAiMatchedWarnings(warnings);
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const netDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  // Hidden 15-min cleaning buffer represents part of total appointment duration
  const totalDurationWithHiddenBuffer = netDuration + 15;

  const handleStartBookingProcess = () => {
    if (selectedServices.length === 0) {
      alert("Kindly select at least one grooming or waxing service to begin booking.");
      return;
    }
    setScheduleSubStep(1);
    setBookingStep(1);
  };

  // Handle final submission to Firebase Firestore
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOver18) {
      alert("You must confirm you are 18 years or older for intimate waxing services.");
      return;
    }
    if (!ndaAgreed || !ndaSignatureText) {
      alert("Please sign the NDA to secure confidential discussions.");
      return;
    }
    if (!noSkincareContraids && selectedServices.some(s => s.category === 'Face Waxing')) {
      alert("For facial waxing, you must confirm you haven't used Retin-A, Accutane or chemical peels recently.");
      return;
    }

    setIsSubmitting(true);
    const bookingPath = 'bookings';
    const trackingId = 'so_' + Math.random().toString(36).substring(2, 10);

    try {
      // If the client's browser detects a network disconnect before submission, trigger the offline system immediately
      if (!navigator.onLine) {
        setIsOfflineSubmissionFailing(true);
        setIsSubmitting(false);
        return;
      }

      const dataPayload: Omit<Booking, 'id'> = {
        clientName,
        clientEmail,
        clientPhone,
        clientBirthday: clientBirthday || '',
        clientAddress: clientAddress || '',
        services: selectedServices,
        totalPrice,
        totalDuration: totalDurationWithHiddenBuffer, // Hidden 15m cleaning time written directly to document
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        ndaSigned: ndaAgreed,
        ndaSignature: ndaSignatureText,
        isOver18,
        skincareCheck: noSkincareContraids,
        stripeCardHoldToken: 'tok_cardhold_preauth_' + Math.random().toString(36).substring(2, 14),
        photoId: croppedPhotoId || photoId || (willBringIdInPerson ? 'BYPASS_WILL_BRING_PHYSICAL_ID' : ''),
        idBypassedWithPhysicalCheck: willBringIdInPerson,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to Firestore database
      await addDoc(collection(db, bookingPath), dataPayload);

      // Create or update client profile dynamically in Firestore
      try {
        const profileId = clientEmail.toLowerCase().trim();
        const profileRef = doc(db, 'client_profiles', profileId);
        const existingSnap = await getDoc(profileRef);
        
        const profilePayload = {
          clientName: clientName,
          clientEmail: profileId,
          clientPhone: clientPhone,
          clientBirthday: clientBirthday || '',
          clientAddress: clientAddress || '',
          updatedAt: new Date().toISOString()
        };
        
        if (!existingSnap.exists()) {
          await setDoc(profileRef, {
            ...profilePayload,
            preferredPronouns: '',
            skinSensitivity: '',
            preferredMusic: '',
            notes: '',
            createdAt: new Date().toISOString()
          });
        } else {
          // Merge contact details to avoid wiping out custom user-defined preferences
          await updateDoc(profileRef, profilePayload);
        }
        console.log("Dynamically updated client profile document in Firestore client_profiles collection:", profileId);
      } catch (profileErr) {
        console.warn("Failed to automatically update client profile card on successful checkout:", profileErr);
      }

      const confirmedBooking: Booking = { id: trackingId, ...dataPayload };

      // Dispatch booking details to our Express server for direct Google Workspace & Calendar synchronization
      try {
        const syncRes = await fetch('/api/booking/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ booking: confirmedBooking }),
        });
        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.googleEventId) {
            confirmedBooking.googleEventId = syncData.googleEventId;
          }
          console.log("Successfully fed booking directly into Google Workspace sheets and calendar.");
        } else {
          console.warn("Direct Google Workspace sync offline or returned a non-ok response.");
        }
      } catch (syncErr) {
        console.warn("Failed to synchronize booking to Google Workspace in real-time:", syncErr);
      }

      setBookingConfirmation(confirmedBooking);
      setBookingStep(4); // Advance to beautiful success screen
      setSelectedServices([]); // Empty cart upon successful logging
      try {
        localStorage.removeItem('smooth_operator_client_draft');
      } catch (_) {}
    } catch (error) {
      console.warn("Direct submission failed, activating Client Fail-Safe backup redundancy...", error);
      setIsOfflineSubmissionFailing(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackStep = () => {
    if (bookingStep === 1) {
      if (scheduleSubStep > 1) {
        if (scheduleSubStep === 4) {
          stopCameraStream();
        }
        setScheduleSubStep(scheduleSubStep - 1);
      } else {
        setBookingStep(0);
      }
    } else if (bookingStep > 0) {
      setBookingStep(bookingStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-100 selection:bg-[#39ff14] selection:text-black font-sans relative">
      
      {/* Background radial details */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#39ff14]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation header styled as premium frosted glass */}
      <header className="border-b border-[rgba(168,142,224,0.15)] bg-[#1e172e]/85 backdrop-blur-md sticky top-0 z-30 px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SparklingLogo size="md" />
            <div className="flex flex-col">
              <span className="font-sans font-black tracking-widest text-white text-sm uppercase">Smooth Operator SF</span>
              <span className="text-[9px] text-[#39ff14] font-mono tracking-wider font-semibold">PREMIUM WAXING & Intimate MANSCAPING</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              id="client-portal-btn"
              onClick={() => setShowClientPortal(true)}
              className="text-xs uppercase tracking-widest text-[#39ff14] hover:text-white font-semibold flex items-center gap-1.5 transition py-1.5 px-3 rounded-xl border border-[#39ff14]/25 hover:border-[#39ff14]/50 bg-[#39ff14]/5 hover:bg-[#39ff14]/15 backdrop-blur cursor-pointer hover:shadow-[0_0_15px_rgba(57,255,20,0.25)]"
            >
              <User className="w-3.5 h-3.5 text-[#39ff14] drop-shadow-[0_0_4px_rgba(57,255,20,0.5)]" /> Client Portal
            </button>
            <button
              id="client-booking-guide-btn"
              onClick={() => setShowHelpGuide(true)}
              className="text-xs uppercase tracking-widest text-[#39ff14] hover:text-white font-semibold flex items-center gap-1.5 transition py-1.5 px-3 rounded-xl border border-[#39ff14]/20 hover:border-[#39ff14]/40 bg-[#39ff14]/5 hover:bg-[#39ff14]/15 backdrop-blur cursor-pointer hover:shadow-lg"
            >
              <Info className="w-3.5 h-3.5 text-[#39ff14]" /> How to Book
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Frame Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-12 pb-24">

        {/* Intrinsic SEO Optimizations Banner & Welcome copy as a large frosted glass card */}
        <section className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-center relative overflow-hidden shadow-xl border-white/25">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-mono text-[#39ff14] uppercase tracking-[0.2em] block">
              We Cater to All Gender Alignments, Identities & Backgrounds
            </span>
            <h1 className="text-2xl md:text-4xl font-sans font-light text-white tracking-wide leading-tight">
              Reclaim Confidence. <span className="font-bold text-[#39ff14]">Get Smooth!</span>
            </h1>
            <p className="text-xs text-gray-200/90 leading-relaxed max-w-xl">
              Smooth Operator SF is San Francisco’s dedicated studio for manscaping, male waxing, and intimate grooming. While specializing in men's grooming, we provide a safe, comfortable, and respectful space where all genders are welcome.
            </p>
          </div>

          <div className="glass-light p-5 rounded-2xl border-white/25 space-y-2.5 shrink-0 w-full md:max-w-xs shadow-inner">
            <div className="flex items-center gap-2 text-xs text-[#39ff14] font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#39ff14]" /> Community Appreciation
            </div>
            <div className="space-y-3 pt-1">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-white block">🎖️ Military Discount</span>
                <p className="text-[10px] text-gray-200 leading-normal">
                  10% off all specialized services for active duty & veterans.
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-white block">🍎 Educator Discount</span>
                <p className="text-[10px] text-gray-200 leading-normal">
                  10% off all grooming & waxing treatments for teachers & school staff.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dynamic Dual-Layout: Left side service selection, Right side floating Cart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Service Selector side: Col 8 */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* View controller tabs with custom frosted styling */}
            <div className="flex justify-between items-center glass-dark p-2 rounded-2xl border-white/10 shadow-lg">
              <span className="text-xs font-mono uppercase tracking-widest text-[#39ff14] font-semibold pl-3">
                Book as you Wish
              </span>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  id="tab-bento"
                  onClick={() => setActiveTab('bento')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${
                    activeTab === 'bento' ? 'bg-[#39ff14] text-black shadow-md shadow-[0_0_12px_rgba(57,255,20,0.3)]' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" /> Service Cards
                </button>
                <button
                  id="tab-figure"
                  onClick={() => setActiveTab('figure')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${
                    activeTab === 'figure' ? 'bg-[#39ff14] text-black shadow-md shadow-[0_0_12px_rgba(57,255,20,0.3)]' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" /> Body Map
                </button>
                <button
                  id="tab-ai"
                  onClick={() => setActiveTab('ai')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition leading-none ${
                    activeTab === 'ai' ? 'bg-[#39ff14] text-black shadow-md shadow-[0_0_12px_rgba(57,255,20,0.3)]' : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" /> AI Consultant
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'figure' ? (
                <motion.div
                  key="figure-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <HumanBodyMap 
                    onAddService={handleAddService} 
                    selectedServices={selectedServices} 
                    services={services}
                  />
                </motion.div>
              ) : activeTab === 'bento' ? (
                <motion.div
                  key="bento-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-12"
                >
                  {dynamicCategories.map((cat) => {
                    const isOpen = isCategoryOpen(cat.name);
                    return (
                      <div key={cat.name} className="glass rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-white/5 transition-all duration-300">
                        {/* Accordion header button */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat.name)}
                          className="w-full text-left p-5 flex items-center justify-between hover:bg-white/10 transition-colors duration-200 cursor-pointer focus:outline-none"
                        >
                          <div className="flex items-center gap-3">
                            <Droplet className={`w-5 h-5 text-[#39ff14] transition-all duration-300 ${isOpen ? 'scale-110 drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]' : ''}`} />
                            <div>
                              <h2 className="font-sans font-semibold tracking-wider text-base md:text-lg text-white">
                                {cat.name}
                              </h2>
                              <p className="text-[10px] text-gray-400 font-mono tracking-wider mt-0.5 uppercase">
                                {cat.services.length} treatments available
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-90 text-[#39ff14] drop-shadow-[0_0_4px_rgba(57,255,20,0.5)]' : ''}`} />
                          </div>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key={`${cat.name}-content`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="p-5 pt-2 border-t border-white/10 bg-black/20 space-y-4">
                                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                                  {cat.description}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {cat.services.map((service) => {
                                    const isAlreadyAdded = selectedServices.some(s => s.id === service.id);
                                    const isBrazilianSelected = selectedServices.some(s => s.id === 'intimate-brazilian-penis' || s.id === 'intimate-brazilian-vagina');
                                    const isButtStripExcluded = service.id === 'intimate-butt-strip' && isBrazilianSelected;
                                    return (
                                      <div 
                                        key={service.id} 
                                        className={`glass-light glass-hover p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 relative group border-white/10 ${
                                          isButtStripExcluded ? 'opacity-50 select-none' : ''
                                        }`}
                                      >
                                        <div className="space-y-2">
                                          <div className="flex justify-between items-start gap-2">
                                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                              {service.category === 'Manscaping' ? (
                                                <span className="text-[8px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/35 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider font-mono">
                                                  manscape
                                                </span>
                                              ) : (
                                                <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider font-mono">
                                                  wax
                                                </span>
                                              )}
                                              <h3 className="font-sans font-bold text-sm text-white group-hover:text-[#39ff14] transition duration-300 font-medium my-0">
                                                {service.name}
                                              </h3>
                                            </div>
                                            <span className="text-[#39ff14] font-sans font-extrabold text-sm shrink-0">
                                              ${service.price.toFixed(2)}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-200/80 leading-relaxed line-clamp-3">
                                            {isButtStripExcluded ? "Included at no extra cost in your selected Brazilian treatment." : service.description}
                                          </p>
                                        </div>

                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
                                          <span className="text-xs text-[#39ff14] flex items-center gap-1.5 font-mono">
                                            <Clock className="w-3.5 h-3.5 text-[#39ff14]" /> {service.duration} mins
                                          </span>
                                          
                                          <button
                                            id={`add-bento-${service.id}`}
                                            onClick={() => !isButtStripExcluded && handleAddService(service)}
                                            disabled={isButtStripExcluded}
                                            className={`text-xs py-1.5 px-4 rounded-xl transition font-medium ${
                                              isButtStripExcluded
                                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                                                : isAlreadyAdded
                                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30 cursor-pointer'
                                                  : 'bg-white/10 hover:bg-[#39ff14] border border-white/15 hover:text-black font-semibold shadow-inner cursor-pointer'
                                            }`}
                                          >
                                            {isButtStripExcluded ? 'Included' : isAlreadyAdded ? 'Added' : 'Add to Reservation'}
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="ai-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <AiIntakeForm 
                    selectedServices={selectedServices}
                    onApplyServices={handleApplyAiServices}
                    onSetContraindicationWarnings={handleSetAiContraindications}
                    services={services}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart Section: Col 4 with custom glass panel */}
          <div className="lg:col-span-4 glass rounded-3xl p-6 shadow-2xl relative sticky top-24 z-20 overflow-hidden border-white/20">
            <h2 className="font-sans font-bold text-lg text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#39ff14]" /> Your Reservation Cart
            </h2>

            {selectedServices.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-gray-200/70 text-sm">Cart is currently empty.</p>
                <p className="text-xs text-gray-300/60 max-w-[200px] mx-auto leading-relaxed">
                  Toggle on card list or human figure mapping to add smooth operator treatments.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* List items with elegant frosted block style */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar border-b border-white/10 pb-4">
                  {selectedServices.map((srv) => {
                    const swapAlternative = getAnatomySwapAlternative(srv.id);
                    return (
                      <div key={srv.id} className="flex flex-col gap-2 p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs">
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {srv.category === 'Manscaping' ? (
                                <span className="text-[8.5px] bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/35 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider font-mono">
                                  manscape
                                </span>
                              ) : (
                                <span className="text-[8.5px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider font-mono">
                                  wax
                                </span>
                              )}
                              <span className="font-semibold text-white ml-0.5">{srv.name}</span>
                            </div>
                            <span className="text-gray-300 font-mono text-[10px]">{srv.duration} mins</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#39ff14]">${srv.price.toFixed(2)}</span>
                            <button
                              id={`remove-cart-${srv.id}`}
                              onClick={() => handleRemoveService(srv.id)}
                              className="text-gray-400 hover:text-red-400 transition"
                              title="Remove service"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {swapAlternative && (
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between w-full">
                            <span className="text-[9px] text-amber-400/80 font-mono">
                              Wrong anatomy?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSwapAnatomy(srv.id, swapAlternative.alternativeId)}
                              className="text-[9px] font-bold text-[#39ff14] hover:text-black bg-[#39ff14]/15 hover:bg-[#39ff14] border border-[#39ff14]/30 hover:border-transparent px-2 py-0.5 rounded transition duration-250 flex items-center gap-1 cursor-pointer select-none"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>{swapAlternative.label}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Advanced Pricing, Hygiene Safeguards, and Synergy Recommendations alerts */}
                {cartSavings > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-sans font-bold text-[11px] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-[#39ff14] animate-pulse" />
                      <span>Smart Pricing Optimized!</span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-relaxed font-sans">
                      You are saving <strong className="text-[#39ff14] font-mono font-bold">${cartSavings.toFixed(2)}</strong> on your selected treatments via our non-overlapping bundle algorithm.
                    </p>
                    {cartExplanations.map((exp, idx) => (
                      <p key={idx} className="text-[9.5px] text-[#39ff14]/90 border-l border-[#39ff14]/30 pl-2 py-0.5 leading-relaxed font-sans">
                        {exp}
                      </p>
                    ))}
                  </div>
                )}

                {hygieneWarnings.length > 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-amber-400 font-sans font-bold text-[11px] uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 font-extrabold animate-bounce" />
                      <span>Hygiene Safeguard Update</span>
                    </div>
                    {hygieneWarnings.map((war, idx) => (
                      <p key={idx} className="text-[9.5px] text-gray-300 leading-normal font-sans">
                        {war}
                      </p>
                    ))}
                  </div>
                )}

                {smartRecommendations.length > 0 && (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 backdrop-blur-sm">
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider font-sans flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Expert Blending Recommendations</span>
                    </div>
                    <div className="space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                      {smartRecommendations.map((rec) => (
                        <div key={rec.id} className="p-2 bg-black/35 rounded-lg border border-white/5 space-y-1.5">
                          <p className="text-[10px] text-gray-300 italic leading-relaxed font-sans">
                            "{rec.nlpMessage}"
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#D4AF37] font-semibold">
                              + {rec.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const matched = services.find(s => s.id === rec.suggestedServiceId);
                                if (matched) {
                                  handleAddService(matched);
                                }
                              }}
                              className="text-[9px] font-extrabold text-[#39ff14] bg-[#39ff14]/15 hover:bg-[#39ff14] hover:text-black hover:border-transparent cursor-pointer px-2 py-0.5 rounded border border-[#39ff14]/30 uppercase tracking-wider transition-all font-sans"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Invisible turnaround buffer blocks schedule time to avoid overlapping conflicts on Drew's calendar */}

                {/* Summaries */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs text-gray-400 font-mono">
                    <span>Selected Services:</span>
                    <span className="text-white font-semibold">{selectedServices.length}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 font-mono">
                    <span>Waxing Treatment Time:</span>
                    <span className="text-white font-semibold">{netDuration} minutes</span>
                  </div>
                  <div className="flex justify-between text-base text-white font-bold border-t border-[#232432] pt-3">
                    <span>Estimated Total:</span>
                    <span className="text-[#39ff14]">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  id="checkout-book-now-btn"
                  onClick={handleStartBookingProcess}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#39ff14] to-emerald-500 hover:from-[#51ff33] hover:to-emerald-400 text-black font-sans font-bold uppercase tracking-wider text-xs rounded-xl transition shadow shadow-[#39ff14]/20 hover:shadow-lg hover:gradient-glow hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Confirm & Propose Appointment slots
                </button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Booking Form Overlay Modals: Steps 1, 2, 3, 4 */}
      <AnimatePresence>
        {bookingStep > 0 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-dark rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border-white/20"
            >
              
              {/* Overlay Modal Header with glass details */}
              <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#39ff14]" />
                  <span className="font-sans font-bold text-white text-sm tracking-wide">
                    {bookingStep === 1 && (
                      scheduleSubStep === 1 ? "Step 1/3: Choose Appointment Day" :
                      scheduleSubStep === 2 ? "Step 1/3: Select Available Start Time" :
                      scheduleSubStep === 3 ? "Step 1/3: Secure Photo ID Capture" :
                      "Step 1/3: Your Contact Information"
                    )}
                    {bookingStep === 2 && "Step 2/3: Digital intake agreements (Confidential NDA)"}
                    {bookingStep === 4 && "Step 3/3: Appointment request Submitted!"}
                  </span>
                </div>
                {bookingStep < 4 && (
                  <button
                    id="close-booking-modal"
                    onClick={() => setBookingStep(0)}
                    className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition animate-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Progress Bar indicator */}
              {bookingStep < 4 && (
                <div className="w-full bg-white/5 h-1.5 flex">
                  <div 
                    className="h-full bg-[#39ff14] transition-all duration-300 shadow-[0_0_8px_#39ff14]" 
                    style={{
                      width: bookingStep === 2 ? '100%' : 
                             bookingStep === 1 && scheduleSubStep === 1 ? '16%' :
                             bookingStep === 1 && scheduleSubStep === 2 ? '33%' :
                             bookingStep === 1 && scheduleSubStep === 3 ? '50%' : 
                             bookingStep === 1 && scheduleSubStep === 4 ? '66%' : '0%'
                    }}
                  />
                </div>
              )}

              {/* Inner steps */}
              <div className="p-6 overflow-y-auto grow custom-scrollbar space-y-6">
                
                {/* Emergency Offline Status Card (Network Fail-Safe Guard) */}
                {(isOfflineSubmissionFailing || isClientOffline) && (
                  <div className="p-5 bg-[#2d1c44]/90 backdrop-blur-md border-2 border-[#39ff14]/90 rounded-2xl animate-pulse shadow-[0_0_20px_rgba(57,255,20,0.25)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div className="flex gap-3 items-start">
                      <div className="p-2 rounded-lg bg-[#39ff14]/10 text-[#39ff14] shrink-0 border border-[#39ff14]/25">
                        <AlertTriangle className="w-5 h-5 text-[#39ff14]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-sans font-black text-[#39ff14] tracking-wider uppercase">FAIL-SAFE ACTIVE: OFFLINE LOCKDOWN</h4>
                        <p className="text-gray-200 mt-1 leading-relaxed text-[11px] font-sans">
                          <strong>Connection interrupted.</strong> Your information and selected slot have been saved locally. Do not refresh; we will automatically retry processing your request once a stable connection is re-established.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={retryOfflineSubmission}
                        className="text-[10px] uppercase font-mono tracking-wider text-black bg-[#39ff14] hover:bg-[#5aff43] font-black py-1.5 px-3.5 rounded-xl transition duration-150 cursor-pointer shadow-[0_0_10px_rgba(57,255,20,0.3)] shrink-0"
                      >
                        Retry Now
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 1: PROGRESSIVE REVEAL SCHEDULING FLOW */}
                {bookingStep === 1 && (
                  <div className="space-y-4">
                    
                    {/* SUB-STEP 1: PRISTINE CALENDAR FIRST */}
                    {scheduleSubStep === 1 && (
                      <div className="space-y-4 animate-fadeIn">
                        <div>
                          <label className="text-xs font-mono uppercase tracking-widest text-[#39ff14] mb-2 block font-semibold">Select Appointment Day</label>
                          <p className="text-xs text-gray-400 mb-3 font-sans">
                            Choose a preferred day for your grooming service on Drew's calendar below. Available times will reveal automatically.
                          </p>
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                            {/* Month display with triggers */}
                            <div className="flex justify-between items-center bg-white/5 border border-white/5 p-2 rounded-xl">
                              <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1 px-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-lg text-[10px] hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer font-semibold animate-none"
                                disabled={currentYear === new Date().getFullYear() && currentMonth <= new Date().getMonth()}
                              >
                                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" /> Prev
                              </button>
                              <span className="text-white font-semibold text-xs tracking-wider font-sans text-center">
                                {MONTH_NAMES[currentMonth]} {currentYear}
                              </span>
                              <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1 px-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-lg text-[10px] hover:bg-white/10 transition cursor-pointer font-semibold animate-none"
                              >
                                Next <ChevronRight className="w-3.5 h-3.5 inline mr-1" />
                              </button>
                            </div>

                            {/* Weekday Labels */}
                            <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                              <span>Su</span>
                              <span>Mo</span>
                              <span>Tu</span>
                              <span>We</span>
                              <span>Th</span>
                              <span>Fr</span>
                              <span>Sa</span>
                            </div>

                            {/* Days Grid */}
                            <div className="grid grid-cols-7 gap-1">
                              {/* Empty starting padding cells */}
                              {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, idx) => (
                                <div key={`empty-${idx}`} className="h-8" />
                              ))}
                              
                              {/* Real clickable month days */}
                              {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }).map((_, idx) => {
                                const dayNum = idx + 1;
                                const dayStr = formatDayString(currentYear, currentMonth, dayNum);
                                const disabled = isDayDisabled(currentYear, currentMonth, dayNum);
                                const isSelected = selectedDate === dayStr;

                                return (
                                  <button
                                    key={`day-${dayNum}`}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => {
                                      setSelectedDate(dayStr);
                                      setSelectedTime(''); // Reset time selection on day changes
                                      setScheduleSubStep(2); // Automatically transition to sub-step 2
                                    }}
                                    className={`h-8 w-full flex items-center justify-center rounded-lg text-xs font-semibold font-mono transition-all duration-250 cursor-pointer animate-none ${
                                      isSelected 
                                        ? 'bg-[#39ff14] text-black shadow-[0_0_10px_rgba(57,255,20,0.4)] font-extrabold border border-[#39ff14]' 
                                        : disabled 
                                          ? 'text-gray-600 bg-white/[0.01] line-through pointer-events-none opacity-30' 
                                          : 'text-white bg-white/5 hover:bg-white/10 border border-white/5'
                                    }`}
                                  >
                                    {dayNum}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-STEP 2: DYNAMIC AVAILABLE TIME BUBBLES GRID */}
                    {scheduleSubStep === 2 && (
                      <div className="space-y-4 animate-fadeIn">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-mono uppercase tracking-widest text-[#39ff14] font-semibold">Select Start Time</label>
                            <button
                              type="button"
                              onClick={() => setScheduleSubStep(1)}
                              className="text-[10px] text-gray-400 hover:text-white transition underline font-sans"
                            >
                              Choose Another Date
                            </button>
                          </div>
                          
                          <div className="text-[11px] font-mono text-gray-300 bg-[#211b30]/70 border border-[rgba(168,142,224,0.15)] px-3 py-2 rounded-xl mb-3 flex items-center justify-between">
                            <span>Selected Date: <strong className="text-[#39ff14] font-bold">{selectedDate}</strong></span>
                            <span>Duration Required: <strong className="text-white">{netDuration} Min</strong></span>
                          </div>

                          {isLoadingAvailability ? (
                            <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                              <span className="w-8 h-8 border-4 border-[#39ff14] border-t-transparent rounded-full animate-spin inline-block" />
                              <p className="text-xs text-gray-400 font-mono">Syncing calendar availabilities in real-time...</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Filter slots dynamically with totalDurationWithHiddenBuffer check */}
                              {(() => {
                                const validSlots = generateTimeSlots().filter((slot) => {
                                  const startMin = slot.minutes;
                                  const endMin = startMin + totalDurationWithHiddenBuffer;
                                  if (endMin > 1140) return false;
                                  const hasConflict = busyIntervals.some((busy) => {
                                    return startMin < busy.end && busy.start < endMin;
                                  });
                                  return !hasConflict;
                                });

                                if (validSlots.length === 0) {
                                  return (
                                    <div className="text-center p-6 bg-red-950/10 border border-red-500/20 rounded-xl">
                                      <p className="text-xs text-red-300 font-medium leading-relaxed">
                                        No uninterrupted windows found matching your service length on this date.
                                      </p>
                                      <button 
                                        type="button" 
                                        onClick={() => setScheduleSubStep(1)}
                                        className="mt-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition border border-white/10 cursor-pointer animate-none"
                                      >
                                        Go Back To Calendar
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                                    {validSlots.map((slot) => {
                                      const isSelected = selectedTime === slot.value;
                                      return (
                                        <button
                                          key={slot.value}
                                          type="button"
                                          onClick={() => {
                                            setSelectedTime(slot.value);
                                            // Instantly advance to Step 3 Form!
                                            setScheduleSubStep(3);
                                          }}
                                          className={`py-2 h-10 w-full flex items-center justify-center rounded-xl text-xs font-mono tracking-wide font-medium transition-all duration-300 cursor-pointer animate-none ${
                                            isSelected
                                              ? 'bg-[#39ff14] text-black border-[#39ff14] font-extrabold shadow-[0_0_12px_rgba(57,255,20,0.6)] scale-[1.03]'
                                              : 'bg-[rgba(33,27,48,0.76)] hover:bg-[rgba(56,48,77,0.85)] hover:border-[#39ff14]/70 hover:shadow-[0_0_10px_rgba(57,255,20,0.25)] border border-[rgba(168,142,224,0.16)] text-white font-semibold'
                                          }`}
                                        >
                                          {slot.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-STEP 4: CLIENT CONTACT INFORMATION FORM */}
                    {scheduleSubStep === 4 && (
                      <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center bg-[#211b30]/60 border border-[rgba(168,142,224,0.15)] px-3 py-2.5 rounded-2xl text-[11px] font-mono">
                          <div>
                            <span className="text-gray-400">Selected Date:</span> <strong className="text-white">{selectedDate}</strong>
                            <span className="mx-2 text-white/20">|</span>
                            <span className="text-gray-400">Time:</span> <strong className="text-[#39ff14] uppercase">
                              {generateTimeSlots().find(s => s.value === selectedTime)?.label || selectedTime}
                            </strong>
                          </div>
                          <button
                            type="button"
                            onClick={() => setScheduleSubStep(3)}
                            className="text-gray-400 hover:text-white transition underline cursor-pointer"
                          >
                            Back to ID Verify
                          </button>
                        </div>

                        <div className="space-y-3.5">
                          <div>
                            <label className="text-xs font-mono uppercase tracking-widest text-[#39ff14] mb-2 block font-semibold">Your Full Name</label>
                            <div className="relative">
                              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                              <input
                                id="client-name-input"
                                type="text"
                                required
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="e.g. Robin Williams"
                                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all font-sans"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-mono uppercase tracking-widest text-[#39ff14] mb-2 block font-semibold">Email Address</label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                              <input
                                id="client-email-input"
                                type="email"
                                required
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                placeholder="e.g. robin@sf.org"
                                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all font-sans"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-mono uppercase tracking-widest text-[#39ff14] mb-2 block font-semibold font-sans">Phone Number</label>
                            <div className="relative">
                              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                              <input
                                id="client-phone-input"
                                type="tel"
                                required
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                placeholder="e.g. (415) 555-0199"
                                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] mb-2 block font-semibold flex items-center gap-1 font-sans">
                              <span>Birthday</span>
                              <span className="text-[10px] lowercase text-white/50 font-normal font-sans">(optional)</span>
                            </label>
                            <div className="relative">
                              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                              <input
                                id="client-birthday-input"
                                type="date"
                                value={clientBirthday}
                                onChange={(e) => setClientBirthday(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-mono uppercase tracking-widest text-[#D4AF37] mb-2 block font-semibold flex items-center gap-1 font-sans">
                              <span>Physical Address</span>
                              <span className="text-[10px] lowercase text-white/50 font-normal font-sans">(optional)</span>
                            </label>
                            <div className="relative">
                              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                              <input
                                id="client-address-input"
                                type="text"
                                value={clientAddress}
                                onChange={(e) => setClientAddress(e.target.value)}
                                placeholder="e.g. 1560 Mission St, San Francisco, CA"
                                className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-3 py-2.5 text-xs font-semibold rounded-xl focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all font-sans"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SUB-STEP 3: SECURE PHOTO ID VERIFICATION */}
                    {scheduleSubStep === 3 && (
                      <div className="space-y-4 animate-fadeIn">
                        {/* Top Back and Navigation details with transparent smokey lavender surface and neon green glow border */}
                        <div className="flex justify-between items-center bg-[#211b30]/60 border border-[rgba(168,142,224,0.15)] px-3 py-2.5 rounded-2xl text-[11px] font-mono">
                          <button
                            type="button"
                            onClick={() => {
                              stopCameraStream();
                              setScheduleSubStep(2);
                            }}
                            className="text-gray-300 hover:text-white transition flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" /> Back to Time Selection
                          </button>
                          <span className="text-gray-400">Step 3 of 4: Direct ID Verification</span>
                        </div>

                        {/* Prominent Golden Guard/Law Compliance Ribbon */}
                        <div className="p-3.5 bg-[rgba(30,23,46,0.6)] border border-[#ffdb4d]/30 rounded-2xl flex gap-3 text-xs leading-relaxed text-amber-200">
                          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="font-sans">
                            ID verification is strictly required for legal age compliance. All uploaded data is fully encrypted and handled under strict confidentiality protocols.
                          </p>
                        </div>

                        {/* Photo ID Capture/Upload Card with translucent smokey lavender design system and vibrant, high-contrast neon green border */}
                        <div className="bg-[#1e172e]/85 backdrop-blur-md rounded-2xl p-5 border border-[#39ff14]/30 hover:border-[#39ff14] transition-all duration-300 relative">
                          {!photoId ? (
                            <div className="space-y-4">
                              <p className="text-xs text-center text-gray-400 font-sans">
                                Select how you want to secure your identity lock:
                              </p>
                              
                              <div className="flex justify-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCameraError(null);
                                    setIsCameraActive(true);
                                  }}
                                  className={`py-2 px-4 rounded-xl text-xs font-mono tracking-wider font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                                    isCameraActive 
                                      ? 'bg-[#39ff14]/20 border border-[#39ff14] text-[#39ff14] shadow-[0_0_12px_rgba(57,255,20,0.3)]' 
                                      : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                                  }`}
                                >
                                  <Camera className="w-4 h-4" /> Use Camera
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    stopCameraStream();
                                    setIsCameraActive(false);
                                  }}
                                  className={`py-2 px-4 rounded-xl text-xs font-mono tracking-wider font-semibold flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                                    !isCameraActive 
                                      ? 'bg-[#39ff14]/20 border border-[#39ff14] text-[#39ff14] shadow-[0_0_12px_rgba(57,255,20,0.3)]' 
                                      : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                                  }`}
                                >
                                  <Upload className="w-4 h-4" /> Upload File
                                </button>
                              </div>

                              {isCameraActive ? (
                                <div className="space-y-3 animate-fadeIn">
                                  <div className="relative w-full max-w-sm mx-auto aspect-video rounded-xl overflow-hidden border-2 border-[#D4AF37]/60 shadow-[0_0_15px_rgba(212,175,55,0.15)] bg-black group">
                                    <video
                                      ref={videoRef}
                                      autoPlay
                                      playsInline
                                      className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                                    />
                                    
                                    {/* Camera Guidance Rectangular Target Overlay */}
                                    <div className="absolute inset-x-8 inset-y-6 border border-dashed border-[#D4AF37]/55 rounded-lg flex items-center justify-center pointer-events-none select-none">
                                      <div className="text-[9px] font-mono uppercase tracking-widest text-[#D4AF37] bg-black/60 px-2.5 py-0.5 rounded backdrop-blur-sm border border-[#D4AF37]/20">
                                        Place Card Front Here
                                      </div>
                                    </div>

                                    {/* Pulsing Scan Laser Beam Line Animation */}
                                    <div className="absolute inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_8px_#D4AF37] top-1/2 animate-[bounce_3s_infinite] pointer-events-none" />

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

                                    {/* Bottom control overlays overlayed on video feed */}
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                                      <button
                                        type="button"
                                        onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                                        className="py-1.5 px-2 bg-black/60 hover:bg-black/85 text-white border border-white/10 rounded-lg text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition select-none"
                                        title="Switch Camera Face (Selfie vs Rear)"
                                      >
                                        <RefreshCw className="w-3 h-3 text-[#D4AF37]" />
                                        {facingMode === 'user' ? 'Rear' : 'Front'}
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
                                        className={`py-1.5 px-2 border rounded-lg text-[9px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition select-none ${
                                          isAutoCapture 
                                            ? 'bg-[#39ff14]/20 text-[#39ff14] border-[#39ff14]/30' 
                                            : 'bg-black/60 text-white border-white/10'
                                        }`}
                                      >
                                        Auto: {isAutoCapture ? 'ON' : 'OFF'}
                                      </button>
                                    </div>
                                  </div>

                                  <div className="flex justify-center gap-2.5">
                                    <button
                                      type="button"
                                      onClick={capturePhoto}
                                      className="py-1.5 px-4 bg-[#39ff14] hover:bg-[#51ff33] text-black font-semibold text-xs rounded-lg transition-all duration-200 shadow-[0_0_10px_#39ff14] cursor-pointer"
                                    >
                                      Snap Photo ID
                                    </button>
                                    <button
                                      type="button"
                                      onClick={stopCameraStream}
                                      className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                      handlePhotoFile(e.dataTransfer.files[0]);
                                    }
                                  }}
                                  onClick={() => {
                                    const input = document.getElementById('file-id-chooser');
                                    if (input) input.click();
                                  }}
                                  className="border border-dashed border-white/10 hover:border-[#39ff14]/40 transition rounded-xl p-6 cursor-pointer space-y-2.5 bg-white/[0.01]"
                                >
                                  <input 
                                    type="file" 
                                    id="file-id-chooser" 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/jpg, image/heic"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handlePhotoFile(e.target.files[0]);
                                      }
                                    }}
                                  />
                                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                                    <Upload className="w-5 h-5 text-gray-400" />
                                  </div>
                                  <p className="text-xs text-gray-300 font-sans text-center">
                                    Drag &amp; drop your Photo ID here, or <strong className="text-[#39ff14] hover:underline cursor-pointer">browse locally</strong>
                                  </p>
                                  <p className="text-[10px] text-gray-500 font-mono text-center">
                                    Accepts raw PNG, JPG, JPEG or HEIC (under 5MB)
                                  </p>
                                </div>
                              )}

                              {cameraError && (
                                <p className="text-[11px] text-red-400 font-mono max-w-sm mx-auto p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl leading-relaxed text-center">
                                  {cameraError}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-4 py-2 animate-fadeIn text-center">
                              {isVerifyingId ? (
                                <div className="space-y-4 py-6 flex flex-col items-center justify-center">
                                  <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-semibold text-white tracking-wider uppercase font-mono">AUTOMATED AI VERIFICATION</h4>
                                    <p className="text-xs text-gray-400 font-sans max-w-xs leading-relaxed mx-auto">
                                      Scanning credentials, evaluating document boundaries, and checking legal age compliance...
                                    </p>
                                  </div>
                                </div>
                              ) : idVerificationError ? (
                                <div className="space-y-4 p-4 border border-red-500/30 rounded-2xl bg-red-950/20 text-center">
                                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                                  <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-red-400 font-mono tracking-wide uppercase">ID VERIFICATION DECLINED</h4>
                                    <p className="text-xs text-red-200/90 leading-relaxed font-sans max-w-sm mx-auto">
                                      {idVerificationError}
                                    </p>
                                  </div>
                                  
                                  {idVerificationResult && (
                                    <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-left text-[10px] font-mono space-y-1.5 text-gray-400 max-w-xs mx-auto">
                                      <p><strong className="text-gray-300">Class:</strong> {idVerificationResult.id_type || 'Unknown'}</p>
                                      {idVerificationResult.first_name && <p><strong className="text-gray-300">Name:</strong> {idVerificationResult.first_name} {idVerificationResult.last_name}</p>}
                                      {idVerificationResult.date_of_birth && <p><strong className="text-gray-300">DOB:</strong> {idVerificationResult.date_of_birth}</p>}
                                      {idVerificationResult.expiration_date && <p><strong className="text-gray-300">Expires:</strong> {idVerificationResult.expiration_date}</p>}
                                    </div>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPhotoId(null);
                                      setIdVerificationError(null);
                                      setIdVerificationResult(null);
                                      setIsIdVerified(false);
                                      setCroppedPhotoId(null);
                                    }}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer"
                                  >
                                    Clear &amp; Retake Photo ID
                                  </button>
                                </div>
                              ) : isIdVerified && idVerificationResult ? (
                                <div className="space-y-4">
                                  <div className="flex items-center justify-center gap-2 text-xs font-mono uppercase tracking-widest text-[#39ff14] font-bold">
                                    <ShieldCheck className="w-5 h-5 text-[#39ff14]" /> GOVERNMENT ID VERIFIED
                                  </div>

                                  {/* Cropped photo preview */}
                                  <div className="relative w-44 h-32 mx-auto rounded-2xl overflow-hidden border-2 border-[#39ff14]/60 shadow-[0_0_20px_rgba(57,255,20,0.15)] bg-slate-900">
                                    <img
                                      src={croppedPhotoId || photoId}
                                      alt="AI-Cropped Government ID Document"
                                      className="w-full h-full object-cover blur-[1.5px] scale-102"
                                    />
                                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                      <span className="text-[9px] bg-black/90 text-[#39ff14] font-mono tracking-widest font-extrabold px-2 py-1 rounded border border-[#39ff14]/40 uppercase animate-pulse">
                                        AI ALIGNED &amp; LOCKED
                                      </span>
                                    </div>
                                  </div>

                                  {/* Extracted stats details card */}
                                  <div className="max-w-xs mx-auto p-3 bg-black/50 border border-white/5 rounded-2xl text-left space-y-1.5 text-[11px] font-mono">
                                    <p className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Document Class:</span> <strong className="text-gray-300 font-semibold">{idVerificationResult.id_type}</strong></p>
                                    <p className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Holder Name:</span> <strong className="text-white font-semibold">{idVerificationResult.first_name} {idVerificationResult.last_name}</strong></p>
                                    <p className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Birthdate (DOB):</span> <strong className="text-gray-300 font-semibold">{idVerificationResult.date_of_birth}</strong></p>
                                    <p className="flex justify-between border-b border-white/5 pb-1"><span className="text-gray-500">Document No:</span> <strong className="text-gray-300 font-semibold font-mono">{idVerificationResult.id_number || '••••••'}</strong></p>
                                    <p className="flex justify-between"><span className="text-gray-500">Expires:</span> <strong className="text-gray-300 font-semibold">{idVerificationResult.expiration_date}</strong></p>
                                  </div>

                                  {idVerificationResult.sandbox && (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200 font-mono">
                                      <Info className="w-3.5 h-3.5" /> Sandbox Simulation Mode
                                    </div>
                                  )}

                                  <div className="pt-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPhotoId(null);
                                        setIdVerificationError(null);
                                        setIdVerificationResult(null);
                                        setIsIdVerified(false);
                                        setCroppedPhotoId(null);
                                      }}
                                      className="text-xs text-gray-500 hover:text-red-400 font-mono transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      &lsaquo; Remove ID &amp; Upload New Document
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4 py-2 animate-fadeIn text-center">
                                  <p className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold flex items-center justify-center gap-1.5">
                                    <Lock className="w-4 h-4 text-amber-400" /> CONFIDENTIAL PRE-VERIFY LOCK
                                  </p>
                                  <div className="relative w-44 h-32 mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-slate-900">
                                    <img
                                      src={photoId}
                                      alt="Secure Photo ID Scan"
                                      className="w-full h-full object-cover blur-[2px] scale-105"
                                    />
                                    <div className="absolute inset-0 bg-[#0f1015]/40 backdrop-blur-[0.5px] flex items-center justify-center">
                                      <span className="text-[10px] bg-black/85 text-amber-400 font-mono tracking-widest font-extrabold px-2.5 py-1.5 rounded-lg border border-amber-400/30 uppercase">
                                        SECURED
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => runIdVerification(photoId)}
                                    className="px-4 py-1.5 bg-[#39ff14] text-black font-semibold text-xs rounded-xl hover:bg-[#51ff33] transition-all cursor-pointer"
                                  >
                                    Verify Captured ID
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ID Scan Fallback Bypass Accord / Card */}
                        <div className="bg-[#1e172e]/50 backdrop-blur-md rounded-2xl p-4 border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all duration-300">
                          <label className="flex items-start gap-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={willBringIdInPerson}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setWillBringIdInPerson(checked);
                                if (checked) {
                                  // Auto bypass: satisfy age requirement through promised physical check
                                  setIsOver18(true);
                                  // Clear other file errors
                                  setCameraError(null);
                                  setIdVerificationError(null);
                                }
                              }}
                              className="w-5 h-5 shrink-0 accent-[#D4AF37] rounded mt-0.5"
                            />
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block font-mono">
                                Bypass: I will bring my physical ID to my appointment
                              </span>
                              <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                                If you are experiencing camera/scanner issues or prefer not to upload online, check this box. You pledge to present your physical government photo ID (confirming age 18+) to Drew when you check in.
                              </p>
                            </div>
                          </label>
                        </div>

                      </div>
                    )}

                  </div>
                )}

                {/* STEP 2: HEALTH INTAKE & NDA CONFIDENTIAL SIGN-OFF */}
                {bookingStep === 2 && (
                  <div className="space-y-5">
                    
                    {/* Age and NDA general block */}
                    <div className="p-4 glass rounded-2xl space-y-3 border-white/20">
                      <div className="flex items-start gap-2.5">
                        <input
                          id="chk-age-gate"
                          type="checkbox"
                          checked={isOver18}
                          onChange={(e) => setIsOver18(e.target.checked)}
                          className="w-5 h-5 shrink-0 accent-[#39ff14] rounded"
                        />
                        <label htmlFor="chk-age-gate" className="text-xs text-gray-100 leading-relaxed font-sans font-medium">
                          <strong>Age Gate Declaration</strong>: I confirm that I am <strong>18 years of age or older</strong>. I acknowledge this is required since Drew provides specialized, full intimate waxing / manscaping services.
                        </label>
                      </div>
                    </div>

                    {/* Skincare safety guidelines */}
                    <div className="p-4 bg-red-950/15 border border-red-500/20 backdrop-blur-sm rounded-2xl space-y-3">
                      <h4 className="text-xs font-mono text-red-300 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                        ⚠️ Skin-Safety Contraindications Checklist
                      </h4>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        Waxing while on certain systemic chemical products compromises skin integrity, causing skin lifting or tearing. 
                      </p>
                      <div className="flex items-start gap-2.5 pt-1">
                        <input
                          id="chk-skincare-gate"
                          type="checkbox"
                          checked={noSkincareContraids}
                          onChange={(e) => setNoSkincareContraids(e.target.checked)}
                          className="w-5 h-5 shrink-0 accent-[#39ff14] rounded"
                        />
                        <label htmlFor="chk-skincare-gate" className="text-xs text-gray-200 leading-relaxed">
                          I certify that I am <strong>NOT</strong> utilizing <strong>Accutane (within 6 months)</strong>, <strong>Retin-A / Retinols (on face in last 7 days)</strong>, or had deep chemical peels recently. My skin is healthy and fully ready to register wax.
                        </label>
                      </div>
                    </div>

                    {/* NDA agreement form */}
                    <div className="glass p-4 rounded-2xl space-y-3 border-white/20">
                      <h4 className="text-xs font-mono text-[#39ff14] uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4" /> Non-Disclosure Agreement (NDA)
                      </h4>
                      <p className="text-[11px] text-gray-200 leading-relaxed h-[80px] overflow-y-auto p-2 bg-white/5 border border-white/10 rounded-lg custom-scrollbar">
                        This Non-Disclosure Agreement guarantees absolute discretion. By proposing a booking, client and Drew (owner of Smooth Operator SF) agree that all private matters, discussions, physical elements, visual properties, identity markings, and contextual topics shared inside the private studio stay fully confidential and shall not be published, documented, or distributed.
                      </p>

                      <div className="flex items-center gap-2.5">
                        <input
                          id="chk-nda-gate"
                          type="checkbox"
                          checked={ndaAgreed}
                          onChange={(e) => setNdaAgreed(e.target.checked)}
                          className="w-5 h-5 shrink-0 accent-[#39ff14] rounded"
                        />
                        <label htmlFor="chk-nda-gate" className="text-xs text-gray-100 font-semibold leading-none">
                          I agree entirely to the NDA Confidentiality conditions
                        </label>
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] font-mono text-gray-300 uppercase tracking-widest block mb-1">
                          Digitally Sign (Type your full name in cursive)
                        </label>
                        <input
                          id="nda-signature-input"
                          type="text"
                          required
                          value={ndaSignatureText}
                          onChange={(e) => setNdaSignatureText(e.target.value)}
                          placeholder="Type Name to Consent"
                          className="w-full bg-white/5 border border-white/10 text-[#39ff14] placeholder-gray-500 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#39ff14] tracking-wider italic font-serif"
                        />
                      </div>
                    </div>

                    {/* APPOINTMENT REMINDERS & MARKETING NOTIFICATION TERMS & CONDITIONS */}
                    <div className="glass p-4 rounded-2xl space-y-3 border-white/20">
                      <h4 className="text-xs font-mono text-[#39ff14] uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-[#39ff14]" /> Reminders & Marketing Policy
                      </h4>
                      <p className="text-[11px] text-gray-200 leading-relaxed">
                        To protect your schedule and ensure hair is treated at the optimal active growth phase (the 4-week window), Smooth Operator SF distributes automated appointment confirmations, text reminders, 4-week re-booking alerts, and occasional wellness/studio updates.
                      </p>

                      <div className="flex items-start gap-2.5 pt-1">
                        <input
                          id="chk-marketing-consent"
                          type="checkbox"
                          checked={marketingConsent}
                          onChange={(e) => setMarketingConsent(e.target.checked)}
                          className="w-5 h-5 shrink-0 accent-[#39ff14] rounded mt-0.5"
                        />
                        <label htmlFor="chk-marketing-consent" className="text-xs text-gray-100 font-medium leading-relaxed cursor-pointer select-none">
                          I consent to receive automated booking reminders, cycle updates, and marketing communications via SMS and Email. I understand I can opt-out at any time.
                        </label>
                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 3: STRIPE CARD HOLD PREAUTH */}
                {bookingStep === 3 && (
                  <div className="space-y-4">
                    
                    <div className="glass p-4 rounded-2xl flex gap-3 text-xs leading-relaxed text-gray-100 border-white/20">
                      <CreditCard className="w-5 h-5 text-[#39ff14] shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <strong>No Immediate Charges Rendered</strong>: We do not bill you upon slot proposal. Checkout price of <strong>${totalPrice.toFixed(2)}</strong> is cleared only *after* services are finished in the studio. 
                        <span className="block mt-1 text-gray-200/80 font-medium font-sans">
                          However, we must securely preauthorize card details to prevent unannounced "no-shows", or last minute calendar cancellations. Canceling with less than 24 hours notice or failing to attend may result in a cancellation holding fee of 50%.
                        </span>
                      </div>
                    </div>

                    {stripePaymentMode === 'external' ? (
                      /* External Stripe payment link processing box */
                      <div className="glass p-5 rounded-2xl space-y-4 border-white/15 text-center">
                        <div className="flex justify-between items-center text-xs text-gray-300">
                          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
                            🔌 OFFICIAL STRIPE SECURED GATEWAY
                          </span>
                           <span className="text-[#D4AF37] text-[10px] font-mono font-bold">● PCI-COMPLIANT</span>
                        </div>

                        <div className="py-2 space-y-3">
                          <p className="text-xs text-gray-200 leading-relaxed max-w-sm mx-auto">
                            To guarantee your private scheduling request, please execute a secure pre-auth card holding setup directly on Stripe's secure external network.
                          </p>

                          <button
                            type="button"
                            onClick={() => {
                              window.open(stripeHoldUrl, '_blank', 'noopener,noreferrer');
                              setHasConfirmedStripeHold(true);
                            }}
                            className="w-full py-3 bg-[#D4AF37] hover:bg-[#ffe17d] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4 shrink-0" /> Open Secure Stripe Holding Link
                          </button>

                          <div className="flex items-start gap-2.5 pt-3 text-left bg-black/30 p-3 rounded-xl border border-white/5">
                            <input
                              id="chk-confirm-stripe-external"
                              type="checkbox"
                              checked={hasConfirmedStripeHold}
                              onChange={(e) => setHasConfirmedStripeHold(e.target.checked)}
                              className="w-5 h-5 shrink-0 accent-[#39ff14] rounded mt-0.5"
                            />
                            <label htmlFor="chk-confirm-stripe-external" className="text-[11px] text-gray-200 leading-normal cursor-pointer select-none">
                              I confirm my credit card pre-authorization hold details are successfully registered on Drew's secure Stripe page.
                            </label>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Faux Stripe styling container converted to lovely glass layout */
                      <div className="glass p-5 rounded-2xl space-y-4 shadow-inner border-white/25">
                        <div className="flex justify-between items-center text-xs text-gray-300">
                          <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-[10px]">
                            🔌 SECURE STRIPE ELEMENTS API CONNECTOR
                          </span>
                          <span className="text-lime-400 text-[10px] font-mono font-bold">● AES-256 ENCRYPTED</span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Cardholder Name</label>
                            <input
                              id="cardholder-name-input"
                              type="text"
                              required
                              value={stripeCardholder}
                              onChange={(e) => setStripeCardholder(e.target.value)}
                              placeholder={clientName || "Cardholder full name"}
                              className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Card Number</label>
                            <input
                              id="card-number-input"
                              type="text"
                              required
                              maxLength={19}
                              value={stripeCardNum}
                              onChange={(e) => setStripeCardNum(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                              placeholder="4242 4242 4242 4242"
                              className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 px-3 text-xs font-semibold font-mono tracking-wider focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                               <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Expiration</label>
                              <input
                                id="card-expiry-input"
                                type="text"
                                required
                                maxLength={5}
                                value={stripeCardExpiry}
                                onChange={(e) => setStripeCardExpiry(e.target.value)}
                                placeholder="MM/YY"
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 px-3 text-xs font-semibold font-mono tracking-wider focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">CVC Code</label>
                              <input
                                id="card-cvc-input"
                                type="password"
                                required
                                maxLength={4}
                                value={stripeCardCvc}
                                onChange={(e) => setStripeCardCvc(e.target.value)}
                                placeholder="***"
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-2 px-3 text-xs font-semibold font-mono tracking-wider focus:outline-none focus:border-[#39ff14] focus:bg-white/10 transition-all text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* STEP 4: SUCCESS REVOLUTIONS */}
                {bookingStep === 4 && bookingConfirmation && (
                  <div className="space-y-6 text-center py-6 col-span-full">
                    <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-8 h-8 text-green-300" />
                    </div>

                    <div className="space-y-2 col-span-full">
                      <h4 className="font-sans font-black text-2xl text-white tracking-wide">CONFIRMATION PROPOSED!</h4>
                      <p className="text-xs text-gray-200 leading-relaxed max-w-sm mx-auto">
                        Hi <strong className="text-[#39ff14] font-bold">{bookingConfirmation.clientName || clientName || 'there'}</strong>, your appointment was submitted directly into Smooth Operator SF's database! Once Drew reviews and click accepts, it will sync into his Google Calendar.
                      </p>
                    </div>

                    <div className="p-4 glass rounded-2xl text-xs font-mono text-left space-y-2.5 max-w-sm mx-auto border-white/20 shadow-md">
                      <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-gray-300">Day booked:</span>
                        <span className="text-white font-semibold">{bookingConfirmation.date}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-gray-300">Proposed Slot:</span>
                        <span className="text-white font-semibold">{bookingConfirmation.time}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-1">
                        <span className="text-gray-300">Studio Turnaround:</span>
                        <span className="text-white font-semibold">{bookingConfirmation.totalDuration} Min block</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold border-t border-white/15 pt-2 text-sm">
                        <span>Checkout Cost:</span>
                        <span>${bookingConfirmation.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Post wax instructions container styled as premium glass accent */}
                    <PostCareInstructions layout="success" />

                    <button
                      id="close-success-flow"
                      onClick={() => setBookingStep(0)}
                      className="px-8 py-3.5 bg-gradient-to-r from-[#39ff14] to-emerald-500 hover:from-[#51ff33] hover:to-emerald-400 text-black font-sans font-bold uppercase rounded-xl tracking-wider text-xs transition hover:scale-[1.02] shadow cursor-pointer mx-auto shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                    >
                      Return to Studio Homescreen
                    </button>
                  </div>
                )}

              </div>

              {/* Overlay Modal Footer: Back / Next controls with glass detail */}
              {bookingStep < 4 && (
                <div className="p-5 border-t border-white/10 bg-white/5 flex justify-between">
                  <button
                    id="booking-back-btn"
                    onClick={handleBackStep}
                    className={`flex items-center gap-1.5 py-2 px-4 border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 text-xs font-semibold rounded-xl transition ${
                      (bookingStep === 1 && scheduleSubStep === 1) ? 'opacity-0 pointer-events-none' : 'cursor-pointer'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>

                  {bookingStep === 1 && (
                    scheduleSubStep === 3 ? (
                      <button
                        id="booking-next-step-1-photo"
                        disabled={!(isIdVerified || willBringIdInPerson) || isVerifyingId}
                        onClick={() => {
                          if (!isIdVerified && !willBringIdInPerson) {
                            alert("Complete secure AI Photo ID verification first to confirm legal age compliance, or check the Bypass box to bring your physical ID.");
                            return;
                          }
                          setScheduleSubStep(4);
                        }}
                        className={`flex items-center gap-1.5 py-2 px-5 font-bold text-xs rounded-xl transition duration-200 leading-none ${
                          (isIdVerified || willBringIdInPerson) 
                            ? 'bg-[#39ff14] text-black hover:bg-[#51ff33] shadow-[0_0_12px_rgba(57,255,20,0.45)] cursor-pointer hover:scale-[1.02]' 
                            : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        Proceed to Contact Profile <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : scheduleSubStep === 4 ? (
                      <button
                        id="booking-next-step-1"
                        onClick={() => {
                          if (!selectedDate || !selectedTime || !clientName || !clientEmail || !clientPhone) {
                            alert("Please fill in all details inside your client contact profile.");
                            return;
                          }
                          setBookingStep(2);
                        }}
                        className="flex items-center gap-1.5 py-2 px-5 bg-[#39ff14] text-black hover:bg-[#51ff33] font-bold text-xs rounded-xl transition leading-none cursor-pointer hover:shadow-md shadow-[0_0_12px_rgba(57,255,20,0.35)] animate-pulse"
                      >
                        Proceed to Intake Agreements <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-4" />
                    )
                  )}

                  {bookingStep === 2 && (
                    <button
                      id="booking-next-step-2"
                      onClick={() => {
                        if (!isOver18) {
                          alert("Confirmation that you are 18 years or older is mandatory.");
                          return;
                        }
                        if (selectedServices.some(s => s.category === 'Face Waxing') && !noSkincareContraids) {
                          alert("Confirming skincare safety checklist is mandatory for facial waxing.");
                          return;
                        }
                        if (!ndaAgreed || !ndaSignatureText) {
                          alert("Reading and signing the NDA agreement is mandatory.");
                          return;
                        }
                        if (!marketingConsent) {
                          alert("Acknowledging and consenting to the Reminders & Marketing Policy is required to propose a booking.");
                          return;
                        }
                        setShowTermsPdfGate(true);
                      }}
                      className="flex items-center gap-1.5 py-2 px-5 bg-[#39ff14] text-black hover:bg-[#51ff33] font-bold text-xs rounded-xl transition leading-none cursor-pointer hover:shadow-md shadow-[0_0_12px_rgba(57,255,20,0.3)] animate-pulse"
                    >
                      Complete Booking Request <Check className="w-4 h-4" />
                    </button>
                  )}

                  {bookingStep === 3 && (
                    <button
                      id="booking-submit-btn"
                      onClick={() => setShowTermsPdfGate(true)}
                      disabled={isSubmitting || (stripePaymentMode === 'external' ? !hasConfirmedStripeHold : (!stripeCardholder || !stripeCardNum || !stripeCardExpiry || !stripeCardCvc))}
                      className="flex items-center gap-1.5 py-2 px-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-xs rounded-xl shadow-lg transition leading-none cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Complete Booking Slot Proposals <Check className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Terms-and-Conditions Liability Waiver PDF Gate Modal */}
      <AnimatePresence>
        {showTermsPdfGate && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col border border-white/20 p-6 relative"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowTermsPdfGate(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-center mt-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                  <FileCheck className="w-6 h-6 shrink-0" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-sans font-black text-lg tracking-wide text-white uppercase">
                    Liability Waiver PDF Gate
                  </h3>
                  <p className="text-[11px] font-mono text-amber-500 uppercase tracking-widest font-semibold">
                    Electronic Document Consent Required
                  </p>
                </div>

                <div className="text-left bg-black/40 border border-white/5 p-4 rounded-xl text-xs text-gray-300 space-y-2.5 leading-relaxed">
                  <p>
                    Hi <strong className="text-[#39ff14]">{clientName || "there"}</strong>, prior to your appointment, you must sign a secure <strong className="text-white">Terms-and-Conditions & Safety Waiver PDF</strong>.
                  </p>
                  <p>
                     This legal waiver covers intimate grooming protocols, safety notifications regarding Retinol/Accutane, and our 24-hour studio cancelation agreement.
                  </p>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#39ff14] animate-pulse shrink-0" />
                    <span>Consent copy will be emailed directly to: <strong className="text-white/95 font-semibold">{clientEmail || "your email"}</strong>.</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setShowTermsPdfGate(false)}
                    className="w-1/2 py-2.5 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition cursor-pointer"
                  >
                    Go Back
                  </button>
                  <button
                    id="confirm-pdf-terms-signature"
                    onClick={(e) => {
                      setShowTermsPdfGate(false);
                      handleFinalSubmit(e);
                    }}
                    className="w-1/2 py-2.5 bg-[#39ff14] text-black font-bold rounded-xl text-xs hover:bg-[#51ff33] shadow-md shadow-[0_0_12px_rgba(57,255,20,0.3)] transition cursor-pointer text-center font-sans"
                  >
                    I Agree & Sign
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Client Dashboard Portal Overlay */}
      <AnimatePresence>
        {showClientPortal && (
          <ClientDashboard onClose={() => setShowClientPortal(false)} />
        )}
      </AnimatePresence>

      {/* Help Guide Modal Overlay */}
      <AnimatePresence>
        {showHelpGuide && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-dark rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-white/20"
            >
              <div className="p-5 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#39ff14]" />
                  <span className="font-sans font-bold text-white text-sm tracking-wide uppercase">
                    How it Works: Booking Experience Guide
                  </span>
                </div>
                <button
                  id="close-help-guide-modal"
                  onClick={() => setShowHelpGuide(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto grow custom-scrollbar space-y-6 text-sm leading-relaxed text-gray-200">
                <p className="text-xs text-[#39ff14] font-mono uppercase tracking-wider text-center bg-[#39ff14]/5 py-2 px-3 rounded-xl border border-[#39ff14]/10">
                  ⚡ Premium inclusive grooming & intimate waxing in a safe setting
                </p>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <h4 className="text-xs font-mono text-[#39ff14] uppercase tracking-wider font-bold">
                      1. Pick Treatments graphically on Map
                    </h4>
                    <p className="text-xs text-gray-300">
                      Hover over region segments (Face, Arms, Bikini, Torso, Legs) on the **Interactive Human Silhouette Map** and instantly load premium waxing or manscaping services to your cart.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <h4 className="text-xs font-mono text-[#39ff14] uppercase tracking-wider font-bold">
                      2. Appointment Slot Blocks
                    </h4>
                    <p className="text-xs text-gray-300">
                      Select a date on our customized month grid calendar. The scheduler aggregates your cart runtime and coordinates blocks to optimize Drew&apos;s physical room scheduling. The engine validates this full block against Google Calendar before showing an open interval.
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <h4 className="text-xs font-mono text-[#39ff14] uppercase tracking-wider font-bold">
                      3. Safe & Mandatory Consent Gates
                    </h4>
                    <p className="text-xs text-gray-300">
                      Before checkout, we prompt three essential items:
                    </p>
                    <ul className="list-disc pl-5 text-xs text-gray-300 space-y-1">
                      <li><strong>Age Gate:</strong> Conforming client is 18 years or older.</li>
                      <li><strong>Skincare Safeguard:</strong> Guaranteeing no Accutane or Retin-A retinol products on face waxing sectors.</li>
                      <li><strong>Digital NDA:</strong> Signing a typed non-disclosure waiver to secure 100% private discussion inside the studio.</li>
                    </ul>
                  </div>

                  {/* Step 4 */}
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                    <h4 className="text-xs font-mono text-[#39ff14] uppercase tracking-wider font-bold">
                      4. Cards on file (Stripe Pre-Auth Holds)
                    </h4>
                    <p className="text-xs text-gray-300">
                      Card fields are loaded securely through tokenized elements. **We charge $0.00 today.** SetupHolds are established to protect Drew&apos;s studio slots against late cancelations (within 24 hours). Billing coordinates are completed only after your physical appointment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-white/10 bg-white/5 flex justify-end">
                <button
                  id="dismiss-help-guide"
                  onClick={() => setShowHelpGuide(false)}
                  className="py-2 px-6 bg-[#39ff14] text-black hover:bg-[#51ff33] font-bold text-xs uppercase tracking-wide rounded-xl transition cursor-pointer"
                >
                  Got It, Thanks!
                </button>
              </div>
            </motion.div>
          </div>
        )}


      </AnimatePresence>

      {/* Floating Google Workspace Link hub setting trigger for Drew */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          id="workspace-hub-trigger"
          title="Google Workspace Sync Hub"
          onClick={() => setShowWorkspaceHub(!showWorkspaceHub)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#07080b]/90 hover:bg-black text-[#D4AF37] border border-[#D4AF37]/35 shadow-lg shadow-[#D4AF37]/10 transition-all duration-300 hover:scale-110 cursor-pointer"
        >
          <Lock className="w-5 h-5 text-[#D4AF37]" />
        </button>
      </div>

      <AnimatePresence>
        {showWorkspaceHub && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl relative overflow-hidden text-gray-100"
            >
              {/* Gold light burst accent */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#D4AF37]" />
                  <span className="font-sans font-light tracking-wide text-lg text-white">
                    Workspace <span className="font-bold text-[#D4AF37]">Sync Hub</span>
                  </span>
                </div>
                <button
                  onClick={() => setShowWorkspaceHub(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 relative z-10">
                <p className="text-xs text-gray-300 leading-relaxed font-light">
                  Ensure bookings are written instantly into Drew's private Google Calendar and Spreadsheet Ledgers. Capture details securely with multi-step intake waiver protections (PCI compliant).
                </p>

                {/* Status card */}
                {hubStatus?.active ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#39ff14] uppercase">
                      <span className="w-2.5 h-2.5 bg-[#39ff14] rounded-full animate-pulse" />
                      Google Workspace Sync Active
                    </div>
                    <div className="space-y-1 text-[11px] font-mono text-gray-400">
                      <div className="truncate">
                        <span className="text-[#D4AF37]">Ledger:</span> {hubStatus.spreadsheetId || 'Loading...'}
                      </div>
                      <div className="truncate">
                        <span className="text-[#D4AF37]">Docs/Drive:</span> {hubStatus.ndaFolderId || 'Loading...'}
                      </div>
                      <div className="truncate">
                        <span className="text-[#D4AF37]">Tasks List:</span> {hubStatus.taskListId || 'Loading...'}
                      </div>
                      <div className="truncate flex items-center gap-1.5">
                        <span className="text-[#D4AF37]">Menu Sync:</span> 
                        {servicesSource === 'google_sheets' ? (
                          <span className="text-[#39ff14] bg-[#39ff14]/15 px-1.5 py-0.5 rounded border border-[#39ff14]/30 text-[9px] uppercase tracking-wider font-bold">Google Sheet Connected</span>
                        ) : (
                          <span className="text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded border border-amber-400/30 text-[9px] uppercase tracking-wider font-bold">Local Fallback</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleUnlinkWorkspace}
                      disabled={isLinkingWorkspace}
                      className="w-full py-2 bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                    >
                      {isLinkingWorkspace ? 'Processing...' : 'Disconnect Sync Link'}
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase">
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                      Workspace Link Server Offline
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Sync connection offline. Bookings are safely preserved locally inside Firestore, but won't feed directly to Google sheets/calendar. Click authorize below to link Drew's account to start live syncing.
                    </p>
                    <button
                      onClick={handleLinkWorkspace}
                      disabled={isLinkingWorkspace}
                      className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#ffe17d] text-black font-extrabold rounded-xl text-xs uppercase tracking-widest transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLinkingWorkspace ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Link is Deploying...
                        </>
                      ) : (
                        'Authorize Google Workspace'
                      )}
                    </button>
                  </div>
                )}

                {/* Stripe Card-Hold Setup Card */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#D4AF37] uppercase">
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                    Stripe Pre-Auth Gateway
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                      Card-Hold Processing Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => setStripePaymentMode('external')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] uppercase tracking-wider font-extrabold font-sans transition-all cursor-pointer ${
                          stripePaymentMode === 'external'
                            ? 'bg-[#D4AF37] text-black shadow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        External Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setStripePaymentMode('sandbox')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] uppercase tracking-wider font-extrabold font-sans transition-all cursor-pointer ${
                          stripePaymentMode === 'sandbox'
                            ? 'bg-[#D4AF37] text-black shadow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        In-App Vault
                      </button>
                    </div>
                  </div>

                  {stripePaymentMode === 'external' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block">
                        Stripe External Hold Link
                      </label>
                      <input
                        type="url"
                        value={stripeHoldUrl}
                        onChange={(e) => setStripeHoldUrl(e.target.value)}
                        placeholder="https://book.stripe.com/..."
                        className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-[#D4AF37] transition-all font-mono"
                      />
                      <p className="text-[9px] text-gray-400 leading-normal">
                        Provide your secure Stripe Payment Link or Checkout URL. Clients will be prompted to pre-authorize their cards at this external secure link during checkout.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveStripeConfig}
                    disabled={isSavingStripeConfig}
                    className="w-full py-2 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-black font-extrabold rounded-xl text-xs uppercase tracking-widest transition cursor-pointer disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-1.5"
                  >
                    {isSavingStripeConfig ? (
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save Stripe Settings
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-xl p-3 bg-white/5 border border-white/5 text-[10px] text-gray-400 leading-relaxed font-light">
                  <strong className="text-white">Note:</strong> Authorization issues an ephemeral login token stored safely on Drew's server, enabling secure background synchronization on all upcoming client checkout flows. Code uses the modern Google REST APIs.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
