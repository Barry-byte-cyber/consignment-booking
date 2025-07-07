
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

const MAX_ITEMS_PER_DAY = 80;

const initialForm = {
  name: "",
  email: "",
  phone: "",
  account: "",
  date: "",
  items: 1,
};

const BookingForm = () => {
  const [form, setForm] = useState(initialForm);
  const [bookedItems, setBookedItems] = useState({});
  const [bookings, setBookings] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [cancelId, setCancelId] = useState("");

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("bookings")) || [];
    const totals = stored.reduce((acc, b) => {
      acc[b.date] = (acc[b.date] || 0) + b.items;
      return acc;
    }, {});
    setBookings(stored);
    setBookedItems(totals);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "items" ? Number(value) : value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentTotal = bookedItems[form.date] || 0;
    if (currentTotal + form.items > MAX_ITEMS_PER_DAY) {
      setError("Cannot book — daily item limit reached or exceeded.");
      return;
    }
    const id = uuidv4();
    const newBooking = { ...form, id };
    const updatedBookings = [...bookings, newBooking];
    localStorage.setItem("bookings", JSON.stringify(updatedBookings));
    const updatedTotal = currentTotal + form.items;
    setBookings(updatedBookings);
    setBookedItems({ ...bookedItems, [form.date]: updatedTotal });
    setSubmitted(true);
    setError("");
    setForm(initialForm);
    setCancelId(id);
  };

  const handleCancel = () => {
    const filtered = bookings.filter((b) => b.id !== cancelId);
    const totals = filtered.reduce((acc, b) => {
      acc[b.date] = (acc[b.date] || 0) + b.items;
      return acc;
    }, {});
    localStorage.setItem("bookings", JSON.stringify(filtered));
    setBookings(filtered);
    setBookedItems(totals);
    setCancelId("");
    setSubmitted(false);
  };

  const isDateFull = (dateStr) => (bookedItems[dateStr] || 0) >= MAX_ITEMS_PER_DAY;

  const getNext6Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const next = new Date(today);
      next.setDate(today.getDate() + i);
      if (next.getDay() !== 0) {
        const dateStr = format(next, "yyyy-MM-dd");
        dates.push({ label: format(next, "EEEE, MMM d"), value: dateStr, disabled: isDateFull(dateStr) });
      }
    }
    return dates;
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Consignment Booking</h2>
      {submitted && (
        <div className="mb-4">
          <p className="text-green-600">Booking successful!</p>
          <p className="text-sm">Save this cancellation ID: <code>{cancelId}</code></p>
          <button className="mt-2" onClick={handleCancel}>Cancel This Booking</button>
        </div>
      )}
      {error && <p className="text-red-600 mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Phone Number</label>
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </div>
        <div>
          <label>Account Number (optional)</label>
          <input name="account" value={form.account} onChange={handleChange} />
        </div>
        <div>
          <label>Select Date</label>
          <select name="date" value={form.date} onChange={handleChange} required>
            <option value="">-- Select a Date --</option>
            {getNext6Days().map((d) => (
              <option key={d.value} value={d.value} disabled={d.disabled}>
                {d.label} {d.disabled ? "(Full)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Number of Clothing Items</label>
          <input type="number" name="items" min={1} max={80} value={form.items} onChange={handleChange} required />
        </div>
        <button type="submit">Book Appointment</button>
      </form>
    </div>
  );
};

export default BookingForm;
