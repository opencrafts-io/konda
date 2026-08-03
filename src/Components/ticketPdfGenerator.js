// Components/PurchaseTicket/ticketPdfGenerator.js
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generate GoQR API URL for rendering QR codes
 */
export function generateGoQrUrl(url, size = 300, color = "111827") {
  const encodedData = encodeURIComponent(url);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&color=${color}&format=png`;
}

/**
 * Generate PDF from HTML content for ticket
 */
export const generateTicketPDF = async ({
  element = null,
  htmlContent = null,
  filename = 'ticket.pdf',
  options = {}
}) => {
  let targetElement = element;
  let tempContainer = null;

  if (htmlContent && !element) {
    tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: 720px;
      padding: 0;
      background: #f4f5f7;
      font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      z-index: -1;
    `;
    tempContainer.innerHTML = htmlContent;
    document.body.appendChild(tempContainer);
    targetElement = tempContainer;
  }

  if (!targetElement) {
    throw new Error('Either element or htmlContent must be provided');
  }

  try {
    const loadingOverlay = createLoadingOverlay();
    document.body.appendChild(loadingOverlay);

    const canvas = await html2canvas(targetElement, {
      scale: options.scale || 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: options.backgroundColor || '#f4f5f7',
      windowWidth: 720,
      height: targetElement.scrollHeight,
      windowHeight: targetElement.scrollHeight,
      ...options
    });

    document.body.removeChild(loadingOverlay);

    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions based on canvas aspect ratio to fit content height exactly
    const pdfWidth = 210; // Standard A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'l' : 'p',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);

  } catch (error) {
    throw error;
  } finally {
    if (tempContainer && tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
  }
};

const createLoadingOverlay = () => {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    color: white;
    font-family: system-ui, sans-serif;
  `;
  overlay.innerHTML = `
    <div style="text-align: center;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.2); border-top: 3px solid #F5A623; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 12px;"></div>
      <p style="font-weight: 500; font-size: 14px; letter-spacing: 0.5px;">Generating Boarding Passes...</p>
    </div>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  `;
  return overlay;
};

export const buildTicketHTML = ({ bookingReference, passengerDetails, trip, totalAmount, formatDate }) => {
  const currentDate = new Date().toLocaleString();
  const departureTime = new Date(trip.departure_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const arrivalTime = new Date(trip.arrival_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const farePerPassenger = (totalAmount - 2.50) / passengerDetails.length;
  
  // SGR Signature Colors
  const themeAccent = '#F5A623'; // Golden Yellow
  const themeDark = '#111827';   // Dark Slate/Black
  
  const ticketsHTML = passengerDetails.map((p) => {
    const qrPayload = JSON.stringify({
      ref: bookingReference.slice(0,8),
      seat: p.seat_number,
      passenger: p.passenger_name,
      route: `${trip.departure_location}-${trip.arrival_location}`
    });

    const qrUrl = generateGoQrUrl(qrPayload, 220, "111827");

    return `
      <div style="display: flex; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-bottom: 12px; border: 1px solid #e2e8f0; height: 180px;">
        
        <!-- Main Ticket Body (Left) -->
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          
          <!-- Compact Header -->
          <div style="background: ${themeAccent}; padding: 6px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${themeDark};">
            <h1 style="color: ${themeDark}; font-size: 13px; font-weight: 800; margin: 0; letter-spacing: 0.5px; text-transform: uppercase;">
              ${trip.vehicle?.operator_name || "EXPRESS RAILWAY"}
            </h1>
            <span style="font-size: 10px; font-weight: 700; color: ${themeDark}; text-transform: uppercase;">BOARDING PASS</span>
          </div>

          <!-- Compact Ticket Info Grid -->
          <div style="padding: 10px 16px; display: flex; gap: 14px; flex: 1; align-items: center;">
            
            <!-- Route Column -->
            <div style="flex: 1.2;">
              <div>
                <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600; line-height: 1;">Departure</div>
                <div style="font-size: 16px; font-weight: 800; color: ${themeDark}; text-transform: uppercase; line-height: 1.2;">${trip.departure_location}</div>
                <div style="display: flex; align-items: baseline; gap: 6px; margin-top: 2px;">
                  <span style="font-size: 14px; font-weight: 700; color: #d97706;">${departureTime}</span>
                  <span style="font-size: 10px; color: #475569; font-weight: 500;">${formatDate(trip.departure_time)}</span>
                </div>
              </div>

              <div style="margin: 4px 0 4px 4px; font-size: 10px; color: #94a3b8; line-height: 1;">↓</div>

              <div>
                <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600; line-height: 1;">Arrival</div>
                <div style="font-size: 16px; font-weight: 800; color: ${themeDark}; text-transform: uppercase; line-height: 1.2;">${trip.arrival_location}</div>
                <div style="display: flex; align-items: baseline; gap: 8px;">
                  <span style="font-size: 14px; font-weight: 700; color: #d97706;">${arrivalTime}</span>
                  <span style="font-size: 10px; color: #475569; font-weight: 500;">${formatDate(trip.arrival_time)}</span>
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div style="width: 1px; height: 80%; background: #e2e8f0;"></div>

            <!-- Passenger Column -->
            <div style="flex: 1.5; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
              <div>
                <div style="font-size: 9px; color: #64748b; text-transform: uppercase; font-weight: 600; line-height: 1;">Passenger</div>
                <div style="font-size: 14px; font-weight: 700; color: ${themeDark}; text-transform: uppercase; margin-top: 2px;">${p.passenger_name}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 1px;">ID/Phone: ${p.contact}</div>
              </div>
              
              <div style="display: flex; gap: 16px; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 6px;">
                <div>
                  <div style="font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: 600;">Vehicle / Train</div>
                  <div style="font-size: 12px; font-weight: 700; color: ${themeDark};">${trip.vehicle?.registration_number || trip.vehicle?.vehicle_type || "N/A"}</div>
                </div>
                <div>
                  <div style="font-size: 8px; color: #64748b; text-transform: uppercase; font-weight: 600;">Seat</div>
                  <div style="font-size: 15px; font-weight: 900; color: #dc2626;">${p.seat_number}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Printable Stub (Right) -->
        <div style="width: 160px; border-left: 2px dashed #cbd5e1; background: #fafafa; display: flex; flex-direction: column; position: relative;">
          <!-- Perforation cutouts -->
          <div style="position: absolute; top: -8px; left: -8px; width: 14px; height: 14px; background: #f4f5f7; border-radius: 50%; border-bottom: 1px solid #e2e8f0;"></div>
          <div style="position: absolute; bottom: -8px; left: -8px; width: 14px; height: 14px; background: #f4f5f7; border-radius: 50%; border-top: 1px solid #e2e8f0;"></div>
          
          <div style="background: ${themeDark}; color: ${themeAccent}; padding: 6px; text-align: center; font-weight: 700; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
            SCAN TO BOARD
          </div>
          
          <div style="padding: 8px; display: flex; flex-direction: column; align-items: center; justify-content: space-between; flex: 1;">
            <!-- Larger, dominant QR code -->
            <div style="width: 110px; height: 110px; display: flex; justify-content: center; align-items: center;">
              <img src="${qrUrl}" alt="Boarding QR Code" style="width: 100%; height: 100%; object-fit: contain;" crossOrigin="anonymous" />
            </div>
            
            <div style="display: flex; width: 100%; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 4px;">
               <div>
                 <div style="font-size: 8px; color: #64748b; text-transform: uppercase;">PNR</div>
                 <div style="font-size: 10px; font-weight: 800; color: ${themeDark};">${bookingReference.slice(0,8)}</div>
               </div>
               <div style="text-align: right;">
                 <div style="font-size: 8px; color: #64748b; text-transform: uppercase;">Seat</div>
                 <div style="font-size: 13px; font-weight: 900; color: #dc2626;">${p.seat_number}</div>
               </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!-- Top padding set to 0px -->
    <div style="background: #f4f5f7; padding: 0px 0px 8px 0px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 720px; margin: 0 auto;">
      
      <!-- Generated Passes -->
      ${ticketsHTML}

      <!-- Compact Payment Summary & Terms -->
      <div style="background: #ffffff; border-radius: 6px; padding: 12px 16px; border: 1px solid #e2e8f0; display: flex; gap: 20px; margin-top: 8px;">
        <div style="flex: 2;">
          <h3 style="margin: 0 0 6px 0; font-size: 11px; color: ${themeDark}; text-transform: uppercase; letter-spacing: 0.5px;">Terms & Conditions</h3>
          <ul style="margin: 0; padding-left: 14px; font-size: 9px; color: #64748b; line-height: 1.4;">
            <li>Please arrive at the station at least 60 minutes prior to departure.</li>
            <li>Present this ticket alongside a valid National ID or Passport.</li>
            <li>Tickets are strictly non-transferable and non-refundable post-departure.</li>
          </ul>
        </div>
        
        <div style="flex: 1; border-left: 1px solid #e2e8f0; padding-left: 20px;">
          <h3 style="margin: 0 0 6px 0; font-size: 11px; color: ${themeDark}; text-transform: uppercase; letter-spacing: 0.5px;">Payment Summary</h3>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-bottom: 4px;">
            <span>Subtotal (${passengerDetails.length} Seats)</span>
            <span style="font-weight: 600; color: ${themeDark};">KSh ${(totalAmount - 2.50).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; margin-bottom: 6px;">
            <span>Booking Fee</span>
            <span style="font-weight: 600; color: ${themeDark};">KSh 2.50</span>
          </div>
          <div style="border-top: 1px solid ${themeDark}; padding-top: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 800; font-size: 11px; color: ${themeDark}; text-transform: uppercase;">Total Paid</span>
            <span style="font-weight: 800; font-size: 14px; color: ${themeAccent};">KSh ${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; margin-top: 10px; font-size: 9px; color: #94a3b8;">
        Generated on ${currentDate} • Thank you for traveling with us.
      </div>

    </div>
  `;
};

export default {
  generateGoQrUrl,
  generateTicketPDF,
  buildTicketHTML
};