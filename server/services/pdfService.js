// services/pdfService.js
const puppeteer = require("puppeteer");

async function generateGatePassPdf(receipt) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Use 'new' for latest puppeteer version or 'true' for older
      args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for Docker/some environments
    });
    const page = await browser.newPage();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Pass Receipt - ${receipt.approvalId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .receipt-container {
              border: 1px solid #eee;
              padding: 30px;
              max-width: 800px;
              margin: 0 auto;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              background-color: #fff;
            }
            .receipt-header { 
              text-align: center; 
              border-bottom: 2px solid #333; 
              padding-bottom: 15px; 
              margin-bottom: 20px;
            }
            .receipt-header h1 { 
              color: #4CAF50; 
              margin: 0; 
              font-size: 28px;
            }
            .receipt-body { margin: 20px 0; }
            .school-info { text-align: center; margin-bottom: 20px; }
            .school-info h2 { margin: 5px 0; color: #555; }
            .school-info p { font-size: 0.9em; color: #777; }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px 30px;
              margin-bottom: 25px;
            }
            .info-item {
              padding: 5px 0;
              border-bottom: 1px dashed #ddd;
            }
            .info-item:last-child, .info-item:nth-last-child(2) {
                border-bottom: none; /* No border for last two items in grid */
            }
            .info-item strong { color: #555; display: block; margin-bottom: 3px; font-size: 0.9em; }
            .approval-stamp { 
              text-align: center; 
              margin: 30px 0; 
              border: 3px dashed #4CAF50; 
              padding: 20px; 
              color: #4CAF50; 
              font-size: 2em; 
              font-weight: bold;
              transform: rotate(-5deg);
              display: inline-block;
              position: relative;
              left: 50%;
              transform: translateX(-50%) rotate(-5deg);
            }
            .important-note { 
              background: #f0f8ff; 
              padding: 15px; 
              border-left: 5px solid #007bff; 
              color: #333; 
              font-size: 0.9em;
              margin-top: 30px;
            }
            .important-note p { margin: 0; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h1>Gate Pass Receipt</h1>
              <p><strong>Approval ID:</strong> ${receipt.approvalId}</p>
            </div>
            
            <div class="receipt-body">
              <div class="school-info">
                <h2>NEC College of Engineering & Technology</h2>
                <p>Kovilpatti, Thoothukudi - 628503</p>
                <p>Website: www.nec.edu.in | Email: info@nec.edu.in</p>
              </div>
              
              <div class="info-grid">
                <div class="info-item"><strong>Student Name:</strong> ${
                  receipt.name
                }</div>
                <div class="info-item"><strong>Department:</strong> ${
                  receipt.dpmt
                }</div>
                <div class="info-item"><strong>Year:</strong> ${
                  receipt.year
                }</div>
                <div class="info-item"><strong>Date of Leave:</strong> ${new Date(
                  receipt.date
                ).toLocaleDateString()}</div>
                <div class="info-item"><strong>Departure Time:</strong> ${
                  receipt.time
                } ${receipt.ampm || ""}</div>
                <div class="info-item"><strong>Return Time:</strong> ${
                  receipt.returnTime
                    ? receipt.returnTime + " " + (receipt.returnampm || "")
                    : "Not specified"
                }</div>
                <div class="info-item full-width"><strong>Purpose:</strong> ${
                  receipt.purpose
                }</div>
              </div>
              
              <div class="info-grid">
                <div class="info-item"><strong>Tutor Approval:</strong> ${
                  receipt.tutor
                }</div>
                <div class="info-item"><strong>HOD Approval Date:</strong> ${new Date(
                  receipt.hodApprovalDate
                ).toLocaleString()}</div>
                <div class="info-item"><strong>Approved By HOD:</strong> ${
                  receipt.hodName || "N/A"
                }</div>
                <div class="info-item"><strong>Generated On:</strong> ${new Date(
                  receipt.approvalDate
                ).toLocaleString()}</div>
              </div>
              
              <div class="approval-stamp">
                APPROVED
              </div>
              
              <div class="important-note">
                <p><strong>Important:</strong> This gate pass must be presented at the gate when leaving and returning to campus. Unauthorized use is prohibited.</p>
                <p>For any queries, please contact your department office.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" }); // Wait for page to load completely
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true, // Crucial for background colors/images
      margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    });

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error("Failed to generate PDF document.");
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { generateGatePassPdf };
