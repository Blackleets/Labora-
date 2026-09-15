
import { Person } from '../../people/types';

export const reportService = {
  generatePersonReport: (person: Person): void => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para generar el informe.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe_${person.nombre.replace(/\s+/g, '_')}_${person.dni}</title>
        <style>
          body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #2D6CDF; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 24px; font-weight: bold; color: #1A1A1A; }
          .logo span { color: #2D6CDF; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .field { margin-bottom: 15px; }
          .label { font-size: 10px; font-weight: bold; color: #888; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 14px; font-weight: 500; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          .footer { margin-top: 50px; font-size: 10px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .active { background: #e6fffa; color: #276749; }
          .risk { background: #fff5f5; color: #c53030; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Labora<span>+</span></div>
          <div style="text-align: right;">
            <div class="title">Informe de Perfil</div>
            <div class="subtitle">Generado el ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="grid">
          <div class="field">
            <div class="label">Nombre Completo</div>
            <div class="value">${person.nombre}</div>
          </div>
          <div class="field">
            <div class="label">Documento ID</div>
            <div class="value">${person.dni}</div>
          </div>
          <div class="field">
            <div class="label">Email</div>
            <div class="value">${person.email}</div>
          </div>
          <div class="field">
            <div class="label">Teléfono</div>
            <div class="value">${person.telefono || 'No registrado'}</div>
          </div>
          <div class="field">
            <div class="label">País Fiscal</div>
            <div class="value">${person.pais}</div>
          </div>
          <div class="field">
            <div class="label">Tipo de Usuario</div>
            <div class="value" style="text-transform: capitalize;">${person.tipo}</div>
          </div>
        </div>

        <div class="field">
          <div class="label">Estado Actual</div>
          <div class="value" style="border: none;">
            <span class="badge ${person.estado === 'activo' ? 'active' : 'risk'}">
              ${person.estado === 'activo' ? 'ACTIVO' : 'EN RIESGO'}
            </span>
          </div>
        </div>

        <div class="field">
          <div class="label">Fecha de Registro</div>
          <div class="value">${new Date(person.fechaCreacion).toLocaleString()}</div>
        </div>

        <div class="footer">
          Este documento es un informe generado automáticamente por el sistema Labora+ Core.<br>
          Confidencial - Solo para uso interno.
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
