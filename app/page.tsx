import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl mb-6">
        BullQuant Alpha
      </h1>
      <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 mb-8">
        Pesquisa pelo ticker de uma empresa na barra superior para começar.
      </p>
      <div className="flex gap-4">
        <Link href="/stock/AAPL" className={buttonVariants({ size: "lg" })}>
          Testar Exemplo AAPL <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
