"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useDebounce } from "@/hooks/useDebounce"

type SearchResult = {
  ticker: string;
  name: string;
  exchange: string;
};

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLFormElement>(null)
  
  const debouncedQuery = useDebounce(query, 300)

  React.useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        const data = await res.json()
        setResults(data)
        setIsOpen(true)
      } catch (error) {
        console.error("Failed to search", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [debouncedQuery])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      router.push(`/stock/${query.trim().toUpperCase()}`)
    }
  }

  const handleSelect = (ticker: string) => {
    setQuery("")
    setIsOpen(false)
    router.push(`/stock/${ticker}`)
  }

  return (
    <form ref={wrapperRef} onSubmit={handleSearch} className="relative w-full max-w-sm group">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        type="search"
        placeholder="Pesquisar ticker (ex: AAPL)..."
        className="w-full rounded-full bg-white/5 border-white/10 pl-10 md:w-[300px] lg:w-[400px] focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-white/10 transition-all backdrop-blur-md shadow-inner placeholder:text-muted-foreground/50 h-10"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          if (e.target.value.length >= 2) setIsOpen(true)
        }}
        onFocus={() => query.length >= 2 && setIsOpen(true)}
        autoComplete="off"
      />
      
      {isOpen && (results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {isLoading ? (
            <div className="p-4 text-sm text-center text-muted-foreground">A pesquisar...</div>
          ) : results.length > 0 ? (
            <ul className="py-2">
              {results.map((result) => (
                <li key={result.ticker}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result.ticker)}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-foreground">{result.ticker}</span>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{result.name}</p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5 text-muted-foreground uppercase">{result.exchange}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </form>
  )
}
