import Link from 'next/link'

export function AdminStat({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: string
  hint?: string
  href?: string
}) {
  const body = (
    <>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  )
  const className = 'rounded-xl border border-slate-800 bg-slate-900 p-4'
  if (href) {
    return (
      <Link href={href} className={`${className} cursor-pointer hover:border-violet-500`}>
        {body}
      </Link>
    )
  }
  return <div className={className}>{body}</div>
}
