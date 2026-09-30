import { useState } from 'react'
import Logo from './Logo'
import { CloseIcon } from './Icons'

const DISTRICT_METRICS = [
  { district: 'Bhopal', queries: 24350, applications: 8420, topScheme: 'Ladli Behna Yojana', slaRate: '96.4%', grievanceCount: 42 },
  { district: 'Indore', queries: 28910, applications: 9140, topScheme: 'Seekho Kamao Yojana', slaRate: '97.1%', grievanceCount: 38 },
  { district: 'Jabalpur', queries: 16820, applications: 4890, topScheme: 'Sambal 2.0 Yojana', slaRate: '93.5%', grievanceCount: 56 },
  { district: 'Gwalior', queries: 15410, applications: 4210, topScheme: 'PM-KISAN + Kalyan', slaRate: '94.0%', grievanceCount: 49 },
  { district: 'Ujjain', queries: 13200, applications: 3950, topScheme: 'Ladli Behna Yojana', slaRate: '95.8%', grievanceCount: 31 },
  { district: 'Sagar', queries: 11450, applications: 3120, topScheme: 'PM Awas Gramin', slaRate: '91.2%', grievanceCount: 68 },
  { district: 'Rewa', queries: 9840, applications: 2810, topScheme: 'PM-KISAN + Kalyan', slaRate: '92.6%', grievanceCount: 61 },
  { district: 'Sehore', queries: 8760, applications: 2450, topScheme: 'Kisan Kalyan / PDS', slaRate: '94.8%', grievanceCount: 29 },
  { district: 'Dhar', queries: 7920, applications: 2180, topScheme: 'Sambal / Tribal Aid', slaRate: '89.4%', grievanceCount: 74 },
  { district: 'Chhindwara', queries: 8150, applications: 2310, topScheme: 'Ayushman Bharat', slaRate: '93.8%', grievanceCount: 44 }
]

const SCHEME_DISTRIBUTION = [
  { name: 'Mukhyamantri Ladli Behna Yojana', share: 34, color: 'var(--color-rose)' },
  { name: 'PM-KISAN + MP Kisan Kalyan', share: 28, color: 'var(--color-forest)' },
  { name: 'Sambal 2.0 Social Security', share: 18, color: 'var(--color-plum)' },
  { name: 'MMVY & Seekho Kamao Youth', share: 12, color: 'var(--color-teal)' },
  { name: 'PM Awas Yojana (Housing)', share: 8, color: 'var(--color-marigold-dark)' }
]

const AI_POLICY_INSIGHTS = [
  {
    tag: 'Emerging Demand Surge',
    title: 'Surge in Seekho Kamao & MMSKY Youth Queries in Malwa Region',
    desc: 'Indore and Ujjain districts recorded a 42% increase in fresh ITI and Diploma graduates seeking stipend schemes.
