import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { Award, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center lg:pt-24 lg:pb-28">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>APJ Abdul Kalam Technological University &bull; 2024 Scheme Guidelines</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none max-w-4xl mx-auto">
          KTU Student <span className="text-indigo-600">Activity Points</span> Management System
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Automated tracking, certificate verification, and approval management for KTU B.Tech students and Senior Faculty Advisors (SFA).
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link
              href={user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard'}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition"
            >
              Open your {user.role === 'ADMIN' ? 'advisor' : 'student'} dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition"
              >
                Sign In to Portal
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
              >
                Register as Student
              </Link>
            </>
          )}
        </div>

        {/* 3 Scheme Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm mb-4">
              I
            </div>
            <h3 className="font-bold text-slate-900 text-base">Group I: Sports & Culture</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Sports, Games, Arts, NSS, NCC, Blood Donation, Emergency Training, Certified Swimming & Driving License.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-indigo-700">
              Min 40 Pts Required (Regular)
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm mb-4">
              II
            </div>
            <h3 className="font-bold text-slate-900 text-base">Group II: Technical & Tests</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Tech-Fests, Paper Presentations, Professional Bodies, FOSS Contributions, Standardized Tests (GATE, CAT, GRE, TOEFL).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-emerald-700">
              Min 40 Pts Required (Regular)
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm mb-4">
              III
            </div>
            <h3 className="font-bold text-slate-900 text-base">Group III: Industry & Startups</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Industrial Internships, Startups, Patents, Hackathons, and Approved Skilling / MOOC Certifications (NPTEL/SWAYAM).
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-semibold text-blue-700">
              Min 40 Pts Required (Regular)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
