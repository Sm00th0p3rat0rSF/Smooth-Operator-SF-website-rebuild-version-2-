import { Booking, PrepaidPackage } from '../types';
import { SERVICES } from '../services';

export interface WorkspaceConfig {
  spreadsheetId: string;
  ndaFolderId: string;
  taskListId: string;
  intakeFormId?: string;
  intakeFormUrl?: string;
}

const STORAGE_KEY = 'so_workspace_config';

/**
 * Searches for a file/folder in Google Drive by name and query constraints
 */
async function findDriveItem(accessToken: string, query: string): Promise<string | null> {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=drive&fields=files(id,name)`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    console.error('Failed to query Google Drive item:', await res.text());
    return null;
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id as string;
  }
  return null;
}

/**
 * Creates/retrieves a master organizational folder for the studio inside Google Drive/Workspace
 */
async function locateOrCreateMasterFolder(accessToken: string): Promise<string> {
  console.log("Creating new Google Workspace directory folder: Smooth Operator SF Studio Hub...");
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Smooth Operator SF Studio Hub',
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Unified organization desk for all files, spreadsheet ledgers, client intake records, and assets of Smooth Operator SF.',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive Master Folder Creation Error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Adjusts file parents in Google Drive (moves a file into the master folder)
 */
async function moveFileToFolder(accessToken: string, fileId: string, folderId: string): Promise<void> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}&removeParents=root`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.warn(`Could not adjust parents of file ${fileId} into folder ${folderId}:`, await res.text());
    }
  } catch (err) {
    console.error('Error moving file parent in Drive API:', err);
  }
}

/**
 * Creates a folder in Google Drive inside Master Folder
 */
async function locateOrCreateNDAFolder(accessToken: string, masterFolderId: string): Promise<string> {
  console.log('Creating brand-new NDA folder inside our master workspace directories...');
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Smooth Operator SF NDA & Safety Waiver Vault',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [masterFolderId],
      description: 'Discreet digital vault holding signed NDAs and client check-in forms.',
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Drive Folder Creation Error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Creates a brand-new Appointments Spreadsheet ledger inside the Master Folder
 */
async function locateOrCreateSpreadsheet(accessToken: string, masterFolderId: string): Promise<string> {
  console.log('Creating brand-new Appointments Ledger in Google Sheets...');
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Smooth Operator SF - Appointments Ledger',
      },
      sheets: [
        {
          properties: {
            title: 'Appointments Ledger',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'Prepaid Packages',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'Contacts Directory',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
        {
          properties: {
            title: 'Treatment Menu',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        }
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Sheets Creation Error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId as string;

  // Immediately relocate new spreadsheet inside the master organizational directory
  await moveFileToFolder(accessToken, spreadsheetId, masterFolderId);

  // Append top row headers to set up columns beautifully
  const headers = [
    'Booking ID',
    'Client Name',
    'Client Email',
    'Client Phone',
    'Services Booked',
    'Total Price ($)',
    'Appointment Date',
    'Proposed Start Time',
    'NDA Agreed?',
    'NDA Signature',
    'Client Over 18?',
    'Skincare Checklist Passed?',
    'Latest Status',
    'Google Calendar Event ID',
    'Created Timestamp',
  ];

  const packageHeaders = [
    'Client Email',
    'Client Name',
    'Package Name',
    'Total Sessions Purchased',
    'Sessions Used',
    'Sessions Remaining',
    'Last Updated'
  ];

  const contactHeaders = [
    'Client Name',
    'First Name',
    'Last Name',
    'Client Email',
    'Client Phone',
    'Birthday',
    'Address',
    'Label/Tag',
    'Notes',
    'Date Declared'
  ];

  const treatmentHeaders = [
    'ID',
    'Category',
    'Name',
    'Duration (mins)',
    'Price ($)',
    'Description',
    'Body Part Spot ID'
  ];

  await appendRowToSheet(accessToken, spreadsheetId, 'Appointments Ledger!A1', headers);
  await appendRowToSheet(accessToken, spreadsheetId, 'Prepaid Packages!A1', packageHeaders);
  await appendRowToSheet(accessToken, spreadsheetId, 'Contacts Directory!A1', contactHeaders);
  await appendRowToSheet(accessToken, spreadsheetId, 'Treatment Menu!A1', treatmentHeaders);

  const treatmentRows = SERVICES.map(s => [
    s.id,
    s.category,
    s.name,
    s.duration,
    s.price,
    s.description,
    s.bodyPartId
  ]);
  await appendRowsToSheet(accessToken, spreadsheetId, 'Treatment Menu!A2', treatmentRows);

  return spreadsheetId;
}

/**
 * Append row helper
 */
async function appendRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: [values],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to append row to Google Sheets:', errorText);
  }
}

/**
 * Append multiple rows helper
 */
async function appendRowsToSheet(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rows: any[][]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to append multiple rows to Google Sheets:', errorText);
  }
}

/**
 * Locates or creates the Task List in Google Tasks
 */
async function locateOrCreateTaskList(accessToken: string): Promise<string> {
  // Query all task lists
  const res = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Tasks Query Error: ${res.status} - ${errText}`);
  }

  const data = await res.json();
  const lists = data.items || [];
  const existingList = lists.find((l: any) => l.title === 'Smooth Operator SF Prep Tasks');

  if (existingList) {
    return existingList.id as string;
  }

  // Create new task list
  console.log('Creating new Smooth Operator SF Prep Tasks List...');
  const createRes = await fetch('https://tasks.googleapis.com/v1/users/@me/lists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Smooth Operator SF Prep Tasks',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Tasks Creation Error: ${createRes.status} - ${errText}`);
  }

  const newList = await createRes.json();
  return newList.id as string;
}

/**
 * Verifies if a custom spreadsheet exists and contains the necessary tabs.
 * Dynamically deploys missing tabs with headers to maintain complete structural integrity.
 */
export async function verifyAndInitializeCustomSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!getRes.ok) {
    const errText = await getRes.text();
    throw new Error(`Google Sheets Access Error: The spreadsheet could not be loaded. Please ensure Drew has shared this sheet with editor permissions. Status: ${getRes.status} - ${errText}`);
  }

  const spreadsheetInfo = await getRes.json();
  const sheetTitles = spreadsheetInfo.sheets?.map((s: any) => s.properties.title) || [];

  const requiredTabs = [
    {
      title: 'Appointments Ledger',
      headers: [
        'Booking ID',
        'Client Name',
        'Client Email',
        'Client Phone',
        'Services Booked',
        'Total Price ($)',
        'Appointment Date',
        'Proposed Start Time',
        'NDA Agreed?',
        'NDA Signature',
        'Client Over 18?',
        'Skincare Checklist Passed?',
        'Latest Status',
        'Google Calendar Event ID',
        'Created Timestamp'
      ]
    },
    {
      title: 'Prepaid Packages',
      headers: [
        'Client Email',
        'Client Name',
        'Package Name',
        'Total Sessions Purchased',
        'Sessions Used',
        'Sessions Remaining',
        'Last Updated'
      ]
    },
    {
      title: 'Contacts Directory',
      headers: [
        'Client Name',
        'First Name',
        'Last Name',
        'Client Email',
        'Client Phone',
        'Birthday',
        'Address',
        'Label/Tag',
        'Notes',
        'Date Declared'
      ]
    },
    {
      title: 'Treatment Menu',
      headers: [
        'ID',
        'Category',
        'Name',
        'Duration (mins)',
        'Price ($)',
        'Description',
        'Body Part Spot ID'
      ]
    }
  ];

  for (const tab of requiredTabs) {
    if (!sheetTitles.includes(tab.title)) {
      console.log(`Tab "${tab.title}" is missing in custom spreadsheet. Deploying tab...`);
      const addRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: tab.title,
                  gridProperties: {
                    frozenRowCount: 1
                  }
                }
              }
            }
          ]
        })
      });

      if (!addRes.ok) {
        const errText = await addRes.text();
        throw new Error(`Failed to create sheet "${tab.title}": ${errText}`);
      }

      await appendRowToSheet(accessToken, spreadsheetId, `${tab.title}!A1`, tab.headers);

      if (tab.title === 'Treatment Menu') {
        const treatmentRows = SERVICES.map(s => [
          s.id,
          s.category,
          s.name,
          s.duration,
          s.price,
          s.description,
          s.bodyPartId
        ]);
        await appendRowsToSheet(accessToken, spreadsheetId, 'Treatment Menu!A2', treatmentRows);
      }
    }
  }
}

/**
 * Initializes workspace parameters and caches them in local storage.
 */
export async function initializeWorkspace(accessToken: string): Promise<WorkspaceConfig> {
  try {
    // Force a clean restart by wiping any legacy local configuration
    clearSavedWorkspaceConfig();

    // Create a brand-new Master Organizational Folder inside Drew's Google Workspace Drive
    const masterFolderId = await locateOrCreateMasterFolder(accessToken);

    // Concurrently trigger brand-new distinct creations (Vault folder, Excel spreadsheets, Google Forms, Google Tasks List)
    const ndaPromise = locateOrCreateNDAFolder(accessToken, masterFolderId);
    const taskPromise = locateOrCreateTaskList(accessToken);
    const formPromise = deployIntakeForm(accessToken, masterFolderId);
    const sheetPromise = locateOrCreateSpreadsheet(accessToken, masterFolderId);

    const [ndaFolderId, spreadsheetId, taskListId, freshForm] = await Promise.all([
      ndaPromise,
      sheetPromise,
      taskPromise,
      formPromise,
    ]);

    const config: WorkspaceConfig = { 
      ndaFolderId, 
      spreadsheetId, 
      taskListId,
      intakeFormId: freshForm?.id,
      intakeFormUrl: freshForm?.url
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return config;
  } catch (error) {
    console.error('Workspace setup initialization failed:', error);
    throw error;
  }
}

/**
 * Retrieve current workspace parameters
 */
export function getSavedWorkspaceConfig(): WorkspaceConfig | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as WorkspaceConfig;
    } catch (_) {
      return null;
    }
  }
  return null;
}

/**
 * Deletes saved workspace configuration from LocalStorage
 */
export function clearSavedWorkspaceConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generates an NDA and writes it into Drew's Google Drive NDA folder as a confidential document log
 */
export async function writeNDAToDriveFolder(
  accessToken: string,
  folderId: string,
  booking: Booking
): Promise<{ fileId: string; webViewLink: string }> {
  const fileName = `NDA_${booking.clientName.replace(/\s+/g, '_')}_${booking.date}.txt`;
  
  // 1. Create file metadata in folder
  const metaRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
      description: `Discreet non-disclosure confidentiality waiver for ${booking.clientName}.`,
    }),
  });

  if (!metaRes.ok) {
    const t = await metaRes.text();
    throw new Error(`Failed to create file metadata in Drive: ${t}`);
  }

  const metaData = await metaRes.json();
  const fileId = metaData.id as string;

  // 2. Format a beautiful plain-text confidential agreement document
  const servicesText = booking.services.map(s => `- ${s.name} ($${s.price.toFixed(2)})`).join('\n');
  const fileBody = `===========================================================
NON-DISCLOSURE AGREEMENT & HEALTH INTAKE CONSENT RECORD
===========================================================
STUDIO: Smooth Operator SF (www.smoothoperatorsf.com)
OPERATOR: Lead Aesthetician (admin@smoothoperatorsf.com)
CLIENT NAME: ${booking.clientName}
CLIENT EMAIL: ${booking.clientEmail}
CLIENT PHONE: ${booking.clientPhone}
RECORD ID: ${booking.id}
TIMESTAMP: ${new Date().toISOString()}

-----------------------------------------------------------
APPOINTMENT RESERVATION DETAIL
-----------------------------------------------------------
Day Proposed: ${booking.date}
Slot Clock time: ${booking.time}
Registered Services:
${servicesText}
Total Agreed Ticket: $${booking.totalPrice.toFixed(2)}
Total Block on Calendar: ${booking.totalDuration} Min (incl. turnaround)

-----------------------------------------------------------
LEGAL AGREEMENTS & CONSENT STATEMENT
-----------------------------------------------------------
1. AGE GATE COMPLIANCE
   Client declares and certifies they are 18 years of age or older
   and legally competent to consent to intimate waxing services.
   STATUS: [CONFIRMED / PASSED] (Client declared true)

2. SKIN-SAFETY & ACCUTANE CONTRAINDICATIONS
   Client certifies they have NOT used Accutane (within 6 months),
   or Retin-A / Retinols / deep chemical treatments on treatment zones
   in the last 7 calendar days. 
   STATUS: [CLEARED / COMPLIANT] (Client declared true)

3. DISCREET NON-DISCLOSURE AGREEMENT (NDA)
   Both parties agree that all private matters, grooming details,
   personal physical aspects, and discussions had inside the private
   studio are hyper-confidential. Neither party shall publish, post,
   distribute, or communicate these discussions or services to any 
   third party or digital platform.
   STATUS: [SIGNED & RECORDED]

-----------------------------------------------------------
DIGITAL REVOLUTIONS SIGNATURE
-----------------------------------------------------------
By typing their name below, the client executing this document logs
their full and binding authorization of this intake check sheet.

CLIENT SIGNATURE VERBATIM: /s/ ${booking.ndaSignature}
DREW RECORD ENGINES STATUS: SECURED & ARCHIVED

===========================================================
SMOOTH OPERATOR SF — SAFE, SOVEREIGN, AND CLEAN.
===========================================================`;

  // 3. Upload content via media endpoint
  const contentRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'text/plain; charset=UTF-8',
    },
    body: fileBody,
  });

  if (!contentRes.ok) {
    const t = await contentRes.text();
    throw new Error(`Failed to upload text contents to Drive: ${t}`);
  }

  // 4. Do a final GET to retrieve the file's webViewLink
  const getRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let webViewLink = `https://drive.google.com/open?id=${fileId}`;
  if (getRes.ok) {
    const getObj = await getRes.json();
    if (getObj.webViewLink) {
      webViewLink = getObj.webViewLink;
    }
  }

  return { fileId, webViewLink };
}

/**
 * Creates a beautiful, fully formatted, official Google Doc containing 
 * the client's information, contracts, and personalized post-wax care schedule.
 */
export async function createCONFIDENTIALGoogleDoc(
  accessToken: string,
  folderId: string,
  booking: Booking
): Promise<{ docId: string; docUrl: string }> {
  const docTitle = `CONFIDENTIAL: NDA & Intake - ${booking.clientName} (${booking.date})`;

  // 1. Create a blank Google Document
  const docResponse = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle,
    }),
  });

  if (!docResponse.ok) {
    const errText = await docResponse.text();
    throw new Error(`Google Docs Creation Error: ${docResponse.status} - ${errText}`);
  }

  const docData = await docResponse.json();
  const docId = docData.documentId as string;

  // 2. Prepare structural formatted text insertion inside Google Docs
  const servicesFormatted = booking.services.map(s => `• ${s.name} (${s.duration} mins) - $${s.price.toFixed(2)}`).join('\n');
  
  const docsText = `SMOOTH OPERATOR SF — CONFIDENTIAL INTAKE & WAIVER
=========================================================
Client Service File: ${booking.clientName}
Date of Appointment: ${booking.date} at ${booking.time}
Total Price of Services: $${booking.totalPrice.toFixed(2)}
Appointment Duration: ${booking.totalDuration} minutes (includes hidden 15-min turnaround buffer)

---------------------------------------------------------
1. CLIENT IDENTIFICATION & CONTACT
---------------------------------------------------------
• Name: ${booking.clientName}
• Email: ${booking.clientEmail}
• Phone: ${booking.clientPhone}
• Booking ID Reference: ${booking.id}
• Created: ${new Date(booking.createdAt).toLocaleString()}

---------------------------------------------------------
2. CONSTITUENT SERVICES
---------------------------------------------------------
${servicesFormatted}

---------------------------------------------------------
3. COMPLIANCE & SKINCARE QUESTIONNAIRE
---------------------------------------------------------
✔ Patient certifies they are 18+ years of age: ${booking.isOver18 ? 'YES (AGREED & AUTHENTIC)' : 'NO'}
✔ Skin-safety / Acutane contraindications cleared: ${booking.skincareCheck ? 'YES (CLEARED & COMPLIANT)' : 'NO'}
  *Note: Client confirms they are NOT using Accutane, Retin-A, or active retinols on the target zones.

---------------------------------------------------------
4. NON-DISCLOSURE CONFIDENTIALITY AGREEMENT (NDA)
---------------------------------------------------------
The client and Drew (owner of Smooth Operator SF) mutually agree that any and all private physical details, identity markers, visual representations, or personal discussions taking place inside the private studio shall remain strictly confidential. These details are legally protected and shall never be made public, digitised, or shared on any website, review, or social media outlet.

DIGITAL VERIFIABLE SIGNATURE:
/s/ ${booking.ndaSignature}

---------------------------------------------------------
5. TAILORED POST-CARE RECOVERY PROGRAM
---------------------------------------------------------
To protect your freshly-waxed skin and ensure flawless, bump-free results:
• 24-HOUR RULE: Strictly no sweat, heavy workouts, or tight synthetic clothing.
• 48-HOUR RULE: Avoid swimming pools, hot tubs, steam baths, saunas, and hot showers.
• 72-HOUR RULE: Do not perform physical or chemical exfoliation on waxed skin.
• WEEKLY RECOVERY (Day 4 Onwards): Exfoliate gently 3 times a week using a clean loofah or mild body scrub, and keep the areas deeply moisturized to prevent painful ingrown hairs.
• HAIR CYCLE MAINTENANCE: Plan your next treatment session in 3.5 to 4 weeks. Waiting longer resets the hair growth root cycles, making the next session feel like your first time again.

=========================================================
AUTHENTIC RECORD — SIGNED & LOCKBOX SECURED BY DREW.`;

  // 3. Insert and write the entire structured intake into the Google Doc
  const batchResponse = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            text: docsText,
            location: {
              index: 1,
            },
          },
        },
      ],
    }),
  });

  if (!batchResponse.ok) {
    const errText = await batchResponse.text();
    console.error('Failed to populate Google Doc contents:', errText);
  }

  // 4. Move Google Doc from Drive root into Drew's Smooth Operator SF NDA folder
  try {
    const moveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${docId}?addParents=${folderId}&removeParents=root`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!moveResponse.ok) {
      console.error('Failed to move Google Doc into Drew\'s Private NDA Folder:', await moveResponse.text());
    }
  } catch (moveErr) {
    console.error('Move document parents error:', moveErr);
  }

  return {
    docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`,
  };
}

/**
 * Log a new appointment as a row in the Google Sheets Ledger
 */
export async function logAppointmentToLedgerSheet(
  accessToken: string,
  spreadsheetId: string,
  booking: Booking
): Promise<void> {
  const dateStr = new Date().toISOString();
  const servicesText = booking.services.map(s => `${s.name} ($${s.price.toFixed(2)})`).join(', ');

  const values = [
    booking.id,
    booking.clientName,
    booking.clientEmail,
    booking.clientPhone,
    servicesText,
    booking.totalPrice,
    booking.date,
    booking.time,
    booking.ndaSigned ? 'YES' : 'NO',
    booking.ndaSignature,
    booking.isOver18 ? 'YES' : 'NO',
    booking.skincareCheck ? 'YES' : 'NO',
    booking.status.toUpperCase(),
    booking.googleEventId || 'TBD (PENDING ACCEPT)',
    dateStr,
  ];

  await appendRowToSheet(accessToken, spreadsheetId, 'Appointments Ledger!A2', values);
}

/**
 * Append or save a declared contact directly in the Google Sheets "Contacts Directory" tab
 */
export async function logContactToDirectorySheet(
  accessToken: string,
  spreadsheetId: string,
  contact: {
    givenName: string;
    familyName: string;
    email: string;
    phone: string;
    birthday?: string;
    address?: string;
    notes?: string;
  }
): Promise<void> {
  const dateStr = new Date().toLocaleDateString();
  const fullName = `${contact.givenName} ${contact.familyName}`.trim();
  const label = "waxing"; // Pre-condition: Assign "waxing" label

  const values = [
    fullName,
    contact.givenName,
    contact.familyName,
    contact.email,
    contact.phone,
    contact.birthday || '',
    contact.address || '',
    label,
    contact.notes || '',
    dateStr
  ];

  await appendRowToSheet(accessToken, spreadsheetId, 'Contacts Directory!A2', values);
}

/**
 * Synchronize a prepaid package cell entry to the Google Sheet "Prepaid Packages" tab.
 * Looks for exact combination of Client Email + Package Name:
 * - If found, overwrites that row's columns.
 * - If not found, appends a new row.
 */
export async function syncPackageToSheet(
  accessToken: string,
  spreadsheetId: string,
  pkg: PrepaidPackage
): Promise<void> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Prepaid%20Packages!A:G?majorDimension=ROWS`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('Failed to retrieve Prepaid Packages rows for sync:', await res.text());
      return;
    }

    const data = await res.json();
    const rows = data.values || [];
    let matchingIndex = -1;

    // Search rows (Skip header row at row 1)
    for (let i = 1; i < rows.length; i++) {
      const email = rows[i][0] ? rows[i][0].toString().trim().toLowerCase() : '';
      const name = rows[i][2] ? rows[i][2].toString().trim().toLowerCase() : '';
      if (email === pkg.clientEmail.trim().toLowerCase() && name === pkg.packageName.trim().toLowerCase()) {
        matchingIndex = i + 1; // 1-indexed sheet row index
        break;
      }
    }

    const values = [
      pkg.clientEmail,
      pkg.clientName,
      pkg.packageName,
      pkg.totalSessions,
      pkg.sessionsUsed,
      pkg.sessionsRemaining,
      pkg.lastUpdated
    ];

    if (matchingIndex !== -1) {
      // Overwrite existing row
      const range = `Prepaid Packages!A${matchingIndex}:G${matchingIndex}`;
      const putRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range,
          majorDimension: 'ROWS',
          values: [values]
        })
      });
      if (!putRes.ok) {
        console.error('Failed to update package row in sheet:', await putRes.text());
      }
    } else {
      // Append as new row
      await appendRowToSheet(accessToken, spreadsheetId, 'Prepaid Packages!A2', values);
    }
  } catch (err) {
    console.error('Error synchronizing package to sheet:', err);
  }
}

/**
 * Retrieve all prepaid packages directly from the Google Spreadsheet tab.
 */
export async function fetchPackagesFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<PrepaidPackage[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Prepaid%20Packages!A:G?majorDimension=ROWS`;
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('Failed to retrieve rows from Prepaid Packages sheet:', await res.text());
      return [];
    }

    const data = await res.json();
    const rows = data.values || [];
    const packages: PrepaidPackage[] = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i][0]) continue; // Skip empty rows
      packages.push({
        id: `sheet-${i}`,
        clientEmail: rows[i][0] ? rows[i][0].toString() : '',
        clientName: rows[i][1] ? rows[i][1].toString() : '',
        packageName: rows[i][2] ? rows[i][2].toString() : '',
        totalSessions: Number(rows[i][3]) || 0,
        sessionsUsed: Number(rows[i][4]) || 0,
        sessionsRemaining: Number(rows[i][5]) || 0,
        lastUpdated: rows[i][6] ? rows[i][6].toString() : '',
      });
    }

    return packages;
  } catch (err) {
    console.error('Error fetching packages from sheet:', err);
    return [];
  }
}



/**
 * Update the status of an existing booking in Google Sheets Ledger
 */
export async function updateBookingStatusInSheet(
  accessToken: string,
  spreadsheetId: string,
  bookingId: string,
  newStatus: string,
  gcalEventId?: string
): Promise<void> {
  // 1. Fetch values from column A to find matching row
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Appointments Ledger!A:O?majorDimension=ROWS`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    console.error('Failed to retrieve sheets rows for status update:', await res.text());
    return;
  }

  const data = await res.json();
  const rows = data.values || [];
  let matchingIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === bookingId) {
      matchingIndex = i + 1; // 1-indexed sheet row
      break;
    }
  }

  if (matchingIndex === -1) {
    console.warn(`Booking ID ${bookingId} not found in spreadsheet ledger. Skip update.`);
    return;
  }

  // Column M is Status (13th column, starting from A=1, M=13)
  // Column N is GCal Event ID (14th column, N=14)
  const statusRange = `Appointments Ledger!M${matchingIndex}`;
  const statusRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${statusRange}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: statusRange,
      majorDimension: 'ROWS',
      values: [[newStatus.toUpperCase()]]
    })
  });

  if (!statusRes.ok) {
    console.error('Failed to update status in sheets:', await statusRes.text());
  }

  if (gcalEventId) {
    const gcalRange = `Appointments Ledger!N${matchingIndex}`;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${gcalRange}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: gcalRange,
        majorDimension: 'ROWS',
        values: [[gcalEventId]]
      })
    });
  }
}

/**
 * Creates 3 preparatory tasks on Drew's Google TV & watch active list so he never forgets them
 */
export async function createPrepTasksForDrew(
  accessToken: string,
  taskListId: string,
  booking: Booking
): Promise<void> {
  const dateObj = new Date(`${booking.date}T${booking.time}:00`);
  // Prep tasks should list due date in RFC 3339 format
  const dueTimestamp = dateObj.toISOString();

  const servicesText = booking.services.map(s => s.name).join(', ');

  const tasksToCreate = [
    {
      title: `Prep Manscaping Room: ${booking.clientName}`,
      notes: `Service: ${servicesText}\n` +
             `Time Slot: ${booking.time} (${booking.date})\n` +
             `Details: Thorough sanitization of table & prepare clean backing sheets.\n` +
             `Card Status: Card preauth secured on Stripe.`,
      due: dueTimestamp
    },
    {
      title: `Check NDA & Skin-Safety waiver docs for ${booking.clientName}`,
      notes: `Confirm no Retin-A / retinol skincare contraindications on file.\n` +
             `Signature text: /s/ ${booking.ndaSignature}\n` +
             `Confidential NDA guarantees absolute discretion. Keep conversation secure.`,
      due: dueTimestamp
    },
    {
      title: `Smooth Operator Post-care details: ${booking.clientName}`,
      notes: `Confirm post-wax instructions reminders are clarified in studio:\n` +
             `- No strenuous workouts for 24h\n` +
             `- Skip hot immersion / jacuzzi for 48h\n` +
             `- Exfoliation start on Day 3 (3x weekly) & keep skin moisturized.\n` +
             `- Secure next 4-week appointment to maintain easy hair defoliation!`,
      due: dueTimestamp
    }
  ];

  for (const task of tasksToCreate) {
    const url = `https://tasks.googleapis.com/v1/lists/${taskListId}/tasks`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!res.ok) {
      console.error('Failed to write google task:', await res.text());
    }
  }
}

/**
 * Encodes and dispatches a multipart/alternative HTML email via Gmail API
 */
export async function sendGmailRaw(
  accessToken: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const mailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    htmlBody
  ];

  const rawMail = mailLines.join('\r\n');
  const base64Encoded = btoa(unescape(encodeURIComponent(rawMail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64Encoded
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gmail API failure: ${res.status} - ${errorText}`);
  }
}

/**
 * Sends a premium styled Post-Wax Care & Confirmation email to the client
 */
export async function sendPostWaxCareInstructionsEmail(
  accessToken: string,
  booking: Booking
): Promise<void> {
  const subject = `✨ Appointment Approved & Post-Wax Care Guide - ${booking.clientName}`;
  const servicesText = booking.services.map(s => `${s.name} ($${s.price.toFixed(2)})`).join(', ');
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c0d12; color: #e4e4e7; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 0 auto; background-color: #12131a; border: 1px solid #232430; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .header { background-color: #0c0d12; padding: 40px 20px; text-align: center; border-bottom: 2px solid #39ff14; }
        .header h1 { font-size: 24px; color: #39ff14; margin: 0; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; }
        .content { padding: 30px 24px; }
        .intro { font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 25px; }
        .booking-details { background-color: #1c1d27; border-left: 4px solid #39ff14; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
        .booking-details h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #e4e4e7; margin-top: 0; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .detail-label { color: #a1a1aa; }
        .detail-value { color: #ffffff; font-weight: bold; }
        .care-section { margin-top: 35px; border-top: 1px solid #232430; pt: 30px; }
        .care-section h2 { font-size: 18px; color: #39ff14; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
        .care-card { background-color: #171822; padding: 16px 20px; border-radius: 8px; border: 1px solid #232231; margin-bottom: 12px; }
        .care-card h4 { margin: 0 0 6px 0; font-size: 14px; text-transform: uppercase; color: #ffffff; letter-spacing: 1px; }
        .care-card p { margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5; }
        .accent-time { color: #39ff14; font-weight: bold; }
        .footer { background-color: #0c0d12; padding: 24px; text-align: center; border-top: 1px solid #1e1f2a; font-size: 11px; color: #71717a; }
        .footer a { color: #39ff14; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>SMOOTH OPERATOR SF</h1>
        </div>
        <div class="content">
          <p class="intro">Hey <strong>${booking.clientName}</strong>,</p>
          <p class="intro">Your grooming reservation with Drew at Smooth Operator SF has been formally accepted! Below are your reserved treatment details:</p>
          
          <div class="booking-details">
            <h3>Reservation Summary</h3>
            <div style="margin-bottom: 12px; font-size: 14px;"><strong>Services Booked:</strong> <span style="color:#39ff14;">${servicesText}</span></div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${booking.date}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Confirmed Time:</span>
              <span class="detail-value">${booking.time}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Service Duration:</span>
              <span class="detail-value">${booking.totalDuration - 15} minutes</span>
            </div>
          </div>

          <div class="care-section">
            <h2>✨ CRITICAL POST-WAX RECOVERY PROGRAM</h2>
            <p style="font-size: 14px; color: #a1a1aa; line-height: 1.5; margin-bottom: 20px;">
              To protect your newly sensitized skin follicles, eliminate raw bumps, and ensure absolute smoothness, you must strictly follow these instructions layout:
            </p>

            <div class="care-card">
              <h4>🔥 24-HOUR RULE</h4>
              <p>Strictly avoid sweaty activities/workouts, gyms, sports, or tight-fitting synthetic clothing to prevent bacterial heat bumps.</p>
            </div>

            <div class="care-card">
              <h4>💧 48-HOUR RULE</h4>
              <p>Keep out of swimming pools, jacuzzis, saunas, steam rooms, and hot showers. Treat the waxed area with clean, lukewarm water only.</p>
            </div>

            <div class="care-card">
              <h4>🧽 72-HOUR RULE</h4>
              <p>Strictly do not exfoliate the target skin zones using physical body gloves, scrubs, or chemical peels.</p>
            </div>

            <div class="care-card">
              <h4>🧴 ONGOING CARE (Day 4 Onwards)</h4>
              <p>Gently exfoliate <span class="accent-time">3 times per week</span> with a clean mitt or loofah, and keep the skin deeply moisturized daily. This prevents skin cells from blocking pores and causing painful ingrown hairs.</p>
            </div>
          </div>
          
          <p style="margin-top: 30px; font-size: 13px; color: #71717a; text-align: center; border-top: 1px solid #1e1f2a; padding-top: 20px;">
            The digital NDA signed during booking has been securely processed and archived to protect your privacy. Real-time checkout preauth has been completed; no-charge hold remains on file until your session is complete. See you soon!
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Smooth Operator SF. All Rights Reserved.</p>
          <p>Location: San Francisco, CA | Website: <a href="https://www.smoothoperatorsf.com" target="_blank">smoothoperatorsf.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendGmailRaw(accessToken, booking.clientEmail, subject, emailHtml);
}

/**
 * Sends a premium designed 4-Week Rebooking Reminder email
 */
export async function sendRebookingReminderEmail(
  accessToken: string,
  booking: Booking
): Promise<void> {
  const subject = `🗓️ Consistency is Key: Secure Your 4-Week Wax Reminder! - Smooth Operator SF`;
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0c0d12; color: #e4e4e7; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 0 auto; background-color: #12131a; border: 1px solid #232430; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        .header { background-color: #0c0d12; padding: 40px 20px; text-align: center; border-bottom: 2px solid #39ff14; }
        .header h1 { font-size: 24px; color: #39ff14; margin: 0; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; }
        .content { padding: 30px 24px; }
        .intro { font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 20px; }
        .educational-box { padding: 25px; border-radius: 8px; background: linear-gradient(135deg, #1c1d27 0%, #15161f 100%); border: 1px solid #2d2e3m; margin-bottom: 30px; }
        .educational-box h3 { color: #39ff14; margin-top: 0; font-size: 15px; text-transform: uppercase; letter-spacing: 1.5px; }
        .educational-box p { font-size: 13.5px; color: #b1b1bc; line-height: 1.6; margin-bottom: 0; }
        .btn-holder { text-align: center; margin: 30px 0; }
        .gold-btn { display: inline-block; background-color: #39ff14; color: #000000; font-weight: bold; text-transform: uppercase; text-decoration: none; padding: 14px 30px; font-size: 13px; letter-spacing: 2px; border-radius: 6px; box-shadow: 0 4px 10px rgba(57,255,20,0.3); transition: all 0.3s ease; }
        .gold-btn:hover { background-color: #a3ff80; }
        .footer { background-color: #0c0d12; padding: 24px; text-align: center; border-top: 1px solid #1e1f2a; font-size: 11px; color: #71717a; }
        .footer a { color: #39ff14; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>SMOOTH OPERATOR SF</h1>
        </div>
        <div class="content">
          <p class="intro">Hey <strong>${booking.clientName}</strong>,</p>
          <p class="intro">It has been about 3.5 weeks since your last grooming or waxing session with Drew! That means your optimal rebooking window is approaching.</p>
          
          <div class="educational-box">
            <h3>Why the 4-week rule is crucial:</h3>
            <p>
              Hair grows in three distinct, staggered cycles. Delaying your waxing treatment past 4 weeks resets these cycles completely, causing the roots to re-harden and making your subsequent treatment feel like your very first time again!
              <br/><br/>
              By booking consistent touch-ups within the 4-week mark, we successfully pull hair directly during its active growth phase (anagen). This weakens the hair follicle, makes the hairs grow back significantly finer, and guarantees future sessions are extremely quick and virtually painless. Let's stay consistent!
            </p>
          </div>

          <div class="btn-holder">
            <a href="https://www.smoothoperatorsf.com" target="_blank" class="gold-btn">Secure My 4-Week Spot</a>
          </div>

          <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center;">
            Don't let your flawless results slip away! Pop back into the Studio scheduler, preview available slots instantly synced with Drew's Google Calendar, and secure your spot today.
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Smooth Operator SF. All Rights Reserved.</p>
          <p>Location: San Francisco, CA | Website: <a href="https://www.smoothoperatorsf.com" target="_blank">smoothoperatorsf.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendGmailRaw(accessToken, booking.clientEmail, subject, emailHtml);
}

/**
 * Google Contacts (People API) Client Interface representing individual connection profile
 */
export interface PersonContact {
  resourceName?: string;
  etag?: string;
  names?: Array<{
    displayName?: string;
    givenName?: string;
    familyName?: string;
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
  }>;
  organizations?: Array<{
    name?: string;
    title?: string;
    type?: string;
  }>;
  biographies?: Array<{
    value?: string;
  }>;
}

/**
 * Lists the logged-in Google user's connections (contacts list)
 */
export async function getGoogleConnections(
  accessToken: string
): Promise<PersonContact[]> {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?pageSize=200&personFields=names,emailAddresses,phoneNumbers,organizations,biographies',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Google Connections fetch error status ${res.status}:`, errorText);
    throw new Error(`Google Connections fetch error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return data.connections || [];
}

/**
 * Dynamically queries Google Contacts for matching terms (searches names/emails)
 */
export async function searchGoogleContacts(
  accessToken: string,
  queryText: string
): Promise<PersonContact[]> {
  if (!queryText.trim()) return [];
  const res = await fetch(
    `https://people.googleapis.com/v1/people:searchContacts?query=${encodeURIComponent(queryText)}&readMask=names,emailAddresses,phoneNumbers,organizations,biographies`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Google Contacts search error:`, errorText);
    throw new Error(`Google Contacts search failure: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  return data.results?.map((r: any) => r.person) || [];
}

/**
 * Creates a premium-configured, detailed Google Contact inside Drew's Google Account,
 * aligning with Drew's client-tracking ecosystem.
 */
export async function createGoogleContact(
  accessToken: string,
  contact: {
    givenName: string;
    familyName: string;
    email: string;
    phone: string;
    notes?: string;
    birthday?: string;
    address?: string;
  }
): Promise<PersonContact> {
  let birthdayObj: any = undefined;
  if (contact.birthday) {
    const parts = contact.birthday.split('-'); // YYYY-MM-DD
    if (parts.length === 3) {
      birthdayObj = {
        date: {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10),
          day: parseInt(parts[2], 10)
        }
      };
    }
  }

  // Auto pre-condition: Assign "waxing" label in Contact Notes
  const waxingNote = `Labels: waxing\n\n${contact.notes || ''}`.trim();

  const body: any = {
    names: [
      {
        givenName: contact.givenName,
        familyName: contact.familyName,
      },
    ],
    emailAddresses: [
      {
        value: contact.email,
        type: 'home',
      },
    ],
    phoneNumbers: [
      {
        value: contact.phone,
        type: 'mobile',
      },
    ],
    organizations: [
      {
        name: 'Smooth Operator SF',
        title: 'Studio Client',
        type: 'work',
      }
    ],
    biographies: [
      {
        value: waxingNote,
        contentType: 'TEXT_PLAIN'
      }
    ],
    addresses: contact.address ? [
      {
        streetAddress: contact.address,
        type: 'home'
      }
    ] : undefined,
    birthdays: birthdayObj ? [birthdayObj] : undefined,
  };

  const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Contact creation error: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Google Chat API Workspace Integration
 */

export interface GoogleChatSpace {
  name: string; // e.g., "spaces/AAAAMMMMM"
  displayName?: string;
  spaceType?: string; // "SPACE", "DIRECT_MESSAGE", etc.
  singleUserMention?: boolean;
}

export interface GoogleChatMessage {
  name: string;
  sender: {
    name: string;
    displayName: string;
    type: string;
  };
  createTime: string;
  text: string;
}

/**
 * Lists all Chat spaces the authenticated user has access to.
 */
export async function listGoogleChatSpaces(accessToken: string): Promise<GoogleChatSpace[]> {
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Google Chat list spaces error: ${res.status} - ${errorText}`);
    throw new Error(`Failed to list Google Chat spaces: ${res.status}`);
  }

  const data = await res.json();
  return data.spaces || [];
}

/**
 * Creates a new Google Chat Space.
 */
export async function createGoogleChatSpace(
  accessToken: string,
  displayName: string
): Promise<GoogleChatSpace> {
  const res = await fetch('https://chat.googleapis.com/v1/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spaceType: 'SPACE',
      displayName: displayName,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Google Chat create space error: ${res.status} - ${errorText}`);
    throw new Error(`Failed to create Google Chat space: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Sends a custom text message or card to a specific Google Chat space.
 */
export async function sendGoogleChatMessage(
  accessToken: string,
  spaceName: string,
  payload: { text?: string; cardsV2?: any[] }
): Promise<GoogleChatMessage> {
  const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Google Chat send message error: ${res.status} - ${errorText}`);
    throw new Error(`Failed to send Google Chat message: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Sends an automated, beautifully-styled appointment status card to Google Chat
 */
export async function sendBookingCardToChat(
  accessToken: string,
  spaceName: string,
  booking: Booking,
  actionTitle: string // e.g. "Appointment Approved" or "New Booking Proposed"
): Promise<GoogleChatMessage> {
  const formattedServices = booking.services.map(s => `• ${s.name} (${s.duration} mins, $${s.price})`).join('\n');
  const durationText = `${booking.totalDuration} minutes (includes hidden 15-min turnaround buffer)`;
  
  const textFallback = `✨ *${actionTitle}* \nClient: ${booking.clientName} (${booking.clientEmail})\nServices: \n${formattedServices}\nDuration: ${durationText}\nTotal: $${booking.totalPrice.toFixed(2)}`;

  // Google Chat CardV2 schema for high-fidelity interactive card notifications
  const cardsV2 = [
    {
      cardId: `booking_${booking.id || Date.now()}`,
      card: {
        header: {
          title: "Smooth Operator SF",
          subtitle: "Premium Studio Pulse Notification",
          imageUrl: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&q=80&w=120",
          imageType: "CIRCLE"
        },
        sections: [
          {
            header: actionTitle.toUpperCase(),
            collapsible: false,
            widgets: [
              {
                textParagraph: {
                  text: `<b>Client Name:</b> ${booking.clientName}<br>` +
                        `<b>Email:</b> ${booking.clientEmail}<br>` +
                        `<b>Phone:</b> ${booking.clientPhone || 'None'}<br>` +
                        `<b>Date & Time:</b> 📅 ${booking.date} at 🕒 ${booking.time}`
                }
              },
              {
                textParagraph: {
                  text: `<b>Services Selected:</b><br>${formattedServices.replace(/\n/g, '<br>')}`
                }
              },
              {
                textParagraph: {
                  text: `<b>Total Appointment Duration:</b> ${durationText}<br>` +
                        `<b>Total Price Hold:</b> 💳 $${booking.totalPrice.toFixed(2)}`
                }
              },
              {
                buttonList: {
                  buttons: [
                    {
                      text: "Launch Drew's Control Dashboard",
                      onClick: {
                        openLink: {
                          url: "https://www.smoothoperatorsf.com"
                        }
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    }
  ];

  return sendGoogleChatMessage(accessToken, spaceName, {
    text: textFallback,
    cardsV2: cardsV2
  });
}

/**
 * Find an existing client intake and safety consent Google Form in Drew's Google Drive
 */
export async function findIntakeForm(accessToken: string, masterFolderId?: string): Promise<{ id: string; url: string } | null> {
  const existingId = await findDriveItem(
    accessToken,
    "name = 'Smooth Operator SF - Client Intake & Consent Form' and mimeType = 'application/vnd.google-apps.form' and trashed = false"
  );
  if (!existingId) return null;

  if (masterFolderId) {
    await moveFileToFolder(accessToken, existingId, masterFolderId);
  }

  try {
    const res = await fetch(`https://forms.googleapis.com/v1/forms/${existingId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      return { id: existingId, url: data.responderUri || `https://docs.google.com/forms/d/${existingId}/viewform` };
    }
  } catch (err) {
    console.error('Failed to fetch intake form details:', err);
  }
  return { id: existingId, url: `https://docs.google.com/forms/d/${existingId}/viewform` };
}

/**
 * Creates and deploys a fully configured Google Form for Smooth Operator SF client intakes
 */
export async function deployIntakeForm(accessToken: string, masterFolderId?: string): Promise<{ id: string; url: string }> {
  // 1. Create top-level form resource
  const createRes = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: 'Smooth Operator SF - Client Intake & Consent Form',
        description: 'Welcome to Smooth Operator SF. Please complete this mandatory digital intake & consent form. All information remains strictly confidential, secure, and is used solely to verify skin safety and eligibility for waxing operations.'
      }
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Google Forms Creation Error: ${createRes.status} - ${errText}`);
  }

  const formData = await createRes.json();
  const formId = formData.formId;
  const responderUri = formData.responderUri || `https://docs.google.com/forms/d/${formId}/viewform`;

  // 2. Populate form questions with our secure multi-step gate protocol
  const batchRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          createItem: {
            item: {
              title: 'Full Name',
              questionItem: {
                question: {
                  required: true,
                  textQuestion: {}
                }
              }
            },
            location: { index: 0 }
          }
        },
        {
          createItem: {
            item: {
              title: 'Email Address',
              questionItem: {
                question: {
                  required: true,
                  textQuestion: {}
                }
              }
            },
            location: { index: 1 }
          }
        },
        {
          createItem: {
            item: {
              title: 'Are you 18 years of age or older?',
              description: 'Consent for intimate styling and brazilians requires the client to be an adult.',
              questionItem: {
                question: {
                  required: true,
                  choiceQuestion: {
                    type: 'RADIO',
                    options: [
                      { value: 'Yes, I am 18 or older' },
                      { value: 'No' }
                    ]
                  }
                }
              }
            },
            location: { index: 2 }
          }
        },
        {
          createItem: {
            item: {
              title: 'Are you currently using Accutane, Retin-A, or active retinols on the targeted areas?',
              description: 'Exfoliating skincare products make the epidermal layers thin, creating a high risk of skin-lifting during waxing. Accutane users must wait at least 6 months post-treatment.',
              questionItem: {
                question: {
                  required: true,
                  choiceQuestion: {
                    type: 'RADIO',
                    options: [
                      { value: 'No, I am not using Retinols or Accutane' },
                      { value: 'Yes, I currently use active retainers / retinols' },
                      { value: 'Yes, I currently take or recently finished Accutane' }
                    ]
                  }
                }
              }
            },
            location: { index: 3 }
          }
        },
        {
          createItem: {
            item: {
              title: 'Do you agree to maintain complete discretion and sign the Digital NDA confidentiality waiver?',
              description: 'Smooth Operator SF enforces a high-trust, safe, and private environment. Details of treatment, other clients, or studio banter must never be disclosed publicly or shared with third parties.',
              questionItem: {
                question: {
                  required: true,
                  choiceQuestion: {
                    type: 'RADIO',
                    options: [
                      { value: 'Yes, I agree to the Digital NDA and complete confidentiality' },
                      { value: 'No, I do not agree' }
                    ]
                  }
                }
              }
            },
            location: { index: 4 }
          }
        },
        {
          createItem: {
            item: {
              title: 'Do you accept the 24-hour Cancellation Policy?',
              description: 'Cancellations/no-shows within 24 hours of scheduled appointments incur a full charge. A credit card security hold is authorized strictly for cancellation protection.',
              questionItem: {
                question: {
                  required: true,
                  choiceQuestion: {
                    type: 'RADIO',
                    options: [
                      { value: 'Yes, I understand and agree to the cancellation policies' },
                      { value: 'No' }
                    ]
                  }
                }
              }
            },
            location: { index: 5 }
          }
        }
      ]
    }),
  });

  if (!batchRes.ok) {
    const errText = await batchRes.text();
    console.error('Failed to populate Google Form items with batchUpdate:', errText);
  }

  if (masterFolderId) {
    await moveFileToFolder(accessToken, formId, masterFolderId);
  }

  return { id: formId, url: responderUri };
}

export interface FormResponseDetail {
  responseId: string;
  createTime: string;
  clientName: string;
  clientEmail: string;
  answers: {
    questionTitle: string;
    answerValue: string;
  }[];
}

/**
 * Fetch and format recent submission responses from Drew's Google Intake Form
 */
export async function getIntakeFormResponses(accessToken: string, formId: string): Promise<FormResponseDetail[]> {
  // 1. Fetch form metadata to map question IDs to Human-readable titles
  const formRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const questionMap: { [key: string]: string } = {};
  if (formRes.ok) {
    const formData = await formRes.json();
    const items = formData.items || [];
    for (const item of items) {
      if (item.questionItem?.question?.questionId) {
        questionMap[item.questionItem.question.questionId] = item.title;
      }
    }
  }

  // 2. Fetch submissions
  const responsesRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!responsesRes.ok) {
    const errText = await responsesRes.text();
    console.error(`Failed to fetch Google Form responses: ${responsesRes.status} - ${errText}`);
    return [];
  }

  const resData = await responsesRes.json();
  const rawResponses = resData.responses || [];

  const formatted: FormResponseDetail[] = rawResponses.map((r: any) => {
    let clientName = 'Unknown Client';
    let clientEmail = 'Unknown Email';
    const answersList: { questionTitle: string; answerValue: string }[] = [];

    if (r.answers) {
      Object.entries(r.answers).forEach(([qId, ansObj]: [string, any]) => {
        const title = questionMap[qId] || 'Unknown Question';
        const rawAnswers = ansObj.textAnswers?.answers || [];
        const value = rawAnswers.map((a: any) => a.value).join(', ') || '';

        // Capture Name or Email targets
        if (title.toLowerCase().includes('name') || qId.toLowerCase().includes('name')) {
          clientName = value;
        } else if (title.toLowerCase().includes('email') || qId.toLowerCase().includes('email')) {
          clientEmail = value;
        }

        answersList.push({
          questionTitle: title,
          answerValue: value,
        });
      });
    }

    return {
      responseId: r.responseId,
      createTime: r.createTime,
      clientName,
      clientEmail,
      answers: answersList,
    };
  });

  // Sort by created time descending
  return formatted.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
}

