
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export const generateSchedulePDF = (schedules) => {
  if (!schedules || schedules.length === 0) {
    alert("No schedules available to generate PDF.");
    return;
  }

  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("Bus Schedule Report", 14, 22);

  // Date
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = schedules.map((s) => [
    s.from,
    s.to,
    s.date ? new Date(s.date).toLocaleDateString() : "",
    s.departureTime,
    s.arrivalTime,
    s.bus?.busNo || "N/A",
    s.driver?.name || "Not Assigned",
    `Rs. ${s.price}`,
    s.active ? "Active" : "Inactive",
  ]);

  // ✅ Use the standalone autoTable function, passing doc as the first argument
  autoTable(doc, {
    head: [["From","To","Date","Departure","Arrival","Bus No","Driver","Price","Status"]],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 15 },
      6: { cellWidth: 25 },
      7: { cellWidth: 20 },
      8: { cellWidth: 15 },
    },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`bus-schedule-${new Date().toISOString().split("T")[0]}.pdf`);
};
