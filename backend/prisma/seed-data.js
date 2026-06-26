// Seed data — mirrors the reference HTML exactly.
// Categories: 15 with their product name lists.
// Vendors: 5 stalls with owner, location, rating, sales, year.

const CATEGORIES = [
  { slug: 'food',         icon: '🛒', name: 'Food & Grocery',             products: ['Biscuit','Noodles','Chips','Juice','Salt','Sugar','Tea','Coffee','Rice','Lentils'] },
  { slug: 'beauty',       icon: '💄', name: 'Beauty & Personal Care',     products: ['Face Wash','Soap','Shampoo','Toothpaste','Toothbrush','Lotion','Perfume','Hair Oil'] },
  { slug: 'fashion',      icon: '👕', name: 'Fashion & Clothing',         products: ['T-Shirt','Cap','Socks','Scarf','Belt','Wallet','Gloves','Sunglasses'] },
  { slug: 'home',         icon: '🏠', name: 'Home & Living',              products: ['Mug','Pillow Cover','Hanger','Storage Box','Clock','Curtain','Basket'] },
  { slug: 'kitchen',      icon: '🍳', name: 'Kitchen & Dining',           products: ['Spoon','Knife','Plate','Bowl','Glass','Lunch Box','Bottle','Peeler'] },
  { slug: 'books',        icon: '📚', name: 'Books & Stationery',         products: ['Notebook','Pen','Pencil','Eraser','Marker','File Folder','Sticky Notes'] },
  { slug: 'electronics',  icon: '💻', name: 'Electronics & Accessories',  products: ['Mouse Pad','USB Cable','Earphones','Charger','Adapter','Power Bank Cover'] },
  { slug: 'health',       icon: '❤️', name: 'Health & Wellness',          products: ['First Aid Box','Mask','Sanitizer','Vitamin Box','Hot Water Bag'] },
  { slug: 'baby',         icon: '🧸', name: 'Baby & Kids',                products: ['Baby Bottle','Baby Soap','Baby Powder','Toys','Bib','Feeding Spoon'] },
  { slug: 'garden',       icon: '🌱', name: 'Garden & Plants',            products: ['Flower Pot','Water Spray','Seeds','Gardening Gloves','Plant Food'] },
  { slug: 'sports',       icon: '🏋️', name: 'Sports & Fitness',           products: ['Skipping Rope','Water Bottle','Dumbbell','Yoga Mat','Wrist Band'] },
  { slug: 'pet',          icon: '🐶', name: 'Pet Supplies',               products: ['Pet Bowl','Dog Toy','Pet Shampoo','Leash','Pet Brush'] },
  { slug: 'auto',         icon: '🚗', name: 'Automobile Accessories',     products: ['Phone Holder','Car Perfume','Cleaning Cloth','Tire Pressure Gauge'] },
  { slug: 'mobile',       icon: '📱', name: 'Mobile Accessories',         products: ['Phone Case','Screen Protector','USB Cable','Earbuds','Mobile Stand'] },
  { slug: 'gifts',        icon: '🎁', name: 'Gifts & Decoration',         products: ['Photo Frame','Artificial Flowers','Candles','Key Ring','Gift Box'] },
];

const VENDORS = [
  { slug: 'dhaka-deals',     emoji: '🏪', name: 'Dhaka Deals',    ownerName: 'Karim Mia',     location: 'Dhaka',       rating: 4.8, totalSales: 1240, since: '2022' },
  { slug: 'bd-essentials',   emoji: '🛍️', name: 'BD Essentials',  ownerName: 'Sumaiya Akter', location: 'Chittagong',  rating: 4.7, totalSales: 987,  since: '2021' },
  { slug: 'sylhet-shoppe',   emoji: '🎪', name: 'Sylhet Shoppe',  ownerName: 'Jalal Uddin',   location: 'Sylhet',      rating: 4.9, totalSales: 2100, since: '2020' },
  { slug: 'rajshahi-mart',   emoji: '🏬', name: 'Rajshahi Mart',  ownerName: 'Nasrin Begum',  location: 'Rajshahi',    rating: 4.6, totalSales: 654,  since: '2023' },
  { slug: 'coxs-bazar-co',   emoji: '🌊', name: 'Cox Bazar Co.',  ownerName: 'Iqbal Ahmed',   location: "Cox's Bazar", rating: 4.5, totalSales: 432,  since: '2023' },
];

// Per-product descriptions keyed by product name (matches reference HTML).
// Anything not listed gets a generic fallback at runtime.
const PRODUCT_DESCRIPTIONS = {
  Biscuit:         'Crispy and delicious biscuits made from premium wheat flour. Perfect for snacking anytime.',
  Noodles:         'Instant noodles with rich flavour broth. Ready in 3 minutes.',
  'Face Wash':     'Gentle foaming face wash that removes dirt and oil without drying out skin.',
  Soap:            'Moisturising bath soap enriched with natural ingredients for soft, clean skin.',
  'T-Shirt':       'Comfortable 100% cotton t-shirt with a regular fit. Available in multiple colours.',
  Cap:             'Stylish adjustable snapback cap, one size fits most. Great for everyday wear.',
  Notebook:        'A5 ruled notebook with 200 pages of high-quality paper. Ideal for school or office.',
  'USB Cable':     'Fast-charging USB data cable compatible with most smartphones and tablets.',
  'Mouse Pad':     'Smooth anti-slip rubber mouse pad with stitched edges for durability.',
  Earphones:       'In-ear wired earphones with clear sound and built-in microphone.',
  'First Aid Box': 'Complete first aid kit with bandages, antiseptic, and basic medical supplies.',
  'Baby Bottle':   'BPA-free feeding bottle with anti-colic nipple design. 240ml capacity.',
  'Flower Pot':    'Durable plastic planting pot suitable for indoor or outdoor plants.',
  'Skipping Rope': 'Adjustable length skipping rope with comfortable foam handles.',
  'Pet Bowl':      'Stainless steel pet feeding bowl, easy to clean and rust-resistant.',
  'Phone Case':    'Slim protective phone case with shock-absorbing TPU material.',
  'Photo Frame':   'Elegant wooden photo frame, 4×6 inch. Stands or hangs on wall.',
};

function getDescription(name, categoryName) {
  return (
    PRODUCT_DESCRIPTIONS[name] ||
    `High quality ${name} from the ${categoryName} category. Every item at ৳99 — great value, trusted quality.`
  );
}

// Initial accounts seeded so the platform has an admin + a vendor + a customer
// out of the box. The admin uses the credentials the operator picked; the
// vendor and customer use the operator's chosen password for convenience.
const DEFAULT_PASSWORD = 'demo123';

const DEMO_USERS = [
  {
    email: 'admin@gmail.com',
    password: '123456',
    name: 'Site Admin',
    avatar: 'A',
    role: 'ADMIN',
    phone: '+8801700000001',
    city: 'Dhaka',
    address: 'Banani, Dhaka-1213',
  },
  {
    email: 'vendor@gmail.com',
    password: DEFAULT_PASSWORD,
    name: 'Karim Mia',
    avatar: 'K',
    role: 'VENDOR',
    phone: '+8801700000002',
    city: 'Dhaka',
    address: 'Old Dhaka',
    // Owned stall — points to the first vendor entry below.
    stallSlug: 'dhaka-deals',
  },
  {
    email: 'customer@gmail.com',
    password: DEFAULT_PASSWORD,
    name: 'Rahim Ahmed',
    avatar: 'R',
    role: 'CUSTOMER',
    phone: '01700-000000',
    city: 'Dhaka',
    address: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
  },
];

module.exports = {
  CATEGORIES,
  VENDORS,
  PRODUCT_DESCRIPTIONS,
  getDescription,
  DEMO_USERS,
};
