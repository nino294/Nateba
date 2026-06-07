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
const sendEmail = async ({ to, subject, html }) => {
  try { await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to, subject, html }) }); }
  catch (e) { console.log("Email:", { to, subject }); }
};

const C = {
  bg:"#FFFFFF", bg2:"#F0F8FF", card:"#FFFFFF",
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
    hero_cta:"Find a teacher",hero_cta2:"Start teaching",hero_proof:"verified teachers in Georgia",
    search_ph:"What do you want to learn?",
    fa:"All",fo:"Online",ff:"In-person",
    st:"Verified teachers",ss:"Students",sk:"Skills",sr:"Avg rating",
    sc:"What do you want to learn?",sf:"Featured teachers",sf2:"Personally reviewed by our team",
    sg:"Group classes",sg2:"",
    ht:"How it works",
    h1t:"Find a teacher",h1d:"Search by skill or category. Filter by price and availability.",
    h2t:"Book a session",h2d:"Start with a trial lesson. Pay securely online.",
    h3t:"Learn and review",h3d:"Video sessions built right in. Rate your teacher after.",
    tr1:"Verified teachers",tr2:"Secure payments",tr3:"Money-back",tr4:"Cancel anytime",
    cb:"Book trial",cr:"reviews",cs:"spots left",cj:"Join now",csv:"Save",csd:"Saved",
    con:"Online",cof:"In-person",cl:"/ session",cre:"Responds",
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
    pysc:"Secured by Stripe · Money-back guarantee",
    gt:"Gift this lesson",gn:"Recipient name",ge:"Recipient email",gm:"Personal message",
    dh:"Hey,",du:"Upcoming",dm:"Messages",de:"Earnings",dstu:"Students",dse:"Sessions",
    dj:"Join video",dem:"No upcoming sessions",dsp:"View profile",dd:"Decline",da:"Accept",
    tt:"Teach on Nateba",ts:"Share your skill with students across Georgia.",
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
    hero_cta:"იპოვე მასწავლებელი",hero_cta2:"დაიწყე სწავლება",hero_proof:"გადამოწმებული მასწავლებელი საქართველოში",
    search_ph:"რისი სწავლა გინდა?",
    fa:"ყველა",fo:"ონლაინ",ff:"ოფლაინ",
    st:"გადამოწმებული მასწავლებელი",ss:"მოსწავლე",sk:"დარგი",sr:"საშ. რეიტინგი",
    sc:"რის სწავლა გინდა?",sf:"რჩეული მასწავლებლები",sf2:"პირადად გადამოწმებული",
    sg:"ჯგუფური გაკვეთილები",sg2:"",
    ht:"როგორ მუშაობს",
    h1t:"იპოვე მასწავლებელი",h1d:"მოძებნე უნარით ან კატეგორიით.",
    h2t:"დაჯავშნე სესია",h2d:"საცდელი გაკვეთილი. გადაიხადე ონლაინ.",
    h3t:"ისწავლე და შეაფასე",h3d:"ვიდეო სესია პლატფორმაზე. დატოვე შეფასება.",
    tr1:"გადამოწმებული",tr2:"უსაფრთხო გადახდა",tr3:"თანხის დაბრუნება",tr4:"გაუქმება ნებისმიერ დროს",
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
    pysc:"Stripe · თანხის დაბრუნების გარანტია",
    gt:"საჩუქრად გაგზავნა",gn:"მიმღების სახელი",ge:"მიმღების ელ-ფოსტა",gm:"შეტყობინება",
    dh:"გამარჯობა,",du:"მომავალი გაკვეთილები",dm:"შეტყობინებები",de:"შემოსავალი",dstu:"მოსწავლე",dse:"გაკვეთილი",
    dj:"ვიდეო სესია",dem:"მომავალი გაკვეთილი არ არის",dsp:"პროფილი",dd:"უარყოფა",da:"მიღება",
    tt:"ასწავლე Nateba-ზე!",ts:"გახდი მასწავლებელი და ასწავლე საიდანაც გინდა.",
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

const Av=({initials,bg,size=48})=>(
  <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:size*0.32,fontWeight:900,fontFamily:C.fb,flexShrink:0}}>
    {initials}
  </div>
);

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
    <span style={{fontFamily:C.fb,fontWeight:900,fontSize:20,color:C.text,letterSpacing:"-0.5px"}}>nateba</span>
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

const ReportModal=({teacher,lang,onClose})=>{
  const t=T[lang];const [reason,setReason]=useState("");const [detail,setDetail]=useState("");const [done,setDone]=useState(false);
  if(done)return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:36,maxWidth:380,width:"100%",textAlign:"center",boxShadow:C.shadowLg}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Hedgehog size={70}/></div>
        <div style={{fontSize:17,fontWeight:800,color:C.text,fontFamily:C.fb,marginBottom:20}}>{t.rpok}</div>
        <PBtn onClick={onClose} full>Done</PBtn>
      </div>
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:28,maxWidth:420,width:"100%",boxShadow:C.shadowLg}}>
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
        <PBtn onClick={()=>setDone(true)} disabled={!reason} full variant="red">{t.rpb}</PBtn>
      </div>
    </div>
  );
};

const PostSession=({teacher,lang,onClose})=>{
  const t=T[lang];const [rating,setRating]=useState(0);const [comment,setComment]=useState("");const [showRep,setShowRep]=useState(false);const [done,setDone]=useState(false);
  if(showRep)return <ReportModal teacher={teacher} lang={lang} onClose={()=>{setShowRep(false);setDone(true);}}/>;
  if(done)return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:40,maxWidth:380,width:"100%",textAlign:"center",boxShadow:C.shadowLg}}>
        <div style={{fontSize:56,marginBottom:16}}>🎉</div>
        <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>Thank you!</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:24,lineHeight:1.6}}>{t.rts}</div>
        <PBtn onClick={onClose} full>Done</PBtn>
      </div>
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:32,maxWidth:420,width:"100%",boxShadow:C.shadowLg}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><Av initials={teacher.av} bg={CAT_COLORS[teacher.cat]||C.primary} size={64}/></div>
          <div style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:4}}>{t.rtt}</div>
          <div style={{fontSize:13,color:C.muted,fontFamily:C.fb}}>{t.rts}</div>
        </div>
        <div style={{marginBottom:24,textAlign:"center"}}><Stars r={rating} s={40} interactive onRate={setRating}/></div>
        <Inp label={t.rtc} value={comment} onChange={e=>setComment(e.target.value)} rows={3}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
          <OBtn onClick={()=>setShowRep(true)} full>{t.rtr}</OBtn>
          <PBtn onClick={()=>setDone(true)} disabled={rating===0} full>{t.rtb}</PBtn>
        </div>
      </div>
    </div>
  );
};

const VideoRoom=({teacher,slot,lang,onClose})=>{
  const t=T[lang];
  const room=`nateba-${teacher.name.replace(/\s+/g,"-").toLowerCase()}-${(slot||"session").replace(/[\s:]/g,"-")}`;
  const [ended,setEnded]=useState(false);const [showRep,setShowRep]=useState(false);
  if(ended)return <PostSession teacher={teacher} lang={lang} onClose={onClose}/>;
  return(
    <div style={{position:"fixed",inset:0,background:"#0D1117",zIndex:9998,display:"flex",flexDirection:"column"}}>
      <div style={{background:C.white,padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`2px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Av initials={teacher.av} bg={CAT_COLORS[teacher.cat]||C.primary} size={34}/>
          <div><div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{teacher.name}</div><div style={{fontSize:11,color:C.muted,fontFamily:C.fb}}>{teacher.skill}</div></div>
          <Badge color={C.ok}>● Live</Badge>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowRep(true)} style={{background:C.redLight,color:C.red,border:"none",borderRadius:C.radiusSm,padding:"8px 16px",fontSize:13,fontWeight:700,fontFamily:C.fb,cursor:"pointer"}}>{lang==="ka"?"შეტყობინება":"Report"}</button>
          <PBtn onClick={()=>setEnded(true)} size="sm" variant="red">End session</PBtn>
        </div>
      </div>
      <iframe src={`https://meet.jit.si/${room}`} style={{flex:1,border:"none"}} allow="camera; microphone; fullscreen; display-capture" title="Session"/>
      {showRep&&<ReportModal teacher={teacher} lang={lang} onClose={()=>setShowRep(false)}/>}
    </div>
  );
};

const AuthModal=({mode:initMode,lang,onAuth,onClose})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [mode,setMode]=useState(initMode||"login");
  const [name,setName]=useState("");const [email,setEmail]=useState("");const [pw,setPw]=useState("");const [pw2,setPw2]=useState("");
  const [role,setRole]=useState("student");const [loading,setLoading]=useState(false);const [gLoading,setGLoading]=useState(false);const [err,setErr]=useState("");
  const getErr=(code)=>{const m={"auth/invalid-credential":isKa?"არასწორი ელ-ფოსტა ან პაროლი":"Wrong email or password","auth/user-not-found":isKa?"ეს ელ-ფოსტა რეგისტრირებული არ არის":"No account with this email","auth/wrong-password":isKa?"პაროლი არასწორია":"Incorrect password","auth/email-already-in-use":isKa?"ეს ელ-ფოსტა უკვე გამოყენებულია":"Email already registered","auth/weak-password":isKa?"პაროლი მინიმუმ 6 სიმბოლო":"Password must be 6+ characters","auth/too-many-requests":isKa?"ზედმეტი მცდელობა. მოიცადე.":"Too many attempts. Please wait.","auth/network-request-failed":isKa?"ქსელის შეცდომა":"Network error","auth/unauthorized-domain":isKa?"დომეინი არ არის დამტკიცებული":"Domain not authorized in Firebase"};return m[code]||(isKa?`შეცდომა: ${code}`:`Error: ${code}`);};
  const signInGoogle=async()=>{setGLoading(true);setErr("");try{const result=await signInWithPopup(fbAuth,googleProvider);const u=result.user;const{data,error}=await supabase.from("users").upsert({firebase_uid:u.uid,phone:u.uid,name:u.displayName||u.email.split("@")[0],email:u.email,role:"student"},{onConflict:"firebase_uid"}).select().single();if(error)console.error("Supabase:",error);onAuth({name:u.displayName||u.email.split("@")[0],email:u.email,uid:u.uid,role:data?.role||"student",id:data?.id});}catch(e){if(e.code!=="auth/popup-closed-by-user"&&e.code!=="auth/cancelled-popup-request")setErr(getErr(e.code));}setGLoading(false);};
  const handleSubmit=async()=>{setErr("");if(!email||!pw){setErr(isKa?"შეავსე ყველა ველი":"Please fill in all fields");return;}if(mode==="signup"&&!name){setErr(isKa?"შეიყვანე სახელი":"Please enter your name");return;}if(mode==="signup"&&pw!==pw2){setErr(isKa?"პაროლები არ ემთხვევა":"Passwords do not match");return;}if(mode==="signup"&&pw.length<6){setErr(isKa?"პაროლი მინიმუმ 6 სიმბოლო":"Password must be 6+ characters");return;}setLoading(true);try{const{createUserWithEmailAndPassword,signInWithEmailAndPassword,updateProfile}=await import("firebase/auth");let fu;if(mode==="signup"){const c=await createUserWithEmailAndPassword(fbAuth,email,pw);fu=c.user;await updateProfile(fu,{displayName:name});}else{const c=await signInWithEmailAndPassword(fbAuth,email,pw);fu=c.user;}const displayName=mode==="signup"?name:(fu.displayName||email.split("@")[0]);const{data,error}=await supabase.from("users").upsert({firebase_uid:fu.uid,phone:fu.uid,name:displayName,email,role:mode==="signup"?role:"student"},{onConflict:"firebase_uid"}).select().single();if(error)console.error("Supabase:",error);onAuth({name:displayName,email,uid:fu.uid,role:data?.role||role,id:data?.id});}catch(e){console.error(e.code,e.message);setErr(getErr(e.code));}setLoading(false);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9996,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:32,width:"100%",maxWidth:420,boxShadow:C.shadowLg,border:`2px solid ${C.border}`,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}><Logo onClick={()=>{}}/><button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:34,height:34,fontSize:18,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button></div>
        <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:4}}>{mode==="login"?t.lt:t.st2}</div>
        <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,marginBottom:20}}>{mode==="login"?<>{isKa?"არ გაქვს ანგარიში? ":"No account? "}<span style={{color:C.primary,cursor:"pointer",fontWeight:900,textDecoration:"underline"}} onClick={()=>{setMode("signup");setErr("");}}>{isKa?"შექმნა":"Sign up"}</span></>:<>{isKa?"უკვე გაქვს? ":"Have an account? "}<span style={{color:C.primary,cursor:"pointer",fontWeight:900,textDecoration:"underline"}} onClick={()=>{setMode("login");setErr("");}}>{isKa?"შესვლა":"Log in"}</span></>}</div>
        <button onClick={signInGoogle} disabled={gLoading} style={{width:"100%",padding:"13px",background:"#fff",border:`2px solid ${C.border}`,borderRadius:C.radiusLg,fontSize:14,fontFamily:C.fb,fontWeight:800,cursor:gLoading?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,color:C.text,transition:"all 0.15s",opacity:gLoading?0.6:1}} onMouseEnter={e=>{if(!gLoading)e.currentTarget.style.borderColor=C.primary;}} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>{gLoading?"...":<><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.09-6.09C34.46 3.05 29.5 1 24 1 14.82 1 7.07 6.48 3.58 14.18l7.09 5.51C12.3 13.56 17.67 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.7c-.55 2.96-2.2 5.47-4.68 7.15l7.19 5.59C43.18 37.27 46.5 31.32 46.5 24.5z"/><path fill="#FBBC05" d="M10.67 28.31A14.6 14.6 0 0 1 9.5 24c0-1.5.26-2.95.71-4.31l-7.09-5.51A23.93 23.93 0 0 0 0 24c0 3.87.92 7.53 2.54 10.77l8.13-6.46z"/><path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.94l-7.19-5.59C28.5 37.96 26.35 38.5 24 38.5c-6.33 0-11.7-4.06-13.33-9.69l-8.13 6.46C6.07 42.52 14.46 47 24 47z"/></svg>{isKa?"Google-ით შესვლა":"Continue with Google"}</>}</button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}><div style={{flex:1,height:1,background:C.border}}/><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700}}>{isKa?"ან ელ-ფოსტით":"or with email"}</span><div style={{flex:1,height:1,background:C.border}}/></div>
        {mode==="signup"&&<><Inp label={isKa?"სახელი და გვარი":"Full name"} value={name} onChange={e=>setName(e.target.value)}/><div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:8}}>{isKa?"მე მინდა":"I want to"}</label><div style={{display:"flex",gap:8}}>{[["student",isKa?"სწავლა":"Learn"],["tutor",isKa?"სწავლება":"Teach"]].map(([v,l])=>(<button key={v} onClick={()=>setRole(v)} style={{flex:1,padding:"13px",border:`2px solid ${role===v?C.accent:C.border}`,borderRadius:C.radius,background:role===v?C.accentLight:C.bg2,color:role===v?C.accent:C.muted,fontSize:14,cursor:"pointer",fontFamily:C.fb,fontWeight:900,transition:"all 0.15s"}}>{l}</button>))}</div></div></>}
        <Inp label={isKa?"ელ-ფოსტა":"Email"} type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/>
        <Inp label={isKa?"პაროლი":"Password"} type="password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}}/>
        {mode==="signup"&&<Inp label={isKa?"პაროლის დადასტურება":"Confirm password"} type="password" value={pw2} onChange={e=>setPw2(e.target.value)}/>}
        {mode==="signup"&&<div style={{background:C.bg2,borderRadius:C.radius,padding:"12px 16px",marginBottom:16,fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600,lineHeight:1.6,border:`2px solid ${C.border}`}}><label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}><input type="checkbox" style={{marginTop:2,flexShrink:0,width:16,height:16,accentColor:C.primary}}/><span>{isKa?"ვადასტურებ, 18+ ვარ. ვეთანხმები ":"I confirm 18+. I agree to "}<span style={{color:C.primary,fontWeight:800}}>{isKa?"მომსახურების პირობებს":"Terms"}</span>{" & "}<span style={{color:C.primary,fontWeight:800}}>{isKa?"კონფიდენციალურობის პოლიტიკას":"Privacy Policy"}</span>.</span></label></div>}
        {err&&<div style={{background:C.redLight,border:`2px solid ${C.red}33`,borderRadius:C.radius,padding:"10px 14px",marginBottom:12,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
        <PBtn onClick={handleSubmit} full loading={loading} size="lg">{mode==="login"?(isKa?"შესვლა":"Log in"):(isKa?"ანგარიშის შექმნა":"Create account")}</PBtn>
      </div>
    </div>
  );
};

const PayModal=({item,slot,lang,user,onSuccess,onClose})=>{
  const t=T[lang];const [card,setCard]=useState("");const [exp,setExp]=useState("");const [cvv,setCvv]=useState("");
  const [isGift,setIsGift]=useState(false);const [gN,setGN]=useState("");const [gE,setGE]=useState("");const [gM,setGM]=useState("");
  const [loading,setLoading]=useState(false);const [done,setDone]=useState(false);
  const price=item.pkgPrice||item.trial||item.price;const fee=Math.round(price*0.1);
  const fmt=v=>v.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim();
  const fmtE=v=>{const d=v.replace(/\D/g,"").slice(0,4);return d.length>2?d.slice(0,2)+" / "+d.slice(2):d;};
  const pay=async()=>{if(card.length<19||!exp||!cvv)return;setLoading(true);try{const uid=user?.uid||user?.phone||"anon";const roomName=`nateba-${(item.name||item.teacher||"session").replace(/\s+/g,"-").toLowerCase()}-${Date.now()}`;const{error}=await supabase.from("bookings").insert({student_firebase_uid:uid,student_email:user?.email||null,student_name:user?.name||null,teacher_name:item.name||item.teacher||null,teacher_email:item.email||null,teacher_firebase_uid:item.firebase_uid||null,skill:item.skill||item.title||null,slot:slot||null,price:price,is_trial:!!item.trial&&price===item.trial,status:"confirmed",video_room:roomName});if(error)console.error("Booking save error:",error);await sendEmail({to:user?.email||"",subject:`${lang==="ka"?"დაჯავშნილია":"Booking confirmed"} — ${item.name||item.teacher}`,html:`<h2>Booking confirmed!</h2><p><b>Teacher:</b> ${item.name||item.teacher}</p><p><b>Skill:</b> ${item.skill||item.title}</p><p><b>Time:</b> ${slot}</p><p><b>Price:</b> ₾${price}</p>`});setDone(true);setTimeout(onSuccess,1600);}catch(e){console.error(e);}setLoading(false);};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,padding:28,width:"100%",maxWidth:440,boxShadow:C.shadowLg,border:`2px solid ${C.border}`,maxHeight:"92vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb}}>{t.pyt}</div>
          <button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:32,height:32,fontSize:16,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button>
        </div>
        {!done?<>
          <div style={{background:C.primaryLight,borderRadius:C.radius,padding:16,marginBottom:18,display:"flex",alignItems:"center",gap:14}}>
            <Av initials={item.av} bg={CAT_COLORS[item.cat]||C.primary} size={48}/>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:800,color:C.text,fontFamily:C.fb}}>{t.pyw} {item.name||item.teacher}</div><div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2}}>{slot||item.skill}</div></div>
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
          <Inp label={t.pyc} value={card} onChange={e=>setCard(fmt(e.target.value))} placeholder="1234 5678 9012 3456"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp label={t.pye} value={exp} onChange={e=>setExp(fmtE(e.target.value))} placeholder="MM / YY"/>
            <Inp label={t.pycv} value={cvv} onChange={e=>setCvv(e.target.value.slice(0,3))} placeholder="CVV"/>
          </div>
          <PBtn onClick={pay} full loading={loading} disabled={card.length<19} size="lg">{t.pyb} ₾{price}</PBtn>
          <div style={{textAlign:"center",fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:12}}>{t.pysc}</div>
        </>:(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Hedgehog size={90}/></div>
            <div style={{fontSize:24,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:6}}>{t.pyok}</div>
            <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{lang==="ka"?"შენი გზა დაიწყო!":"Your journey begins!"}</div>
          </div>
        )}
      </div>
    </div>
  );
};

const MsgModal=({teacher,lang,onClose})=>{
  const t=T[lang];const [msgs,setMsgs]=useState([{from:"teacher",text:"Hi! Happy to answer any questions before you book."}]);const [input,setInput]=useState("");
  const send=()=>{if(!input.trim())return;setMsgs(m=>[...m,{from:"student",text:input}]);setInput("");setTimeout(()=>setMsgs(m=>[...m,{from:"teacher",text:"Great! Let's schedule a trial session."}]),1200);};
  const catColor=CAT_COLORS[teacher.cat]||C.primary;
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9996,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(8px)"}}>
      <div style={{background:C.card,borderRadius:C.radiusLg,width:"100%",maxWidth:440,boxShadow:C.shadowLg,border:`2px solid ${C.border}`,display:"flex",flexDirection:"column",height:500}}>
        <div style={{padding:"16px 20px",borderBottom:`2px solid ${C.border}`,display:"flex",alignItems:"center",gap:12}}>
          <Av initials={teacher.av} bg={catColor} size={38}/>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{teacher.name}</div><div style={{fontSize:11,color:C.ok,fontFamily:C.fb,fontWeight:700}}>● Responds in {teacher.resp}</div></div>
          <button onClick={onClose} style={{background:C.bg2,border:"none",borderRadius:C.radiusSm,width:30,height:30,fontSize:16,cursor:"pointer",color:C.muted,fontWeight:700}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.from==="student"?"flex-end":"flex-start"}}>
              <div style={{background:m.from==="student"?C.accent:C.bg2,color:m.from==="student"?"#fff":C.text,borderRadius:m.from==="student"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",maxWidth:"75%",fontSize:13,fontFamily:C.fb,lineHeight:1.55,fontWeight:600}}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"12px 16px",borderTop:`2px solid ${C.border}`,display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={t.mph}
            style={{flex:1,padding:"11px 16px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,fontSize:13,fontFamily:C.fb,color:C.text,outline:"none"}}
            onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
          <PBtn onClick={send} size="sm">{t.ms}</PBtn>
        </div>
      </div>
    </div>
  );
};

const TeacherProfileEditor=({lang,user,onBack})=>{
  const isKa=lang==="ka";
  const [f,setF]=useState({name:user?.name||"",cat:"school",skill:"",skill_ka:"",price:"40",trial_price:"15",bio:"",bio_ka:"",video:"",online:true,offline:false,speaks:"Georgian",response_time:"2 hrs"});
  const [slots,setSlots]=useState([]);
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
        const{data}=await supabase.from("teacher_profiles").select("*").eq("firebase_uid",uid).single();
        if(data){
          setF({name:data.name||user?.name||"",cat:data.category||"school",skill:data.skill||"",skill_ka:data.skill_ka||"",price:String(data.price||40),trial_price:String(data.trial_price||15),bio:data.bio||"",bio_ka:data.bio_ka||"",video:data.video_url||"",online:data.online!==false,offline:data.offline||false,speaks:(data.speaks||["Georgian"]).join(", "),response_time:data.response_time||"2 hrs"});
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
      const{error}=await supabase.from("teacher_profiles").upsert({firebase_uid:uid,name:f.name,email:user?.email||null,category:f.cat,skill:f.skill||f.skill_ka,skill_ka:f.skill_ka||f.skill,price:parseInt(f.price),trial_price:parseInt(f.trial_price||15),bio:f.bio||f.bio_ka,bio_ka:f.bio_ka||f.bio,video_url:f.video||null,online:f.online,offline:f.offline,speaks:f.speaks.split(",").map(s=>s.trim()).filter(Boolean),response_time:f.response_time||"2 hrs",active:true},{onConflict:"firebase_uid"});
      if(error) throw error;
      await supabase.from("teacher_slots").delete().eq("firebase_uid",uid);
      if(slots.length>0) await supabase.from("teacher_slots").insert(slots.map(s=>({firebase_uid:uid,slot:s})));
      setSavedOk(true);setTimeout(()=>setSavedOk(false),3000);
    }catch(e){setErr(isKa?"შეცდომა შენახვისას.":"Error saving. Please try again.");}
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
      <div style={{background:C.bg2,borderRadius:C.radiusLg,padding:"20px 22px",marginBottom:16,border:`2px solid ${C.border}`}}><div style={{fontSize:13,fontWeight:900,color:C.ok,fontFamily:C.fb,marginBottom:14,textTransform:"uppercase",letterSpacing:"0.8px"}}>{isKa?"ხელმისაწვდომობა":"Availability"}</div>
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

const TeachForm=({lang,user,onBack,onDone})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [f,setF]=useState({name:user?.name||"",cat:"school",skill:"",price:"",bio:"",video:"",online:true,offline:false});
  const [loading,setLoading]=useState(false);const [err,setErr]=useState("");
  const submit=async()=>{if(!f.name||!f.skill||!f.price||!f.bio){setErr(isKa?"შეავსე ყველა სავალდებულო ველი":"Please fill in all required fields");return;}setLoading(true);setErr("");try{const{error}=await supabase.from("teacher_applications").insert({firebase_uid:user?.uid||user?.phone||null,name:f.name,email:user?.email||null,category:f.cat,skill:f.skill,price:parseInt(f.price),bio:f.bio,video_url:f.video||null,online:f.online,offline:f.offline,status:"pending"});if(error)throw error;await sendEmail({to:"hello@nateba.ge",subject:`New teacher application: ${f.name} — ${f.skill}`,html:`<h2>New application</h2><p><b>Name:</b> ${f.name}</p><p><b>Email:</b> ${user?.email}</p><p><b>Skill:</b> ${f.skill}</p><p><b>Price:</b> ₾${f.price}</p><p><b>Bio:</b> ${f.bio}</p>`});onDone();}catch(e){console.error(e);setErr(isKa?"შეცდომა. სცადე ხელახლა.":"Error. Please try again.");}setLoading(false);};
  return(
    <div style={{maxWidth:640,margin:"0 auto",padding:"40px 24px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:24,padding:0,fontWeight:900}}>← {t.back}</button>
      <div style={{fontSize:32,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:6}}>{t.tt}</div>
      <div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:28,lineHeight:1.6}}>{t.ts}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:28}}>{[[t.tc1,"#1CB0F6"],[t.tc2,"#A259FF"],[t.tc3,"#58CC02"],[t.tc4,"#E9A520"]].map(([l,clr])=>(<div key={l} style={{background:clr+"15",border:`2px solid ${clr}33`,borderRadius:C.radius,padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}><div style={{width:10,height:10,borderRadius:"50%",background:clr,flexShrink:0}}/><span style={{fontFamily:C.fb,fontSize:13,color:clr,fontWeight:800}}>{l}</span></div>))}</div>
      <Inp label={`${t.tn} *`} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/>
      <div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:6}}>{t.tc}</label><select value={f.cat} onChange={e=>setF(p=>({...p,cat:e.target.value}))} style={{width:"100%",padding:"13px 16px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,fontSize:14,fontFamily:C.fb,color:C.text,outline:"none"}}>{CATEGORIES.map(c=><option key={c.id} value={c.id}>{lang==="ka"?c.lka:c.label}</option>)}</select></div>
      <div style={{marginBottom:16}}><label style={{display:"block",fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:6}}>{t.tsk} *</label><input value={f.skill} onChange={e=>setF(p=>({...p,skill:e.target.value}))} placeholder={isKa?"მაგ: პიანო, ინგლისური...":"e.g. Piano, English..."} style={{width:"100%",padding:"13px 16px",background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,fontSize:14,fontFamily:C.fb,color:C.text,outline:"none",boxSizing:"border-box"}} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/></div>
      <Inp label={`${t.tp} *`} type="number" value={f.price} onChange={e=>setF(p=>({...p,price:e.target.value}))} placeholder="40"/>
      <Inp label={`${t.tb} *`} value={f.bio} onChange={e=>setF(p=>({...p,bio:e.target.value}))} rows={4} placeholder={isKa?"მოგვიყევი გამოცდილებასა და სტილზე...":"Tell us about your experience..."}/>
      <Inp label={`${t.tv2} (${isKa?"არასავალდებულო":"optional"})`} value={f.video} onChange={e=>setF(p=>({...p,video:e.target.value}))} placeholder="https://youtube.com/..."/>
      <div style={{display:"flex",gap:20,marginBottom:28}}>{[["online",t.ton],["offline",t.tof]].map(([k,l])=>(<label key={k} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontFamily:C.fb,fontSize:14,color:C.mid,fontWeight:700}}><input type="checkbox" checked={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.checked}))} style={{accentColor:C.primary}}/>{l}</label>))}</div>
      {err&&<div style={{background:C.redLight,border:`2px solid ${C.red}33`,borderRadius:C.radius,padding:"11px 16px",marginBottom:14,fontSize:13,color:C.red,fontFamily:C.fb,fontWeight:700}}>⚠️ {err}</div>}
      <PBtn onClick={submit} full loading={loading} size="lg">{t.tsub}</PBtn>
    </div>
  );
};

const TeachPage=({lang,onBack,user,onLogin})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [status,setStatus]=useState(null);const [checkDone,setCheckDone]=useState(false);
  useEffect(()=>{if(!user){setCheckDone(true);return;}if(user.role==="tutor"){setStatus("approved");setCheckDone(true);return;}checkApp();},[user]);
  const checkApp=async()=>{try{const uid=user?.uid||user?.phone;const{data}=await supabase.from("teacher_applications").select("status").eq("firebase_uid",uid).order("created_at",{ascending:false}).limit(1).single();setStatus(data?.status||"none");}catch(e){setStatus("none");}setCheckDone(true);};
  if(!user)return(<div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>🎓</div><div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{isKa?"ასწავლე Nateba-ზე":"Teach on Nateba"}</div><div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:28,lineHeight:1.6,maxWidth:360}}>{isKa?"შეხვედი ანგარიშში ან შექმენი ანგარიში განაცხადის გასაგზავნად.":"Log in or create an account to apply as a teacher."}</div><div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}><PBtn onClick={()=>onLogin("signup")} size="lg">{isKa?"ანგარიშის შექმნა":"Create account"}</PBtn><OBtn onClick={()=>onLogin("login")} size="lg">{isKa?"შესვლა":"Log in"}</OBtn></div><button onClick={onBack} style={{marginTop:20,background:"none",border:"none",color:C.muted,fontFamily:C.fb,fontSize:13,cursor:"pointer",fontWeight:700}}>← {t.back}</button></div>);
  if(!checkDone)return<div style={{textAlign:"center",padding:60,color:C.muted,fontFamily:C.fb,fontSize:15}}>Loading...</div>;
  if(status==="approved"||user.role==="tutor")return<TeacherProfileEditor lang={lang} user={user} onBack={onBack}/>;
  if(status==="pending")return(<div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}><div style={{fontSize:56,marginBottom:16}}>⏳</div><div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{isKa?"განაცხადი განიხილება":"Application under review"}</div><div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:12,lineHeight:1.7,maxWidth:400}}>{isKa?"შენი განაცხადი მიღებულია. ჩვენი გუნდი 24 საათში განიხილავს და გამოგიგზავნის პასუხს ელ-ფოსტაზე.":"Your application has been received. Our team will review it within 24 hours and email you the result."}</div><div style={{background:C.accentLight,border:`2px solid ${C.accent}44`,borderRadius:C.radiusLg,padding:"14px 20px",fontSize:13,color:C.accent,fontFamily:C.fb,fontWeight:700,marginBottom:24,maxWidth:400}}>📧 {isKa?"პასუხი გაიგზავნება:":"Answer will be sent to:"} <strong>{user?.email}</strong></div><PBtn onClick={onBack}>{isKa?"მთავარ გვერდზე დაბრუნება":"Back to home"}</PBtn></div>);
  return<TeachForm lang={lang} user={user} onBack={onBack} onDone={()=>setStatus("pending")}/>;
};


const Dashboard=({user,lang,onJoinVideo,onMsg,onGoTeach,onPromote,saved,onOpenTeacher,onBrowse})=>{
  const t=T[lang];const isKa=lang==="ka";const isTutor=user.role==="tutor";
  const [tab,setTab]=useState("upcoming");const [showStu,setShowStu]=useState(null);
  const [bookings,setBookings]=useState([]);const [loadingB,setLoadingB]=useState(true);const [appStatus,setAppStatus]=useState(null);
  useEffect(()=>{loadBookings();checkApplication();},[]);
  const loadBookings=async()=>{setLoadingB(true);try{const uid=user?.uid||user?.phone;const{data}=await supabase.from("bookings").select("*").eq("student_firebase_uid",uid).order("created_at",{ascending:false});if(data)setBookings(data);}catch(e){console.error(e);}setLoadingB(false);};
  const checkApplication=async()=>{try{const uid=user?.uid||user?.phone;const{data}=await supabase.from("teacher_applications").select("status").eq("firebase_uid",uid).order("created_at",{ascending:false}).limit(1).single();if(data)setAppStatus(data.status);}catch(e){}};
  const upcoming=bookings.filter(b=>b.status==="confirmed");
  const history=bookings.filter(b=>b.status==="completed");
  return(
    <div style={{maxWidth:860,margin:"0 auto",padding:"40px 24px"}}>
      <div style={{marginBottom:32}}>
        <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:4}}>{t.dh}</div>
        <div style={{fontSize:32,fontWeight:900,color:C.text,fontFamily:C.fb}}>{user.name} 👋</div>
      </div>
      {appStatus==="pending"&&!isTutor&&(
        <div style={{background:"#FFF8E0",border:`2px solid ${C.accent}44`,borderRadius:C.radiusLg,padding:"16px 20px",marginBottom:24,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{fontSize:24}}>⏳</div>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:C.accent,fontFamily:C.fb}}>{isKa?"შენი განაცხადი განიხილება":"Your teacher application is under review"}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:3}}>{isKa?"24 საათში გამოგიგზავნით პასუხს.":"We will get back to you within 24 hours."}</div>
          </div>
        </div>
      )}
      {isTutor&&<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
          {[[t.de,`₾${bookings.reduce((a,b)=>a+(b.price||0),0)}`,"#1CB0F6"],[t.dstu,`${new Set(bookings.map(b=>b.student_firebase_uid)).size}`,"#58CC02"],[t.dse,`${bookings.length}`,"#A259FF"]].map(([l,v,clr])=>(
            <div key={l} style={{background:clr+"12",border:`2px solid ${clr}33`,borderRadius:C.radiusLg,padding:"20px 18px"}}>
              <div style={{fontSize:11,color:clr,fontFamily:C.fb,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>{l}</div>
              <div style={{fontSize:28,fontWeight:900,color:clr,fontFamily:C.fb}}>{v}</div>
            </div>
          ))}
        </div>
      </>}
      {!isTutor&&!appStatus&&(
        <div style={{background:C.primaryLight,border:`2px solid ${C.primary}33`,borderRadius:C.radiusLg,padding:"18px 20px",marginBottom:24,display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div>
            <div style={{fontSize:14,fontWeight:900,color:C.primary,fontFamily:C.fb}}>{isKa?"გახდი მასწავლებელი Nateba-ზე":"Become a teacher on Nateba"}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:3}}>{isKa?"გაუზიარე შენი ცოდნა და გამოიმუშავე.":"Share your knowledge and earn."}</div>
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:4,borderBottom:`2px solid ${C.border}`,marginBottom:20,overflowX:"auto"}}>
        {(isTutor?[["upcoming",t.du],["inbox",t.dm],["history",isKa?"ისტორია":"History"]]:[["upcoming",t.du],["inbox",t.dm],["saved",isKa?"შენახული ♥":"Saved ♥"],["history",isKa?"ისტორია":"History"]]).map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"12px 20px",border:"none",background:"none",fontSize:14,fontWeight:900,fontFamily:C.fb,color:tab===k?C.accent:C.muted,borderBottom:`3px solid ${tab===k?C.accent:"transparent"}`,marginBottom:-2,cursor:"pointer",transition:"all 0.15s",whiteSpace:"nowrap"}}>{l}</button>
        ))}
      </div>
      {tab==="upcoming"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
        {loadingB&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb}}>Loading...</div>}
        {!loadingB&&upcoming.map((b,i)=>(
          <div key={i} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:46,height:46,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:15,fontWeight:900,fontFamily:C.fb,flexShrink:0}}>{(b.teacher_name||"T").slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{b.teacher_name||b.student_name}</div>
                <div style={{fontSize:12,color:C.primary,fontFamily:C.fb,fontWeight:800}}>{b.skill}</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:2}}>{b.slot}</div>
              </div>
            </div>
            <PBtn onClick={()=>onJoinVideo({name:b.teacher_name,skill:b.skill,cat:"tech",av:(b.teacher_name||"T").slice(0,2).toUpperCase()},b.slot)} size="sm">{t.dj}</PBtn>
          </div>
        ))}
        {!loadingB&&upcoming.length===0&&(
          <div style={{textAlign:"center",padding:"32px 24px"}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><Hedgehog size={80}/></div>
            <div style={{color:C.muted,fontFamily:C.fb,fontSize:15,fontWeight:600}}>{t.dem}</div>
          </div>
        )}
      </div>}
      {tab==="inbox"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div style={{textAlign:"center",padding:"32px 24px",color:C.muted,fontFamily:C.fb,fontSize:14,fontWeight:600}}>{isKa?"შეტყობინებები მალე გამოჩნდება.":"Messages coming soon."}</div>
      </div>}
      {tab==="saved"&&<div>
        <div style={{textAlign:"center",padding:"48px 24px"}}>
          <div style={{fontSize:48,marginBottom:12}}>♡</div>
          <div style={{fontSize:18,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:6}}>{isKa?"შენახული მასწავლებელი":"Saved teachers"}</div>
          <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{isKa?"მოძებნე და გული დააჭირე ბარათზე.":"Browse and tap the heart on teacher cards."}</div>
        </div>
      </div>}
      {tab==="history"&&<div>
        {loadingB&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb}}>Loading...</div>}
        {!loadingB&&history.length===0&&<div style={{textAlign:"center",padding:"32px 24px",color:C.muted,fontFamily:C.fb,fontSize:14,fontWeight:600}}>{isKa?"დასრულებული გაკვეთილი არ არის.":"No completed sessions yet."}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {history.map((b,i)=>(
            <div key={i} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:"50%",background:C.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:900,fontFamily:C.fb,flexShrink:0}}>{(b.teacher_name||"T").slice(0,2).toUpperCase()}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{b.teacher_name}</div>
                <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2}}>{b.slot} · ₾{b.price}</div>
              </div>
              <div style={{fontSize:11,color:C.ok,fontFamily:C.fb,fontWeight:700}}>✓ {isKa?"დასრულდა":"Completed"}</div>
            </div>
          ))}
        </div>
      </div>}
      {showStu&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9996,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.card,borderRadius:C.radiusLg,padding:28,maxWidth:360,width:"100%",boxShadow:C.shadowLg,border:`2px solid ${C.border}`}}>
            <PBtn onClick={()=>setShowStu(null)} full>Close</PBtn>
          </div>
        </div>
      )}
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
          <p style={{marginBottom:12}}><strong>Last updated: June 2025</strong></p>
          <p style={{marginBottom:16}}>These Terms of Service govern your use of Nateba.com. By creating an account you agree to these terms.</p>
          <p style={{marginBottom:8}}><strong>1. Platform Role</strong></p><p style={{marginBottom:16}}>Nateba.com is a marketplace connecting independent teachers with students. We do not employ teachers. Each teacher is an independent professional.</p>
          <p style={{marginBottom:8}}><strong>2. Account Requirements</strong></p><p style={{marginBottom:16}}>You must be 18 or older. Under-18 users need parental consent. Phone number verification via SMS is required.</p>
          <p style={{marginBottom:8}}><strong>3. Teacher Verification</strong></p><p style={{marginBottom:16}}>All teacher applications are manually reviewed. We may decline or remove any teacher for quality or safety reasons. ID verification is required during onboarding.</p>
          <p style={{marginBottom:8}}><strong>4. Payments and Fees</strong></p><p style={{marginBottom:16}}>Payments are processed via Stripe. A platform service fee applies per transaction as detailed in the teacher agreement. We do not store card details.</p>
          <p style={{marginBottom:8}}><strong>5. Cancellations and Refunds</strong></p><p style={{marginBottom:16}}>Full refund if cancelled 24+ hours before session. No refund within 24 hours unless teacher cancels. Technical failures qualify for reschedule or refund.</p>
          <p style={{marginBottom:8}}><strong>6. Prohibited Conduct</strong></p><p style={{marginBottom:16}}>Prohibited: off-platform sessions to avoid fees; sharing contact details before confirmed booking; harassment or discrimination; recording sessions without consent; multiple accounts to evade restrictions.</p>
          <p style={{marginBottom:8}}><strong>7. Safety and Reporting</strong></p><p style={{marginBottom:16}}>Reports reviewed within 24 hours. Three confirmed reports triggers automatic review. Violations may result in suspension or permanent ban.</p>
          <p style={{marginBottom:8}}><strong>8. Student Profiles</strong></p><p style={{marginBottom:16}}>Teachers may view student ratings before accepting bookings and may decline any booking without giving a reason.</p>
          <p style={{marginBottom:8}}><strong>9. Governing Law</strong></p><p>Governed by Georgian law. Disputes resolved in Tbilisi courts.</p>
        </>:<>
          <p style={{marginBottom:12}}><strong>Last updated: June 2025</strong></p>
          <p style={{marginBottom:16}}>Nateba.com protects your privacy and personal data.</p>
          <p style={{marginBottom:8}}><strong>1. Data We Collect</strong></p><p style={{marginBottom:16}}>Name, email, phone number (SMS-verified), profile info, booking history, ratings, and usage data.</p>
          <p style={{marginBottom:8}}><strong>2. How We Use It</strong></p><p style={{marginBottom:16}}>To operate the platform, verify identity, process payments via Stripe (no card storage), send confirmations, maintain safety. We do not sell your data.</p>
          <p style={{marginBottom:8}}><strong>3. Phone Verification</strong></p><p style={{marginBottom:16}}>Used for security only. Not shared publicly or with other users.</p>
          <p style={{marginBottom:8}}><strong>4. Your Rights</strong></p><p style={{marginBottom:16}}>Access, correct, or delete your data at privacy@nateba.com. Requests processed within 30 days.</p>
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
      <div style={{fontSize:12,color:"rgba(255,255,255,0.65)",fontFamily:C.fb,lineHeight:1.6}}>We use essential cookies for login and optional analytics cookies to improve Nateba. <button onClick={onLearnMore} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12,fontFamily:C.fb,fontWeight:700,padding:0,textDecoration:"underline"}}>Learn more</button></div>
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
    {q:"როგორ ხდება გადახდა?",a:"გადახდა ხდება ონლაინ, უსაფრთხოდ, Stripe-ის მეშვეობით. შენი ბარათის მონაცემები არასოდეს ინახება ჩვენს სერვერებზე. მასწავლებელი გადახდას იღებს სესიის დასრულების შემდეგ."},
    {q:"რა მოხდება თუ მასწავლებელი არ მომეწონება?",a:"ყველა მასწავლებელი გთავაზობს საცდელ გაკვეთილს შემცირებული ფასით. თუ საცდელი გაკვეთილის შემდეგ კმაყოფილი არ ხარ, სრულ თანხას დაგიბრუნებთ — კითხვების გარეშე."},
    {q:"შეიძლება ჯავშნის გაუქმება?",a:"დიახ — გაუქმება სესიამდე მინიმუმ 24 საათით ადრე სრული თანხის დაბრუნებას გულისხმობს. 24 საათის ფარგლებში გაუქმება არ ანაზღაურდება, გარდა იმ შემთხვევისა, თუ მასწავლებელი გაუუქმებს."},
    {q:"გადამოწმებულია თუ არა მასწავლებლები?",a:"დიახ. ყველა განაცხადი ჩვენი გუნდის მიერ ხელით განიხილება დამტკიცებამდე. ვამოწმებთ მათ კვალიფიკაციას და ვატარებთ ხარისხის შეფასებას."},
    {q:"როგორ მუშაობს ვიდეო სესიები?",a:"ჯავშნის შემდეგ ვიდეო ოთახი ავტომატურად იქმნება. შენ და შენი მასწავლებელი შეხვდებით დანიშნულ დროს — გადმოწერა არ არის საჭირო, ყველაფერი ბრაუზერში მუშაობს."},
    {q:"შეიძლება ქართულ ენაზე სწავლა?",a:"დიახ. ბევრი მასწავლებელი ქართულ ენაზე ასწავლის. ჯავშნამდე შეგიძლია მასწავლებელს შეტყობინება გაუგზავნო და სასწავლო ენის შესახებ ჰკითხო."},
    {q:"როგორ გავხდე მასწავლებელი?",a:"დააჭირე 'სწავლება' ღილაკს მენიუში და შეავსე განაცხადის ფორმა. ყველა განაცხადს 24 საათის განმავლობაში განვიხილავთ."},
    {q:"რისი სწავლა შეიძლება?",a:"ყველაფერი — სასკოლო საგნები, მუსიკა, ვოკალი, ცეკვა, AI და ტექნოლოგიები, კულინარია, ენები, ფლორისტიკა, ფიტნეს, ფოტოგრაფია და კიდევ ბევრი სხვა. ყველა კატეგორია მთავარ გვერდზეა."},
  ]:[
    {q:"How does payment work?",a:"You pay securely online when you book. We use Stripe — your card details are never stored on our servers. Teachers receive their payment after the session is completed."},
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
      <div style={{fontSize:15,color:C.muted,fontFamily:C.fb,marginBottom:36,fontWeight:600}}>{isKa?"ყველაფერი რაც Nateba-ს შესახებ უნდა იცოდე.":"Everything you need to know about Nateba."}</div>
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

const AboutPage=({lang,onBack,onSignup})=>{
  const t=T[lang];
  const isKa = lang==="ka";
  return(
    <div style={{maxWidth:760,margin:"0 auto",padding:"40px 24px 60px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:32,padding:0,fontWeight:900}}>← {t.back}</button>
      {/* Hero */}
      <div style={{marginBottom:40}}>
        <div style={{fontSize:isKa?28:34,fontWeight:900,color:C.text,fontFamily:C.fb,lineHeight:1.3,marginBottom:20}}>
          {isKa?<>განათლება — ეს არის სინათლე.<br/>ნათება შექმნილია იმისთვის, რომ ეს სინათლე ყველასთვის ხელმისაწვდომი გახდეს.</>:<>Learning is light.<br/>Nateba exists to make that light available to everyone.</>}
        </div>
        <div style={{fontSize:16,color:C.muted,fontFamily:C.fb,lineHeight:1.85,fontWeight:600,marginBottom:24}}>
          {isKa?"ჩვენ საქართველოში ვცხოვრობთ და ვიცით, რომ კარგი განათლება ყველასთვის ხელმისაწვდომი უნდა იყოს.":"We believe quality education should be accessible to everyone, everywhere in Georgia."}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {(isKa?[
            "✦ გადამოწმებული მასწავლებლები — ყველა მასწავლებელი ხელით შემოწმდება ჩვენი გუნდის მიერ",
            "✦ ონლაინ და ოფლაინ — ისწავლე სახლიდან ან პირადად, შენი გრაფიკით",
            "✦ ნებისმიერი კურსი — მუსიკა, ენები, AI, ცეკვა, კულინარია და კიდევ ბევრი",
            "✦ უსაფრთხო გადახდა — ყველა ტრანზაქცია დაცულია Stripe-ის მეშვეობით",
            "✦ საცდელი გაკვეთილი — პირველი სესია შემცირებული ფასით, რისკის გარეშე",
            "✦ ორივე მხარე რეიტინგდება — მასწავლებლებიც და მოსწავლეებიც",
          ]:[
            "✦ Verified teachers — every teacher is manually reviewed by our team",
            "✦ Online and offline — learn from home or in person, on your schedule",
            "✦ Any subject — music, languages, AI, dance, cooking and many more",
            "✦ Secure payments — every transaction protected via Stripe",
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
          {icon:"🇬🇪",title:isKa?"შექმნილია საქართველოში":"Made in Georgia",desc:isKa?"ნათება შექმნილია ქართველი გუნდის მიერ, ქართველი მასწავლებლებისა და მოსწავლეებისთვის.":"Built by a Georgian team, with Georgian teachers and students at heart.",color:"#D4380D"},
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
          {isKa?"შეუერთდი ათასობით სტუდენტს საქართველოში.":"Join thousands of students across Georgia."}
        </div>
        <PBtn onClick={onSignup} size="lg">{isKa?"დაწყება":"Get started"}</PBtn>
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
  const submit=()=>{
    if(!email.includes("@"))return;
    setLoading(true);
    setTimeout(()=>{setLoading(false);setDone(true);},1200);
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
      <PBtn onClick={submit} loading={loading} disabled={!email.includes("@")}>
        {isKa?"გამოწერა":"Subscribe"}
      </PBtn>
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
    return availableSlots.filter(s=>s.startsWith(dayName));
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
            {formatDate(selectedDate)} — {isKa?"დრო":"Time"}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {selectedDateSlots.map(slot=>{
              const booked=isSlotBooked(selectedDate,slot);
              const time=slot.split(" ")[1];
              const fullSlot=getSlotDateTime(selectedDate,slot);
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


const TeacherProfileView=({tv,lang,t,slot,setSlot,calendarDate,setCalendarDate,user,setAuthMode,setPayment,setMsgT,setVideoT,setVideoSlot,pTab,setPTab,go})=>{
  const catColor=CAT_COLORS[tv.cat]||C.primary;
  const [profileSlots,setProfileSlots]=useState(tv.slots||[]);
  useEffect(()=>{
    setProfileSlots(tv.slots||[]);
    if(tv.firebase_uid){
      supabase.from("teacher_slots").select("slot").eq("firebase_uid",tv.firebase_uid)
        .then(({data})=>{if(data&&data.length>0)setProfileSlots(data.map(s=>s.slot));});
    }
  },[tv.id,tv.firebase_uid]);
  const video=tv.video||tv.video_url||null;
  return(
    <div>
      <div style={{maxWidth:1000,margin:"0 auto",padding:"28px 24px"}}>
        <button onClick={()=>go("browse")} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:20,padding:0,fontWeight:900}}>← {t.back}</button>
        <div style={{display:"grid",gridTemplateColumns:"1fr 290px",gap:24,alignItems:"start"}}>
          <div>
            <div style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:24,marginBottom:18,overflow:"hidden",boxShadow:C.shadow}}>
              <div style={{height:6,background:catColor,margin:"-24px -24px 24px",borderRadius:"18px 18px 0 0"}}/>
              <div style={{display:"flex",gap:18,alignItems:"flex-start"}}>
                <Av initials={tv.av} bg={catColor} size={72}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:24,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:4}}>{tv.name}</div>
                  <div style={{fontSize:14,color:catColor,fontFamily:C.fb,fontWeight:900,marginBottom:10}}>{lang==="ka"?tv.ska:tv.skill}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
                    <Stars r={tv.rating||5} s={14}/><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{tv.rating||5} ({tv.reviews||0} {t.cr})</span>
                    {tv.online&&<Badge color="#58CC02">{t.con}</Badge>}
                    {tv.offline&&<Badge color="#4A90D9">{t.cof}</Badge>}
                  </div>
                  <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{t.cre} {tv.resp||"2 hrs"}</div>
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:4,borderBottom:`2px solid ${C.border}`,marginBottom:20}}>
              {[["about",t.pa],["reviews",t.pr],["availability",t.pav],["packages",t.pp]].map(([tab,l])=>(
                <button key={tab} onClick={()=>setPTab(tab)} style={{padding:"10px 16px",border:"none",background:"none",fontSize:13,color:pTab===tab?catColor:C.muted,fontFamily:C.fb,cursor:"pointer",fontWeight:pTab===tab?900:600,borderBottom:`3px solid ${pTab===tab?catColor:"transparent"}`,marginBottom:-2,transition:"all 0.15s"}}>{l}</button>
              ))}
            </div>
            {pTab==="about"&&<>
              {video&&<div style={{marginBottom:20,borderRadius:C.radiusLg,overflow:"hidden",border:`2px solid ${C.border}`,position:"relative",paddingBottom:"56.25%",height:0}}>
                <iframe src={video.replace("watch?v=","embed/").replace("youtu.be/","www.youtube.com/embed/").replace("vimeo.com/","player.vimeo.com/video/")} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:"none"}} allowFullScreen title="Teacher intro"/>
              </div>}
              <p style={{fontSize:14,color:C.mid,fontFamily:C.fb,lineHeight:1.85,marginBottom:18,fontWeight:600}}>{lang==="ka"?(tv.bka||tv.bio||""):(tv.bio||tv.bka||"")}</p>
              <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>{t.psp}</div>
              <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{(tv.speaks||["Georgian"]).map(s=><Badge key={s} color={catColor}>{s}</Badge>)}</div>
            </>}
            {pTab==="reviews"&&<>
              {(tv.rl||[]).length===0&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb,fontSize:14,fontWeight:600}}>{lang==="ka"?"შეფასება ჯერ არ არის":"No reviews yet"}</div>}
              {(tv.rl||[]).map((r,i)=>(<div key={i} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,padding:"14px 16px",marginBottom:10}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,fontWeight:900,color:C.text,fontFamily:C.fb}}>{r.n}</span><Stars r={r.r} s={13}/></div><div style={{fontSize:13,color:C.mid,fontFamily:C.fb,lineHeight:1.6,fontWeight:600}}>{r.t}</div></div>))}
            </>}
            {pTab==="availability"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:8}}>
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>(<div key={day} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radius,padding:"12px 13px"}}><div style={{fontSize:12,fontWeight:900,color:catColor,fontFamily:C.fb,marginBottom:7}}>{day}</div>{profileSlots.filter(s=>s.startsWith(day)).map(s=><div key={s} style={{fontSize:12,color:C.mid,fontFamily:C.fb,marginBottom:3,fontWeight:700}}>{s.split(" ")[1]}</div>)}{profileSlots.filter(s=>s.startsWith(day)).length===0&&<div style={{fontSize:11,color:C.muted,fontFamily:C.fb}}>—</div>}</div>))}
            </div>}
            {pTab==="packages"&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
              {(tv.pkgs||[]).length===0&&<div style={{textAlign:"center",padding:32,color:C.muted,fontFamily:C.fb,fontSize:14,fontWeight:600}}>{lang==="ka"?"პაკეტი ჯერ არ არის":"No packages yet"}</div>}
              {(tv.pkgs||[]).map((pkg,i)=>(<div key={i} style={{background:C.bg2,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"18px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:15,fontWeight:900,color:C.text,fontFamily:C.fb}}>{pkg.n} {t.pks}</div><div style={{fontSize:12,color:C.ok,fontFamily:C.fb,fontWeight:800,marginTop:3}}>{t.pksa} ₾{pkg.s} 🎉</div></div><div style={{textAlign:"right"}}><div style={{fontSize:24,fontWeight:900,color:catColor,fontFamily:C.fb}}>₾{pkg.p}</div><button onClick={()=>{if(!user){setAuthMode("login");}else{setPayment({item:{...tv,pkgPrice:pkg.p},slot:`${pkg.n} sessions`});}}} style={{marginTop:6,background:C.accent,color:"#fff",border:"none",borderRadius:C.radiusSm,padding:"7px 16px",fontSize:12,fontWeight:900,fontFamily:C.fb,cursor:"pointer",boxShadow:`0 3px 0 ${C.accentHover}`}}>{lang==="ka"?"ყიდვა":"Buy"}</button></div></div>))}
            </div>}
          </div>
          <div style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:22,position:"sticky",top:80,boxShadow:C.shadowMd}}>
            <div style={{fontSize:28,fontWeight:900,color:C.text,fontFamily:C.fb}}>₾{tv.price}</div>
            <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,fontWeight:600,marginBottom:16}}>{t.cl}</div>
            <div style={{background:C.accentLight,border:`2px solid ${C.accent}44`,borderRadius:C.radius,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:13,color:C.mid,fontFamily:C.fb,fontWeight:800}}>{t.bt} 🎯</span>
              <span style={{fontSize:20,fontWeight:900,color:C.accent,fontFamily:C.fb}}>₾{tv.trial||tv.trial_price||15}</span>
            </div>
            {tv.offline&&<div style={{background:C.primaryLight,border:`2px solid ${C.primary}33`,borderRadius:C.radius,padding:"9px 13px",marginBottom:14,fontSize:12,color:C.primary,fontFamily:C.fb,fontWeight:700}}>{t.bof}</div>}
            <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:10}}>{t.bs}</div>
            <div style={{marginBottom:16}}>
              {profileSlots.length===0
                ?<div style={{textAlign:"center",fontSize:12,color:C.muted,fontFamily:C.fb,padding:"8px 0"}}>{lang==="ka"?"ხელმისაწვდომი დრო არ არის":"No slots available yet"}</div>
                :<BookingCalendar
                  teacherId={tv.firebase_uid}
                  availableSlots={profileSlots}
                  lang={lang}
                  onSelect={setSlot}
                  selectedSlot={slot}
                  selectedDate={calendarDate}
                  onDateSelect={setCalendarDate}
                />
              }
            </div>
            <PBtn onClick={()=>{if(!slot)return;if(!user){setAuthMode("login");}else{setPayment({item:tv,slot});}}} full disabled={!slot} size="lg">{t.bc}</PBtn>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}>
              <OBtn onClick={()=>{if(!user){setAuthMode("login");}else{setMsgT(tv);}}} full size="sm">{t.mb}</OBtn>
              <OBtn onClick={()=>{if(!user){setAuthMode("login");}else{setVideoT(tv);setVideoSlot(slot);}}} full size="sm">{t.bv}</OBtn>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

// ── Admin Page ────────────────────────────────────────────────
const ADMIN_EMAIL = "nino@pudogeorgia.com"; // change to your email

const AdminPage=({lang,user,onBack})=>{
  const t=T[lang];const isKa=lang==="ka";
  const [tab,setTab]=useState("applications");
  const [apps,setApps]=useState([]);
  const [bookings,setBookings]=useState([]);
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState("");

  // Check if user is admin
  const isAdmin=user?.email===ADMIN_EMAIL||user?.email==="hello@nateba.ge";

  useEffect(()=>{
    if(isAdmin) loadAll();
  },[]);

  const loadAll=async()=>{
    setLoading(true);
    try{
      const[{data:a},{data:b},{data:u}]=await Promise.all([
        supabase.from("teacher_applications").select("*").order("created_at",{ascending:false}),
        supabase.from("bookings").select("*").order("created_at",{ascending:false}),
        supabase.from("users").select("*").order("created_at",{ascending:false}),
      ]);
      if(a) setApps(a);
      if(b) setBookings(b);
      if(u) setUsers(u);
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const updateAppStatus=async(id,status,applicantUid)=>{
    try{
      await supabase.from("teacher_applications").update({status}).eq("id",id);
      if(status==="approved"&&applicantUid){
        await supabase.from("users").update({role:"tutor"}).eq("firebase_uid",applicantUid);
      }
      setApps(prev=>prev.map(a=>a.id===id?{...a,status}:a));
      setMsg(status==="approved"?(isKa?"დამტკიცებულია ✅":"Approved ✅"):(isKa?"უარყოფილია ❌":"Rejected ❌"));
      setTimeout(()=>setMsg(""),3000);
    }catch(e){console.error(e);}
  };

  if(!isAdmin) return(
    <div style={{minHeight:"60vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,textAlign:"center"}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>Access denied</div>
      <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:24}}>This page is only for Nateba admins.</div>
      <PBtn onClick={onBack}>Back</PBtn>
    </div>
  );

  const statusColor={pending:C.accent,approved:C.ok,rejected:C.red};
  const filteredApps=tab==="applications"?apps:apps.filter(a=>a.status===tab);

  return(
    <div style={{maxWidth:1000,margin:"0 auto",padding:"40px 24px"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:13,cursor:"pointer",marginBottom:24,padding:0,fontWeight:900}}>← {t.back}</button>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:32}}>
        <div style={{fontSize:32,fontWeight:900,color:C.text,fontFamily:C.fb}}>🛡️ Admin Panel</div>
        {msg&&<div style={{background:C.ok+"20",border:`2px solid ${C.ok}44`,borderRadius:C.radiusLg,padding:"8px 16px",fontSize:13,color:C.ok,fontFamily:C.fb,fontWeight:800}}>{msg}</div>}
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[
          ["📋",apps.length,"Applications","#1CB0F6"],
          ["⏳",apps.filter(a=>a.status==="pending").length,"Pending","#E9A520"],
          ["✅",apps.filter(a=>a.status==="approved").length,"Approved","#58CC02"],
          ["📅",bookings.length,"Bookings","#A259FF"],
        ].map(([icon,count,label,color])=>(
          <div key={label} style={{background:color+"12",border:`2px solid ${color}33`,borderRadius:C.radiusLg,padding:"16px 18px",textAlign:"center"}}>
            <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:28,fontWeight:900,color,fontFamily:C.fb}}>{count}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,fontWeight:700,textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,borderBottom:`2px solid ${C.border}`,marginBottom:24,overflowX:"auto"}}>
        {[["applications","📋 All Applications"],["pending","⏳ Pending"],["approved","✅ Approved"],["bookings","📅 Bookings"],["users","👥 Users"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"10px 18px",border:"none",background:"none",fontSize:13,fontWeight:900,fontFamily:C.fb,color:tab===k?C.accent:C.muted,borderBottom:`3px solid ${tab===k?C.accent:"transparent"}`,marginBottom:-2,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
        ))}
      </div>

      {loading&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb}}>Loading...</div>}

      {/* Applications */}
      {!loading&&(tab==="applications"||tab==="pending"||tab==="approved"||tab==="rejected")&&(
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {(tab==="applications"?apps:apps.filter(a=>a.status===tab)).length===0&&(
            <div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb,fontSize:14}}>{t.adm_empty}</div>
          )}
          {(tab==="applications"?apps:apps.filter(a=>a.status===tab)).map(app=>(
            <div key={app.id} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"20px 22px",boxShadow:C.shadow}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{fontSize:17,fontWeight:900,color:C.text,fontFamily:C.fb}}>{app.name}</div>
                    <span style={{background:statusColor[app.status]+"20",color:statusColor[app.status],borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:900,fontFamily:C.fb,border:`1.5px solid ${statusColor[app.status]}44`}}>{app.status}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6,marginBottom:10}}>
                    {[["📧",app.email],["🎓",app.skill],["📂",app.category],["💰","₾"+app.price+"/session"],["🌐",app.online?"Online":""],["📍",app.offline?"In-person":""]].filter(([,v])=>v).map(([icon,val])=>(
                      <div key={icon+val} style={{fontSize:12,color:C.mid,fontFamily:C.fb,fontWeight:600}}>{icon} {val}</div>
                    ))}
                  </div>
                  {app.bio&&<div style={{fontSize:13,color:C.muted,fontFamily:C.fb,lineHeight:1.6,marginBottom:8,fontWeight:600,background:C.bg2,borderRadius:C.radiusSm,padding:"10px 12px"}}>{app.bio}</div>}
                  {app.video_url&&<a href={app.video_url} target="_blank" rel="noreferrer" style={{fontSize:12,color:C.primary,fontFamily:C.fb,fontWeight:700}}>🎥 Watch intro video</a>}
                  <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:8}}>Applied: {new Date(app.created_at).toLocaleDateString()}</div>
                </div>
                {app.status==="pending"&&(
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <button onClick={()=>updateAppStatus(app.id,"rejected",app.firebase_uid)}
                      style={{background:C.redLight,color:C.red,border:`2px solid ${C.red}33`,borderRadius:C.radiusLg,padding:"10px 18px",fontSize:13,fontWeight:900,fontFamily:C.fb,cursor:"pointer"}}>
                      ❌ {t.adm_reject}
                    </button>
                    <PBtn onClick={()=>updateAppStatus(app.id,"approved",app.firebase_uid)} variant="primary">
                      ✅ {t.adm_approve}
                    </PBtn>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bookings */}
      {!loading&&tab==="bookings"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {bookings.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb,fontSize:14}}>No bookings yet</div>}
          {bookings.map(b=>(
            <div key={b.id} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:900,color:C.text,fontFamily:C.fb}}>{b.student_name} → {b.teacher_name}</div>
                <div style={{fontSize:12,color:C.muted,fontFamily:C.fb,marginTop:2}}>{b.skill} · {b.slot} · ₾{b.price}</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,marginTop:2}}>{b.student_email}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:C.ok,fontFamily:C.fb,fontWeight:800}}>{b.status}</div>
                <div style={{fontSize:11,color:C.muted,fontFamily:C.fb}}>{new Date(b.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {!loading&&tab==="users"&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {users.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted,fontFamily:C.fb,fontSize:14}}>No users yet</div>}
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
  const acceptCookies=()=>{setCookieAccepted("accepted");try{localStorage.setItem("nateba_cookie","accepted");}catch{}};
  const declineCookies=()=>{setCookieAccepted("declined");try{localStorage.setItem("nateba_cookie","declined");}catch{}};
  const [selT,setSelT]=useState(null);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [catF,setCatF]=useState("all");
  const [pTab,setPTab]=useState("about");
  const [slot,setSlot]=useState(null);
  const [calendarDate,setCalendarDate]=useState(null);
  const [user,setUser]=useState(()=>{try{const s=localStorage.getItem("nateba_user");return s?JSON.parse(s):null;}catch{return null;}});
  const [authMode,setAuthMode]=useState(null);
  const [videoT,setVideoT]=useState(null);
  const [videoSlot,setVideoSlot]=useState(null);
  const [payment,setPayment]=useState(null);
  const [msgT,setMsgT]=useState(null);
  const [toast,setToast]=useState(null);
  const [saved,setSaved]=useState(()=>{try{return JSON.parse(localStorage.getItem("nateba_saved")||"[]");}catch{return [];}});

  const t=T[lang];
  const go=p=>{setPage(p);window.scrollTo(0,0);};
  const openT=tv=>{setSelT(tv);setPTab("about");setSlot(null);setCalendarDate(null);go("teacher");};
  const toggleSave=id=>{
    if(!user){setAuthMode("login");return;}
    setSaved(s=>{const n=s.includes(id)?s.filter(x=>x!==id):[...s,id];try{localStorage.setItem("nateba_saved",JSON.stringify(n));}catch{}return n;});
  };

  const [dbTeachers,setDbTeachers]=useState([]);
  const [teachersLoaded,setTeachersLoaded]=useState(false);
  useEffect(()=>{loadTeachers();},[]);
  const loadTeachers=async()=>{try{const{data,error}=await supabase.from("teacher_profiles").select("*").eq("active",true).order("created_at",{ascending:false});if(!error&&data&&data.length>0){const mapped=data.map(tp=>({id:tp.id,firebase_uid:tp.firebase_uid,name:tp.name,nka:tp.name,cat:tp.category||"school",skill:tp.skill||tp.skill_ka||"",ska:tp.skill_ka||tp.skill||"",price:tp.price||40,trial:tp.trial_price||15,rating:tp.rating||5.0,reviews:tp.review_count||0,online:tp.online!==false,offline:tp.offline||false,av:(tp.name||"T").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(),bio:tp.bio||tp.bio_ka||"",bka:tp.bio_ka||tp.bio||"",speaks:tp.speaks||["Georgian"],resp:tp.response_time||"2 hrs",slots:[],rl:[],pkgs:[],video_url:tp.video_url||null,promoted:tp.promoted||false,email:tp.email}));setDbTeachers(mapped);}}catch(e){console.error(e);}setTeachersLoaded(true);};
  const allTeachers=teachersLoaded?[...dbTeachers,...TEACHERS.filter(t=>!dbTeachers.find(d=>d.name===t.name))]:TEACHERS;

  const filtered=allTeachers.filter(tv=>{
    const ms=(tv.name+(tv.skill||"")).toLowerCase().includes(search.toLowerCase());
    const mf=filter==="all"||(filter==="online"&&tv.online)||(filter==="offline"&&tv.offline);
    const mc=catF==="all"||tv.cat===catF;
    return ms&&mf&&mc;
  });

  const Nav=()=>(
    <>
      <nav style={{background:"#FFFFFF",borderBottom:"2px solid #E0EEF7",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64,position:"sticky",top:0,zIndex:200,boxShadow:"0 2px 8px rgba(28,176,246,0.12)"}}>
        <Logo onClick={()=>{go("home");setMobileMenu(false);}}/>
        {/* Desktop */}
        <div style={{display:"flex",gap:4,alignItems:"center"}} id="desktop-nav">
          {[["browse",t.nav_browse],["groups",t.nav_groups]].map(([p,l])=>(
            <button key={p} onClick={()=>go(p)} style={{border:"none",background:page===p?C.primaryLight:"transparent",color:page===p?C.primary:C.muted,borderRadius:C.radiusSm,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:C.fb,fontWeight:800,transition:"all 0.15s"}}>{l}</button>
          ))}
          <button onClick={()=>go("teach")} style={{border:"none",background:"transparent",color:C.muted,borderRadius:C.radiusSm,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:C.fb,fontWeight:700}}>{t.nav_teach}</button>
          <div style={{width:1,height:22,background:C.border,margin:"0 6px"}}/>
          {user?<>
            <button onClick={()=>go("dashboard")} style={{border:"none",background:"transparent",color:C.muted,borderRadius:C.radiusSm,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:C.fb,fontWeight:700}}>{t.nav_dash}</button>
            <Av initials={user.name.slice(0,2).toUpperCase()} bg={C.primary} size={30}/>
            {user?.email==="nino@pudogeorgia.com"&&<button onClick={()=>go("admin")} style={{border:"none",background:"#FF4B4B15",color:"#FF4B4B",borderRadius:C.radiusSm,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:C.fb,fontWeight:900}}>🛡️ Admin</button>}
            <button onClick={()=>{setUser(null);try{localStorage.removeItem("nateba_user");}catch{}go("home");}} style={{border:"none",background:"transparent",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:C.fb,fontWeight:700,marginLeft:4}}>{t.nav_out}</button>
          </>:<>
            <button onClick={()=>setAuthMode("login")} style={{border:"none",background:"transparent",color:C.mid,borderRadius:C.radiusSm,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:C.fb,fontWeight:900}}>{t.nav_login}</button>
            <PBtn onClick={()=>setAuthMode("signup")} size="sm">{t.nav_signup}</PBtn>
          </>}
          <div style={{display:"flex",background:C.bg2,borderRadius:C.radiusSm,border:`2px solid ${C.border}`,padding:2,marginLeft:6}}>
            {["en","ka"].map(l=>(
              <button key={l} onClick={()=>{setLang(l);try{localStorage.setItem("nateba_lang",l);}catch{}}} style={{border:"none",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",background:lang===l?C.primary:"transparent",color:lang===l?"#fff":C.muted,fontFamily:C.fb,fontWeight:900,transition:"all 0.2s"}}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
        {/* Mobile */}
        <div style={{display:"flex",alignItems:"center",gap:8,position:"relative"}} id="mobile-nav">
          <div style={{display:"flex",background:C.bg2,borderRadius:C.radiusSm,border:`2px solid ${C.border}`,padding:2}}>
            {["en","ka"].map(l=>(
              <button key={l} onClick={()=>{setLang(l);try{localStorage.setItem("nateba_lang",l);}catch{}}} style={{border:"none",borderRadius:6,padding:"4px 9px",fontSize:11,cursor:"pointer",background:lang===l?C.primary:"transparent",color:lang===l?"#fff":C.muted,fontFamily:C.fb,fontWeight:900}}>{l.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={()=>setMobileMenu(m=>!m)} style={{background:mobileMenu?C.primaryLight:"none",border:`2px solid ${mobileMenu?C.primary:C.border}`,borderRadius:C.radiusSm,width:40,height:40,cursor:"pointer",fontSize:20,color:C.primary,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>
            {mobileMenu?"✕":"☰"}
          </button>
        </div>
      </nav>
    </>
  );

  const TCard=({tv})=>{
    const isSaved=saved.includes(tv.id);
    const catColor=CAT_COLORS[tv.cat]||C.primary;
    return(
      <div style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,padding:20,cursor:"pointer",transition:"all 0.2s",boxShadow:C.shadow,position:"relative",overflow:"hidden"}}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=catColor;e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 8px 24px ${catColor}33`;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=C.shadow;}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:5,background:catColor,borderRadius:"18px 18px 0 0"}}/>
        {tv.promoted&&<div style={{position:"absolute",top:12,left:12,background:"linear-gradient(135deg,#E9A520,#FF7A00)",color:"#fff",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:900,fontFamily:C.fb,zIndex:1}}>✦ Featured</div>}
        <button onClick={e=>{e.stopPropagation();toggleSave(tv.id);}}
          style={{position:"absolute",top:14,right:14,background:isSaved?catColor+"20":C.bg2,border:`2px solid ${isSaved?catColor:C.border}`,borderRadius:C.radiusSm,padding:"3px 10px",fontSize:11,cursor:"pointer",fontFamily:C.fb,fontWeight:900,color:isSaved?catColor:C.muted,transition:"all 0.15s"}}>
          {isSaved?"♥ "+t.csd:"♡ "+t.csv}
        </button>
        <div onClick={()=>openT(tv)}>
          <div style={{display:"flex",gap:12,marginBottom:12,alignItems:"flex-start",paddingRight:72,paddingTop:6}}>
            <Av initials={tv.av} bg={catColor} size={50}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:1}}>{tv.name}</div>
              <div style={{fontSize:12,color:catColor,fontFamily:C.fb,fontWeight:800,marginBottom:5}}>{lang==="ka"?tv.ska:tv.skill}</div>
              <div style={{display:"flex",alignItems:"center",gap:5}}><Stars r={tv.rating} s={12}/><span style={{fontSize:11,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{tv.rating} ({tv.reviews} {t.cr})</span></div>
            </div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
            {tv.online&&<Badge color="#58CC02">{t.con}</Badge>}
            {tv.offline&&<Badge color="#4A90D9">{t.cof}</Badge>}
            <Badge color={C.muted}>{t.cre} {tv.resp}</Badge>
          </div>
          <div style={{fontSize:13,color:C.mid,fontFamily:C.fb,lineHeight:1.6,marginBottom:14,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{lang==="ka"?tv.bka:tv.bio}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:`2px solid ${C.border}`,paddingTop:12}}>
            <div><span style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb}}>₾{tv.price}</span><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:600}}> {t.cl}</span></div>
            <PBtn size="sm">{t.cb}</PBtn>
          </div>
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
        {CATEGORIES.map(c=><option key={c.id} value={c.id}>{lang==="ka"?c.lka:c.label}</option>)}
      </select>
    </div>
  );

  const Footer=()=>(
    <footer style={{background:"#1A1A2E",padding:"40px 24px",marginTop:60}}>
      <div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill={C.primary}/><path d="M24 10 L27 22 L38 24 L27 26 L24 38 L21 26 L10 24 L21 22 Z" fill={C.accent}/></svg>
            <span style={{fontFamily:C.fb,fontWeight:900,fontSize:18,color:"#fff"}}>nateba</span>
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",fontFamily:C.fb}}>ისწავლე ის, რაც გიყვარს.</div>
        </div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[["tos",t.tost],["pp",t.topp],["faq",lang==="ka"?"ხშირად დასმული კითხვები":"FAQ"],["about","About"],["admin","🛡️"]].map(([p,l])=>(
            <button key={p} onClick={()=>go(p)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontFamily:C.fb,fontSize:13,cursor:"pointer",padding:0,fontWeight:700,transition:"color 0.15s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.4)"}>{l}</button>
          ))}
        </div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontFamily:C.fb}}>2025 Nateba.com</div>
      </div>
    </footer>
  );

  const Home=()=>(
    <div>
      <div style={{background:"linear-gradient(160deg,#E0F4FF 0%,#FFFFFF 55%,#FFF3E0 100%)",padding:"80px 24px 72px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:C.white,border:`2px solid ${C.border}`,borderRadius:20,padding:"7px 16px",marginBottom:24,boxShadow:C.shadow}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.ok}}/>
          <span style={{fontSize:13,fontFamily:C.fb,fontWeight:700,color:C.muted}}>120+ {t.hero_proof}</span>
        </div>
        <h1 style={{fontSize:"clamp(30px,5vw,52px)",fontWeight:900,color:C.text,fontFamily:C.fb,lineHeight:1.15,marginBottom:18,letterSpacing:"-1px",maxWidth:600,margin:"0 auto 18px"}}>{t.hero_title}</h1>
        <p style={{fontSize:17,color:C.muted,maxWidth:480,margin:"0 auto 36px",lineHeight:1.7,fontFamily:C.fb,fontWeight:600}}>{t.hero_sub}</p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <PBtn onClick={()=>go("browse")} size="lg">{t.hero_cta}</PBtn>
          <OBtn onClick={()=>go("teach")} size="lg">{t.hero_cta2}</OBtn>
        </div>
        <div style={{marginTop:20,display:"flex",justifyContent:"center"}}>
          <AIMatch lang={lang} teachers={allTeachers} onSelect={openT}/>
        </div>
      </div>

      <div style={{background:C.white,borderTop:`2px solid ${C.border}`,borderBottom:`2px solid ${C.border}`,display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
        {[["120+",t.st,"#1CB0F6"],["2,400+",t.ss,"#58CC02"],["200+",t.sk,"#A259FF"],["4.9 ★",t.sr,"#E9A520"]].map(([n,l,clr],i)=>(
          <div key={i} style={{padding:"22px 16px",textAlign:"center",borderRight:i<3?`2px solid ${C.border}`:"none"}}>
            <div style={{fontSize:24,fontWeight:900,color:clr,fontFamily:C.fb}}>{n}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,fontWeight:700,marginTop:3,textTransform:"uppercase",letterSpacing:"0.6px"}}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{padding:"56px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{fontSize:26,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:8}}>{t.sc}</div>
        <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginBottom:24,fontWeight:600}}>{lang==="ka"?"ყველა კატეგორია":"Browse all categories"}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
          {CATEGORIES.map(c=>{const clr=CAT_COLORS[c.id]||C.primary;return(
            <button key={c.id} onClick={()=>{setCatF(c.id);go("browse");}}
              style={{background:clr+"12",border:`2px solid ${clr}33`,borderRadius:C.radiusLg,padding:"16px 14px",textAlign:"left",cursor:"pointer",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=clr+"22";e.currentTarget.style.borderColor=clr+"77";e.currentTarget.style.transform="translateY(-2px)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=clr+"12";e.currentTarget.style.borderColor=clr+"33";e.currentTarget.style.transform="none";}}>
              <div style={{fontSize:13,fontWeight:900,color:clr,fontFamily:C.fb,marginBottom:3}}>{lang==="ka"?c.lka:c.label}</div>
              <div style={{fontSize:11,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{c.skills.length} skills</div>
            </button>
          );})}
        </div>
      </div>

      <div style={{background:C.bg2,padding:"56px 24px",borderTop:`2px solid ${C.border}`}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}>
          {/* Promoted / Featured teachers */}
          {allTeachers.filter(tv=>tv.promoted).length>0&&<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                  <div style={{background:"linear-gradient(135deg,#E9A520,#FF7A00)",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:900,color:"#fff",fontFamily:C.fb}}>✦ Featured</div>
                </div>
                <div style={{fontSize:26,fontWeight:900,color:C.text,fontFamily:C.fb}}>{t.sf}</div>
                <div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginTop:3,fontWeight:600}}>{t.sf2}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16,marginBottom:40}}>
              {allTeachers.filter(tv=>tv.promoted).map(tv=><TCard key={tv.id} tv={tv}/>)}
            </div>
            <div style={{height:2,background:C.border,marginBottom:36}}/>
          </>}
          {/* All other teachers */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:18}}>
            <div style={{fontSize:22,fontWeight:900,color:C.text,fontFamily:C.fb}}>{lang==="ka"?"ყველა მასწავლებელი":"All teachers"}</div>
            <button onClick={()=>go("browse")} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:14,cursor:"pointer",fontWeight:900}}>{lang==="ka"?"მეტის ნახვა →":"See more →"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16}}>
            {allTeachers.filter(tv=>!tv.promoted).slice(0,4).map(tv=><TCard key={tv.id} tv={tv}/>)}
          </div>
        </div>
      </div>

      <div style={{padding:"56px 24px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
          <div><div style={{fontSize:26,fontWeight:900,color:C.text,fontFamily:C.fb}}>{t.sg}</div><div style={{fontSize:14,color:C.muted,fontFamily:C.fb,marginTop:3,fontWeight:600}}>{t.sg2}</div></div>
          <button onClick={()=>go("groups")} style={{background:"none",border:"none",color:C.primary,fontFamily:C.fb,fontSize:14,cursor:"pointer",fontWeight:900}}>{lang==="ka"?"მეტის ნახვა →":"See more →"}</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
          {GROUPS.map(g=>{const clr=CAT_COLORS[g.cat]||C.primary;return(
            <div key={g.id} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,overflow:"hidden",boxShadow:C.shadow,transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=clr;e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 8px 24px ${clr}33`;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=C.shadow;}}>
              <div style={{background:clr,padding:"20px 20px 16px"}}><div style={{fontSize:15,fontWeight:900,color:"#fff",fontFamily:C.fb,marginBottom:3}}>{lang==="ka"?g.tka:g.title}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.75)",fontFamily:C.fb,fontWeight:600}}>{lang==="ka"?g.ska:g.sch} · {g.dur} {lang==="ka"?"წთ":"min"}</div></div>
              <div style={{padding:"16px 20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><Av initials={g.av} bg={clr} size={28}/><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700}}>{lang==="ka"?g.teka:g.teacher}</span></div>
                <div style={{fontSize:13,color:C.mid,fontFamily:C.fb,lineHeight:1.6,marginBottom:12}}>{lang==="ka"?g.dka:g.desc}</div>
                <div style={{background:C.bg2,borderRadius:6,height:6,marginBottom:12,overflow:"hidden"}}><div style={{background:clr,height:"100%",width:`${((g.total-g.spots)/g.total)*100}%`,borderRadius:6}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div><span style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb}}>₾{g.price}</span><span style={{fontSize:12,color:C.muted,fontFamily:C.fb}}>{lang==="ka"?" / სესია":" / session"}</span></div>
                  <Badge color={g.spots<=2?C.red:C.ok}>{g.spots} {t.cs}</Badge>
                </div>
                <PBtn onClick={()=>{if(!user){setAuthMode("login");}else{setPayment({item:{...g,name:g.teacher,av:g.av,cat:g.cat,price:g.price},slot:lang==="ka"?g.ska:g.sch});}}} full>{t.cj}</PBtn>
              </div>
            </div>
          );})}
        </div>
      </div>

      {/* Newsletter */}
      <div style={{background:"#1A1A2E",padding:"52px 24px"}}>
        <div style={{maxWidth:560,margin:"0 auto",textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:"#fff",fontFamily:C.fb,marginBottom:8}}>
            {lang==="ka"?"სიახლეები პირდაპირ შენთან":"Stay in the loop"}
          </div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.55)",fontFamily:C.fb,marginBottom:24,fontWeight:600}}>
            {lang==="ka"?"მიიღე ინფორმაცია ახალი მასწავლებლების, კურსებისა და სიახლეების შესახებ.":"New teachers, courses and platform updates — straight to your inbox."}
          </div>
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
      <Footer/>
    </div>
  );

  const BrowsePage=()=>(
    <div><SearchBar/>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px"}}>
        <div style={{fontSize:13,color:C.muted,fontFamily:C.fb,fontWeight:700,marginBottom:18}}>{filtered.length} teachers found</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:16}}>{filtered.map(tv=><TCard key={tv.id} tv={tv}/>)}</div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:56,color:C.muted,fontFamily:C.fb,fontSize:16}}>No teachers found 😔</div>}
      </div><Footer/>
    </div>
  );

  const TeacherProfile=()=>{
    if(!selT)return null;
    // Ensure all required fields have safe defaults
    const safeTv={
      ...selT,
      av:selT.av||(selT.name||"T").slice(0,2).toUpperCase(),
      rating:selT.rating||5.0,
      reviews:selT.reviews||0,
      slots:selT.slots||[],
      rl:selT.rl||[],
      pkgs:selT.pkgs||[],
      speaks:selT.speaks||["Georgian"],
      resp:selT.resp||selT.response_time||"2 hrs",
      ska:selT.ska||selT.skill_ka||selT.skill||"",
      bka:selT.bka||selT.bio_ka||selT.bio||"",
      bio:selT.bio||selT.bka||"",
      online:selT.online!==false,
      offline:selT.offline||false,
    };
    return <><TeacherProfileView tv={safeTv} lang={lang} t={t} slot={slot} setSlot={setSlot} calendarDate={calendarDate} setCalendarDate={setCalendarDate} user={user} setAuthMode={setAuthMode} setPayment={setPayment} setMsgT={setMsgT} setVideoT={setVideoT} setVideoSlot={setVideoSlot} pTab={pTab} setPTab={setPTab} go={go}/><Footer/></>;
  };

  const GroupsPage=()=>(
    <div>
      <div style={{background:"linear-gradient(135deg,#E0F4FF,#FFFFFF)",padding:"36px 24px 28px",borderBottom:`2px solid ${C.border}`}}>
        <div style={{maxWidth:1100,margin:"0 auto"}}><div style={{fontSize:28,fontWeight:900,color:C.text,fontFamily:C.fb,marginBottom:5}}>{t.grp}</div><div style={{fontSize:14,color:C.muted,fontFamily:C.fb,fontWeight:600}}>{t.sg2}</div></div>
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
          {GROUPS.map(g=>{const clr=CAT_COLORS[g.cat]||C.primary;return(
            <div key={g.id} style={{background:C.card,border:`2px solid ${C.border}`,borderRadius:C.radiusLg,overflow:"hidden",boxShadow:C.shadow,transition:"all 0.2s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=clr;e.currentTarget.style.transform="translateY(-4px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
              <div style={{background:clr,padding:"20px 20px 16px"}}><div style={{fontSize:15,fontWeight:900,color:"#fff",fontFamily:C.fb,marginBottom:3}}>{lang==="ka"?g.tka:g.title}</div><div style={{fontSize:12,color:"rgba(255,255,255,0.75)",fontFamily:C.fb,fontWeight:600}}>{lang==="ka"?g.ska:g.sch} · {g.dur} {lang==="ka"?"წთ":"min"}</div></div>
              <div style={{padding:"16px 20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><Av initials={g.av} bg={clr} size={28}/><span style={{fontSize:12,color:C.muted,fontFamily:C.fb,fontWeight:700}}>{lang==="ka"?g.teka:g.teacher}</span></div>
                <div style={{fontSize:13,color:C.mid,fontFamily:C.fb,lineHeight:1.6,marginBottom:12,fontWeight:600}}>{lang==="ka"?g.dka:g.desc}</div>
                <div style={{background:C.bg2,borderRadius:6,height:6,marginBottom:12,overflow:"hidden"}}><div style={{background:clr,height:"100%",width:`${((g.total-g.spots)/g.total)*100}%`,borderRadius:6}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                  <div><span style={{fontSize:20,fontWeight:900,color:C.text,fontFamily:C.fb}}>₾{g.price}</span><span style={{fontSize:12,color:C.muted,fontFamily:C.fb}}>{lang==="ka"?" / სესია":" / session"}</span></div>
                  <Badge color={g.spots<=2?C.red:C.ok}>{g.spots} {t.cs}</Badge>
                </div>
                <PBtn onClick={()=>{if(!user){setAuthMode("login");}else{setPayment({item:{...g,name:g.teacher,av:g.av,cat:g.cat,price:g.price},slot:lang==="ka"?g.ska:g.sch});}}} full>{t.cj}</PBtn>
              </div>
            </div>
          );})}
        </div>
      </div><Footer/>
    </div>
  );

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
        @media(max-width:768px){
          #desktop-nav{display:none!important;}
          #mobile-nav{display:flex!important;}
        }
        @media(min-width:769px){
          #mobile-nav{display:none!important;}
          #desktop-nav{display:flex!important;}
        }
        @media(max-width:640px){
          #desktop-nav{display:none!important;}
        }
      `}</style>
      <Nav/>
      {page==="home"&&<Home/>}
      {page==="browse"&&<BrowsePage/>}
      {page==="teacher"&&<TeacherProfile/>}
      {page==="groups"&&<GroupsPage/>}
      {page==="teach"&&<TeachPage lang={lang} onBack={()=>go("home")} user={user} onLogin={(mode)=>setAuthMode(mode)}/>}
      {page==="dashboard"&&user&&<Dashboard user={user} lang={lang} onJoinVideo={(tv,sl)=>{setVideoT(tv);setVideoSlot(sl);}} onMsg={setMsgT}/>}
      {page==="tos"&&<LegalPage type="tos" lang={lang} onBack={()=>go("home")}/>}
      {page==="pp"&&<LegalPage type="pp" lang={lang} onBack={()=>go("home")}/>}
      {page==="faq"&&<FAQPage lang={lang} onBack={()=>go("home")}/>}
      {page==="about"&&<AboutPage lang={lang} onBack={()=>go("home")} onSignup={()=>setAuthMode("signup")}/>}
      {page==="admin"&&<AdminPage lang={lang} user={user} onBack={()=>go("home")}/>}
      {!["home","browse","teacher","groups","teach","dashboard","tos","pp","faq","about","admin"].includes(page)&&<NotFoundPage onBack={()=>go("home")}/>}
      {!cookieAccepted&&<CookieBanner onAccept={acceptCookies} onDecline={declineCookies} onLearnMore={()=>go('pp')}/>}
      {showPromote&&<PromoteModal lang={lang} onClose={()=>setShowPromote(false)}/>}
      {authMode&&<AuthModal mode={authMode} lang={lang} onAuth={u=>{setUser(u);try{localStorage.setItem("nateba_user",JSON.stringify(u));}catch{}setAuthMode(null);setToast({msg:lang==="ka"?`კეთილი იყოს, ${u.name}! 🎉`:`Welcome, ${u.name}! 🎉`});}} onClose={()=>setAuthMode(null)}/>}
      {payment&&<PayModal item={payment.item} slot={payment.slot} lang={lang} user={user} onSuccess={()=>{setToast({msg:"Session booked! 🎉"});setPayment(null);go("dashboard");}} onClose={()=>setPayment(null)}/>}
      {videoT&&<VideoRoom teacher={videoT} slot={videoSlot} lang={lang} onClose={()=>{setVideoT(null);setVideoSlot(null);}}/>}
      {msgT&&<MsgModal teacher={msgT} lang={lang} onClose={()=>setMsgT(null)}/>}
      {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
      {mobileMenu&&<div onClick={()=>setMobileMenu(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:8000}}/>}
      {mobileMenu&&<div style={{position:"fixed",top:64,left:0,right:0,bottom:0,zIndex:8001,overflowY:"auto",background:"#FFFFFF"}}>
        {/* Account section - TOP */}
        <div style={{padding:"16px 20px",borderBottom:`2px solid ${C.border}`,background:C.primaryLight}}>
          {user?<div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{fontSize:14,color:C.primary,fontFamily:C.fb,fontWeight:700}}>{lang==="ka"?"შესულია:":"Logged in as"} <strong>{user.name}</strong></div>
            <div style={{display:"flex",gap:8}}>
              <PBtn onClick={()=>{go("dashboard");setMobileMenu(false);}} full size="sm">{t.nav_dash}</PBtn>
              <OBtn onClick={()=>{setUser(null);go("home");setMobileMenu(false);}} full size="sm">{t.nav_out}</OBtn>
            </div>
          </div>:<div style={{display:"flex",gap:8}}>
            <PBtn onClick={()=>{setAuthMode("signup");setMobileMenu(false);}} full>{t.nav_signup}</PBtn>
            <OBtn onClick={()=>{setAuthMode("login");setMobileMenu(false);}} full>{t.nav_login}</OBtn>
          </div>}
        </div>
        {/* Main nav links */}
        {[
          {l:lang==="ka"?"მთავარი":"Home",p:"home"},
          {l:t.nav_browse,p:"browse"},
          {l:t.nav_groups,p:"groups"},
          {l:t.nav_teach,p:"teach"},
          {l:lang==="ka"?"ჩვენს შესახებ":"About us",p:"about"},
          {l:lang==="ka"?"ხშირად დასმული კითხვები":"FAQ",p:"faq"},
        ].map(item=>(
          <button key={item.p} onClick={()=>{go(item.p);setMobileMenu(false);}}
            style={{width:"100%",padding:"17px 24px",border:"none",borderBottom:`1px solid ${C.border}`,background:page===item.p?"#F0F8FF":"#FFFFFF",color:page===item.p?C.primary:"#1A1A1A",fontSize:17,fontWeight:700,fontFamily:C.fb,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            {item.l}<span style={{color:"#AAAAAA",fontSize:16}}>›</span>
          </button>
        ))}
        {/* Browse all courses - single button */}
        <button onClick={()=>{setCatF("all");go("browse");setMobileMenu(false);}}
          style={{width:"100%",padding:"17px 24px",border:"none",borderBottom:`1px solid ${C.border}`,background:"#FFFFFF",color:C.accent,fontSize:17,fontWeight:800,fontFamily:C.fb,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {lang==="ka"?"ყველა კურსი":"All courses"}<span style={{color:C.accent,fontSize:16}}>›</span>
        </button>
      </div>}
    </div>
  );
}
