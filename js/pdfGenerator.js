/**
 * Genera un reporte PDF con los datos de la calibración.
 * @param {object} state - El estado completo de la aplicación.
 * @param {Chart} chartInstance - La instancia del gráfico de Chart.js.
 */
export function generatePDF(state, chartInstance) {
    const { instrumentData, calibrationData, isApproved, errorThreshold, equation } = state;
    const { jsPDF } = window.jspdf;
    
    // Configurado para tamaño CARTA y unidades en mm
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

    // --- Encabezado ---
    doc.setFontSize(18);
    doc.text("Reporte de Calibración de Instrumento", doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });
    doc.setFontSize(9);
    doc.text(`Fecha: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() / 2, 21, { align: "center" });

    // --- Datos del Ensayo ---
    doc.setFontSize(12);
    doc.text("1. Datos del Ensayo", 14, 30);
    doc.autoTable({
        startY: 33,
        head: [['Parámetro', 'Valor']],
        body: [
            ['TAG', instrumentData.tag], ['Marca', instrumentData.brand], ['Modelo', instrumentData.model],
            ['Alimentación', instrumentData.power], ['Tipo', instrumentData.type],
            ['Unidad', instrumentData.unit], ['Rango', `${instrumentData.lrv} a ${instrumentData.urv}`],
            ['Umbral de Error', `${errorThreshold}`]
        ],
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2, textColor: [33, 33, 33] },
        headStyles: { fillColor: [42, 56, 76], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    let finalY = doc.autoTable.previous.finalY + 10;
    
    // --- Puntos de Calibración ---
    doc.setFontSize(12);
    doc.text("2. Puntos de Calibración", 14, finalY);
    finalY += 3;
    doc.autoTable({
        startY: finalY,
        head: [['Punto', `Ideal (${instrumentData.unit})`, `Medido (${instrumentData.unit})`, `Error (${instrumentData.unit})`]],
        body: calibrationData.ideal.map((ideal, index) => [
            `${(index / 4) * 100}%`,
            ideal.toFixed(2),
            calibrationData.measured[index] ? calibrationData.measured[index].toFixed(2) : 'N/A',
            calibrationData.errors[index] ? calibrationData.errors[index].toFixed(2) : 'N/A'
        ]),
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2, textColor: [33, 33, 33] },
        headStyles: { fillColor: [42, 56, 76], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
    });

    finalY = doc.autoTable.previous.finalY + 10;

    // --- Resumen del Resultado ---
    doc.setFontSize(12);
    doc.text("3. Resumen del Resultado", 14, finalY);
    finalY += 5;
    const resultColor = isApproved ? [40, 167, 69] : [220, 53, 69];
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(resultColor[0], resultColor[1], resultColor[2]);
    doc.text(`Resultado: ${isApproved ? 'APROBADO' : 'RECHAZADO'}`, 14, finalY + 16);
    doc.setTextColor(0, 0, 0);
    finalY += 20;

    // --- Ecuación ---
    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.text("Ecuación de la curva 4-20mA:", 14, finalY);
    doc.text(equation.formatted, doc.internal.pageSize.getWidth() / 2, finalY + 5, { align: "center" });
    doc.setFont('helvetica', 'normal');
    finalY += 10;

    // --- Gráfico ---
    if (chartInstance) {
        doc.setFontSize(12);
        doc.text("4. Gráfico de Linealidad", 14, finalY);
        finalY += 3;
        const chartImage = chartInstance.toBase64Image();
        const pageWidth = doc.internal.pageSize.getWidth();
        const chartWidth = pageWidth - 28;
        const chartHeight = 60;
        doc.addImage(chartImage, 'PNG', 14, finalY, chartWidth, chartHeight);
    }
    
    // --- Firma y Pie de página (siempre al final) ---
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(10);
    doc.text("_________________________", 14, pageHeight - 20);
    doc.text("Firma del Técnico", 14, pageHeight - 15);
    doc.setFontSize(8);
    doc.text("Generado con SignalCheck Pro 3.0", doc.internal.pageSize.getWidth() - 14, pageHeight - 10, { align: 'right' });

    doc.save('reporte_calibracion.pdf');
}
