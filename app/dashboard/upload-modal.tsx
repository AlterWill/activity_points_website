'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HardDrive,
  Info,
  Upload,
  X,
} from 'lucide-react'
import {
  cancelNeonUploadAction,
  createNeonUploadAction,
  createSubmissionAction,
} from '@/app/actions/submissions'
import {
  CERTIFICATE_ACCEPT,
  CERTIFICATE_MIME_TYPES,
  MAX_SOURCE_IMAGE_BYTES,
  MAX_SOURCE_IMAGE_MB,
} from '@/lib/constants'
import { formatBytes } from '@/lib/format'
import { compressCertificateImage } from '@/lib/image-compression'
import {
  ACHIEVEMENT_LEVEL_LABELS,
  calculateClaim,
  getActivityMode,
  getConfiguredLevels,
  getMaxHours,
} from '@/lib/points'
import type {
  AchievementLevel,
  ActivityGroup,
  CategoryDTO,
  CertificateStorageUsage,
} from '@/lib/types'

interface UploadModalProps {
  categories: CategoryDTO[]
  storage: CertificateStorageUsage
  onClose: () => void
  onSuccess: (points?: number) => void
}

const GROUP_TABS: Array<{ group: ActivityGroup; label: string; hint: string }> = [
  { group: 'GROUP_1', label: 'Group I', hint: 'Sports, arts, NSS' },
  { group: 'GROUP_2', label: 'Group II', hint: 'Technical, leadership' },
  { group: 'GROUP_3', label: 'Group III', hint: 'Industry, innovation' },
]

function certificateKindForFile(file: File): 'pdf' | 'image' | null {
  const name = file.name.toLowerCase()
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (file.type === 'image/png' || file.type === 'image/jpeg' || /\.(png|jpe?g)$/.test(name)) {
    return 'image'
  }
  return null
}

function certificateSizeLimit(file: File, storage: CertificateStorageUsage) {
  const kind = certificateKindForFile(file)
  if (kind === 'pdf') {
    return { bytes: storage.maxPdfBytes, mb: storage.maxPdfMb, label: 'PDF' }
  }
  if (kind === 'image') {
    return { bytes: storage.maxImageBytes, mb: storage.maxImageMb, label: 'PNG/JPG' }
  }
  return null
}

function resetClaimState() {
  return {
    level: '' as AchievementLevel | '',
    option: '',
    hours: '1',
  }
}

export function UploadModal({ categories, storage, onClose, onSuccess }: UploadModalProps) {
  const initialGroup = categories[0]?.group ?? 'GROUP_1'
  const initialCategory = categories.find((category) => category.group === initialGroup)

  const [group, setGroup] = useState<ActivityGroup>(initialGroup)
  const [categoryId, setCategoryId] = useState(initialCategory?.id ?? '')
  const [activityId, setActivityId] = useState(initialCategory?.activities[0]?.id ?? '')
  const [level, setLevel] = useState<AchievementLevel | ''>('')
  const [option, setOption] = useState('')
  const [hours, setHours] = useState('1')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [processingFile, setProcessingFile] = useState(false)

  const groupCategories = useMemo(
    () => categories.filter((category) => category.group === group),
    [categories, group]
  )

  const activeCategory =
    groupCategories.find((category) => category.id === categoryId) ?? groupCategories[0]

  const activityHeads = activeCategory?.activities ?? []
  const activeActivity =
    activityHeads.find((activity) => activity.id === activityId) ?? activityHeads[0]

  const config = activeActivity?.pointsConfig ?? {}
  const mode = getActivityMode(config)
  const configuredLevels = getConfiguredLevels(config)
  const effectiveLevel = configuredLevels.includes(level as AchievementLevel)
    ? (level as AchievementLevel)
    : configuredLevels[0]

  const optionLabels = config.options?.map((item) => item.label) ?? []
  const effectiveOption = optionLabels.includes(option) ? option : optionLabels[0] ?? ''

  const maxHours = getMaxHours(config)
  const parsedHours = Number(hours)
  const effectiveHours =
    Number.isInteger(parsedHours) && parsedHours >= 1 && parsedHours <= maxHours ? parsedHours : null

  const calculation = activeActivity
    ? calculateClaim(config, {
        level: effectiveLevel,
        selectedOption: effectiveOption,
        hoursSpent: effectiveHours,
      })
    : null

  const calculatedPoints = calculation && !('error' in calculation) ? calculation.points : null
  const calculationError = calculation && 'error' in calculation ? calculation.error : null
  const fileLimit = file ? certificateSizeLimit(file, storage) : null
  const storageBlocksSubmit =
    !storage.isConfigured ||
    storage.remainingBytes <= 0 ||
    (file
      ? !fileLimit ||
        file.size > storage.remainingBytes ||
        file.size > fileLimit.bytes
      : false)

  function selectGroup(nextGroup: ActivityGroup) {
    const firstCategory = categories.find((category) => category.group === nextGroup)
    setGroup(nextGroup)
    setCategoryId(firstCategory?.id ?? '')
    setActivityId(firstCategory?.activities[0]?.id ?? '')
    setLevel('')
    setOption('')
    setHours('1')
    setError(null)
  }

  function selectCategory(nextCategoryId: string) {
    const nextCategory = groupCategories.find((category) => category.id === nextCategoryId)
    setCategoryId(nextCategoryId)
    setActivityId(nextCategory?.activities[0]?.id ?? '')
    setLevel('')
    setOption('')
    setHours('1')
    setError(null)
  }

  function selectActivity(nextActivityId: string) {
    setActivityId(nextActivityId)
    const claimReset = resetClaimState()
    setLevel(claimReset.level)
    setOption(claimReset.option)
    setHours(claimReset.hours)
    setError(null)
  }

  async function handleFileChange(nextFile: File | null) {
    setError(null)

    if (!nextFile) {
      setFile(null)
      return
    }

    if (!storage.isConfigured) {
      setFile(null)
      setError(
        'Certificate uploads are disabled because no private certificate storage is configured. Please contact your faculty advisor.'
      )
      return
    }

    if (storage.remainingBytes <= 0) {
      setFile(null)
      setError('Certificate storage is full. Please contact your faculty advisor.')
      return
    }

    setProcessingFile(true)

    try {
      let candidate = nextFile
      const isImage = nextFile.type.startsWith('image/')

      if (isImage && nextFile.size > MAX_SOURCE_IMAGE_BYTES) {
        setFile(null)
        setError(
          `Images must be ${MAX_SOURCE_IMAGE_MB} MB or smaller before compression.`
        )
        return
      }

      if (isImage) {
        candidate = await compressCertificateImage(nextFile)
      }

      const limit = certificateSizeLimit(candidate, storage)

      if (!limit) {
        setFile(null)
        setError('Only PDF, PNG, or JPG certificate files are accepted.')
        return
      }

      if (candidate.size > limit.bytes) {
        setFile(null)
        setError(
          isImage
            ? `This image is still ${formatBytes(candidate.size)} after compression. ${limit.label} certificates must be ${limit.mb} MB or smaller.`
            : `${limit.label} certificates must be ${limit.mb} MB or smaller.`
        )
        return
      }

      if (
        candidate.type &&
        !CERTIFICATE_MIME_TYPES.includes(
          candidate.type as (typeof CERTIFICATE_MIME_TYPES)[number]
        )
      ) {
        setFile(null)
        setError('Only PDF, PNG, or JPG certificate files are accepted.')
        return
      }

      if (candidate.size > storage.remainingBytes) {
        setFile(null)
        setError(
          `This file is ${formatBytes(candidate.size)}, but only ${formatBytes(storage.remainingBytes)} of certificate storage remains. Choose a smaller file or contact your faculty advisor.`
        )
        return
      }

      setFile(candidate)
    } catch (fileError) {
      console.error(fileError)
      setFile(null)
      setError('Unable to process this certificate file. Try another file.')
    } finally {
      setProcessingFile(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!activeActivity) {
      setError('Select an activity first.')
      return
    }

    if (!file) {
      setError('Attach a certificate file before submitting.')
      return
    }

    if (!storage.isConfigured) {
      setError(
        'Certificate uploads are disabled because no private certificate storage is configured. Please contact your faculty advisor.'
      )
      return
    }

    const limit = certificateSizeLimit(file, storage)

    if (!limit) {
      setError('Only PDF, PNG, or JPG certificate files are accepted.')
      return
    }

    if (file.size > limit.bytes) {
      setError(`${limit.label} certificates must be ${limit.mb} MB or smaller.`)
      return
    }

    if (file.size > storage.remainingBytes) {
      setError(
        `This file is ${formatBytes(file.size)}, but only ${formatBytes(storage.remainingBytes)} of certificate storage remains.`
      )
      return
    }

    if (!calculation || 'error' in calculation) {
      setError(calculation?.error ?? 'Unable to calculate points for this activity.')
      return
    }

    const formData = new FormData()
    formData.set('activityHeadId', activeActivity.id)

    if (mode === 'LEVEL' && effectiveLevel) {
      formData.set('level', effectiveLevel)
    } else if (mode === 'OPTION' && effectiveOption) {
      formData.set('selectedOption', effectiveOption)
    } else if (mode === 'HOURLY') {
      formData.set('hoursSpent', String(effectiveHours))
    }

    let uploadedKey: string | null = null
    setLoading(true)

    try {
      if (storage.mode === 'NEON') {
        setUploading(true)

        const prepared = await createNeonUploadAction({
          fileName: file.name,
          size: file.size,
        })

        if (!prepared.uploadUrl || !prepared.key) {
          setError(prepared.error || 'Unable to prepare the certificate upload.')
          return
        }

        uploadedKey = prepared.key

        const uploadResponse = await fetch(prepared.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': prepared.contentType || file.type,
          },
        })

        if (!uploadResponse.ok) {
          await cancelNeonUploadAction(uploadedKey)
          uploadedKey = null
          setError('Unable to upload the certificate to storage. Please try again.')
          return
        }

        setUploading(false)
        formData.set('certificateKey', uploadedKey)
      } else {
        formData.set('certificate', file)
      }

      const result = await createSubmissionAction(formData)

      if (!result.success) {
        if (uploadedKey) {
          await cancelNeonUploadAction(uploadedKey)
          uploadedKey = null
        }
        setError(result.error || 'Unable to submit this certificate.')
        return
      }

      uploadedKey = null
      onSuccess(result.points)
    } catch (submitError) {
      console.error(submitError)

      if (uploadedKey) {
        await cancelNeonUploadAction(uploadedKey)
      }

      setError('Unable to submit this certificate right now. Please try again.')
    } finally {
      setUploading(false)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="my-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">
              Submit activity certificate
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Choose the activity, claim the correct points, then upload the evidence.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-88px)] space-y-6 overflow-y-auto px-6 py-5">
          {error && (
            <div className="flex items-start rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <AlertCircle className="mr-2 mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {categories.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              The activity catalog is empty. Run <code className="font-bold">pnpm db:seed</code> to load
              the KTU 2024 activities.
            </div>
          ) : (
            <>
              <section>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Activity group</h3>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {GROUP_TABS.map((tab) => (
                    <button
                      key={tab.group}
                      type="button"
                      onClick={() => selectGroup(tab.group)}
                      className={`rounded-xl border px-2 py-2.5 text-center transition ${
                        group === tab.group
                          ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block text-xs font-bold">{tab.label}</span>
                      <span
                        className={`mt-0.5 block text-[10px] ${
                          group === tab.group ? 'text-indigo-100' : 'text-slate-500'
                        }`}
                      >
                        {tab.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Choose the activity</h3>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="category" className="mb-1 block text-xs font-semibold text-slate-600">
                      Category
                    </label>
                    <select
                      id="category"
                      value={activeCategory?.id ?? ''}
                      onChange={(event) => selectCategory(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      {groupCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="activity" className="mb-1 block text-xs font-semibold text-slate-600">
                      Activity
                    </label>
                    <select
                      id="activity"
                      value={activeActivity?.id ?? ''}
                      onChange={(event) => selectActivity(event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    >
                      {activityHeads.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.code} — {activity.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {activeActivity && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start gap-2">
                      <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Evidence required</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {activeActivity.evidenceRequired || 'Upload the certificate issued for this activity.'}
                        </p>
                        {config.maxPointsCap && (
                          <p className="mt-1.5 text-[11px] font-semibold text-indigo-700">
                            Maximum across all claims: {config.maxPointsCap} points
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Claim your points</h3>
                </div>

                <div className="mt-3">
                  {!activeActivity || !mode ? (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      This activity is not configured correctly. Contact your faculty advisor.
                    </p>
                  ) : mode === 'LEVEL' ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {configuredLevels.map((configuredLevel) => (
                        <button
                          key={configuredLevel}
                          type="button"
                          onClick={() => setLevel(configuredLevel)}
                          className={`rounded-xl border px-2 py-2.5 text-center transition ${
                            effectiveLevel === configuredLevel
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-[11px] font-bold">
                            {ACHIEVEMENT_LEVEL_LABELS[configuredLevel]}
                          </span>
                          <span
                            className={`mt-0.5 block text-[10px] ${
                              effectiveLevel === configuredLevel ? 'text-slate-300' : 'text-slate-500'
                            }`}
                          >
                            {config.levelPoints?.[configuredLevel]} pts
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : mode === 'OPTION' ? (
                    <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
                      {config.options?.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setOption(item.label)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition ${
                            effectiveOption === item.label
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-900'
                              : 'border-transparent text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-medium">{item.label}</span>
                          <span className="shrink-0 text-xs font-bold text-indigo-600">
                            {item.points} pts
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : mode === 'FIXED' ? (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">Fixed point activity</p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          This activity awards the same points for every valid certificate.
                        </p>
                      </div>
                      <span className="text-2xl font-black text-indigo-600">{config.fixedPoints} pts</span>
                    </div>
                  ) : mode === 'HOURLY' ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <label htmlFor="hours" className="block text-xs font-semibold text-slate-700">
                        Completed hours
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          id="hours"
                          type="number"
                          min={1}
                          max={maxHours}
                          step={1}
                          value={hours}
                          onChange={(event) => setHours(event.target.value)}
                          className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <span className="text-xs text-slate-600">
                          {config.hourlyRate?.rate} point(s) per {config.hourlyRate?.unit ?? 'hour'} · max{' '}
                          {maxHours} hours
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-bold text-indigo-950">Calculated claim</p>
                      <p className="text-[11px] text-indigo-700">
                        Final points are confirmed by your faculty advisor.
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-indigo-600">
                    {calculatedPoints !== null ? `+${calculatedPoints}` : '—'}
                    <span className="ml-1 text-xs font-bold text-indigo-500">pts</span>
                  </span>
                </div>

                {calculationError && (
                  <p className="mt-2 text-xs font-medium text-red-600">{calculationError}</p>
                )}

                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  For a single event, submit only the highest achievement. Participation and winner
                  points cannot be combined for the same event.
                </p>
              </section>

              <section>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    4
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">Upload certificate</h3>
                </div>

                <div
                  className={`mt-3 rounded-xl border p-3 ${
                    !storage.isConfigured
                      ? 'border-red-200 bg-red-50'
                      : storage.percent >= 90
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <HardDrive
                        className={`h-4 w-4 ${
                          !storage.isConfigured
                            ? 'text-red-600'
                            : storage.percent >= 90
                              ? 'text-amber-600'
                              : 'text-slate-500'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-slate-700">
                        Certificate storage
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {formatBytes(storage.usedBytes)} / {formatBytes(storage.limitBytes)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        !storage.isConfigured
                          ? 'bg-red-500'
                          : storage.percent >= 90
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, storage.percent)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                    {storage.isConfigured
                      ? `${formatBytes(storage.remainingBytes)} available for new certificates.`
                      : 'Uploads are disabled until private certificate storage is configured.'}
                  </p>
                  {storage.warning && (
                    <p className="mt-1 flex items-start text-[10px] leading-relaxed text-amber-700">
                      <AlertTriangle className="mr-1 mt-0.5 h-3 w-3 shrink-0" />
                      {storage.warning}
                    </p>
                  )}
                </div>

                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-5 py-7 text-center transition hover:border-indigo-400 hover:bg-indigo-50/30">
                  <input
                    type="file"
                    accept={CERTIFICATE_ACCEPT}
                    onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                    className="sr-only"
                    disabled={processingFile || loading}
                  />
                  {processingFile ? (
                    <div className="flex items-center gap-2 text-indigo-700">
                      <Upload className="h-6 w-6 animate-pulse" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800">Optimizing image...</p>
                        <p className="text-[11px] text-slate-500">
                          Compressing the certificate before upload.
                        </p>
                      </div>
                    </div>
                  ) : file ? (
                    <div className="flex items-center gap-2 text-indigo-700">
                      <FileText className="h-6 w-6" />
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-800">{file.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatBytes(file.size)} · click to replace
                        </p>
                      </div>
                      <CheckCircle2 className="ml-2 h-4 w-4 text-emerald-600" />
                    </div>
                  ) : (
                    <>
                      <Upload className="h-7 w-7 text-slate-400" />
                      <p className="mt-2 text-xs font-bold text-indigo-600">
                        Click to choose a certificate
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        PDF, PNG, or JPG · PDF max {storage.maxPdfMb} MB · images max {storage.maxImageMb} MB
                      </p>
                    </>
                  )}
                </label>

                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  JPG/PNG images up to {MAX_SOURCE_IMAGE_MB} MB are compressed in the browser.
                  PDFs are gzip-compressed on the server before storage.
                </p>
              </section>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    processingFile ||
                    !file ||
                    calculatedPoints === null ||
                    storageBlocksSubmit
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingFile
                    ? 'Processing...'
                    : uploading
                      ? 'Uploading...'
                      : loading
                        ? 'Submitting...'
                        : 'Submit for verification'}
                  {!loading && !processingFile && <ChevronRight className="ml-1 h-4 w-4" />}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
