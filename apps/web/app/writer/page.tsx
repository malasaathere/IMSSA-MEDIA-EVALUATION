export default function WriterDashboard() {
  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="page-heading mb-8"><div><p>CONTENT WORKSPACE</p><h1>Writing Queue</h1><span>Create captions and campaign copy ready for review.</span></div><button className="rounded-xl bg-primary px-5 py-3 font-semibold text-white">New draft</button></div>
      <div className="grid gap-5 md:grid-cols-3">
        {[
          ["Needs copy", "5", "Briefs ready for writing"],
          ["In review", "3", "Waiting for coordinator feedback"],
          ["Approved", "18", "Completed this month"],
        ].map(([label,value,note]) => <article key={label} className="rounded-[22px] border border-border bg-white p-6 shadow-sm"><p className="text-sm font-semibold text-text-muted">{label}</p><strong className="mt-4 block text-3xl font-extrabold text-navy-950">{value}</strong><span className="mt-2 block text-xs text-text-muted">{note}</span></article>)}
      </div>
      <section className="mt-6 rounded-[22px] border border-border bg-white p-6 shadow-sm"><h2 className="text-xl font-bold text-navy-950">Upcoming copy</h2><p className="mt-2 text-sm text-text-muted">Your assigned caption and campaign-writing tasks will appear here.</p></section>
    </div>
  );
}
