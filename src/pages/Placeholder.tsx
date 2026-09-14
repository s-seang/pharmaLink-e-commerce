import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'

/** Content pages linked from the footer that are not written yet. */
export default function Placeholder({ title }: { title: string }) {
  return (
    <Layout>
      <div className="app-container flex flex-col items-center gap-3 py-20 text-center">
        <h1 className="text-lg font-semibold text-ink">{title}</h1>
        <p className="text-sm text-muted">This page is coming soon.</p>
        <Link to="/" className="btn-primary mt-1">
          Back to home
        </Link>
      </div>
    </Layout>
  )
}
