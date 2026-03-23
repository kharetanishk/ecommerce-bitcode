import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {session?.user?.name ?? "Admin"}
        </p>
      </div>

      {/* Placeholder stat cards — filled in on Day 6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: "—" },
          { label: "Total Orders", value: "—" },
          { label: "Revenue", value: "—" },
          { label: "Customers", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-sm text-gray-500">
          Start by creating{" "}
          <a
            href="/admin/categories"
            className="text-black font-medium underline"
          >
            categories and attributes
          </a>{" "}
          before adding products.
        </p>
      </div>
    </div>
  );
}
