import { useState, useEffect, useRef } from 'react'
import { fetchAllSchemes } from './lib/supabase'
import { askGemini } from './lib/gemini'
import { startListening, speakText, stopSpeaking, isVoiceInputSupported, isVoiceOutputSupported } from './lib/speech'
import { subscribeToConnectionStatus, isCurrentlyOnline, getCacheAge, getSchemesFromCache, getSavedSchemeIds, toggleSavedScheme, clearSchemesCache, clearSavedSchemes } from './lib/offline'
import { getProfile, saveProfile, clearProfile, profileToOpener } from './lib/profile'
import { getSettings, saveSettings } from './lib/settings'
import Logo from './Logo'
import {
  MicIcon, StopIcon, SpeakerOnIcon, SpeakerOffIcon, MenuIcon, CloseIcon, PlusChatIcon,
  GridIcon, DocumentIcon, BookmarkIcon, UserCircleIcon, SettingsGearIcon, GlobeIcon,
  SendIcon, SearchIcon, ShieldAlertIcon, CalculatorIcon, BarChartIcon, BriefcaseJobIcon,
} from './Icons'
import ApplicationForm from './ApplicationForm'
import LandingPage from './LandingPage'
import GrievanceRedressal from './GrievanceRedressal'
import EligibilityScorecard from './EligibilityScorecard'
import AdminDashboard from './AdminDashboard'
import RojgarScholarshipRadar from './RojgarScholarshipRadar'
import DocumentVerification from './DocumentVerification'

// Voice input/output languages. Web Speech API support for Marathi and
// Tamil depends on the browser/OS having those voices installed, but the
// language codes themselves are standard BCP-47 tags it understands.
const VOICE_LANGUAGES = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी' },
  { code: 'mr-IN', label: 'मराठी' },
  { code: 'ta-IN', label: 'தமிழ்' },
]

const QUICK_LINKS = [
  { label: 'PM-KISAN', url: 'https://pmkisan.gov.in' },
  { label: 'Ayushman Bharat', url: 'https://beneficiary.nha.gov.in' },
  { label: 'MP State Scholarship', url: 'https://scholarshipportal.mp.nic.in' },
  { label: 'MP Social Security', url: 'https://socialsecurity.mp.gov.in' },
  { label: 'PM Awas Yojana', url: 'https://pmaymis.gov.in' },
  { label: 'National Scholarship', url: 'https://scholarships.gov.in' },
  { label: 'Ujjwala Yojana', url: 'https://www.pmuy.gov.in' },
  { label: 'e-Shram (Workers)', url: 'https://eshram.gov.in' },
  { label: 'Jan Dhan Yojana', url: 'https://pmjdy.gov.in' },
  { label: 'MPOnline Citizen Portal', url: 'https://mponline.gov.in' },
  { label: 'CM Helpline 181', url: 'https://cmhelpline.mp.gov.in' },
  { label: 'Samagra Portal MP', url: 'https://samagra.gov.in' },
]

function renderInline(text, keyPrefix) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>
  })
}

function MessageContent({ text }) {
  const lines = text.split('\n')
  const blocks = []
  let currentList = []
  let currentOrderedList = []

  function flushList(key) {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`ul-${key}`} style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {currentList.map((line, i) => (
            <li key={i} style={{ marginBottom: '3px' }}>
              {renderInline(line.replace(/^[*\-]\s+/, ''), `li-${key}-${i}`)}
            </li>
          ))}
        </ul>
      )
      currentList = []
    }
    if (currentOrderedList.length > 0) {
      blocks.push(
        <ol key={`ol-${key}`} style={{ margin: '4px 0', paddingLeft: '22px' }}>
          {currentOrderedList.map((line, i) => (
            <li key={i} style={{ marginBottom: '3px' }}>
              {renderInline(line.replace(/^\d+[\.)]\s+/, ''), `oli-${key}-${i}`)}
            </li>
          ))}
        </ol>
      )
      currentOrderedList = []
    }
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed)
    if (headingMatch) {
      flushList(idx)
      const level = headingMatch[1].length
      blocks.push(
        <div
          key={idx}
          style={{
            fontWeight: 700,
            color: 'var(--color-forest)',
            fontSize: level <= 2 ? '15.5px' : '14.5px',
            margin: '10px 0 4px',
          }}
        >
          {renderInline(headingMatch[2], `h-${idx}`)}
        </div>
      )
    } else if (/^[*\-]\s+/.test(trimmed)) {
      if (currentOrderedList.length > 0) flushList(idx)
      currentList.push(trimmed)
    } else if (/^\d+[\.)]\s+/.test(trimmed)) {
      if (currentList.length > 0) flushList(idx)
      currentOrderedList.push(trimmed)
    } else {
      flushList(idx)
      if (trimmed === '') {
        blocks.push(<div key={idx} style={{ height: '6px' }} />)
      } else if (trimmed === '--' || trimmed === '---' || trimmed === '***') {
        blocks.push(<hr key={idx} style={{ border: 'none', borderTop: '1px solid rgba(20,83,45,0.12)', margin: '8px 0' }} />)
      } else {
        blocks.push(<div key={idx}>{renderInline(line, `p-${idx}`)}</div>)
      }
    }
  })
  flushList('end')

  return <>{blocks}</>
}

// 12 Flagship MP & Central Govt Schemes with full eligibility, tangible benefits,
// required documents checklist, and official portal how-to-apply steps.
const DEFAULT_SCHEMES = [
  {
    id: 'ladli-behna',
    scheme_name: 'Mukhyamantri Ladli Behna Yojana (MP)',
    scheme_name_hindi: 'मुख्यमंत्री लाड़ली बहना योजना',
    category: 'woman',
    level: 'State (Madhya Pradesh)',
    benefits: '₹15,000 / year (₹1,250 / month direct bank transfer into Aadhaar-linked DBT account on the 10th of every month)',
    eligibility_criteria: [
      'Female resident of Madhya Pradesh aged between 21 and 60 years',
      'Married, widowed, divorced, or abandoned women are eligible',
      'Annual combined family income must be less than ₹2.5 Lakh',
      'Family must own less than 5 acres of agricultural land',
      'No family member should be a government employee or income tax payer'
    ],
    documents_required: [
      'Samagra Member ID & Family ID (e-KYC biometric verified)',
      'Aadhaar Card (linked to active mobile number)',
      'Bank Account Passbook with NPCI Direct Benefit Transfer (DBT) enabled',
      'Active Mobile Number for OTP authentication'
    ],
    how_to_apply: 'Apply through special Gram Panchayat / Ward camps or online at ladlibehna.mp.gov.in via Lok Sewa Kendra / MPOnline kiosk. e-KYC and photo verification are done free of cost.'
  },
  {
    id: 'pm-kisan-kalyan',
    scheme_name: 'PM-KISAN Samman Nidhi + MP Mukhyamantri Kisan Kalyan Yojana',
    scheme_name_hindi: 'पीएम-किसान + मुख्यमंत्री किसान कल्याण योजना',
    category: 'farmer',
    level: 'Combined Central + State (MP)',
    benefits: '₹12,000 / year direct bank transfer (₹6,000 Central in 3 installments of ₹2,000 + ₹6,000 MP Govt in 3 installments of ₹2,000)',
    eligibility_criteria: [
      'Small and marginal farmers holding cultivable agricultural land in Madhya Pradesh',
      'Land title must be officially registered in applicant name in MP Bhulekh records',
      'Excludes institutional landowners, serving/retired government officials, and income tax payers'
    ],
    documents_required: [
      'Land Record Document (Khasra/Khatauni B-1 from MP Bhulekh portal)',
      'Aadhaar Card (linked to mobile number)',
      'Samagra ID',
      'Bank Account Passbook with NPCI Aadhaar Seeding (DBT enabled)',
      'Active Mobile Number'
    ],
    how_to_apply: 'Apply online on pmkisan.gov.in and MP SAARA portal (saara.mp.gov.in) through MPOnline kiosk, CSC center, or submit physical application to your local village Patwari or Gram Panchayat.'
  },
  {
    id: 'ayushman-bharat',
    scheme_name: 'Ayushman Bharat (Niramayam Madhya Pradesh)',
    scheme_name_hindi: 'आयुष्मान भारत - निरामयम मध्य प्रदेश',
    category: 'general',
    level: 'State & Central',
    benefits: '₹5,00,000 / year free cashless medical treatment per family across 1,000+ empaneled government and private hospitals across MP and India',
    eligibility_criteria: [
      'Families identified in SECC-2011 deprivation database',
      'NFSA Ration Card holders & BPL cardholders',
      'Mukhyamantri Sambal 2.0 cardholders',
      'All senior citizens aged 70 years and above (universal coverage without income limit)'
    ],
    documents_required: [
      'Samagra Family & Member ID',
      'Ration Card / Sambal Card / BPL Card',
      'Aadhaar Card of all family members',
      'Active Mobile Number'
    ],
    how_to_apply: 'Generate your digital Ayushman Card instantly via Ayushman App / beneficiary.nha.gov.in, nearest Lok Sewa Kendra, MPOnline kiosk, or Ayushman Mitra helpdesk at any government district hospital.'
  },
  {
    id: 'sambal-yojana',
    scheme_name: 'Mukhyamantri Jan Kalyan (Sambal 2.0) Yojana',
    scheme_name_hindi: 'मुख्यमंत्री जन कल्याण (संबल 2.0) योजना',
    category: 'general',
    level: 'State (Madhya Pradesh)',
    benefits: 'Comprehensive unorganized worker social security: ₹16,000 maternity aid, ₹4 Lakh accidental death assistance, ₹2 Lakh natural death grant, ₹1 Lakh disability aid, electricity bill subsidy, and full college fee waiver for children',
    eligibility_criteria: [
      'Unorganized sector worker aged 18 to 60 years residing in Madhya Pradesh',
      'Engaged as laborer, artisan, hawker, rickshaw puller, domestic worker, or marginal cultivator',
      'Family must not be paying income tax or in government employment'
    ],
    documents_required: [
      'Samagra Member ID',
      'Aadhaar Card',
      'Self-declaration of unorganized employment / occupation',
      'Bank Account Passbook with DBT active',
      'Active Mobile Number'
    ],
    how_to_apply: 'Register online on Sambal Portal (sambal.mp.gov.in) via MPOnline / CSC kiosk, or submit application form at local Gram Panchayat / Janpad Panchayat / Municipal Ward Office.'
  },
  {
    id: 'seekho-kamao',
    scheme_name: 'Mukhyamantri Seekho-Kamao Yojana (MMSKY)',
    scheme_name_hindi: 'मुख्यमंत्री सीखो-कमाओ योजना',
    category: 'youth',
    level: 'State (Madhya Pradesh)',
    benefits: 'Monthly government stipend of ₹8,000 (12th pass), ₹8,500 (ITI), ₹9,000 (Polytechnic Diploma), and ₹10,000 (College Degree/PG) via DBT + on-the-job industrial skill certification',
    eligibility_criteria: [
      'Permanent resident of Madhya Pradesh',
      'Age between 18 and 29 years',
      'Educational qualification: Minimum 12th Pass, ITI, Diploma, or Degree from recognized board/university',
      'Must complete Samagra e-KYC'
    ],
    documents_required: [
      '12th / ITI / Diploma / Degree Marksheet and Certificate',
      'Samagra Member ID (with completed e-KYC)',
      'Aadhaar Card',
      'MP Domicile Certificate',
      'Bank Passbook with NPCI DBT enabled'
    ],
    how_to_apply: 'Register on official MMSKY portal (mmsky.mp.gov.in) using Samagra ID, create candidate profile, browse vacancies posted by registered industries/enterprises in MP, and apply directly.'
  },
  {
    id: 'pm-awas',
    scheme_name: 'Pradhan Mantri Awas Yojana (PMAY Gramin & Urban)',
    scheme_name_hindi: 'प्रधानमंत्री आवास योजना (ग्रामीण एवं शहरी)',
    category: 'general',
    level: 'Combined Central + State (MP)',
    benefits: 'Direct financial grant of ₹1,20,000 (plains) to ₹1,30,000 (hilly) for rural house construction + 90 days MGNREGA wages (approx ₹25,000) + ₹12,000 Swachh Bharat toilet aid. Urban credit subsidy up to ₹2,50,000',
    eligibility_criteria: [
      'Homeless families or families living in kutcha/damaged houses in MP',
      'Applicant or family members must not own a pucca house anywhere in India',
      'Name listed in SECC-2011 / Awas+ survey list',
      'BPL or low-income household'
    ],
    documents_required: [
      'Aadhaar Card of all adult family members',
      'Bank Account Passbook (Aadhaar linked)',
      'Samagra Family ID',
      'MGNREGA Job Card (for rural applicants)',
      'Land ownership patta or allotment papers',
      'Photo of existing kutcha house'
    ],
    how_to_apply: 'Gramin: Verified by Gram Sabha and listed on Awas+ app via Gram Panchayat Secretary. Urban: Apply on pmaymis.gov.in or through local Municipal Corporation / Nagarpalika office.'
  },
  {
    id: 'mmvy-scholarship',
    scheme_name: 'Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)',
    scheme_name_hindi: 'मुख्यमंत्री मेधावी विद्यार्थी योजना',
    category: 'student',
    level: 'State (Madhya Pradesh)',
    benefits: 'Full 100% academic tuition and course fee paid directly by MP Government to the educational institution for higher education (Engineering, Medical, Law, Degree colleges)',
    eligibility_criteria: [
      'Resident student of Madhya Pradesh',
      'Secured 70%+ marks in MP Board 12th exam OR 85%+ in CBSE/ICSE 12th exam',
      'Enrolled in recognized undergraduate professional course (JEE/NEET/CLAT or Govt college)',
      'Annual family income must be under ₹6 Lakh'
    ],
    documents_required: [
      '10th and 12th Marksheets',
      'College Admission / Seat Allotment Letter & Fee Receipt',
      'MP Domicile Certificate',
      'Income Certificate (under ₹6 Lakh issued by competent authority)',
      'Samagra ID',
      'Aadhaar Card',
      'Bank Passbook'
    ],
    how_to_apply: 'Apply online on MP State Scholarship Portal (scholarshipportal.mp.nic.in) under MMVY section, submit scanned copies, and get online verification from college nodal officer.'
  },
  {
    id: 'gaon-ki-beti',
    scheme_name: 'Gaon Ki Beti & Pratibha Kiran Scholarship Yojana',
    scheme_name_hindi: 'गांव की बेटी एवं प्रतिभा किरण योजना',
    category: 'student',
    level: 'State (Madhya Pradesh)',
    benefits: 'Scholarship grant of ₹5,00,000 - ₹7,500 per academic year (₹500 - ₹750/month for 10 months) paid directly into girl student bank account',
    eligibility_criteria: [
      'Gaon Ki Beti: Rural MP girl students passing 12th with 60%+ first division from a village school and studying in college',
      'Pratibha Kiran: Urban BPL girl students passing 12th with 60%+'
    ],
    documents_required: [
      '12th Class Marksheet (First Division 60%+)',
      'Village Residence Certificate from Sarpanch/Secretary (Gaon Ki Beti) or Urban BPL Card (Pratibha Kiran)',
      'College Admission Receipt',
      'Samagra ID',
      'Aadhaar Card',
      'Bank Passbook'
    ],
    how_to_apply: 'Apply online on MP State Scholarship Portal 2.0 (scholarshipportal.mp.nic.in) through college portal login.'
  },
  {
    id: 'pm-ujjwala',
    scheme_name: 'PM Ujjwala Yojana 2.0 + MP ₹450 LPG Cylinder Subsidy',
    scheme_name_hindi: 'पीएम उज्ज्वला योजना 2.0 + ₹450 रसोई गैस सिलेंडर सब्सिडी',
    category: 'woman',
    level: 'Combined Central + MP State',
    benefits: 'Free new LPG connection with gas cylinder, regulator, and stove + domestic LPG refill at subsidized price of ₹450 per cylinder (balance refunded directly into bank account via DBT)',
    eligibility_criteria: [
      'Adult woman from poor/BPL household or Ladli Behna Yojana beneficiary in MP',
      'Family must not already have an active LPG connection',
      'Ration card holder'
    ],
    documents_required: [
      'Samagra Family & Member ID',
      'Aadhaar Card of applicant and adult family members',
      'BPL Ration Card',
      'Bank Passbook with Aadhaar-linked DBT',
      'Ladli Behna registration number (if beneficiary)'
    ],
    how_to_apply: 'Apply at nearest authorized LPG gas distributor (Indane, Bharat Gas, HP Gas) or register gas connection Consumer ID at Gram Panchayat / Lok Sewa Kendra for ₹450 subsidy.'
  },
  {
    id: 'udyam-kranti',
    scheme_name: 'Mukhyamantri Udyam Kranti Yojana',
    scheme_name_hindi: 'मुख्यमंत्री उद्यम क्रांति योजना',
    category: 'youth',
    level: 'State (Madhya Pradesh)',
    benefits: 'Bank loans from ₹1 Lakh up to ₹50 Lakh for manufacturing, and up to ₹25 Lakh for service/trade enterprises with 3% annual interest subsidy for 7 years and 100% government collateral guarantee',
    eligibility_criteria: [
      'Resident youth of MP aged 18 to 40 years',
      'Minimum 8th class pass educational qualification',
      'Annual family income not falling in income tax bracket',
      'New enterprise/business project'
    ],
    documents_required: [
      '8th / 10th / 12th Marksheet',
      'MP Domicile Certificate',
      'Aadhaar Card',
      'Samagra ID',
      'Detailed Project Report (DPR)',
      'Bank Account details',
      'Quotation of machinery/equipment'
    ],
    how_to_apply: 'Apply online on Samast Portal (samast.mponline.gov.in), choose lending bank branch, and track approval through District Industries Centre (DIC).'
  },
  {
    id: 'social-pension',
    scheme_name: 'MP Social Security Pension (Old Age, Widow & Divyang Pension)',
    scheme_name_hindi: 'मध्य प्रदेश सामाजिक सुरक्षा पेंशन (वृद्धावस्था, विधवा एवं दिव्यांग)',
    category: 'senior',
    level: 'State & Central',
    benefits: '₹600 - ₹1,000 / month direct pension credited into beneficiary bank account on the 1st of every month',
    eligibility_criteria: [
      'Senior citizens aged 60+ (Old Age Pension)',
      'Widows aged 18+ (Kalyani / Widow Pension)',
      'Differently-abled individuals with 40%+ disability (Divyang Pension)',
      'BPL or low-income families in MP'
    ],
    documents_required: [
      'Aadhaar Card',
      'Samagra Member ID',
      'Age proof / Husband death certificate (for widow) / Disability certificate from District Medical Board (for Divyang)',
      'BPL Card',
      'Bank Passbook with DBT'
    ],
    how_to_apply: 'Apply online through MP Social Security Portal (socialsecurity.mp.gov.in) via Lok Sewa Kendra or submit at Gram Panchayat / Municipal Ward Office.'
  },
  {
    id: 'post-matric-scholarship',
    scheme_name: 'Post-Matric Scholarship for SC/ST/OBC Students (MP)',
    scheme_name_hindi: 'पोस्ट-मैट्रिक छात्रवृत्ति (एससी/एसटी/ओबीसी)',
    category: 'student',
    level: 'State & Central',
    benefits: '100% government tuition fee reimbursement + monthly maintenance allowance for college and polytechnic courses',
    eligibility_criteria: [
      'Regular student belonging to SC, ST, or OBC category in MP',
      'Enrolled in post-matric courses (Class 11, 12, ITI, Diploma, Graduation, Post-Graduation)',
      'Family annual income under ₹3 Lakh for OBC; under ₹6 Lakh for SC/ST'
    ],
    documents_required: [
      'Caste Certificate (Digital SC/ST/OBC Certificate issued by MP SDO/Tehsildar)',
      'Income Certificate',
      'MP Domicile Certificate',
      '10th & 12th Marksheets',
      'College Admission Fee Receipt',
      'Samagra ID',
      'Aadhaar Card',
      'Bank Passbook'
    ],
    how_to_apply: 'Apply on MP Scholarship Portal 2.0 (scholarshipportal.mp.nic.in) or MP TAAS Portal (tribal.mp.gov.in/mptaas) for SC/ST students.'
  }
]

// Lightweight keyword matching to guess which scheme categories are
// relevant based on the conversation so far in English, Hindi, and Hinglish.
const CATEGORY_KEYWORDS = {
  farmer: [
    'farmer', 'farming', 'kisan', 'agricultur', 'land', 'acre', 'hectare', 'crop', 'khet',
    'किसान', 'खेती', 'फसल', 'जमीन', 'एकड़', 'कृषि', 'पटवारी', 'खसरा', 'खाद', 'बीज', 'kisan kalyan'
  ],
  student: [
    'student', 'scholarship', 'school', 'college', 'class ', 'study', 'studying', 'graduate', 'education', 'marks', '10th', '12th',
    'छात्र', 'छात्रा', 'विद्यार्थी', 'पढ़ाई', 'छात्रवृत्ति', 'स्कॉलरशिप', 'कॉलेज', 'स्कूल', 'मेधावी', 'अंक'
  ],
  woman: [
    'woman', 'women', 'girl', 'daughter', 'wife', 'mother', 'pregnan', 'widow', 'ladli', 'behna', 'female',
    'महिला', 'औरत', 'लाड़ली', 'लाडली', 'बहना', 'बेटी', 'गर्भवती', 'विधवा', 'मातृत्व', 'नारी'
  ],
  senior: [
    'senior', 'old age', 'elderly', '60 year', '65 year', '70 year', 'retire', 'pension',
    'बुजुर्ग', 'वृद्ध', 'पेंशन', 'वृद्धावस्था', 'वरिष्ठ'
  ],
  disability: [
    'disab', 'divyang', 'handicap', 'दिव्यांग', 'विकलांग', 'अशक्त'
  ],
  youth: [
    'unemployed', 'youth', 'jobless', 'no job', 'looking for work', 'fresher', 'unemploy', 'stipend', 'rojgar', 'naukri', 'skill',
    'युवा', 'बेरोजगार', 'रोजगार', 'नौकरी', 'सीखो', 'कमाना', 'कौशल', 'उद्योग'
  ],
  worker: [
    'worker', 'labor', 'labour', 'shramik', 'sambal', 'e-shram', 'construction', 'majdoor',
    'मजदूर', 'श्रमिक', 'संबल', 'कामगार'
  ],
  general: [
    'bpl', 'poor', 'ration card', 'below poverty', 'house', 'housing', 'lpg', 'gas connection', 'hospital', 'health insurance', 'ayushman', 'pmay',
    'राशन', 'आवास', 'मकान', 'बीपीएल', 'गैस', 'उज्ज्वला', 'आयुष्मान', 'इलाज', 'समग्र', 'गरीब', 'बीमारी'
  ],
}

function guessRelevantCategories(conversationText) {
  const lower = conversationText.toLowerCase()
  const matched = new Set(['general'])
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.add(category)
    }
  }
  return matched
}

function buildSystemInstruction(schemes, conversationText, currentLang = 'en-IN') {
  const activeSchemes = (schemes && schemes.length > 0) ? schemes : DEFAULT_SCHEMES
  const relevantCategories = guessRelevantCategories(conversationText)
  const likelyRelevant = activeSchemes.filter((s) => relevantCategories.has(s.category))
  const others = activeSchemes.filter((s) => !relevantCategories.has(s.category))

  const langNames = {
    'en-IN': 'English',
    'hi-IN': 'Hindi (हिन्दी)',
    'mr-IN': 'Marathi (मराठी)',
    'ta-IN': 'Tamil (தமிழ்)',
  }
  const selectedLangName = langNames[currentLang] || 'English'

  const formatScheme = (s) => `
🏛️ SCHEME: ${s.scheme_name} ${s.scheme_name_hindi ? `(${s.scheme_name_hindi})` : ''} [Category: ${s.category}, Level: ${s.level || 'State/Central'}]
- Financial Benefit: ${s.benefits}
- Eligibility Criteria: ${Array.isArray(s.eligibility_criteria) ? s.eligibility_criteria.join('; ') : JSON.stringify(s.eligibility_criteria)}
- Required Documents: ${Array.isArray(s.documents_required) ? s.documents_required.join(', ') : JSON.stringify(s.documents_required)}
- How to Apply: ${s.how_to_apply}`

  return `You are Jan Seva (जन सेवा), an expert, deeply helpful Sovereign AI Citizen Welfare & Governance Assistant for the citizens of Madhya Pradesh and India.

CRITICAL LANGUAGE INSTRUCTION (ABSOLUTE TOP PRIORITY):
- The user has selected language: ${selectedLangName}.
- You MUST WRITE YOUR ENTIRE RESPONSE STRICTLY IN ${selectedLangName.toUpperCase()}.
- If English: WRITE 100% IN CLEAR ENGLISH. Do NOT include Hindi translations or brackets (e.g. write "Jan Seva", NEVER "Jan Seva (जन सेवा)").
- If Hindi: WRITE 100% IN CLEAR, NATURAL HINDI (Devanagari script). Do NOT include English words in brackets or transliterations (e.g. write "जन सेवा", NEVER "जन सेवा (Jan Seva)").
- If Marathi: WRITE 100% IN MARATHI. Do NOT include English in brackets.
- If Tamil: WRITE 100% IN TAMIL. Do NOT include English in brackets.
- Always strictly match the user's selected language (${selectedLangName}) in both the answer and any follow-up guidance.

VOICE & AUDIO SYSTEM CAPABILITIES:
- You HAVE BUILT-IN VOICE & SPEECH SYNTHESIS (TTS) CAPABILITIES. Your responses are automatically read aloud to the citizen.
- NEVER say "I am a text assistant", "I cannot speak", or "I have no voice feature". You CAN speak!
- If the citizen asks in English ("speak to me", "read aloud", "read it out"): Acknowledge warmly in English: "Certainly, I am reading this aloud for you..."
- If the citizen asks in Hindi ("बोल के बताओ", "आवाज़ में बताओ"): Acknowledge warmly in Hindi: "हाँ बिल्कुल, मैं आपको बोलकर बता रहा हूँ..."
- Write cleanly and expressively so speech synthesis sounds natural.

MANDATORY SCHEME PRESENTATION STANDARD (CRITICAL):
The citizen relies on you for complete, thorough, actionable information. NEVER give very short, vague, or one-line answers when discussing or recommending schemes!

Whenever the citizen matches with scheme(s), asks what schemes they qualify for, or inquires about a scheme, you MUST provide an IN-DEPTH, COMPLETE, AND BEAUTIFULLY STRUCTURED breakdown for each matching scheme.

For EACH matched scheme, you MUST include ALL of the following distinct sections:
1. 🏛️ **Scheme Name & Total Benefit**: Official name and the exact financial/material grant (e.g., ₹12,000 / year via DBT).
2. ✨ **Key Features & Highlights**: 2-3 specific bullet points on how the scheme works, disbursement cycles (monthly/quarterly), subsidies, and perks.
3. 🎯 **Eligibility Verification**: Specific qualification criteria (age range, income ceiling, domicile, land size, caste/gender) and why this citizen matches.
4. 📋 **Required Documents Checklist**: Exhaustive list of documents the citizen must have before applying (e.g., Aadhaar Card linked to active mobile, Samagra Family & Member ID with e-KYC, Land Record Khasra B-1 / Marksheet / Income Certificate / Caste Certificate, Bank Passbook with NPCI DBT enabled).
5. 🚀 **Step-by-Step How to Apply**:
   - **Online Portal**: Direct official portal / MPOnline link.
   - **Kiosk / Offline Submission**: Nearest Gram Panchayat / Janpad Panchayat, Lok Sewa Kendra, MPOnline / CSC kiosk.
   - **Step-by-Step Walkthrough**: Step 1 (Gather documents) -> Step 2 (e-KYC verification) -> Step 3 (Application submission) -> Step 4 (Acknowledgment receipt).

CONVERSATIONAL GUIDELINES & PROACTIVE FOLLOW-UPS:
1. If the citizen shares basic info (e.g. "I am a farmer" / "मैं किसान हूँ" or "I am a 12th student"):
   - Immediately introduce the top 1-2 flagship schemes they qualify for WITH their key benefits, features, documents, and how to apply.
   - DO NOT withhold scheme information to only ask questions! Provide the core scheme info upfront!
   - Conclude with 1-2 focused questions to verify their exact entitlement (e.g. asking land in acres, family income, or marks percentage):
     If responding in English: "👉 **Please tell me:** [your question]"
     If responding in Hindi: "👉 **कृपया बताएं:** [आपका प्रश्न]"
2. If the citizen has provided their details:
   - Provide the complete, structured scheme breakdown for all matching schemes.
   - Conclude with a helpful next step (e.g. offering guidance on document verification, Samagra e-KYC, or application drafting).
3. Tone:
   - Warm, respectful, highly encouraging, authoritative, and citizen-friendly.
   - Say "Namaste" only in the first turn.
   - Do NOT artificially cut short your answer. Ensure complete clarity on benefits, features, documents, and application steps.

VERIFIED FLAGSHIP SCHEMES (from official database):
${(likelyRelevant.length > 0 ? likelyRelevant : activeSchemes).map(formatScheme).join('\n')}

ADDITIONAL SCHEMES:
${others.slice(0, 8).map(formatScheme).join('\n')}

SCOPE RESTRICTION:
- You ONLY help with Indian government schemes, citizen welfare, eligibility, and governance portals.
- If asked unrelated off-topic questions (sports, celebrities, coding, etc.), politely decline in 1 sentence and remind them you are here for government schemes and citizen services.`
}

// Static UI text (greeting, status labels, input hints) in each supported
// language - separate from the Gemini system prompt, which already handles
// matching whatever language the person actually types.
const UI_TEXT = {
  'en-IN': {
    welcome: "Namaste! I am Jan Seva. Tell me a bit about yourself — your occupation, age, or situation — and I'll help you find government schemes and benefits you qualify for.",
    online: 'Online',
    offline: 'Offline',
    placeholderIdle: "Ask Jan Seva... (e.g. 'I am a farmer with 2 acres of land in MP')",
    placeholderOffline: 'Reconnect to internet to keep chatting...',
    placeholderListening: 'Listening... speak now',
  },
  'hi-IN': {
    welcome: 'नमस्ते! मैं जन सेवा हूँ। मुझे अपने बारे में थोड़ा बताएं — आपका व्यवसाय, उम्र, या स्थिति — और मैं आपको उन सरकारी योजनाओं को खोजने में मदद करूंगा जिनके लिए आप पात्र हैं।',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    placeholderIdle: "जन सेवा से पूछें... (उदा: 'मैं 2 एकड़ जमीन वाला किसान हूं')",
    placeholderOffline: 'बातचीत जारी रखने के लिए इंटरनेट से दोबारा जुड़ें...',
    placeholderListening: 'सुन रहा हूं... अब बोलें',
  },
  'mr-IN': {
    welcome: 'नमस्कार! मी जन सेवा आहे. मला तुमच्याबद्दल थोडं सांगा — तुमचा व्यवसाय, वय किंवा परिस्थिती — आणि मी तुम्हाला पात्र असलेल्या सरकारी योजना शोधण्यात मदत करेन.',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    placeholderIdle: "जन सेवेला विचारा... (उदा: 'मी 2 एकर जमीन असलेला शेतकरी आहे')",
    placeholderOffline: 'गप्पा सुरू ठेवण्यासाठी इंटरनेटशी पुन्हा कनेक्ट करा...',
    placeholderListening: 'ऐकत आहे... आता बोला',
  },
  'ta-IN': {
    welcome: 'வணக்கம்! நான் ஜன் சேவா. உங்களைப் பற்றி கொஞ்சம் சொல்லுங்கள் — உங்கள் தொழில், வயது அல்லது சூழ்நிலை — நீங்கள் தகுதி பெறக்கூடிய அரசு திட்டங்களைக் கண்டறிய நான் உதவுகிறேன்.',
    online: 'ஆன்லைன்',
    offline: 'ஆஃப்லைன்',
    placeholderIdle: "ஜன் சேவாவிடம் கேளுங்கள்...",
    placeholderOffline: 'உரையாடலைத் தொடர இணையத்துடன் மீண்டும் இணையவும்...',
    placeholderListening: 'கேட்கிறேன்... இப்போது பேசுங்கள்',
  },
}

function t(lang, key) {
  return (UI_TEXT[lang] && UI_TEXT[lang][key]) || UI_TEXT['en-IN'][key]
}

function Welcome(lang) {
  return {
    role: 'assistant',
    text: t(lang, 'welcome'),
  }
}

// Eligibility criteria / documents required can come back from the database
// as an array, a plain object, or a single string - this renders whichever
// shape shows up as something readable, without needing a network call.
function FormattedField({ value }) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: 'var(--color-charcoal-soft)' }}>Not specified</span>
  }
  if (Array.isArray(value)) {
    return (
      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
        {value.map((item, i) => (
          <li key={i} style={{ marginBottom: '2px' }}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object') {
    return (
      <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
        {Object.entries(value).map(([key, val]) => (
          <li key={key} style={{ marginBottom: '2px' }}>
            <strong>{key.replace(/_/g, ' ')}:</strong> {typeof val === 'object' ? JSON.stringify(val) : String(val)}
          </li>
        ))}
      </ul>
    )
  }
  return <span>{String(value)}</span>
}

export default function App() {
  const [started, setStarted] = useState(false)
  const [pendingOpener, setPendingOpener] = useState(null)
  const [schemes, setSchemes] = useState(() => {
    const cached = getSchemesFromCache()
    return (cached && cached.length > 0) ? cached : DEFAULT_SCHEMES
  })
  const [messages, setMessages] = useState(() => [Welcome(getSettings().defaultVoiceLang)])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSchemes, setLoadingSchemes] = useState(false)
  const [error, setError] = useState(null)
  const [showLinks, setShowLinks] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [showBrowseSchemes, setShowBrowseSchemes] = useState(false)
  const [schemeSearch, setSchemeSearch] = useState('')
  const [viewingScheme, setViewingScheme] = useState(null)
  const [savedSchemeIds, setSavedSchemeIds] = useState(() => getSavedSchemeIds())
  const [showSavedSchemes, setShowSavedSchemes] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState(null)
  const [settings, setSettings] = useState(() => getSettings())
  const [voiceLang, setVoiceLang] = useState(() => getSettings().defaultVoiceLang)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [speakEnabled, setSpeakEnabled] = useState(false)
  const listenControllerRef = useRef(null)
  const silenceTimerRef = useRef(null)
  const latestVoiceTextRef = useRef('')
  const lastSentTextRef = useRef('')
  const [isOnline, setIsOnline] = useState(isCurrentlyOnline())
  const [usingCachedSchemes, setUsingCachedSchemes] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)
  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState(() => getProfile())
  const [profileForm, setProfileForm] = useState(() => getProfile() || { name: '', age: '', occupation: '', location: '' })
  const [showSettings, setShowSettings] = useState(false)
  const [showScorecard, setShowScorecard] = useState(false)
  const [showRojgarRadar, setShowRojgarRadar] = useState(false)
  const [showDocVerification, setShowDocVerification] = useState(false)
  const [showGrievance, setShowGrievance] = useState(false)
  const [showAdminDashboard, setShowAdminDashboard] = useState(false)
  const [applySchemeId, setApplySchemeId] = useState(null)
  const bottomRef = useRef(null)
  const userPromptRef = useRef(null)
  const latestAssistantRef = useRef(null)

  function showToast(message) {
    setToast(message)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 2200)
  }

  function handleStart(opener) {
    setStarted(true)
    if (opener) setPendingOpener(opener)
  }

  useEffect(() => {
    fetchAllSchemes().then(({ schemes: remoteSchemes, fromCache }) => {
      if (remoteSchemes && remoteSchemes.length > 0) {
        setSchemes(remoteSchemes)
        setUsingCachedSchemes(fromCache)
      } else {
        setSchemes((prev) => (prev && prev.length > 0 ? prev : DEFAULT_SCHEMES))
      }
      setLoadingSchemes(false)
    }).catch(() => {
      setSchemes((prev) => (prev && prev.length > 0 ? prev : DEFAULT_SCHEMES))
      setLoadingSchemes(false)
    })
  }, [])

  function retryLoadSchemes() {
    fetchAllSchemes().then(({ schemes: remoteSchemes, fromCache }) => {
      if (remoteSchemes && remoteSchemes.length > 0) {
        setSchemes(remoteSchemes)
        setUsingCachedSchemes(fromCache)
      } else {
        setSchemes((prev) => (prev && prev.length > 0 ? prev : DEFAULT_SCHEMES))
      }
      setLoadingSchemes(false)
    }).catch(() => {
      setLoadingSchemes(false)
    })
  }

  useEffect(() => {
    const unsubscribe = subscribeToConnectionStatus((online) => {
      setIsOnline(online)
      if (online) {
        // Reconnected - fetch fresh scheme data in the background
        fetchAllSchemes().then(({ schemes: remoteSchemes, fromCache }) => {
          if (remoteSchemes && remoteSchemes.length > 0) {
            setSchemes(remoteSchemes)
            setUsingCachedSchemes(fromCache)
          }
        }).catch(() => {})
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (messages.length <= 1) return

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === 'assistant') {
      // Scroll to the user's prompt so they can read from where the message started
      if (userPromptRef.current) {
        userPromptRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (latestAssistantRef.current) {
        latestAssistantRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      // When user sends, scroll to show their message + typing indicator
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading])

  useEffect(() => {
    if (!showLangMenu) return
    function handleClickOutside() {
      setShowLangMenu(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showLangMenu])

  // If the person switches language before the conversation has really
  // started (still just showing the initial greeting), update that greeting
  // to match - so picking Hindi/Marathi/Tamil actually changes what's on
  // screen, not just the voice.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].role === 'assistant') {
        return [Welcome(voiceLang)]
      }
      return prev
    })
  }, [voiceLang])

  // If the user started the chat from a landing-page category card (or a
  // quick chip), fire off that opener as their first message as soon as
  // the chat is up and the scheme list has loaded.
  useEffect(() => {
    if (started && pendingOpener && !loadingSchemes) {
      const opener = pendingOpener
      setPendingOpener(null)
      handleSend(opener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, pendingOpener, loadingSchemes])

  async function handleSend(overrideText, fromVoice = false) {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (isListening) {
      listenControllerRef.current?.stop()
      setIsListening(false)
    }

    const textToSend = (overrideText ?? input).trim()
    if (!textToSend || loading) return

    lastSentTextRef.current = textToSend

    if (!isOnline) {
      setError("You're offline right now, so I can't think through scheme matches - that needs an internet connection. You can still browse the saved scheme list below. I'll be ready to chat again as soon as you're back online.")
      return
    }

    // Detect if citizen requested voice output or sent via mic
    const voiceTriggers = /बोल\s*(?:के|कर|के बताओ|कर बताओ|िए|ो)|सुनाओ|आवाज़|आवाज|audio|voice|speak|read\s*aloud/i
    const wantsVoice = fromVoice || voiceTriggers.test(textToSend)

    if (wantsVoice && !speakEnabled) {
      setSpeakEnabled(true)
    }

    const userMessage = { role: 'user', text: textToSend }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      try {
        stopSpeaking()
      } catch (e) {}
      setIsSpeaking(false)
      setCurrentlySpeakingIndex(null)

      const conversationText = newMessages.map((m) => m.text).join(' ')
      const systemInstruction = buildSystemInstruction(schemes, conversationText, voiceLang)
      const replyText = await askGemini(systemInstruction, newMessages)
      const updatedMessages = [...newMessages, { role: 'assistant', text: replyText }]
      setMessages(updatedMessages)
      if (speakEnabled || wantsVoice) {
        const assistantIdx = updatedMessages.length - 1
        setCurrentlySpeakingIndex(assistantIdx)
        speakText(replyText, voiceLang, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false)
            setCurrentlySpeakingIndex(null)
          },
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleClearChat() {
    setMessages([Welcome(voiceLang)])
    setError(null)
    setShowLinks(false)
    setIsMobileNavOpen(false)
    stopSpeaking()
    setIsSpeaking(false)
    setCurrentlySpeakingIndex(null)
  }

  function handleToggleSpeakMessage(text, index) {
    if (isSpeaking && currentlySpeakingIndex === index) {
      try { stopSpeaking() } catch (e) {}
      setIsSpeaking(false)
      setCurrentlySpeakingIndex(null)
      return
    }
    try { stopSpeaking() } catch (e) {}
    setCurrentlySpeakingIndex(index)
    setIsSpeaking(true)
    speakText(text, voiceLang, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false)
        setCurrentlySpeakingIndex(null)
      },
    })
  }

  function handleSaveProfile() {
    saveProfile(profileForm)
    setProfile(profileForm)
    showToast('Profile saved')
    setShowProfile(false)
  }

  function handleClearProfile() {
    clearProfile()
    setProfile(null)
    setProfileForm({ name: '', age: '', occupation: '', location: '' })
    showToast('Profile cleared')
  }

  function handleUseProfileInChat() {
    const opener = profileToOpener(profile)
    setShowProfile(false)
    if (opener) handleSend(opener)
  }

  function handleChangeSetting(key, value) {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
    if (key === 'defaultVoiceLang') setVoiceLang(value)
  }

  function handleClearCache() {
    clearSchemesCache()
    showToast('Offline scheme cache cleared')
  }

  function handleClearSaved() {
    clearSavedSchemes()
    setSavedSchemeIds([])
    showToast('Saved schemes cleared')
  }

  function handleAskAboutScheme(scheme) {
    setShowBrowseSchemes(false)
    setViewingScheme(null)
    setIsMobileNavOpen(false)
    handleSend(`Tell me more about ${scheme.scheme_name} and whether I might be eligible.`)
  }

  function openSchemeDetail(scheme) {
    setShowBrowseSchemes(false)
    setShowSavedSchemes(false)
    setIsMobileNavOpen(false)
    setViewingScheme(scheme)
  }

  function handleToggleSaved(scheme) {
    const nowSaved = toggleSavedScheme(scheme.id)
    setSavedSchemeIds(getSavedSchemeIds())
    showToast(nowSaved ? 'Saved for later' : 'Removed from saved')
  }

  function handleMicClick() {
    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      listenControllerRef.current?.stop()
      setIsListening(false)
      const speechToSend = latestVoiceTextRef.current.trim() || input.trim()
      if (speechToSend) {
        handleSend(speechToSend, true)
      }
      return
    }

    try {
      stopSpeaking()
    } catch (e) {}
    setIsSpeaking(false)
    setCurrentlySpeakingIndex(null)
    setInput('')
    latestVoiceTextRef.current = ''
    setIsListening(true)
    setError(null)

    listenControllerRef.current = startListening({
      lang: voiceLang,
      onResult: (transcript, isFinal) => {
        latestVoiceTextRef.current = transcript
        setInput(transcript)

        // Clear pending silence timer whenever new speech or word chunk arrives
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current)
        }

        // Fast auto-send: 800ms after user pauses speaking, or 1200ms during interim
        if (transcript.trim()) {
          const delay = isFinal ? 800 : 1200
          silenceTimerRef.current = setTimeout(() => {
            listenControllerRef.current?.stop()
            setIsListening(false)
            const text = latestVoiceTextRef.current.trim()
            if (text) {
              latestVoiceTextRef.current = ''
              handleSend(text, true)
            }
          }, delay)
        }
      },
      onEnd: () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        setIsListening(false)
        const text = latestVoiceTextRef.current.trim()
        if (text) {
          latestVoiceTextRef.current = ''
          handleSend(text, true)
        }
      },
      onError: (err) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
        setIsListening(false)
        if (err !== 'no-speech' && err !== 'aborted') {
          setError(`Voice input error: ${err}`)
        }
      },
    })
  }

  useEffect(() => {
    return () => stopSpeaking()
  }, [])

  useEffect(() => {
    const isLarge = settings.textSize === 'large'
    document.documentElement.classList.toggle('ym-text-large', isLarge)
    document.body.classList.toggle('ym-text-large', isLarge)
  }, [settings.textSize])

  if (!started) {
    return (
      <>
        <LandingPage
          onStart={handleStart}
          onOpenScorecard={() => setShowScorecard(true)}
          onOpenRojgarRadar={() => setShowRojgarRadar(true)}
          onOpenDocVerification={() => setShowDocVerification(true)}
          onOpenGrievance={() => setShowGrievance(true)}
          onOpenAdmin={() => setShowAdminDashboard(true)}
        />
        {showScorecard && (
          <EligibilityScorecard
            defaultProfile={profile}
            onClose={() => setShowScorecard(false)}
            onSelectSchemeToApply={(scheme) => {
              setApplySchemeId(scheme.id)
              setStarted(true)
              setShowApplyForm(true)
            }}
          />
        )}
        {showRojgarRadar && (
          <RojgarScholarshipRadar
            onClose={() => setShowRojgarRadar(false)}
            onStartChat={(query) => {
              setShowRojgarRadar(false)
              handleStart(query)
            }}
          />
        )}
        {showDocVerification && (
          <DocumentVerification
            onClose={() => setShowDocVerification(false)}
            onStartChat={(query) => {
              setShowDocVerification(false)
              handleStart(query)
            }}
          />
        )}
        {showGrievance && (
          <GrievanceRedressal
            defaultProfile={profile}
            onClose={() => setShowGrievance(false)}
          />
        )}
        {showAdminDashboard && (
          <AdminDashboard
            onClose={() => setShowAdminDashboard(false)}
          />
        )}
      </>
    )
  }
    const filteredSchemes = schemes.filter((s) =>
    s.scheme_name.toLowerCase().includes(schemeSearch.toLowerCase())
  )
  const popularSchemes = schemes.slice(0, 5)
  const savedSchemesList = schemes.filter((s) => savedSchemeIds.includes(s.id))

  return (
    <div className={`ym-shell${settings.textSize === 'large' ? ' ym-text-large' : ''}`}>
      {isMobileNavOpen && <div className="ym-shell-scrim" onClick={() => setIsMobileNavOpen(false)} />}

      {/* Left sidebar: brand + primary navigation */}
      <aside className={`ym-shell-left${isMobileNavOpen ? ' ym-open' : ''}`} style={styles.sidebarLeft}>
        <div style={styles.sidebarBrand}>
          <Logo size={36} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={styles.sidebarBrandTitle}>Jan Seva (जन सेवा)</div>
            <div style={styles.sidebarBrandSub}>AI Citizen Governance</div>
          </div>
          <button className="ym-mobile-close-btn" style={styles.mobileCloseBtn} onClick={() => setIsMobileNavOpen(false)} aria-label="Close menu">
            <CloseIcon size={16} color="#0f172a" />
          </button>
        </div>

        <button className="ym-nav-item ym-nav-primary" onClick={handleClearChat} style={{ margin: '2px 0 4px' }}>
          <PlusChatIcon size={15} color="#ffffff" /> New Chat
        </button>

        <div style={styles.sidebarSectionLabel}>Browse</div>
        <button className="ym-nav-item" onClick={() => { setShowBrowseSchemes(true); setIsMobileNavOpen(false) }}>
          <GridIcon size={15} color="#059669" /> Schemes
        </button>
        <button className="ym-nav-item" onClick={() => { setShowScorecard(true); setIsMobileNavOpen(false) }}>
          <CalculatorIcon size={15} color="#059669" /> Eligibility Scorecard
        </button>
        <button className="ym-nav-item" onClick={() => { setShowRojgarRadar(true); setIsMobileNavOpen(false) }}>
          <BriefcaseJobIcon size={15} color="#d97706" /> Rojgar & Scholarships
        </button>
        <button className="ym-nav-item" onClick={() => { setShowGrievance(true); setIsMobileNavOpen(false) }}>
          <ShieldAlertIcon size={15} color="#e11d48" /> CM Helpline 181
        </button>
        <button className="ym-nav-item" onClick={() => { setShowApplyForm(true); setIsMobileNavOpen(false) }}>
          <DocumentIcon size={15} color="#0284c7" /> Applications & Forms
        </button>
        <button className="ym-nav-item" onClick={() => { setShowDocVerification(true); setIsMobileNavOpen(false) }}>
          <SearchIcon size={15} color="#0284c7" /> Verify Documents (OCR)
        </button>
        <button className="ym-nav-item" onClick={() => { setShowSavedSchemes(true); setIsMobileNavOpen(false) }}>
          <BookmarkIcon size={15} color="#f59e0b" /> Saved Schemes
        </button>

        <div style={styles.sidebarSectionLabel}>Governance & Account</div>
        <button className="ym-nav-item" onClick={() => { setShowAdminDashboard(true); setIsMobileNavOpen(false) }}>
          <BarChartIcon size={15} color="#7c3aed" /> GovTech Portal
        </button>
        <button className="ym-nav-item" onClick={() => { setProfileForm(profile || { name: '', age: '', occupation: '', location: '' }); setShowProfile(true); setIsMobileNavOpen(false) }}>
          <UserCircleIcon size={15} color="#059669" /> Citizen Profile
        </button>
        <button className="ym-nav-item" onClick={() => { setShowSettings(true); setIsMobileNavOpen(false) }}>
          <SettingsGearIcon size={15} color="#475569" /> Settings
        </button>
        <button className="ym-nav-item" onClick={() => { setShowLinks((s) => !s); setIsMobileNavOpen(false) }}>
          <GlobeIcon size={15} color="#0284c7" /> Official Portals
        </button>

        <div style={styles.sidebarHelp}>
          <div style={styles.sidebarHelpRow}>
            <div style={styles.sidebarHelpAvatar}><Logo size={24} /></div>
            <div>
              <div style={styles.sidebarHelpTitle}>Voice Assistant</div>
              <div style={styles.sidebarHelpText}>Speak in your mother tongue</div>
            </div>
          </div>
          {isVoiceInputSupported && (
            <button
              className={isListening ? 'ym-mic-btn ym-mic-active' : 'ym-nav-item'}
              style={styles.sidebarVoiceBtn}
              onClick={() => { handleMicClick(); setIsMobileNavOpen(false) }}
              disabled={loadingSchemes || !isOnline}
            >
              <MicIcon size={14} color={isListening ? 'white' : '#ffffff'} /> {isListening ? 'Listening...' : 'Try Voice'}
            </button>
          )}
        </div>
      </aside>

      {/* Main chat column */}
      <div style={styles.mainCol}>
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            <button className="ym-mobile-menu-btn" style={styles.mobileMenuBtn} onClick={() => setIsMobileNavOpen(true)} aria-label="Open menu">
              <MenuIcon size={19} color="#0f172a" />
            </button>
            <div>
              <h1 className="ym-title-text" style={styles.title}>Jan Seva (जन सेवा)</h1>
              <p className="ym-subtitle-text" style={styles.subtitle}>
                <span style={{ ...styles.statusDot, background: isOnline ? '#10b981' : '#f59e0b' }} />
                {isOnline ? t(voiceLang, 'online') : t(voiceLang, 'offline')}
              </p>
            </div>
          </div>
          <div style={styles.headerActions}>
            <button
              className="ym-icon-btn ym-header-desktop-only"
              onClick={() => setShowScorecard(true)}
              title="Citizen Eligibility Scorecard"
            >
              <CalculatorIcon size={14} color="#059669" /> Scorecard
            </button>
            <button
              className="ym-icon-btn ym-header-desktop-only"
              onClick={() => setShowGrievance(true)}
              title="CM Helpline 181 Grievance"
            >
              <ShieldAlertIcon size={14} color="#e11d48" /> 181 Helpline
            </button>
            <button
              className="ym-icon-btn ym-header-desktop-only"
              onClick={() => setShowAdminDashboard(true)}
              title="GovTech Intelligence & Admin Portal"
            >
              <BarChartIcon size={14} color="#7c3aed" /> GovTech
            </button>
            {isVoiceInputSupported && (
              <div style={styles.langMenuWrap} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className="ym-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowLangMenu((s) => !s)
                  }}
                  title="Voice input/output language"
                >
                  <GlobeIcon size={14} color="#0284c7" /> {VOICE_LANGUAGES.find((l) => l.code === voiceLang)?.label}
                </button>
                {showLangMenu && (
                  <div style={styles.langMenuDropdown}>
                    {VOICE_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        style={{
                          ...styles.langMenuItem,
                          ...(l.code === voiceLang ? styles.langMenuItemActive : {}),
                        }}
                        onClick={() => { setVoiceLang(l.code); setShowLangMenu(false) }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isVoiceOutputSupported && (
              <button
                className="ym-icon-btn"
                onClick={() => {
                  if (speakEnabled) {
                    stopSpeaking()
                    setIsSpeaking(false)
                    setCurrentlySpeakingIndex(null)
                  }
                  setSpeakEnabled((s) => !s)
                }}
                title="Read replies aloud"
              >
                {speakEnabled ? <SpeakerOnIcon size={15} color="#059669" /> : <SpeakerOffIcon size={15} color="#64748b" />}
                {speakEnabled ? ' On' : ' Off'}
              </button>
            )}
          </div>
        </header>

        {!isOnline && (
          <div style={styles.offlineBanner}>
            You're offline — chat needs internet to think through scheme matches. Browse the saved scheme list below, or reconnect to keep chatting.
            {usingCachedSchemes && ` (Showing scheme data saved from your last connection.)`}
          </div>
        )}

        {showLinks && (
          <div style={styles.linksBar}>
            {QUICK_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ym-link-pill"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div style={styles.chatArea}>
          {loadingSchemes ? (
            <p style={styles.systemNote}>Loading scheme database...</p>
          ) : (
            messages.map((msg, i) => {
              const isSecondLast = i === messages.length - 2
              const isLast = i === messages.length - 1
              return (
                <div
                  key={i}
                  ref={isSecondLast ? userPromptRef : isLast && msg.role === 'assistant' ? latestAssistantRef : null}
                  className="ym-bubble"
                  style={{
                    ...styles.bubble,
                    ...(msg.role === 'user' ? styles.userBubble : styles.assistantBubble),
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <div>
                      <MessageContent text={msg.text} />
                      <div style={styles.bubbleActionRow}>
                        <button
                          type="button"
                          style={{
                            ...styles.bubbleVoiceBtn,
                            ...(currentlySpeakingIndex === i ? styles.bubbleVoiceBtnActive : {}),
                          }}
                          onClick={() => handleToggleSpeakMessage(msg.text, i)}
                          title="Listen to this message"
                        >
                          {currentlySpeakingIndex === i ? (
                            <>
                              <StopIcon size={12} color="#ffffff" />
                              <span>रोकें (Stop Audio)</span>
                            </>
                          ) : (
                            <>
                              <SpeakerOnIcon size={13} color="#059669" />
                              <span>सुनें (Listen)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              )
            })
          )}
          {loading && (
            <div style={{ ...styles.bubble, ...styles.assistantBubble }} className="ym-bubble">
              <span className="ym-typing">
                <span></span><span></span><span></span>
              </span>
            </div>
          )}
          {error && (
            <div style={styles.errorNote}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span>⚠️ {error}</span>
                {lastSentTextRef.current && (
                  <button
                    type="button"
                    style={{
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleSend(lastSentTextRef.current)}
                  >
                    पुनः प्रयास करें (Retry)
                  </button>
                )}
              </div>
            </div>
          )}
          {!isOnline && schemes.length > 0 && (
            <div style={styles.offlineSchemeList}>
              <p style={styles.offlineListTitle}>Saved schemes you can browse offline — tap one for eligibility & how to apply:</p>
              {schemes.map((s) => (
                <button key={s.id} className="ym-scheme-row" style={styles.offlineSchemeItem} onClick={() => openSchemeDetail(s)}>
                  <span style={{ display: 'block' }}>
                    <strong>{s.scheme_name}</strong>
                    <div style={styles.offlineSchemeCategory}>{s.category} · {s.level}</div>
                    <div>{s.description}</div>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputArea}>
          {isVoiceInputSupported && (
            <button
              className={isListening ? 'ym-mic-btn ym-mic-active' : 'ym-mic-btn'}
              onClick={handleMicClick}
              disabled={loadingSchemes || !isOnline}
              title={isListening ? 'Stop listening' : 'Speak your message'}
              type="button"
            >
              {isListening ? <StopIcon size={17} color="white" /> : <MicIcon size={18} />}
            </button>
          )}
          <textarea
            className="ym-chat-input"
            style={styles.textInput}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={!isOnline ? t(voiceLang, 'placeholderOffline') : isListening ? t(voiceLang, 'placeholderListening') : t(voiceLang, 'placeholderIdle')}
            rows={2}
            disabled={loadingSchemes || !isOnline}
          />
          <button
            className="ym-send-btn"
            style={styles.sendButton}
            onClick={() => handleSend()}
            disabled={loading || loadingSchemes || !input.trim() || !isOnline}
            aria-label="Send"
          >
            <SendIcon size={16} color="var(--color-cream)" />
          </button>
        </div>
      </div>

      {/* Right sidebar: popular schemes drawn from live data */}
      <aside className="ym-shell-right" style={styles.sidebarRight}>
        <div style={styles.rightCard}>
          <div style={styles.rightCardHeader}>
            <span>Popular Schemes</span>
            <button style={styles.viewAllBtn} onClick={() => setShowBrowseSchemes(true)}>View All</button>
          </div>
          {loadingSchemes ? (
            <p style={styles.systemNote}>Loading...</p>
          ) : popularSchemes.length === 0 ? (
            <p style={{ fontSize: '12.5px', color: 'var(--color-charcoal-soft)' }}>No schemes loaded yet.</p>
          ) : (
            popularSchemes.map((s) => (
              <button key={s.id} className="ym-scheme-row" onClick={() => openSchemeDetail(s)}>
                <span style={styles.schemeRowDot} />
                <span>
                  <span style={styles.schemeRowName}>{s.scheme_name}</span>
                  <span style={styles.schemeRowCategory}>{s.category}</span>
                </span>
              </button>
            ))
          )}
        </div>
        <div style={styles.promoCard}>
          <strong style={{ fontSize: '13.5px' }}>Jan Seva · Sovereign AI</strong>
          <p style={{ fontSize: '12px', margin: '6px 0 0', opacity: 0.9 }}>AI-Powered Governance for Every Citizen</p>
        </div>
      </aside>

      {showApplyForm && (
        <ApplicationForm
          schemes={schemes}
          initialSchemeId={applySchemeId}
          onClose={() => { setShowApplyForm(false); setApplySchemeId(null) }}
          onRetryLoadSchemes={retryLoadSchemes}
        />
      )}

      {showScorecard && (
        <EligibilityScorecard
          defaultProfile={profile}
          onClose={() => setShowScorecard(false)}
          onSelectSchemeToApply={(scheme) => {
            setApplySchemeId(scheme.id)
            setShowApplyForm(true)
          }}
        />
      )}

      {showRojgarRadar && (
        <RojgarScholarshipRadar
          onClose={() => setShowRojgarRadar(false)}
          onStartChat={(query) => {
            setShowRojgarRadar(false)
            handleSend(query)
          }}
        />
      )}

      {showDocVerification && (
        <DocumentVerification
          onClose={() => setShowDocVerification(false)}
          onStartChat={(query) => {
            setShowDocVerification(false)
            handleSend(query)
          }}
        />
      )}

      {showGrievance && (
        <GrievanceRedressal
          defaultProfile={profile}
          onClose={() => setShowGrievance(false)}
        />
      )}

      {showAdminDashboard && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
        />
      )}

      {showBrowseSchemes && (
        <div style={styles.overlay} onClick={() => setShowBrowseSchemes(false)}>
          <div style={styles.browseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>All Schemes</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowBrowseSchemes(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.browseSearchRow}>
              <SearchIcon size={15} color="var(--color-charcoal-soft)" />
              <input
                style={styles.browseSearchInput}
                placeholder="Search schemes..."
                value={schemeSearch}
                onChange={(e) => setSchemeSearch(e.target.value)}
              />
            </div>
            <div style={styles.browseList}>
              {filteredSchemes.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)', padding: '12px 0' }}>
                  {schemes.length === 0 ? 'Scheme list is still loading or unavailable.' : 'No schemes match your search.'}
                </p>
              ) : (
                filteredSchemes.map((s) => (
                  <button key={s.id} className="ym-scheme-row" style={styles.browseRow} onClick={() => openSchemeDetail(s)}>
                    <span style={styles.schemeRowDot} />
                    <span>
                      <span style={styles.schemeRowName}>{s.scheme_name}</span>
                      <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                      {s.benefits && <span style={styles.browseRowBenefit}>{s.benefits}</span>}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showSavedSchemes && (
        <div style={styles.overlay} onClick={() => setShowSavedSchemes(false)}>
          <div style={styles.browseModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Saved Schemes</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowSavedSchemes(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.browseList}>
              {savedSchemesList.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal-soft)', padding: '12px 0' }}>
                  Nothing saved yet — open any scheme and tap "Save" to keep it here for later, even offline.
                </p>
              ) : (
                savedSchemesList.map((s) => (
                  <button key={s.id} className="ym-scheme-row" style={styles.browseRow} onClick={() => openSchemeDetail(s)}>
                    <span style={styles.schemeRowDot} />
                    <span>
                      <span style={styles.schemeRowName}>{s.scheme_name}</span>
                      <span style={styles.schemeRowCategory}>{s.category} · {s.level}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {viewingScheme && (
        <div style={styles.overlay} onClick={() => setViewingScheme(null)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>{viewingScheme.scheme_name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  style={styles.saveIconBtn}
                  onClick={() => handleToggleSaved(viewingScheme)}
                  title={savedSchemeIds.includes(viewingScheme.id) ? 'Remove from saved' : 'Save for later'}
                >
                  <BookmarkIcon size={18} color="var(--color-forest)" filled={savedSchemeIds.includes(viewingScheme.id)} />
                </button>
                <button style={styles.browseCloseBtn} onClick={() => setViewingScheme(null)}>
                  <CloseIcon size={17} />
                </button>
              </div>
            </div>
            <div style={styles.detailBody}>
              {!isOnline && (
                <div style={styles.detailOfflineNote}>
                  Showing details saved on your device. Reconnect to ask Jan Seva follow-up questions in chat.
                </div>
              )}
              <div style={styles.detailMeta}>
                {viewingScheme.category} · {viewingScheme.level}
                {viewingScheme.scheme_name_hindi ? ` · ${viewingScheme.scheme_name_hindi}` : ''}
              </div>

              {viewingScheme.description && (
                <p style={styles.detailParagraph}>{viewingScheme.description}</p>
              )}

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Benefits</div>
                <FormattedField value={viewingScheme.benefits} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Who's eligible</div>
                <FormattedField value={viewingScheme.eligibility_criteria} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Documents needed</div>
                <FormattedField value={viewingScheme.documents_required} />
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>How to apply</div>
                <FormattedField value={viewingScheme.how_to_apply} />
              </div>
            </div>
            {isOnline && (
              <button className="ym-cta" style={styles.detailAskBtn} onClick={() => handleAskAboutScheme(viewingScheme)}>
                Ask Jan Seva about this in chat
              </button>
            )}
          </div>
        </div>
      )}

      {showProfile && (
        <div style={styles.overlay} onClick={() => setShowProfile(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Profile</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowProfile(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.detailBody}>
              <p style={{ fontSize: '12.5px', color: 'var(--color-charcoal-soft)', margin: '0 0 14px', lineHeight: 1.5 }}>
                Saved only on this device. Fill this in once and reuse it to skip the intro questions in chat.
              </p>
              <label style={styles.formLabel}>
                Name
                <input
                  style={styles.formInput}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="e.g. Radha Devi"
                />
              </label>
              <label style={styles.formLabel}>
                Age
                <input
                  style={styles.formInput}
                  value={profileForm.age}
                  onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                  placeholder="e.g. 45"
                  inputMode="numeric"
                />
              </label>
              <label style={styles.formLabel}>
                Occupation
                <select
                  style={styles.formInput}
                  value={profileForm.occupation}
                  onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option>Farmer</option>
                  <option>Student</option>
                  <option>Homemaker</option>
                  <option>Business owner</option>
                  <option>Daily wage worker</option>
                  <option>Unemployed</option>
                  <option>Senior citizen</option>
                  <option>Other</option>
                </select>
              </label>
              <label style={styles.formLabel}>
                Location (district/state)
                <input
                  style={styles.formInput}
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="e.g. Bhopal, Madhya Pradesh"
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              {profile && (
                <button style={styles.formSecondaryBtn} onClick={handleClearProfile}>Clear</button>
              )}
              <button className="ym-cta" style={{ ...styles.detailAskBtn, marginTop: 0 }} onClick={handleSaveProfile}>
                Save Profile
              </button>
            </div>
            {profile && isOnline && (
              <button style={styles.formLinkBtn} onClick={handleUseProfileInChat}>
                Use my profile in chat now
              </button>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div style={styles.overlay} onClick={() => setShowSettings(false)}>
          <div style={styles.detailModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.browseHeader}>
              <h2 style={styles.browseTitle}>Settings</h2>
              <button style={styles.browseCloseBtn} onClick={() => setShowSettings(false)}>
                <CloseIcon size={17} />
              </button>
            </div>
            <div style={styles.detailBody}>
              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Text size</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {['normal', 'large'].map((size) => (
                    <button
                      key={size}
                      style={{
                        ...styles.formToggleBtn,
                        ...(settings.textSize === size ? styles.formToggleBtnActive : {}),
                      }}
                      onClick={() => handleChangeSetting('textSize', size)}
                    >
                      {size === 'normal' ? 'Normal' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Default voice language</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {VOICE_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      style={{
                        ...styles.formToggleBtn,
                        ...(settings.defaultVoiceLang === l.code ? styles.formToggleBtnActive : {}),
                      }}
                      onClick={() => handleChangeSetting('defaultVoiceLang', l.code)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>Offline data</div>
                <p style={{ fontSize: '12.5px', color: 'var(--color-charcoal-soft)', margin: '4px 0 10px' }}>
                  {schemes.length > 0
                    ? `${schemes.length} schemes cached${getCacheAge() !== null ? ` · updated ${getCacheAge()} min ago` : ''}`
                    : 'No schemes cached yet'}
                  {' · '}{savedSchemeIds.length} saved
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button style={styles.formSecondaryBtn} onClick={handleClearCache}>Clear offline cache</button>
                  <button style={styles.formSecondaryBtn} onClick={handleClearSaved}>Clear saved schemes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ym-toast">{toast}</div>}

      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  sidebarLeft: {
    background: '#f0fdf4',
    borderRight: '1px solid #bbf7d0',
    color: '#0f172a',
    padding: '10px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    paddingBottom: '6px',
    borderBottom: '1px solid #dcfce7',
    position: 'relative',
  },
  sidebarBrandTitle: { fontSize: '14px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap' },
  sidebarBrandSub: { fontSize: '10px', color: '#059669', fontWeight: 700, marginTop: '1px', whiteSpace: 'nowrap' },
  mobileCloseBtn: {
    display: 'none', marginLeft: 'auto', background: '#dcfce7', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer',
  },
  sidebarSectionLabel: {
    fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800,
    color: '#047857', margin: '5px 6px 2px',
  },
  sidebarHelp: {
    marginTop: 'auto', background: '#ffffff', borderRadius: '10px',
    padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '6px',
    border: '1px solid #bbf7d0', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.06)',
  },
  sidebarHelpRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  sidebarHelpAvatar: { width: '24px', height: '24px', borderRadius: '6px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sidebarHelpTitle: { fontSize: '12px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 },
  sidebarHelpText: { fontSize: '10.5px', color: '#64748b', lineHeight: 1.2 },
  sidebarVoiceBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', borderRadius: '8px',
    padding: '6px 10px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#ffffff',
    fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', width: '100%',
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
  },
  mainCol: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
    background: '#f8fafc',
  },
  mobileMenuBtn: {
    display: 'none', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '7px', cursor: 'pointer', padding: '5px 7px', marginRight: '4px',
  },
  statusDot: { display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', marginRight: '4px' },
  header: {
    background: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(12px)',
    color: '#0f172a',
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    flexWrap: 'nowrap',
    borderBottom: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'visible',
    position: 'relative',
    zIndex: 100,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
    overflow: 'hidden',
  },
  title: { margin: 0, fontSize: '15.5px', fontFamily: 'var(--font-display)', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' },
  subtitle: { margin: 0, fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', fontWeight: 500, whiteSpace: 'nowrap' },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
    overflow: 'visible',
    position: 'relative',
  },
  langMenuWrap: {
    position: 'relative',
    zIndex: 110,
  },
  langMenuDropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    background: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 12px 36px rgba(15, 23, 42, 0.22)',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '140px',
    zIndex: 99999,
    border: '1.5px solid #cbd5e1',
  },
  langMenuItem: {
    textAlign: 'left', padding: '8px 10px', borderRadius: '7px', border: 'none',
    background: 'transparent', color: '#1e293b', fontSize: '13.5px',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  },
  langMenuItemActive: { background: '#ecfdf5', color: '#059669', fontWeight: 700 },
  sidebarRight: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', borderLeft: '1px solid #e2e8f0', background: '#f8fafc' },
  rightCard: { background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  rightCardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', fontWeight: 800,
    color: '#0f172a', marginBottom: '8px', padding: '2px 4px',
  },
  viewAllBtn: { background: 'transparent', border: 'none', color: '#059669', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  schemeRowDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#059669', marginTop: '6px', flexShrink: 0 },
  schemeRowName: { display: 'block', fontSize: '13px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35 },
  schemeRowCategory: { display: 'block', fontSize: '11px', color: '#64748b', textTransform: 'capitalize', marginTop: '2px' },
  promoCard: {
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff', borderRadius: '14px', padding: '16px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
  },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999,
    backdropFilter: 'blur(5px)',
  },
  browseModal: {
    background: 'var(--color-cream)', borderRadius: '16px', padding: '18px', maxWidth: '480px', width: '100%',
    maxHeight: '82vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)',
  },
  browseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  browseTitle: { margin: 0, fontSize: '18px', color: 'var(--color-forest)', fontWeight: 700 },
  browseCloseBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
    color: '#0f172a',
  },
  saveIconBtn: {
    background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center', padding: '4px',
  },
  detailModal: {
    background: 'var(--color-cream)', borderRadius: '16px', padding: '18px', maxWidth: '520px', width: '100%',
    maxHeight: '86vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)',
  },
  detailBody: { overflowY: 'auto', paddingRight: '4px' },
  detailOfflineNote: {
    background: '#f5e6c8', color: '#6b4d0f', fontSize: '12.5px', padding: '9px 12px',
    borderRadius: '10px', marginBottom: '12px', lineHeight: 1.45,
  },
  detailMeta: { fontSize: '12.5px', color: 'var(--color-charcoal-soft)', textTransform: 'capitalize', marginBottom: '8px' },
  detailParagraph: { fontSize: '13.5px', lineHeight: 1.55, margin: '0 0 14px' },
  detailSection: { marginBottom: '14px', fontSize: '13.5px', lineHeight: 1.5 },
  detailSectionTitle: { fontSize: '12.5px', fontWeight: 700, color: 'var(--color-forest)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '3px' },
  detailAskBtn: {
    marginTop: '10px', width: '100%', textAlign: 'center', padding: '12px', borderRadius: '12px',
    border: 'none', background: 'var(--color-forest)', color: 'var(--color-cream)', fontSize: '14px',
    fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  formLabel: {
    display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12.5px', fontWeight: 700,
    color: 'var(--color-forest)', marginBottom: '12px',
  },
  formInput: {
    fontFamily: 'inherit', fontSize: '14px', fontWeight: 400, color: 'var(--color-charcoal)',
    padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(20,83,45,0.2)', background: '#fff',
  },
  formSecondaryBtn: {
    padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(20,83,45,0.25)', background: 'transparent',
    color: 'var(--color-forest)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  formLinkBtn: {
    marginTop: '10px', width: '100%', textAlign: 'center', background: 'none', border: 'none',
    color: 'var(--color-marigold-dark)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  formToggleBtn: {
    padding: '8px 14px', borderRadius: '999px', border: '1px solid rgba(20,83,45,0.2)', background: '#fff',
    color: 'var(--color-charcoal)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
  },
  formToggleBtnActive: {
    background: 'var(--color-forest)', color: 'var(--color-cream)', borderColor: 'var(--color-forest)', fontWeight: 700,
  },
  browseSearchRow: {
    display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid rgba(20,83,45,0.2)',
    borderRadius: '10px', padding: '9px 12px', marginBottom: '10px',
  },
  browseSearchInput: { border: 'none', outline: 'none', flex: 1, fontSize: '13.5px', fontFamily: 'inherit', background: 'transparent' },
  browseList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' },
  browseRow: { alignItems: 'flex-start', background: '#fff', marginBottom: '4px', border: '1px solid rgba(20,83,45,0.08)' },
  browseRowBenefit: { display: 'block', fontSize: '11.5px', color: 'var(--color-charcoal-soft)', marginTop: '3px', lineHeight: 1.4 },
  linksBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '10px 18px',
    background: 'var(--color-sage)',
    borderBottom: '1px solid rgba(20,83,45,0.1)',
  },
  offlineBanner: {
    background: '#f5e6c8',
    color: '#6b4d0f',
    fontSize: '13px',
    padding: '10px 18px',
    lineHeight: 1.5,
    borderBottom: '1px solid rgba(107,77,15,0.15)',
  },
  offlineSchemeList: {
    marginTop: '8px',
    border: '1px solid rgba(20,83,45,0.15)',
    borderRadius: '12px',
    padding: '12px 14px',
    background: '#ffffff',
  },
  offlineListTitle: {
    margin: '0 0 8px',
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--color-forest)',
  },
  offlineSchemeItem: {
    display: 'block',
    width: '100%',
    padding: '8px 0',
    borderTop: '1px solid rgba(20,83,45,0.08)',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '13.5px',
    lineHeight: 1.45,
    color: 'inherit',
  },
  offlineSchemeCategory: {
    fontSize: '11.5px',
    color: 'var(--color-charcoal-soft)',
    textTransform: 'capitalize',
    margin: '2px 0 4px',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px clamp(8px, 2.5vw, 18px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minHeight: 0,
    WebkitOverflowScrolling: 'touch',
    touchAction: 'pan-y',
    overscrollBehaviorY: 'contain',
  },
  bubble: {
    padding: '11px 14px',
    borderRadius: '16px',
    maxWidth: '88%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: 1.5,
    fontSize: '14.5px',
  },
  userBubble: {
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff',
    alignSelf: 'flex-end',
    borderBottomRightRadius: '4px',
    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.2)',
  },
  assistantBubble: {
    background: '#ffffff',
    color: '#0f172a',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
  },
  bubbleActionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '10px',
    paddingTop: '6px',
    borderTop: '1px solid #f1f5f9',
    flexWrap: 'wrap',
  },
  bubbleVoiceBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '8px',
    border: '1px solid #a7f3d0',
    background: '#ecfdf5',
    color: '#047857',
    fontSize: '11.5px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s ease',
  },
  bubbleVoiceBtnActive: {
    background: '#dc2626',
    borderColor: '#ef4444',
    color: '#ffffff',
  },
  systemNote: {
    fontSize: '13px',
    color: 'var(--color-charcoal-soft)',
    textAlign: 'center',
    padding: '6px',
  },
  errorNote: {
    fontSize: '13px',
    color: '#b00020',
    textAlign: 'center',
    padding: '6px',
  },
  inputArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
    borderTop: '1px solid #e2e8f0',
    background: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
    flexShrink: 0,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    resize: 'none',
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: '#f8fafc',
    color: '#0f172a',
    outline: 'none',
    boxSizing: 'border-box',
    lineHeight: 1.4,
    height: '40px',
  },
  sendButton: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
  },
}
