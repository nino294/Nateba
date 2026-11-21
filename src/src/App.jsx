import AIMatch from "./AIMatch";
import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { createClient } from "@supabase/supabase-js";

const firebaseApp = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
});
const fbAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
// ── Brand ─────────────────────────────────────────────────────
const BRAND = "Classeli";
const DOMAIN = "classeli.com";
const ADMIN_EMAILS = ["nino@pudogeorgia.com","hello@classeli.com"];
const isAdminUser = (u) => !!u && ADMIN_EMAILS.includes(String(u.email||"").toLowerCase());
// Sample teachers shown until enough real teachers join. Set to false to hide them.
const SHOW_DEMO_TEACHERS = true;
// ── Legal details shown in the footer and Terms (banks check these). Fill in and redeploy.
const BUSINESS = {
  name: "",        // e.g. "ი/მ ნინო ..." / "IE Nino ..."
  id: "",          // individual entrepreneur ID (საიდენტიფიკაციო ნომერი)
  address: "",     // legal address
  phone: "",       // e.g. "+995 5xx xxx xxx"
  email: "hello@classeli.com",
};
const businessLine = (isKa) => [
  BUSINESS.name,
  BUSINESS.id && `${isKa ? "ს/ნ" : "ID"} ${BUSINESS.id}`,
  BUSINESS.address,
  BUSINESS.phone,
  BUSINESS.email,
].filter(Boolean).join(" · ");

// Emails are built on the server from fixed templates (see /api/send-email.js)
const sendEmail = async (type, data) => {
  try { await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, data }) }); }
  catch (e) { console.log("Email skipped:", type); }
};

// ── Safe database writes ──────────────────────────────────────
// If a column doesn't exist yet in Supabase, drop it and retry instead of failing the whole action.
const missingColumn = (err) => { const m = String(err?.message||"").match(/'([^']+)' column/); return m ? m[1] : null; };
const safeWrite = async (run, row) => {
  let r = { ...row };
  for (let i = 0; i < 8; i++) {
    const res = await run(r);
    if (!res.error) return res;
    const col = missingColumn(res.error);
    if (col && col in r) { const { [col]: _drop, ...rest } = r; r = rest; continue; }
    return res;
  }
  return { error: { message: "Database is missing several columns. Run the Classeli SQL update." } };
};
const safeInsert = (table, row, returnRow = false) =>
  safeWrite(r => returnRow ? supabase.from(table).insert(r).select().single() : supabase.from(table).insert(r), row);
const safeUpdate = (table, row, match) =>
  safeWrite(r => { let q = supabase.from(table).update(r); Object.entries(match).forEach(([k,v]) => { q = q.eq(k, v); }); return q; }, row);

// Finds a user's row even if duplicates exist (prefers the tutor row)
const findUserRow = async (uid) => {
  if (!uid) return null;
  const { data } = await supabase.from("users").select("role,id").eq("firebase_uid", uid);
  if (!data || !data.length) return null;
  return data.find(r => r.role === "tutor") || data[0];
};

// ── Small helpers ─────────────────────────────────────────────
const RESP_KA = {"30 min":"30 წუთში","1 hr":"1 საათში","2 hrs":"2 საათში","3 hrs":"3 საათში","4 hrs":"4 საათში","Same day":"იმავე დღეს"};
const fmtResp = (r, lang) => {
  const v = r || "2 hrs";
  if (lang === "ka") return `პასუხობს ${RESP_KA[v] || v}`;
  return v === "Same day" ? "Responds within a day" : `Responds in ${v}`;
};
// Booking slots look like "2026-11-20 14:00" (calendar) or free text (groups / packages)
const slotDate = (slot) => {
  const m = String(slot||"").match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  // All lesson times are Tbilisi time (UTC+4, no daylight saving) — so a student in Kraków or London sees the same moment
  return m ? new Date(Date.UTC(+m[1], +m[2]-1, +m[3], +m[4] - 4, +m[5])) : null;
};
const TZ_LABEL = { en: "Tbilisi time (GMT+4)", ka: "თბილისის დრო (GMT+4)" };
// The visitor is outside Georgia's time zone (e.g. Kraków) → show a hint next to lesson times
const outsideTbilisi = (() => { try { return new Date().getTimezoneOffset() !== -240; } catch { return false; } })();
// Same moment in the visitor's own clock, e.g. "13:00 your time"
const localTimeHint = (slot, lang) => {
  const d = slotDate(slot);
  if (!d || !outsideTbilisi) return "";
  const hh = String(d.getHours()).padStart(2,"0"), mm = String(d.getMinutes()).padStart(2,"0");
  return lang === "ka" ? ` (${hh}:${mm} შენი დროით)` : ` (${hh}:${mm} your time)`;
};
const isPastBooking = (b) => {
  if (b.status === "completed") return true;
  const d = slotDate(b.slot);
  return !!d && d.getTime() + 90*60*1000 < Date.now();
};
const convoId = (a, b) => [String(a), String(b)].sort().join("__");
const initials = (name) => String(name||"?").split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase() || "?";

const C = {
  bg:"#FFFFFF", bg2:"#F0F8FF", card:"#FFFFFF", white:"#FFFFFF",
  primary:"#1CB0F6", primaryHover:"#0A9FE0", primaryLight:"#E0F4FF",
  accent:"#E9A520", accentHover:"#D4941A", accentLight:"#FFF3E0",
  text:"#1A1A1A", mid:"#3A3A3A", muted:"#777777",
  border:"#E0EEF7", borderHover:"#B0D8F0",
  red:"#FF4B4B", redLight:"#FFF0F0",
  ok:"#58CC02", okLight:"#E8FBD4",
  shadow:"0 2px 8px rgba(28,176,246,0.10)",
  shadowMd:"0 4px 20px rgba(28,176,246,0.15)",
  shadowLg:"0 8px 40px rgba(0,0,0,0.14)",
  fb:"'Nunito',sans-serif",
  radius:"14px", radiusSm:"10px", radiusLg:"20px",
};

const CAT_COLORS = {
  school:"#4A90D9", music:"#A259FF", arts:"#FF6B6B",
  floristry:"#58CC02", fitness:"#FF7A00", dance:"#F759AB",
  cooking:"#FA8C16", tech:"#1CB0F6", photo:"#722ED1",
  languages:"#13C2C2", beauty:"#EB2F96", culture:"#D4380D",
  mind:"#7C3AED",
};

const T = {
  en:{
    nav_browse:"Browse",nav_groups:"Groups",nav_teach:"Teach",
    nav_login:"Log in",nav_signup:"Get started",nav_dash:"Dashboard",nav_out:"Log out",
    hero_title:"Learn for your dreams.",
    hero_sub:"Courses from top experts in any field.",
    hero_cta:"Find a teacher",hero_cta2:"Start teaching",hero_proof:"Verified teachers · online & offline",
    search_ph:"What do you want to learn?",
    fa:"All",fo:"Online",ff:"In-person",
    st:"Categories",ss:"Prices in GEL",sk:"Live lessons",sr:"Verified teachers",
    sc:"What do you want to learn?",sf:"Featured teachers",sf2:"Personally reviewed by our team",
    sg:"Group classes",sg2:"",
    ht:"How it works",
    h1t:"Find a teacher",h1d:"Search by skill or category. Filter by price and availability.",
    h2t:"Book a session",h2d:"Start with a trial lesson. Pay securely online.",
    h3t:"Learn and review",h3d:"Video sessions built right in. Rate your teacher after.",
    tr1:"Verified teachers",tr2:"Secure payments",tr3:"Money-back",tr4:"Free cancellation 24h+",
    cb:"Book trial",cr:"reviews",cs:"spots left",cj:"Join now",csv:"Save",csd:"Saved",
    con:"Online",cof:"In-person",cl:"/ session",cre:"Responds in",
    back:"Back",
    pa:"About",pr:"Reviews",pav:"Availability",pp:"Packages",psp:"Languages",
    bs:"Pick a time",bc:"Book & pay",bv:"Join video",bt:"Trial",bof:"In-person · paid online",
    mb:"Message",mph:"Write a message...",ms:"Send",
    pks:"sessions",pksa:"save",
    lt:"Welcome back!",le:"Email",lp:"Password",lb:"Log in",lna:"No account?",lc:"Sign up",
    st2:"Create account",sn:"Full name",sph:"Phone number",sr2:"I want to",ssl:"Learn",sst:"Teach",
    sbtn:"Continue",sha:"Have an account?",shl:"Log in",
    ot:"Check your phone",os:"We sent a 6-digit code to",ore:"Resend code",ov:"Verify",
    pyt:"Complete booking",pyw:"Session with",pyp:"Session price",pyf:"Platform fee",pytot:"Total",
    pyc:"Card number",pye:"MM / YY",pycv:"CVV",pyb:"Pay",pyok:"Booked!",
    pysc:"Secure bank payment · Money-back guarantee",
    gt:"Gift this lesson",gn:"Recipient name",ge:"Recipient email",gm:"Personal message",
    dh:"Hey,",du:"Upcoming",dm:"Messages",de:"Earnings",dstu:"Students",dse:"Sessions",
    dj:"Join video",dem:"No upcoming sessions",dsp:"View profile",dd:"Decline",da:"Accept",
    tt:"Teach on Classeli",ts:"Share your skill with students across Georgia.",
    tn:"Full name",tc:"Category",tsk:"Your skill",tsh:"Choose or type your own",
    tp:"Price per session (GEL)",tb:"About you",tv2:"Intro video URL (optional)",
    ton:"Online",tof:"In-person",tsub:"Apply to teach",tok:"Application received! We review within 24 hours.",
    tc1:"Set your own rates",tc2:"Your schedule",tc3:"Online or in-person",tc4:"Students across Georgia",
    rtt:"How was your session?",rts:"Help others find great teachers.",
    rto:"Overall rating",rtc:"Leave a comment (optional)",rtr:"Report an issue",rtb:"Submit",
    rpt:"Report session",
    rpr:["Inappropriate behavior","No-show","Content not as described","Technical issue","Other"],
    rpd:"What happened?",rpb:"Submit report",rpok:"Report received. We review within 24 hours.",
    tost:"Terms of Service",topp:"Privacy Policy",faq:"FAQ",
    studR:"Student rating",studS:"sessions",
    pent:"Pending",pena:"Accept",pend:"Decline",
    grp:"Group classes",
    adm:"Admin",adm_apps:"Teacher Applications",adm_approve:"Approve",adm_reject:"Reject",
    adm_pending:"Pending",adm_approved:"Approved",adm_rejected:"Rejected",adm_all:"All",
    adm_empty:"No applications yet",adm_users:"Users",adm_bookings:"All Bookings",
  },
  ka:{
    nav_browse:"მოძებნე",nav_groups:"ჯგუფური გაკვეთილები",nav_teach:"სწავლება",
    nav_login:"შესვლა",nav_signup:"დაწყება",nav_dash:"პანელი",nav_out:"გასვლა",
    hero_title:"ისწავლე შენი ოცნებებისთვის.",
    hero_sub:"კურსები საუკეთესო ექსპერტებისგან ნებისმიერ სფეროში.",
    hero_cta:"იპოვე მასწავლებელი",hero_cta2:"დაიწყე სწავლება",hero_proof:"გადამოწმებული მასწავლებლები · ონლაინ და ოფლაინ",
    search_ph:"რისი სწავლა გინდა?",
    fa:"ყველა",fo:"ონლაინ",ff:"ოფლაინ",
    st:"კატეგორია",ss:"ფასები ლარში",sk:"ლაივ გაკვეთილები",sr:"გადამოწმებული მასწავლებლები",
    sc:"რის სწავლა გინდა?",sf:"რჩეული მასწავლებლები",sf2:"პირადად გადამოწმებული",
    sg:"ჯგუფური გაკვეთილები",sg2:"",
    ht:"როგორ მუშაობს",
    h1t:"იპოვე მასწავლებელი",h1d:"მოძებნე უნარით ან კატეგორიით.",
    h2t:"დაჯავშნე სესია",h2d:"საცდელი გაკვეთილი. გადაიხადე ონლაინ.",
    h3t:"ისწავლე და შეაფასე",h3d:"ვიდეო სესია პლატფორმაზე. დატოვე შეფასება.",
    tr1:"გადამოწმებული",tr2:"უსაფრთხო გადახდა",tr3:"თანხის დაბრუნება",tr4:"უფასო გაუქმება 24 სთ-მდე",
    cb:"საცდელი",cr:"შეფასება",cs:"ადგილი",cj:"ჩაეწერე ახლავე",csv:"შენახვა",csd:"შენახულია",
    con:"ონლაინ",cof:"ოფლაინ",cl:"/ სესია",cre:"პასუხობს",
    back:"უკან",
    pa:"ბიოგრაფია",pr:"შეფასებები",pav:"დრო",pp:"პაკეტები",psp:"ენები",
    bs:"აირჩიე დრო",bc:"დაჯავშნა",bv:"ვიდეო სესია",bt:"საცდელი",bof:"ოფლაინ · გადახდა ონლაინ",
    mb:"შეტყობინება",mph:"დაწერე...",ms:"გაგზავნა",
    pks:"გაკვეთილი",pksa:"დაზოგე",
    lt:"კეთილი იყოს თქვენი დაბრუნება!",le:"ელ-ფოსტა",lp:"პაროლი",lb:"შესვლა",lna:"არ გაქვს ანგარიში?",lc:"შექმნა",
    st2:"ანგარიშის შექმნა",sn:"სახელი და გვარი",sph:"ტელეფონის ნომერი",sr2:"მე მინდა",ssl:"სწავლა",sst:"სწავლება",
    sbtn:"გაგრძელება",sha:"უკვე გაქვს?",shl:"შესვლა",
    ot:"შეამოწმე ტელეფონი",os:"6-ნიშნა კოდი გამოგზავნილია",ore:"კოდის ხელახლა გაგზავნა",ov:"დადასტურება",
    pyt:"გადახდის დასრულება",pyw:"სესია —",pyp:"სესიის ფასი",pyf:"საკომისიო",pytot:"სულ",
    pyc:"ბარათის ნომერი",pye:"თთ / წწ",pycv:"CVV",pyb:"გადახდა",pyok:"დაჯავშნილია!",
    pysc:"უსაფრთხო საბანკო გადახდა · თანხის დაბრუნების გარანტია",
    gt:"საჩუქრად გაგზავნა",gn:"მიმღების სახელი",ge:"მიმღების ელ-ფოსტა",gm:"შეტყობინება",
    dh:"გამარჯობა,",du:"მომავალი გაკვეთილები",dm:"შეტყობინებები",de:"შემოსავალი",dstu:"მოსწავლე",dse:"გაკვეთილი",
    dj:"ვიდეო სესია",dem:"მომავალი გაკვეთილი არ არის",dsp:"პროფილი",dd:"უარყოფა",da:"მიღება",
    tt:"ასწავლე Classeli-ზე!",ts:"გახდი მასწავლებელი და ასწავლე საიდანაც გინდა.",
    tn:"სახელი და გვარი",tc:"კატეგორია",tsk:"კურსის სახელი",tsh:"ჩაწერე შენი კურსის სახელი",
    tp:"ფასი სესიაზე (GEL)",tb:"თქვენს შესახებ",tv2:"ვიდეო URL (YouTube ან Vimeo)",
    ton:"ონლაინ სწავლება",tof:"ოფლაინ სწავლება",tsub:"განაცხადის გაგზავნა",tok:"განაცხადი მიღებულია. 24 საათში განვიხილავთ.",
    tc1:"დაადგინე საკუთარი ფასი",tc2:"სწავლება შენი გრაფიკით",tc3:"ონლაინ ან პირადად",tc4:"მოსწავლეები საქართველოში",
    rtt:"როგორი იყო სესია?",rts:"შენი შეფასება ეხმარება სხვებს.",
    rto:"საერთო შეფასება",rtc:"კომენტარი (არასავალდებულო)",rtr:"პრობლემის შეტყობინება",rtb:"გაგზავნა",
    rpt:"სესიის შეტყობინება",
    rpr:["შეუფერებელი ქცევა","არ გამოცხადდა","შინაარსი არ შეესაბამება","ტექნიკური პრობლემა","სხვა"],
    rpd:"რა მოხდა?",rpb:"შეტყობინების გაგზავნა",rpok:"შეტყობინება მიღებულია.",
    tost:"მომსახურების პირობები",topp:"კონფიდენციალურობის პოლიტიკა",
    studR:"მოსწავლის რეიტინგი",studS:"სესია",
    pent:"მოლოდინში",pena:"მიღება",pend:"უარყოფა",
    grp:"ჯგუფური გაკვეთილები",
    adm:"ადმინი",adm_apps:"მასწავლებლის განაცხადები",adm_approve:"დამტკიცება",adm_reject:"უარყოფა",
    adm_pending:"მოლოდინში",adm_approved:"დამტკიცებული",adm_rejected:"უარყოფილი",adm_all:"ყველა",
    adm_empty:"განაცხადი არ არის",adm_users:"მომხმარებლები",adm_bookings:"ყველა ჯავშანი",
  }
};

const CATEGORIES = [
  {id:"school",label:"School Subjects",lka:"სკოლის საგნები",skills:["Mathematics","Physics","Chemistry","Biology","Georgian Language","English","Russian","French","German","Spanish","Italian","Turkish","Arabic","Chinese","Japanese","History","Geography","Economics","Philosophy","Psychology","Essay Writing","SAT Prep","IELTS","TOEFL","National Exam Prep"]},
  {id:"music",label:"Music & Vocals",lka:"მუსიკა და ვოკალი",skills:["Vocal Training","Classical Voice","Jazz Vocals","Pop Vocals","Polyphonic Singing","Choir","Piano","Classical Piano","Jazz Piano","Guitar","Classical Guitar","Electric Guitar","Bass Guitar","Violin","Cello","Flute","Saxophone","Drums","Accordion","Music Theory","Songwriting","Music Production","Ableton","DJing","Panduri","Chonguri","Duduki"]},
  {id:"arts",label:"Arts & Crafts",lka:"ხელოვნება",skills:["Drawing","Sketching","Oil Painting","Watercolour","Acrylic","Ceramics","Pottery","Calligraphy","Georgian Calligraphy","Graphic Design","Illustration","Animation","Digital Art","Procreate","Embroidery","Knitting","Crochet","Sewing","Jewellery Making","Woodworking","Mosaic","Icon Painting"]},
  {id:"floristry",label:"Floristry & Garden",lka:"ფლორისტიკა",skills:["Flower Arranging","Wedding Floristry","Bridal Bouquets","Event Floristry","Wreath Making","Dried Flowers","Terrarium","Ikebana","Indoor Plants","Vegetable Gardening","Herb Garden","Landscape Design","Bonsai"]},
  {id:"fitness",label:"Fitness & Wellness",lka:"ფიტნესი",skills:["Personal Training","Strength Training","Yoga","Hatha Yoga","Vinyasa","Pilates","Stretching","CrossFit","HIIT","Boxing","Kickboxing","Muay Thai","MMA","Judo","Karate","Taekwondo","Meditation","Breathwork","Nutrition Coaching","Running","Swimming","Gymnastics","Rehabilitation"]},
  {id:"dance",label:"Dance",lka:"ცეკვა",skills:["Georgian Traditional Dance","Kartuli","Mtiuluri","Acharuli","Khorumi","Ballet","Contemporary","Jazz Dance","Ballroom","Waltz","Salsa","Bachata","Tango","Flamenco","Belly Dance","Hip Hop","Breaking","Aerial Silk","Pole Dance","Zumba"]},
  {id:"cooking",label:"Food & Cooking",lka:"კულინარია",skills:["Georgian Cuisine","Khinkali","Khachapuri","Megrelian Cuisine","Baking","Sourdough Bread","Cake Making","Cake Decorating","French Pastry","Croissants","Chocolate Making","Coffee Brewing","Latte Art","Wine Tasting","Georgian Wine","Craft Cocktails","Italian Cooking","Pasta Making","Sushi","Vegan Cooking","Fermentation"]},
  {id:"tech",label:"Tech & Business",lka:"ტექნოლოგია",skills:["Python","JavaScript","TypeScript","HTML & CSS","React","Next.js","Node.js","Flutter","Swift","SQL","MongoDB","Git","Docker","AWS","AI & Machine Learning","ChatGPT & Prompt Engineering","Data Science","Data Analysis","Excel","Google Sheets","Accounting","Business Planning","Marketing","Digital Marketing","SEO","Copywriting","Social Media","Product Management","UX Design","Figma","Video Editing","Photo Editing","3D Modelling","Public Speaking"]},
  {id:"photo",label:"Photography & Film",lka:"ფოტო და ვიდეო",skills:["Photography","Portrait Photography","Wedding Photography","Fashion Photography","Street Photography","Product Photography","Food Photography","Drone Photography","Lightroom","Colour Grading","Videography","Wedding Videography","YouTube Content","TikTok Video","Podcast Production","Studio Lighting","AI Image Generation"]},
  {id:"languages",label:"Languages",lka:"ენები",skills:["English for Beginners","Business English","IELTS","TOEFL","Cambridge Exams","Georgian for Foreigners","Russian","French","German","Spanish","Italian","Turkish","Arabic","Egyptian Arabic","Chinese","HSK Prep","Japanese","JLPT Prep","Korean","Portuguese","Dutch","Polish","Swedish","Hindi","Farsi","Armenian","Sign Language"]},
  {id:"beauty",label:"Beauty & Style",lka:"სილამაზე",skills:["Makeup Artistry","Bridal Makeup","Skincare","Korean Skincare","Nail Art","Hair Styling","Braiding","Hair Colouring","Balayage","Eyebrow Design","Lash Extensions","Massage","Personal Styling","Colour Analysis","Henna Art"]},
  {id:"culture",label:"Georgian Culture",lka:"ქართული კულტურა",skills:["Polyphonic Singing","Georgian Folk Songs","Georgian History","Georgian Wine Culture","Qvevri Winemaking","Icon Painting","Georgian Embroidery","Enamelwork","Niello Art","Georgian Mythology","Georgian Poetry","Supra Culture","Tamada Training","Georgian Calligraphy"]},
  {id:"mind",label:"Mind & Creativity",lka:"გონება და შემოქმედება",skills:["Speed Reading","Memory Techniques","Chess","Mindfulness","Meditation","Journaling","Creative Writing","Fiction Writing","Screenwriting","Poetry","Improv Theatre","Stand-up Comedy","Storytelling","Debate","Philosophy","Magic Tricks","AI Tools for Creativity"]},
];

const TEACHERS = [
  {id:1,name:"Nino Kvachadze",nka:"ნინო კვაჭაძე",cat:"school",skill:"Mathematics",ska:"მათემატიკა",price:35,trial:15,rating:4.9,reviews:142,sRating:4.8,sDone:312,online:true,offline:true,av:"NK",bio:"10+ years preparing students for national exams. Over 200 students passed with top scores.",bka:"10+ წელი ეროვნული გამოცდებისთვის.",speaks:["Georgian","Russian"],resp:"2 hrs",slots:["Mon 10:00","Mon 14:00","Tue 11:00","Wed 15:00","Fri 10:00"],rl:[{n:"Giorgi M.",t:"Went from 40% to 92% on nationals.",r:5},{n:"Salome T.",t:"Very patient and clear.",r:5}],pkgs:[{n:5,p:150,s:25},{n:10,p:280,s:70}]},
  {id:2,name:"David Beridze",nka:"დავით ბერიძე",cat:"languages",skill:"Business English",ska:"ბიზნეს ინგლისური",price:40,trial:18,rating:4.8,reviews:98,sRating:4.9,sDone:187,online:true,offline:false,av:"DB",bio:"Cambridge-certified. IELTS, Business English, conversational fluency.",bka:"Cambridge-სერტიფიცირებული.",speaks:["Georgian","English","Russian"],resp:"1 hr",slots:["Mon 09:00","Tue 18:00","Thu 17:00","Sat 11:00"],rl:[{n:"Ana K.",t:"Got 7.5 on IELTS after 3 months.",r:5}],pkgs:[{n:5,p:180,s:20},{n:10,p:340,s:60}]},
  {id:3,promoted:true,name:"Mariam Gogitidze",nka:"მარიამ გოგიტიძე",cat:"music",skill:"Vocal Training",ska:"ვოკალი",price:45,trial:20,rating:4.9,reviews:73,sRating:4.7,sDone:241,online:true,offline:true,av:"MG",video:"https://www.youtube.com/embed/dQw4w9WgXcQ",bio:"Professional singer and vocal coach. Jazz, pop, classical. All levels welcome.",bka:"პროფესიონალი მომღერალი. ჯაზი, პოპი.",speaks:["Georgian","English"],resp:"3 hrs",slots:["Tue 10:00","Wed 12:00","Thu 15:00","Fri 16:00","Sat 11:00"],rl:[{n:"Elene G.",t:"My voice transformed in 2 months.",r:5}],pkgs:[{n:4,p:160,s:20},{n:8,p:300,s:60}]},
  {id:4,name:"Tornike Jakheli",nka:"თორნიკე ჯახელი",cat:"tech",skill:"Python & AI",ska:"Python და AI",price:50,trial:20,rating:5.0,reviews:44,sRating:5.0,sDone:98,online:true,offline:false,av:"TJ",bio:"Senior engineer 8 years. Python, AI tools, web dev from zero to job-ready.",bka:"8 წლის გამოცდილება. Python, AI.",speaks:["Georgian","English"],resp:"30 min",slots:["Mon 19:00","Wed 19:00","Fri 18:00","Sat 14:00"],rl:[{n:"Sandro B.",t:"Got my first dev job 6 months later.",r:5}],pkgs:[{n:5,p:225,s:25},{n:10,p:420,s:80}]},
  {id:5,name:"Tamar Dgebuadze",nka:"თამარ დღებუაძე",cat:"floristry",skill:"Flower Arranging",ska:"ყვავილების მოწყობა",price:55,trial:25,rating:4.9,reviews:61,sRating:4.8,sDone:134,online:false,offline:true,av:"TD",bio:"Professional florist 12 years. Wedding floristry and seasonal arrangements.",bka:"12 წლის გამოცდილება.",speaks:["Georgian","Russian"],resp:"4 hrs",slots:["Mon 11:00","Wed 10:00","Sat 10:00","Sun 11:00"],rl:[{n:"Nutsa T.",t:"My arrangements are now gallery-worthy.",r:5}],pkgs:[{n:3,p:145,s:20},{n:6,p:270,s:60}]},
  {id:6,name:"Levan Kvaratskhelia",nka:"ლევან კვარაცხელია",cat:"dance",skill:"Georgian Traditional Dance",ska:"ქართული ცეკვა",price:30,trial:12,rating:4.7,reviews:88,sRating:4.6,sDone:203,online:false,offline:true,av:"LK",bio:"Professional dancer and choreographer. Georgian traditional and contemporary.",bka:"პროფესიონალი მოცეკვავე.",speaks:["Georgian","Russian"],resp:"2 hrs",slots:["Tue 16:00","Thu 17:00","Sat 12:00","Sun 14:00"],rl:[{n:"Ani L.",t:"Beautiful teaching style.",r:5}],pkgs:[{n:5,p:130,s:20},{n:10,p:240,s:60}]},
  {id:7,name:"Ana Begiashvili",nka:"ანა ბეგიაშვილი",cat:"cooking",skill:"Georgian Cuisine",ska:"ქართული კულინარია",price:60,trial:30,rating:5.0,reviews:39,sRating:4.9,sDone:87,online:true,offline:true,av:"AB",bio:"Chef and food writer. Khinkali, khachapuri, Megrelian cuisine.",bka:"შეფ-მზარეული. ხინკალი, ხაჭაპური.",speaks:["Georgian","English","French"],resp:"1 hr",slots:["Wed 11:00","Fri 14:00","Sat 14:00","Sun 12:00"],rl:[{n:"Sophie R.",t:"Best cooking class in Tbilisi.",r:5}],pkgs:[{n:3,p:160,s:20},{n:6,p:300,s:60}]},
  {id:8,name:"Giorgi Tsiklauri",nka:"გიორგი ციკლაური",cat:"photo",skill:"Photography",ska:"ფოტოგრაფია",price:65,trial:30,rating:4.8,reviews:52,sRating:4.7,sDone:156,online:true,offline:true,av:"GT",bio:"Award-winning photographer. Portrait, street, wedding. Lightroom included.",bka:"ფოტოგრაფი. პორტრეტი, ქუჩა.",speaks:["Georgian","English"],resp:"3 hrs",slots:["Mon 13:00","Thu 14:00","Sat 10:00","Sun 15:00"],rl:[{n:"Nino B.",t:"My photography improved dramatically.",r:5}],pkgs:[{n:4,p:235,s:25},{n:8,p:440,s:80}]},
];

const GROUPS = [
  {id:1,title:"Maths Exam Intensive",tka:"მათემატიკა — ეროვნული გამოცდა",teacher:"Nino Kvachadze",teka:"ნინო კვაჭაძე",av:"NK",cat:"school",price:15,spots:3,total:8,dur:90,sch:"Sat & Sun 10:00",ska:"შაბ-კვი 10:00",desc:"Full syllabus, past papers, exam technique.",dka:"სრული პროგრამა, გასული ტესტები."},
  {id:2,title:"Jazz Vocals Beginners",tka:"ჯაზ-ვოკალი დამწყებებისთვის",teacher:"Mariam Gogitidze",teka:"მარიამ გოგიტიძე",av:"MG",cat:"music",price:20,spots:4,total:6,dur:75,sch:"Wed 18:00",ska:"ოთხშაბათი 18:00",desc:"Vocal technique, jazz standards, performance.",dka:"ვოკალური ტექნიკა, ჯაზ სტანდარტები."},
  {id:3,title:"Georgian Cooking Masterclass",tka:"ქართული კულინარია — მასტერკლასი",teacher:"Ana Begiashvili",teka:"ანა ბეგიაშვილი",av:"AB",cat:"cooking",price:35,spots:2,total:6,dur:120,sch:"Sun 12:00",ska:"კვირა 12:00",desc:"Cook 4 traditional Georgian dishes.",dka:"4 ქართული კერძი ნულიდან."},
  {id:4,title:"Wedding Floristry Workshop",tka:"საქორწინო ფლოტსტიკა",teacher:"Tamar Dgebuadze",teka:"თამარ დღებუაძე",av:"TD",cat:"floristry",price:45,spots:3,total:5,dur:180,sch:"Sat 10:00",ska:"შაბათი 10:00",desc:"Bridal bouquets, centrepieces, flower wall.",dka:"საქორწინო თაიგული, კომპოზიცია."},
];

const Stars=({r,s=14,interactive,onRate})=>(
  <span style={{display:"inline-flex",gap:1}}>
    {[1,2,3,4,5].map(i=>(
      <span key={i} onClick={()=>interactive&&onRate&&onRate(i)}
        style={{color:i<=Math.round(r)?"#FFD700":"#E0E0E0",fontSize:s,cursor:interactive?"pointer":"default",transition:"transform 0.1s",display:"inline-block"}}
        onMouseEnter={e=>{if(interactive)e.target.style.transform="scale(1.3)";}}
        onMouseLeave={e=>{e.target.style.transform="scale(1)";}}>★</span>
    ))}
  </span>
);

const Av=({initials,bg,size=48,src})=>src
  ?<img src={src} alt="" loading="lazy" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0,background:bg,display:"block"}}/>
  :(
  <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size*0.32,fontWeight:900,fontFamily:C.fb,flexShrink:0}}>
    {initials}
  </div>
);

// Shrinks a photo in the browser (max 600px, JPEG) before upload — fast on mobile data, small storage
const resizeImage = (file, max = 600) => new Promise((resolve, reject) => {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    c.toBlob(b => b ? resolve(b) : reject(new Error("Could not process image")), "image/jpeg", 0.85);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Not an image")); };
  img.src = url;
});
const PHOTO_BUCKET = "teacher-photos";

const Badge=({children,color})=>(
  <span style={{background:color+"18",color,borderRadius:20,padding:"4px 10px",fontSize:11,fontFamily:C.fb,fontWeight:800,display:"inline-block",border:`1.5px solid ${color}33`}}>{children}</span>
);

const Inp=({label,type="text",value,onChange,placeholder,rows,list})=>(
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:6}}>{label}</label>}
    {rows
      ?<textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder}
          style={{width:"100%",padding:"13px 16px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,fontSize:14,fontFamily:C.fb,color:C.text,outline:"none",resize:"vertical",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
      :<input type={type} value={value} onChange={onChange} placeholder={placeholder} list={list}
          style={{width:"100%",padding:"13px 16px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,fontSize:14,fontFamily:C.fb,color:C.text,outline:"none",boxSizing:"border-box"}}
          onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
    }
  </div>
);

const PBtn=({children,onClick,full,disabled,size="md",variant="accent",loading})=>{
  const bg=variant==="primary"?C.primary:variant==="red"?C.red:C.accent;
  const shadow=variant==="primary"?"#0A9FE0":variant==="red"?"#CC2222":"#D4941A";
  const pad=size==="sm"?"9px 18px":size==="lg"?"16px 36px":"13px 24px";
  const fz=size==="sm"?13:size==="lg"?16:14;
  return(
    <button onClick={onClick} disabled={disabled||loading}
      style={{background:disabled||loading?"#CCCCCC":bg,color:"#fff",border:"none",borderRadius:C.radiusLg,padding:pad,fontSize:fz,fontWeight:900,fontFamily:C.fb,cursor:disabled||loading?"not-allowed":"pointer",width:full?"100%":"auto",transition:"all 0.15s",boxShadow:disabled||loading?"none":`0 4px 0 ${shadow}`,letterSpacing:"0.2px"}}
      onMouseEnter={e=>{if(!disabled&&!loading){e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 0 ${shadow}`;}}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=disabled||loading?"none":`0 4px 0 ${shadow}`;}}
      onMouseDown={e=>{e.currentTarget.style.transform="translateY(2px)";e.currentTarget.style.boxShadow="none";}}
      onMouseUp={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=`0 4px 0 ${shadow}`;}}>
      {loading?"...":children}
    </button>
  );
};

const OBtn=({children,onClick,full,size="md"})=>{
  const pad=size==="sm"?"8px 16px":size==="lg"?"14px 32px":"11px 22px";
  const fz=size==="sm"?13:size==="lg"?15:14;
  return(
    <button onClick={onClick}
      style={{background:C.bg,color:C.primary,border:`2.5px solid ${C.border}`,borderRadius:C.radiusLg,padding:pad,fontSize:fz,fontWeight:900,fontFamily:C.fb,cursor:"pointer",width:full?"100%":"auto",transition:"all 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=C.primary;e.currentTarget.style.background=C.primaryLight;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.bg;}}>
      {children}
    </button>
  );
};

const Logo=({onClick})=>(
  <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}}>
    <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
      <rect width="48" height="48" rx="14" fill={C.primary}/>
      <path d="M24 10 L27 22 L38 24 L27 26 L24 38 L21 26 L10 24 L21 22 Z" fill={C.accent}/>
      <path d="M24 10 L27 22 L38 24 L27 26 L24 38 L21 26 L10 24 L21 22 Z" fill="white" opacity="0.15"/>
    </svg>
    <span style={{fontFamily:C.fb,fontWeight:900,fontSize:20,color:C.text,letterSpacing:"-0.5px"}}>classeli</span>
  </div>
);

const Toast=({msg,onClose,type="ok"})=>{
  useEffect(()=>{const id=setTimeout(onClose,4000);return()=>clearTimeout(id);},[]);
  const bg=type==="err"?C.red:C.primary;
  return(
    <div style={{position:"fixed",bottom:28,right:28,background:bg,color:"#fff",borderRadius:C.radiusLg,padding:"14px 22px",fontSize:14,fontFamily:C.fb,fontWeight:700,zIndex:9999,boxShadow:C.shadowLg,display:"flex",alignItems:"center",gap:12,maxWidth:340}}>
      {msg}
      <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,width:26,height:26,fontSize:14,cursor:"pointer",color:"#fff",marginLeft:"auto"}}>×</button>
    </div>
  );
};

const ReportModal=({teacher,user,lang,bookingRoom,onClose})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [reason,setReason]=useState("");const [detail,setDetail]=useState("");const [done,setDone]=useState(false);
  const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  const submit=async()=>{
    if(!reason)return;setSaving(true);setErr("");
    const{error}=await safeInsert("user_reports",{reporter_uid:user?.uid||null,reporter_name:user?.name||null,reporter_email:user?.email||null,reported_uid:teacher?.firebase_uid||null,reported_name:teacher?.name||null,reason,details:detail||null,video_room:bookingRoom||null,status:"open"});
    setSaving(false);
    if(error){console.error(error);setErr(isKa?"შეტყობინება ვერ გაიგზავნა. სცადე ხელახლა.":"Could not send the report. Please try again.");return;}
    sendEmail("report_received",{reporter:user?.name||user?.email||"Guest",reported:teacher?.name||"",reason,details:detail});
    setDone(true);
  };
  if(done)return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:36,maxWidth:380,width:"100%",textAlign:"center",boxShadow:C.shadowLg}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Hedgehog size={70}/></div>
        <div style={{fontSize:17,fontWeight:800,color:C.text,fontFamily:C.fb,marginBottom:20}}>{t.rpok}</div>
        <PBtn onClick={onClose} full>{isKa?"დახურვა":"Done"}</PBtn>
      </div>
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:28,maxWidth:420,width:"100%",boxShadow:C.shadowLg,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:18,fontWeight:900,color:C.text,fontFamily:C.fb}}>{t.rpt}</div>
          <button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:32,height:32,fontSize:16,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          {t.rpr.map(r=>(
            <button key={r} onClick={()=>setReason(r)}
              style={{padding:"12px 16px",border:`2px solid ${reason===r?C.accent:C.border}`,borderRadius:C.radius,background:reason===r?C.accentLight:C.bg2,color:reason===r?C.accent:C.mid,fontSize:13,fontWeight:700,fontFamily:C.fb,cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
              {r}
            </button>
          ))}
        </div>
        <Inp label={t.rpd} value={detail} onChange={e=>setDetail(e.target.value)} rows={3}/>
        {err&&<div style={{background:C.redLight,borderRadius:C.radius,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
        <PBtn onClick={submit} disabled={!reason} loading={saving} full variant="red">{t.rpb}</PBtn>
      </div>
    </div>
  );
};

// Recalculates a teacher's average rating after a new review
const refreshTeacherRating=async(teacherUid)=>{
  if(!teacherUid)return;
  try{
    const{data}=await supabase.from("teacher_reviews").select("rating").eq("teacher_uid",teacherUid);
    if(!data||!data.length)return;
    const avg=Math.round((data.reduce((a,r)=>a+(Number(r.rating)||0),0)/data.length)*10)/10;
    await safeUpdate("teacher_profiles",{rating:avg,review_count:data.length},{firebase_uid:teacherUid});
  }catch(e){console.error(e);}
};

const PostSession=({teacher,user,lang,bookingRoom,onClose})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [rating,setRating]=useState(0);const [comment,setComment]=useState("");const [showRep,setShowRep]=useState(false);const [done,setDone]=useState(false);
  const [saving,setSaving]=useState(false);const [err,setErr]=useState("");
  const submit=async()=>{
    if(!rating)return;setSaving(true);setErr("");
    const{error}=await safeInsert("teacher_reviews",{teacher_uid:teacher?.firebase_uid||null,teacher_name:teacher?.name||null,reviewer_uid:user?.uid||null,reviewer_name:user?.name||null,rating,comment:comment.trim()||null,video_room:bookingRoom||null});
    if(error){console.error(error);setSaving(false);setErr(isKa?"შეფასება ვერ შეინახა. სცადე ხელახლა.":"Could not save your review. Please try again.");return;}
    if(bookingRoom) await safeUpdate("bookings",{status:"completed"},{video_room:bookingRoom});
    await refreshTeacherRating(teacher?.firebase_uid);
    setSaving(false);setDone(true);
  };
  if(showRep)return <ReportModal teacher={teacher} user={user} lang={lang} bookingRoom={bookingRoom} onClose={()=>{setShowRep(false);setDone(true);}}/>;
  if(done)return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:40,maxWidth:380,width:"100%",textAlign:"center",boxShadow:C.shadowLg}}>
        <div style={{fontSize:56,marginBottom:16}}>🎉</div>
        <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{isKa?"მადლობა!":"Thank you!"}</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:24,lineHeight:1.6}}>{t.rts}</div>
        <PBtn onClick={onClose} full>{isKa?"დახურვა":"Done"}</PBtn>
      </div>
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:32,maxWidth:420,width:"100%",boxShadow:C.shadowLg,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
          <button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:32,height:32,fontSize:16,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button>
        </div>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><Av initials={teacher.av||initials(teacher.name)} src={teacher.photo} bg={CAT_COLORS[teacher.cat]||C.primary} size={64}/></div>
          <div style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:4}}>{t.rtt}</div>
          <div style={{fontSize:13,color:C.muted,fontFamily:C.fb}}>{t.rts}</div>
        </div>
        <div style={{marginBottom:24,textAlign:"center"}}><Stars r={rating} s={40} interactive onRate={setRating}/></div>
        <Inp label={t.rtc} value={comment} onChange={e=>setComment(e.target.value)} rows={3}/>
        {err&&<div style={{background:C.redLight,borderRadius:C.radius,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
          <OBtn onClick={()=>setShowRep(true)} full>{t.rtr}</OBtn>
          <PBtn onClick={submit} disabled={rating===0} loading={saving} full>{t.rtb}</PBtn>
        </div>
        <div style={{textAlign:"center",marginTop:12}}>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontFamily:C.fb,fontSize:13,cursor:"pointer",fontWeight:700}}>{isKa?"გამოტოვება":"Skip"}</button>
        </div>
      </div>
    </div>
  );
};

const VideoRoom=({teacher,slot,bookingRoom,user,lang,onClose})=>{
  const isKa=lang==="ka";
  const containerRef=useRef(null);
  const callFrameRef=useRef(null);
  const hasJoinedRef=useRef(false);
  const [ended,setEnded]=useState(false);
  const [showRep,setShowRep]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [attempt,setAttempt]=useState(0);
  // The teacher joining their own lesson should not be asked to rate themselves
  const isTeacherSelf=!!user?.uid&&!!teacher?.firebase_uid&&user.uid===teacher.firebase_uid;

  const roomName=(()=>{
    // Use the booking's video_room so teacher and student always join the same room
    if(bookingRoom) return bookingRoom.toLowerCase().replace(/[^a-z0-9-]/g,"-").slice(0,35);
    const teacherShort=(teacher.firebase_uid||teacher.name||"t").replace(/[^a-z0-9]/gi,"").toLowerCase().slice(0,8);
    const dateStr=slot&&slot.length>8?slot.split(" ")[0].replace(/-/g,"").slice(2):"";
    return `cl-${teacherShort}${dateStr?"-"+dateStr:""}`.slice(0,35);
  })();

  useEffect(()=>{
    let cancelled=false;
    const setup=async()=>{
      try{
        const res=await fetch("/api/create-room",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({roomName})});
        const data=await res.json();
        if(cancelled)return;
        if(!data.url)throw new Error("No room URL");
        const loadScript=()=>new Promise((resolve,reject)=>{
          if(window.DailyIframe){resolve();return;}
          const s=document.createElement("script");
          s.src="https://unpkg.com/@daily-co/daily-js";
          s.onload=resolve;s.onerror=reject;
          document.head.appendChild(s);
        });
        await loadScript();
        if(cancelled||!containerRef.current)return;
        const frame=window.DailyIframe.createFrame(containerRef.current,{
          iframeStyle:{width:"100%",height:"100%",border:"none"},
          showLeaveButton:true,
          showFullscreenButton:true,
        });
        callFrameRef.current=frame;
        frame.on("joined-meeting",()=>{if(!cancelled){hasJoinedRef.current=true;setLoading(false);}});
        frame.on("left-meeting",()=>{if(!cancelled&&hasJoinedRef.current)setEnded(true);});
        frame.on("error",()=>{if(!cancelled){setError(isKa?"კავშირის შეცდომა. სცადე ხელახლა.":"Connection error. Please try again.");setLoading(false);}});
        await frame.join({url:data.url,userName:user?.name||(isKa?"სტუმარი":"Guest"),showLeaveButton:true});
      }catch(e){
        if(!cancelled){setError(isKa?"ვიდეო სესია ვერ დაიწყო. სცადე ხელახლა.":"Could not start video session. Please try again.");setLoading(false);}
      }
    };
    setup();
    return()=>{
      cancelled=true;
      if(callFrameRef.current){try{callFrameRef.current.destroy();}catch(e){}callFrameRef.current=null;}
    };
  },[roomName,attempt]);

  useEffect(()=>{if(ended&&isTeacherSelf)onClose();},[ended]);
  if(ended&&isTeacherSelf)return null;
  if(ended)return <PostSession teacher={teacher} user={user} lang={lang} bookingRoom={bookingRoom} onClose={onClose}/>;
  return(
    <div style={{position:"fixed",inset:0,background:"#0D1117",zIndex:9998,display:"flex",flexDirection:"column"}}>
      <div style={{background:"#FFFFFF",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`2px solid ${C.border}`,flexShrink:0,gap:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Av initials={teacher.av||initials(teacher.name)} src={teacher.photo} bg={CAT_COLORS[teacher.cat]||C.primary} size={34}/>
          <div><div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{teacher.name}</div><div style={{fontSize:11,color:C.muted,fontFamily:C.fb}}>{teacher.skill}</div></div>
          <Badge color={C.ok}>● Live</Badge>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {loading&&!error&&<span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700}}>{isKa?"კავშირი...":"Connecting..."}</span>}
          {!isTeacherSelf&&<button onClick={()=>setShowRep(true)} style={{background:C.redLight,color:C.red,border:"none",borderRadius:C.radiusSm,padding:"8px 16px",fontSize:13,fontWeight:700,fontFamily:C.fb,cursor:"pointer"}}>{isKa?"შეტყობინება":"Report"}</button>}
          <PBtn onClick={()=>setEnded(true)} size="sm" variant="red">{isKa?"დასრულება":"End session"}</PBtn>
        </div>
      </div>
      {error?(
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24}}>
          <div style={{fontSize:40}}>😕</div>
          <div style={{fontSize:16,color:"#fff",fontFamily:C.fb,fontWeight:700,textAlign:"center"}}>{error}</div>
          <PBtn onClick={()=>{setError(null);setLoading(true);setAttempt(a=>a+1);}}>{isKa?"ხელახლა ცდა":"Try again"}</PBtn>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.5)",fontFamily:C.fb,fontSize:13,cursor:"pointer",fontWeight:700}}>{isKa?"დახურვა":"Close"}</button>
        </div>
      ):(
        <div style={{flex:1,position:"relative"}}>
          {loading&&(
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,zIndex:1}}>
              <div style={{width:48,height:48,border:"4px solid rgba(255,255,255,0.15)",borderTop:`4px solid ${C.primary}`,borderRadius:"50%",animation:"spin 1s linear infinite"}}/>
              <div style={{color:"rgba(255,255,255,0.6)",fontFamily:C.fb,fontSize:14,fontWeight:700}}>{isKa?"ვიდეო სესია იწყება...":"Starting video session..."}</div>
            </div>
          )}
          <div ref={containerRef} style={{width:"100%",height:"100%"}}/>
        </div>
      )}
      {showRep&&<ReportModal teacher={teacher} user={user} lang={lang} bookingRoom={bookingRoom} onClose={()=>setShowRep(false)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

const AuthModal=({mode:initMode,lang,onAuth,onClose})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [mode,setMode]=useState(initMode||"login");
  const [name,setName]=useState("");const [email,setEmail]=useState("");const [pw,setPw]=useState("");const [pw2,setPw2]=useState("");
  const [role,setRole]=useState("student");const [agree,setAgree]=useState(false);
  const [loading,setLoading]=useState(false);const [gLoading,setGLoading]=useState(false);const [err,setErr]=useState("");const [info,setInfo]=useState("");
  const getErr=(code)=>{const m={"auth/invalid-credential":isKa?"არასწორი ელ-ფოსტა ან პაროლი":"Wrong email or password","auth/invalid-email":isKa?"ელ-ფოსტა არასწორია":"Invalid email address","auth/user-not-found":isKa?"ეს ელ-ფოსტა რეგისტრირებული არ არის":"No account with this email","auth/wrong-password":isKa?"პაროლი არასწორია":"Incorrect password","auth/email-already-in-use":isKa?"ეს ელ-ფოსტა უკვე გამოყენებულია — შედი ანგარიშში":"Email already registered — please log in","auth/weak-password":isKa?"პაროლი მინიმუმ 6 სიმბოლო":"Password must be 6+ characters","auth/too-many-requests":isKa?"ზედმეტი მცდელობა. მოიცადე.":"Too many attempts. Please wait.","auth/network-request-failed":isKa?"ქსელის შეცდომა":"Network error","auth/unauthorized-domain":isKa?"ეს დომენი Firebase-ში დამტკიცებული არ არის":"This domain is not authorized in Firebase","auth/popup-blocked":isKa?"ბრაუზერმა ფანჯარა დაბლოკა":"Your browser blocked the popup"};return m[code]||(isKa?`შეცდომა: ${code}`:`Error: ${code}`);};
  // New accounts are always students. Choosing "Teach" sends the person to the application form for review.
  const ensureUserRow=async(fu,displayName,emailAddr)=>{
    const existing=await findUserRow(fu.uid);
    if(existing){
      await supabase.from("users").update({name:displayName,email:emailAddr}).eq("firebase_uid",fu.uid);
      return{role:existing.role||"student",id:existing.id};
    }
    const{data:newU}=await safeInsert("users",{firebase_uid:fu.uid,phone:fu.uid,name:displayName,email:emailAddr,role:"student"},true);
    return{role:newU?.role||"student",id:newU?.id||null};
  };
  const signInGoogle=async()=>{
    setGLoading(true);setErr("");
    try{
      const result=await signInWithPopup(fbAuth,googleProvider);const u=result.user;
      const displayName=u.displayName||(u.email||"").split("@")[0];
      const row=await ensureUserRow(u,displayName,u.email);
      onAuth({name:displayName,email:u.email,uid:u.uid,role:row.role,id:row.id,intent:mode==="signup"&&role==="tutor"?"teach":null});
    }catch(e){if(e.code!=="auth/popup-closed-by-user"&&e.code!=="auth/cancelled-popup-request")setErr(getErr(e.code));}
    setGLoading(false);
  };
  const handleSubmit=async()=>{
    setErr("");setInfo("");
    if(!email||!pw){setErr(isKa?"შეავსე ყველა ველი":"Please fill in all fields");return;}
    if(mode==="signup"){
      if(!name.trim()){setErr(isKa?"შეიყვანე სახელი":"Please enter your name");return;}
      if(pw.length<6){setErr(isKa?"პაროლი მინიმუმ 6 სიმბოლო":"Password must be 6+ characters");return;}
      if(pw!==pw2){setErr(isKa?"პაროლები არ ემთხვევა":"Passwords do not match");return;}
      if(!agree){setErr(isKa?"დაადასტურე პირობებზე თანხმობა":"Please accept the Terms and Privacy Policy");return;}
    }
    setLoading(true);
    try{
      const{createUserWithEmailAndPassword,signInWithEmailAndPassword,updateProfile}=await import("firebase/auth");
      let fu;
      if(mode==="signup"){const c=await createUserWithEmailAndPassword(fbAuth,email.trim(),pw);fu=c.user;await updateProfile(fu,{displayName:name.trim()});}
      else{const c=await signInWithEmailAndPassword(fbAuth,email.trim(),pw);fu=c.user;}
      const displayName=mode==="signup"?name.trim():(fu.displayName||email.split("@")[0]);
      const row=await ensureUserRow(fu,displayName,email.trim());
      onAuth({name:displayName,email:email.trim(),uid:fu.uid,role:row.role,id:row.id,intent:mode==="signup"&&role==="tutor"?"teach":null});
    }catch(e){console.error(e.code,e.message);setErr(getErr(e.code));}
    setLoading(false);
  };
  const resetPassword=async()=>{
    setErr("");setInfo("");
    if(!email.trim()){setErr(isKa?"ჯერ შეიყვანე ელ-ფოსტა":"Enter your email first");return;}
    try{const{sendPasswordResetEmail}=await import("firebase/auth");await sendPasswordResetEmail(fbAuth,email.trim());setInfo(isKa?"პაროლის აღდგენის ბმული გამოგზავნილია ელ-ფოსტაზე.":"Password reset link sent to your email.");}
    catch(e){setErr(getErr(e.code));}
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9996,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:32,width:"100%",maxWidth:420,boxShadow:C.shadowLg,border:`2px solid ${C.border}`,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><Logo onClick={()=>{}}/><button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:34,height:34,fontSize:18,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button></div>
        <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:4}}>{mode==="login"?t.lt:t.st2}</div>
        <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,marginBottom:20}}>{mode==="login"?<>{isKa?"არ გაქვს ანგარიში? ":"No account? "}<span style={{color:C.primary,cursor:"pointer",fontWeight:900,textDecoration:"underline"}} onClick={()=>{setMode("signup");setErr("");setInfo("");}}>{isKa?"შექმნა":"Sign up"}</span></>:<>{isKa?"უკვე გაქვს? ":"Have an account? "}<span style={{color:C.primary,cursor:"pointer",fontWeight:900,textDecoration:"underline"}} onClick={()=>{setMode("login");setErr("");setInfo("");}}>{isKa?"შესვლა":"Log in"}</span></>}</div>
        {mode==="signup"&&<div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:8}}>{isKa?"მე მინდა":"I want to"}</label><div style={{display:"flex",gap:8}}>{[["student",isKa?"სწავლა":"Learn"],["tutor",isKa?"სწავლება":"Teach"]].map(([v,l])=>(<button key={v} onClick={()=>setRole(v)} style={{flex:1,padding:"13px",border:`2px solid ${role===v?C.accent:C.border}`,borderRadius:C.radius,background:role===v?C.accentLight:C.bg2,color:role===v?C.accent:C.muted,fontSize:14,cursor:"pointer",fontFamily:C.fb,fontWeight:900,transition:"all 0.15s"}}>{l}</button>))}</div>{role==="tutor"&&<div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600,marginTop:8,lineHeight:1.5}}>{isKa?"ანგარიშის შექმნის შემდეგ შეავსებ მასწავლებლის განაცხადს. ჩვენი გუნდი გადაამოწმებს და დაგიდასტურებს.":"After creating your account you'll fill in a short teacher application. Our team verifies every teacher before approval."}</div>}</div>}
        <button onClick={signInGoogle} disabled={gLoading} style={{width:"100%",padding:"13px",background:"#fff",border:`2px solid ${C.border}`,borderRadius:C.radiusLg,fontSize:14,fontFamily:C.fb,fontWeight:800,cursor:gLoading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,color:C.text,transition:"all 0.15s",opacity:gLoading?0.6:1}} onMouseEnter={e=>{if(!gLoading)e.currentTarget.style.borderColor=C.primary;}} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>{gLoading?"...":<><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.05 29.5 1 24 1 14.82 1 7.07 6.48 3.58 14.18l7.09 5.51C12.3 13.56 17.67 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.96-2.2 5.47-4.68 7.15l7.19 5.59C43.18 37.27 46.5 31.32 46.5 24.5z"/><path fill="#FBBC05" d="M10.67 28.31A14.6 14.6 0 0 1 9.5 24c0-1.5.26-2.95.71-4.31l-7.09-5.51A23.93 23.93 0 0 0 0 24c0 3.87.92 7.53 2.54 10.77l8.13-6.46z"/><path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.94l-7.19-5.59C28.5 37.96 26.35 38.5 24 38.5c-6.33 0-11.7-4.06-13.33-9.69l-8.13 6.46C6.07 42.52 14.46 47 24 47z"/></svg>{isKa?"Google-ით შესვლა":"Continue with Google"}</>}</button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700}}>{isKa?"ან ელ-ფოსტით":"or with email"}</span><div style={{flex:1,height:1,background:C.border}}/></div>
        {mode==="signup"&&<Inp label={isKa?"სახელი და გვარი":"Full name"} value={name} onChange={e=>setName(e.target.value)}/>}
        <Inp label={isKa?"ელ-ფოსტა":"Email"} type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/>
        <Inp label={isKa?"პაროლი":"Password"} type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}}/>
        {mode==="login"&&<div style={{textAlign:"right",marginTop:-8,marginBottom:14}}><button onClick={resetPassword} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:12,fontWeight:800,cursor:"pointer",padding:0}}>{isKa?"დაგავიწყდა პაროლი?":"Forgot password?"}</button></div>}
        {mode==="signup"&&<Inp label={isKa?"პაროლის დადასტურება":"Confirm password"} type="password" value={pw2} onChange={e=>setPw2(e.target.value)}/>}
        {mode==="signup"&&<div style={{background:C.bg2,borderRadius:C.radius,padding:"12px 16px",marginBottom:16,fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600,lineHeight:1.6,border:`2px solid ${agree?C.primary+"55":C.border}`}}><label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}><input type="checkbox" checked={agree} onChange={e=>{setAgree(e.target.checked);setErr("");}} style={{marginTop:2,flexShrink:0,width:16,height:16,accentColor:C.primary}}/><span>{isKa?"ვადასტურებ, 18+ ვარ ან მაქვს მშობლის თანხმობა. ვეთანხმები ":"I confirm I'm 18+ or have parental consent. I agree to the "}<span style={{color:C.primary,fontWeight:800}}>{isKa?"მომსახურების პირობებს":"Terms"}</span>{" & "}<span style={{color:C.primary,fontWeight:800}}>{isKa?"კონფიდენციალურობის პოლიტიკას":"Privacy Policy"}</span>.</span></label></div>}
        {err&&<div style={{background:C.redLight,border:`2px solid ${C.red}33`,borderRadius:C.radius,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
        {info&&<div style={{background:C.okLight,border:`2px solid ${C.ok}44`,borderRadius:C.radius,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#3B8A00",fontFamily:C.fb,fontWeight:700}}>✓ {info}</div>}
        <PBtn onClick={handleSubmit} full loading={loading} size="lg">{mode==="login"?(isKa?"შესვლა":"Log in"):(isKa?"ანგარიშის შექმნა":"Create account")}</PBtn>
      </div>
    </div>
  );
};

const PayModal=({item,slot,lang,user,onSuccess,onClose})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [card,setCard]=useState("");const [exp,setExp]=useState("");const [cvv,setCvv]=useState("");
  const [isGift,setIsGift]=useState(false);const [gN,setGN]=useState("");const [gE,setGE]=useState("");const [gM,setGM]=useState("");
  const [loading,setLoading]=useState(false);const [done,setDone]=useState(false);const [err,setErr]=useState("");
  // Trial price only applies to the first lesson with this teacher
  const [isFirst,setIsFirst]=useState(true);
  const teacherName=item.name||item.teacher||"";
  useEffect(()=>{
    if(!user?.uid||item.pkgPrice||!item.trial)return;
    let q=supabase.from("bookings").select("id").eq("student_firebase_uid",user.uid).limit(1);
    q=item.firebase_uid?q.eq("teacher_firebase_uid",item.firebase_uid):q.eq("teacher_name",teacherName);
    q.then(({data})=>{if(data&&data.length)setIsFirst(false);});
  },[]);
  const useTrial=!item.pkgPrice&&!!item.trial&&isFirst;
  const price=item.pkgPrice||(useTrial?item.trial:item.price);
  const fmt=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtE=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?d.slice(0,2)+" / "+d.slice(2):d;};
  const roomHash=(str)=>{let h=0;for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}return Math.abs(h).toString(36);};
  const pay=async()=>{
    if(card.length<19||exp.length<7||cvv.length<3){setErr(isKa?"შეავსე ბარათის მონაცემები":"Please complete the card details");return;}
    if(!user?.uid){setErr(isKa?"ჯერ შედი ანგარიშში":"Please log in first");return;}
    setLoading(true);setErr("");
    try{
      // Make sure nobody booked this exact time a moment ago
      if(item.firebase_uid&&slotDate(slot)){
        const{data:taken}=await supabase.from("bookings").select("id").eq("teacher_firebase_uid",item.firebase_uid).eq("slot",slot).eq("status","confirmed").limit(1);
        if(taken&&taken.length){setErr(isKa?"ეს დრო უკვე დაჯავშნილია. აირჩიე სხვა.":"This time was just booked. Please pick another.");setLoading(false);return;}
      }
      const roomName=`cl-${roomHash(teacherName+(slot||"")+user.uid)}-${roomHash(String(Date.now()))}`.slice(0,35);
      const{data:row,error}=await safeInsert("bookings",{
        student_firebase_uid:user.uid,student_email:user.email||null,student_name:user.name||null,
        teacher_name:teacherName||null,teacher_email:item.email||null,teacher_firebase_uid:item.firebase_uid||null,
        skill:item.skill||item.title||null,slot:slot||null,price,is_trial:useTrial,status:"confirmed",video_room:roomName,
        gift_recipient_name:isGift?gN||null:null,gift_recipient_email:isGift?gE||null:null,gift_message:isGift?gM||null:null,
      },true);
      if(error)throw error;
      sendEmail("booking_confirmed",{to:user.email,teacher:teacherName,skill:item.skill||item.title,slot,price});
      if(item.email)sendEmail("new_booking",{to:item.email,student:user.name,skill:item.skill||item.title,slot,price});
      setDone(true);
      setTimeout(()=>onSuccess(row),1400);
    }catch(e){
      console.error(e);
      setErr(isKa?"ჯავშანი ვერ შეინახა. თანხა არ ჩამოგეჭრა. სცადე ხელახლა.":"Your booking could not be saved and you were not charged. Please try again.");
    }
    setLoading(false);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:28,width:"100%",maxWidth:440,boxShadow:C.shadowLg,border:`2px solid ${C.border}`,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb}}>{t.pyt}</div>
          <button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:32,height:32,fontSize:16,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button>
        </div>
        {!done?<>
          <div style={{background:C.primaryLight,borderRadius:C.radius,padding:16,marginBottom:18,display:"flex",alignItems:"center",gap:14}}>
            <Av initials={item.av||initials(teacherName)} src={item.photo} bg={CAT_COLORS[item.cat]||C.primary} size={48}/>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:C.fb}}>{t.pyw} {teacherName}</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2}}>{slot||item.skill}</div>
              {useTrial&&<div style={{fontSize:11,color:C.accent,fontFamily:C.fb,fontWeight:900,marginTop:3}}>🎯 {isKa?"საცდელი გაკვეთილი":"Trial lesson"}</div>}
            </div>
            <div style={{fontSize:26,fontWeight:900,color:C.accent,fontFamily:C.fb}}>₾{price}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:C.bg2,borderRadius:C.radius,cursor:"pointer",marginBottom:isGift?8:16,border:`2px solid ${isGift?C.accent:C.border}`}} onClick={()=>setIsGift(g=>!g)}>
            <div style={{width:22,height:22,borderRadius:7,border:`2px solid ${isGift?C.accent:C.border}`,background:isGift?C.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{isGift&&<span style={{color:"#fff",fontSize:13,fontWeight:900}}>✓</span>}</div>
            <span style={{fontSize:13,fontFamily:C.fb,fontWeight:700,color:C.mid}}>{t.gt}</span>
          </div>
          {isGift&&<div style={{background:C.bg2,borderRadius:C.radius,padding:"14px 16px",marginBottom:14}}>
            <Inp label={t.gn} value={gN} onChange={e=>setGN(e.target.value)}/>
            <Inp label={t.ge} type="email" value={gE} onChange={e=>setGE(e.target.value)}/>
            <Inp label={t.gm} value={gM} onChange={e=>setGM(e.target.value)} rows={2}/>
          </div>}
          <div style={{background:C.bg2,borderRadius:C.radius,padding:"14px 16px",marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:17,fontWeight:900,color:C.text,fontFamily:C.fb}}><span>{t.pytot}</span><span style={{color:C.accent}}>₾{price}</span></div>
          </div>
          <Inp label={t.pyc} value={card} onChange={e=>{setCard(fmt(e.target.value));setErr("");}} placeholder="1234 5678 9012 3456"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp label={t.pye} value={exp} onChange={e=>{setExp(fmtE(e.target.value));setErr("");}} placeholder="MM / YY"/>
            <Inp label={t.pycv} value={cvv} onChange={e=>{setCvv(e.target.value.replace(/\D/g,"").slice(0,4));setErr("");}} placeholder="CVV"/>
          </div>
          {err&&<div style={{background:C.redLight,border:`2px solid ${C.red}33`,borderRadius:C.radius,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
          <PBtn onClick={pay} full loading={loading} disabled={card.length<19} size="lg">{t.pyb} ₾{price}</PBtn>
          <div style={{textAlign:"center",fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:12}}>{t.pysc}</div>
        </>:(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Hedgehog size={90}/></div>
            <div style={{fontSize:24,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:6}}>{t.pyok}</div>
            <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{isKa?"შენი გზა დაიწყო!":"Your journey begins!"}</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Real two-way messaging (Supabase table: chat_messages) ───────────
// peer = the other person: { uid, name, email, av, color, resp, demo }
const MsgModal=({peer,user,lang,onClose})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [msgs,setMsgs]=useState([]);const [input,setInput]=useState("");
  const [loading,setLoading]=useState(true);const [sending,setSending]=useState(false);const [err,setErr]=useState("");
  const listRef=useRef(null);
  const me=user?.uid;
  const canChat=!!me&&!!peer?.uid&&peer.uid!==me&&!peer.demo;
  const cid=canChat?convoId(me,peer.uid):null;
  const load=async(first)=>{
    if(!cid)return;
    const{data,error}=await supabase.from("chat_messages").select("*").eq("conversation_id",cid).order("created_at",{ascending:true});
    if(error){if(first)setErr(isKa?"შეტყობინებები ვერ ჩაიტვირთა.":"Could not load messages.");}
    else if(data){
      setMsgs(prev=>{const pending=prev.filter(m=>m._pending&&!data.find(d=>d.body===m.body&&d.sender_uid===m.sender_uid));return[...data,...pending];});
      if(data.some(m=>m.receiver_uid===me&&!m.read))supabase.from("chat_messages").update({read:true}).eq("conversation_id",cid).eq("receiver_uid",me).eq("read",false).then(()=>{});
    }
    if(first)setLoading(false);
  };
  useEffect(()=>{
    if(!canChat){setLoading(false);return;}
    load(true);
    const id=setInterval(()=>load(false),4000);
    return()=>clearInterval(id);
  },[cid]);
  useEffect(()=>{if(listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight;},[msgs.length]);
  const send=async()=>{
    const body=input.trim();
    if(!body||!canChat||sending)return;
    setSending(true);setErr("");setInput("");
    const firstContact=msgs.length===0;
    const temp={id:"tmp"+Date.now(),sender_uid:me,receiver_uid:peer.uid,body,created_at:new Date().toISOString(),_pending:true};
    setMsgs(m=>[...m,temp]);
    const{error}=await safeInsert("chat_messages",{conversation_id:cid,sender_uid:me,sender_name:user.name||null,sender_email:user.email||null,receiver_uid:peer.uid,receiver_name:peer.name||null,receiver_email:peer.email||null,body,read:false});
    if(error){console.error(error);setMsgs(m=>m.filter(x=>x.id!==temp.id));setInput(body);setErr(isKa?"შეტყობინება ვერ გაიგზავნა. სცადე ხელახლა.":"Message not sent. Please try again.");}
    else{
      if(firstContact&&peer.email)sendEmail("new_message",{to:peer.email,from:user.name||user.email,preview:body.slice(0,200)});
      load(false);
    }
    setSending(false);
  };
  const time=(iso)=>{try{const d=new Date(iso);return d.toLocaleString(isKa?"ka-GE":"en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});}catch{return "";}};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9996,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,width:"100%",maxWidth:460,boxShadow:C.shadowLg,border:`2px solid ${C.border}`,display:"flex",flexDirection:"column",height:"min(560px,90vh)"}}>
        <div style={{padding:"16px 20px",borderBottom:`2px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <Av initials={peer?.av||initials(peer?.name)} bg={peer?.color||C.primary} size={38}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{peer?.name}</div>
            {peer?.resp&&<div style={{fontSize:11,color:C.ok,fontFamily:C.fb,fontWeight:700}}>● {fmtResp(peer.resp,lang)}</div>}
          </div>
          <button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:30,height:30,fontSize:16,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button>
        </div>
        <div ref={listRef} style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
          {!canChat&&(
            <div style={{margin:"auto",textAlign:"center",color:C.muted,fontFamily:C.fb,fontSize:14,fontWeight:600,lineHeight:1.6,maxWidth:300}}>
              {peer?.demo
                ?(isKa?"ეს სანიმუშო პროფილია. მიმოწერა ხელმისაწვდომია რეალურ, გადამოწმებულ მასწავლებლებთან.":"This is a sample profile. Messaging is available with real, verified teachers.")
                :peer?.uid===me?(isKa?"საკუთარ თავს ვერ მისწერ.":"You can't message yourself.")
                :(isKa?"ამ მასწავლებელთან მიმოწერა ჯერ შეუძლებელია.":"Messaging isn't available for this teacher yet.")}
            </div>
          )}
          {canChat&&loading&&<div style={{margin:"auto",color:C.muted,fontFamily:C.fb,fontSize:13}}>{isKa?"იტვირთება...":"Loading..."}</div>}
          {canChat&&!loading&&msgs.length===0&&(
            <div style={{margin:"auto",textAlign:"center",color:C.muted,fontFamily:C.fb,fontSize:13,fontWeight:600,lineHeight:1.6,maxWidth:280}}>
              {isKa?`მისწერე ${peer.name}-ს — ჰკითხე დროზე, დონეზე ან გაკვეთილის ფორმატზე.`:`Say hi to ${peer.name} — ask about times, your level or how lessons work.`}
            </div>
          )}
          {msgs.map(m=>{const mine=m.sender_uid===me;return(
            <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start"}}>
              <div style={{background:mine?C.accent:C.bg2,color:mine?"#fff":C.text,borderRadius:mine?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",maxWidth:"78%",fontSize:13,fontFamily:C.fb,lineHeight:1.55,fontWeight:600,whiteSpace:"pre-wrap",wordBreak:"break-word",opacity:m._pending?0.6:1}}>{m.body}</div>
              <div style={{fontSize:10,color:C.muted,fontFamily:C.fb,marginTop:3}}>{m._pending?(isKa?"იგზავნება...":"Sending..."):time(m.created_at)}{mine&&!m._pending&&m.read?" · ✓✓":""}</div>
            </div>
          );})}
        </div>
        {err&&<div style={{margin:"0 16px 8px",background:C.redLight,borderRadius:C.radius,padding:"8px 12px",fontSize:12,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
        <div style={{padding:"12px 16px",borderTop:`2px solid ${C.border}`,display:"flex",gap:10}}>
          <input value={input} disabled={!canChat} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={t.mph}
            style={{flex:1,padding:"11px 16px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,fontSize:13,fontFamily:C.fb,color:C.text,outline:"none",opacity:canChat?1:0.5}}
            onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          <PBtn onClick={send} size="sm" disabled={!canChat||!input.trim()} loading={sending}>{t.ms}</PBtn>
        </div>
      </div>
    </div>
  );
};

// Inbox: every conversation the logged-in person is part of
const Inbox=({user,lang,onOpen,refreshKey})=>{
  const isKa=lang==="ka";
  const [convos,setConvos]=useState([]);const [loading,setLoading]=useState(true);const [err,setErr]=useState("");
  const me=user?.uid;
  const load=async()=>{
    if(!me){setLoading(false);return;}
    const{data,error}=await supabase.from("chat_messages").select("*").or(`sender_uid.eq.${me},receiver_uid.eq.${me}`).order("created_at",{ascending:false}).limit(500);
    if(error){setErr(isKa?"შეტყობინებები ვერ ჩაიტვირთა. შეამოწმე, რომ Supabase-ის განახლება გაშვებულია.":"Could not load messages. Make sure the Supabase update has been run.");setLoading(false);return;}
    const map={};
    (data||[]).forEach(m=>{
      if(!map[m.conversation_id]){
        const mine=m.sender_uid===me;
        map[m.conversation_id]={cid:m.conversation_id,last:m,unread:0,peer:{uid:mine?m.receiver_uid:m.sender_uid,name:(mine?m.receiver_name:m.sender_name)||(isKa?"მომხმარებელი":"User"),email:mine?m.receiver_email:m.sender_email}};
      }
      if(m.receiver_uid===me&&!m.read)map[m.conversation_id].unread++;
    });
    setConvos(Object.values(map));setLoading(false);
  };
  useEffect(()=>{load();const id=setInterval(load,10000);return()=>clearInterval(id);},[me,refreshKey]);
  if(loading)return <div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb}}>{isKa?"იტვირთება...":"Loading..."}</div>;
  if(err)return <div style={{background:C.redLight,borderRadius:C.radius,padding:"12px 16px",fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>;
  if(!convos.length)return(
    <div style={{textAlign:"center",padding:"40px 24px"}}>
      <div style={{fontSize:40,marginBottom:10}}>💬</div>
      <div style={{fontSize:16,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:6}}>{isKa?"შეტყობინებები ჯერ არ არის":"No messages yet"}</div>
      <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{isKa?"მასწავლებლის პროფილიდან შეგიძლია მისწერო.":"You can message a teacher from their profile."}</div>
    </div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {convos.map(c=>(
        <div key={c.cid} onClick={()=>onOpen({...c.peer,av:initials(c.peer.name)})}
          style={{background:c.unread?C.accentLight:C.bg2,border:`2px solid ${c.unread?C.accent+"66":C.border}`,borderRadius:C.radiusLg,padding:"14px 18px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",transition:"border 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=c.unread?C.accent+"66":C.border}>
          <Av initials={initials(c.peer.name)} bg={C.primary} size={42}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{c.peer.name}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.last.sender_uid===me?(isKa?"შენ: ":"You: "):""}{c.last.body}</div>
          </div>
          {c.unread>0&&<div style={{minWidth:22,height:22,borderRadius:11,background:C.accent,color:"#fff",fontSize:11,fontWeight:900,fontFamily:C.fb,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 6px"}}>{c.unread}</div>}
        </div>
      ))}
    </div>
  );
};

const TeacherProfileEditor=({lang,user,onBack})=>{
  const isKa=lang==="ka";
  const [f,setF]=useState({name:user?.name||"",cat:"school",skill:"",skill_ka:"",price:"40",trial_price:"15",bio:"",bio_ka:"",video:"",online:true,offline:false,speaks:"Georgian",response_time:"2 hrs",photo_url:""});
  const [slots,setSlots]=useState([]);
  const [uploading,setUploading]=useState(false);
  const onPhoto=async(e)=>{
    const file=e.target.files?.[0]; e.target.value="";
    if(!file)return;
    if(!file.type.startsWith("image/")){setErr(isKa?"აირჩიე ფოტო (JPG ან PNG).":"Please choose a photo (JPG or PNG).");return;}
    if(file.size>15*1024*1024){setErr(isKa?"ფოტო ძალიან დიდია (მაქს. 15MB).":"Photo is too large (max 15MB).");return;}
    setUploading(true);setErr("");
    try{
      const uid=user?.uid||user?.phone;
      const blob=await resizeImage(file);
      const path=`${String(uid).replace(/[^a-zA-Z0-9_-]/g,"_")}.jpg`;
      const{error}=await supabase.storage.from(PHOTO_BUCKET).upload(path,blob,{upsert:true,contentType:"image/jpeg",cacheControl:"3600"});
      if(error)throw error;
      const{data}=supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      const url=`${data.publicUrl}?v=${Date.now()}`;
      setF(p=>({...p,photo_url:url}));
      await safeUpdate("teacher_profiles",{photo_url:url},{firebase_uid:uid});
    }catch(e2){console.error(e2);setErr((isKa?"ფოტო ვერ აიტვირთა: ":"Photo upload failed: ")+(e2?.message||""));}
    setUploading(false);
  };
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const [savedOk,setSavedOk]=useState(false);
  const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const times=["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00"];
  const CATS=[{id:"school",label:"School Subjects",lka:"სკოლის საგნები"},{id:"music",label:"Music & Vocals",lka:"მუსიკა და ვოკალი"},{id:"arts",label:"Arts & Crafts",lka:"ხელოვნება"},{id:"floristry",label:"Floristry & Garden",lka:"ფლორისტიკა"},{id:"fitness",label:"Fitness & Wellness",lka:"ფიტნესი"},{id:"dance",label:"Dance",lka:"ცეკვა"},{id:"cooking",label:"Food & Cooking",lka:"კულინარია"},{id:"tech",label:"Tech & Business",lka:"ტექნოლოგია"},{id:"photo",label:"Photography & Film",lka:"ფოტო და ვიდეო"},{id:"languages",label:"Languages",lka:"ენები"},{id:"beauty",label:"Beauty & Style",lka:"სილამაზე"},{id:"culture",label:"Georgian Culture",lka:"ქართული კულტურა"},{id:"mind",label:"Mind & Creativity",lka:"გონება და შემოქმედება"}];

  useEffect(()=>{
    const load=async()=>{
      setLoading(true);
      try{
        const uid=user?.uid||user?.phone;
        const{data}=await supabase.from("teacher_profiles").select("*").eq("firebase_uid",uid).limit(1).maybeSingle();
        if(data){
          setF({name:data.name||user?.name||"",cat:data.category||"school",skill:data.skill||"",skill_ka:data.skill_ka||"",price:String(data.price||40),trial_price:String(data.trial_price||15),bio:data.bio||"",bio_ka:data.bio_ka||"",video:data.video_url||"",online:data.online!==false,offline:data.offline||false,speaks:(data.speaks||["Georgian"]).join(", "),response_time:data.response_time||"2 hrs",photo_url:data.photo_url||""});
          const{data:sData}=await supabase.from("teacher_slots").select("slot").eq("firebase_uid",uid);
          if(sData) setSlots(sData.map(s=>s.slot));
        }
      }catch(e){}
      setLoading(false);
    };
    load();
  },[]);

  const toggleSlot=(day,time)=>{
    const s=`${day} ${time}`;
    setSlots(prev=>prev.includes(s)?prev.filter(x=>x!==s):[...prev,s]);
  };

  const save=async()=>{
    if(!f.name||!f.skill_ka||!f.price||!f.bio_ka){setErr(isKa?"შეავსე სავალდებულო ველები (*)":"Please fill in required fields (*)");return;}
    setSaving(true);setErr("");
    try{
      const uid=user?.uid||user?.phone;
      const{error}=await safeWrite(r=>supabase.from("teacher_profiles").upsert(r,{onConflict:"firebase_uid"}),{firebase_uid:uid,name:f.name,email:user?.email||null,category:f.cat,skill:f.skill||f.skill_ka,skill_ka:f.skill_ka||f.skill,price:parseInt(f.price),trial_price:parseInt(f.trial_price||15),bio:f.bio||f.bio_ka,bio_ka:f.bio_ka||f.bio,video_url:f.video||null,online:f.online,offline:f.offline,speaks:f.speaks.split(",").map(s=>s.trim()).filter(Boolean),response_time:f.response_time||"2 hrs",photo_url:f.photo_url||null,active:true});
      if(error) throw error;
      await supabase.from("teacher_slots").delete().eq("firebase_uid",uid);
      if(slots.length>0) await supabase.from("teacher_slots").insert(slots.map(s=>({firebase_uid:uid,slot:s})));
      setSavedOk(true);setTimeout(()=>setSavedOk(false),3000);
    }catch(e){console.error(e);setErr((isKa?"შეცდომა შენახვისას: ":"Error saving: ")+(e?.message||""));}
    setSaving(false);
  };

  if(loading) return <div style={{textAlign:"center",padding:60,color:C.muted,fontFamily:C.fb,fontSize:15}}>Loading...</div>;



  return(
    <div style={{maxWidth:700,margin:"0 auto",padding:"40px 24px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:24,padding:0,fontWeight:900}}>← {isKa?"უკან":"Back"}</button>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
        <div style={{fontSize:32,fontWeight:900,color:C.text,fontFamily:C.fb}}>{isKa?"ჩემი პროფილი":"My Teacher Profile"}</div>
        <div style={{background:C.ok+"20",border:`2px solid ${C.ok}44`,borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:900,color:C.ok,fontFamily:C.fb}}>✓ {isKa?"დამტკიცებული":"Approved"}</div>
      </div>
      <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:28,fontWeight:600}}>{isKa?"შეავსე შენი პროფილი — ეს ის გვერდია, რასაც მოსწავლეები ნახავენ.":"Fill in your profile — this is what students will see."}</div>
      <div style={{background:C.bg2,borderRadius:C.radiusLg,padding:"20px 22px",marginBottom:16,border:`2px solid ${C.border}`}}><div style={{fontSize:13,fontWeight:900,color:C.primary,fontFamily:C.fb,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.8px"}}>{isKa?"ძირითადი ინფორმაცია":"Basic Info"}</div>
        <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:18}}>
          <Av initials={initials(f.name)} src={f.photo_url||null} bg={CAT_COLORS[f.cat]||C.primary} size={84}/>
          <div>
            <label style={{display:"inline-block",background:C.primary,color:"#fff",borderRadius:C.radius,padding:"9px 16px",fontSize:13,fontWeight:900,fontFamily:C.fb,cursor:uploading?"default":"pointer",opacity:uploading?0.6:1}}>
              {uploading?(isKa?"იტვირთება...":"Uploading..."):f.photo_url?(isKa?"ფოტოს შეცვლა":"Change photo"):(isKa?"📷 ფოტოს ატვირთვა":"📷 Upload photo")}
              <input type="file" accept="image/*" onChange={onPhoto} disabled={uploading} style={{display:"none"}}/>
            </label>
            <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600,marginTop:6}}>{isKa?"ნათელი ფოტო, სახე კარგად ჩანს. პროფილები ფოტოთი უფრო მეტ ჯავშანს იღებს.":"A clear, friendly photo of your face. Profiles with photos get more bookings."}</div>
          </div>
        </div>
        <Inp label={isKa?"სახელი და გვარი *":"Full name *"} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:6}}>{isKa?"კატეგორია":"Category"}</label>
            <select value={f.cat} onChange={e=>setF(p=>({...p,cat:e.target.value}))} style={{width:"100%",padding:"13px 16px",background:"#fff",border:`2px solid ${C.border}`,borderRadius:C.radius,fontSize:14,fontFamily:C.fb,color:C.text,outline:"none"}}>
              {CATS.map(c=><option key={c.id} value={c.id}>{isKa?c.lka:c.label}</option>)}
            </select>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:6}}>{isKa?"გამოხმაურების დრო":"Response time"}</label>
            <select value={f.response_time} onChange={e=>setF(p=>({...p,response_time:e.target.value}))} style={{width:"100%",padding:"13px 16px",background:"#fff",border:`2px solid ${C.border}`,borderRadius:C.radius,fontSize:14,fontFamily:C.fb,color:C.text,outline:"none"}}>
              {["30 min","1 hr","2 hrs","3 hrs","4 hrs","Same day"].map(r=><option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Inp label={isKa?"კურსი (ქართული) *":"Skill (Georgian) *"} value={f.skill_ka} onChange={e=>setF(p=>({...p,skill_ka:e.target.value}))} placeholder="მაგ: პიანო"/>
          <Inp label={isKa?"კურსი (ინგლისური)":"Skill (English)"} value={f.skill} onChange={e=>setF(p=>({...p,skill:e.target.value}))} placeholder="e.g. Piano"/>
        </div>
        <Inp label={isKa?"ენები (მძიმით)":"Languages (comma separated)"} value={f.speaks} onChange={e=>setF(p=>({...p,speaks:e.target.value}))} placeholder="Georgian, English"/>
      </div>
      <div style={{background:C.bg2,borderRadius:C.radiusLg,padding:"20px 22px",marginBottom:16,border:`2px solid ${C.border}`}}><div style={{fontSize:13,fontWeight:900,color:C.accent,fontFamily:C.fb,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.8px"}}>{isKa?"ფასი":"Pricing"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Inp label={isKa?"ფასი სესიაზე (GEL) *":"Price per session (GEL) *"} type="number" value={f.price} onChange={e=>setF(p=>({...p,price:e.target.value}))} placeholder="40"/>
          <Inp label={isKa?"საცდელი გაკვეთილი (GEL)":"Trial lesson (GEL)"} type="number" value={f.trial_price} onChange={e=>setF(p=>({...p,trial_price:e.target.value}))} placeholder="15"/>
        </div>
        <div style={{display:"flex",gap:20}}>
          {[["online",isKa?"ონლაინ":"Online"],["offline",isKa?"ოფლაინ":"In-person"]].map(([k,l])=>(
            <label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontFamily:C.fb,fontSize:14,color:C.mid,fontWeight:700}}>
              <input type="checkbox" checked={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.checked}))} style={{accentColor:C.primary}}/>{l}
            </label>
          ))}
        </div>
      </div>
      <div style={{background:C.bg2,borderRadius:C.radiusLg,padding:"20px 22px",marginBottom:16,border:`2px solid ${C.border}`}}><div style={{fontSize:13,fontWeight:900,color:"#A259FF",fontFamily:C.fb,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.8px"}}>{isKa?"შენ შესახებ":"About you"}</div>
        <Inp label={isKa?"ბიოგრაფია (ქართული) *":"Bio (Georgian) *"} value={f.bio_ka} onChange={e=>setF(p=>({...p,bio_ka:e.target.value}))} rows={3} placeholder="მოგვიყევი შენს გამოცდილებასა და სტილზე..."/>
        <Inp label={isKa?"ბიოგრაფია (ინგლისური)":"Bio (English)"} value={f.bio} onChange={e=>setF(p=>({...p,bio:e.target.value}))} rows={3} placeholder="Tell students about your experience..."/>
        <Inp label={isKa?"ინტრო ვიდეო URL":"Intro video URL (YouTube / Vimeo)"} value={f.video} onChange={e=>setF(p=>({...p,video:e.target.value}))} placeholder="https://youtube.com/watch?v=..."/>
      </div>
      <div style={{background:C.bg2,borderRadius:C.radiusLg,padding:"20px 22px",marginBottom:16,border:`2px solid ${C.border}`}}><div style={{fontSize:13,fontWeight:900,color:C.ok,fontFamily:C.fb,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.8px"}}>{isKa?"ხელმისაწვდომობა":"Availability"}</div><div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginTop:-8,marginBottom:12}}>{isKa?"ყველა დრო მიუთითე თბილისის დროით (GMT+4).":"Set all times in Tbilisi time (GMT+4)."}</div>
        <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginBottom:14,fontWeight:600}}>{isKa?"აირჩიე დრო, როდესაც ხელმისაწვდომი ხარ":"Select times when you are available"}</div>
        <div style={{overflowX:"auto"}}>
          <table style={{borderCollapse:"collapse",width:"100%",minWidth:500}}>
            <thead><tr><th style={{padding:"6px 8px",fontSize:11,fontFamily:C.fb,color:C.muted,fontWeight:700,textAlign:"left"}}></th>{days.map(d=><th key={d} style={{padding:"6px 8px",fontSize:11,fontFamily:C.fb,color:C.primary,fontWeight:900,textAlign:"center"}}>{d}</th>)}</tr></thead>
            <tbody>{times.map(time=>(
              <tr key={time}>
                <td style={{padding:"4px 8px",fontSize:11,fontFamily:C.fb,color:C.muted,fontWeight:700,whiteSpace:"nowrap"}}>{time}</td>
                {days.map(day=>{
                  const s=`${day} ${time}`;const on=slots.includes(s);
                  return(<td key={day} style={{padding:"3px 4px",textAlign:"center"}}>
                    <div onClick={()=>toggleSlot(day,time)} style={{width:28,height:28,borderRadius:8,background:on?C.primary:C.border,cursor:"pointer",margin:"0 auto",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}
                      onMouseEnter={e=>!on&&(e.currentTarget.style.background=C.primaryLight)}
                      onMouseLeave={e=>!on&&(e.currentTarget.style.background=C.border)}>
                      {on&&<span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
                    </div>
                  </td>);
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:10,fontWeight:600}}>{slots.length} {isKa?"სლოტი არჩეული":"slots selected"}</div>
      </div>
      {err&&<div style={{background:C.redLight,border:`2px solid ${C.red}33`,borderRadius:C.radius,padding:"11px 16px",marginBottom:14,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
      {savedOk&&<div style={{background:C.okLight,border:`2px solid ${C.ok}44`,borderRadius:C.radius,padding:"11px 16px",marginBottom:14,fontSize:13,color:C.ok,fontFamily:C.fb,fontWeight:700}}>✓ {isKa?"პროფილი შენახულია!":"Profile saved!"}</div>}
      <PBtn onClick={save} full loading={saving} size="lg">{isKa?"პროფილის შენახვა":"Save profile"}</PBtn>
    </div>
  );
};

const TeachForm=({lang,user,onBack,onDone,wasRejected})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [f,setF]=useState({name:user?.name||"",phone:"",cat:"school",skill:"",experience:"",price:"",bio:"",qualifications:"",links:"",video:"",online:true,offline:false,idConsent:false,taxAck:false});
  const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const submit=async()=>{
    setErr("");
    if(!f.name.trim()||!f.phone.trim()||!f.skill.trim()||!f.price||!f.bio.trim()||!f.qualifications.trim()){setErr(isKa?"შეავსე ყველა სავალდებულო ველი (*)":"Please fill in all required fields (*)");return;}
    if(!(parseInt(f.price)>0)){setErr(isKa?"მიუთითე სწორი ფასი":"Please enter a valid price");return;}
    if(!f.online&&!f.offline){setErr(isKa?"აირჩიე ონლაინ ან ოფლაინ":"Choose online and/or in-person");return;}
    if(!f.idConsent||!f.taxAck){setErr(isKa?"მონიშნე ორივე დადასტურება":"Please tick both confirmations");return;}
    if(!user?.uid){setErr(isKa?"ჯერ შედი ანგარიშში":"Please log in first");return;}
    setLoading(true);
    try{
      const{error}=await safeInsert("teacher_applications",{
        firebase_uid:user.uid,name:f.name.trim(),email:user.email||null,phone:f.phone.trim(),category:f.cat,skill:f.skill.trim(),
        experience_years:parseInt(f.experience)||null,price:parseInt(f.price),bio:f.bio.trim(),qualifications:f.qualifications.trim(),links:f.links.trim()||null,
        video_url:f.video.trim()||null,online:f.online,offline:f.offline,id_consent:f.idConsent,tax_ack:f.taxAck,status:"pending",
      });
      if(error)throw error;
      sendEmail("application_received",{name:f.name,email:user.email,phone:f.phone,skill:f.skill,price:f.price,bio:f.bio,qualifications:f.qualifications,links:f.links});
      onDone();
    }catch(e){console.error(e);setErr((isKa?"განაცხადი ვერ გაიგზავნა: ":"Could not send your application: ")+(e?.message||(isKa?"სცადე ხელახლა.":"please try again.")));}
    setLoading(false);
  };
  const chk=(k,label)=>(<label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",fontFamily:C.fb,fontSize:13,color:C.mid,fontWeight:700,lineHeight:1.5,marginBottom:12}}><input type="checkbox" checked={f[k]} onChange={e=>set(k,e.target.checked)} style={{marginTop:3,width:16,height:16,flexShrink:0,accentColor:C.primary}}/>{label}</label>);
  return(
    <div style={{maxWidth:640,margin:"0 auto",padding:"40px 24px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:24,padding:0,fontWeight:900}}>← {t.back}</button>
      <div style={{fontSize:32,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:6}}>{t.tt}</div>
      <div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:20,lineHeight:1.6}}>{t.ts}</div>
      {wasRejected&&<div style={{background:C.redLight,border:`2px solid ${C.red}33`,borderRadius:C.radiusLg,padding:"12px 16px",marginBottom:20,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700,lineHeight:1.6}}>{isKa?"შენი წინა განაცხადი არ დამტკიცდა. შეგიძლია განაახლო ინფორმაცია და ხელახლა გაგზავნო.":"Your previous application wasn't approved. You can update your details and apply again."}</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>{[[t.tc1,"#1CB0F6"],[t.tc2,"#A259FF"],[t.tc3,"#58CC02"],[t.tc4,"#E9A520"]].map(([l,clr])=>(<div key={l} style={{background:clr+"15",border:`2px solid ${clr}33`,borderRadius:C.radius,padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}><div style={{width:10,height:10,borderRadius:"50%",background:clr,flexShrink:0}}/><span style={{fontFamily:C.fb,fontSize:13,color:clr,fontWeight:800}}>{l}</span></div>))}</div>
      <div style={{background:C.primaryLight,borderRadius:C.radiusLg,padding:"14px 18px",marginBottom:24,fontSize:13,color:C.primary,fontFamily:C.fb,fontWeight:700,lineHeight:1.6}}>🛡️ {isKa?"ყველა მასწავლებელს ვამოწმებთ დამტკიცებამდე: პირადობა, კვალიფიკაცია და მოკლე ვიდეო-ინტერვიუ.":"We verify every teacher before approval: ID, qualifications and a short video interview."}</div>
      <Inp label={`${t.tn} *`} value={f.name} onChange={e=>set("name",e.target.value)}/>
      <Inp label={isKa?"ტელეფონის ნომერი *":"Phone number *"} type="tel" value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="+995 5XX XXX XXX"/>
      <div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:6}}>{t.tc}</label><select value={f.cat} onChange={e=>set("cat",e.target.value)} style={{width:"100%",padding:"13px 16px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,fontSize:14,fontFamily:C.fb,color:C.text,outline:"none"}}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{lang==="ka"?c.lka:c.label}</option>)}</select></div>
      <Inp label={`${t.tsk} *`} value={f.skill} onChange={e=>set("skill",e.target.value)} placeholder={isKa?"მაგ: პიანო, ინგლისური...":"e.g. Piano, English..."}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label={isKa?"გამოცდილება (წელი)":"Experience (years)"} type="number" value={f.experience} onChange={e=>set("experience",e.target.value)} placeholder="5"/>
        <Inp label={`${t.tp} *`} type="number" value={f.price} onChange={e=>set("price",e.target.value)} placeholder="40"/>
      </div>
      <Inp label={`${t.tb} *`} value={f.bio} onChange={e=>set("bio",e.target.value)} rows={4} placeholder={isKa?"მოგვიყევი გამოცდილებასა და სწავლების სტილზე...":"Tell us about your experience and teaching style..."}/>
      <Inp label={isKa?"განათლება, სერტიფიკატები, მიღწევები *":"Education, certificates, achievements *"} value={f.qualifications} onChange={e=>set("qualifications",e.target.value)} rows={3} placeholder={isKa?"მაგ: თბილისის კონსერვატორია, 2015; CELTA სერტიფიკატი...":"e.g. Tbilisi Conservatory, 2015; CELTA certificate..."}/>
      <Inp label={isKa?"ბმულები (პორტფოლიო, LinkedIn, Instagram)":"Links (portfolio, LinkedIn, Instagram)"} value={f.links} onChange={e=>set("links",e.target.value)} placeholder="https://..."/>
      <Inp label={`${t.tv2} (${isKa?"არასავალდებულო":"optional"})`} value={f.video} onChange={e=>set("video",e.target.value)} placeholder="https://youtube.com/..."/>
      <div style={{display:"flex",gap:20,marginBottom:20}}>{[["online",t.ton],["offline",t.tof]].map(([k,l])=>(<label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontFamily:C.fb,fontSize:14,color:C.mid,fontWeight:700}}><input type="checkbox" checked={f[k]} onChange={e=>set(k,e.target.checked)} style={{accentColor:C.primary}}/>{l}</label>))}</div>
      <div style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"16px 18px 4px",marginBottom:20}}>
        {chk("idConsent",isKa?"ვადასტურებ, რომ ინფორმაცია სწორია და მზად ვარ, დავადასტურო პირადობა მოკლე ვიდეო-ზარში. *":"I confirm this information is true and I'm ready to verify my ID in a short video call. *")}
        {chk("taxAck",isKa?"მესმის, რომ ვარ დამოუკიდებელი მასწავლებელი და ჩემს გადასახადებზე თავად ვაგებ პასუხს. *":"I understand I'm an independent teacher and responsible for my own taxes. *")}
      </div>
      {err&&<div style={{background:C.redLight,border:`2px solid ${C.red}33`,borderRadius:C.radius,padding:"11px 16px",marginBottom:14,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
      <PBtn onClick={submit} full loading={loading} size="lg">{t.tsub}</PBtn>
    </div>
  );
};

const TeachPage=({lang,onBack,user,onLogin})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [status,setStatus]=useState(null);const [checkDone,setCheckDone]=useState(false);
  useEffect(()=>{
    if(!user){setCheckDone(true);return;}
    if(user.role==="tutor"){setStatus("approved");setCheckDone(true);return;}
    (async()=>{
      try{const{data}=await supabase.from("teacher_applications").select("status").eq("firebase_uid",user.uid).order("created_at",{ascending:false}).limit(1).maybeSingle();setStatus(data?.status||"none");}
      catch(e){setStatus("none");}
      setCheckDone(true);
    })();
  },[user?.uid,user?.role]);
  if(!user)return(<div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>🎓</div><div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{t.tt}</div><div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:28,lineHeight:1.6,maxWidth:360}}>{isKa?"შედი ანგარიშში ან შექმენი ანგარიში განაცხადის გასაგზავნად.":"Log in or create an account to apply as a teacher."}</div><div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}><PBtn onClick={()=>onLogin("signup")} size="lg">{isKa?"ანგარიშის შექმნა":"Create account"}</PBtn><OBtn onClick={()=>onLogin("login")} size="lg">{isKa?"შესვლა":"Log in"}</OBtn></div><button onClick={onBack} style={{marginTop:20,background:"none",border:"none",color:C.muted,fontFamily:C.fb,fontSize:13,cursor:"pointer",fontWeight:700}}>← {t.back}</button></div>);
  if(!checkDone)return<div style={{textAlign:"center",padding:60,color:C.muted,fontFamily:C.fb,fontSize:15}}>{isKa?"იტვირთება...":"Loading..."}</div>;
  if(status==="approved"||user.role==="tutor")return<TeacherProfileEditor lang={lang} user={user} onBack={onBack}/>;
  if(status==="pending")return(<div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}><div style={{fontSize:56,marginBottom:16}}>⏳</div><div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{isKa?"განაცხადი განიხილება":"Application under review"}</div><div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:12,lineHeight:1.7,maxWidth:420}}>{isKa?"შენი განაცხადი მიღებულია. ჩვენი გუნდი გადაამოწმებს მონაცემებს, დაგიკავშირდება მოკლე ვიდეო-ინტერვიუსთვის და პასუხს ელ-ფოსტაზე გამოგიგზავნის.":"Your application has been received. Our team will check your details, contact you for a short video interview and email you the result."}</div><div style={{background:C.accentLight,border:`2px solid ${C.accent}44`,borderRadius:C.radiusLg,padding:"14px 20px",fontSize:13,color:C.accent,fontFamily:C.fb,fontWeight:700,marginBottom:24,maxWidth:400}}>📧 {isKa?"პასუხი გაიგზავნება:":"Answer will be sent to:"} <strong>{user?.email}</strong></div><PBtn onClick={onBack}>{isKa?"მთავარ გვერდზე დაბრუნება":"Back to home"}</PBtn></div>);
  return<TeachForm lang={lang} user={user} onBack={onBack} wasRejected={status==="rejected"} onDone={()=>setStatus("pending")}/>;
};

const Dashboard=({user,lang,onJoinVideo,onMsg,onGoTeach,onPromote,saved,allTeachers,onOpenTeacher,onBrowse,refreshKey})=>{
  const t=T[lang];const isKa=lang==="ka";
  const isTutor=user.role==="tutor";
  const [tab,setTab]=useState(isTutor?"teaching":"upcoming");
  const [bookings,setBookings]=useState([]);
  const [teacherBookings,setTeacherBookings]=useState([]);
  const [loadingB,setLoadingB]=useState(true);
  const [loadErr,setLoadErr]=useState("");
  const [appStatus,setAppStatus]=useState(null);

  useEffect(()=>{
    loadBookings();
    if(!isTutor) checkApplication();
  },[user?.uid,user?.role,refreshKey]);

  const loadBookings=async()=>{
    setLoadingB(true);setLoadErr("");
    try{
      const uid=user.uid;
      const{data:sData,error}=await supabase.from("bookings").select("*").eq("student_firebase_uid",uid).order("created_at",{ascending:false});
      if(error)throw error;
      setBookings(sData||[]);
      if(isTutor){
        const{data:tData}=await supabase.from("bookings").select("*").eq("teacher_firebase_uid",uid).order("created_at",{ascending:false});
        setTeacherBookings(tData||[]);
      }
    }catch(e){console.error(e);setLoadErr(isKa?"ჯავშნები ვერ ჩაიტვირთა.":"Could not load your bookings.");}
    setLoadingB(false);
  };

  const checkApplication=async()=>{
    try{
      const{data}=await supabase.from("teacher_applications").select("status").eq("firebase_uid",user.uid).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(data) setAppStatus(data.status);
    }catch(e){}
  };

  // Sort by lesson time: soonest first for upcoming, newest first for history
  const byTime=(a,b)=>((slotDate(a.slot)?.getTime()||0)-(slotDate(b.slot)?.getTime()||0));
  const active=(b)=>b.status!=="cancelled";
  const upcoming=bookings.filter(b=>active(b)&&!isPastBooking(b)).sort(byTime);
  const history=bookings.filter(b=>!active(b)||isPastBooking(b)).sort((a,b)=>byTime(b,a));
  const teacherUpcoming=teacherBookings.filter(b=>active(b)&&!isPastBooking(b)).sort(byTime);
  const teacherHistory=teacherBookings.filter(b=>!active(b)||isPastBooking(b)).sort((a,b)=>byTime(b,a));
  const totalEarnings=teacherHistory.filter(active).reduce((a,b)=>a+(b.price||0),0);
  const pendingEarnings=teacherUpcoming.reduce((a,b)=>a+(b.price||0),0);

  const formatSlot=(slot)=>{
    const m=String(slot||"").match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
    if(!m) return slot||"";
    const months=isKa?["იან","თებ","მარ","აპრ","მაი","ივნ","ივლ","აგვ","სექ","ოქტ","ნოე","დეკ"]:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${+m[3]} ${months[+m[2]-1]} · ${m[4]}:${m[5]}${outsideTbilisi?" "+(isKa?"თბ.":"Tbilisi"):""}${localTimeHint(slot,lang)}`;
  };
  const savedTeachers=(allTeachers||[]).filter(tv=>(saved||[]).includes(tv.id));
  const empty=(icon,title,sub,action)=>(
    <div style={{textAlign:"center",padding:"40px 24px"}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>{icon}</div>
      <div style={{fontSize:16,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:6}}>{title}</div>
      {sub&&<div style={{fontSize:13,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{sub}</div>}
      {action&&<div style={{marginTop:16}}>{action}</div>}
    </div>
  );
  // ── Cancellation (Terms §5: full refund 24h+ before; teacher cancel = always full refund)
  const [cancelId,setCancelId]=useState(null);
  const [cancelBusy,setCancelBusy]=useState(false);
  const hoursUntil=(b)=>{const d=slotDate(b.slot);return d?(d.getTime()-Date.now())/36e5:null;};
  const refundFor=(b,asTeacher)=>{if(asTeacher)return true;const h=hoursUntil(b);return h===null||h>=24;};
  const doCancel=async(b,asTeacher)=>{
    setCancelBusy(true);
    const refund=refundFor(b,asTeacher);
    const{error}=await safeUpdate("bookings",{status:"cancelled",cancelled_by:asTeacher?"teacher":"student",cancelled_at:new Date().toISOString(),refund_due:refund&&(b.price||0)>0},{id:b.id});
    setCancelBusy(false);
    if(error){alert(isKa?"გაუქმება ვერ მოხერხდა. სცადე ხელახლა.":"Could not cancel. Please try again.");return;}
    const upd=x=>x.id===b.id?{...x,status:"cancelled",cancelled_by:asTeacher?"teacher":"student"}:x;
    setBookings(prev=>prev.map(upd));setTeacherBookings(prev=>prev.map(upd));setCancelId(null);
    const data={teacher:b.teacher_name,student:b.student_name,skill:b.skill,slot:slotDate(b.slot)?`${b.slot} (Tbilisi time, GMT+4)`:b.slot,by:asTeacher?"teacher":"student",refund};
    if(b.student_email)sendEmail("booking_cancelled",{...data,to:b.student_email,audience:"student"});
    if(b.teacher_email)sendEmail("booking_cancelled",{...data,to:b.teacher_email,audience:"teacher"});
  };
  const cancelBox=(b,asTeacher)=>{
    const refund=refundFor(b,asTeacher);
    return(
      <div style={{width:"100%",background:C.white,border:`2px solid ${C.border}`,borderRadius:C.radius,padding:"12px 14px",marginTop:4}}>
        <div style={{fontSize:13,fontWeight:800,color:C.text,fontFamily:C.fb,marginBottom:4}}>{isKa?"გავაუქმოთ ეს გაკვეთილი?":"Cancel this lesson?"}</div>
        <div style={{fontSize:12,color:refund?C.ok:"#D4380D",fontFamily:C.fb,fontWeight:700,marginBottom:10}}>
          {asTeacher
            ?(isKa?"მოსწავლე მიიღებს სრულ თანხას უკან.":"The student will get a full refund.")
            :refund
              ?(isKa?"გაკვეთილამდე 24 საათზე მეტია — თანხა სრულად დაგიბრუნდება.":"More than 24 hours before the lesson — you'll get a full refund.")
              :(isKa?"გაკვეთილამდე 24 საათზე ნაკლებია — პირობების მიხედვით თანხა არ ბრუნდება.":"Less than 24 hours before the lesson — under our Terms this isn't refundable.")}
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <OBtn size="sm" onClick={()=>setCancelId(null)}>{isKa?"არა, დავტოვოთ":"Keep it"}</OBtn>
          <button disabled={cancelBusy} onClick={()=>doCancel(b,asTeacher)} style={{background:"#D4380D",color:"#fff",border:"none",borderRadius:C.radius,padding:"8px 14px",fontSize:13,fontWeight:900,fontFamily:C.fb,cursor:cancelBusy?"default":"pointer",opacity:cancelBusy?0.6:1}}>{cancelBusy?"...":(isKa?"გაუქმება":"Cancel lesson")}</button>
        </div>
      </div>
    );
  };
  const bookingRow=(b,i,asTeacher)=>{
    const person=asTeacher?(b.student_name||(isKa?"მოსწავლე":"Student")):(b.teacher_name||(isKa?"მასწავლებელი":"Teacher"));
    return(
      <div key={b.id||i} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:asTeacher?C.accent:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:900,fontFamily:C.fb,flexShrink:0}}>{initials(person)}</div>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{person}{b.is_trial&&<span style={{marginLeft:8,fontSize:10,color:C.accent,fontWeight:900}}>🎯 {isKa?"საცდელი":"Trial"}</span>}</div>
            <div style={{fontSize:12,color:C.primary,fontFamily:C.fb,fontWeight:800}}>{b.skill}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:2}}>📅 {formatSlot(b.slot)}</div>
            {asTeacher&&b.student_email&&<div style={{fontSize:11,color:C.muted,fontFamily:C.fb}}>✉️ {b.student_email}</div>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          {asTeacher&&<div style={{fontSize:16,fontWeight:900,color:C.ok,fontFamily:C.fb}}>₾{b.price}</div>}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            {asTeacher&&b.student_firebase_uid&&<OBtn size="sm" onClick={()=>onMsg({uid:b.student_firebase_uid,name:b.student_name||"Student",email:b.student_email,av:initials(b.student_name)})}>💬</OBtn>}
            {!asTeacher&&b.teacher_firebase_uid&&<OBtn size="sm" onClick={()=>onMsg({uid:b.teacher_firebase_uid,name:b.teacher_name,email:b.teacher_email,av:initials(b.teacher_name)})}>💬</OBtn>}
            <PBtn onClick={()=>onJoinVideo({name:asTeacher?(b.teacher_name||user.name):b.teacher_name,skill:b.skill,cat:"tech",av:initials(asTeacher?b.student_name:b.teacher_name),firebase_uid:b.teacher_firebase_uid||(asTeacher?user.uid:null)},b.slot,b.video_room)} size="sm">{t.dj}</PBtn>
          </div>
          {b.id&&cancelId!==b.id&&<button onClick={()=>setCancelId(b.id)} style={{background:"none",border:"none",color:C.muted,fontSize:12,fontWeight:700,fontFamily:C.fb,cursor:"pointer",padding:0,textDecoration:"underline"}}>{isKa?"გაუქმება":"Cancel"}</button>}
        </div>
        {cancelId===b.id&&cancelBox(b,asTeacher)}
      </div>
    );
  };
  const historyRow=(b,i,asTeacher)=>(
    <div key={b.id||i} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:14,minWidth:0}}>
        <div style={{width:42,height:42,borderRadius:"50%",background:asTeacher?C.accent:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:900,fontFamily:C.fb,flexShrink:0}}>{initials(asTeacher?b.student_name:b.teacher_name)}</div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{asTeacher?(b.student_name||(isKa?"მოსწავლე":"Student")):b.teacher_name}</div>
          <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2}}>{b.skill} · {formatSlot(b.slot)}</div>
        </div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        {asTeacher&&<div style={{fontSize:14,fontWeight:900,color:C.ok,fontFamily:C.fb}}>₾{b.price}</div>}
        {b.status==="cancelled"
          ?<div style={{fontSize:11,color:"#D4380D",fontFamily:C.fb,fontWeight:700}}>✕ {isKa?"გაუქმდა":"Cancelled"}{b.cancelled_by?(isKa?(b.cancelled_by==="teacher"?" (მასწავლებელმა)":" (მოსწავლემ)"):` by ${b.cancelled_by}`):""}</div>
          :<div style={{fontSize:11,color:C.ok,fontFamily:C.fb,fontWeight:700}}>✓ {isKa?"დასრულდა":"Completed"}</div>}
      </div>
    </div>
  );

  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"40px 24px"}}>
      <div style={{marginBottom:28,display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:4}}>{t.dh}</div>
          <div style={{fontSize:32,fontWeight:900,color:C.text,fontFamily:C.fb}}>{user.name} 👋</div>
        </div>
        {isTutor&&<OBtn onClick={onGoTeach} size="sm">✏️ {isKa?"ჩემი პროფილი":"Edit my profile"}</OBtn>}
      </div>

      {isTutor&&<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:24}}>
          {[[isKa?"გამომუშავებული":"Earned",`₾${totalEarnings}`,"#1CB0F6"],[isKa?"მომავალი":"Upcoming",`₾${pendingEarnings}`,"#E9A520"],[isKa?"ჯავშანი":"Bookings",`${teacherBookings.filter(active).length}`,"#A259FF"]].map(([l,v,clr])=>(
            <div key={l} style={{background:clr+"12",border:`2px solid ${clr}33`,borderRadius:C.radiusLg,padding:"20px 18px"}}>
              <div style={{fontSize:11,color:clr,fontFamily:C.fb,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>{l}</div>
              <div style={{fontSize:28,fontWeight:900,color:clr,fontFamily:C.fb}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:20}}>
          <button onClick={onPromote} style={{background:"linear-gradient(135deg,#E9A520,#FF7A00)",border:"none",borderRadius:C.radiusLg,padding:"11px 22px",fontSize:13,fontWeight:900,color:"#fff",cursor:"pointer",fontFamily:C.fb,boxShadow:"0 4px 0 #CC7700"}}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform="none"}>
            ✦ {isKa?"პროფილის პრომოცია":"Promote my profile"}
          </button>
        </div>
      </>}

      {!isTutor&&(!appStatus||appStatus==="rejected")&&(
        <div style={{background:C.primaryLight,border:`2px solid ${C.primary}33`,borderRadius:C.radiusLg,padding:"18px 20px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:C.primary,fontFamily:C.fb}}>{isKa?`გახდი მასწავლებელი ${BRAND}-ზე`:`Become a teacher on ${BRAND}`}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:3}}>{isKa?"გაუზიარე შენი ცოდნა და გამოიმუშავე.":"Share your knowledge and earn."}</div>
          </div>
          <PBtn onClick={onGoTeach} size="sm">{isKa?"განაცხადი":"Apply"}</PBtn>
        </div>
      )}

      {appStatus==="pending"&&!isTutor&&(
        <div style={{background:"#FFF8E0",border:`2px solid ${C.accent}44`,borderRadius:C.radiusLg,padding:"16px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{fontSize:24}}>⏳</div>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:C.accent,fontFamily:C.fb}}>{isKa?"განაცხადი განიხილება":"Application under review"}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:3}}>{isKa?"გადამოწმების შემდეგ ელ-ფოსტაზე მოგწერთ.":"We'll email you after verifying your details."}</div>
          </div>
        </div>
      )}

      {loadErr&&<div style={{background:C.redLight,borderRadius:C.radius,padding:"10px 14px",marginBottom:16,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {loadErr}</div>}

      <div style={{display:"flex",gap:4,borderBottom:`2px solid ${C.border}`,marginBottom:20,overflowX:"auto"}}>
        {(isTutor
          ?[["teaching",isKa?"ჩემი მოსწავლეები 👨‍🏫":"My Students 👨‍🏫"],["upcoming",isKa?"ჩემი გაკვეთილები":"My Lessons"],["inbox",t.dm],["history",isKa?"ისტორია":"History"]]
          :[["upcoming",t.du],["inbox",t.dm],["saved",isKa?"შენახული ♥":"Saved ♥"],["history",isKa?"ისტორია":"History"]]
        ).map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"12px 20px",border:"none",background:"none",fontSize:14,fontWeight:900,fontFamily:C.fb,color:tab===k?C.accent:C.muted,borderBottom:`3px solid ${tab===k?C.accent:"transparent"}`,marginBottom:-2,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{l}</button>
        ))}
      </div>

      {tab==="teaching"&&<div>
        {loadingB&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb}}>{isKa?"იტვირთება...":"Loading..."}</div>}
        {!loadingB&&teacherUpcoming.length===0&&empty(<Hedgehog size={80}/>,isKa?"ჯერ ჯავშანი არ არის":"No upcoming bookings",isKa?"როდესაც მოსწავლე დაჯავშნის, აქ გამოჩნდება.":"When a student books you, it will appear here.")}
        {!loadingB&&teacherUpcoming.map((b,i)=>bookingRow(b,i,true))}
      </div>}

      {tab==="upcoming"&&<div>
        {loadingB&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb}}>{isKa?"იტვირთება...":"Loading..."}</div>}
        {!loadingB&&upcoming.map((b,i)=>bookingRow(b,i,false))}
        {!loadingB&&upcoming.length===0&&empty(<Hedgehog size={80}/>,t.dem,null,<PBtn onClick={onBrowse} size="sm">{isKa?"მასწავლებლის პოვნა":"Find a teacher"}</PBtn>)}
      </div>}

      {tab==="inbox"&&<Inbox user={user} lang={lang} onOpen={onMsg} refreshKey={refreshKey}/>}

      {tab==="saved"&&<div>
        {savedTeachers.length===0
          ?empty(<div style={{fontSize:48}}>♡</div>,isKa?"შენახული მასწავლებელი არ არის":"No saved teachers yet",isKa?"გული დააჭირე მასწავლებლის ბარათზე.":"Tap the heart on any teacher card to save them here.",<PBtn onClick={onBrowse} size="sm">{isKa?"მასწავლებლების ძიება":"Browse teachers"}</PBtn>)
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
            {savedTeachers.map(tv=>{
              const catColor=CAT_COLORS[tv.cat]||C.primary;
              return(
                <div key={tv.id} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"16px 18px",display:"flex",gap:12,alignItems:"center"}}>
                  <Av initials={tv.av} src={tv.photo} bg={catColor} size={46}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{tv.name}</div>
                    <div style={{fontSize:12,color:catColor,fontFamily:C.fb,fontWeight:800}}>{isKa?tv.ska:tv.skill}</div>
                    <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:2}}>₾{tv.price} {t.cl}</div>
                  </div>
                  <PBtn onClick={()=>onOpenTeacher(tv)} size="sm">{isKa?"ნახვა":"View"}</PBtn>
                </div>
              );
            })}
          </div>
        }
      </div>}

      {tab==="history"&&<div>
        {loadingB&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb}}>{isKa?"იტვირთება...":"Loading..."}</div>}
        {!loadingB&&(isTutor?[...teacherHistory.map(b=>({...b,_asT:true})),...history]:history).length===0&&<div style={{textAlign:"center",padding:"32px 24px",color:C.muted,fontFamily:C.fb,fontSize:14,fontWeight:600}}>{isKa?"დასრულებული გაკვეთილი არ არის.":"No completed sessions yet."}</div>}
        {!loadingB&&(isTutor?[...teacherHistory.map(b=>({...b,_asT:true})),...history]:history).map((b,i)=>historyRow(b,i,!!b._asT))}
      </div>}
    </div>
  );
};

const LegalPage=({type,lang,onBack})=>{
  const t=T[lang];const isTos=type==="tos";
  return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"40px 24px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:24,padding:0,fontWeight:900}}>← {t.back}</button>
      <div style={{fontSize:28,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:28}}>{isTos?t.tost:t.topp}</div>
      <div style={{fontSize:14,color:C.mid,fontFamily:C.fb,lineHeight:1.9}}>
        {isTos?<>
          <p style={{marginBottom:12}}><strong>Last updated: November 2026</strong></p>
          <p style={{marginBottom:16}}>These Terms of Service govern your use of Classeli.com. By creating an account you agree to these terms.</p>{BUSINESS.name&&<p style={{marginBottom:16}}>Classeli is operated by {BUSINESS.name}{BUSINESS.id?`, identification number ${BUSINESS.id}`:""}{BUSINESS.address?`, ${BUSINESS.address}`:""}. Contact: {BUSINESS.email}{BUSINESS.phone?`, ${BUSINESS.phone}`:""}.</p>}
          <p style={{marginBottom:8}}><strong>1. Platform Role</strong></p><p style={{marginBottom:16}}>Classeli.com is a marketplace connecting independent teachers with students. We do not employ teachers. Each teacher is an independent professional.</p>
          <p style={{marginBottom:8}}><strong>2. Account Requirements</strong></p><p style={{marginBottom:16}}>You must be 18 or older. Under-18 users need parental consent. A valid email address or Google account is required.</p>
          <p style={{marginBottom:8}}><strong>3. Teacher Verification</strong></p><p style={{marginBottom:16}}>All teacher applications are manually reviewed. Before approval we verify each teacher's identity, qualifications and teaching ability in a short video interview. We may decline or remove any teacher for quality or safety reasons.</p>
          <p style={{marginBottom:8}}><strong>4. Payments and Fees</strong></p><p style={{marginBottom:16}}>Payments are processed by a licensed Georgian bank payment provider. A platform service fee applies per transaction as detailed in the teacher agreement. We do not store card details.</p>
          <p style={{marginBottom:8}}><strong>5. Cancellations and Refunds</strong></p><p style={{marginBottom:16}}>Full refund if cancelled 24+ hours before session. No refund within 24 hours unless teacher cancels. Technical failures qualify for reschedule or refund.</p>
          <p style={{marginBottom:8}}><strong>6. Prohibited Conduct</strong></p><p style={{marginBottom:16}}>Prohibited: off-platform sessions to avoid fees; sharing contact details before confirmed booking; harassment or discrimination; recording sessions without consent; multiple accounts to evade restrictions.</p>
          <p style={{marginBottom:8}}><strong>7. Safety and Reporting</strong></p><p style={{marginBottom:16}}>Reports reviewed within 24 hours. Three confirmed reports triggers automatic review. Violations may result in suspension or permanent ban.</p>
          <p style={{marginBottom:8}}><strong>8. Student Profiles</strong></p><p style={{marginBottom:16}}>Teachers may view student ratings before accepting bookings and may decline any booking without giving a reason.</p>
          <p style={{marginBottom:8}}><strong>9. Governing Law</strong></p><p>Governed by Georgian law. Disputes resolved in Tbilisi courts.</p>
        </>:<>
          <p style={{marginBottom:12}}><strong>Last updated: November 2026</strong></p>
          <p style={{marginBottom:16}}>Classeli.com protects your privacy and personal data.</p>
          <p style={{marginBottom:8}}><strong>1. Data We Collect</strong></p><p style={{marginBottom:16}}>Name, email, profile info, booking history, messages you send on the platform, ratings, and usage data. Teachers also provide a phone number and qualification details for verification.</p>
          <p style={{marginBottom:8}}><strong>2. How We Use It</strong></p><p style={{marginBottom:16}}>To operate the platform, verify identity, process payments through a licensed bank payment provider (we never see or store card details), send confirmations, maintain safety. We do not sell your data.</p>
          <p style={{marginBottom:8}}><strong>3. Teacher Verification Data</strong></p><p style={{marginBottom:16}}>Phone numbers and verification details are used only to review teacher applications. They are not shared publicly or with other users.</p>
          <p style={{marginBottom:8}}><strong>4. Your Rights</strong></p><p style={{marginBottom:16}}>Access, correct, or delete your data at privacy@classeli.com. Requests processed within 30 days.</p>
          <p style={{marginBottom:8}}><strong>5. Data Retention</strong></p><p style={{marginBottom:16}}>Data kept while account is active. Certain records kept up to 3 years per Georgian law after deletion.</p>
          <p style={{marginBottom:8}}><strong>6. Security</strong></p><p>Industry-standard encryption. Use a strong password and keep credentials private.</p>
        </>}
      </div>
    </div>
  );
};



const PromoteModal=({lang,onClose})=>{
  const t=T[lang];
  const [plan,setPlan]=useState(null);
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);
  const plans=[
    {id:"week",label:"7 days",labelKa:"7 დღე",price:25,desc:"Appear in Featured on homepage for 1 week",descKa:"1 კვირა — Featured სექციაში"},
    {id:"month",label:"30 days",labelKa:"30 დღე",price:80,desc:"Featured for a full month + Boosted badge in search",descKa:"1 თვე — Featured + Boosted ბეჯი",popular:true},
  ];
  const pay=()=>{if(!plan)return;setLoading(true);setTimeout(()=>{setLoading(false);setDone(true);},1800);};
  if(done)return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:40,maxWidth:380,width:"100%",textAlign:"center",boxShadow:C.shadowLg}}>
        <div style={{fontSize:52,marginBottom:16}}>🚀</div>
        <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>You're now featured!</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:24,lineHeight:1.6}}>Your profile will appear in the Featured section starting now.</div>
        <PBtn onClick={onClose} full>Done</PBtn>
      </div>
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:28,width:"100%",maxWidth:440,boxShadow:C.shadowLg,border:`2px solid ${C.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb}}>Promote your profile 🚀</div>
          <button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:32,height:32,fontSize:16,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button>
        </div>
        <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,marginBottom:20,lineHeight:1.6,fontWeight:600}}>Get more students by appearing in the Featured section on the homepage and in search results.</div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
          {plans.map(p=>(
            <div key={p.id} onClick={()=>setPlan(p.id)} style={{border:`2px solid ${plan===p.id?C.accent:C.border}`,borderRadius:C.radiusLg,padding:"16px 18px",cursor:"pointer",background:plan===p.id?C.accentLight:C.bg2,transition:"all 0.15s",position:"relative"}}>
              {p.popular&&<div style={{position:"absolute",top:-10,right:16,background:C.accent,color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:900,fontFamily:C.fb}}>Most popular</div>}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:15,fontWeight:900,color:C.text,fontFamily:C.fb}}>{lang==="ka"?p.labelKa:p.label}</div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:3,fontWeight:600}}>{lang==="ka"?p.descKa:p.desc}</div>
                </div>
                <div style={{fontSize:22,fontWeight:900,color:plan===p.id?C.accent:C.text,fontFamily:C.fb}}>₾{p.price}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{background:"#F0F8FF",border:`2px solid ${C.border}`,borderRadius:C.radius,padding:"12px 16px",marginBottom:18,fontSize:13,color:C.primary,fontFamily:C.fb,fontWeight:700}}>
          ✦ Featured teachers get on average 3x more bookings
        </div>
        <PBtn onClick={pay} full loading={loading} disabled={!plan} size="lg">Promote now {plan?`— ₾${plans.find(p=>p.id===plan)?.price}`:""}</PBtn>
      </div>
    </div>
  );
};

const CookieBanner=({onAccept,onDecline,onLearnMore})=>(
  <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.text,color:"#fff",padding:"16px 24px",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,boxShadow:"0 -4px 20px rgba(0,0,0,0.2)"}}>
    <div style={{flex:1,minWidth:240}}>
      <div style={{fontSize:14,fontWeight:900,fontFamily:C.fb,marginBottom:4}}>🍪 We use cookies</div>
      <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",fontFamily:C.fb,lineHeight:1.6}}>We use essential cookies for login and optional analytics cookies to improve Classeli. <button onClick={onLearnMore} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontFamily:C.fb,fontWeight:700,padding:0,textDecoration:"underline"}}>Learn more</button></div>
    </div>
    <div style={{display:"flex",gap:10}}>
      <button onClick={onDecline} style={{background:"rgba(255,255,255,0.12)",border:"2px solid rgba(255,255,255,0.2)",borderRadius:C.radiusLg,padding:"9px 18px",fontSize:13,fontWeight:800,color:"#fff",cursor:"pointer",fontFamily:C.fb}}>Decline</button>
      <PBtn onClick={onAccept} size="sm">Accept all</PBtn>
    </div>
  </div>
);

const FAQPage=({lang,onBack})=>{
  const t=T[lang];
  const isKa=lang==="ka";
  const [open,setOpen]=useState(null);
  const faqs=isKa?[
    {q:"როგორ ხდება გადახდა?",a:"გადახდა ხდება ონლაინ, უსაფრთხოდ, ლიცენზირებული ბანკის გადახდის გვერდის მეშვეობით. შენი ბარათის მონაცემები არასოდეს ინახება ჩვენს სერვერებზე. მასწავლებელი გადახდას იღებს სესიის დასრულების შემდეგ."},
    {q:"რა მოხდება თუ მასწავლებელი არ მომეწონება?",a:"ყველა მასწავლებელი გთავაზობს საცდელ გაკვეთილს შემცირებული ფასით. თუ საცდელი გაკვეთილის შემდეგ კმაყოფილი არ ხარ, სრულ თანხას დაგიბრუნებთ — კითხვების გარეშე."},
    {q:"შეიძლება ჯავშნის გაუქმება?",a:"დიახ — გაუქმება სესიამდე მინიმუმ 24 საათით ადრე სრული თანხის დაბრუნებას გულისხმობს. 24 საათის ფარგლებში გაუქმება არ ანაზღაურდება, გარდა იმ შემთხვევისა, თუ მასწავლებელი გაუუქმებს."},
    {q:"გადამოწმებულია თუ არა მასწავლებლები?",a:"დიახ. ყველა განაცხადი ჩვენი გუნდის მიერ ხელით განიხილება დამტკიცებამდე. ვამოწმებთ მათ კვალიფიკაციას და ვატარებთ ხარისხის შეფასებას."},
    {q:"როგორ მუშაობს ვიდეო სესიები?",a:"ჯავშნის შემდეგ ვიდეო ოთახი ავტომატურად იქმნება. შენ და შენი მასწავლებელი შეხვდებით დანიშნულ დროს — გადმოწერა არ არის საჭირო, ყველაფერი ბრაუზერში მუშაობს."},
    {q:"შეიძლება ქართულ ენაზე სწავლა?",a:"დიახ. ბევრი მასწავლებელი ქართულ ენაზე ასწავლის. ჯავშნამდე შეგიძლია მასწავლებელს შეტყობინება გაუგზავნო და სასწავლო ენის შესახებ ჰკითხო."},
    {q:"როგორ გავხდე მასწავლებელი?",a:"დააჭირე 'სწავლება' ღილაკს მენიუში და შეავსე განაცხადის ფორმა. ყველა განაცხადს 24 საათის განმავლობაში განვიხილავთ."},
    {q:"რისი სწავლა შეიძლება?",a:"ყველაფერი — სასკოლო საგნები, მუსიკა, ვოკალი, ცეკვა, AI და ტექნოლოგიები, კულინარია, ენები, ფლორისტიკა, ფიტნეს, ფოტოგრაფია და კიდევ ბევრი სხვა. ყველა კატეგორია მთავარ გვერდზეა."},
  ]:[
    {q:"How does payment work?",a:"You pay securely online when you book. Payment is handled on a licensed bank's secure payment page — your card details are never stored on our servers. Teachers receive their payment after the session is completed."},
    {q:"What if I don't like my teacher?",a:"Every teacher offers a trial session at a reduced price. If you're not happy after the trial, we'll refund you in full — no questions asked."},
    {q:"Can I cancel a booking?",a:"Yes — cancel at least 24 hours before your session for a full refund. Cancellations within 24 hours are non-refundable unless the teacher cancels."},
    {q:"Are teachers verified?",a:"Yes. Every teacher application is manually reviewed by our team before approval. We check their background, qualifications, and conduct a quality review."},
    {q:"How do video sessions work?",a:"Once you book, a video room is created automatically. Both you and your teacher join at the scheduled time — no downloads needed, it runs in the browser."},
    {q:"Can I learn in Georgian?",a:"Yes. Many teachers offer lessons in Georgian. You can message a teacher before booking to ask about their teaching language."},
    {q:"How do I become a teacher?",a:"Click 'Teach' in the navigation and fill out the application form. We review all applications within 24 hours."},
    {q:"What can I learn?",a:"Anything — academic subjects, music, vocals, dance, AI and tech, cooking, languages, floristry, fitness, photography and many more."},
  ];
  return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"40px 24px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:24,padding:0,fontWeight:900}}>← {t.back}</button>
      <div style={{fontSize:32,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{isKa?"ხშირად დასმული კითხვები":"Frequently Asked Questions"}</div>
      <div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:36,fontWeight:600}}>{isKa?"ყველაფერი, რაც Classeli-ს შესახებ უნდა იცოდე.":"Everything you need to know about Classeli."}</div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {faqs.map((faq,i)=>(
          <div key={i} style={{background:C.card,border:`2px solid ${open===i?C.primary:C.border}`,borderRadius:C.radiusLg,overflow:"hidden",transition:"border 0.15s"}}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",padding:"18px 20px",background:"none",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}>
              <span style={{fontSize:15,fontWeight:800,color:C.text,fontFamily:C.fb}}>{faq.q}</span>
              <span style={{fontSize:20,color:C.primary,fontWeight:900,flexShrink:0,marginLeft:12,transition:"transform 0.2s",transform:open===i?"rotate(45deg)":"none"}}>+</span>
            </button>
            {open===i&&<div style={{padding:"0 20px 18px",fontSize:14,color:C.mid,fontFamily:C.fb,lineHeight:1.8,fontWeight:600}}>{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

const AboutPage=({lang,onBack,onSignup,user,onBrowse})=>{
  const t=T[lang];
  const isKa = lang==="ka";
  return(
    <div style={{maxWidth:760,margin:"0 auto",padding:"40px 24px 60px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:32,padding:0,fontWeight:900}}>← {t.back}</button>
      {/* Hero */}
      <div style={{marginBottom:40}}>
        <div style={{fontSize:isKa?28:34,fontWeight:900,color:C.text,fontFamily:C.fb,lineHeight:1.3,marginBottom:20}}>
          {isKa?<>კლასელი — ადამიანი, ვისთან ერთადაც სწავლობ.<br/>Classeli შექმნილია იმისთვის, რომ ნებისმიერი რამის სწავლა მარტივი იყოს.</>:<>In Georgian, “klaseli” means classmate.<br/>Classeli makes learning anything easy — with great teachers by your side.</>}
        </div>
        <div style={{fontSize:16,color:C.muted,fontFamily:C.fb,lineHeight:1.85,fontWeight:600,marginBottom:24}}>
          {isKa?"გვჯერა, რომ ხარისხიანი განათლება ყველასთვის ხელმისაწვდომი უნდა იყოს — ნებისმიერ კურსში, ონლაინ თუ ოფლაინ.":"We believe quality learning should be within everyone's reach — any course, online or offline."}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(isKa?[
            "✦ გადამოწმებული მასწავლებლები — ყველას ვამოწმებთ დამტკიცებამდე: პირადობა, კვალიფიკაცია, ინტერვიუ",
            "✦ ონლაინ და ოფლაინ — ისწავლე სახლიდან ან პირადად, შენი გრაფიკით",
            "✦ ნებისმიერი კურსი — მუსიკა, ენები, AI, ცეკვა, კულინარია და კიდევ ბევრი",
            "✦ უსაფრთხო გადახდა — ყველა ტრანზაქცია დაცულია ბანკის უსაფრთხო გადახდის გვერდით",
            "✦ საცდელი გაკვეთილი — პირველი სესია შემცირებული ფასით, რისკის გარეშე",
            "✦ ორივე მხარე რეიტინგდება — მასწავლებლებიც და მოსწავლეებიც",
          ]:[
            "✦ Verified teachers — we check ID, qualifications and interview every teacher before approval",
            "✦ Online and offline — learn from home or in person, on your schedule",
            "✦ Any subject — music, languages, AI, dance, cooking and many more",
            "✦ Secure payments — every transaction handled on a licensed bank's secure payment page",
            "✦ Trial lesson — first session at a reduced price, no risk",
            "✦ Two-way ratings — both teachers and students are rated",
          ]).map((b,i)=>(
            <div key={i} style={{background:C.bg2,borderRadius:C.radius,padding:"13px 16px",fontSize:14,color:C.text,fontFamily:C.fb,fontWeight:700,border:`2px solid ${C.border}`}}>{b}</div>
          ))}
        </div>
      </div>
      {/* Values */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:40}}>
        {[
          {icon:"✦",title:isKa?"ჩვენი მისია":"Our mission",desc:isKa?"გავხადოთ ხარისხიანი განათლება ხელმისაწვდომი ყველასთვის — ნებისმიერ კურსში, ონლაინ ან ოფლაინ.":"To make quality education accessible to everyone — any subject, online or offline.",color:C.primary},
          {icon:"🇬🇪",title:isKa?"შექმნილია საქართველოში":"Made in Georgia",desc:isKa?"Classeli შექმნილია ქართველი გუნდის მიერ, ქართველი მასწავლებლებისა და მოსწავლეებისთვის.":"Built by a Georgian team, with Georgian teachers and students at heart.",color:"#D4380D"},
          {icon:"🔒",title:isKa?"ნდობა პირველ რიგში":"Trust first",desc:isKa?"ყველა მასწავლებელი ხელით გადამოწმებულია. ყველა გადახდა დაცულია. ყველა სესია — შენია.":"Every teacher is manually reviewed. Every payment is protected. Every session belongs to you.",color:C.accent},
        ].map(v=>(
          <div key={v.title} style={{background:C.bg2,border:`2px solid ${v.color}22`,borderRadius:C.radiusLg,padding:"24px 20px"}}>
            <div style={{fontSize:28,marginBottom:12}}>{v.icon}</div>
            <div style={{fontSize:16,fontWeight:900,color:v.color,fontFamily:C.fb,marginBottom:8}}>{v.title}</div>
            <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,lineHeight:1.75,fontWeight:600}}>{v.desc}</div>
          </div>
        ))}
      </div>
      {/* CTA */}
      <div style={{background:`linear-gradient(135deg,${C.primaryLight},${C.accentLight})`,borderRadius:C.radiusLg,padding:"36px 32px",textAlign:"center",border:`2px solid ${C.border}`}}>
        <div style={{fontSize:24,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>
          {isKa?"დაიწყე სწავლა დღეს":"Start learning today"}
        </div>
        <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:24,fontWeight:600}}>
          {isKa?"იპოვე მასწავლებელი ნებისმიერ კურსში.":"Find a teacher for anything you want to learn."}
        </div>
        {user
          ?<PBtn onClick={onBrowse} size="lg">{isKa?"მასწავლებლის პოვნა":"Find a teacher"}</PBtn>
          :<PBtn onClick={onSignup} size="lg">{isKa?"დაწყება":"Get started"}</PBtn>}
      </div>
    </div>
  );
};

const NotFoundPage=({onBack})=>(
  <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}>
    <div style={{fontSize:80,marginBottom:16}}>🔍</div>
    <div style={{fontSize:28,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>Page not found</div>
    <div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:28,fontWeight:600}}>The page you're looking for doesn't exist.</div>
    <PBtn onClick={onBack} size="lg">Back to home</PBtn>
  </div>
);



const Hedgehog=({size=80})=>(
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
    {/* Spines */}
    {[[50,20],[42,21],[34,25],[28,32],[26,40],[58,21],[66,25],[72,32],[74,40],[30,52],[28,60],[36,70],[70,52],[72,60],[64,70]].map(([x,y],i)=>(
      <ellipse key={i} cx={x} cy={y} rx="3" ry="7" fill="#8B5E3C"
        transform={`rotate(${Math.atan2(y-55,x-50)*180/Math.PI+90} ${x} ${y})`}/>
    ))}
    {/* Body */}
    <ellipse cx="50" cy="62" rx="28" ry="22" fill="#C8A882"/>
    {/* Belly */}
    <ellipse cx="50" cy="64" rx="16" ry="14" fill="#F0E0D0"/>
    {/* Face */}
    <ellipse cx="50" cy="44" rx="18" ry="16" fill="#E8D5B8"/>
    {/* Eyes */}
    <circle cx="43" cy="41" r="5" fill="white"/>
    <circle cx="57" cy="41" r="5" fill="white"/>
    <circle cx="43" cy="41" r="3" fill="#1A1A1A"/>
    <circle cx="57" cy="41" r="3" fill="#1A1A1A"/>
    <circle cx="44" cy="40" r="1.2" fill="white"/>
    <circle cx="58" cy="40" r="1.2" fill="white"/>
    {/* Nose */}
    <ellipse cx="50" cy="48" rx="4" ry="3" fill="#8B2C2C"/>
    {/* Smile */}
    <path d="M45 52 Q50 57 55 52" stroke="#8B2C2C" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Cheeks */}
    <circle cx="38" cy="50" r="5" fill="#FFB3B3" opacity="0.5"/>
    <circle cx="62" cy="50" r="5" fill="#FFB3B3" opacity="0.5"/>
    {/* Book */}
    <rect x="30" y="70" width="40" height="22" rx="4" fill="#1CB0F6"/>
    <rect x="30" y="70" width="20" height="22" rx="4" fill="#1890D8"/>
    <line x1="50" y1="70" x2="50" y2="92" stroke="white" strokeWidth="1.5"/>
    <line x1="34" y1="77" x2="46" y2="77" stroke="white" strokeWidth="1.5" opacity="0.7" strokeLinecap="round"/>
    <line x1="34" y1="82" x2="46" y2="82" stroke="white" strokeWidth="1.5" opacity="0.7" strokeLinecap="round"/>
    <line x1="54" y1="77" x2="66" y2="77" stroke="white" strokeWidth="1.5" opacity="0.5" strokeLinecap="round"/>
  </svg>
);

const NewsletterForm=({lang})=>{
  const [email,setEmail]=useState("");
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);
  const isKa=lang==="ka";
  const [err,setErr]=useState("");
  const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const submit=async()=>{
    if(!valid)return;
    setLoading(true);setErr("");
    const{error}=await safeInsert("newsletter_subscribers",{email:email.trim().toLowerCase(),lang});
    setLoading(false);
    // 23505 = already subscribed, which is fine
    if(error&&error.code!=="23505"){console.error(error);setErr(isKa?"გამოწერა ვერ მოხერხდა. სცადე ხელახლა.":"Could not subscribe. Please try again.");return;}
    setDone(true);
  };
  if(done)return(
    <div style={{background:"rgba(255,255,255,0.1)",borderRadius:C.radiusLg,padding:"18px 24px",display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
      <span style={{fontSize:22}}>🎉</span>
      <span style={{fontSize:15,fontWeight:700,color:"#fff",fontFamily:C.fb}}>{isKa?"გამოწერა დადასტურებულია!":"You're subscribed!"}</span>
    </div>
  );
  return(
    <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
      <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
        placeholder={isKa?"შეიყვანე შენი ელ-ფოსტა":"Enter your email address"}
        type="email"
        style={{flex:1,minWidth:220,padding:"14px 18px",background:"rgba(255,255,255,0.1)",border:"2px solid rgba(255,255,255,0.2)",borderRadius:C.radiusLg,fontSize:14,fontFamily:C.fb,color:"#fff",outline:"none"}}
        onFocus={e=>e.target.style.borderColor="rgba(255,255,255,0.5)"}
        onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.2)"}/>
      <PBtn onClick={submit} loading={loading} disabled={!valid}>
        {isKa?"გამოწერა":"Subscribe"}
      </PBtn>
      {err&&<div style={{width:"100%",textAlign:"center",fontSize:13,color:"#FF9B9B",fontFamily:C.fb,fontWeight:700}}>{err}</div>}
    </div>
  );
};


// ── Teacher Profile Editor ─────────────────────────────────────
// ── Booking Calendar ──────────────────────────────────────────
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_KA = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];

const BookingCalendar=({teacherId,availableSlots,lang,onSelect,selectedSlot,selectedDate,onDateSelect})=>{
  const isKa=lang==="ka";
  const [currentDate,setCurrentDate]=useState(new Date());
  const [bookedSlots,setBookedSlots]=useState([]);
  const [loadingBooked,setLoadingBooked]=useState(false);

  // Get current month view
  const year=currentDate.getFullYear();
  const month=currentDate.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const today=new Date();
  today.setHours(0,0,0,0);

  // Load booked slots for this teacher
  useEffect(()=>{
    if(!teacherId) return;
    const load=async()=>{
      setLoadingBooked(true);
      try{
        const{data}=await supabase.from("bookings")
          .select("slot")
          .eq("teacher_firebase_uid",teacherId)
          .eq("status","confirmed");
        if(data) setBookedSlots(data.map(b=>b.slot));
      }catch(e){}
      setLoadingBooked(false);
    };
    load();
  },[teacherId]);

  // Check if a day has available slots
  const getDayName=(date)=>DAYS[date.getDay()];

  const getDaySlots=(date)=>{
    const dayName=getDayName(date);
    return availableSlots.filter(s=>s.startsWith(dayName)).sort();
  };

  const isDateAvailable=(date)=>{
    const d=new Date(date);d.setHours(0,0,0,0);
    if(d<today) return false;
    return getDaySlots(date).length>0;
  };

  const getSlotDateTime=(date,slot)=>{
    // slot is like "Mon 10:00", we want "2025-06-14 10:00"
    const time=slot.split(" ")[1];
    const y=date.getFullYear();
    const m=String(date.getMonth()+1).padStart(2,"0");
    const d=String(date.getDate()).padStart(2,"0");
    return `${y}-${m}-${d} ${time}`;
  };

  const isSlotBooked=(date,slot)=>{
    const dt=getSlotDateTime(date,slot);
    return bookedSlots.includes(dt);
  };

  const formatDate=(date)=>{
    const months=isKa?MONTHS_KA:MONTHS_EN;
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const selectedDateSlots=selectedDate?getDaySlots(selectedDate):[];

  return(
    <div>
      {/* Month navigation */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={()=>setCurrentDate(new Date(year,month-1,1))}
          style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusSm,width:32,height:32,cursor:"pointer",fontSize:16,color:C.muted,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>
          {isKa?MONTHS_KA[month]:MONTHS_EN[month]} {year}
        </div>
        <button onClick={()=>setCurrentDate(new Date(year,month+1,1))}
          style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusSm,width:32,height:32,cursor:"pointer",fontSize:16,color:C.muted,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
      </div>

      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
        {(isKa?["კვ","ორ","სა","ოთ","ხუ","პა","შა"]:["Su","Mo","Tu","We","Th","Fr","Sa"]).map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:10,color:C.muted,fontFamily:C.fb,fontWeight:900,padding:"4px 0"}}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:16}}>
        {Array.from({length:firstDay}).map((_,i)=>(
          <div key={"e"+i}/>
        ))}
        {Array.from({length:daysInMonth}).map((_,i)=>{
          const date=new Date(year,month,i+1);
          const available=isDateAvailable(date);
          const isToday=date.toDateString()===new Date().toDateString();
          const isSelected=selectedDate&&date.toDateString()===selectedDate.toDateString();
          const isPast=date<today;

          return(
            <button key={i} onClick={()=>{if(available){onDateSelect(date);onSelect(null);}}}
              disabled={!available}
              style={{
                aspectRatio:"1",
                borderRadius:C.radiusSm,
                border:`2px solid ${isSelected?"#1CB0F6":isToday?"#E9A520":available?"#58CC0244":"transparent"}`,
                background:isSelected?"#1CB0F6":isToday&&available?"#FFF3E0":available?"#E8FBD4":isPast?"transparent":C.bg2,
                color:isSelected?"#fff":isPast?"#CCCCCC":available?"#1A1A1A":C.muted,
                fontSize:12,fontWeight:isSelected||isToday?900:600,
                fontFamily:C.fb,cursor:available?"pointer":"default",
                transition:"all 0.15s",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}
              onMouseEnter={e=>{if(available&&!isSelected)e.currentTarget.style.background="#E0F4FF";}}
              onMouseLeave={e=>{if(available&&!isSelected)e.currentTarget.style.background="#E8FBD4";}}>
              {i+1}
            </button>
          );
        })}
      </div>

      {/* Time slots for selected date */}
      {selectedDate&&(
        <div>
          <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.8px"}}>
            {formatDate(selectedDate)} — {isKa?"დრო":"Time"} · <span style={{textTransform:"none",letterSpacing:0}}>{TZ_LABEL[isKa?"ka":"en"]}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {selectedDateSlots.map(slot=>{
              const time=slot.split(" ")[1];
              const fullSlot=getSlotDateTime(selectedDate,slot);
              const booked=isSlotBooked(selectedDate,slot)||(slotDate(fullSlot)||0)<new Date();
              const isSelected=selectedSlot===fullSlot;
              return(
                <button key={slot} onClick={()=>!booked&&onSelect(fullSlot)}
                  disabled={booked}
                  style={{
                    padding:"10px 6px",
                    border:`2px solid ${isSelected?"#1CB0F6":booked?"#EEEEEE":"#E0EEF7"}`,
                    borderRadius:C.radiusSm,
                    background:isSelected?"#1CB0F6":booked?"#F5F5F5":"#F0F8FF",
                    color:isSelected?"#fff":booked?"#CCCCCC":"#1A1A1A",
                    fontSize:13,fontFamily:C.fb,fontWeight:800,
                    cursor:booked?"not-allowed":"pointer",
                    textDecoration:booked?"line-through":"none",
                    transition:"all 0.15s",
                  }}>
                  {time}
                  {booked&&<div style={{fontSize:9,color:"#AAAAAA",fontWeight:600}}>{isKa?"დაჯავშნილი":"booked"}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!selectedDate&&availableSlots.length>0&&(
        <div style={{textAlign:"center",fontSize:12,color:C.muted,fontFamily:C.fb,padding:"8px 0",fontWeight:600}}>
          {isKa?"აირჩიე თარიღი კალენდარზე":"Select a date on the calendar"}
        </div>
      )}
    </div>
  );
};


// Teacher profile page. Tabs, chosen date and slot live here, so switching tabs never reloads the calendar.
const TeacherProfileView=({tv,lang,t,user,onAuth,onBook,onMsg,onBack})=>{
  const isKa=lang==="ka";
  const catColor=CAT_COLORS[tv.cat]||C.primary;
  const [pTab,setPTab]=useState("about");
  const [slot,setSlot]=useState(null);
  const [calendarDate,setCalendarDate]=useState(null);
  const [profileSlots,setProfileSlots]=useState(tv.slots||[]);
  const [slotsLoading,setSlotsLoading]=useState(!!tv.firebase_uid);
  const [dbReviews,setDbReviews]=useState([]);
  useEffect(()=>{
    let cancelled=false;
    setPTab("about");setSlot(null);setCalendarDate(null);setProfileSlots(tv.slots||[]);setDbReviews([]);
    if(tv.firebase_uid){
      setSlotsLoading(true);
      supabase.from("teacher_slots").select("slot").eq("firebase_uid",tv.firebase_uid)
        .then(({data})=>{if(cancelled)return;if(data)setProfileSlots(data.map(s=>s.slot));setSlotsLoading(false);});
      supabase.from("teacher_reviews").select("*").eq("teacher_uid",tv.firebase_uid).order("created_at",{ascending:false}).limit(50)
        .then(({data})=>{if(!cancelled&&data)setDbReviews(data);});
    }else setSlotsLoading(false);
    return()=>{cancelled=true;};
  },[tv.id,tv.firebase_uid]);
  const reviews=[...dbReviews.map(r=>({n:r.reviewer_name||(isKa?"მოსწავლე":"Student"),t:r.comment||"",r:r.rating,d:r.created_at})),...(tv.rl||[])];
  const reviewCount=dbReviews.length?dbReviews.length:(tv.reviews||0);
  const rating=dbReviews.length?Math.round(dbReviews.reduce((a,r)=>a+(Number(r.rating)||0),0)/dbReviews.length*10)/10:(tv.rating||5);
  const isOwn=!!user?.uid&&user.uid===tv.firebase_uid;
  const video=tv.video||tv.video_url||null;
  const embed=(v)=>{
    const yt=v.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
    if(yt)return `https://www.youtube.com/embed/${yt[1]}`;
    const vm=v.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if(vm)return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
  };
  const videoSrc=video?embed(video):null;
  const peer={uid:tv.firebase_uid,name:tv.name,email:tv.email,av:tv.av,color:catColor,resp:tv.resp,demo:tv.demo};
  const book=()=>{if(!slot)return;if(!user){onAuth("login");return;}onBook(tv,slot);};
  const msg=()=>{if(!user){onAuth("login");return;}onMsg(peer);};
  return(
    <div>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 24px"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:20,padding:0,fontWeight:900}}>← {t.back}</button>
        <div className="cl-profile-grid" style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:24,alignItems:"start"}}>
          <div>
            <div style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:24,marginBottom:18,overflow:"hidden",boxShadow:C.shadow}}>
              <div style={{height:6,background:catColor,margin:"-24px -24px 24px",borderRadius:"18px 18px 0 0"}}/>
              <div style={{display:"flex",gap:18,alignItems:"flex-start"}}>
                <Av initials={tv.av} src={tv.photo} bg={catColor} size={72}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <div style={{fontSize:24,fontWeight:900,color:C.text,fontFamily:C.fb}}>{tv.name}</div>
                    {tv.demo?<Badge color={C.muted}>{isKa?"სანიმუშო პროფილი":"Sample profile"}</Badge>:<Badge color={C.ok}>✓ {isKa?"გადამოწმებული":"Verified"}</Badge>}
                  </div>
                  <div style={{fontSize:14,color:catColor,fontFamily:C.fb,fontWeight:900,marginBottom:10}}>{isKa?tv.ska:tv.skill}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
                    <Stars r={rating} s={14}/><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{rating} ({reviewCount} {t.cr})</span>
                    {tv.online&&<Badge color="#58CC02">{t.con}</Badge>}
                    {tv.offline&&<Badge color="#4A90D9">{t.cof}</Badge>}
                  </div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600}}>⏱ {fmtResp(tv.resp,lang)}</div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:4,borderBottom:`2px solid ${C.border}`,marginBottom:20,overflowX:"auto"}}>
              {[["about",t.pa],["reviews",`${t.pr}${reviews.length?` (${reviews.length})`:""}`],["availability",t.pav],["packages",t.pp]].map(([tab,l])=>(
                <button key={tab} onClick={()=>setPTab(tab)} style={{padding:"10px 16px",border:"none",background:"none",fontSize:13,color:pTab===tab?catColor:C.muted,fontFamily:C.fb,cursor:"pointer",fontWeight:pTab===tab?900:600,borderBottom:`3px solid ${pTab===tab?catColor:"transparent"}`,marginBottom:-2,transition:"color 0.15s",whiteSpace:"nowrap"}}>{l}</button>
              ))}
            </div>
            {pTab==="about"&&<>
              {videoSrc&&<div style={{marginBottom:20,borderRadius:C.radiusLg,overflow:"hidden",border:`2px solid ${C.border}`,position:"relative",paddingBottom:"56.25%",height:0}}>
                <iframe src={videoSrc} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}} allowFullScreen title="Teacher intro"/>
              </div>}
              <p style={{fontSize:14,color:C.mid,fontFamily:C.fb,lineHeight:1.85,marginBottom:18,fontWeight:600,whiteSpace:"pre-wrap"}}>{isKa?(tv.bka||tv.bio||""):(tv.bio||tv.bka||"")}</p>
              <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>{t.psp}</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{(tv.speaks||["Georgian"]).map(s=><Badge key={s} color={catColor}>{s}</Badge>)}</div>
            </>}
            {pTab==="reviews"&&<>
              {reviews.length===0&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb,fontSize:14,fontWeight:600}}>{isKa?"შეფასება ჯერ არ არის":"No reviews yet"}</div>}
              {reviews.map((r,i)=>(<div key={i} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,padding:"14px 16px",marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6,gap:8}}><span style={{fontSize:13,fontWeight:900,color:C.text,fontFamily:C.fb}}>{r.n}</span><Stars r={r.r} s={13}/></div>{r.t&&<div style={{fontSize:13,color:C.mid,fontFamily:C.fb,lineHeight:1.6,fontWeight:600}}>{r.t}</div>}</div>))}
            </>}
            {pTab==="availability"&&(slotsLoading
              ?<div style={{textAlign:"center",padding:24,color:C.muted,fontFamily:C.fb,fontSize:13}}>{isKa?"იტვირთება...":"Loading..."}</div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>{const ds=profileSlots.filter(s=>s.startsWith(day)).sort();return(<div key={day} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,padding:"12px 13px"}}><div style={{fontSize:12,fontWeight:900,color:catColor,fontFamily:C.fb,marginBottom:7}}>{day}</div>{ds.map(s=><div key={s} style={{fontSize:12,color:C.mid,fontFamily:C.fb,marginBottom:3,fontWeight:700}}>{s.split(" ")[1]}</div>)}{ds.length===0&&<div style={{fontSize:11,color:C.muted,fontFamily:C.fb}}>—</div>}</div>);})}
              </div>)}
            {pTab==="packages"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(tv.pkgs||[]).length===0&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb,fontSize:14,fontWeight:600}}>{isKa?"პაკეტი ჯერ არ არის":"No packages yet"}</div>}
              {(tv.pkgs||[]).map((pkg,i)=>(<div key={i} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:15,fontWeight:900,color:C.text,fontFamily:C.fb}}>{pkg.n} {t.pks}</div><div style={{fontSize:12,color:C.ok,fontFamily:C.fb,fontWeight:800,marginTop:3}}>{t.pksa} ₾{pkg.s} 🎉</div></div><div style={{textAlign:"right"}}><div style={{fontSize:24,fontWeight:900,color:catColor,fontFamily:C.fb}}>₾{pkg.p}</div><button disabled={tv.demo||isOwn} onClick={()=>{if(!user){onAuth("login");}else{onBook({...tv,pkgPrice:pkg.p},isKa?`${pkg.n} გაკვეთილის პაკეტი`:`${pkg.n}-session package`);}}} style={{marginTop:6,background:tv.demo||isOwn?"#CCCCCC":C.accent,color:"#fff",border:"none",borderRadius:C.radiusSm,padding:"7px 16px",fontSize:12,fontWeight:900,fontFamily:C.fb,cursor:tv.demo||isOwn?"not-allowed":"pointer",boxShadow:tv.demo||isOwn?"none":`0 3px 0 ${C.accentHover}`}}>{isKa?"ყიდვა":"Buy"}</button></div></div>))}
            </div>}
          </div>
          <div className="cl-book-box" style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:22,position:"sticky",top:80,boxShadow:C.shadowMd}}>
            <div style={{fontSize:28,fontWeight:900,color:C.text,fontFamily:C.fb}}>₾{tv.price}</div>
            <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,fontWeight:600,marginBottom:16}}>{t.cl}</div>
            <div style={{background:C.accentLight,border:`2px solid ${C.accent}44`,borderRadius:C.radius,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.mid,fontFamily:C.fb,fontWeight:800}}>{t.bt} 🎯</span>
              <span style={{fontSize:20,fontWeight:900,color:C.accent,fontFamily:C.fb}}>₾{tv.trial||tv.trial_price||15}</span>
            </div>
            {tv.offline&&<div style={{background:C.primaryLight,border:`2px solid ${C.primary}33`,borderRadius:C.radius,padding:"9px 13px",marginBottom:14,fontSize:12,color:C.primary,fontFamily:C.fb,fontWeight:700}}>{t.bof}</div>}
            {tv.demo?(
              <div style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,padding:"14px 16px",fontSize:13,color:C.muted,fontFamily:C.fb,fontWeight:700,lineHeight:1.6,marginBottom:12}}>
                {isKa?"ეს სანიმუშო პროფილია. დაჯავშნა და მიმოწერა ხელმისაწვდომია რეალურ, გადამოწმებულ მასწავლებლებთან.":"This is a sample profile. Booking and messaging are available with real, verified teachers."}
              </div>
            ):isOwn?(
              <div style={{background:C.primaryLight,borderRadius:C.radius,padding:"14px 16px",fontSize:13,color:C.primary,fontFamily:C.fb,fontWeight:700,lineHeight:1.6,marginBottom:12}}>
                {isKa?"ეს შენი პროფილია — ასე ხედავენ მოსწავლეები.":"This is your profile — this is how students see it."}
              </div>
            ):<>
              <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>{t.bs}</div>
              <div style={{marginBottom:16,minHeight:60}}>
                {slotsLoading
                  ?<div style={{textAlign:"center",fontSize:12,color:C.muted,fontFamily:C.fb,padding:"20px 0"}}>{isKa?"იტვირთება...":"Loading..."}</div>
                  :profileSlots.length===0
                    ?<div style={{textAlign:"center",fontSize:12,color:C.muted,fontFamily:C.fb,padding:"8px 0"}}>{isKa?"ხელმისაწვდომი დრო ჯერ არ არის — მისწერე მასწავლებელს.":"No open times yet — message the teacher."}</div>
                    :<BookingCalendar teacherId={tv.firebase_uid} availableSlots={profileSlots} lang={lang} onSelect={setSlot} selectedSlot={slot} selectedDate={calendarDate} onDateSelect={setCalendarDate}/>
                }
              </div>
              <PBtn onClick={book} full disabled={!slot} size="lg">{t.bc}</PBtn>
              <div style={{marginTop:10}}><OBtn onClick={msg} full size="sm">💬 {t.mb}</OBtn></div>
            </>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Admin Page ────────────────────────────────────────────────
// Every teacher must pass these checks before the Approve button unlocks.
const VERIFY_STEPS=[
  {k:"id",en:"ID checked on video call (name matches)",ka:"პირადობა გადამოწმდა ვიდეო-ზარში"},
  {k:"qual",en:"Qualifications / certificates checked",ka:"კვალიფიკაცია / სერტიფიკატები გადამოწმდა"},
  {k:"interview",en:"Short interview / demo lesson done",ka:"ინტერვიუ / სადემონსტრაციო გაკვეთილი ჩატარდა"},
  {k:"profile",en:"Bio, price and links look genuine",ka:"ბიო, ფასი და ბმულები სანდოა"},
];

const AppCard=({app,lang,t,onDecide,onSaveNotes})=>{
  const isKa=lang==="ka";
  const [checks,setChecks]=useState(app.verification||{});
  const [notes,setNotes]=useState(app.admin_notes||"");
  const [rejecting,setRejecting]=useState(false);const [reason,setReason]=useState("");
  const [busy,setBusy]=useState(false);
  const statusColor={pending:C.accent,approved:C.ok,rejected:C.red}[app.status]||C.muted;
  const allChecked=VERIFY_STEPS.every(s=>checks[s.k]);
  const toggle=(k)=>{const n={...checks,[k]:!checks[k]};setChecks(n);onSaveNotes(app.id,{verification:n});};
  const decide=async(status)=>{setBusy(true);await onDecide(app,status,{verification:checks,admin_notes:notes||null,rejection_reason:status==="rejected"?reason||null:null});setBusy(false);setRejecting(false);};
  const fields=[["📧",app.email],["📞",app.phone],["🎓",app.skill],["📂",app.category],["⏳",app.experience_years?`${app.experience_years} ${isKa?"წელი":"yrs"}`:""],["💰",app.price?`₾${app.price}/session`:""],["🌐",app.online?"Online":""],["📍",app.offline?"In-person":""]].filter(([,v])=>v);
  return(
    <div style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"20px 22px",boxShadow:C.shadow}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
        <div style={{fontSize:17,fontWeight:900,color:C.text,fontFamily:C.fb}}>{app.name}</div>
        <span style={{background:statusColor+"20",color:statusColor,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:900,fontFamily:C.fb,border:`1.5px solid ${statusColor}44`}}>{app.status}</span>
        {app.created_at&&<span style={{fontSize:11,color:C.muted,fontFamily:C.fb}}>{new Date(app.created_at).toLocaleDateString()}</span>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6,marginBottom:10}}>
        {fields.map(([icon,val])=><div key={icon} style={{fontSize:12,color:C.mid,fontFamily:C.fb,fontWeight:600,wordBreak:"break-word"}}>{icon} {val}</div>)}
      </div>
      {app.bio&&<div style={{fontSize:13,color:C.muted,fontFamily:C.fb,lineHeight:1.6,marginBottom:8,fontWeight:600,background:C.bg2,borderRadius:C.radiusSm,padding:"10px 12px",whiteSpace:"pre-wrap"}}>{app.bio}</div>}
      {app.qualifications&&<div style={{fontSize:13,color:C.mid,fontFamily:C.fb,lineHeight:1.6,marginBottom:8,fontWeight:600,background:"#F6F0FF",borderRadius:C.radiusSm,padding:"10px 12px",whiteSpace:"pre-wrap"}}>🎖 {app.qualifications}</div>}
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:6}}>
        {app.links&&String(app.links).split(/[\s,]+/).filter(l=>/^https?:\/\//.test(l)).map(l=><a key={l} href={l} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.primary,fontFamily:C.fb,fontWeight:700,wordBreak:"break-all"}}>🔗 {l.replace(/^https?:\/\//,"").slice(0,40)}</a>)}
        {app.video_url&&<a href={app.video_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.primary,fontFamily:C.fb,fontWeight:700}}>🎥 {isKa?"ინტრო ვიდეო":"Intro video"}</a>}
      </div>
      {app.status==="rejected"&&app.rejection_reason&&<div style={{fontSize:12,color:C.red,fontFamily:C.fb,fontWeight:700,marginTop:6}}>{isKa?"უარის მიზეზი:":"Reason:"} {app.rejection_reason}</div>}
      {app.status==="pending"&&(
        <div style={{marginTop:14,borderTop:`2px solid ${C.border}`,paddingTop:14}}>
          <div style={{fontSize:12,fontWeight:900,color:C.primary,fontFamily:C.fb,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>🛡️ {isKa?"გადამოწმება":"Verification"}</div>
          {VERIFY_STEPS.map(s=>(
            <label key={s.k} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:13,color:C.mid,fontFamily:C.fb,fontWeight:700,marginBottom:8}}>
              <input type="checkbox" checked={!!checks[s.k]} onChange={()=>toggle(s.k)} style={{width:16,height:16,accentColor:C.ok}}/>{isKa?s.ka:s.en}
            </label>
          ))}
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} onBlur={()=>onSaveNotes(app.id,{admin_notes:notes||null})} rows={2} placeholder={isKa?"შიდა შენიშვნები (ჩანს მხოლოდ ადმინისთვის)":"Internal notes (admin only)"}
            style={{width:"100%",padding:"10px 12px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,fontSize:13,fontFamily:C.fb,color:C.text,outline:"none",resize:"vertical",margin:"6px 0 12px",boxSizing:"border-box"}}/>
          {rejecting?(
            <div style={{background:C.redLight,borderRadius:C.radius,padding:12}}>
              <textarea value={reason} onChange={e=>setReason(e.target.value)} rows={2} placeholder={isKa?"უარის მიზეზი (გაეგზავნება მასწავლებელს)":"Reason for declining (sent to the applicant)"}
                style={{width:"100%",padding:"10px 12px",background:"#fff",border:`2px solid ${C.red}33`,borderRadius:C.radius,fontSize:13,fontFamily:C.fb,color:C.text,outline:"none",resize:"vertical",marginBottom:10,boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                <OBtn size="sm" onClick={()=>setRejecting(false)}>{isKa?"გაუქმება":"Cancel"}</OBtn>
                <PBtn size="sm" variant="red" loading={busy} onClick={()=>decide("rejected")}>❌ {t.adm_reject}</PBtn>
              </div>
            </div>
          ):(
            <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
              <button onClick={()=>setRejecting(true)} style={{background:C.redLight,color:C.red,border:`2px solid ${C.red}33`,borderRadius:C.radiusLg,padding:"10px 18px",fontSize:13,fontWeight:900,fontFamily:C.fb,cursor:"pointer"}}>❌ {t.adm_reject}</button>
              <PBtn onClick={()=>decide("approved")} variant="primary" disabled={!allChecked} loading={busy}>✅ {t.adm_approve}</PBtn>
              {!allChecked&&<span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700}}>{isKa?"დამტკიცებამდე მონიშნე ყველა პუნქტი":"Tick every check to approve"}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminPage=({lang,user,onBack})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [tab,setTab]=useState("pending");
  const [apps,setApps]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [users,setUsers]=useState([]);
  const [profiles,setProfiles]=useState([]);
  const [reports,setReports]=useState([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState("");
  const isAdmin=isAdminUser(user);

  useEffect(()=>{if(isAdmin)loadAll();else setLoading(false);},[isAdmin]);

  const loadAll=async()=>{
    setLoading(true);
    try{
      const res=await Promise.all([
        supabase.from("teacher_applications").select("*").order("created_at",{ascending:false}),
        supabase.from("bookings").select("*").order("created_at",{ascending:false}).limit(300),
        supabase.from("users").select("*").order("created_at",{ascending:false}).limit(500),
        supabase.from("teacher_profiles").select("*").order("created_at",{ascending:false}),
        supabase.from("user_reports").select("*").order("created_at",{ascending:false}).limit(200),
      ]);
      const[a,b,u,p,r]=res.map(x=>x.data||[]);
      setApps(a);setBookings(b);setUsers(u);setProfiles(p);setReports(r);
    }catch(e){console.error(e);}
    setLoading(false);
  };
  const flash=(m)=>{setMsg(m);setTimeout(()=>setMsg(""),3500);};
  const saveNotes=async(id,patch)=>{await safeUpdate("teacher_applications",patch,{id});setApps(prev=>prev.map(a=>a.id===id?{...a,...patch}:a));};
  const decide=async(app,status,extra)=>{
    const{error}=await safeUpdate("teacher_applications",{status,...extra,reviewed_at:new Date().toISOString()},{id:app.id});
    if(error){flash((isKa?"შეცდომა: ":"Error: ")+error.message);return;}
    if(status==="approved"&&app.firebase_uid){
      await supabase.from("users").update({role:"tutor"}).eq("firebase_uid",app.firebase_uid);
    }
    if(app.email)sendEmail("application_decision",{to:app.email,name:app.name,approved:status==="approved",reason:extra.rejection_reason});
    setApps(prev=>prev.map(a=>a.id===app.id?{...a,status,...extra}:a));
    flash(status==="approved"?(isKa?"დამტკიცებულია ✅":"Approved ✅"):(isKa?"უარყოფილია ❌":"Declined ❌"));
  };
  const toggleActive=async(p)=>{
    const{error}=await safeUpdate("teacher_profiles",{active:!p.active},{id:p.id});
    if(error){flash(error.message);return;}
    setProfiles(prev=>prev.map(x=>x.id===p.id?{...x,active:!p.active}:x));
  };
  const closeReport=async(r)=>{
    await safeUpdate("user_reports",{status:"closed"},{id:r.id});
    setReports(prev=>prev.map(x=>x.id===r.id?{...x,status:"closed"}:x));
  };

  if(!isAdmin) return(
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{isKa?"წვდომა შეზღუდულია":"Access denied"}</div>
      <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:24}}>{isKa?`ეს გვერდი მხოლოდ ${BRAND}-ის ადმინებისთვისაა.`:`This page is only for ${BRAND} admins.`}</div>
      <PBtn onClick={onBack}>{t.back}</PBtn>
    </div>
  );

  const appTabs=["pending","approved","rejected","applications"];
  const shownApps=tab==="applications"?apps:apps.filter(a=>a.status===tab);
  const openReports=reports.filter(r=>r.status!=="closed").length;

  return(
    <div style={{maxWidth:1000,margin:"0 auto",padding:"40px 24px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:24,padding:0,fontWeight:900}}>← {t.back}</button>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32,flexWrap:"wrap"}}>
        <div style={{fontSize:32,fontWeight:900,color:C.text,fontFamily:C.fb}}>🛡️ Admin</div>
        <OBtn size="sm" onClick={loadAll}>↻ {isKa?"განახლება":"Refresh"}</OBtn>
        {msg&&<div style={{background:C.ok+"20",border:`2px solid ${C.ok}44`,borderRadius:C.radiusLg,padding:"8px 16px",fontSize:13,color:C.ok,fontFamily:C.fb,fontWeight:800}}>{msg}</div>}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:28}}>
        {[["⏳",apps.filter(a=>a.status==="pending").length,isKa?"მოლოდინში":"Pending","#E9A520"],["✅",profiles.filter(p=>p.active).length,isKa?"აქტიური მასწ.":"Live teachers","#58CC02"],["📅",bookings.length,isKa?"ჯავშანი":"Bookings","#A259FF"],["🚩",openReports,isKa?"საჩივარი":"Open reports","#FF4B4B"]].map(([icon,count,label,color])=>(
          <div key={label} style={{background:color+"12",border:`2px solid ${color}33`,borderRadius:C.radiusLg,padding:"16px 18px",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:28,fontWeight:900,color,fontFamily:C.fb}}>{count}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,fontWeight:700,textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:4,borderBottom:`2px solid ${C.border}`,marginBottom:24,overflowX:"auto"}}>
        {[["pending","⏳ "+(isKa?"მოლოდინში":"Pending")],["approved","✅ "+(isKa?"დამტკიცებული":"Approved")],["rejected","❌ "+(isKa?"უარყოფილი":"Declined")],["applications","📋 "+(isKa?"ყველა":"All")],["teachers","🎓 "+(isKa?"მასწავლებლები":"Teachers")],["reports","🚩 "+(isKa?"საჩივრები":"Reports")],["bookings","📅 "+(isKa?"ჯავშნები":"Bookings")],["users","👥 "+(isKa?"მომხმარებლები":"Users")]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"10px 16px",border:"none",background:"none",fontSize:13,fontWeight:900,fontFamily:C.fb,color:tab===k?C.accent:C.muted,borderBottom:`3px solid ${tab===k?C.accent:"transparent"}`,marginBottom:-2,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
        ))}
      </div>
      {loading&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb}}>{isKa?"იტვირთება...":"Loading..."}</div>}

      {!loading&&appTabs.includes(tab)&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {shownApps.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb,fontSize:14}}>{t.adm_empty}</div>}
          {shownApps.map(app=><AppCard key={app.id} app={app} lang={lang} t={t} onDecide={decide} onSaveNotes={saveNotes}/>)}
        </div>
      )}

      {!loading&&tab==="teachers"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {profiles.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb,fontSize:14}}>{isKa?"პროფილი ჯერ არ არის":"No teacher profiles yet"}</div>}
          {profiles.map(p=>(
            <div key={p.id} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap",opacity:p.active?1:0.6}}>
              <div>
                <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{p.name} <span style={{fontSize:12,color:C.muted,fontWeight:700}}>· {p.skill_ka||p.skill}</span></div>
                <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2}}>{p.email} · ₾{p.price} · ★ {p.rating||"–"} ({p.review_count||0})</div>
              </div>
              <OBtn size="sm" onClick={()=>toggleActive(p)}>{p.active?(isKa?"დამალვა":"Hide from site"):(isKa?"გამოჩენა":"Show on site")}</OBtn>
            </div>
          ))}
        </div>
      )}

      {!loading&&tab==="reports"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {reports.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb,fontSize:14}}>{isKa?"საჩივარი არ არის":"No reports"}</div>}
          {reports.map(r=>(
            <div key={r.id} style={{background:r.status==="closed"?C.bg2:C.redLight,border:`2px solid ${r.status==="closed"?C.border:C.red+"33"}`,borderRadius:C.radiusLg,padding:"14px 18px",display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:220}}>
                <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{r.reason}</div>
                <div style={{fontSize:12,color:C.mid,fontFamily:C.fb,marginTop:2}}>{r.reporter_name||r.reporter_email||"?"} → {r.reported_name||"?"}</div>
                {r.details&&<div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:6,whiteSpace:"pre-wrap"}}>{r.details}</div>}
                <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:4}}>{r.created_at?new Date(r.created_at).toLocaleString():""}</div>
              </div>
              {r.status!=="closed"&&<OBtn size="sm" onClick={()=>closeReport(r)}>{isKa?"დახურვა":"Mark resolved"}</OBtn>}
            </div>
          ))}
        </div>
      )}

      {!loading&&tab==="bookings"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {bookings.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb,fontSize:14}}>{isKa?"ჯავშანი არ არის":"No bookings yet"}</div>}
          {bookings.map(b=>(
            <div key={b.id} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{b.student_name} → {b.teacher_name}</div>
                <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2}}>{b.skill} · {b.slot} · ₾{b.price}{b.is_trial?" · trial":""}</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:2}}>{b.student_email}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:C.ok,fontFamily:C.fb,fontWeight:800}}>{b.status}</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:C.fb}}>{b.created_at?new Date(b.created_at).toLocaleDateString():""}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading&&tab==="users"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {users.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb,fontSize:14}}>{isKa?"მომხმარებელი არ არის":"No users yet"}</div>}
          {users.map(u=>(
            <div key={u.id} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{u.name}</div>
                <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2}}>{u.email}</div>
              </div>
              <div style={{background:u.role==="tutor"?C.ok+"20":C.primaryLight,color:u.role==="tutor"?C.ok:C.primary,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:900,fontFamily:C.fb}}>{u.role||"student"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default function App(){
  const [lang,setLang]=useState(()=>{try{return localStorage.getItem("nateba_lang")||"ka";}catch{return "ka";}});
  const [page,setPage]=useState("home");
  const [cookieAccepted,setCookieAccepted]=useState(()=>{try{return localStorage.getItem("nateba_cookie");}catch{return null;}});
  const [showPromote,setShowPromote]=useState(false);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [selT,setSelT]=useState(null);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [catF,setCatF]=useState("all");
  const [user,setUser]=useState(()=>{try{const s=localStorage.getItem("nateba_user");return s?JSON.parse(s):null;}catch{return null;}});
  const [authMode,setAuthMode]=useState(null);
  const [video,setVideo]=useState(null); // {teacher, slot, room}
  const [payment,setPayment]=useState(null);
  const [msgPeer,setMsgPeer]=useState(null);
  const [toast,setToast]=useState(null);
  const [dashKey,setDashKey]=useState(0);
  const [saved,setSaved]=useState(()=>{try{return JSON.parse(localStorage.getItem("nateba_saved")||"[]");}catch{return [];}});
  const [dbTeachers,setDbTeachers]=useState([]);
  const [teachersLoaded,setTeachersLoaded]=useState(false);

  const t=T[lang];
  const isKa=lang==="ka";
  const isAdmin=isAdminUser(user);
  const go=p=>{setPage(p);setMobileMenu(false);window.scrollTo(0,0);};
  const changeLang=l=>{setLang(l);try{localStorage.setItem("nateba_lang",l);}catch{}};
  const saveUser=u=>{setUser(u);try{if(u)localStorage.setItem("nateba_user",JSON.stringify(u));else localStorage.removeItem("nateba_user");}catch{}};
  // Login / sign-up never opens for someone who is already logged in
  const openAuth=mode=>{if(user)return;setAuthMode(mode);};
  const logout=async()=>{saveUser(null);setMobileMenu(false);go("home");try{const{signOut}=await import("firebase/auth");await signOut(fbAuth);}catch{}};
  const openT=tv=>{setSelT(tv);go("teacher");};
  const toggleSave=id=>{
    if(!user){openAuth("login");return;}
    setSaved(s=>{const n=s.includes(id)?s.filter(x=>x!==id):[...s,id];try{localStorage.setItem("nateba_saved",JSON.stringify(n));}catch{}return n;});
  };
  const acceptCookies=()=>{setCookieAccepted("accepted");try{localStorage.setItem("nateba_cookie","accepted");}catch{}};
  const declineCookies=()=>{setCookieAccepted("declined");try{localStorage.setItem("nateba_cookie","declined");}catch{}};

  // Keep the saved role fresh (e.g. after an admin approves someone as a teacher)
  useEffect(()=>{
    if(!user?.uid)return;
    findUserRow(user.uid).then(row=>{if(row&&row.role&&row.role!==user.role)saveUser({...user,role:row.role,id:row.id});}).catch(()=>{});
  },[user?.uid]);

  useEffect(()=>{document.title=isKa?`${BRAND} — ისწავლე ყველაფერი, მარტივად`:`${BRAND} — Learn anything, easily`;},[isKa]);

  useEffect(()=>{loadTeachers();},[]);
  const loadTeachers=async()=>{
    try{
      const{data,error}=await supabase.from("teacher_profiles").select("*").eq("active",true).order("created_at",{ascending:false});
      if(!error&&data){
        setDbTeachers(data.map(tp=>({id:tp.id,firebase_uid:tp.firebase_uid,name:tp.name,nka:tp.name,cat:tp.category||"school",skill:tp.skill||tp.skill_ka||"",ska:tp.skill_ka||tp.skill||"",price:tp.price||40,trial:tp.trial_price||15,rating:tp.rating||5.0,reviews:tp.review_count||0,online:tp.online!==false,offline:tp.offline||false,av:initials(tp.name),photo:tp.photo_url||null,bio:tp.bio||tp.bio_ka||"",bka:tp.bio_ka||tp.bio||"",speaks:tp.speaks||["Georgian"],resp:tp.response_time||"2 hrs",slots:[],rl:[],pkgs:[],video_url:tp.video_url||null,promoted:tp.promoted||false,email:tp.email})));
      }
    }catch(e){console.error(e);}
    setTeachersLoaded(true);
  };
  const demoTeachers=SHOW_DEMO_TEACHERS?TEACHERS.map(tv=>({...tv,demo:true})):[];
  const allTeachers=[...dbTeachers,...demoTeachers.filter(d=>!dbTeachers.find(x=>x.name===d.name))];

  const catLabel=id=>{const c=CATEGORIES.find(c=>c.id===id);return c?`${c.label} ${c.lka}`:"";};
  const q=search.trim().toLowerCase();
  const filtered=allTeachers.filter(tv=>{
    const hay=[tv.name,tv.nka,tv.skill,tv.ska,tv.bio,tv.bka,catLabel(tv.cat)].join(" ").toLowerCase();
    const ms=!q||hay.includes(q);
    const mf=filter==="all"||(filter==="online"&&tv.online)||(filter==="offline"&&tv.offline);
    const mc=catF==="all"||tv.cat===catF;
    return ms&&mf&&mc;
  }).sort((a,b)=>(a.demo?1:0)-(b.demo?1:0));

  const onBooked=()=>{setToast({msg:isKa?"გაკვეთილი დაჯავშნილია! 🎉":"Session booked! 🎉"});setPayment(null);setDashKey(k=>k+1);go("dashboard");};

  // NOTE: the sections below are plain functions called as {Nav()} etc. (not <Nav/>),
  // so React never unmounts them on re-render — no flashing, inputs keep focus.
  const LangSwitch=(pad)=>(
    <div style={{display:"flex",background:C.bg2,borderRadius:C.radiusSm,border:`2px solid ${C.border}`,padding:2}}>
      {["en","ka"].map(l=>(
        <button key={l} onClick={()=>changeLang(l)} style={{border:"none",borderRadius:6,padding:pad,fontSize:11,cursor:"pointer",background:lang===l?C.primary:"transparent",color:lang===l?"#fff":C.muted,fontFamily:C.fb,fontWeight:900,transition:"all 0.2s"}}>{l.toUpperCase()}</button>
      ))}
    </div>
  );

  const Nav=()=>(
    <nav style={{background:"#FFFFFF",borderBottom:"2px solid #E0EEF7",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 8px rgba(28,176,246,0.12)"}}>
      <Logo onClick={()=>go("home")}/>
      <div style={{display:"flex",gap:4,alignItems:"center"}} id="desktop-nav">
        {[["browse",t.nav_browse],["groups",t.nav_groups],["teach",t.nav_teach]].map(([p,l])=>(
          <button key={p} onClick={()=>go(p)} style={{border:"none",background:page===p?C.primaryLight:"transparent",color:page===p?C.primary:C.muted,borderRadius:C.radiusSm,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:C.fb,fontWeight:800,transition:"all 0.15s"}}>{l}</button>
        ))}
        <div style={{width:1,height:22,background:C.border,margin:"0 6px"}}/>
        {user?<>
          <button onClick={()=>go("dashboard")} style={{border:"none",background:page==="dashboard"?C.primaryLight:"transparent",color:page==="dashboard"?C.primary:C.muted,borderRadius:C.radiusSm,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:C.fb,fontWeight:800}}>{t.nav_dash}</button>
          <Av initials={initials(user.name)} bg={C.primary} size={30}/>
          {isAdmin&&<button onClick={()=>go("admin")} style={{border:"none",background:"#FF4B4B15",color:"#FF4B4B",borderRadius:C.radiusSm,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:C.fb,fontWeight:900,marginLeft:4}}>🛡️ Admin</button>}
          <button onClick={logout} style={{border:"none",background:"transparent",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:C.fb,fontWeight:700,marginLeft:4}}>{t.nav_out}</button>
        </>:<>
          <button onClick={()=>openAuth("login")} style={{border:"none",background:"transparent",color:C.mid,borderRadius:C.radiusSm,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:C.fb,fontWeight:900}}>{t.nav_login}</button>
          <PBtn onClick={()=>openAuth("signup")} size="sm">{t.nav_signup}</PBtn>
        </>}
        <div style={{marginLeft:6}}>{LangSwitch("4px 10px")}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}} id="mobile-nav">
        {LangSwitch("4px 9px")}
        <button onClick={()=>setMobileMenu(m=>!m)} aria-label="Menu" style={{background:mobileMenu?C.primaryLight:"none",border:`2px solid ${mobileMenu?C.primary:C.border}`,borderRadius:C.radiusSm,width:40,height:40,cursor:"pointer",fontSize:20,color:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
          {mobileMenu?"✕":"☰"}
        </button>
      </div>
    </nav>
  );

  const TCard=(tv)=>{
    const isSaved=saved.includes(tv.id);
    const catColor=CAT_COLORS[tv.cat]||C.primary;
    return(
      <div key={tv.id} onClick={()=>openT(tv)} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:20,cursor:"pointer",transition:"all 0.2s",boxShadow:C.shadow,position:"relative",overflow:"hidden"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=catColor;e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 8px 24px ${catColor}33`;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=C.shadow;}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:catColor,borderRadius:"18px 18px 0 0"}}/>
        {tv.promoted&&<div style={{position:"absolute",top:12,left:12,background:"linear-gradient(135deg,#E9A520,#FF7A00)",color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:900,fontFamily:C.fb,zIndex:1}}>✦ Featured</div>}
        <button onClick={e=>{e.stopPropagation();toggleSave(tv.id);}}
          style={{position:"absolute",top:14,right:14,background:isSaved?catColor+"20":C.bg2,border:`2px solid ${isSaved?catColor:C.border}`,borderRadius:C.radiusSm,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:C.fb,fontWeight:900,color:isSaved?catColor:C.muted,transition:"all 0.15s"}}>
          {isSaved?"♥ "+t.csd:"♡ "+t.csv}
        </button>
        <div style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start",paddingRight:72,paddingTop:tv.promoted?18:6}}>
          <Av initials={tv.av} src={tv.photo} bg={catColor} size={50}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:1}}>{tv.name}</div>
            <div style={{fontSize:12,color:catColor,fontFamily:C.fb,fontWeight:800,marginBottom:5}}>{isKa?tv.ska:tv.skill}</div>
            <div style={{display:"flex",alignItems:"center",gap:5}}><Stars r={tv.rating} s={12}/><span style={{fontSize:11,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{tv.rating} ({tv.reviews} {t.cr})</span></div>
          </div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
          {tv.online&&<Badge color="#58CC02">{t.con}</Badge>}
          {tv.offline&&<Badge color="#4A90D9">{t.cof}</Badge>}
          <Badge color={C.muted}>{fmtResp(tv.resp,lang)}</Badge>
          {tv.demo&&<Badge color="#AAAAAA">{isKa?"ნიმუში":"Sample"}</Badge>}
        </div>
        <div style={{fontSize:13,color:C.mid,fontFamily:C.fb,lineHeight:1.6,marginBottom:14,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{isKa?tv.bka:tv.bio}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:`2px solid ${C.border}`,paddingTop:12}}>
          <div><span style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb}}>₾{tv.price}</span><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600}}> {t.cl}</span></div>
          <PBtn size="sm">{t.cb}</PBtn>
        </div>
      </div>
    );
  };

  const GroupCard=(g)=>{
    const clr=CAT_COLORS[g.cat]||C.primary;
    return(
      <div key={g.id} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,overflow:"hidden",boxShadow:C.shadow,transition:"all 0.2s"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=clr;e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 8px 24px ${clr}33`;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=C.shadow;}}>
        <div style={{background:clr,padding:"20px 20px 16px"}}><div style={{fontSize:15,fontWeight:900,color:"#fff",fontFamily:C.fb,marginBottom:3}}>{isKa?g.tka:g.title}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.75)",fontFamily:C.fb,fontWeight:600}}>{isKa?g.ska:g.sch} · {g.dur} {isKa?"წთ":"min"}</div></div>
        <div style={{padding:"16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><Av initials={g.av} bg={clr} size={28}/><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700}}>{isKa?g.teka:g.teacher}</span>{SHOW_DEMO_TEACHERS&&<Badge color="#AAAAAA">{isKa?"ნიმუში":"Sample"}</Badge>}</div>
          <div style={{fontSize:13,color:C.mid,fontFamily:C.fb,lineHeight:1.6,marginBottom:12,fontWeight:600}}>{isKa?g.dka:g.desc}</div>
          <div style={{background:C.bg2,borderRadius:6,height:6,marginBottom:12,overflow:"hidden"}}><div style={{background:clr,height:"100%",width:`${((g.total-g.spots)/g.total)*100}%`,borderRadius:6}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div><span style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb}}>₾{g.price}</span><span style={{fontSize:12,color:C.muted,fontFamily:C.fb}}>{isKa?" / სესია":" / session"}</span></div>
            <Badge color={g.spots<=2?C.red:C.ok}>{g.spots} {t.cs}</Badge>
          </div>
          {/* Sample group classes have no real teacher behind them yet, so they can't be booked */}
          <PBtn full disabled>{isKa?"მალე":"Coming soon"}</PBtn>
        </div>
      </div>
    );
  };

  const SearchBar=()=>(
    <div style={{background:C.white,borderBottom:`2px solid ${C.border}`,padding:"14px 24px",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
      <div style={{flex:1,minWidth:200,position:"relative"}}>
        <input style={{width:"100%",padding:"12px 16px 12px 44px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,fontSize:14,fontFamily:C.fb,color:C.text,outline:"none",boxSizing:"border-box",fontWeight:600}}
          placeholder={t.search_ph} value={search} onChange={e=>setSearch(e.target.value)}
          onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.muted,fontSize:16,pointerEvents:"none"}}>🔍</span>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[["all",t.fa],["online",t.fo],["offline",t.ff]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:"10px 16px",border:`2px solid ${filter===v?C.accent:C.border}`,borderRadius:C.radiusLg,background:filter===v?C.accentLight:C.white,color:filter===v?C.accent:C.muted,fontSize:13,cursor:"pointer",fontFamily:C.fb,fontWeight:900,transition:"all 0.15s"}}>{l}</button>
        ))}
      </div>
      <select value={catF} onChange={e=>setCatF(e.target.value)} style={{padding:"10px 14px",background:C.white,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,fontSize:13,fontFamily:C.fb,color:C.mid,outline:"none",fontWeight:700,cursor:"pointer"}}>
        <option value="all">{t.fa}</option>
        {CATEGORIES.map(c=><option key={c.id} value={c.id}>{isKa?c.lka:c.label}</option>)}
      </select>
    </div>
  );

  const Footer=()=>(
    <footer style={{background:"#1A1A2E",padding:"40px 24px",marginTop:60}}>
      <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill={C.primary}/><path d="M24 10 L27 22 L38 24 L27 26 L24 38 L21 26 L10 24 L21 22 Z" fill={C.accent}/></svg>
            <span style={{fontFamily:C.fb,fontWeight:900,fontSize:18,color:"#fff"}}>classeli</span>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontFamily:C.fb}}>{isKa?"ისწავლე ყველაფერი, მარტივად.":"Learn anything, easily."}</div>
        </div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[["about",isKa?"ჩვენს შესახებ":"About"],["faq",isKa?"ხშირად დასმული კითხვები":"FAQ"],["tos",t.tost],["pp",t.topp],...(isAdmin?[["admin","🛡️ Admin"]]:[])].map(([p,l])=>(
            <button key={p} onClick={()=>go(p)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontFamily:C.fb,fontSize:13,cursor:"pointer",padding:0,fontWeight:700,transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.4)"}>{l}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",fontFamily:C.fb,lineHeight:1.7,textAlign:"right"}}>
          <div>© {new Date().getFullYear()} {BRAND} · {DOMAIN}</div>
          {businessLine(isKa)&&<div>{businessLine(isKa)}</div>}
        </div>
      </div>
    </footer>
  );

  const Home=()=>(
    <div>
      <div style={{background:"linear-gradient(160deg,#E0F4FF 0%,#FFFFFF 55%,#FFF3E0 100%)",padding:"80px 24px 72px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:C.white,border:`2px solid ${C.border}`,borderRadius:20,padding:"7px 16px",marginBottom:24,boxShadow:C.shadow}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.ok}}/>
          <span style={{fontSize:13,fontFamily:C.fb,fontWeight:700,color:C.muted}}>{t.hero_proof}</span>
        </div>
        <h1 style={{fontSize:"clamp(30px,5vw,52px)",fontWeight:900,color:C.text,fontFamily:C.fb,lineHeight:1.15,letterSpacing:"-1px",maxWidth:600,margin:"0 auto 18px"}}>{t.hero_title}</h1>
        <p style={{fontSize:17,color:C.muted,maxWidth:480,margin:"0 auto 36px",lineHeight:1.7,fontFamily:C.fb,fontWeight:600}}>{t.hero_sub}</p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <PBtn onClick={()=>go("browse")} size="lg">{t.hero_cta}</PBtn>
          <OBtn onClick={()=>go("teach")} size="lg">{t.hero_cta2}</OBtn>
        </div>
        <div style={{marginTop:20,display:"flex",justifyContent:"center"}}>
          <AIMatch lang={lang} teachers={allTeachers} onSelect={openT} onBrowse={()=>{setCatF("all");go("browse");}}/>
        </div>
      </div>

      <div className="cl-stats" style={{background:C.white,borderTop:`2px solid ${C.border}`,borderBottom:`2px solid ${C.border}`,display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
        {[[CATEGORIES.length,t.st,"#1CB0F6"],["₾",t.ss,"#58CC02"],["1:1",t.sk,"#A259FF"],["✓",t.sr,"#E9A520"]].map(([n,l,clr],i)=>(
          <div key={i} style={{padding:"22px 16px",textAlign:"center",borderRight:i<3?`2px solid ${C.border}`:"none"}}>
            <div style={{fontSize:24,fontWeight:900,color:clr,fontFamily:C.fb}}>{n}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:"0.6px"}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{padding:"56px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{fontSize:26,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{t.sc}</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:24,fontWeight:600}}>{isKa?"ყველა კატეგორია":"Browse all categories"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
          {CATEGORIES.map(c=>{const clr=CAT_COLORS[c.id]||C.primary;return(
            <button key={c.id} onClick={()=>{setCatF(c.id);setSearch("");go("browse");}}
              style={{background:clr+"12",border:`2px solid ${clr}33`,borderRadius:C.radiusLg,padding:"16px 14px",textAlign:"left",cursor:"pointer",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=clr+"22";e.currentTarget.style.borderColor=clr+"77";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=clr+"12";e.currentTarget.style.borderColor=clr+"33";e.currentTarget.style.transform="none";}}>
              <div style={{fontSize:13,fontWeight:900,color:clr,fontFamily:C.fb,marginBottom:3}}>{isKa?c.lka:c.label}</div>
              <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{c.skills.length} {isKa?"კურსი":"courses"}</div>
            </button>
          );})}
        </div>
      </div>

      <div style={{background:C.bg2,padding:"56px 24px",borderTop:`2px solid ${C.border}`}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          {allTeachers.filter(tv=>tv.promoted).length>0&&<>
            <div style={{marginBottom:18}}>
              <div style={{display:"inline-block",background:"linear-gradient(135deg,#E9A520,#FF7A00)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:900,color:"#fff",fontFamily:C.fb,marginBottom:4}}>✦ Featured</div>
              <div style={{fontSize:26,fontWeight:900,color:C.text,fontFamily:C.fb}}>{t.sf}</div>
              <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginTop:3,fontWeight:600}}>{t.sf2}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16,marginBottom:40}}>
              {allTeachers.filter(tv=>tv.promoted).map(tv=>TCard(tv))}
            </div>
            <div style={{height:2,background:C.border,marginBottom:36}}/>
          </>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
            <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb}}>{isKa?"ყველა მასწავლებელი":"All teachers"}</div>
            <button onClick={()=>{setCatF("all");go("browse");}} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:14,cursor:"pointer",fontWeight:900}}>{isKa?"მეტის ნახვა →":"See more →"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16}}>
            {allTeachers.filter(tv=>!tv.promoted).sort((a,b)=>(a.demo?1:0)-(b.demo?1:0)).slice(0,4).map(tv=>TCard(tv))}
          </div>
        </div>
      </div>

      <div style={{padding:"56px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
          <div><div style={{fontSize:26,fontWeight:900,color:C.text,fontFamily:C.fb}}>{t.sg}</div><div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginTop:3,fontWeight:600}}>{t.sg2}</div></div>
          <button onClick={()=>go("groups")} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:14,cursor:"pointer",fontWeight:900}}>{isKa?"მეტის ნახვა →":"See more →"}</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {GROUPS.map(g=>GroupCard(g))}
        </div>
      </div>

      <div style={{background:"#1A1A2E",padding:"52px 24px"}}>
        <div style={{maxWidth:560,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#fff",fontFamily:C.fb,marginBottom:8}}>{isKa?"სიახლეები პირდაპირ შენთან":"Stay in the loop"}</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.55)",fontFamily:C.fb,marginBottom:24,fontWeight:600}}>{isKa?"მიიღე ინფორმაცია ახალი მასწავლებლების, კურსებისა და სიახლეების შესახებ.":"New teachers, courses and platform updates — straight to your inbox."}</div>
          <NewsletterForm lang={lang}/>
        </div>
      </div>
      <div style={{background:"#F0F8FF",borderTop:`2px solid ${C.border}`,padding:"60px 24px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <div style={{fontSize:26,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:40,textAlign:"center"}}>{t.ht}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:20,marginBottom:36}}>
            {[[t.h1t,t.h1d,"#1CB0F6","01"],[t.h2t,t.h2d,"#E9A520","02"],[t.h3t,t.h3d,"#58CC02","03"]].map(([title,desc,clr,n])=>(
              <div key={n} style={{background:C.white,borderRadius:C.radiusLg,padding:"28px 24px",border:`2px solid ${clr}22`,boxShadow:C.shadow}}>
                <div style={{fontSize:13,color:clr,fontFamily:C.fb,fontWeight:900,marginBottom:12,background:clr+"15",borderRadius:C.radiusSm,display:"inline-block",padding:"5px 12px"}}>{n}</div>
                <div style={{fontSize:17,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{title}</div>
                <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,lineHeight:1.7,fontWeight:600}}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10,justifyContent:"center"}}>
            {[[t.tr1,"#1CB0F6"],[t.tr2,"#58CC02"],[t.tr3,"#E9A520"],[t.tr4,"#A259FF"]].map(([l,clr])=>(
              <div key={l} style={{background:clr+"12",border:`2px solid ${clr}33`,borderRadius:20,padding:"10px 20px",fontSize:13,fontFamily:C.fb,fontWeight:900,color:clr}}>{l}</div>
            ))}
          </div>
        </div>
      </div>
      {Footer()}
    </div>
  );

  const BrowsePage=()=>(
    <div>{SearchBar()}
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px"}}>
        <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:18}}>{isKa?`ნაპოვნია ${filtered.length} მასწავლებელი`:`${filtered.length} teacher${filtered.length===1?"":"s"} found`}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16}}>{filtered.map(tv=>TCard(tv))}</div>
        {filtered.length===0&&(
          <div style={{textAlign:"center",padding:56}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Hedgehog size={80}/></div>
            <div style={{color:C.muted,fontFamily:C.fb,fontSize:16,fontWeight:700,marginBottom:16}}>{isKa?"მასწავლებელი ვერ მოიძებნა":"No teachers found"}</div>
            <OBtn size="sm" onClick={()=>{setSearch("");setFilter("all");setCatF("all");}}>{isKa?"ფილტრების გასუფთავება":"Clear filters"}</OBtn>
          </div>
        )}
      </div>{Footer()}
    </div>
  );

  const GroupsPage=()=>(
    <div>
      <div style={{background:"linear-gradient(135deg,#E0F4FF,#FFFFFF)",padding:"36px 24px 28px",borderBottom:`2px solid ${C.border}`}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}><div style={{fontSize:28,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:5}}>{t.grp}</div><div style={{fontSize:14,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{isKa?"ჯგუფური გაკვეთილები მალე დაემატება.":"Group classes are opening soon."}</div></div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {GROUPS.map(g=>GroupCard(g))}
        </div>
      </div>{Footer()}
    </div>
  );

  const TeacherPage=()=>{
    if(!selT)return NotFoundPage({onBack:()=>go("home")});
    const safeTv={
      ...selT,
      av:selT.av||initials(selT.name),
      rating:selT.rating||5.0,reviews:selT.reviews||0,
      slots:selT.slots||[],rl:selT.rl||[],pkgs:selT.pkgs||[],
      speaks:selT.speaks||["Georgian"],
      resp:selT.resp||selT.response_time||"2 hrs",
      ska:selT.ska||selT.skill_ka||selT.skill||"",
      bka:selT.bka||selT.bio_ka||selT.bio||"",
      bio:selT.bio||selT.bka||"",
      online:selT.online!==false,offline:selT.offline||false,
    };
    return <>
      <TeacherProfileView key={safeTv.id} tv={safeTv} lang={lang} t={t} user={user} onAuth={openAuth}
        onBook={(item,slot)=>setPayment({item,slot})} onMsg={setMsgPeer} onBack={()=>go("browse")}/>
      {Footer()}
    </>;
  };

  const knownPages=["home","browse","teacher","groups","teach","dashboard","tos","pp","faq","about","admin"];
  return(
    <div style={{fontFamily:C.fb,background:C.bg,minHeight:"100vh",color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,textarea,button{font-family:'Nunito',sans-serif;}
        ::selection{background:#E0F4FF;color:#1CB0F6;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-track{background:#F0F8FF;}
        ::-webkit-scrollbar-thumb{background:#B0D8F0;border-radius:3px;}
        @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @media(max-width:860px){
          #desktop-nav{display:none!important;}
          #mobile-nav{display:flex!important;}
        }
        @media(min-width:861px){
          #mobile-nav{display:none!important;}
          #desktop-nav{display:flex!important;}
        }
        @media(max-width:760px){
          .cl-profile-grid{grid-template-columns:1fr!important;}
          .cl-book-box{position:static!important;}
          .cl-stats{grid-template-columns:repeat(2,1fr)!important;}
        }
      `}</style>
      {Nav()}
      {page==="home"&&Home()}
      {page==="browse"&&BrowsePage()}
      {page==="teacher"&&TeacherPage()}
      {page==="groups"&&GroupsPage()}
      {page==="teach"&&<TeachPage lang={lang} onBack={()=>go("home")} user={user} onLogin={openAuth}/>}
      {page==="dashboard"&&(user
        ?<Dashboard user={user} lang={lang} refreshKey={dashKey}
          onJoinVideo={(tv,sl,room)=>setVideo({teacher:tv,slot:sl,room:room||null})}
          onMsg={setMsgPeer} onGoTeach={()=>go("teach")} onPromote={()=>setShowPromote(true)}
          saved={saved} allTeachers={allTeachers} onOpenTeacher={openT} onBrowse={()=>{setCatF("all");go("browse");}}/>
        :<div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center",gap:16}}>
          <div style={{fontSize:20,fontWeight:900,fontFamily:C.fb}}>{isKa?"შედი ანგარიშში":"Please log in"}</div>
          <PBtn onClick={()=>openAuth("login")}>{t.nav_login}</PBtn>
        </div>)}
      {page==="tos"&&<LegalPage type="tos" lang={lang} onBack={()=>go("home")}/>}
      {page==="pp"&&<LegalPage type="pp" lang={lang} onBack={()=>go("home")}/>}
      {page==="faq"&&<FAQPage lang={lang} onBack={()=>go("home")}/>}
      {page==="about"&&<AboutPage lang={lang} user={user} onBack={()=>go("home")} onSignup={()=>openAuth("signup")} onBrowse={()=>{setCatF("all");go("browse");}}/>}
      {["tos","pp","faq","about"].includes(page)&&Footer()}
      {page==="admin"&&<AdminPage lang={lang} user={user} onBack={()=>go("home")}/>}
      {!knownPages.includes(page)&&<NotFoundPage onBack={()=>go("home")}/>}
      {!cookieAccepted&&<CookieBanner onAccept={acceptCookies} onDecline={declineCookies} onLearnMore={()=>go("pp")}/>}
      {showPromote&&<PromoteModal lang={lang} onClose={()=>setShowPromote(false)}/>}
      {authMode&&!user&&<AuthModal mode={authMode} lang={lang} onClose={()=>setAuthMode(null)}
        onAuth={u=>{const{intent,...clean}=u;saveUser(clean);setAuthMode(null);setToast({msg:isKa?`კეთილი იყოს შენი მობრძანება, ${u.name}! 🎉`:`Welcome, ${u.name}! 🎉`});if(intent==="teach")go("teach");}}/>}
      {payment&&user&&<PayModal item={payment.item} slot={payment.slot} lang={lang} user={user} onSuccess={onBooked} onClose={()=>setPayment(null)}/>}
      {video&&<VideoRoom teacher={video.teacher} slot={video.slot} bookingRoom={video.room} user={user} lang={lang} onClose={()=>{setVideo(null);setDashKey(k=>k+1);}}/>}
      {msgPeer&&user&&<MsgModal peer={msgPeer} user={user} lang={lang} onClose={()=>{setMsgPeer(null);setDashKey(k=>k+1);}}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {mobileMenu&&<div onClick={()=>setMobileMenu(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:8000}}/>}
      {mobileMenu&&<div style={{position:"fixed",top:64,left:0,right:0,bottom:0,zIndex:8001,overflowY:"auto",background:"#FFFFFF"}}>
        <div style={{padding:"16px 20px",borderBottom:`2px solid ${C.border}`,background:C.primaryLight}}>
          {user?<div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:14,color:C.primary,fontFamily:C.fb,fontWeight:700}}>{isKa?"შესულია:":"Logged in as"} <strong>{user.name}</strong></div>
            <div style={{display:"flex",gap:8}}>
              <PBtn onClick={()=>go("dashboard")} full size="sm">{t.nav_dash}</PBtn>
              <OBtn onClick={logout} full size="sm">{t.nav_out}</OBtn>
            </div>
          </div>:<div style={{display:"flex",gap:8}}>
            <PBtn onClick={()=>{setMobileMenu(false);openAuth("signup");}} full>{t.nav_signup}</PBtn>
            <OBtn onClick={()=>{setMobileMenu(false);openAuth("login");}} full>{t.nav_login}</OBtn>
          </div>}
        </div>
        {[
          {l:isKa?"მთავარი":"Home",p:"home"},
          {l:t.nav_browse,p:"browse"},
          {l:t.nav_groups,p:"groups"},
          {l:t.nav_teach,p:"teach"},
          {l:isKa?"ჩვენს შესახებ":"About us",p:"about"},
          {l:isKa?"ხშირად დასმული კითხვები":"FAQ",p:"faq"},
          ...(isAdmin?[{l:"🛡️ Admin",p:"admin"}]:[]),
        ].map(item=>(
          <button key={item.p} onClick={()=>{if(item.p==="browse")setCatF("all");go(item.p);}}
            style={{width:"100%",padding:"17px 24px",border:"none",borderBottom:`1px solid ${C.border}`,background:page===item.p?"#F0F8FF":"#FFFFFF",color:page===item.p?C.primary:"#1A1A1A",fontSize:17,fontWeight:700,fontFamily:C.fb,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            {item.l}<span style={{color:"#AAAAAA",fontSize:16}}>›</span>
          </button>
        ))}
      </div>}
    </div>
  );
}
