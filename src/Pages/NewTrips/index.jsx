import React, { useState, useContext, useEffect } from "react";
import style from "./index.module.css";
import { useNavigate } from "react-router-dom";
import { 
  FaBus, 
  FaMapMarkerAlt, 
  FaClock, 
  FaArrowLeft,
  FaChair,
  FaPlus,
  FaMinus,
  FaSync,
  FaTh,
  FaChair as FaSeatIcon
} from "react-icons/fa";
import { GiSteeringWheel } from "react-icons/gi";
import Layout from "../../Layout/index.jsx";
import { LoginContext } from "../../loginContext";
import { PosthData } from "../../Components/titan.js";

const AddTrip = () => {
  const navigate = useNavigate();
  const { access_token } = useContext(LoginContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Trip Form State
  const [tripData, setTripData] = useState({
    departure_location: "Nairobi (CBD - Tea Room)",
    arrival_location: "Nakuru (Main Stage)",
    departure_time: "",
    arrival_time: "",
    base_price: 500,
    status: "SCHEDULED",
    vehicle: {
      operator_name: "",
      vehicle_type: "MATATU",
      service_class: "STANDARD",
      registration_number: ""
    }
  });

  // Seat Configuration Setup
  const [seatConfig, setSeatConfig] = useState({
    rows: 11,
    columns: ["A", "B", "C"],
    aisleAfterColumn: "B",
    rowOverrides: {
      "1": { price: 600 },
      "11": { price: 450 }
    }
  });

  // Dedicated string state to allow natural comma typing
  const [columnInputText, setColumnInputText] = useState("A, B, C");
  const [seats, setSeats] = useState([]);

  const vehicleTypes = ["MATATU", "MINIBUS", "BUS", "COACH"];
  const serviceClasses = ["STANDARD", "AC", "VIP", "LUXURY"];

  /**
   * Handle changes to the Column text input gracefully
   */
  const handleColumnTextChange = (e) => {
    const rawVal = e.target.value;
    setColumnInputText(rawVal); // Keeps the user's live typing (including commas)

    // Parse non-empty, unique upper-case column names
    const parsedCols = rawVal
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);

    if (parsedCols.length > 0) {
      setSeatConfig((prev) => ({
        ...prev,
        columns: parsedCols
      }));
    }
  };

  const determineSeatType = (colIndex, totalCols) => {
    if (colIndex === 0 || colIndex === totalCols - 1) {
      return "WINDOW";
    }
    if (totalCols === 3 && colIndex === 1) {
      return "AISLE";
    }
    return "MIDDLE";
  };

  const generateSeats = () => {
    const generated = [];
    const basePrice = Number(tripData.base_price) || 500;
    const { rows, columns, rowOverrides } = seatConfig;

    for (let row = 1; row <= rows; row++) {
      columns.forEach((col, colIdx) => {
        const seatNum = `${row}${col}`;
        const seatType = determineSeatType(colIdx, columns.length);
        
        let seatPrice = basePrice;
        if (rowOverrides[row] && rowOverrides[row].price !== undefined) {
          seatPrice = Number(rowOverrides[row].price);
        }

        generated.push({
          seat_number: seatNum,
          seat_row: row,
          seat_column: col,
          seat_type: seatType,
          price: seatPrice,
          is_available: true
        });
      });
    }
    setSeats(generated);
  };

  const handleTripChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("vehicle.")) {
      const field = name.split(".")[1];
      setTripData((prev) => ({
        ...prev,
        vehicle: { ...prev.vehicle, [field]: value }
      }));
    } else {
      setTripData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRowPriceChange = (row, price) => {
    const numericPrice = Number(price);
    setSeatConfig((prev) => ({
      ...prev,
      rowOverrides: {
        ...prev.rowOverrides,
        [row]: { price: numericPrice }
      }
    }));

    setSeats((prev) =>
      prev.map((s) => (s.seat_row === row ? { ...s, price: numericPrice } : s))
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const cleanSeats = seats.map(({ is_available, ...seat }) => ({
        seat_number: seat.seat_number,
        seat_row: seat.seat_row,
        seat_column: seat.seat_column,
        seat_type: seat.seat_type,
        price: parseFloat(seat.price)
      }));

      const payload = {
        vehicle_id: "1217cae8-8062-4e78-87d2-816d88b3109f",
        departure_location: tripData.departure_location,
        arrival_location: tripData.arrival_location,
        departure_time: new Date(tripData.departure_time).toISOString(),
        arrival_time: new Date(tripData.arrival_time).toISOString(),
        base_price: parseFloat(tripData.base_price),
        status: tripData.status,
        seats: cleanSeats
      };

      console.log("Submitting Payload:", JSON.stringify(payload, null, 2));
      // await PosthData(access_token, "trips/create", payload);

      navigate("/trips");
    } catch (err) {
      setError(err.message || "Failed to submit trip configuration");
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 1: ROUTE & VEHICLE DETAILS ---
  const renderStepOne = () => (
    <div className={style.tripForm}>
      <h2>Trip & Vehicle Parameters</h2>
      <p className={style.subtitle}>Set origin, destination, schedules, and base pricing</p>

      <div className={style.formGrid}>
        <div className={style.formSection}>
          <h3><FaMapMarkerAlt /> Route Information</h3>
          <div className={style.formRowTriple}>
            <div className={style.formGroup}>
              <label>Departure Location</label>
              <input
                type="text"
                name="departure_location"
                value={tripData.departure_location}
                onChange={handleTripChange}
                required
              />
            </div>
            <div className={style.formGroup}>
              <label>Arrival Location</label>
              <input
                type="text"
                name="arrival_location"
                value={tripData.arrival_location}
                onChange={handleTripChange}
                required
              />
            </div>
            <div className={style.formGroup}>
              <label>Base Price (KSh)</label>
              <input
                type="number"
                name="base_price"
                value={tripData.base_price}
                onChange={handleTripChange}
                required
              />
            </div>
          </div>
        </div>

        <div className={style.formSection}>
          <h3><FaClock /> Schedule</h3>
          <div className={style.formRow}>
            <div className={style.formGroup}>
              <label>Departure Time</label>
              <input
                type="datetime-local"
                name="departure_time"
                value={tripData.departure_time}
                onChange={handleTripChange}
                required
              />
            </div>
            <div className={style.formGroup}>
              <label>Arrival Time</label>
              <input
                type="datetime-local"
                name="arrival_time"
                value={tripData.arrival_time}
                onChange={handleTripChange}
                required
              />
            </div>
          </div>
        </div>

        <div className={style.formSection}>
          <h3><FaBus /> Vehicle Details</h3>
          <div className={style.formRowFour}>
            <div className={style.formGroup}>
              <label>Operator Name</label>
              <input
                type="text"
                name="vehicle.operator_name"
                value={tripData.vehicle.operator_name}
                onChange={handleTripChange}
                placeholder="e.g. 237 Sacco"
              />
            </div>
            <div className={style.formGroup}>
              <label>Registration Number</label>
              <input
                type="text"
                name="vehicle.registration_number"
                value={tripData.vehicle.registration_number}
                onChange={handleTripChange}
                placeholder="e.g. KDA 123X"
              />
            </div>
            <div className={style.formGroup}>
              <label>Vehicle Type</label>
              <select
                name="vehicle.vehicle_type"
                value={tripData.vehicle.vehicle_type}
                onChange={handleTripChange}
              >
                {vehicleTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className={style.formGroup}>
              <label>Service Class</label>
              <select
                name="vehicle.service_class"
                value={tripData.vehicle.service_class}
                onChange={handleTripChange}
              >
                {serviceClasses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={style.formActions}>
        <button className={style.cancelBtn} onClick={() => navigate("/trips")}>Cancel</button>
        <button
          className={style.nextBtn}
          onClick={() => {
            if (!tripData.departure_location || !tripData.arrival_location || !tripData.departure_time) {
              alert("Please fill in required schedule and route fields.");
              return;
            }
            generateSeats();
            setCurrentStep(2);
          }}
        >
          Next: Layout & Pricing
        </button>
      </div>
    </div>
  );

  // --- STEP 2: SEAT LAYOUT & PRICING ---
  const renderStepTwo = () => (
    <div className={style.seatLayoutContainer}>
      <h2>Vehicle Seat Layout Setup</h2>
      <p className={style.subtitle}>Define layout grid parameters and row-specific pricing overrides</p>

      {/* Grid Controls */}
      <div className={style.layoutControls}>
        <div className={style.controlGroup}>
          <label>Total Rows</label>
          <div className={style.rowControls}>
            <button
              className={style.miniBtn}
              onClick={() => setSeatConfig((p) => ({ ...p, rows: Math.max(1, p.rows - 1) }))}
            >
              <FaMinus />
            </button>
            <span className={style.rowVal}>{seatConfig.rows}</span>
            <button
              className={style.miniBtn}
              onClick={() => setSeatConfig((p) => ({ ...p, rows: p.rows + 1 }))}
            >
              <FaPlus />
            </button>
          </div>
        </div>

        <div className={style.controlGroup}>
          <label>Columns</label>
          <input
            type="text"
            value={columnInputText}
            onChange={handleColumnTextChange}
            placeholder="e.g. A, B, C"
            className={style.columnInput}
          />
        </div>

        <div className={style.controlGroup}>
          <label>Aisle After</label>
          <select
            value={seatConfig.aisleAfterColumn}
            onChange={(e) => setSeatConfig((p) => ({ ...p, aisleAfterColumn: e.target.value }))}
            className={style.selectInput}
          >
            {seatConfig.columns.map((col) => (
              <option key={col} value={col}>Column {col}</option>
            ))}
            <option value="NONE">None</option>
          </select>
        </div>

        <div className={style.controlActionsGroup}>
          <button className={style.regenerateBtn} onClick={generateSeats}>
            <FaSync /> Apply Layout
          </button>

          <div className={style.totalSeatsBadge}>
            <FaSeatIcon className={style.seatIconBadge} />
            <span>Total Seats: <strong>{seats.length || seatConfig.rows * seatConfig.columns.length}</strong></span>
          </div>
        </div>
      </div>

      <div className={style.builderGrid}>
        {/* Left Column: Visual Bus Representation */}
        <div className={style.busContainer}>
          <div className={style.busHeader}>
            <GiSteeringWheel className={style.steeringWheel} />
            <span>Driver Cabin</span>
          </div>

          <div className={style.busBody}>
            {Array.from({ length: seatConfig.rows }, (_, i) => i + 1).map((row) => {
              const rowSeats = seats.filter((s) => s.seat_row === row);
              return (
                <div key={row} className={style.busRow}>
                  <span className={style.rowTag}>{row}</span>
                  <div className={style.rowSeatsGroup}>
                    {seatConfig.columns.map((col) => {
                      const seat = rowSeats.find((s) => s.seat_column === col);
                      const isAisle = seatConfig.aisleAfterColumn === col;

                      return (
                        <React.Fragment key={col}>
                          <div
                            className={`${style.seatCard} ${
                              seat?.seat_type === "WINDOW" ? style.windowSeat : ""
                            }`}
                          >
                            <FaChair />
                            <span className={style.seatNum}>{seat?.seat_number || `${row}${col}`}</span>
                            <span className={style.seatPriceTag}>KSh {seat?.price || tripData.base_price}</span>
                          </div>
                          {isAisle && <div className={style.aisleGap}>AISLE</div>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Row Price Overrides */}
        <div className={style.pricingPanel}>
          <h3><FaTh /> Row Price Configuration</h3>
          <p className={style.panelHint}>Customize individual row prices (e.g. VIP front seats or discounted rear seats).</p>

          <div className={style.pricingTable}>
            <div className={style.pricingHeader}>
              <span>Row</span>
              <span>Seats</span>
              <span>Price (KSh)</span>
            </div>
            <div className={style.pricingRowsList}>
              {Array.from({ length: seatConfig.rows }, (_, i) => i + 1).map((row) => {
                const currentPrice =
                  seatConfig.rowOverrides[row]?.price !== undefined
                    ? seatConfig.rowOverrides[row].price
                    : tripData.base_price;

                return (
                  <div key={row} className={style.pricingRowItem}>
                    <span className={style.rowLabel}>Row {row}</span>
                    <span className={style.seatListLabel}>
                      {seatConfig.columns.map((c) => `${row}${c}`).join(", ")}
                    </span>
                    <input
                      type="number"
                      value={currentPrice}
                      onChange={(e) => handleRowPriceChange(row, e.target.value)}
                      className={style.rowPriceInput}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className={style.formActions}>
        <button className={style.backBtn} onClick={() => setCurrentStep(1)}>
          Back
        </button>
        <button
          className={style.submitBtn}
          onClick={handleSubmit}
          disabled={loading || seats.length === 0}
        >
          {loading ? "Saving..." : "Create Trip"}
        </button>
      </div>

      {error && <div className={style.errorMessage}>{error}</div>}
    </div>
  );

  return (
    <Layout>
      <div className={style.addTrip}>
        <div className={style.addTripContent}>
          <div className={style.header}>
            <button className={style.backButton} onClick={() => navigate("/trips")}>
              <FaArrowLeft /> Back to Trips
            </button>
            <div className={style.stepIndicator}>
              <span className={`${style.step} ${currentStep >= 1 ? style.active : ""}`}>1. Details</span>
              <span className={style.stepLine}></span>
              <span className={`${style.step} ${currentStep >= 2 ? style.active : ""}`}>2. Layout & Seats</span>
            </div>
          </div>

          <div className={style.addTripBody}>
            {currentStep === 1 && renderStepOne()}
            {currentStep === 2 && renderStepTwo()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AddTrip;