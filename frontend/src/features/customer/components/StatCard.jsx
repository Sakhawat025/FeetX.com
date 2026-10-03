import { ArrowUpRight } from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = "bg-orange-50",
  iconColor = "text-orange-600",
  valueColor = "text-gray-950",
}) {
  return (
    <div className="bg-white border border-orange-100 rounded-2xl p-6 min-h-[122px] flex items-center justify-between">
      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon size={25} className={iconColor} strokeWidth={2} />
        </div>

        {/* Content */}
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h2 className={`mt-1 text-3xl font-bold tracking-tight ${valueColor}`}>{value}</h2>
          {subtitle && <p className="mt-1 text-sm text-orange-600 font-medium">{subtitle}</p>}
        </div>
      </div>

      {/* Optional arrow */}
      <div className="self-start">
        <ArrowUpRight size={18} className="text-gray-300" />
      </div>
    </div>
  );
}

export default StatCard;
