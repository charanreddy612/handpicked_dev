export default function DashboardSummary() {
  // Static values for now, can be fetched dynamically later
  const stats = [
    { label: 'Total Stores', value: 15 },
    { label: 'Top Coupons', value: 47 },
    { label: 'Published Blogs', value: 12 },
  ];

  return (
    <section className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Welcome to HandPicked CMS</h1>
      <div className="flex flex-wrap gap-6">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="bg-white rounded-lg p-6 shadow-md w-64 flex flex-col"
          >
            <span className="text-gray-600">{label}</span>
            <span className="text-3xl font-extrabold mt-2">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}