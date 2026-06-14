import { useEffect, useMemo, useState } from 'react'
import { ImageIcon, Search, Sparkles } from 'lucide-react'
import apiClient from '../api/client'

const GalleryPage = () => {
   const [gallery, setGallery] = useState([])
   const [query, setQuery] = useState('')
   const [category, setCategory] = useState('all')
   const [loading, setLoading] = useState(true)

   useEffect(() => {
      const loadGallery = async () => {
         try {
            setLoading(true)
            const response = await apiClient.get('/gallery')
            setGallery(response.data.gallery || [])
         } catch (error) {
            console.error(error)
            setGallery([])
         } finally {
            setLoading(false)
         }
      }

      loadGallery()
   }, [])

   const categories = useMemo(() => {
      const values = gallery.map((item) => item.category).filter(Boolean)
      return ['all', ...Array.from(new Set(values))]
   }, [gallery])

   const filteredItems = useMemo(() => {
      const normalizedQuery = query.toLowerCase().trim()
      return gallery.filter((item) => {
         const matchesCategory = category === 'all' || item.category === category
         const matchesQuery = !normalizedQuery || [item.title, item.description, item.location, ...(item.tags || [])].join(' ').toLowerCase().includes(normalizedQuery)
         return matchesCategory && matchesQuery
      })
   }, [gallery, query, category])

   return (
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
         <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
               <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">Gallery</p>
                  <h1 className="mt-2 text-3xl font-semibold text-slate-900">A live portfolio of trusted work and verified stories</h1>
                  <p className="mt-3 text-sm text-slate-500">Browse the latest marketplace highlights, featured services, and completed projects from the RozWork community.</p>
               </div>
               <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
                  <div className="flex items-center gap-2"><Sparkles size={16} /> Featured work</div>
               </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
               <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Search size={16} className="text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search gallery items" className="w-full border-0 bg-transparent text-sm outline-none" />
               </label>
               <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none">
                  {categories.map((option) => (
                     <option key={option} value={option}>{option === 'all' ? 'All categories' : option}</option>
                  ))}
               </select>
            </div>
         </section>

         <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
               <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-3">Loading gallery...</div>
            ) : filteredItems.length ? filteredItems.map((item) => (
               <article key={item.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                  <img src={item.imageUrl} alt={item.imageAlt || item.title} className="h-48 w-full object-cover" />
                  <div className="p-5">
                     <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700">{item.category}</span>
                        {item.featured ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">Featured</span> : null}
                     </div>
                     <h2 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h2>
                     <p className="mt-2 text-sm text-slate-500">{item.description}</p>
                     <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags?.slice(0, 3).map((tag) => (
                           <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">#{tag}</span>
                        ))}
                     </div>
                     <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                        <ImageIcon size={16} /> {item.location || 'Remote'}
                     </div>
                  </div>
               </article>
            )) : (
               <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-3">No gallery items match the current search.</div>
            )}
         </section>
      </main>
   )
}

export default GalleryPage
