import { useEffect, useState } from "react";
import { getPendingAssignments } from "../../../services/adminApi";

function PendingAssignment() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAssignments = async () => {
            try {
                const data = await getPendingAssignments();
                setAssignments(data);
            } catch (error) {
                console.error("Failed to load pending assignments:", error);
            } finally {
                setLoading(false);
            }
        };

        loadAssignments();
    }, []);

    return (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 h-[520px]">
            <div>
                <h2 className="text-base font-bold text-gray-900">
                    Pending Assignment
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                    Deliveries waiting for rider assignment
                </p>
            </div>

            <div className="mt-5 space-y-4 max-h-[420px] overflow-y-auto pr-2">
                {loading ? (
                    <p className="text-sm text-gray-400">
                        Loading assignments...
                    </p>
                ) : assignments.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        No pending assignments.
                    </p>
                ) : (
                    assignments.map((item) => (
                        <div
                            key={item.id}
                            className="border border-gray-100 rounded-xl p-4"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900">
                                    #{item.trackingId}
                                </p>
                                <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium">
                                    Pending
                                </span>
                            </div>

                            <div className="mt-3 text-xs text-gray-500 space-y-2">
                                <p>
                                    <span className="font-medium text-gray-700">
                                        Pickup:
                                    </span>{" "}
                                    {item.pickupAddress}
                                </p>
                                <p>
                                    <span className="font-medium text-gray-700">
                                        Drop:
                                    </span>{" "}
                                    {item.deliveryAddress}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default PendingAssignment;
