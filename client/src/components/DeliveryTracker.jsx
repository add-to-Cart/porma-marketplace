import { CheckCircle, Circle, Truck, Package, Clock } from "lucide-react";
import { useMemo } from "react";

export default function DeliveryTracker({ order }) {
  const currentStatus = order.status;
  const stages = order.stages;

  // Find current stage index
  const currentStageIndex = stages.findIndex(
    (stage) => stage.key === currentStatus,
  );

  const estimatedDeliveryDate = useMemo(() => {
    const createdAt = new Date(order.createdAt);
    const estimatedMs = order.estimatedDays * 24 * 60 * 60 * 1000;
    return new Date(createdAt.getTime() + estimatedMs).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      },
    );
  }, [order.createdAt, order.estimatedDays]);

  const getStageIcon = (stageKey, isCompleted, isCurrent) => {
    const iconProps = {
      size: 20,
      className: isCompleted
        ? "text-green-600"
        : isCurrent
          ? "text-blue-600"
          : "text-gray-400",
    };

    switch (stageKey) {
      case "processing":
        return <Clock {...iconProps} />;
      case "packed":
        return <Package {...iconProps} />;
      case "shipped":
        return <Truck {...iconProps} />;
      case "out_for_delivery":
        return <Truck {...iconProps} />;
      case "delivered":
        return <CheckCircle {...iconProps} />;
      default:
        return <Circle {...iconProps} />;
    }
  };

  const getStageStatus = (stage, index) => {
    if (index < currentStageIndex) return "completed";
    if (index === currentStageIndex) return "current";
    return "pending";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Delivery Progress
      </h3>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";

          return (
            <div key={stage.key} className="flex items-center gap-4">
              {/* Stage Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-green-100"
                    : isCurrent
                      ? "bg-blue-100"
                      : "bg-gray-100"
                }`}
              >
                {getStageIcon(stage.key, isCompleted, isCurrent)}
              </div>

              {/* Stage Info */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4
                      className={`font-medium ${
                        isCompleted
                          ? "text-green-700"
                          : isCurrent
                            ? "text-blue-700"
                            : "text-gray-500"
                      }`}
                    >
                      {stage.label}
                    </h4>
                    {isCurrent && (
                      <p className="text-sm text-gray-600 mt-1">
                        Estimated: {stage.etaHours} hours
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isCompleted
                        ? "bg-green-100 text-green-700"
                        : isCurrent
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isCompleted
                      ? "Completed"
                      : isCurrent
                        ? "In Progress"
                        : "Pending"}
                  </div>
                </div>

                {/* Progress Bar */}
                {index < stages.length - 1 && (
                  <div className="mt-3 ml-5">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-500 ${
                          isCompleted ? "bg-green-500 w-full" : "bg-blue-500"
                        }`}
                        style={{
                          width: isCompleted
                            ? "100%"
                            : isCurrent
                              ? "50%"
                              : "0%",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated Delivery */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Estimated Delivery:</span>
          <span className="font-semibold text-gray-900">
            {estimatedDeliveryDate}
          </span>
        </div>
      </div>
    </div>
  );
}
