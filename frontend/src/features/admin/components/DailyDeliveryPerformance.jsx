import { useEffect, useState } from "react";
import { getDailyDeliveryPerformance } from "../../../services/adminApi";

function DailyDeliveryPerformance() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPerformance = async () => {
            try {
                const result = await getDailyDeliveryPerformance();
                setData(result);
            } catch (error) {
                console.error("Failed to load daily delivery performance:", error);
            } finally {
                setLoading(false);
            }
        };
        loadPerformance();
    }, []);

    const maxValue = Math.max(...data.map((item) => Math.max(item.delivered || 0, item.cancelled || 0)), 10);

    return (
        <div className="w-full bg-white border border-orange-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-gray-900">Daily Delivery Performance</h2>
                    <p className="text-xs text-gray-500 mt-1">Delivery activity for the last 7 days</p>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400">Loading performance...</div>
            ) : (
                <>
                    <div className="mt-6 h-64 flex items-end gap-5 border-b border-gray-100 px-4">
                        {data.map((item, index) => {
                            const delivered = item.delivered || 0;
                            const cancelled = item.cancelled || 0;
                            const deliveredHeight = (delivered / maxValue) * 100;
                            const cancelledHeight = (cancelled / maxValue) * 100;

                            return (
                                <div key={`${item.day}-${index}`} className="flex-1 h-full flex flex-col justify-end">
                                    <div className="flex-1 flex items-end justify-center gap-1.5">
                                        <div className="relative group">
                                            <div
                                                className="w-7 bg-orange-600 rounded-t-md transition-all duration-300"
                                                style={{ height: delivered > 0 ? `${deliveredHeight}%` : "3px" }}
                                            />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1">
                                                Delivered: {delivered}
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <div
                                                className="w-7 bg-orange-300 rounded-t-md transition-all duration-300"
                                                style={{ height: cancelled > 0 ? `${cancelledHeight}%` : "3px" }}
                                            />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1">
                                                Cancelled: {cancelled}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center text-xs text-gray-500 pt-3">{item.day}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-center gap-8 mt-5">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm bg-orange-600" />
                            <span className="text-xs text-gray-500">Delivered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm bg-orange-300" />
                            <span className="text-xs text-gray-500">Cancelled</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default DailyDeliveryPerformance;
