const statusStyles = {
  available: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 cursor-pointer",
  booked: "bg-red-100 text-red-800 border-red-300 cursor-not-allowed opacity-70",
  past: "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60",
};

const SlotGrid = ({ slots, onSelectSlot, selectedSlot }) => {
  if (!slots || slots.length === 0) {
    return <p className="text-gray-500 text-sm">No slots available for this day.</p>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.startTime === slot.startTime && selectedSlot?.endTime === slot.endTime;

        return (
          <button
            key={slot.startTime}
            type="button"
            disabled={slot.status !== "available"}
            onClick={() => onSelectSlot(slot)}
            className={`text-sm font-medium border rounded-md py-2 px-1 transition ${
              statusStyles[slot.status]
            } ${isSelected ? "ring-2 ring-blue-600" : ""}`}
            title={slot.status === "booked" ? "Already booked" : slot.status === "past" ? "Time has passed" : "Available"}
          >
            {slot.startTime}
          </button>
        );
      })}
    </div>
  );
};

export default SlotGrid;