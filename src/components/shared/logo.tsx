"use client"

import Link from "next/link"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  variant?: "light" | "dark"
  href?: string
  className?: string
}

export function Logo({
  size = "md",
  variant = "light",
  href = "/",
  className = "",
}: LogoProps) {
  const sizeMap = {
    sm: { img: "h-8 w-8", text: "text-base", sub: "text-[8px]" },
    md: { img: "h-10 w-10", text: "text-lg", sub: "text-[9px]" },
    lg: { img: "h-14 w-14", text: "text-2xl", sub: "text-[10px]" },
  }

  const s = sizeMap[size]

  const content = (
    <span className={`flex items-center gap-2.5 select-none ${className}`}>
      <span
        className={`${s.img} shrink-0 flex items-center justify-center rounded-xl overflow-hidden ${
          variant === "light" ? "bg-white/10" : "bg-slate-100"
        }`}
      >
        <img
          src="/logo.png"
          alt="PropX Logo"
          className="h-full w-full object-contain"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`${s.text} font-bold tracking-tight ${
            variant === "light" ? "text-white" : "text-gray-900"
          }`}
        >
          Prop<span className="text-indigo-400">X</span>
        </span>
      </span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg">
        {content}
      </Link>
    )
  }

  return content
}
