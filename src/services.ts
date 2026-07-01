import { Service, Hotspot } from './types';

export const SERVICES: Service[] = [
  // Intimate Waxing
  {
    id: 'intimate-brazilian-penis',
    category: 'Intimate Waxing',
    name: 'Brazilian (Penis)',
    description: 'A signature "smooth" service covering from the base of the shaft to the scrotum, perineum, and anal area. Includes a complimentary manscaping session to sculpt any hair left by preference.',
    duration: 25,
    price: 90.00,
    bodyPartId: 'intimate'
  },
  {
    id: 'intimate-brazilian-vagina',
    category: 'Intimate Waxing',
    name: 'Brazilian (Vagina)',
    description: 'Removes hair from the entire pubic area, including the labia and perineum. Designed for a bare, confident feel and includes complimentary manscaping.',
    duration: 20,
    price: 90.00,
    bodyPartId: 'intimate'
  },
  {
    id: 'intimate-bikini-full-penis',
    category: 'Intimate Waxing',
    name: 'Bikini - Full (Penis)',
    description: 'A groomed look that removes hair from the penis, scrotum, and bikini line while leaving the perineum and anal area untouched.',
    duration: 20,
    price: 75.00,
    bodyPartId: 'intimate'
  },
  {
    id: 'intimate-bikini-full-vagina',
    category: 'Intimate Waxing',
    name: 'Bikini - Full (Vagina)',
    description: 'Removes hair from the labia and bikini line but excludes the perineum and "back door" area.',
    duration: 15,
    price: 75.00,
    bodyPartId: 'intimate'
  },
  {
    id: 'intimate-bikini-line',
    category: 'Intimate Waxing',
    name: 'Bikini - Line',
    description: 'A tidy-up service for hair extending beyond the underwear or swimsuit line.',
    duration: 5,
    price: 52.00,
    bodyPartId: 'intimate'
  },
  {
    id: 'intimate-butt-full',
    category: 'Intimate Waxing',
    name: 'Butt - Full',
    description: 'Comprehensive removal of hair from the cheeks and the "butt strip."',
    duration: 10,
    price: 47.00,
    bodyPartId: 'butt'
  },
  {
    id: 'intimate-butt-strip',
    category: 'Intimate Waxing',
    name: 'Butt Strip',
    description: 'A focused service for the perineum and anal area to ensure a clean, "unwanted-fuzz-free" result.',
    duration: 5,
    price: 27.00,
    bodyPartId: 'butt'
  },

  // Body Waxing
  {
    id: 'body-legs-full',
    category: 'Body Waxing',
    name: 'Full Legs',
    description: 'Complete hair removal from the top of the thighs to the ankles.',
    duration: 50,
    price: 120.00,
    bodyPartId: 'legs'
  },
  {
    id: 'body-legs-lower',
    category: 'Body Waxing',
    name: 'Lower Legs',
    description: 'Removal of hair from the knees down to the ankles.',
    duration: 15,
    price: 75.00,
    bodyPartId: 'legs'
  },
  {
    id: 'body-legs-upper',
    category: 'Body Waxing',
    name: 'Upper Legs',
    description: 'Removal of hair from the top of the thighs down to the knees.',
    duration: 15,
    price: 70.00,
    bodyPartId: 'legs'
  },
  {
    id: 'body-arms-full',
    category: 'Body Waxing',
    name: 'Full Arms',
    description: 'Complete hair removal from the shoulders down to the wrists.',
    duration: 25,
    price: 80.00,
    bodyPartId: 'arms'
  },
  {
    id: 'body-arms-half',
    category: 'Body Waxing',
    name: 'Half Arm',
    description: 'Removal of hair from either the elbow to the wrist or the shoulder to the elbow.',
    duration: 10,
    price: 40.00,
    bodyPartId: 'arms'
  },
  {
    id: 'body-underarm',
    category: 'Body Waxing',
    name: 'Under Arm Waxing',
    description: 'Clears hair from the underarm area to enhance hygiene and confidence.',
    duration: 5,
    price: 28.00,
    bodyPartId: 'arms'
  },
  {
    id: 'body-back-full',
    category: 'Body Waxing',
    name: 'Full Back',
    description: 'Complete hair removal from the base of the neck down to the waistline.',
    duration: 15,
    price: 90.00,
    bodyPartId: 'back'
  },
  {
    id: 'body-shoulder',
    category: 'Body Waxing',
    name: 'Shoulder Waxing',
    description: 'Removes hair from the tops of the shoulders and slightly down the upper arms for a polished physique.',
    duration: 10,
    price: 30.00,
    bodyPartId: 'shoulders'
  },
  {
    id: 'body-stomach-full',
    category: 'Body Waxing',
    name: 'Stomach - Full',
    description: 'Clears hair from the chest line down to the "happy trail" for a sculpted appearance.',
    duration: 7,
    price: 38.00,
    bodyPartId: 'stomach'
  },
  {
    id: 'body-chest-full',
    category: 'Body Waxing',
    name: 'Chest - Full',
    description: 'Complete hair removal from the chest area.',
    duration: 7,
    price: 40.00,
    bodyPartId: 'chest'
  },
  {
    id: 'body-chest-strip',
    category: 'Body Waxing',
    name: 'Chest Strip or Nipples',
    description: 'A subtle detail service focusing on specific hair patterns or the area around the nipples.',
    duration: 5,
    price: 25.00,
    bodyPartId: 'chest'
  },
  {
    id: 'body-inner-thigh',
    category: 'Body Waxing',
    name: 'Inner Thigh',
    description: 'Targets unwanted hair in the upper/inner leg area for a sleek, comfortable feel.',
    duration: 5,
    price: 35.00,
    bodyPartId: 'legs'
  },

  // Face Waxing
  {
    id: 'face-full',
    category: 'Face Waxing',
    name: 'Full Face',
    description: 'Comprehensive removal of unwanted facial hair.',
    duration: 45,
    price: 69.00,
    bodyPartId: 'face'
  },
  {
    id: 'face-eyebrows',
    category: 'Face Waxing',
    name: 'Eyebrows',
    description: 'Shapes and defines brows, ranging from a clean arch to a natural, rugged look.',
    duration: 15,
    price: 27.00,
    bodyPartId: 'face'
  },
  {
    id: 'face-nose',
    category: 'Face Waxing',
    name: 'Nose',
    description: 'Gently removes unwanted fuzz from the nostrils and bridge for a presentable appearance.',
    duration: 7,
    price: 15.00,
    bodyPartId: 'face'
  },
  {
    id: 'face-ears',
    category: 'Face Waxing',
    name: 'Ears',
    description: 'Tames wild sprouts from the outer ear area.',
    duration: 5,
    price: 15.00,
    bodyPartId: 'face'
  },
  {
    id: 'face-chin',
    category: 'Face Waxing',
    name: 'Chin',
    description: 'Removal of unwanted hair from the chin area.',
    duration: 10,
    price: 20.00,
    bodyPartId: 'face'
  },
  {
    id: 'face-neck-front',
    category: 'Face Waxing',
    name: 'Front of Neck',
    description: 'Removal of unwanted hair from the front of the neck area.',
    duration: 10,
    price: 19.00,
    bodyPartId: 'face'
  },

  // Manscaping
  {
    id: 'manscaping-legs',
    category: 'Manscaping',
    name: 'Legs',
    description: 'Meticulous trimming to a manageable length (minimum 1/8 inch) for a neat appearance.',
    duration: 10,
    price: 40.00,
    bodyPartId: 'legs'
  },
  {
    id: 'manscaping-bikini-full',
    category: 'Manscaping',
    name: 'Bikini - Full',
    description: 'Trimming groin, bikini line, and optionally shaft/scrotum for a groomed look.',
    duration: 5,
    price: 40.00,
    bodyPartId: 'intimate'
  },
  {
    id: 'manscaping-back',
    category: 'Manscaping',
    name: 'Back',
    description: 'Maintains a groomed look by shaping and shortening back hair to your desired style.',
    duration: 5,
    price: 25.00,
    bodyPartId: 'back'
  },
  {
    id: 'manscaping-arms-butt',
    category: 'Manscaping',
    name: 'Arms / Butt',
    description: 'Expert shaping and trimming for a tidy, refined look.',
    duration: 5,
    price: 20.00,
    bodyPartId: 'arms'
  },
  {
    id: 'manscaping-stomach',
    category: 'Manscaping',
    name: 'Stomach',
    description: 'Expertly defines abdominal muscles by trimming hair to showcase the core.',
    duration: 5,
    price: 15.00,
    bodyPartId: 'stomach'
  },
  {
    id: 'manscaping-chest',
    category: 'Manscaping',
    name: 'Chest',
    description: 'Refines chest hair to a uniform, well-maintained length.',
    duration: 5,
    price: 12.00,
    bodyPartId: 'chest'
  },
  {
    id: 'manscaping-underarms',
    category: 'Manscaping',
    name: 'Under Arms',
    description: 'Provides the comfort of well-maintained underarms through precise trimming.',
    duration: 5,
    price: 9.00,
    bodyPartId: 'arms'
  }
];

export const CATEGORIES: { name: string; description: string; services: Service[] }[] = [
  {
    name: 'Intimate Waxing',
    description: 'Inclusive, high-precision wax treatments covering pubic, gluteal, and intimate zones with zero judgment.',
    services: SERVICES.filter(s => s.category === 'Intimate Waxing')
  },
  {
    name: 'Body Waxing',
    description: 'Complete smooth coverage for torso, back, arms, legs, and underarms, tailored to your body.',
    services: SERVICES.filter(s => s.category === 'Body Waxing')
  },
  {
    name: 'Face Waxing',
    description: 'Expert defining and delicate hair clearing to sculpt and brighten your facial contours.',
    services: SERVICES.filter(s => s.category === 'Face Waxing')
  },
  {
    name: 'Manscaping',
    description: 'Meticulous trimming to specific uniform lengths to map and showcase muscle definition.',
    services: SERVICES.filter(s => s.category === 'Manscaping')
  }
];

export const FRONT_HOTSPOTS: Hotspot[] = [
  { id: 'face', name: 'Face Waxing', gender: 'unisex', cx: 50, cy: 11, r: 5, services: ['face-full', 'face-eyebrows', 'face-nose', 'face-ears', 'face-chin', 'face-neck-front'] },
  { id: 'shoulders', name: 'Shoulders', gender: 'unisex', cx: 33, cy: 19, r: 5, services: ['body-shoulder'] },
  { id: 'chest', name: 'Chest Waxing & Trimming', gender: 'unisex', cx: 50, cy: 23, r: 6, services: ['body-chest-full', 'body-chest-strip', 'manscaping-chest'] },
  { id: 'stomach', name: 'Stomach Waxing & Trimming', gender: 'unisex', cx: 50, cy: 34, r: 6, services: ['body-stomach-full', 'manscaping-stomach'] },
  { id: 'arms', name: 'Arm Waxing & Underarms', gender: 'unisex', cx: 28, cy: 35, r: 6, services: ['body-arms-full', 'body-arms-half', 'body-underarm', 'manscaping-underarms'] },
  { id: 'intimate', name: 'Intimate / Bikini Zone', gender: 'unisex', cx: 50, cy: 45, r: 7, services: ['intimate-brazilian-penis', 'intimate-brazilian-vagina', 'intimate-bikini-full-penis', 'intimate-bikini-full-vagina', 'intimate-bikini-line', 'manscaping-bikini-full'] },
  { id: 'legs', name: 'Leg Waxing & Trimming', gender: 'unisex', cx: 42, cy: 65, r: 10, services: ['body-legs-full', 'body-legs-upper', 'body-legs-lower', 'body-inner-thigh', 'manscaping-legs'] }
];

export const BACK_HOTSPOTS: Hotspot[] = [
  { id: 'back', name: 'Full Back Care', gender: 'unisex', cx: 50, cy: 28, r: 9, services: ['body-back-full', 'manscaping-back'] },
  { id: 'butt', name: 'Glutes & Butt Strip', gender: 'unisex', cx: 50, cy: 47, r: 7, services: ['intimate-butt-full', 'intimate-butt-strip', 'manscaping-arms-butt'] }
];
