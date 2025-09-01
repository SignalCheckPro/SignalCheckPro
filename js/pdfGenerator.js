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
            ['Alimentación', instrumentData.power], ['Rango', `${instrumentData.lrv} a ${instrumentData.urv} ${instrumentData.pvUnit}`],
            ['Tolerancia Aceptada', `± ${errorThreshold.toFixed(3)} ${instrumentData.pvUnit} (${instrumentData.tolerance}%)`],
            ['Equipo de Calibración', instrumentData.calibrator], ['Técnico', instrumentData.technician]
        ],
        theme: 'striped', headStyles: { fillColor: [42, 56, 76] }, margin: { left: 14, right: 14 }
    });

    let finalY = doc.lastAutoTable.finalY;
    
    // --- Resultados de la Prueba ---
    doc.setFontSize(12);
    doc.text("2. Resultados de la Prueba de 5 Puntos", 14, finalY + 10);
    
    const tableBody = calibrationData.ideal.map((ideal, index) => [
        `${index * 25}%`,
        parseFloat(ideal.toPrecision(6)),
        parseFloat(calibrationData.measured[index].toPrecision(6)),
        parseFloat(calibrationData.errors[index].toPrecision(6))
    ]);

    doc.autoTable({
        startY: finalY + 13,
        head: [['Punto', `Ideal (${instrumentData.pvUnit})`, `Medido (${instrumentData.pvUnit})`, `Error (${instrumentData.pvUnit})`]],
        body: tableBody,
        theme: 'grid', headStyles: { fillColor: [42, 56, 76] }, margin: { left: 14, right: 14 },
        didDrawCell: (data) => {
            if (data.column.index === 3 && data.cell.section === 'body') {
                const errorValue = Math.abs(parseFloat(data.cell.text[0]));
                const failColor = [220, 53, 69];
                const okColor = [40, 167, 69];
                const isFail = errorValue > errorThreshold;
                
                doc.setFillColor(...(isFail ? failColor : okColor));
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                doc.setTextColor(255, 255, 255);
                doc.text(data.cell.text[0], data.cell.x + data.cell.padding('left'), data.cell.y + data.cell.height / 2, { baseline: 'middle' });
            }
        }
    });

    finalY = doc.lastAutoTable.finalY;

    // --- Conclusión ---
    doc.setFontSize(12);
    doc.text("3. Conclusión", 14, finalY + 10);
    doc.setFontSize(11);
    doc.setTextColor(isApproved ? 40 : 220, isApproved ? 167 : 53, isApproved ? 69 : 69);
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
    doc.text("_________________________", 14, pageHeight - 30);
    doc.text(`Firma del Técnico: ${instrumentData.technician}`, 14, pageHeight - 25);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("La validez de este reporte está sujeta a las condiciones del instrumento al momento de la prueba.", doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: "center" });

    doc.save(`Reporte_Calibracion_${instrumentData.tag}.pdf`);
}
