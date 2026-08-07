export interface InvoiceData {
  invoiceId: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  amountCents: number;
  currency: string;
  date: string;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const formattedAmount = (data.amountCents / 100).toFixed(2);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${data.invoiceId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #111; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .title { font-size: 24px; font-weight: bold; }
          .details { margin-top: 30px; line-height: 1.6; }
          .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          .table th, .table td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
          .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">ToneCraft AI</div>
            <div>Invoice #${data.invoiceId}</div>
          </div>
          <div>Date: ${data.date}</div>
        </div>
        <div class="details">
          <strong>Billed To:</strong><br />
          ${data.customerName}<br />
          ${data.customerEmail}
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ToneCraft Subscription (${data.planName})</td>
              <td>$${formattedAmount} ${data.currency.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>
        <div class="total">
          Total Paid: $${formattedAmount} ${data.currency.toUpperCase()}
        </div>
      </body>
    </html>
  `;
}
