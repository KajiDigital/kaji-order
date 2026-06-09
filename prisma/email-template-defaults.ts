type EmailTemplateType =
  | 'order_confirmation'
  | 'new_order_alert'
  | 'refund_confirmation'

type DefaultTemplate = {
  template_type: EmailTemplateType
  subject: string
  html_body: string
}

const ORDER_CONFIRMATION_SUBJECT =
  'Order confirmed! {{order_number}} — {{restaurant_name}}'

const ORDER_CONFIRMATION_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:white;">
    <div style="background:[PRIMARY_COLOR];padding:32px;text-align:center;">
      {{#if logo_url}}
      <img src="{{logo_url}}" alt="{{restaurant_name}}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;">
      {{/if}}
      <h1 style="color:white;margin:16px 0 0;font-size:24px;">{{restaurant_name}}</h1>
    </div>

    <div style="background:[PRIMARY_COLOR]22;padding:32px;text-align:center;">
      <div style="font-size:48px;">✅</div>
      <h2 style="font-size:28px;margin:8px 0;">Order Confirmed!</h2>
      <div style="font-size:18px;color:[PRIMARY_COLOR];font-weight:bold;">{{order_number}}</div>
      <p style="color:#666;margin:8px 0 0;">{{order_date}}</p>
    </div>

    <div style="background:[PRIMARY_COLOR]11;border-left:4px solid [PRIMARY_COLOR];padding:16px;margin:0 32px 24px;border-radius:4px;">
      <strong>⏱ Estimated time: {{prep_time}} minutes</strong><br>
      <span style="color:#666;">{{order_type_message}}</span>
    </div>

    <div style="padding:24px 32px;">
      <h3 style="font-size:16px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 16px;">Your Order</h3>
      {{#each items}}
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
        <span style="font-weight:500;">{{quantity}}x {{name}}</span>
        <span style="color:[PRIMARY_COLOR];font-weight:bold;">£{{price}}</span>
      </div>
      {{/each}}
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
        <span style="color:#666;">Subtotal</span>
        <span>£{{subtotal}}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
        <span style="color:#666;">Service fee</span>
        <span>£{{service_fee}}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:16px 0;font-size:18px;font-weight:bold;">
        <span>Total</span>
        <span style="color:[PRIMARY_COLOR];">£{{total}}</span>
      </div>
    </div>

    <div style="background:#f9f9f9;padding:24px 32px;">
      <h3 style="font-size:14px;color:#666;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Order Status</h3>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" width="25%">
            <div style="width:32px;height:32px;border-radius:50%;background:[PRIMARY_COLOR];color:white;display:inline-block;line-height:32px;font-weight:bold;">✓</div>
            <p style="font-size:12px;color:#666;margin:8px 0 0;">Placed</p>
          </td>
          <td align="center" width="25%">
            <div style="width:32px;height:32px;border-radius:50%;background:#ddd;color:#999;display:inline-block;line-height:32px;font-weight:bold;">2</div>
            <p style="font-size:12px;color:#666;margin:8px 0 0;">Confirmed</p>
          </td>
          <td align="center" width="25%">
            <div style="width:32px;height:32px;border-radius:50%;background:#ddd;color:#999;display:inline-block;line-height:32px;font-weight:bold;">3</div>
            <p style="font-size:12px;color:#666;margin:8px 0 0;">Preparing</p>
          </td>
          <td align="center" width="25%">
            <div style="width:32px;height:32px;border-radius:50%;background:#ddd;color:#999;display:inline-block;line-height:32px;font-weight:bold;">4</div>
            <p style="font-size:12px;color:#666;margin:8px 0 0;">Ready</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="padding:24px 32px;">
      <h3 style="font-size:16px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 16px;">Order Details</h3>
      <p style="margin:8px 0;"><strong>Name:</strong> {{customer_name}}</p>
      <p style="margin:8px 0;"><strong>Email:</strong> {{customer_email}}</p>
      {{#if customer_phone}}
      <p style="margin:8px 0;"><strong>Phone:</strong> {{customer_phone}}</p>
      {{/if}}
      {{#if notes}}
      <p style="margin:8px 0;"><strong>Notes:</strong> {{notes}}</p>
      {{/if}}
      <p style="margin:8px 0;"><strong>Type:</strong> {{order_type}}</p>
    </div>

    <div style="padding:24px 32px;border-top:1px solid #f0f0f0;">
      <h3 style="font-size:16px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 16px;">Questions?</h3>
      <p style="color:#666;margin:8px 0;">Contact {{restaurant_name}} directly:</p>
      {{#if restaurant_phone}}
      <p style="margin:8px 0;">📞 {{restaurant_phone}}</p>
      {{/if}}
      {{#if restaurant_email}}
      <p style="margin:8px 0;">✉️ {{restaurant_email}}</p>
      {{/if}}
    </div>

    <div style="background:#1a1a1a;padding:24px 32px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:4px 0;">© {{year}} {{restaurant_name}}</p>
      <p style="color:#999;font-size:12px;margin:4px 0;">{{restaurant_address}}</p>
      {{#if show_powered_by}}
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #333;">
        <a href="https://order.kajipos.co.uk" style="color:#555;font-size:11px;text-decoration:none;">Powered by Kaji Order 🌮</a>
      </div>
      {{/if}}
    </div>
  </div>
</body>
</html>`

const NEW_ORDER_ALERT_SUBJECT = '🔔 New order! {{order_number}} — £{{total}}'

const NEW_ORDER_ALERT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:white;">
    <div style="background:linear-gradient(135deg,#dc2626,#ea580c);padding:28px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.9);font-size:14px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Urgent</p>
      <h1 style="color:white;margin:0;font-size:28px;">New Order Received!</h1>
    </div>

    <div style="padding:32px;text-align:center;border-bottom:1px solid #f0f0f0;">
      <div style="font-size:36px;font-weight:bold;color:#dc2626;">{{order_number}}</div>
      <p style="font-size:24px;font-weight:bold;margin:12px 0 0;color:#111;">£{{total}}</p>
      <p style="color:#666;margin:8px 0 0;">Received at {{time_received}}</p>
    </div>

    <div style="padding:24px 32px;">
      <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 12px;">Customer</h3>
      <p style="margin:4px 0;font-size:18px;font-weight:600;">{{customer_name}}</p>
      {{#if customer_phone}}
      <p style="margin:4px 0;color:#666;">📞 {{customer_phone}}</p>
      {{/if}}
    </div>

    <div style="padding:0 32px 24px;">
      <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 12px;">Items</h3>
      {{#each items}}
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;">
        <span>{{quantity}}x {{name}}</span>
        <span style="font-weight:600;">£{{price}}</span>
      </div>
      {{/each}}
    </div>

    {{#if notes}}
    <div style="margin:0 32px 24px;background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;">
      <strong>⚠️ Special notes:</strong><br>
      <span style="color:#92400e;">{{notes}}</span>
    </div>
    {{/if}}

    <div style="padding:0 32px 32px;text-align:center;">
      <a href="{{accept_url}}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;margin:0 8px 12px;">✓ Accept Order</a>
      <a href="{{reject_url}}" style="display:inline-block;background:#dc2626;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;margin:0 8px 12px;">✗ Reject Order</a>
      <p style="color:#666;font-size:14px;margin:16px 0 0;">
        Login to manage: <a href="{{dashboard_url}}" style="color:#2563eb;">{{dashboard_url}}</a>
      </p>
    </div>

    <div style="background:#1a1a1a;padding:20px 32px;text-align:center;">
      <p style="color:#666;font-size:11px;margin:0;">
        <a href="https://order.kajipos.co.uk" style="color:#555;text-decoration:none;">Powered by Kaji Order</a>
      </p>
      <p style="color:#555;font-size:11px;margin:4px 0 0;">© {{year}} Kaji Digital</p>
    </div>
  </div>
</body>
</html>`

const REFUND_CONFIRMATION_SUBJECT =
  'Refund processed — {{order_number}} — {{restaurant_name}}'

const REFUND_CONFIRMATION_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;background:white;">
    <div style="background:[PRIMARY_COLOR];padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">{{restaurant_name}}</h1>
    </div>

    <div style="padding:32px;text-align:center;">
      <div style="font-size:48px;">💳</div>
      <h2 style="font-size:24px;margin:12px 0 8px;">Refund Processed</h2>
      <p style="color:#666;margin:0;">Order {{order_number}}</p>
    </div>

    <div style="padding:0 32px 32px;">
      <p style="margin:0 0 16px;">Hi {{customer_name}},</p>
      <p style="margin:0 0 16px;line-height:1.6;">
        Your refund of <strong style="color:[PRIMARY_COLOR];">£{{amount}}</strong> for order
        <strong>{{order_number}}</strong> at <strong>{{restaurant_name}}</strong> has been processed.
      </p>
      <p style="margin:0;color:#666;line-height:1.6;">
        Please allow 3–5 working days for the refund to appear in your account.
      </p>
    </div>

    <div style="background:#1a1a1a;padding:20px 32px;text-align:center;">
      <p style="color:#999;font-size:12px;margin:0;">© {{year}} {{restaurant_name}}</p>
      <p style="color:#666;font-size:11px;margin:8px 0 0;">
        <a href="https://order.kajipos.co.uk" style="color:#555;text-decoration:none;">Powered by Kaji Order</a>
      </p>
    </div>
  </div>
</body>
</html>`

const BUILTIN_DEFAULTS: DefaultTemplate[] = [
  {
    template_type: 'order_confirmation',
    subject: ORDER_CONFIRMATION_SUBJECT,
    html_body: ORDER_CONFIRMATION_HTML,
  },
  {
    template_type: 'new_order_alert',
    subject: NEW_ORDER_ALERT_SUBJECT,
    html_body: NEW_ORDER_ALERT_HTML,
  },
  {
    template_type: 'refund_confirmation',
    subject: REFUND_CONFIRMATION_SUBJECT,
    html_body: REFUND_CONFIRMATION_HTML,
  },
]

export function getBuiltinDefaultTemplates(): DefaultTemplate[] {
  return BUILTIN_DEFAULTS
}

export function getBuiltinDefaultTemplate(
  templateType: EmailTemplateType
): { subject: string; html: string } {
  const template = BUILTIN_DEFAULTS.find((t) => t.template_type === templateType)
  if (!template) {
    throw new Error(`Unknown template type: ${templateType}`)
  }
  return { subject: template.subject, html: template.html_body }
}
