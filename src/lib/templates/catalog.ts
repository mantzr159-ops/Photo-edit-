/**
 * Extended template catalogue: copy × layout × palette × fonts combinations.
 * Every entry is original content; nothing is copied from other products.
 */
import type { TemplateCategory, TemplateDef } from "@/lib/design/types";
import { buildPage, type Copy, type Fonts, type LayoutId, type Palette } from "./layouts";

const P: Record<string, Palette> = {
  midnight: { bg: "#0f0c29", surface: "#1d1846", primary: "#7f5af0", accent: "#2cb67d", text: "#fffffe", muted: "#a7b1c2", onPrimary: "#ffffff" },
  sunset: { bg: "#fff4e6", surface: "#ffffff", primary: "#ff6b35", accent: "#f7b267", text: "#2b2d42", muted: "#6c757d", onPrimary: "#ffffff" },
  mint: { bg: "#e8f8f5", surface: "#ffffff", primary: "#0b8a73", accent: "#ffb703", text: "#073b4c", muted: "#4f6d7a", onPrimary: "#ffffff" },
  blush: { bg: "#fdf0f3", surface: "#ffffff", primary: "#d6336c", accent: "#ff8fab", text: "#3d1f2b", muted: "#8a6070", onPrimary: "#ffffff" },
  ocean: { bg: "#03256c", surface: "#1768ac", primary: "#06bee1", accent: "#ffd23f", text: "#ffffff", muted: "#c9e4f5", onPrimary: "#03256c" },
  forest: { bg: "#1b4332", surface: "#2d6a4f", primary: "#95d5b2", accent: "#ffb703", text: "#f1faee", muted: "#b7e4c7", onPrimary: "#1b4332" },
  mono: { bg: "#f5f5f4", surface: "#ffffff", primary: "#111111", accent: "#e63946", text: "#111111", muted: "#6b6b6b", onPrimary: "#ffffff" },
  royal: { bg: "#240046", surface: "#3c096c", primary: "#ff9e00", accent: "#c77dff", text: "#ffffff", muted: "#e0aaff", onPrimary: "#240046" },
  lemon: { bg: "#fff9db", surface: "#ffffff", primary: "#1d3557", accent: "#ffbe0b", text: "#1d3557", muted: "#5c677d", onPrimary: "#ffffff" },
  coral: { bg: "#ff6f59", surface: "#fff1ec", primary: "#254441", accent: "#fff1d0", text: "#ffffff", muted: "#ffe3dc", onPrimary: "#ffffff" },
  sand: { bg: "#f4ede4", surface: "#ffffff", primary: "#8c5e3c", accent: "#c49a6c", text: "#3b2a1e", muted: "#7d6b5d", onPrimary: "#ffffff" },
  cyber: { bg: "#0d0d0d", surface: "#1a1a1a", primary: "#00f5d4", accent: "#f15bb5", text: "#ffffff", muted: "#a0a0a0", onPrimary: "#0d0d0d" },
  clinic: { bg: "#f3f9ff", surface: "#ffffff", primary: "#0f4c81", accent: "#00a6fb", text: "#102a43", muted: "#486581", onPrimary: "#ffffff" },
  ramadan: { bg: "#0b1d3a", surface: "#132c55", primary: "#d4a537", accent: "#f2d27a", text: "#fdf6e3", muted: "#c9b98f", onPrimary: "#0b1d3a" },
};

const F: Record<string, Fonts> = {
  jakarta: { heading: "Plus Jakarta Sans", body: "Inter" },
  playfair: { heading: "Playfair Display", body: "Lato", headingWeight: 700 },
  bebas: { heading: "Bebas Neue", body: "Montserrat", headingWeight: 400 },
  grotesk: { heading: "Space Grotesk", body: "Inter", headingWeight: 700 },
  fraunces: { heading: "Fraunces", body: "DM Sans", headingWeight: 700 },
  poppins: { heading: "Poppins", body: "Poppins", headingWeight: 800 },
  montserrat: { heading: "Montserrat", body: "Open Sans", headingWeight: 800 },
  cormorant: { heading: "Cormorant Garamond", body: "Lato", headingWeight: 600 },
  vibes: { heading: "Great Vibes", body: "Cormorant Garamond", headingWeight: 400 },
  anton: { heading: "Anton", body: "Roboto", headingWeight: 400 },
  outfit: { heading: "Outfit", body: "Outfit", headingWeight: 800 },
  nunito: { heading: "Nunito", body: "Nunito", headingWeight: 900 },
  // Arabic
  cairo: { heading: "Cairo", body: "Tajawal", headingWeight: 800 },
  tajawal: { heading: "Tajawal", body: "Almarai", headingWeight: 800 },
  kufi: { heading: "Reem Kufi", body: "Cairo", headingWeight: 700 },
  amiri: { heading: "Amiri", body: "Noto Naskh Arabic", headingWeight: 700 },
  lalezar: { heading: "Lalezar", body: "Cairo", headingWeight: 400 },
  messiri: { heading: "El Messiri", body: "Tajawal", headingWeight: 700 },
  ruqaa: { heading: "Aref Ruqaa", body: "Amiri", headingWeight: 700 },
};

const SIZE: Record<string, [number, number]> = {
  square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], fb: [1200, 630], yt: [1280, 720], slide: [1920, 1080],
  poster: [1728, 2304], flyer: [1240, 1754], card: [1050, 600], resume: [1275, 1650], info: [1080, 2160], invite: [1500, 2100],
  logo: [1000, 1000], desktop: [1920, 1080], phone: [1170, 2532],
};

type Entry = { cat: TemplateCategory; size: keyof typeof SIZE; layout: LayoutId; pal: keyof typeof P; font: keyof typeof F; copy: Copy; rtl?: boolean; extraPages?: { layout: LayoutId; copy: Copy }[] };

const it = (icon: string, label: string, desc?: string) => ({ icon, label, desc });

const ENTRIES: Entry[] = [
  /* ── Social Media ── */
  { cat: "Social Media", size: "fb", layout: "splitFrame", pal: "midnight", font: "jakarta", copy: { name: "Webinar Announcement", tags: ["webinar", "event", "online", "linkedin"], eyebrow: "Free webinar", title: "Grow Your Brand in 2026", subtitle: "Live this Thursday at 6 PM with three industry experts.", cta: "Register now" } },
  { cat: "Social Media", size: "square", layout: "centered", pal: "lemon", font: "grotesk", copy: { name: "Podcast New Episode", tags: ["podcast", "audio", "episode"], eyebrow: "New episode", title: "The Future of Remote Work", subtitle: "A candid conversation with founder Dana Lee", cta: "Listen now" } },
  { cat: "Social Media", size: "square", layout: "diagonal", pal: "mono", font: "bebas", copy: { name: "We're Hiring", tags: ["hiring", "job", "careers", "recruitment"], eyebrow: "Careers", title: "WE'RE HIRING", subtitle: "Product Designer · Remote-friendly · Full-time", cta: "Apply today" } },
  { cat: "Social Media", size: "fb", layout: "blobHero", pal: "blush", font: "poppins", copy: { name: "Thank You Post", tags: ["thank you", "milestone", "community"], eyebrow: "10K followers", title: "Thank You!", subtitle: "We couldn't have done it without this amazing community.", cta: "Celebrate with us" } },
  { cat: "Social Media", size: "square", layout: "cardGrid", pal: "sunset", font: "outfit", copy: { name: "Caption Tips Carousel", tags: ["tips", "carousel", "marketing", "education"], eyebrow: "Save this", title: "4 Tips for Better Captions", items: [it("MessageCircle", "Hook first", "Lead with the most interesting line."), it("Smile", "Be human", "Write like you talk."), it("Hash", "Fewer hashtags", "3–5 relevant tags win."), it("MousePointerClick", "Clear CTA", "Tell people what to do next.")] } },

  /* ── Instagram Posts ── */
  { cat: "Instagram Posts", size: "square", layout: "bigStat", pal: "sand", font: "anton", copy: { name: "Coffee BOGO Promo", tags: ["coffee", "cafe", "promo", "food"], eyebrow: "Today only", title: "1+1", subtitle: "Buy one latte, get one free", body: "At all our locations until 6 PM.", cta: "Order now" } },
  { cat: "Instagram Posts", size: "portrait", layout: "photoOverlay", pal: "cyber", font: "bebas", copy: { name: "Monday Motivation", tags: ["fitness", "gym", "motivation", "quote"], eyebrow: "Monday motivation", title: "STRONGER EVERY DAY", subtitle: "Your only limit is the one you set." } },
  { cat: "Instagram Posts", size: "square", layout: "splitFrame", pal: "clinic", font: "montserrat", copy: { name: "Just Listed Home", tags: ["real estate", "house", "listing", "property"], eyebrow: "Just listed", title: "Modern Family Home", subtitle: "3 bed · 2 bath · garden · $540,000", cta: "Book a tour" } },
  { cat: "Instagram Posts", size: "square", layout: "bordered", pal: "sand", font: "fraunces", copy: { name: "Autumn Bakery Menu", tags: ["bakery", "menu", "food", "autumn"], eyebrow: "Fresh from the oven", title: "Autumn Menu", subtitle: "Cinnamon · Pumpkin · Pecan", body: "Available every morning from 7 AM", items: [it("Croissant", "")] } },
  { cat: "Instagram Posts", size: "square", layout: "blobHero", pal: "royal", font: "poppins", copy: { name: "Giveaway Contest", tags: ["giveaway", "contest", "win", "beauty"], eyebrow: "Giveaway", title: "Win a Skincare Bundle", subtitle: "Like · Follow · Tag two friends to enter", cta: "Enter now" } },
  { cat: "Instagram Posts", size: "square", layout: "quote", pal: "mint", font: "playfair", copy: { name: "Wellness Quote", tags: ["quote", "wellness", "mindfulness"], title: "Rest is not a reward. It's part of the work.", author: "Daily reminder" } },

  /* ── Instagram Stories ── */
  { cat: "Instagram Stories", size: "story", layout: "photoOverlay", pal: "blush", font: "playfair", copy: { name: "New Collection Story", tags: ["fashion", "shop", "new arrival", "story"], eyebrow: "New in", title: "Summer Collection", subtitle: "Light fabrics, bold colours.", cta: "Shop now" } },
  { cat: "Instagram Stories", size: "story", layout: "minimal", pal: "sand", font: "cormorant", copy: { name: "Travel Diary Story", tags: ["travel", "diary", "story", "vacation"], eyebrow: "Day 3 of 5", title: "Santorini Diaries", subtitle: "Sunsets, white walls and the bluest sea.", footer: "@wanderwithme" } },
  { cat: "Instagram Stories", size: "story", layout: "centered", pal: "mint", font: "fraunces", copy: { name: "Workshop Story", tags: ["workshop", "class", "art", "event"], eyebrow: "Limited seats", title: "Watercolor Workshop", subtitle: "Saturday · 10 AM · Studio 4", cta: "Book your spot" } },
  { cat: "Instagram Stories", size: "story", layout: "bigStat", pal: "cyber", font: "anton", copy: { name: "Black Friday Countdown", tags: ["sale", "black friday", "countdown"], eyebrow: "3 days left", title: "70%", subtitle: "Black Friday Sale", body: "Sitewide. Online and in store.", cta: "Shop early" } },
  { cat: "Instagram Stories", size: "story", layout: "listIcons", pal: "lemon", font: "nunito", copy: { name: "Morning Routine Story", tags: ["routine", "lifestyle", "tips"], eyebrow: "My routine", title: "5 AM Club", subtitle: "How I start every day", items: [it("Sunrise", "Wake up early", "No snooze button."), it("GlassWater", "Hydrate", "A big glass of water first."), it("Dumbbell", "Move", "20 minutes of exercise."), it("BookOpen", "Read", "10 pages, no phone.")] } },

  /* ── TikTok ── */
  { cat: "TikTok", size: "story", layout: "diagonal", pal: "sunset", font: "anton", copy: { name: "15-Minute Recipe Cover", tags: ["recipe", "food", "cooking", "tiktok"], eyebrow: "15-min recipe", title: "CREAMY GARLIC PASTA", subtitle: "Easy · cheap · delicious", cta: "Watch till the end" } },
  { cat: "TikTok", size: "story", layout: "photoOverlay", pal: "midnight", font: "bebas", copy: { name: "Day in My Life Cover", tags: ["vlog", "student", "lifestyle", "tiktok"], eyebrow: "Vlog", title: "A DAY IN MY LIFE", subtitle: "as a medical student" } },
  { cat: "TikTok", size: "story", layout: "listIcons", pal: "ocean", font: "poppins", copy: { name: "Study Hacks Cover", tags: ["study", "school", "tips", "tiktok"], eyebrow: "Study hacks", title: "Ace Your Exams", subtitle: "Science-backed tricks", items: [it("Timer", "Pomodoro", "25 min focus, 5 min rest."), it("Repeat", "Spaced repetition", "Review right before you forget."), it("PenLine", "Active recall", "Test yourself, don't reread."), it("Moon", "Sleep", "Memory consolidates at night.")] } },
  { cat: "TikTok", size: "story", layout: "blobHero", pal: "blush", font: "outfit", copy: { name: "Outfit Ideas Cover", tags: ["fashion", "outfit", "style", "tiktok"], eyebrow: "OOTD", title: "3 Ways to Style Denim", subtitle: "Fall edition" } },
  { cat: "TikTok", size: "story", layout: "bigStat", pal: "cyber", font: "anton", copy: { name: "Part 2 Cover", tags: ["series", "story time", "tiktok"], eyebrow: "Story time", title: "PART 2", subtitle: "You won't believe what happened next" } },

  /* ── YouTube Thumbnails ── */
  { cat: "YouTube Thumbnails", size: "yt", layout: "splitFrame", pal: "cyber", font: "anton", copy: { name: "Honest Tech Review", tags: ["tech", "review", "youtube", "gadget"], eyebrow: "30-day test", title: "IS IT WORTH IT?", subtitle: "My honest review" } },
  { cat: "YouTube Thumbnails", size: "yt", layout: "diagonal", pal: "royal", font: "bebas", copy: { name: "Gaming Secrets", tags: ["gaming", "youtube", "top 10"], eyebrow: "New season", title: "TOP 10 HIDDEN SECRETS", subtitle: "You probably missed #3" } },
  { cat: "YouTube Thumbnails", size: "yt", layout: "bigStat", pal: "forest", font: "anton", copy: { name: "Money Saving Challenge", tags: ["finance", "money", "saving", "youtube"], eyebrow: "Money tips", title: "$10K", subtitle: "Saved in one year — here's how" } },
  { cat: "YouTube Thumbnails", size: "yt", layout: "photoOverlay", pal: "sunset", font: "bebas", copy: { name: "48 Hours Travel Vlog", tags: ["travel", "vlog", "youtube", "city"], eyebrow: "Travel vlog", title: "48 HOURS IN TOKYO", subtitle: "What I ate, saw and spent" } },
  { cat: "YouTube Thumbnails", size: "yt", layout: "blobHero", pal: "ocean", font: "poppins", copy: { name: "Beginner Tutorial", tags: ["tutorial", "how to", "youtube", "design"], eyebrow: "Beginner guide", title: "Learn Design in 20 Minutes", subtitle: "No experience needed" } },

  /* ── Presentations ── */
  {
    cat: "Presentations", size: "slide", layout: "blobHero", pal: "midnight", font: "jakarta",
    copy: { name: "Quarterly Business Review", tags: ["business", "report", "deck", "quarterly"], eyebrow: "Q3 2026", title: "Quarterly Business Review", subtitle: "Results, learnings and next steps" },
    extraPages: [
      { layout: "listIcons", copy: { name: "Agenda", tags: [], eyebrow: "Agenda", title: "What we'll cover", items: [it("ChartBar", "Results", "Revenue, growth and retention."), it("Lightbulb", "Learnings", "What worked and what didn't."), it("Target", "Priorities", "Our focus for next quarter.")] } },
      { layout: "cardGrid", copy: { name: "Highlights", tags: [], eyebrow: "Highlights", title: "Key numbers", items: [it("TrendingUp", "+24%", "Revenue growth"), it("Users", "18K", "Active customers"), it("Repeat", "92%", "Retention"), it("Star", "4.8", "Average rating")] } },
      { layout: "centered", copy: { name: "Thank you", tags: [], title: "Thank you", subtitle: "Questions & discussion" } },
    ],
  },
  {
    cat: "Presentations", size: "slide", layout: "minimal", pal: "mono", font: "grotesk",
    copy: { name: "Product Roadmap", tags: ["product", "roadmap", "deck", "startup"], eyebrow: "Product team", title: "2026 Roadmap", subtitle: "Where we're going and why", footer: "Confidential" },
    extraPages: [
      { layout: "cardGrid", copy: { name: "Quarters", tags: [], eyebrow: "Timeline", title: "Four quarters, four bets", items: [it("Rocket", "Q1 · Launch", "Public beta of the new editor."), it("Puzzle", "Q2 · Integrations", "Connect the tools teams use."), it("Globe", "Q3 · Expand", "Five new languages."), it("ShieldCheck", "Q4 · Enterprise", "SSO, audit logs, admin.")] } },
      { layout: "quote", copy: { name: "Vision", tags: [], title: "Make great design possible for everyone, in every language.", author: "Our north star" } },
    ],
  },
  {
    cat: "Presentations", size: "slide", layout: "splitFrame", pal: "mint", font: "fraunces",
    copy: { name: "Marketing Plan", tags: ["marketing", "plan", "deck", "strategy"], eyebrow: "Marketing", title: "Spring Campaign Plan", subtitle: "Audience, channels and budget for Q2.", cta: "Let's go" },
    extraPages: [
      { layout: "listIcons", copy: { name: "Channels", tags: [], eyebrow: "Channels", title: "Where we'll show up", items: [it("Camera", "Social", "Short video, 4× per week."), it("Mail", "Email", "Two newsletters per month."), it("Search", "Search", "Content around 20 keywords."), it("Handshake", "Partners", "Three co-marketing launches.")] } },
    ],
  },
  {
    cat: "Presentations", size: "slide", layout: "centered", pal: "clinic", font: "montserrat",
    copy: { name: "Research Findings", tags: ["research", "science", "deck", "academic"], eyebrow: "Research seminar", title: "Findings & Implications", subtitle: "Department of Public Health · 2026" },
    extraPages: [
      { layout: "cardGrid", copy: { name: "Results", tags: [], eyebrow: "Results", title: "Summary of results", items: [it("Users", "n = 1,240", "Participants enrolled"), it("Activity", "−18%", "Reduction in incidence"), it("Clock", "24 months", "Median follow-up")] } },
    ],
  },
  {
    cat: "Presentations", size: "slide", layout: "bordered", pal: "lemon", font: "nunito",
    copy: { name: "Class Lecture", tags: ["lecture", "class", "education", "deck"], eyebrow: "Lecture 4", title: "Introduction to Economics", subtitle: "Supply, demand and prices", items: [it("GraduationCap", "")] },
    extraPages: [
      { layout: "listIcons", copy: { name: "Objectives", tags: [], eyebrow: "Today", title: "Learning objectives", items: [it("Scale", "Define supply & demand"), it("TrendingUp", "Read a demand curve"), it("Calculator", "Find the equilibrium price")] } },
    ],
  },

  /* ── Posters ── */
  { cat: "Posters", size: "poster", layout: "photoOverlay", pal: "royal", font: "bebas", copy: { name: "Music Festival Poster", tags: ["music", "festival", "concert", "event"], eyebrow: "July 18–20 · Riverside Park", title: "SUMMER SOUND FESTIVAL", subtitle: "40 artists · 3 stages · 3 days", cta: "Tickets on sale" } },
  { cat: "Posters", size: "poster", layout: "minimal", pal: "mono", font: "playfair", copy: { name: "Film Night Poster", tags: ["film", "cinema", "movie night"], eyebrow: "Friday screening", title: "Classic Film Night", subtitle: "Free popcorn · Doors at 7 PM · Auditorium B", footer: "Students free with ID" } },
  { cat: "Posters", size: "poster", layout: "diagonal", pal: "sunset", font: "anton", copy: { name: "Charity 5K Run", tags: ["charity", "run", "sport", "fundraiser"], eyebrow: "Run for a cause", title: "CHARITY 5K", subtitle: "Sunday, May 10 · City Park · 8 AM", cta: "Register" } },
  { cat: "Posters", size: "poster", layout: "cardGrid", pal: "ocean", font: "grotesk", copy: { name: "Science Fair Poster", tags: ["science", "school", "fair", "education"], eyebrow: "Annual", title: "Science Fair 2026", subtitle: "Projects, demos and prizes", items: [it("FlaskConical", "Chemistry"), it("Atom", "Physics"), it("Dna", "Biology"), it("Cpu", "Robotics")] } },
  { cat: "Posters", size: "poster", layout: "centered", pal: "mint", font: "cormorant", copy: { name: "Yoga Retreat Poster", tags: ["yoga", "wellness", "retreat"], eyebrow: "Weekend retreat", title: "Breathe & Restore", subtitle: "Two days of yoga, meditation and nature.", cta: "Reserve a place" } },

  /* ── Flyers ── */
  { cat: "Flyers", size: "flyer", layout: "blobHero", pal: "coral", font: "poppins", copy: { name: "Grand Opening Store", tags: ["opening", "store", "retail", "business"], eyebrow: "Grand opening", title: "We're Open!", subtitle: "20% off everything this weekend.", cta: "Visit us" } },
  { cat: "Flyers", size: "flyer", layout: "listIcons", pal: "clinic", font: "nunito", copy: { name: "Tutoring Services", tags: ["tutoring", "education", "school", "service"], eyebrow: "Private tutoring", title: "Better Grades, Less Stress", subtitle: "Grades 6–12 · online or in person", items: [it("Calculator", "Math", "Algebra to calculus."), it("FlaskConical", "Science", "Chemistry, biology, physics."), it("PenLine", "Writing", "Essays and reports."), it("Phone", "Call (555) 014-2290", "First session free.")] } },
  { cat: "Flyers", size: "flyer", layout: "bigStat", pal: "lemon", font: "anton", copy: { name: "Yard Sale", tags: ["sale", "yard sale", "community"], eyebrow: "Saturday 8 AM – 2 PM", title: "YARD SALE", subtitle: "Furniture · books · toys · clothes", body: "14 Maple Street. Everything must go!" } },
  { cat: "Flyers", size: "flyer", layout: "splitFrame", pal: "mint", font: "montserrat", copy: { name: "Cleaning Service", tags: ["cleaning", "service", "home", "business"], eyebrow: "Home cleaning", title: "Sparkling Clean, Every Time", subtitle: "Eco-friendly products · insured staff · flexible hours", cta: "Book online" } },
  { cat: "Flyers", size: "flyer", layout: "cardGrid", pal: "sand", font: "fraunces", copy: { name: "Restaurant Menu Flyer", tags: ["menu", "restaurant", "food"], eyebrow: "Lunch menu", title: "The Olive Table", subtitle: "Mediterranean kitchen", items: [it("Salad", "Fattoush", "$9"), it("Soup", "Lentil soup", "$7"), it("Beef", "Grilled kofta", "$15"), it("CakeSlice", "Baklava", "$6")] } },

  /* ── Business Cards ── */
  { cat: "Business Cards", size: "card", layout: "card", pal: "mono", font: "grotesk", copy: { name: "Architect Business Card", tags: ["business card", "architect"], title: "Sam Carter", subtitle: "Architect", items: [it("Ruler", ""), it("Phone", "+1 (555) 010-2299"), it("Mail", "sam@studio.example"), it("Globe", "studio.example")] } },
  { cat: "Business Cards", size: "card", layout: "card", pal: "blush", font: "playfair", copy: { name: "Photographer Card", tags: ["business card", "photographer"], title: "Mia Torres", subtitle: "Photographer", items: [it("Camera", ""), it("Phone", "+1 (555) 018-3344"), it("Mail", "mia@photo.example"), it("AtSign", "@miatorres")] } },
  { cat: "Business Cards", size: "card", layout: "card", pal: "clinic", font: "montserrat", copy: { name: "Dentist Card", tags: ["business card", "dentist", "medical"], title: "Dr. Lena Park", subtitle: "Family Dentistry", items: [it("Smile", ""), it("Phone", "+1 (555) 017-8812"), it("MapPin", "22 Oak Avenue"), it("Clock", "Mon–Sat 9–6")] } },
  { cat: "Business Cards", size: "card", layout: "card", pal: "sand", font: "fraunces", copy: { name: "Barista Card", tags: ["business card", "coffee", "cafe"], title: "Bean & Brew", subtitle: "Specialty coffee", items: [it("Coffee", ""), it("MapPin", "8 Market Lane"), it("Phone", "(555) 011-4400"), it("Globe", "beanbrew.example")] } },

  /* ── CV / Resume ── */
  { cat: "CV / Resume", size: "resume", layout: "resume", pal: "midnight", font: "jakarta", copy: { name: "Modern Resume", tags: ["resume", "cv", "job"], title: "Alex Johnson", subtitle: "Marketing Manager", body: "Results-driven marketer with 7 years of experience growing brands across digital channels.", footer: "alex@email.example\n(555) 010-7788\nChicago, IL", items: [it("", "Brand strategy"), it("", "SEO & content"), it("", "Paid social"), it("", "Analytics"), it("", "Team leadership")] } },
  { cat: "CV / Resume", size: "resume", layout: "resume", pal: "forest", font: "fraunces", copy: { name: "Creative Resume", tags: ["resume", "cv", "creative", "designer"], title: "Priya Shah", subtitle: "Graphic Designer", body: "Designer who blends strategy and craft to build memorable visual identities.", footer: "priya@email.example\n(555) 012-4455\nAustin, TX", items: [it("", "Branding"), it("", "Typography"), it("", "Illustration"), it("", "Motion"), it("", "Figma")] } },
  { cat: "CV / Resume", size: "resume", layout: "resume", pal: "clinic", font: "montserrat", copy: { name: "Medical Resume", tags: ["resume", "cv", "doctor", "medical"], title: "Dr. Omar Haddad", subtitle: "Internal Medicine Resident", body: "Resident physician with a focus on cardiology, research and patient education.", footer: "omar@email.example\n(555) 019-2211\nBoston, MA", items: [it("", "Clinical care"), it("", "ACLS certified"), it("", "Research"), it("", "Teaching"), it("", "Arabic & English")] } },

  /* ── Infographics ── */
  { cat: "Infographics", size: "info", layout: "listIcons", pal: "midnight", font: "jakarta", copy: { name: "Sleep Science Infographic", tags: ["infographic", "sleep", "health"], eyebrow: "Health", title: "The Science of Sleep", subtitle: "Why 7–9 hours matters", items: [it("Brain", "Memory", "Sleep consolidates what you learned."), it("HeartPulse", "Heart health", "Blood pressure drops at night."), it("Shield", "Immunity", "Your body repairs and defends."), it("Smile", "Mood", "Less irritability and stress."), it("Scale", "Weight", "Better appetite regulation.")], footer: "Source: general health guidance" } },
  { cat: "Infographics", size: "info", layout: "cardGrid", pal: "ocean", font: "poppins", copy: { name: "Save Water Tips", tags: ["infographic", "water", "environment", "tips"], eyebrow: "Go green", title: "6 Ways to Save Water", items: [it("ShowerHead", "Shorter showers", "Save up to 40 L a day."), it("Droplet", "Fix leaks", "A drip wastes 20 L daily."), it("WashingMachine", "Full loads", "Only run full machines."), it("Sprout", "Water at dawn", "Less evaporation."), it("CloudRain", "Collect rain", "Use it for plants."), it("GlassWater", "Tap off", "While brushing teeth.")] } },
  { cat: "Infographics", size: "info", layout: "listIcons", pal: "sunset", font: "outfit", copy: { name: "Startup Funding Stages", tags: ["infographic", "startup", "business", "finance"], eyebrow: "Startup 101", title: "Funding Stages Explained", items: [it("Sprout", "Pre-seed", "Friends, family, savings."), it("Leaf", "Seed", "First institutional money."), it("TreeDeciduous", "Series A", "Scale a proven product."), it("Building2", "Series B+", "Expand to new markets."), it("Landmark", "IPO / Exit", "Go public or get acquired.")] } },
  { cat: "Infographics", size: "info", layout: "cardGrid", pal: "cyber", font: "grotesk", copy: { name: "Social Media Stats", tags: ["infographic", "statistics", "social media", "marketing"], eyebrow: "2026 snapshot", title: "Social Media by the Numbers", items: [it("Users", "5.2B", "People on social media"), it("Clock", "2h 20m", "Average daily use"), it("Video", "82%", "Of traffic is video"), it("Smartphone", "98%", "Access via mobile")], footer: "Illustrative figures for template use" } },

  /* ── Educational Designs ── */
  { cat: "Educational Designs", size: "info", layout: "listIcons", pal: "royal", font: "nunito", copy: { name: "Solar System Facts", tags: ["education", "space", "science", "kids"], eyebrow: "Space facts", title: "Our Solar System", items: [it("Sun", "The Sun", "A star 109× wider than Earth."), it("Globe", "Earth", "The only planet known to host life."), it("CircleDot", "Jupiter", "Biggest planet — 95 moons!"), it("Orbit", "Saturn", "Its rings are made of ice."), it("Snowflake", "Neptune", "Winds up to 2,000 km/h.")] } },
  { cat: "Educational Designs", size: "flyer", layout: "cardGrid", pal: "lemon", font: "nunito", copy: { name: "Classroom Rules", tags: ["education", "classroom", "school", "rules"], eyebrow: "Our class", title: "Classroom Rules", items: [it("Hand", "Raise your hand"), it("Ear", "Listen to others"), it("Heart", "Be kind"), it("Clock", "Be on time"), it("Sparkles", "Try your best"), it("Trash2", "Keep it tidy")] } },
  { cat: "Educational Designs", size: "slide", layout: "cardGrid", pal: "mint", font: "fraunces", copy: { name: "Math Formulas Sheet", tags: ["education", "math", "formulas", "cheat sheet"], eyebrow: "Geometry", title: "Area Formulas", items: [it("Square", "Square", "A = s²"), it("RectangleHorizontal", "Rectangle", "A = l × w"), it("Triangle", "Triangle", "A = ½ b h"), it("Circle", "Circle", "A = π r²")] } },
  { cat: "Educational Designs", size: "square", layout: "centered", pal: "ocean", font: "poppins", copy: { name: "Word of the Day", tags: ["education", "vocabulary", "language"], eyebrow: "Word of the day", title: "Serendipity", subtitle: "(n.) finding something good without looking for it." } },

  /* ── Medical Education ── */
  { cat: "Medical Education", size: "info", layout: "listIcons", pal: "clinic", font: "montserrat", copy: { name: "Type 2 Diabetes Overview", tags: ["medical", "diabetes", "endocrinology", "students"], eyebrow: "Endocrinology", title: "Type 2 Diabetes", subtitle: "Quick review for students", items: [it("Droplet", "Diagnosis", "HbA1c ≥ 6.5% or fasting glucose ≥ 126 mg/dL."), it("TriangleAlert", "Risk factors", "Obesity, inactivity, family history, age."), it("Activity", "Symptoms", "Polyuria, polydipsia, fatigue, blurred vision."), it("Pill", "First line", "Lifestyle change + metformin."), it("Eye", "Complications", "Retinopathy, nephropathy, neuropathy, CVD.")], footer: "For educational purposes — verify against current guidelines." } },
  { cat: "Medical Education", size: "info", layout: "cardGrid", pal: "mint", font: "jakarta", copy: { name: "Hand Hygiene Steps", tags: ["medical", "hygiene", "infection control", "nursing"], eyebrow: "Infection control", title: "Hand Hygiene in 6 Steps", items: [it("Droplets", "1 · Wet & soap"), it("Hand", "2 · Palm to palm"), it("HandMetal", "3 · Back of hands"), it("Grip", "4 · Between fingers"), it("ThumbsUp", "5 · Thumbs"), it("Sparkles", "6 · Fingertips")], footer: "Rub for at least 20 seconds." } },
  { cat: "Medical Education", size: "square", layout: "cardGrid", pal: "clinic", font: "grotesk", copy: { name: "Heart Anatomy Basics", tags: ["medical", "anatomy", "cardiology", "heart"], eyebrow: "Anatomy", title: "Chambers of the Heart", items: [it("HeartPulse", "Right atrium", "Receives deoxygenated blood."), it("HeartPulse", "Right ventricle", "Pumps to the lungs."), it("Heart", "Left atrium", "Receives oxygenated blood."), it("Heart", "Left ventricle", "Pumps to the body.")] } },
  { cat: "Medical Education", size: "story", layout: "listIcons", pal: "forest", font: "outfit", copy: { name: "Asthma Action Plan", tags: ["medical", "asthma", "respiratory", "patient education"], eyebrow: "Patient education", title: "Asthma Action Plan", items: [it("CircleCheck", "Green zone", "No symptoms — take daily controller."), it("TriangleAlert", "Yellow zone", "Cough or wheeze — use reliever."), it("Siren", "Red zone", "Severe breathlessness — seek emergency care.")], footer: "Follow your clinician's personal plan." } },

  /* ── Invitations ── */
  { cat: "Invitations", size: "invite", layout: "bordered", pal: "blush", font: "vibes", copy: { name: "Baby Shower Invitation", tags: ["invitation", "baby shower", "party"], eyebrow: "Please join us for a", title: "Baby Shower", subtitle: "honouring Sarah", body: "Saturday, March 14 · 2 PM\n18 Rose Lane", items: [it("Baby", "")] } },
  { cat: "Invitations", size: "invite", layout: "centered", pal: "royal", font: "playfair", copy: { name: "Graduation Party", tags: ["invitation", "graduation", "party"], eyebrow: "Class of 2026", title: "Graduation Party", subtitle: "Celebrate with us · June 27 · 7 PM", cta: "RSVP by June 20" } },
  { cat: "Invitations", size: "invite", layout: "bordered", pal: "sand", font: "cormorant", copy: { name: "Engagement Invitation", tags: ["invitation", "engagement", "wedding"], eyebrow: "We're engaged", title: "Lina & Karim", subtitle: "Engagement dinner", body: "Friday, October 9 · 8 PM\nThe Garden Terrace", items: [it("Gem", "")] } },
  { cat: "Invitations", size: "invite", layout: "minimal", pal: "midnight", font: "playfair", copy: { name: "Corporate Gala", tags: ["invitation", "gala", "corporate", "event"], eyebrow: "You're invited", title: "Annual Winter Gala", subtitle: "Black tie · December 12 · Grand Hall", footer: "RSVP: events@company.example" } },
  { cat: "Invitations", size: "invite", layout: "blobHero", pal: "ocean", font: "nunito", copy: { name: "Pool Party Invite", tags: ["invitation", "kids", "birthday", "pool party"], eyebrow: "Make a splash", title: "Pool Party!", subtitle: "Leo turns 8 · Saturday · 3 PM", cta: "Bring your swimsuit" } },

  /* ── Logos ── */
  { cat: "Logos", size: "logo", layout: "badge", pal: "blush", font: "fraunces", copy: { name: "Florist Logo", tags: ["logo", "florist", "flowers"], title: "BLOOM", subtitle: "Flower studio", items: [it("Flower2", "")] } },
  { cat: "Logos", size: "logo", layout: "badge", pal: "sand", font: "bebas", copy: { name: "Coffee Shop Logo", tags: ["logo", "coffee", "cafe"], title: "PEAK COFFEE", subtitle: "Roasted daily", items: [it("Coffee", "")] } },
  { cat: "Logos", size: "logo", layout: "badge", pal: "midnight", font: "grotesk", copy: { name: "Tech Startup Logo", tags: ["logo", "tech", "startup"], title: "NOVA", subtitle: "Software lab", items: [it("Atom", "")] } },
  { cat: "Logos", size: "logo", layout: "badge", pal: "ocean", font: "montserrat", copy: { name: "Surf Club Logo", tags: ["logo", "surf", "sport", "beach"], title: "OCEAN SURF CO", subtitle: "Est. 2026", items: [it("Waves", "")] } },

  /* ── Wallpapers ── */
  { cat: "Wallpapers", size: "phone", layout: "quote", pal: "midnight", font: "playfair", copy: { name: "Quote Phone Wallpaper", tags: ["wallpaper", "phone", "quote", "dark"], title: "Small steps every day.", author: "" } },
  { cat: "Wallpapers", size: "desktop", layout: "blobHero", pal: "royal", font: "grotesk", copy: { name: "Gradient Blobs Desktop", tags: ["wallpaper", "desktop", "gradient", "abstract"], title: "" } },
  { cat: "Wallpapers", size: "phone", layout: "blobHero", pal: "blush", font: "outfit", copy: { name: "Pastel Phone Wallpaper", tags: ["wallpaper", "phone", "pastel"], title: "" } },
  { cat: "Wallpapers", size: "desktop", layout: "minimal", pal: "mono", font: "grotesk", copy: { name: "Minimal Desktop Focus", tags: ["wallpaper", "desktop", "minimal", "productivity"], eyebrow: "focus mode", title: "Do one thing well.", footer: "" } },

  /* ═════════════ Arabic templates (RTL) ═════════════ */
  { cat: "Instagram Posts", size: "square", layout: "bordered", pal: "ramadan", font: "amiri", rtl: true, copy: { name: "رمضان كريم", tags: ["arabic", "عربي", "ramadan", "رمضان"], eyebrow: "أطيب التهاني", title: "رمضان كريم", subtitle: "كل عام وأنتم بخير", body: "تقبّل الله منا ومنكم صالح الأعمال", items: [it("Moon", "")] } },
  { cat: "Instagram Posts", size: "square", layout: "bordered", pal: "sand", font: "ruqaa", rtl: true, copy: { name: "عيد مبارك", tags: ["arabic", "عربي", "eid", "عيد"], eyebrow: "بمناسبة عيد الفطر", title: "عيد مبارك", subtitle: "أعاده الله علينا وعليكم بالخير", body: "مع أطيب الأمنيات", items: [it("Sparkles", "")] } },
  { cat: "Instagram Posts", size: "square", layout: "bigStat", pal: "coral", font: "lalezar", rtl: true, copy: { name: "عرض خاص - خصم", tags: ["arabic", "عربي", "sale", "خصم", "عرض"], eyebrow: "لفترة محدودة", title: "٥٠٪", subtitle: "خصم على جميع المنتجات", body: "العرض ساري حتى نهاية الأسبوع", cta: "تسوّق الآن" } },
  { cat: "Instagram Posts", size: "square", layout: "splitFrame", pal: "sand", font: "messiri", rtl: true, copy: { name: "افتتاح مطعم", tags: ["arabic", "عربي", "restaurant", "مطعم", "افتتاح"], eyebrow: "افتتاح جديد", title: "مطعم بيت الجدة", subtitle: "أشهى الأكلات العراقية بنكهة البيت", cta: "احجز طاولتك" } },
  { cat: "Instagram Stories", size: "story", layout: "photoOverlay", pal: "royal", font: "cairo", rtl: true, copy: { name: "ستوري تشكيلة جديدة", tags: ["arabic", "عربي", "fashion", "أزياء"], eyebrow: "وصل حديثاً", title: "تشكيلة الصيف", subtitle: "ألوان جريئة وأقمشة خفيفة", cta: "تسوّقي الآن" } },
  { cat: "Social Media", size: "square", layout: "diagonal", pal: "mono", font: "cairo", rtl: true, copy: { name: "نوظّف الآن", tags: ["arabic", "عربي", "hiring", "وظائف"], eyebrow: "فرص عمل", title: "نوظّف الآن", subtitle: "مصمم جرافيك · دوام كامل · بغداد", cta: "قدّم اليوم" } },
  { cat: "YouTube Thumbnails", size: "yt", layout: "splitFrame", pal: "cyber", font: "lalezar", rtl: true, copy: { name: "مراجعة تقنية", tags: ["arabic", "عربي", "youtube", "مراجعة"], eyebrow: "بعد شهر من الاستخدام", title: "هل يستحق الشراء؟", subtitle: "رأيي بصراحة" } },
  { cat: "Flyers", size: "flyer", layout: "listIcons", pal: "clinic", font: "tajawal", rtl: true, copy: { name: "دورة تدريبية", tags: ["arabic", "عربي", "course", "دورة", "تعليم"], eyebrow: "سجّل الآن", title: "دورة التصميم الجرافيكي", subtitle: "من الصفر إلى الاحتراف في ٨ أسابيع", items: [it("PenTool", "أساسيات التصميم", "الألوان والخطوط والتكوين."), it("Monitor", "برامج التصميم", "تطبيق عملي على مشاريع حقيقية."), it("Award", "شهادة معتمدة", "عند إتمام الدورة."), it("Phone", "للتسجيل: ٠٧٧٠ ١٢٣ ٤٥٦٧", "المقاعد محدودة.")] } },
  { cat: "Posters", size: "poster", layout: "centered", pal: "forest", font: "kufi", rtl: true, copy: { name: "معرض الكتاب", tags: ["arabic", "عربي", "books", "كتب", "معرض"], eyebrow: "الدورة العاشرة", title: "معرض بغداد للكتاب", subtitle: "من ١ إلى ١٠ نيسان · أرض المعارض", cta: "الدخول مجاني" } },
  { cat: "Invitations", size: "invite", layout: "bordered", pal: "sand", font: "amiri", rtl: true, copy: { name: "دعوة زفاف", tags: ["arabic", "عربي", "wedding", "زفاف", "دعوة"], eyebrow: "بكل الحب ندعوكم لحضور حفل زفاف", title: "أحمد و سارة", subtitle: "يوم الجمعة ٢٠ حزيران ٢٠٢٦", body: "الساعة الثامنة مساءً · قاعة الياسمين", items: [it("Heart", "")] } },
  { cat: "Invitations", size: "invite", layout: "centered", pal: "royal", font: "cairo", rtl: true, copy: { name: "حفل تخرج", tags: ["arabic", "عربي", "graduation", "تخرج"], eyebrow: "دفعة ٢٠٢٦", title: "حفل التخرج", subtitle: "يسعدنا حضوركم · الخميس ٢٥ حزيران · ٧ مساءً", cta: "نرجو تأكيد الحضور" } },
  { cat: "Business Cards", size: "card", layout: "card", pal: "midnight", font: "tajawal", rtl: true, copy: { name: "بطاقة عمل", tags: ["arabic", "عربي", "business card", "بطاقة"], title: "محمد علي", subtitle: "مهندس معماري", items: [it("Ruler", ""), it("Phone", "٠٧٨٠ ٥٥٥ ١٢٣٤"), it("Mail", "mohammed@example.com"), it("MapPin", "بغداد · المنصور")] } },
  { cat: "Medical Education", size: "info", layout: "listIcons", pal: "clinic", font: "cairo", rtl: true, copy: { name: "ارتفاع ضغط الدم", tags: ["arabic", "عربي", "medical", "طب", "ضغط"], eyebrow: "تثقيف صحي", title: "ارتفاع ضغط الدم", subtitle: "ما تحتاج معرفته", items: [it("HeartPulse", "التعريف", "ضغط ١٣٠/٨٠ ملم زئبق أو أكثر بشكل مستمر."), it("TriangleAlert", "عوامل الخطورة", "السمنة، الملح، التدخين، قلة الحركة."), it("Activity", "الأعراض", "غالباً بدون أعراض، لذلك يُسمى القاتل الصامت."), it("Salad", "الوقاية", "تقليل الملح، الرياضة، النوم الجيد."), it("Pill", "العلاج", "تغيير نمط الحياة والأدوية حسب الطبيب.")], footer: "للتثقيف فقط — راجع طبيبك." } },
  { cat: "Infographics", size: "info", layout: "cardGrid", pal: "ocean", font: "tajawal", rtl: true, copy: { name: "فوائد شرب الماء", tags: ["arabic", "عربي", "infographic", "صحة", "ماء"], eyebrow: "صحتك أولاً", title: "فوائد شرب الماء", items: [it("Brain", "تركيز أفضل", "الجفاف يقلل الانتباه."), it("Sparkles", "بشرة نضرة", "ترطيب من الداخل."), it("Zap", "طاقة أعلى", "تقليل الشعور بالتعب."), it("HeartPulse", "قلب أقوى", "دورة دموية أفضل.")], footer: "اشرب ٨ أكواب يومياً على الأقل" } },
  { cat: "Educational Designs", size: "flyer", layout: "cardGrid", pal: "lemon", font: "tajawal", rtl: true, copy: { name: "قوانين الصف", tags: ["arabic", "عربي", "school", "مدرسة", "تعليم"], eyebrow: "صفّنا", title: "قوانين الصف", items: [it("Hand", "ارفع يدك"), it("Ear", "استمع للآخرين"), it("Heart", "كن لطيفاً"), it("Clock", "احضر في الوقت"), it("Sparkles", "ابذل جهدك"), it("Trash2", "حافظ على النظافة")] } },
  { cat: "Logos", size: "logo", layout: "badge", pal: "sand", font: "kufi", rtl: true, copy: { name: "شعار مقهى", tags: ["arabic", "عربي", "logo", "شعار", "قهوة"], title: "قهوة الصباح", subtitle: "منذ ٢٠٢٦", items: [it("Coffee", "")] } },
  { cat: "Wallpapers", size: "phone", layout: "quote", pal: "ramadan", font: "amiri", rtl: true, copy: { name: "خلفية اقتباس", tags: ["arabic", "عربي", "wallpaper", "خلفية"], title: "وما توفيقي إلا بالله", author: "" } },
  { cat: "TikTok", size: "story", layout: "diagonal", pal: "sunset", font: "lalezar", rtl: true, copy: { name: "وصفة سريعة", tags: ["arabic", "عربي", "recipe", "طبخ", "tiktok"], eyebrow: "وصفة ١٥ دقيقة", title: "باستا بالكريمة", subtitle: "سهلة · رخيصة · لذيذة" } },
];

export const CATALOG_TEMPLATES: TemplateDef[] = ENTRIES.map((e, i) => {
  const [W, H] = SIZE[e.size];
  const pal = P[e.pal], font = F[e.font];
  const pages = [buildPage(e.layout, W, H, pal, font, e.copy, !!e.rtl), ...(e.extraPages ?? []).map((x) => buildPage(x.layout, W, H, pal, font, x.copy, !!e.rtl))];
  return {
    id: `gen-${String(i).padStart(3, "0")}-${e.copy.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ar"}`,
    name: e.copy.name,
    category: e.cat,
    width: W,
    height: H,
    tags: [...e.copy.tags, e.layout, e.pal],
    pages,
  };
});
