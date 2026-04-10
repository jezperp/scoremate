import NewsFeed from './news-feed'

export const metadata = {
  title: 'News – Scoremate',
}

export default function NewsPage() {
  return (
    <div className="min-h-[calc(100vh-var(--nav-height))]">
      <header className="px-4 pb-2 pt-5">
        <h1 className="text-xl font-bold text-foreground">News</h1>
      </header>
      <NewsFeed />
    </div>
  )
}
