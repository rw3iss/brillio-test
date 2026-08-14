// Generates real, text-based PDF documents for the Brillio knowledge base.
// Uses pdfkit. Run: node knowledge-base/scripts/generate-pdfs.mjs
//
// Produces:
//   support-sla/sla-and-support-policy.pdf   (SLA & Support Policy)
//   technical-docs/security-and-sso.pdf      (Security & SSO whitepaper)
//
// The text is embedded as real selectable/extractable text (not images) so a
// text extractor / RAG ingester can read it.

import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KB_ROOT = resolve(__dirname, '..');

/**
 * Render an array of "blocks" to a PDF file.
 * Block: { h1 } | { h2 } | { p } | { bullets: [] } | { table: {head, rows} } | { spacer }
 */
function renderPdf(outPath, blocks) {
  mkdirSync(dirname(outPath), { recursive: true });
  const doc = new PDFDocument({ size: 'LETTER', margin: 56 });
  const stream = createWriteStream(outPath);
  doc.pipe(stream);

  const done = new Promise((res, rej) => {
    stream.on('finish', res);
    stream.on('error', rej);
  });

  for (const block of blocks) {
    if (block.h1) {
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#1a1a1a').text(block.h1);
      doc.moveDown(0.5);
    } else if (block.h2) {
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold').fontSize(13).fillColor('#222').text(block.h2);
      doc.moveDown(0.2);
    } else if (block.p) {
      doc.font('Helvetica').fontSize(10.5).fillColor('#333').text(block.p, { align: 'left' });
      doc.moveDown(0.3);
    } else if (block.bullets) {
      doc.font('Helvetica').fontSize(10.5).fillColor('#333');
      for (const b of block.bullets) {
        doc.text('•  ' + b, { indent: 12 });
      }
      doc.moveDown(0.3);
    } else if (block.table) {
      renderTable(doc, block.table.head, block.table.rows);
      doc.moveDown(0.4);
    } else if (block.spacer) {
      doc.moveDown(block.spacer);
    }
  }

  doc.end();
  return done;
}

function renderTable(doc, head, rows) {
  const startX = doc.x;
  const cols = head.length;
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = usableWidth / cols;
  const rowHeight = 20;

  function drawRow(cells, y, bold) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5).fillColor('#222');
    cells.forEach((c, i) => {
      doc.text(String(c), startX + i * colWidth + 4, y + 5, {
        width: colWidth - 8,
        height: rowHeight,
        ellipsis: false,
      });
    });
    doc.moveTo(startX, y + rowHeight).lineTo(startX + usableWidth, y + rowHeight)
      .strokeColor('#ddd').lineWidth(0.5).stroke();
  }

  let y = doc.y;
  drawRow(head, y, true);
  y += rowHeight;
  for (const r of rows) {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.y;
    }
    drawRow(r, y, false);
    y += rowHeight;
  }
  doc.y = y + 4;
  doc.x = startX;
}

// ---------------------------------------------------------------------------
// Document 1: SLA & Support Policy
// ---------------------------------------------------------------------------
const slaBlocks = [
  { h1: 'Brillio SLA & Support Policy' },
  { p: 'Effective 2024-11-01. Applies to all Brillio Suite products (Core, Analytics, Connect, Shield).' },

  { h2: 'Support Tiers by Plan' },
  {
    table: {
      head: ['Plan', 'Support Level', 'Coverage Hours', 'Channels'],
      rows: [
        ['Starter', 'Community', 'Forum only', 'Forum, docs'],
        ['Team', 'Standard', 'Business hours (9x5)', 'Email, portal'],
        ['Pro', 'Priority', 'Business hrs + P1 24x7', 'Email, portal, chat'],
        ['Enterprise', 'Premier', '24x7', 'Email, portal, chat, phone, TAM'],
      ],
    },
  },

  { h2: 'Ticket Priority Definitions' },
  {
    bullets: [
      'P1 - Critical: Production down or critical function unusable for all users; no workaround.',
      'P2 - High: Major function impaired for many users; workaround may exist but is unsustainable.',
      'P3 - Normal: Minor issue, question, or single-user problem with a viable workaround.',
    ],
  },

  { h2: 'SLA Response & Resolution Targets' },
  { p: 'Measured from ticket acknowledgement during applicable coverage hours.' },
  {
    table: {
      head: ['Priority', 'Response Target', 'Resolution Target', 'Coverage'],
      rows: [
        ['P1', '1 hour', '4 hours', '24x7 (Pro & Enterprise)'],
        ['P2', '4 hours', '1 business day', 'Business hours'],
        ['P3', '1 business day', '3 business days', 'Business hours'],
      ],
    },
  },
  { p: 'P1 response time is 1 hour and the P1 resolution/mitigation target is 4 hours. P1 tickets are handled 24x7 on Pro and Enterprise plans. On the Team plan, P1 and P2 are handled during business hours only.' },

  { h2: 'Uptime SLA (Service Availability)' },
  {
    table: {
      head: ['Plan', 'Monthly Uptime SLA', 'Service Credits'],
      rows: [
        ['Starter', 'None', '-'],
        ['Team', '99.5%', '-'],
        ['Pro', '99.9%', 'Up to 10% of monthly fee'],
        ['Enterprise', '99.95%', 'Up to 25% of monthly fee'],
      ],
    },
  },

  { h2: 'Escalation' },
  {
    bullets: [
      'Enterprise customers escalate through their dedicated Technical Account Manager (TAM).',
      'Any customer can escalate an open P1/P2 via the portal Escalate action, which pages on-call for P1.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Document 2: Security & SSO whitepaper
// ---------------------------------------------------------------------------
const ssoBlocks = [
  { h1: 'Brillio Security & SSO (SAML 2.0) Whitepaper' },
  { p: 'Module: Brillio Shield 2.3. Describes Single Sign-On, provisioning, and security controls, and which products/tiers support them.' },

  { h2: 'SSO via SAML 2.0' },
  { p: 'Brillio supports SSO using the SAML 2.0 protocol, delivered by the Brillio Shield module. SSO is available on the Pro and Enterprise tiers only. SCIM automated provisioning is Enterprise only.' },
  {
    table: {
      head: ['Tier', 'SSO via SAML 2.0', 'SCIM Provisioning'],
      rows: [
        ['Starter', 'No', 'No'],
        ['Team', 'No', 'No'],
        ['Pro', 'Yes', 'No'],
        ['Enterprise', 'Yes', 'Yes'],
      ],
    },
  },
  { p: 'SSO applies across the entire suite: Brillio Core, Brillio Analytics, Brillio Connect, and Brillio Shield all authenticate through the same SAML 2.0 session.' },

  { h2: 'Supported Identity Providers' },
  { bullets: ['Okta', 'Microsoft Entra ID (Azure AD)', 'Google Workspace', 'OneLogin', 'PingFederate'] },
  { p: 'Both SP-initiated and IdP-initiated login flows are supported (IdP-initiated added in Shield 2.3).' },

  { h2: 'Configuring SAML 2.0 SSO' },
  {
    bullets: [
      'In Brillio, go to Shield > Single Sign-On > SAML 2.0.',
      'Copy the Brillio SP Entity ID and ACS URL into your IdP.',
      'Upload the IdP metadata XML (or SSO URL + X.509 signing certificate).',
      'Map SAML attributes: email (required), firstName, lastName, groups.',
      'Test with the Test SSO button, then optionally Enforce SSO.',
    ],
  },

  { h2: 'Other Shield Security Controls' },
  {
    bullets: [
      'IP allowlisting: up to 200 CIDR ranges per workspace (Team and above).',
      'Audit logs: 7 days (Starter), 30 days (Team), 1 year (Pro), 7 years (Enterprise).',
      'Encryption: AES-256 at rest, TLS 1.2+ in transit; customer-managed keys on Enterprise.',
      'Signed API requests: HMAC-SHA256 with a 5-minute (300s) timestamp tolerance.',
    ],
  },
  { h2: 'Compliance' },
  { p: 'Brillio maintains SOC 2 Type II. BAA and DPA available on Pro and Enterprise. Data residency: US, EU, APAC (custom on Enterprise).' },
];

const targets = [
  { out: resolve(KB_ROOT, 'support-sla/sla-and-support-policy.pdf'), blocks: slaBlocks },
  { out: resolve(KB_ROOT, 'technical-docs/security-and-sso.pdf'), blocks: ssoBlocks },
];

for (const t of targets) {
  await renderPdf(t.out, t.blocks);
  console.log('Wrote', t.out);
}

console.log('Done. Generated', targets.length, 'PDF(s).');
