/**
 * SINGLE SOURCE OF TRUTH FOR KTU 2024 ACTIVITY POINTS
 *
 * To edit the catalog:
 * 1. Add or change activities in this file.
 * 2. Keep every activity `code` unique and stable. Codes are used to update
 *    existing database rows without losing submitted certificates.
 * 3. Use a stable category `code` when adding a new category.
 * 4. Run `pnpm db:seed` after every change. Re-running the seed is safe.
 *
 * Point modes (use one per activity):
 * - levelPoints: { COLLEGE, ZONAL, STATE, NATIONAL, INTERNATIONAL }
 * - options: [{ label, points }]
 * - fixedPoints: 5
 * - hourlyRate: { rate: 1, unit: 'hour', maxHours?: 40 }
 *
 * `maxPointsCap` is the maximum total points a student can earn from this
 * activity across all approved submissions.
 */
import type { ActivityGroup, ActivityPointsConfig, PointOption } from './types'

export interface ActivityOption extends PointOption {
  id?: string
  description?: string
}

export interface ActivityDefinition extends ActivityPointsConfig {
  code: string // e.g. "1.1", "1.5", "2.24"
  title: string
  evidenceRequired: string
  remarks?: string
}

export interface CategoryDefinition {
  code: string
  group: ActivityGroup
  title: string
  maxPointsCap: number
  activities: ActivityDefinition[]
}

export const KTU_2024_HANDBOOK_CATEGORIES: CategoryDefinition[] = [
  // ==========================================
  // GROUP I: Sports, Arts & Cultural Activities, Community Outreach
  // ==========================================
  {
    group: 'GROUP_1',
    code: 'G1_SPORTS_ARTS',
    title: 'Sports, Arts & Cultural Activities',
    maxPointsCap: 40,
    activities: [
      {
        code: '1.1',
        title: 'Sports / Games / Arts (Participation)',
        evidenceRequired: 'Certificates issued by hosting college, University, Dean (Student Affairs), College Union Advisor, or recognized professional bodies.',
        levelPoints: { COLLEGE: 1, ZONAL: 5, STATE: 10, NATIONAL: 20, INTERNATIONAL: 40 },
        remarks: 'KTU Organized/Approved Events'
      },
      {
        code: '1.2',
        title: 'Sports / Games / Arts (Winners - 1st, 2nd, 3rd) Single Events',
        evidenceRequired: 'Certificates issued by hosting college/University/Dean.',
        levelPoints: { COLLEGE: 5, ZONAL: 10, STATE: 20, NATIONAL: 40, INTERNATIONAL: 40 }
      },
      {
        code: '1.3',
        title: 'Sports / Games / Arts (Winners - 1st, 2nd, 3rd) Group Events',
        evidenceRequired: 'Certificates issued by hosting college/University/Dean.',
        levelPoints: { COLLEGE: 3, ZONAL: 5, STATE: 15, NATIONAL: 30, INTERNATIONAL: 40 }
      },
      {
        code: '1.4',
        title: 'Publication in College Magazine',
        evidenceRequired: 'Copy of publication or certification from Editorial Committee.',
        fixedPoints: 5,
        maxPointsCap: 20,
        remarks: 'Articles, essays, poems, technical notes, or creative writing in officially released College Magazine. Max 5 pts/magazine/year.'
      },
      {
        code: '1.5',
        title: 'Four-Wheeler Driving License',
        evidenceRequired: 'Copy of Driving License (DL) clearly showing issue date during programme duration.',
        fixedPoints: 5,
        maxPointsCap: 5,
        remarks: 'Must be obtained during original programme duration.'
      }
    ]
  },
  {
    group: 'GROUP_1',
    code: 'G1_COMMUNITY',
    title: 'Community Outreach & Social Initiatives',
    maxPointsCap: 40,
    activities: [
      {
        code: '1.6',
        title: 'Community Service & Allied Activities (Two Days)',
        evidenceRequired: 'Certificates issued by NSS Programme Officer, Faculty Coordinator, or Govt/NGO officials.',
        fixedPoints: 5,
        maxPointsCap: 10,
        remarks: 'Special volunteer service in pandemics, floods, droughts, epidemics, or relief operations (fund/material collection).'
      },
      {
        code: '1.7',
        title: 'Community Service & Allied Activities (Up to One Week)',
        evidenceRequired: 'Certificates issued by NSS Programme Officer, Faculty Coordinator, or Govt/NGO officials.',
        fixedPoints: 10,
        maxPointsCap: 10,
        remarks: 'Extended volunteer service in relief camps and natural disasters.'
      },
      {
        code: '1.8',
        title: 'Blood Donation',
        evidenceRequired: 'Certificate issued by Govt/Medical College/District Hospital Blood Bank or State Blood Transfusion Council licensed hospital.',
        fixedPoints: 5,
        maxPointsCap: 10,
        remarks: '5 Points per blood donation (Max 10 points).'
      },
      {
        code: '1.9',
        title: 'THRIVE Project (Tribal Higher Education & Interactive Venture)',
        evidenceRequired: 'Participation certificate issued by Government THRIVE project authority.',
        fixedPoints: 10,
        maxPointsCap: 20,
        remarks: 'Minimum 5 days participation in a semester (10 Points/Semester, Max 20 points).'
      },
      {
        code: '1.10',
        title: 'Tree Planting done by Students',
        evidenceRequired: 'Tree geo-tagging certificate issued by the University NSS Cell.',
        fixedPoints: 5,
        maxPointsCap: 5,
        remarks: 'Geo-tagged tree planting certificate from University NSS Cell.'
      }
    ]
  },
  {
    group: 'GROUP_1',
    code: 'G1_NSS_NCC',
    title: 'NSS & NCC Activities',
    maxPointsCap: 40,
    activities: [
      {
        code: '1.11',
        title: 'NSS Volunteer (2 Years Completion)',
        evidenceRequired: 'NSS Volunteership Certificate issued by the University NSS Cell.',
        fixedPoints: 30,
        remarks: 'Successfully completed 2 years of volunteership as per NSS Manual.'
      },
      {
        code: '1.12',
        title: 'University Level NSS Leadership Camps (100 Hours Camp)',
        evidenceRequired: 'Certificate issued by the University NSS Cell.',
        fixedPoints: 20
      },
      {
        code: '1.13',
        title: 'Winners in State Level NSS Festival / State NSS Meet / Competitions',
        evidenceRequired: 'Certificate issued by University/State NSS Cell/NCC Directorate.',
        fixedPoints: 15,
        remarks: 'First or Second place in State level NSS competitions.'
      },
      {
        code: '1.14',
        title: 'Special Service Certificate / Appreciation (NSS / NCC)',
        evidenceRequired: 'Certificate issued by State Government, State NSS Cell, or NCC Directorate.',
        fixedPoints: 15,
        remarks: 'For exceptional NSS/NCC activities.'
      },
      {
        code: '1.15',
        title: 'Recipient of State / National Level NSS/NCC Awards',
        evidenceRequired: 'Official Award certificate from State Government or Central Ministry.',
        options: [
          { label: 'State Level Award', points: 15 },
          { label: 'National Level Award', points: 25 }
        ]
      },
      {
        code: '1.16',
        title: 'Attending Approved National Camps / NIC / NYF / Pre-RDC',
        evidenceRequired: 'Camp completion certificate issued by University/State NSS Cell/NCC Directorate.',
        fixedPoints: 15
      },
      {
        code: '1.17',
        title: 'Ten Days (50 Hours) Volunteer Service in State Special Projects',
        evidenceRequired: 'Certificate issued by State Government / State NSS / NCC Directorate.',
        fixedPoints: 15
      },
      {
        code: '1.18',
        title: 'Participation in Republic Day (RDC) / Independence Day (IDC) / International Events',
        evidenceRequired: 'Official RDC/IDC/International participation certificate approved by State NSS Cell / NCC Directorate.',
        fixedPoints: 25
      },
      {
        code: '1.19',
        title: 'NCC Certificates & Training',
        evidenceRequired: 'Certificate issued by University / NCC Directorate.',
        options: [
          { label: 'NCC "C" Certificate', points: 30 },
          { label: 'NCC "B" Certificate', points: 20 },
          { label: 'One Year NCC + Minimum Parade Attendance', points: 10 }
        ]
      }
    ]
  },
  {
    group: 'GROUP_1',
    code: 'G1_HEALTH_SAFETY',
    title: 'Health, Safety & Essential Life Skills',
    maxPointsCap: 40,
    activities: [
      {
        code: '1.20',
        title: 'Emergency Response, First Aid, CPR & Fire Safety Training',
        evidenceRequired: 'Certificate issued by Govt Org, Fire & Rescue Services, approved training agencies, or registered hospitals.',
        fixedPoints: 5,
        maxPointsCap: 10,
        remarks: 'Minimum half-day certified training (5 pts/programme, Max 10 pts).'
      },
      {
        code: '1.21',
        title: 'Certified Basic Swimming Proficiency',
        evidenceRequired: 'Certificate issued by Panchayat/Municipality instructor, Kerala State Sports Council coach, registered academy, or College Physical Education Dept test.',
        fixedPoints: 5,
        maxPointsCap: 5
      }
    ]
  },

  // ==========================================
  // GROUP II: Technical Events, Tech-Fests, Presentations, Leadership, FOSS, Standardized Tests
  // ==========================================
  {
    group: 'GROUP_2',
    code: 'G2_TECH_EVENTS',
    title: 'Technical Events, Competitions & Academic Presentations',
    maxPointsCap: 40,
    activities: [
      {
        code: '2.1',
        title: 'Tech-Fest (Participation - KTU Organized/Approved)',
        evidenceRequired: 'Certificate issued by Organizing Institution / Staff-in-Charge / College Union Advisor.',
        levelPoints: { COLLEGE: 2, ZONAL: 5, STATE: 10, NATIONAL: 20, INTERNATIONAL: 30 }
      },
      {
        code: '2.2',
        title: 'Tech-Fest (Winners - KTU Organized/Approved)',
        evidenceRequired: 'Certificate issued by Organizing Institution / Staff-in-Charge.',
        levelPoints: { COLLEGE: 5, ZONAL: 10, STATE: 20, NATIONAL: 40, INTERNATIONAL: 40 }
      },
      {
        code: '2.3',
        title: 'Technical Competitions Organized by Professional Societies (IEEE, IET, ASME, SAE, etc.) - Participation',
        evidenceRequired: 'Certificate issued by Professional Society Chapter / Organizing Institution.',
        levelPoints: { COLLEGE: 2, ZONAL: 5, STATE: 10, NATIONAL: 15, INTERNATIONAL: 20 }
      },
      {
        code: '2.4',
        title: 'Technical Competitions Organized by Professional Societies (IEEE, IET, ASME, SAE, etc.) - Winners (1, 2, 3)',
        evidenceRequired: 'Winner certificate issued by Professional Society Chapter.',
        levelPoints: { COLLEGE: 3, ZONAL: 7, STATE: 15, NATIONAL: 25, INTERNATIONAL: 35 }
      },
      {
        code: '2.5',
        title: 'Attending Full-Time Conferences, Seminars, Workshops, STTPs (IITs, NITs, NIRF Top 100)',
        evidenceRequired: 'Participation certificate issued by IIT/NIT/IIIT/Central Univ/NIRF Top 100 institution.',
        fixedPoints: 5,
        maxPointsCap: 15,
        remarks: '5 Points/Event (Max 15 points). Excludes fest activities.'
      },
      {
        code: '2.6',
        title: 'Poster Presentation - Participation (KTU / IITs / NITs / NIRF Top 100)',
        evidenceRequired: 'Certificate of presentation from organizing premier institution.',
        fixedPoints: 5,
        remarks: '5 Points/Event.'
      },
      {
        code: '2.7',
        title: 'Paper Presentation - Participation (KTU / IITs / NITs / NIRF Top 100)',
        evidenceRequired: 'Certificate of presentation from organizing premier institution.',
        fixedPoints: 10,
        remarks: '10 Points/Event.'
      },
      {
        code: '2.8',
        title: 'Paper Presentation - Winners (KTU / IITs / NITs / NIRF Top 100)',
        evidenceRequired: 'Prize certificate from organizing premier institution.',
        options: [
          { label: 'First Prize Winner', points: 20 },
          { label: 'Second or Third Prize Winner', points: 15 }
        ]
      },
      {
        code: '2.9',
        title: 'Paper Presentation - Participation (KTU Affiliated Institutions)',
        evidenceRequired: 'Presentation certificate from KTU affiliated college.',
        fixedPoints: 5
      },
      {
        code: '2.10',
        title: 'Paper Presentation - Winners (KTU Affiliated Institutions)',
        evidenceRequired: 'Winner certificate from KTU affiliated college.',
        options: [
          { label: 'First Prize Winner', points: 10 },
          { label: 'Second or Third Prize Winner', points: 7 }
        ]
      }
    ]
  },
  {
    group: 'GROUP_2',
    code: 'G2_LEADERSHIP',
    title: 'Leadership & Student Management Roles',
    maxPointsCap: 40,
    activities: [
      {
        code: '2.11',
        title: 'Student Professional Society Membership & Leadership (IEEE, ACM, SAE, ASME, etc. >= 2 Years)',
        evidenceRequired: 'Membership card and appointment/service certificate from Chapter Advisor.',
        options: [
          { label: 'Student Secretary / Chapter Lead / Chair', points: 15 },
          { label: 'Executive Committee Member', points: 10 },
          { label: 'Student Coordinator for an Event', points: 5 },
          { label: 'Active Member (>= 2 Academic Years)', points: 5 }
        ],
        maxPointsCap: 15
      },
      {
        code: '2.12',
        title: 'College & University Union Leadership',
        evidenceRequired: 'Official notification / certificate from College Union Advisor or University.',
        options: [
          { label: 'University Union Office Bearer', points: 30 },
          { label: 'University Union Member (Excluding Office Bearer)', points: 25 },
          { label: 'College Union Office Bearer', points: 20 },
          { label: 'College Union Executive Committee Member', points: 15 }
        ],
        maxPointsCap: 30
      },
      {
        code: '2.13',
        title: 'Department Student Association Leadership',
        evidenceRequired: 'Certificate issued by Head of Department (HoD).',
        options: [
          { label: 'Executive Committee Member / Office Bearer (per year)', points: 5 },
          { label: 'Student Coordinator for an Event', points: 5 }
        ],
        maxPointsCap: 10
      },
      {
        code: '2.14',
        title: 'Class Representative',
        evidenceRequired: 'Certificate from Senior Faculty Advisor (SFA).',
        fixedPoints: 5,
        maxPointsCap: 10,
        remarks: '5 Points per academic year (Max 10 points, 1 representative per class).'
      },
      {
        code: '2.15',
        title: 'Industrial Visit (IV) Student Coordinator (Minimum 6 Days)',
        evidenceRequired: 'Certificate from Faculty Coordinator / HoD.',
        fixedPoints: 5,
        maxPointsCap: 5,
        remarks: 'Maximum 2 Coordinators per class.'
      },
      {
        code: '2.16',
        title: 'Placement Cell Student Coordinator / Committee (>= 1 Academic Year)',
        evidenceRequired: 'Certificate issued by Staff-in-Charge of CGPU.',
        options: [
          { label: 'Coordinator / Convenor (Max 2 per class)', points: 10 },
          { label: 'Executive Committee Member (1 per class)', points: 5 }
        ],
        maxPointsCap: 10
      },
      {
        code: '2.17',
        title: 'IEDC Student Cell Leadership (>= 1 Academic Year)',
        evidenceRequired: 'Certificate issued by Staff-in-Charge of IEDC.',
        options: [
          { label: 'Executive Committee Member / Office Bearer (per year)', points: 5 },
          { label: 'Student Coordinator for an Event', points: 5 }
        ],
        maxPointsCap: 10
      },
      {
        code: '2.18',
        title: 'Young Innovators Programme (YIP, K-DISC) Student Coordinator',
        evidenceRequired: 'Certificate issued by K-DISC or authorized YIP officials.',
        fixedPoints: 5,
        maxPointsCap: 10
      },
      {
        code: '2.19',
        title: 'STRIDE (K-DISC) Roles & High-Impact Projects',
        evidenceRequired: 'Certificate issued by K-DISC or authorized STRIDE officials.',
        options: [
          { label: 'High Impact Project Team L5 Leader', points: 20 },
          { label: 'High Impact Project Team L2 Leader', points: 15 },
          { label: 'Campus Leadership Team / STRIDE Core Member', points: 10 },
          { label: 'High Impact Project Team L1 Member', points: 10 },
          { label: 'STRIDE Membership / Certified 1-Year Volunteer', points: 5 }
        ],
        maxPointsCap: 20
      },
      {
        code: '2.20',
        title: 'College Magazine Editorial Board Member',
        evidenceRequired: 'Certificate from Staff-in-charge of Editorial Committee or Union Advisor.',
        fixedPoints: 5,
        maxPointsCap: 10,
        remarks: 'For members other than Editor (Max 8 students/year, Max 10 pts).'
      },
      {
        code: '2.21',
        title: 'Hobby Clubs Executive Committee / Convenor (Photography, Music, Dance, Coding, Nature, etc.)',
        evidenceRequired: 'Certificate from Faculty In-Charge of the club and Union Advisor.',
        fixedPoints: 5,
        maxPointsCap: 10,
        remarks: '5 Points per academic year.'
      }
    ]
  },
  {
    group: 'GROUP_2',
    code: 'G2_FOSS',
    title: 'FOSS Activities & Open-Source Contributions',
    maxPointsCap: 40,
    activities: [
      {
        code: '2.22',
        title: 'ICFOSS / FOSS Club Activities & Contributions',
        evidenceRequired: 'Certificate issued by ICFOSS, approved event organizers, or FOSS Club Faculty In-Charge.',
        options: [
          { label: 'GitHub/GitLab Open Source Contributions (validated by ICFOSS)', points: 10 },
          { label: 'FOSS Project Development / Internship at ICFOSS (>= 15 days)', points: 10 },
          { label: 'FOSS Club Student Lead / Coordinator / Ambassador', points: 10 },
          { label: 'ICFOSS Approved Workshops / Bootcamps (>= 2 days)', points: 5 },
          { label: 'ICFOSS Hackathons / FOSS Events Participation', points: 5 },
          { label: 'FOSS Club Member (participated in >= 2 activities)', points: 5 }
        ],
        maxPointsCap: 20
      }
    ]
  },
  {
    group: 'GROUP_2',
    code: 'G2_INTERNSHIPS_TESTS',
    title: 'Short-Term Internships & Standardized Tests',
    maxPointsCap: 40,
    activities: [
      {
        code: '2.23',
        title: 'Short-Term Internship / Clinical Exposure Training (>= 2 Weeks / 10 Working Days)',
        evidenceRequired: 'Certificate from organization/company/institution with dates.',
        fixedPoints: 10,
        maxPointsCap: 10
      },
      {
        code: '2.24',
        title: 'English Language Proficiency Standardized Tests (TOEFL, IELTS, PTE, BEC)',
        evidenceRequired: 'Official digital scorecard issued by ETS, British Council/IDP, Pearson, or Cambridge.',
        options: [
          { label: 'TOEFL iBT Score >= 105', points: 30 },
          { label: 'TOEFL iBT Score 95 - 104', points: 25 },
          { label: 'TOEFL iBT Score 80 - 94', points: 20 },
          { label: 'IELTS Academic Band >= 7.5', points: 30 },
          { label: 'IELTS Academic Band 7.0', points: 25 },
          { label: 'IELTS Academic Band 6.5', points: 20 },
          { label: 'PTE Academic Score >= 76', points: 30 },
          { label: 'PTE Academic Score 65 - 75', points: 25 },
          { label: 'PTE Academic Score 58 - 64', points: 20 },
          { label: 'Cambridge BEC Higher (C1 Level)', points: 25 },
          { label: 'Cambridge BEC Vantage (B2 Level)', points: 20 },
          { label: 'Cambridge BEC Preliminary (B1 Level)', points: 15 }
        ],
        maxPointsCap: 30
      },
      {
        code: '2.25',
        title: 'Aptitude Proficiency Certifications (GRE, GATE, CAT, GMAT)',
        evidenceRequired: 'Official scorecard with AIR/percentile and test date during programme duration.',
        options: [
          { label: 'GATE AIR within Top 5000', points: 30 },
          { label: 'GATE AIR 5001 - 15000', points: 25 },
          { label: 'Qualified GATE Scorecard (Valid Score)', points: 20 },
          { label: 'CAT Percentile >= 95', points: 30 },
          { label: 'CAT Percentile 90 - 94', points: 25 },
          { label: 'CAT Percentile 85 - 89', points: 20 },
          { label: 'GRE Score >= 320', points: 30 },
          { label: 'GRE Score 310 - 319', points: 25 },
          { label: 'GRE Score 300 - 309', points: 20 },
          { label: 'GMAT Score >= 700', points: 30 },
          { label: 'GMAT Score 650 - 699', points: 25 },
          { label: 'GMAT Score 600 - 649', points: 20 }
        ],
        maxPointsCap: 30
      }
    ]
  },

  // ==========================================
  // GROUP III: Industry Exposure, Internships, Startups, Patents, Hackathons, Skilling Courses
  // ==========================================
  {
    group: 'GROUP_3',
    code: 'G3_INDUSTRY',
    title: 'Industry Exposure, Academic Projects & Internships',
    maxPointsCap: 40,
    activities: [
      {
        code: '3.1',
        title: 'Industrial Visit / Industrial Training Report (S5 or S6, Min 4 Industries)',
        evidenceRequired: 'Certified report by accompanying faculty members and SFA confirming min 4 industry visits with photos.',
        fixedPoints: 5,
        maxPointsCap: 20
      },
      {
        code: '3.2',
        title: 'Best Mini Project / Best Project / Best Seminar (from each class >= 30 students)',
        evidenceRequired: 'Certificate from Project/Seminar Evaluation Committee, SFA, and approved by HoD.',
        fixedPoints: 5,
        remarks: '5 Points (Minimum class strength of 30 students required).'
      },
      {
        code: '3.3',
        title: 'Long-Term Internship (>= 3.5 Months as per KTU Guidelines)',
        evidenceRequired: 'Internship Completion Certificate specifying start & end dates (>= 3.5 months).',
        fixedPoints: 15
      },
      {
        code: '3.4',
        title: 'LEAP – IIT Madras Incubation Cell Skill Development Bootcamps',
        evidenceRequired: 'Official LEAP certificate issued by IIT Madras Incubation Cell or certified partners.',
        options: [
          { label: 'LEAP Project / Prototype Assigned by Mentor', points: 20 },
          { label: 'LEAP Course Completion (LP1XX / LP2XX / LP3XX)', points: 15 },
          { label: 'LEAP Bootcamp Completion (LPB01 & LPB02)', points: 10 }
        ],
        maxPointsCap: 30
      },
      {
        code: '3.5',
        title: 'YIP – Young Innovators Programme (K-DISC)',
        evidenceRequired: 'Certificates issued by K-DISC authorized officials.',
        options: [
          { label: 'State Level Winner', points: 35 },
          { label: 'District Level Winner / Finalist', points: 20 },
          { label: 'Preliminary Winner (Shortlisted for District)', points: 10 },
          { label: 'Idea Submitted & Accepted in YIP Portal', points: 5 }
        ],
        maxPointsCap: 35
      },
      {
        code: '3.6',
        title: 'STRIDE – Social Technology & Inclusive Design (K-DISC Innovation)',
        evidenceRequired: 'Certificates issued by K-DISC / STRIDE officials.',
        options: [
          { label: 'State Level Winner', points: 35 },
          { label: 'Top 30+ Teams (State Finalists, Phase 3)', points: 20 },
          { label: 'Top 100+ Teams (Selected to Phase 2)', points: 10 },
          { label: 'Idea Submitted & Phase 1 Completed', points: 5 }
        ],
        maxPointsCap: 35
      },
      {
        code: '3.7',
        title: 'GDC AI Workforce Internship Program',
        evidenceRequired: 'Certificates issued by AICTE, program executor, or NHM.',
        options: [
          { label: '6-Month Internship Completed (GDC Fellow)', points: 35 },
          { label: 'Fellowship Track Coursework Completed', points: 25 },
          { label: 'Learning Track Completed', points: 15 },
          { label: 'AI Grading Test Completed', points: 5 }
        ],
        maxPointsCap: 35
      },
      {
        code: '3.8',
        title: 'ICFOSS: Working FOSS-based Solution or Innovation Certified by ICFOSS',
        evidenceRequired: 'Certificate issued by ICFOSS.',
        fixedPoints: 25,
        maxPointsCap: 25
      }
    ]
  },
  {
    group: 'GROUP_3',
    code: 'G3_INNOVATION',
    title: 'Innovation, Entrepreneurship & Intellectual Property (IPR)',
    maxPointsCap: 40,
    activities: [
      {
        code: '3.9',
        title: 'Start-up Company (Legally Registered under MSME / DPIIT / ROC / KSUM)',
        evidenceRequired: 'Registration certificate and documentary evidence issued by competent authority.',
        fixedPoints: 30,
        maxPointsCap: 40
      },
      {
        code: '3.10',
        title: 'Patents (Filed, Published, Granted, Licensed)',
        evidenceRequired: 'Patent filing receipt / journal copy / grant certificate from IPO/WIPO.',
        options: [
          { label: 'Patent Licensed to Industry / User', points: 40 },
          { label: 'Patent Legally Granted / Approved', points: 40 },
          { label: 'Patent Published in Patent Journal', points: 30 },
          { label: 'Patent Application Filed with IPO / WIPO', points: 20 }
        ],
        maxPointsCap: 40
      },
      {
        code: '3.11',
        title: 'Prototype Development & Testing / Industry Adopted Technologies',
        evidenceRequired: 'Prototype validation certificate from Innovation Cell / Govt agency OR Official adoption letter/MoU from industry.',
        options: [
          { label: 'Innovative Technology Formally Adopted by Industry (MoU/Letter)', points: 40 },
          { label: 'Functional Working Prototype Validated by Innovation Cell / Govt Agency', points: 40 }
        ],
        maxPointsCap: 40
      },
      {
        code: '3.12',
        title: 'Venture Capital / Angel Investment Funding',
        evidenceRequired: 'Funding agreement, sanction letter, or investment confirmation from angel investor / funding body.',
        fixedPoints: 40,
        maxPointsCap: 40
      },
      {
        code: '3.13',
        title: 'Societal Innovations (Addressing Community Needs with Measured Impact)',
        evidenceRequired: 'Validation letter from IEDC / Local Body / Govt Dept / NGO confirming implementation and measurable impact.',
        fixedPoints: 40,
        maxPointsCap: 40
      },
      {
        code: '3.14',
        title: 'Research Publications in Reputed Journals (SCI / SCIE / Scopus)',
        evidenceRequired: 'Published paper copy or acceptance letter from Editor / Editorial Office.',
        options: [
          { label: 'SCI / SCIE / Scopus Q1–Q2 Journal Publication', points: 40 },
          { label: 'SCI / SCIE / Scopus Q3–Q4 Journal Publication', points: 25 }
        ],
        maxPointsCap: 40
      }
    ]
  },
  {
    group: 'GROUP_3',
    code: 'G3_HACKATHONS_SKILLING',
    title: 'Hackathons & Approved Skilling Courses',
    maxPointsCap: 40,
    activities: [
      {
        code: '3.15',
        title: 'National Level Hackathons (SIH, KAVACH, MoE, MHA, AICTE, Central Govt Missions)',
        evidenceRequired: 'Prize certificate issued by National Hackathon Organizing Authority.',
        options: [
          { label: '1st Prize Winner', points: 40 },
          { label: '2nd Prize Winner', points: 35 },
          { label: '3rd Prize Winner', points: 30 }
        ],
        maxPointsCap: 40
      },
      {
        code: '3.16',
        title: 'International Level Hackathons (NASA Space Apps, Imagine Cup, Google Solution Challenge, IEEE YESIST12, Hack Zurich, etc.)',
        evidenceRequired: 'Certificate issued by International Hackathon Organizing Body.',
        options: [
          { label: '1st Prize Winner', points: 40 },
          { label: '2nd / 3rd Prize Winner', points: 35 },
          { label: 'Active Participation', points: 30 }
        ],
        maxPointsCap: 40
      },
      {
        code: '3.17',
        title: 'Approved Skilling Courses (SWAYAM / NPTEL / Spoken Tutorial / K-DISC / KTU)',
        evidenceRequired: 'Course certificate mentioning total duration/hours and university approval status.',
        hourlyRate: { rate: 1, unit: 'hour' },
        maxPointsCap: 40,
        remarks: 'Awarded at 1 point per hour of approved completed skilling courses. SFA must verify course appears in KTU approved list.'
      }
    ]
  }
]
